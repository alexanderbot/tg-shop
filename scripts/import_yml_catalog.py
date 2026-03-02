# -*- coding: utf-8 -*-
"""Convert YML (XML) catalog to products.json format."""
import re
import json
import xml.etree.ElementTree as ET
from pathlib import Path

XML_PATH = Path(r"c:\Users\Alex\Downloads\store-442751-202603020044.yml")
OUT_PATH = Path(r"c:\Users\Alex\PycharmProjects\tg-shop\server\data\products.json")

CATEGORY_IDS = {
    "213705446241": "all",
    "773213455222": "Шары для бизнеса",
}


def strip_html(html):
    if not html:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def main():
    tree = ET.parse(XML_PATH)
    root = tree.getroot()
    ns = {}
    shop = root.find("shop", ns)
    if shop is None:
        shop = root.find("{*}shop")
    if shop is None:
        for child in root:
            if "shop" in child.tag:
                shop = child
                break
    if shop is None:
        shop = root

    offers = shop.findall(".//offer") or shop.findall(".//{*}offer")
    if not offers:
        offers = list(root.iter("offer")) or list(root.iter("{*}offer"))

    categories_set = {"all"}
    products = []
    for idx, offer in enumerate(offers, start=1):
        offer_id = offer.get("id", str(idx))
        name_el = offer.find("name") if offer.find("name") is not None else offer.find("{*}name")
        title = (name_el.text or "").strip() if name_el is not None else ""

        desc_el = offer.find("description") if offer.find("description") is not None else offer.find("{*}description")
        if desc_el is not None and desc_el.text:
            description = strip_html(desc_el.text)
        else:
            description = ""

        pictures = offer.findall("picture") or offer.findall("{*}picture")
        images = [(p.text or "").strip() for p in pictures if p.text and (p.text or "").strip()]
        thumbnail = images[0] if images else ""

        price_el = offer.find("price") if offer.find("price") is not None else offer.find("{*}price")
        price = float((price_el.text or "0").replace(",", ".")) if price_el is not None else 0

        old_el = offer.find("oldprice") if offer.find("oldprice") is not None else offer.find("{*}oldprice")
        oldprice = float((old_el.text or "0").replace(",", ".")) if old_el is not None else None

        if oldprice and oldprice > 0:
            discount_percentage = round((oldprice - price) / oldprice * 100, 2)
        else:
            discount_percentage = 0

        cat_el = offer.find("categoryId") if offer.find("categoryId") is not None else offer.find("{*}categoryId")
        cat_id = (cat_el.text or "").strip() if cat_el is not None else ""
        category = CATEGORY_IDS.get(cat_id, "all")
        categories_set.add(category)

        products.append({
            "id": idx,
            "title": title,
            "description": description or title,
            "category": category,
            "price": price,
            "discountPercentage": discount_percentage,
            "thumbnail": thumbnail,
            "images": images if images else [thumbnail] if thumbnail else [],
        })

    categories_list = ["all"] + [c for c in sorted(categories_set) if c != "all"]
    out = {"products": products, "categories": categories_list}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Written {len(products)} products to {OUT_PATH}")


if __name__ == "__main__":
    main()
