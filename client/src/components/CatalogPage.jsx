import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import FilterPanel from "./FilterPanel";
import ProductCard from "./ProductCard";
import getFinalPrice from "../utils/getFinalPrice";

export default function CatalogPage() {
  const { activeCategory, products, categories, setCategory, error } = useProducts();
  const navigate = useNavigate();
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const filteredProducts = useMemo(() => {
    if (priceRange.min === 0 && priceRange.max === Infinity) return products;
    return products.filter((p) => {
      const price = parseFloat(getFinalPrice(p));
      return price >= priceRange.min && price <= priceRange.max;
    });
  }, [products, priceRange]);

  const goToProduct = (product) => {
    navigate(`/product/${product.id}`);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
  };

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--tg-theme-hint-color,#999)] mb-3">
          cloud_off
        </span>
        <p className="text-[var(--tg-theme-hint-color,#999)] text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="pb-nav">
      <div className="px-4 pt-4 pb-1 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold animate-fade-in-up">
            Каталог
          </h1>
          <p className="text-[13px] text-[var(--tg-theme-hint-color,#999)] mt-0.5 animate-fade-in-up stagger-1">
            Воздушные шары для любого праздника
          </p>
        </div>
        {tgUser && (
          <div className="flex flex-col items-center gap-0.5 animate-fade-in-up shrink-0">
            {tgUser.photo_url ? (
              <img
                src={tgUser.photo_url}
                alt={tgUser.first_name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--tg-theme-button-color,#f472b6)] ring-offset-1 ring-offset-[var(--tg-theme-bg-color,#fff)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[16px] ring-2 ring-[var(--tg-theme-button-color,#f472b6)] ring-offset-1 ring-offset-[var(--tg-theme-bg-color,#fff)]"
                style={{ background: "var(--tg-theme-button-color,#f472b6)" }}
              >
                {(tgUser.first_name?.[0] || "?").toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-[var(--tg-theme-hint-color,#999)] font-medium max-w-[56px] truncate leading-tight">
              {tgUser.first_name}
            </span>
          </div>
        )}
      </div>

      <FilterPanel
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setCategory}
        activePriceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <span className="material-symbols-outlined text-5xl text-[var(--tg-theme-hint-color,#ccc)] mb-3">
            search_off
          </span>
          <p className="text-[var(--tg-theme-hint-color,#999)] text-sm font-medium">
            Нет товаров по выбранным фильтрам
          </p>
          <button
            onClick={() => {
              setCategory("all");
              setPriceRange({ min: 0, max: Infinity });
            }}
            className="mt-3 text-[var(--tg-theme-button-color,#f472b6)] text-sm font-semibold active:opacity-70"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 pt-3">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => goToProduct(product)}
              style={{ animationDelay: `${Math.min(idx, 8) * 0.03}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
