#!/usr/bin/env python3
"""Browser contract for a fully populated production configuration."""

import os
from playwright.sync_api import expect, sync_playwright


BASE_URL = os.environ.get("FACTORY_SITE_URL", "http://127.0.0.1:4175")


def expect_text(locator, expected, label):
    actual = (locator.text_content() or "").strip()
    assert actual == expected, f"{label}: expected {expected!r}, got {actual!r}"


def wait_for_app(page, root):
    errors = []
    # Keep the map link and iframe URL in the fixture without relying on
    # a live third-party frame for application error assertions.
    page.route("https://www.google.com/maps?**",
               lambda route: route.fulfill(status=200, content_type="text/html", body=""))
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_selector(root, state="visible", timeout=10_000)
    page.wait_for_function("!document.documentElement.classList.contains('br-booting')")
    page.wait_for_timeout(900)
    assert not errors, f"browser errors: {errors}"


def check_desktop(browser):
    page = browser.new_page(viewport={"width": 1366, "height": 900}, locale="ru-RU")
    wait_for_app(page, "#salon-desktop-v1")
    page.locator('[data-desktop-lang="ru"]').first.click()
    page.wait_for_timeout(150)
    expect_text(page.locator(".std-header-brand-main"), "Люмен", "desktop header text brand")
    assert page.locator(".std-header-brand-main img").count() == 0, "desktop header must not inject the client logo"
    assert page.locator("#stdHeroMedia").first.get_attribute("src") == "tests/fixtures/photo.svg", "desktop hero media is not applied"
    assert page.locator("#stdServiceList .dct-service-card").count() == 3
    assert not page.locator("#salonDesktopTeam").is_hidden()
    expect_text(page.locator("#salonDesktopTeam .std-team-subtitle"), "Команда салона", "desktop empty team state")
    assert page.locator("#salonDesktopTeam .std-master.is-placeholder").count() == 4, "desktop empty team must keep four visual master cards"
    assert page.locator("#salonDesktopPortfolio").is_hidden()
    expect_text(page.locator(".std-reviews-score strong"), "5,0", "desktop rating")
    expect_text(page.locator(".std-review-meta").first, "Google", "desktop review source")
    assert page.locator(".std-phone").get_attribute("href") == "tel:+37410555555"
    page.locator("#stdHeaderBookBtn").click()
    assert page.locator("#stdBookOverlay .std-book-options a").count() == 4
    assert page.locator("#stdBookOverlay .std-book-options a").first.get_attribute("href") == "tel:+37410555555"
    page.locator("#stdBookClose").click()
    assert page.locator(".std-address").inner_text().strip().startswith("Ереван")
    expect_text(page.locator('#salonDesktopContacts [data-contact-type="phone"] .std-contact-card-title'), "+374 10 555 555", "desktop phone title")
    expect_text(page.locator('#salonDesktopContacts [data-contact-type="phone"] .std-contact-card-sub'), "Позвонить", "desktop phone subtitle")
    expect_text(page.locator('#salonDesktopContacts [data-contact-type="messenger"] .std-contact-card-title'), "Telegram", "desktop messenger title")
    expect_text(page.locator('#salonDesktopContacts [data-contact-type="address"] .std-contact-card-sub'), "Открыть в Google Maps", "desktop map action")
    expect_text(page.locator("#stdServiceList .dct-service-card-title").first, "Стрижка", "desktop service in Russian")
    page.locator('[data-desktop-lang="en"]').first.click()
    page.wait_for_timeout(150)
    assert page.locator(".std-address").inner_text().strip().startswith("Yerevan")
    expect_text(page.locator("#stdServiceList .dct-service-card-title").first, "Haircut", "desktop service in English")
    page.evaluate("window.TANEM_SITE_DATA.contacts.phone=''")
    page.locator('[data-desktop-lang="ru"]').first.click()
    page.wait_for_timeout(150)
    assert page.locator('#salonDesktopContacts [data-contact-type="phone"]').is_hidden(), "desktop phone card must disappear without a phone"
    assert page.locator(".std-phone").is_hidden(), "desktop header phone must disappear without a phone"
    assert page.locator(".std-contact-call").is_hidden(), "desktop call action must disappear without a phone"
    assert "is-single" in (page.locator("#salonDesktopContacts .std-contact-actions").get_attribute("class") or ""), "desktop route must expand when phone is absent"
    page.close()


