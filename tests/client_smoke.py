#!/usr/bin/env python3
"""Smoke-test a *real* production site (not the Lumen test fixture) in Chromium or WebKit."""
import argparse
import os
import re

from playwright.sync_api import sync_playwright

HOST = os.environ.get("CLIENT_SITE_URL", "http://127.0.0.1:4176")


def must_equal(locator, expected, label):
    actual = (locator.first.text_content() or "").strip()
    assert actual == expected, f"{label}: {actual!r} instead of {expected!r}"



def localized(value, language):
    if isinstance(value, dict):
        if language in value and value[language] is not None:
            return value[language]
        return value.get("ru") or value.get("en") or ""
    return value or ""


def verify_catalogue_variants(page, data, desktop, language):
    services = data.get("services", [])
    categories = data.get("categoryOrder") or list(data.get("categoryLabels", {}).keys())
    for category in categories:
        category_services = [item for item in services if item.get("category") == category]
        for service_index, service in enumerate(category_services):
            variants = service.get("variants") or []
            if not variants:
                continue
            tab = (page.locator('#stdServiceTabs [data-service-category="' + category + '"]')
                   if desktop else page.locator('#tn13Services [data-scat="' + category + '"]'))
            if tab.count():
                tab.first.click(timeout=9000)
                page.wait_for_timeout(100)
            if service_index >= 8:
                more = page.locator("#stdServiceMore" if desktop else "#tn13Services .tn31-service-more")
                if more.count() and more.is_visible():
                    more.click(timeout=9000)
                    page.wait_for_timeout(500)
            card = page.locator('[data-tanem-service-id="' + service["id"] + '"]').first
            if not card.count():
                continue
            summary = card.locator(".tanem-service-options summary")
            if not summary.count():
                continue
            summary.click(timeout=9000)
            details = card.locator(".tanem-service-options")
            assert details.evaluate("(node) => node.open"), "Variant options did not open"
            expected_rows = len(variants)
            actual_rows = card.locator(".tanem-service-tariffs > div").count()
            assert actual_rows == expected_rows, (
                f"Variant rows for {service['id']}: {actual_rows}, expected {expected_rows}")
            expected_durations = sum(
                1 for variant in variants
                if str(localized(variant.get("duration"), language)).strip()
                and str(localized(variant.get("duration"), language)).strip() not in ("—", "-", "n/a")
            )
            actual_durations = card.locator(".tanem-service-variant-duration").count()
            assert actual_durations == expected_durations, (
                f"Variant durations for {service['id']}: {actual_durations}, expected {expected_durations}")
            summary.click(timeout=9000)
            return
    if any(item.get("variants") for item in services):
        raise AssertionError("Variant services exist but no visible category card could be exercised")


