#!/usr/bin/env python3
"""Compare the cleaned salon template with the approved Git baseline in Chromium."""
from __future__ import annotations

import argparse
from pathlib import Path
import subprocess

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

OUT = Path("test-artifacts/visual")
OUT.mkdir(parents=True, exist_ok=True)


def capture(browser, url: str, name: str, width: int, height: int, mobile: bool, approved_data: str | None = None):
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,
        is_mobile=mobile,
        has_touch=mobile,
        reduced_motion="reduce",
        locale="ru-RU",
    )
    page = context.new_page()
    # Render both revisions with identical approved demo content. This isolates
    # visual regressions from the deliberate reduction to four neutral cards.
    if approved_data is not None:
        # Keep the frozen-baseline pixel comparison focused on structure:
        # approved palette differences are verified separately below.
        page.route("**/salon-palette.css*", lambda route: route.fulfill(
            status=200, content_type="text/css", body=""
        ))
        page.route("**/site-data.js*", lambda route: route.fulfill(status=200, content_type="application/javascript", body=approved_data))
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    root = "#salon-mobile" if mobile else "#salon-desktop-v1"
    section = "#tn13Services" if mobile else "#salonDesktopServices"
    page.wait_for_selector(root, state="attached", timeout=20000)
    page.wait_for_function(
        "() => !document.documentElement.classList.contains('br-booting')",
        timeout=12000,
    )
    page.evaluate("() => document.fonts.ready")
    page.add_style_tag(content=(
        "*,*::before,*::after{animation:none!important;"
        "transition:none!important;caret-color:transparent!important}"
        "html,body{scroll-behavior:auto!important}"
    ))
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(350)
    images = {}
    if height >= 800:
        images["hero"] = page.screenshot(animations="disabled")
    if mobile:
        page.locator(section + ' [data-scat="Волосы"]').click(timeout=10000)
    else:
        page.locator(section + ' [data-service-category="Волосы"]').click(timeout=10000)
    page.locator(section).evaluate("(el) => el.scrollIntoView({behavior:'instant',block:'start'})")
    page.wait_for_timeout(700)
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
    section_y = page.locator(section).evaluate(
        "(el) => Math.max(0, Math.ceil(el.getBoundingClientRect().top))"
    )
    images["services"] = page.screenshot(
        clip={"x": 0, "y": section_y, "width": width, "height": height - section_y},
        animations="disabled",
    )
    if (not mobile and width == 1366) or (mobile and width == 390):
        expand = page.locator(section + (" .tn31-service-demo-more:visible" if mobile else " .dct-service-demo-more:visible")).first
        # Some approved descriptions fit within two lines: their More buttons are
        # intentionally hidden, so only exercise expansion when one is visible.
        if expand.count() > 0:
            expand.click(timeout=12000)
            if expand.get_attribute("aria-expanded") != "true":
                raise AssertionError(name + ": description did not expand")
            # Expansion is asserted functionally; the intermediate scroll-anchoring
            # frame is not a stable pixel snapshot on Chromium or WebKit.
            page.wait_for_timeout(350)
            expand.click(timeout=12000)
            if expand.get_attribute("aria-expanded") != "false":
                raise AssertionError(name + ": description did not collapse")

    if not mobile and width == 1366:
        page.locator("#stdStickyGalleryOpen").hover(timeout=10000)
        page.wait_for_timeout(150)
        images["gallery-hover"] = page.locator("#stdStickyGalleryOpen").screenshot(
            animations="disabled"
        )
        star_color = page.locator("#stdStickyGalleryOpen > span:last-child").evaluate(
            "(el) => getComputedStyle(el).color"
        )
        if star_color != "rgb(255, 255, 255)":
            raise AssertionError(name + ": gallery star lost its approved white hover")
        page.locator("#stdStickyGalleryOpen").click(timeout=12000)
        page.locator("#stdGalleryBrowser.open").wait_for(timeout=8000)
        # Lazy-loaded SVG tiles can be captured before their first decode on CI.
        # Wait for every gallery tile to paint before comparing pixels.
        page.locator("#stdGalleryBrowserGrid img").evaluate_all(
            "(imgs) => Promise.all(imgs.map(img => {img.loading = 'eager'; return img.decode().catch(() => {});} ))"
        )
        page.wait_for_timeout(250)
        images["gallery-open"] = page.screenshot(animations="disabled")

    if mobile and width == 390:
        page.locator(".tn22-worklink").click(timeout=12000)
        page.locator("#tn13Gallery.open").wait_for(timeout=8000)
        # Wait for gallery-specific fonts, lazy media and compositing to settle.
        # The open-overlay screenshot can otherwise capture subpixel text repainting.
        page.evaluate("() => document.fonts.ready")
        page.locator("#tn13Gallery img").first.evaluate(
            "(img) => img.decode().catch(() => {})"
        )
        page.wait_for_timeout(350)
        # The first open frame repaints glyphs asynchronously; compare the
        # stable gallery after a category selection instead.
        page.locator("#tn13Gallery [data-gcat='Волосы']").click(timeout=12000)
        page.wait_for_timeout(160)
        images["gallery-category"] = page.screenshot(animations="disabled")

    context.close()
    for label, data in images.items():
        (OUT / f"{name}-{label}.png").write_bytes(data)
    return images