def check_desktop_long_brand(browser):
    context = browser.new_context(viewport={"width": 1024, "height": 768})
    page = context.new_page()
    wait_for_app(page, "#salon-desktop-v1")
    page.evaluate("window.TANEM_SITE_DATA.salon.name.ru='BAGDASARYAN STUDIO'")
    page.locator('[data-desktop-lang="en"]').first.click()
    page.locator('[data-desktop-lang="ru"]').first.click()
    page.wait_for_timeout(180)
    metrics = page.locator(".std-header").evaluate("""header => {
        const brand=header.querySelector('.std-header-brand-main');
        const nav=header.querySelector('.std-nav');
        const b=brand.getBoundingClientRect(), n=nav.getBoundingClientRect();
        return {text:brand.textContent.trim(),brandRight:b.right,navLeft:n.left,gap:n.left-b.right,
            font:parseFloat(getComputedStyle(brand).fontSize),scroll:brand.scrollWidth,client:brand.clientWidth};
    }""")
    assert metrics["text"] == "BAGDASARYAN STUDIO", f"runtime did not apply long desktop salon name: {metrics}"
    assert metrics["gap"] >= 12, f"long desktop salon name collides with centered navigation: {metrics}"
    assert metrics["font"] >= 18, f"desktop salon name became unreadably small: {metrics}"
    context.close()


def check_mobile(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, locale="ru-RU")
    page = context.new_page()
    wait_for_app(page, "#salon-mobile")
    page.locator('[data-lang="ru"]').click()
    page.wait_for_timeout(150)
    expect_text(page.locator(".tn22-title"), "Люмен", "mobile brand in Russian")
    assert "is-single-line" in (page.locator(".tn22-title").get_attribute("class") or ""), "one-word mobile name must reserve the two-line hero zone"
    top_logo = page.locator(".tn22-brand img")
    assert top_logo.count() == 1 and top_logo.first.get_attribute("src") == "tests/fixtures/logo.svg", "mobile top brand should use a real client logo"
    header_geometry = page.locator("#tn13Top .tn22-top").evaluate("""top => {
        const logo=top.querySelector('.tn22-brand img').getBoundingClientRect();
        const menu=top.querySelector('.tn22-menu').getBoundingClientRect();
        const topRect=top.getBoundingClientRect();
        return {
            logoLeft:logo.left-topRect.left,
            menuRight:topRect.right-menu.right,
            transform:getComputedStyle(top.querySelector('.tn22-brand img')).transform
        };
    }""")
    assert abs(header_geometry["logoLeft"]-20) <= 1.25, f"mobile logo left inset is wrong: {header_geometry}"
    assert abs(header_geometry["menuRight"]-20) <= 1.25, f"mobile menu right inset is wrong: {header_geometry}"
    assert header_geometry["transform"] == "none", f"mobile logo must not keep a legacy translate: {header_geometry}"
    page.evaluate("document.fonts && document.fonts.ready")
    page.evaluate("window.TANEM_SITE_DATA.salon.name.ru='ESMERALDA'")
    page.locator('[data-lang="en"]').click()
    page.locator('[data-lang="ru"]').click()
    page.wait_for_timeout(180)
    long_name_fit = page.locator(".tn22-title").evaluate("""el => ({
        client:el.clientWidth,scroll:el.scrollWidth,font:parseFloat(getComputedStyle(el).fontSize),text:el.textContent.trim()
    })""")
    assert long_name_fit["text"] == "ESMERALDA", f"runtime did not apply long test salon name: {long_name_fit}"
    assert long_name_fit["scroll"] <= long_name_fit["client"] + 1, f"long one-word mobile salon name overflows hero: {long_name_fit}"
    page.evaluate("window.TANEM_SITE_DATA.salon.name.ru='Люмен'")
    page.locator('[data-lang="en"]').click()
    page.locator('[data-lang="ru"]').click()
    page.wait_for_timeout(120)
    assert page.locator("#tn13Services .tn31-service-row").count() == 3
    assert not page.locator("#tn13Team").is_hidden()
    assert page.locator("#tn13Team .tn22-master-card.is-placeholder").count() == 4, "mobile empty team must keep four visual master cards"
    assert page.locator("#tn13Portfolio").is_hidden()
    assert page.locator("#tn13Reviews .br-review-card").count() >= 3
    expect_text(page.locator("#tn13Reviews .br-review-meta span").first, "Google", "mobile review source")
    page.locator(".tn22-cta").click()
    assert page.locator("#tn13BookSheet .tn50-book-option").count() == 4
    page.locator("#tn13BookClose").click()
    page.locator('[data-lang="en"]').click()
    page.wait_for_timeout(150)
    assert page.locator(".tn37-location .tn37-info-copy").inner_text().strip().startswith("Yerevan")
    expect_text(page.locator('#tn13Visit [data-contact-type="address"] strong'), "Yerevan, 12 Abovyan St", "mobile short address")
    expect_text(page.locator('#tn13Visit [data-contact-type="address"] strong+span'), "Open in Google Maps", "mobile map action")
    expect_text(page.locator("#tn13Services .tn31-service-name").first, "Haircut", "mobile service in English")
    page.evaluate("window.TANEM_SITE_DATA.contacts.phone=''")
    page.locator('[data-lang="ru"]').click()
    page.wait_for_timeout(150)
    assert page.locator('#tn13Visit [data-contact-type="phone"]').is_hidden(), "mobile phone card must disappear without a phone"
    assert page.locator(".tn22-call").is_hidden(), "mobile call action must disappear without a phone"
    assert "is-single" in (page.locator(".tn22-visit-actions").get_attribute("class") or ""), "mobile route must expand when phone is absent"
    context.close()