def verify_master_profile(page, data, desktop, language):
    team = data.get("team") or []
    if not team:
        return
    selector = "#salonDesktopTeam [data-desktop-master]" if desktop else "#tn13Team [data-mid]"
    cards = page.locator(selector)
    assert cards.count() == len(team), "Rendered team cards do not match production team data"
    if desktop:
        controls = page.locator("#salonDesktopTeam .tanem-team-controls")
        assert controls.count() == (1 if len(team) > 4 else 0), "Desktop team paging must activate only above four masters"
    trigger = cards.first
    master_id = trigger.get_attribute("data-desktop-master" if desktop else "data-mid")
    master = next((item for item in team if item.get("id") == master_id), None)
    assert master is not None, "Team card does not map to a master data object"
    trigger.click(timeout=9000)
    overlay_selector = "#stdMasterOverlay.open" if desktop else ".tn22-master-page.open"
    page.locator(overlay_selector).wait_for(state="visible", timeout=9000)
    profile = page.locator("#stdMasterPageContent" if desktop else ".tn22-master-body")
    for section in ("about", "services", "portfolio", "reviews"):
        assert profile.locator("#tanem-master-" + section).count() == 1, (
            f"Master profile is missing the {section} section")

    service_ids = master.get("serviceIds") or []
    if service_ids:
        linked_services = [item for item in data.get("services", []) if item.get("id") in service_ids]
    else:
        categories = set(master.get("categories") or [])
        linked_services = [item for item in data.get("services", []) if item.get("category") in categories]
    visible_services = profile.locator("[data-tanem-service-id]").count()
    assert visible_services == min(6, len(linked_services)), (
        f"Master profile service preview: {visible_services}, expected {min(6, len(linked_services))}")
    if len(linked_services) > 6:
        more = profile.locator("[data-master-expand]")
        assert more.count() == 1, "Master profile must expose the rest of its services"
        more.click(timeout=9000)
        assert profile.locator("[data-tanem-service-id]").count() == len(linked_services), (
            "Master profile did not reveal all linked services")

    review_by_id = {item.get("id"): item for item in data.get("reviews", [])}
    expected_reviews = 0
    if data.get("masterReviews", {}).get("enabled") is True:
        for review_id in master.get("reviewIds") or []:
            review = review_by_id.get(review_id)
            if review and str(localized(review.get("text"), language)).strip():
                expected_reviews += 1
    expected_reviews = min(9, expected_reviews)
    actual_reviews = profile.locator(".tanem-master-review:not([data-review-duplicate])").count()
    assert actual_reviews == expected_reviews, (
        f"Master profile reviews: {actual_reviews}, expected {expected_reviews}")

    if master.get("work"):
        work_count = len(master["work"])
    else:
        gallery_categories = [
            "Ногти" if category in ("Маникюр", "Педикюр") else category
            for category in (master.get("categories") or [])
        ]
        work_count = sum(len(data.get("media", {}).get("gallery", {}).get(category, []))
                         for category in gallery_categories)
    expected_work = work_count if not desktop or work_count < 3 else min(9, (work_count // 3) * 3)
    actual_work = profile.locator("[data-master-work]").count()
    assert actual_work == expected_work, (
        f"Master portfolio preview: {actual_work}, expected {expected_work}")
    if work_count:
        gallery_button = profile.locator("[data-master-gallery]")
        assert gallery_button.count() == 1, "Master profile must offer the full category gallery"
        work_categories = [
            "Ногти" if category in ("Маникюр", "Педикюр") else category
            for category in (master.get("categories") or [])
        ]
        if master.get("work") and isinstance(master["work"][0], dict) and master["work"][0].get("category"):
            gallery_category = master["work"][0]["category"]
        else:
            gallery_category = work_categories[0] if work_categories else "Салон"
        expected_gallery = len(data.get("media", {}).get("gallery", {}).get(gallery_category, []))
        if expected_gallery:
            gallery_button.click(timeout=9000)
            gallery_selector = "#stdGalleryBrowser.open" if desktop else "#tn13Gallery.open"
            page.locator(gallery_selector).wait_for(state="visible", timeout=9000)
            tiles = page.locator("#stdGalleryBrowser .std-gallery-browser-tile" if desktop
                                 else "#tn13Gallery .tn22-gallery-tile")
            assert tiles.count() == expected_gallery, (
                f"Full master category gallery: {tiles.count()}, expected all {expected_gallery} photos")
            back = page.locator("#stdGalleryBrowserBack" if desktop else "#tn13Gallery .tn22-gallery-back")
            back.click(timeout=9000)
            page.wait_for_function(
                "(selector) => !document.querySelector(selector)?.classList.contains('open')",
                arg="#stdGalleryBrowser" if desktop else "#tn13Gallery",
                timeout=9000
            )

    close = page.locator("#stdMasterPageClose" if desktop else ".tn22-back")
    close.click(timeout=9000)
    page.wait_for_function(
        "(selector) => !document.querySelector(selector)?.classList.contains('open')",
        arg="#stdMasterOverlay" if desktop else ".tn22-master-page",
        timeout=9000
    )


def check(browser, width, height, mobile, language):
    context = browser.new_context(
        viewport={"width": width, "height": height},
        is_mobile=mobile,
        has_touch=mobile,
        locale="ru-RU",
        reduced_motion="reduce",
    )
    page = context.new_page()
    errors = []
    failed_assets = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: failed_assets.append(response.url)
            if response.status >= 400 and response.url.startswith(HOST)
            and re.search(r"\.(?:js|css|webp|png|jpe?g|svg)(?:\?|$)", response.url)
            else None)
    page.goto(HOST, wait_until="domcontentloaded", timeout=30000)
    data = page.evaluate("window.TANEM_SITE_DATA")
    assert data and data["mode"] == "production", "Site did not load production data"
    desktop = (width >= 1024) or not mobile
    root = "#salon-desktop-v1" if desktop else "#salon-mobile"
    page.locator(root).wait_for(state="visible", timeout=18000)
    page.wait_for_function("!document.documentElement.classList.contains('br-booting')")
    switch = f'[data-desktop-lang="{language}"]' if desktop else f'[data-lang="{language}"]'
    page.locator(switch).first.click(timeout=9000)
    page.wait_for_timeout(250)
    brand = ".std-header-brand-main" if desktop else ".tn22-title"
    must_equal(page.locator(brand), data["salon"]["name"][language], "brand")
    if desktop:
        assert page.locator(".std-header-brand-main img").count() == 0, "Desktop header must always use one-line text branding"
    if desktop and data.get("media", {}).get("hero"):
        hero = data["media"]["hero"][0]
        expected_hero = hero if isinstance(hero, str) else hero.get("src")
        assert page.locator("#stdHeroMedia").first.get_attribute("src") == expected_hero, "Desktop hero did not use canonical hero"
    assert data["salon"]["name"][language] in page.title(), "Incorrect page title"
    cards = page.locator("#stdServiceList .dct-service-card" if desktop
                         else "#tn13Services .tn31-service-row")
    assert 0 < cards.count() <= len(data["services"]), "Wrong number of service cards"
    team_section = page.locator("#salonDesktopTeam" if desktop else "#tn13Team")
    reviews_section = page.locator("#salonDesktopReviews" if desktop else "#tn13Reviews")
    assert not team_section.is_hidden(), "Team is a permanent structural section"
    assert not reviews_section.is_hidden(), "Reviews are a permanent structural section"
    if not data["team"]:
        placeholder_cards = page.locator("#salonDesktopTeam .std-master.is-placeholder" if desktop else "#tn13Team .tn22-master-card.is-placeholder")
        assert placeholder_cards.count() == 4, "Empty team must preserve four neutral visual master cards"
        real_team_cards = page.locator("#salonDesktopTeam [data-desktop-master]" if desktop else "#tn13Team [data-mid]")
        assert real_team_cards.count() == 0, "Neutral team cards must not become invented specialists"
    if not data["reviews"]:
        review_cards = page.locator("#salonDesktopReviews .std-review-card" if desktop else "#tn13Reviews .br-review-card")
        assert review_cards.count() == 0, "Empty reviews state must not invent reviews"
    verify_catalogue_variants(page, data, desktop, language)
    verify_master_profile(page, data, desktop, language)
    if not data["media"]["portfolio"]:
        portfolio_section = page.locator("#salonDesktopPortfolio" if desktop else "#tn13Portfolio")
        assert portfolio_section.is_hidden(), "Empty portfolio should remain optional"
    messenger_card = page.locator('#salonDesktopContacts [data-contact-type="messenger"]' if desktop else '#tn13Visit [data-contact-type="messenger"]')
    if not data.get("contacts", {}).get("messengerUrl"):
        assert messenger_card.count() == 1 and messenger_card.is_hidden(), "Missing messenger must not leave a visible contact card"
    address_sub = page.locator('#salonDesktopContacts [data-contact-type="address"] .std-contact-card-sub' if desktop else '#tn13Visit [data-contact-type="address"] strong+span')
    expected_map_copy = ("Открыть в Яндекс Картах" if data.get("country") == "RU" else "Открыть в Google Maps") if language == "ru" else ("Open in Yandex Maps" if data.get("country") == "RU" else "Open in Google Maps")
    if language in ("ru", "en"):
        must_equal(address_sub, expected_map_copy, "map provider action")

    sample = page.locator("#stdHeaderBookBtn" if desktop else ".tn22-cta")
    sample.click(timeout=9000)
    links = page.locator("#stdBookOverlay .std-book-options a" if desktop
                         else "#tn13BookSheet .tn50-book-option")
    assert links.count() > 0, "Booking actions are missing"
    for href in [link.get_attribute("href") for link in links.all()]:
        assert href and href != "#" and (
            href.startswith(("https://", "tel:", "tg:", "viber:", "whatsapp:"))
        ), f"Invalid booking destination: {href}"
    visible = page.locator("body").inner_text()
    assert not re.search(r"SALON NAME|(?:Услуга|Service)\s+\d{2}\b", visible), (
        "Demo labels remain visible on a production page")
    # Google Maps embed can emit WebKit-only internal errors from its third-party
    # frame. Keep the filter narrow so TANEM application errors still fail the run.
    google_maps_frame_noise = (
        'Could not load "search_impl".',
        'Could not load "util".',
        'maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true due to access control checks.',
    )
    app_errors = [error for error in errors if not any(token in error for token in google_maps_frame_noise)]
    assert not app_errors, f"JavaScript errors: {app_errors}"
    assert not failed_assets, f"Missing site assets: {failed_assets}"
    context.close()
    print(f"PASS {width}x{height}, {'touch' if mobile else 'desktop'}, {language}: customer data, cards and booking")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=["chromium", "webkit"], default="chromium")
    args = parser.parse_args()
    with sync_playwright() as playwright:
        browser = getattr(playwright, args.engine).launch(headless=True)
        try:
            for case in [(1366, 900, False, "ru"), (1366, 900, False, "en"),
                         (1366, 900, False, "hy"), (390, 844, True, "ru"),
                         (390, 844, True, "en"), (390, 844, True, "hy"),
                         (1180, 820, True, "ru")]:
                check(browser, *case)
        finally:
            browser.close()
    print("PASS actual production site on desktop, phone and touch tablet")


if __name__ == "__main__":
    main()