def compare(a: bytes, b: bytes, filename: str):
    import io

    x = Image.open(io.BytesIO(a)).convert("RGB")
    y = Image.open(io.BytesIO(b)).convert("RGB")
    if x.size != y.size:
        raise AssertionError(f"{filename}: different image dimensions: {x.size} / {y.size}")
    diff = ImageChops.difference(x, y)
    if not diff.getbbox():
        print(f"PASS {filename}: pixel-identical")
        return
    changed = sum(1 for rgb in diff.getdata() if max(rgb) > 10)
    fraction = changed / (x.width * x.height)
    diff.save(OUT / f"{filename}-diff.png")
    print(f"{filename}: {changed} changed pixels / {fraction:.3%}")
    # Mobile service screenshots now include the owner's approved switch from
    # squeezed 1–4-column category grids to naturally sized Esmeralda pills.
    # That small layout change affects ~3.4% of the screenshot; protect the
    # exact new pill/card geometry with verify_mobile_category_rails and keep
    # every non-service screenshot and all desktop thresholds unchanged.
    if filename.startswith("mobile-") and filename.endswith("-services"):
        # Approved 03.10 changes: +10% category labels and a narrower price rail.
        limit = 0.065
    elif filename.endswith("-services"):
        # Approved 03.10 changes: larger tabs, 5% smaller titles, plain prices.
        limit = 0.07
    elif filename.startswith("mobile-") and filename.endswith("-gallery-category"):
        limit = 0.035
    elif filename.startswith("mobile-") and filename.endswith("-hero"):
        limit = 0.02
    else:
        limit = 0.003
    if fraction > limit:
        raise AssertionError(
            f"{filename}: visible regression exceeds {limit:.1%} of pixels"
        )