def check_wide_touch(browser):
    context = browser.new_context(viewport={"width": 1180, "height": 820}, is_mobile=True, has_touch=True)
    page = context.new_page()
    wait_for_app(page, "#salon-desktop-v1")
    assert page.locator("#salon-mobile").count() == 0
    context.close()


def check_eva_components(browser, mobile, width):
    context = browser.new_context(viewport={"width": width, "height": 900},
                                  is_mobile=mobile, has_touch=mobile, locale="ru-RU")
    page = context.new_page()
    # Use qualified relations. Other services in the same category must not
    # leak into the specialist's price list or portfolio.
    extra = """
    (() => {
      const s=window.TANEM_SITE_DATA;
      const t=value=>({ru:value,en:value,hy:value});
      const photos=Array.from({length:30},(_,i)=>({
        src:'tests/fixtures/photo.svg?item='+i,alt:t('Работа '+(i+1))
      }));
      s.media.gallery={'Салон':photos.slice(0,4),'Волосы':photos.slice(4)};
      s.media.portfolio=photos.slice(0,11);
      s.services[2].variantType='length';
      const linked=Array.from({length:6},(_,i)=>({
        ...s.services[0],id:'linked-'+i,title:t('Подтверждённая процедура '+(i+1))
      }));
      s.services.push(...linked);
      s.team=[{
        id:'test-specialist',name:t('Нина'),role:t('Парикмахер'),about:t('Работает со стрижками.'),
        photo:'tests/fixtures/photo.svg',categories:['Волосы'],
        serviceIds:['care',...linked.map(service=>service.id)],work:photos.slice(4,15),
        reviewIds:['review-anna']
      }];
    })();
    """

    def provide_linked_fixture(route):
        response = route.fetch()
        route.fulfill(response=response, body=response.text() + extra)

    page.route("**/site-data.js?*", provide_linked_fixture)
    root = "#salon-mobile" if mobile else "#salon-desktop-v1"
    wait_for_app(page, root)
    ru = '[data-lang="ru"]' if mobile else '[data-desktop-lang="ru"]'
    en = '[data-lang="en"]' if mobile else '[data-desktop-lang="en"]'
    page.locator(ru).first.click()
    service_list = "#tn13Services" if mobile else "#stdServiceList"
    option = page.locator(f'{service_list} [data-tanem-service-id="care"] summary')
    expect(option.locator(".tanem-options-label")).to_have_text("Стоимость по длине +")
    option.click()
    assert option.get_attribute("aria-expanded") == "true"
    expect_text(page.locator(f'{service_list} .tanem-variant-duration').first, "45 мин", "variant duration")
    booking = "#tn13BookSheet" if mobile else "#stdBookOverlay"
    assert page.locator(booking + ".open").count() == 0
    page.locator(en).first.click()
    expect(option.locator(".tanem-options-label")).to_have_text("Prices by hair length −")
    assert option.get_attribute("aria-expanded") == "true"
    option.click()
    assert option.get_attribute("aria-expanded") == "false"
    page.locator(ru).first.click()
    preview = "#tn13Portfolio .tn22-photo" if mobile else "#salonDesktopPortfolio .std-work"
    assert page.locator(preview).count() == 7
    page.locator('[data-mid="test-specialist"]' if mobile else '[data-desktop-master="test-specialist"]').click()
    profile = ".tn22-master-page.open" if mobile else "#stdMasterOverlay.open"
    panel = page.locator(profile)
    panel.locator(".tanem-master-head h2").wait_for()
    assert panel.locator(".tanem-master-price-list .tanem-service-card:visible").count() == 6
    panel.locator("[data-master-expand]").click()
    assert panel.locator(".tanem-master-price-list .tanem-service-card:visible").count() == 7
    assert panel.locator('[data-tanem-service-id="haircut"]').count() == 0
    assert panel.locator(".tanem-master-review").count() == 1
    assert panel.locator("[data-master-work]").count() == (11 if mobile else 9)
    panel.locator(".tanem-service-book").first.click()
    page.locator(booking + ".open").wait_for()
    page.locator("#tn13BookClose" if mobile else "#stdBookClose").click()
    assert panel.count() == 1
    panel.locator("[data-master-gallery]").click()
    gallery = "#tn13Gallery.open" if mobile else "#stdGalleryBrowser.open"
    items = "[data-gi]" if mobile else "[data-gallery-item]"
    category = '[data-gcat="Волосы"]' if mobile else '[data-gallery-category="Волосы"]'
    gallery_panel = page.locator(gallery)
    gallery_panel.wait_for()
    assert gallery_panel.locator(category).is_visible()
    assert gallery_panel.locator(items).count() == 26
    gallery_panel.locator(".tn22-gallery-back" if mobile else "#stdGalleryBrowserBack").click()
    assert panel.count() == 1
    panel.locator(".tn22-back" if mobile else "#stdMasterPageClose").click()
    panel.wait_for(state="detached")
    context.close()


def main():
    with sync_playwright() as playwright:
        engine = os.environ.get("FACTORY_BROWSER", "chromium")
        executable = os.environ.get("FACTORY_BROWSER_EXECUTABLE")
        launch_options = {"executable_path": executable, "args": ["--disable-gpu"]} if executable else {}
        browser = getattr(playwright, engine).launch(**launch_options)
        try:
            check_desktop(browser)
            check_desktop_long_brand(browser)
            check_mobile(browser)
            check_wide_touch(browser)
            check_eva_components(browser, False, 1366)
            check_eva_components(browser, True, 390)
            check_eva_components(browser, True, 430)
        finally:
            browser.close()
    print("PASS: production data hydrates desktop, mobile, translations, booking, and wide touch")


if __name__ == "__main__":
    main()