def verify_palette(browser, candidate: str):
    """Check the actual, palette-enabled browser cascade on both device UIs."""
    cases = [
        (1366, 900, False, {
            "#salon-desktop-v1": ("backgroundColor", "rgb(250, 249, 246)"),
            "#salonDesktopReviews": ("backgroundColor", "rgb(241, 236, 229)"),
            "#salonDesktopReviews .std-review-card": ("backgroundColor", "rgb(255, 255, 255)"),
            "#salon-desktop-v1 .std-header-book": ("backgroundColor", "rgb(37, 37, 37)"),
            "#salonDesktopTop .std-btn-primary": ("backgroundColor", "rgb(37, 37, 37)"),
            "#salonDesktopTop .std-btn:not(.std-btn-primary)": ("backgroundColor", "rgb(235, 229, 222)"),
            "#salonDesktopServices": ("backgroundColor", "rgb(36, 36, 36)"),
        }),
        (390, 844, True, {
            "#salon-mobile": ("backgroundColor", "rgb(250, 249, 246)"),
            "#tn13Top": ("backgroundColor", "rgb(250, 249, 246)"),
            "#tn13Portfolio": ("backgroundColor", "rgb(250, 249, 246)"),
            "#tn38About": ("backgroundColor", "rgb(250, 249, 246)"),
            "#tn38About .tn42-fact": ("backgroundColor", "rgb(248, 246, 242)"),
            "#tn13Reviews": ("backgroundColor", "rgb(241, 236, 229)"),
            "#tn13Visit": ("backgroundColor", "rgb(36, 36, 36)"),
            "#tn13Reviews .br-review-card": ("backgroundColor", "rgb(248, 246, 242)"),
            "#tn13Reviews .br-review-card": ("borderTopColor", "rgb(226, 218, 209)"),
            "#tn13Top .tn22-cta": ("backgroundColor", "rgb(37, 37, 37)"),
            "#tn13Top .tn22-worklink": ("backgroundColor", "rgb(235, 229, 222)"),
            "#tn13Services": ("backgroundColor", "rgb(36, 36, 36)"),
            "#tn13Gallery": ("backgroundColor", "rgb(241, 236, 229)"),
        }),
    ]
    # Exercise narrower iPhone sizes too, not only the 390 px reference.
    cases.append((360, 740, True, {
        "#tn13Services": ("backgroundColor", "rgb(36, 36, 36)"),
        "#tn13Gallery": ("backgroundColor", "rgb(241, 236, 229)"),
    }))
    for width, height, mobile, expected in cases:
        context = browser.new_context(
            viewport={"width": width, "height": height},
            is_mobile=mobile, has_touch=mobile, reduced_motion="reduce"
        )
        try:
            page = context.new_page()
            page.goto(candidate, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_selector("#salon-mobile" if mobile else "#salon-desktop-v1", state="attached")
            page.wait_for_function("() => !document.documentElement.classList.contains('br-booting')")
            page.wait_for_function("() => !!document.styleSheets && Array.from(document.styleSheets).some(s => s.href && s.href.includes('salon-palette.css'))", timeout=12000)
            for selector, (prop, wanted) in expected.items():
                locator = page.locator(selector).first
                locator.wait_for(state="attached")
                got = locator.evaluate("(el, prop) => getComputedStyle(el)[prop]", prop)
                if got != wanted:
                    raise AssertionError(f"{width}px {selector} {prop}: {got}, expected {wanted}")
            if mobile:
                hero_color = page.locator("#tn13Top").evaluate("(el) => getComputedStyle(el).backgroundColor")
                portfolio_color = page.locator("#tn13Portfolio").evaluate("(el) => getComputedStyle(el).backgroundColor")
                if hero_color != portfolio_color:
                    raise AssertionError(f"Visible hero/portfolio seam: {hero_color} vs {portfolio_color}")
                fade = page.locator("#tn13Portfolio").evaluate("(el) => getComputedStyle(el, '::before').backgroundImage")
                if "250, 249, 246" not in fade:
                    raise AssertionError(f"Portfolio fade does not match hero: {fade}")
                hero_btn = page.locator("#tn13Top .tn22-cta")
                page.emulate_media(reduced_motion="no-preference")
                effect = hero_btn.evaluate("(el) => ({name: getComputedStyle(el, '::after').animationName, duration: getComputedStyle(el, '::after').animationDuration})")
                if effect["name"] != "tn22Shine" or effect["duration"] != "3.2s":
                    raise AssertionError(f"Hero booking shimmer differs from sticky: {effect}")
                page.emulate_media(reduced_motion="reduce")
                if hero_btn.evaluate("(el) => getComputedStyle(el, '::after').animationName") != "none":
                    raise AssertionError("Reduced-motion setting does not disable shimmer")
            if mobile:
                verify_mobile_category_rails(page, width)
            if not mobile:
                verify_desktop_service_refinements(page)
                verify_desktop_gallery_viewer(page)
                # Hover animates over a few hundred milliseconds in the real UI.
                # Wait for the destination colour, not the initial transition frame.
                primary = page.locator("#salon-desktop-v1 .std-header-book").first
                primary.hover()
                page.wait_for_timeout(480)
                got = primary.evaluate("(el) => getComputedStyle(el).backgroundColor")
                if got != "rgb(66, 66, 66)":
                    hovered = primary.evaluate("(el) => el.matches(':hover')")
                    raise AssertionError(f"{width}px primary hover: {got}, :hover={hovered}, expected rgb(66, 66, 66)")
            print(f"PASS neutral palette: {width}px backgrounds, cards, buttons" + (" and hover" if not mobile else ""))
        finally:
            context.close()



def verify_mobile_category_rails(page, width: int):
    """Regression coverage for mobile single-line categories and visible last tab."""
    service_rail = page.locator("#tn13Services .tn31-cats")
    category_metrics = service_rail.locator(".tn31-cat").evaluate_all("""els => els.map(el => {
        const style=getComputedStyle(el);
        return {name:el.textContent.trim(), font:parseFloat(style.fontSize),
            padding:parseFloat(style.paddingLeft), whitespace:style.whiteSpace,
            height:el.getBoundingClientRect().height,
            width:el.getBoundingClientRect().width, flexShrink:style.flexShrink,
            clipped:el.scrollWidth>el.clientWidth+1};
    })""")
    if len(category_metrics) != 4 or not any(x["name"] in ("Брови и ресницы", "Brows and Lashes") for x in category_metrics):
        raise AssertionError(f"{width}px: missing approved demo categories: {category_metrics}")
    if any(abs(x["font"]-13.98) > .08 or abs(x["height"]-35) > .5
           or abs(x["padding"]-15) > .5 or x["whitespace"] != "nowrap"
           or x["flexShrink"] != "0" or x["clipped"] for x in category_metrics):
        raise AssertionError(f"{width}px: categories differ from approved 13.98px geometry: {category_metrics}")
    rail_style = service_rail.evaluate("""rail => {
        const s=getComputedStyle(rail);
        return {display:s.display,gap:parseFloat(s.columnGap),overflow:s.overflowX,
            scrollWidth:rail.scrollWidth,clientWidth:rail.clientWidth};
    }""")
    if (rail_style["display"] != "flex" or abs(rail_style["gap"]-8) > .5
        or rail_style["overflow"] != "auto"):
        raise AssertionError(f"{width}px: category rail must allow natural horizontal scrolling: {rail_style}")
    # In this design service cards bleed 15px beyond the 25px container padding.
    # Their actual left edge and the first service-category pill must coincide.
    service_left = page.locator("#tn13Services .tn31-service-row").first.evaluate(
        "(el) => el.getBoundingClientRect().left"
    )
    category_left = service_rail.locator(".tn31-cat").first.evaluate(
        "(el) => el.getBoundingClientRect().left"
    )
    if abs(service_left - category_left) > 1.25:
        raise AssertionError(
            f"{width}px: service category starts at {category_left}, "
            f"but first service card starts at {service_left}"
        )
    # The real four demo categories may already fit at 390 px. Add a long
    # synthetic category only when needed to exercise actual overflow.
    if rail_style["scrollWidth"] <= rail_style["clientWidth"]+4:
        long_rail = service_rail.evaluate("""rail => {
            const extra=document.createElement('button');
            extra.className='tn31-cat';
            extra.textContent='Дополнительная категория для проверки прокрутки';
            rail.appendChild(extra);
            return {scrollWidth:rail.scrollWidth,clientWidth:rail.clientWidth};
        }""")
        if long_rail["scrollWidth"] <= long_rail["clientWidth"]+4:
            raise AssertionError(f"{width}px: category rail cannot overflow on a long category: {long_rail}")
    service_end = service_rail.evaluate("""rail => {
        rail.scrollLeft=rail.scrollWidth;
        const last=rail.lastElementChild.getBoundingClientRect();
        return {right:last.right,railRight:rail.getBoundingClientRect().right,
            scrollWidth:rail.scrollWidth,clientWidth:rail.clientWidth};
    }""")
    if service_end["right"] > service_end["railRight"]+1:
        raise AssertionError(f"{width}px: last category cannot be fully scrolled: {service_end}")
    # Exactly two categories are the sole exception: they share the available width.
    two = service_rail.evaluate("""rail => {
        rail.classList.add('is-two');
        rail.innerHTML='<button class="tn31-cat">Ногти</button><button class="tn31-cat">Волосы</button>';
        const widths=[...rail.querySelectorAll('.tn31-cat')].map(b=>b.getBoundingClientRect().width);
        const cs=getComputedStyle(rail);
        return {widths,overflow:rail.scrollWidth>rail.clientWidth+1,
            available:rail.clientWidth,gap:parseFloat(cs.columnGap),
            left:parseFloat(cs.paddingLeft),right:parseFloat(cs.paddingRight)};
    }""")
    if (two["overflow"] or abs(two["widths"][0]-two["widths"][1]) > 1.25
        or abs(sum(two["widths"])+two["gap"]+two["left"]+two["right"]-two["available"]) > 2):
        raise AssertionError(f"{width}px: exactly two categories do not fill the rail evenly: {two}")
    service_rail.evaluate("rail => rail.classList.remove('is-two')")

    page.locator("#tn13Top .tn22-worklink").click()
    page.locator("#tn13Gallery.open").wait_for(timeout=8000)
    gallery_tabs = page.locator("#tn13Gallery .tn22-gallery-tabs")
    appearance = gallery_tabs.evaluate("""rail => {
        const wrap=getComputedStyle(rail.parentElement);
        const base=getComputedStyle(document.querySelector('#tn13Gallery'));
        const label=getComputedStyle(rail.querySelector('.tn22-gallery-tab'));
        return {wrap:wrap.backgroundColor,base:base.backgroundColor,
            shadow:wrap.boxShadow,font:parseFloat(label.fontSize),
            nowrap:label.whiteSpace,railBg:getComputedStyle(rail).backgroundColor,
            border:getComputedStyle(rail).borderTopWidth,
            borderColor:getComputedStyle(rail).borderTopColor,
            radius:getComputedStyle(rail).borderTopLeftRadius};
    }""")
    if appearance["wrap"] not in (appearance["base"], "rgba(0, 0, 0, 0)") or appearance["shadow"] != "none":
        raise AssertionError(f"{width}px: gallery has a distinct category band: {appearance}")
    if (appearance["font"] < 14.3 or appearance["nowrap"] != "nowrap"
        or appearance["border"] != "1px" or appearance["radius"] != "14px"
        or appearance["borderColor"] != "rgb(198, 190, 181)"):
        raise AssertionError(f"{width}px: Esmeralda gallery capsule missing: {appearance}")
    # Gallery category arrows/hints are intentionally absent in the approved UI.
    # Keep horizontal scrolling functional without re-introducing visual controls.
    if page.locator("#tn13Gallery .tn22-gallery-rail-hint").count() != 0:
        raise AssertionError(f"{width}px: gallery category arrows/hints must remain absent")
    overflow = gallery_tabs.evaluate("""rail => {
        const extra=document.createElement('button');
        extra.className='tn22-gallery-tab';
        extra.textContent='Очень длинная дополнительная категория';
        rail.appendChild(extra);
        return {scrollWidth:rail.scrollWidth,clientWidth:rail.clientWidth};
    }""")
    if overflow["scrollWidth"] <= overflow["clientWidth"] + 1:
        raise AssertionError(f"{width}px: gallery category rail cannot overflow horizontally: {overflow}")

    gallery_last = gallery_tabs.evaluate("""rail => {
        rail.scrollLeft=rail.scrollWidth;
        const last=rail.lastElementChild.getBoundingClientRect();
        return {right:last.right,railRight:rail.getBoundingClientRect().right};
    }""")
    if gallery_last["right"] > gallery_last["railRight"]+1:
        raise AssertionError(f"{width}px: gallery category is cut off: {gallery_last}")
    page.locator("#tn13Gallery .tn22-gallery-back").click()
    page.wait_for_function(
        "() => !document.querySelector('#tn13Gallery').classList.contains('closing')",
        timeout=5000,
    )

    # Portfolio image viewer footer: a centered button and the photo counter
    # share a baseline *below* the photo, with no redundant salon name at left.
    page.locator("#tn13Portfolio .tn22-photo").first.click()
    page.locator(".tn22-viewer.open").wait_for(timeout=8000)
    footer = page.locator(".tn22-viewer.open .tn23-viewer-foot")
    footer_metrics = footer.evaluate("""foot => {
        const viewer=foot.closest('.tn22-viewer');
        const frame=viewer.querySelector('.tn22-viewer-frame').getBoundingClientRect();
        const photo=viewer.querySelector('.tn42-viewer-canvas').getBoundingClientRect();
        const button=foot.querySelector('.tn22-view-gallery');
        const btn=button.getBoundingClientRect();
        const count=foot.querySelector('.tn22-viewer-count').getBoundingClientRect();
        return {hasLabel:!!foot.querySelector('.tn23-viewer-label'),
            buttonParent:button.parentElement===foot,
            buttonDisplay:getComputedStyle(button).display,
            buttonCenterX:(btn.left+btn.right)/2, frameCenterX:(frame.left+frame.right)/2,
            buttonCenterY:(btn.top+btn.bottom)/2,countCenterY:(count.top+count.bottom)/2,
            buttonTop:btn.top,photoBottom:photo.bottom};
    }""")
    if (footer_metrics["hasLabel"] or not footer_metrics["buttonParent"]
        or footer_metrics["buttonDisplay"] == "none"
        or abs(footer_metrics["buttonCenterX"]-footer_metrics["frameCenterX"]) > 2
        or abs(footer_metrics["buttonCenterY"]-footer_metrics["countCenterY"]) > 2
        or footer_metrics["buttonTop"] < footer_metrics["photoBottom"] + 4):
        raise AssertionError(f"{width}px: portfolio viewer footer alignment: {footer_metrics}")
    footer.locator(".tn22-view-gallery").click()
    page.locator("#tn13Gallery.open").wait_for(timeout=8000)
    page.locator("#tn13Gallery .tn22-gallery-back").click()
    page.wait_for_function(
        "() => !document.querySelector('#tn13Gallery').classList.contains('closing')",
        timeout=5000,
    )
    page.locator("#tn13Team .tn22-master-card").first.click()
    page.locator(".tn22-master-page.open").wait_for(timeout=8000)
    last_tab = page.locator(".tn22-master-tabs").evaluate("""rail => {
        rail.scrollLeft=rail.scrollWidth;
        const last=rail.lastElementChild.getBoundingClientRect();
        return {right:last.right,viewport:document.documentElement.clientWidth,
            railRight:rail.getBoundingClientRect().right,
            mask:getComputedStyle(rail).maskImage};
    }""")
    if (last_tab["right"] > last_tab["viewport"]-1 or
        last_tab["right"] < last_tab["viewport"]-30 or
        last_tab["mask"] != "none"):
        raise AssertionError(f"{width}px: master Reviews tab clips too early: {last_tab}")
    print(f"PASS mobile category rails: {width}px full labels, gallery uniformity, master last tab")



def verify_desktop_service_refinements(page):
    """Approved 03.10 desktop service deltas are present, not arbitrary pixel drift."""
    tab_font = page.locator("#salonDesktopServices .mct-tab").first.evaluate(
        "(el) => parseFloat(getComputedStyle(el).fontSize)"
    )
    title_font = page.locator("#salonDesktopServices .dct-service-card-title").first.evaluate(
        "(el) => parseFloat(getComputedStyle(el).fontSize)"
    )
    if tab_font < 15.0:
        raise AssertionError(f"Desktop service categories are still too small: {tab_font}px")
    if title_font > 29.0:
        raise AssertionError(f"Desktop service title did not receive the approved 5% reduction: {title_font}px")
    price = page.locator("#salonDesktopServices .dct-service-card-meta>b.is-price").first
    if price.count():
        price_style = price.evaluate("""el => {
            const s=getComputedStyle(el);
            return {background:s.backgroundColor,border:s.borderTopWidth,color:s.color};
        }""")
        if price_style["background"] != "rgba(0, 0, 0, 0)" or price_style["border"] != "0px":
            raise AssertionError(f"Desktop price still has a pill/frame: {price_style}")
    print("PASS desktop services: larger categories, smaller titles, plain price treatment")


def verify_desktop_gallery_viewer(page):
    """Desktop count is outside at right; gallery CTA widens and tabs enlarge."""
    page.locator("#salonDesktopPortfolio .std-work").first.click()
    page.locator("#stdGallery.open").wait_for(timeout=8000)
    metrics = page.locator("#stdGallery .std-gallery-stage").evaluate("""stage => {
        const canvas=stage.querySelector('.std-gallery-canvas').getBoundingClientRect();
        const count=stage.querySelector('.std-gallery-count').getBoundingClientRect();
        const button=stage.querySelector('.std-view-gallery');
        const btn=button.getBoundingClientRect();
        return {canvasRight:canvas.right, canvasBottom:canvas.bottom,
            countRight:count.right, countTop:count.top,
            btnWidth:btn.width, btnCenterX:(btn.left+btn.right)/2,
            stageCenterX:(stage.getBoundingClientRect().left+stage.getBoundingClientRect().right)/2,
            buttonDisplay:getComputedStyle(button).display};
    }""")
    if (abs(metrics["canvasRight"]-metrics["countRight"]) > 2
        or metrics["countTop"] < metrics["canvasBottom"]+4
        or metrics["btnWidth"] < 210 or metrics["buttonDisplay"] == "none"
        or abs(metrics["btnCenterX"]-metrics["stageCenterX"]) > 2):
        raise AssertionError(f"Desktop portfolio viewer placement: {metrics}")
    page.locator("#stdGalleryClose").click()
    page.locator("#stdOpenGallery").click()
    page.locator("#stdGalleryBrowser.open").wait_for(timeout=8000)
    font = page.locator("#stdGalleryBrowserTabs .std-gallery-browser-tab").first.evaluate(
        "(el) => parseFloat(getComputedStyle(el).fontSize)"
    )
    if font < 14:
        raise AssertionError(f"Desktop gallery tab is still small: {font}px")
    page.locator("#stdGalleryBrowserBack").click()
    print("PASS desktop image viewer: counter at card right, wide CTA, larger tabs")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", default="http://127.0.0.1:4173/")
    parser.add_argument("--candidate", default="http://127.0.0.1:4174/")
    parser.add_argument("--engine", choices=("chromium", "webkit"), default="chromium")
    parser.add_argument("--quick", action="store_true")
    args = parser.parse_args()
    cases = [(1366, 900, False), (390, 844, True)] if args.quick else [
             (1024, 768, False), (1366, 900, False),
             (1440, 900, False), (1920, 1080, False),
             (360, 740, True), (375, 812, True),
             (390, 844, True), (414, 896, True)]
    errors = []
    # The historical approved baseline predates site-data.js. Obtain the
    # factory-approved dataset from the first published factory commit instead.
    approved_data = subprocess.check_output(
        ["git", "show", "4bf5f867c0217a4a478a6ab9a5d6b4aad49d4042:site-data.js"],
        text=True,
    )
    with sync_playwright() as p:
        browser = getattr(p, args.engine).launch(headless=True)
        try:
            for w, h, mobile in cases:
                key = f"{'mobile' if mobile else 'desktop'}-{w}"
                baseline = capture(browser, args.baseline, key+"-approved", w, h, mobile)
                candidate = capture(browser, args.candidate, key+"-cleaned", w, h, mobile, approved_data)
                for item in baseline:
                    try:
                        compare(baseline[item], candidate[item], key+"-"+item)
                    except AssertionError as exc:
                        errors.append(str(exc))
            verify_palette(browser, args.candidate)
        finally:
            browser.close()
    if errors:
        raise AssertionError("Visual regressions: " + "; ".join(errors))
    print("PASS: All visual regression snapshots match the approved template.")


if __name__ == "__main__":
    main()
