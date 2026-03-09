import { useState, useRef, useEffect } from "react";

const PRICE_PRESETS = [
  { label: "Все цены", min: 0, max: Infinity },
  { label: "до 2 000 ₽", min: 0, max: 2000 },
  { label: "2 000 – 4 000 ₽", min: 2000, max: 4000 },
  { label: "4 000 – 6 000 ₽", min: 4000, max: 6000 },
  { label: "от 6 000 ₽", min: 6000, max: Infinity },
];

export default function FilterPanel({
  categories = [],
  activeCategory = "all",
  onCategoryChange,
  activePriceRange,
  onPriceRangeChange,
}) {
  const [showPriceMenu, setShowPriceMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showPriceMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowPriceMenu(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showPriceMenu]);

  const handleCategoryClick = (cat) => {
    onCategoryChange(cat);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  const handlePriceSelect = (preset) => {
    onPriceRangeChange({ min: preset.min, max: preset.max });
    setShowPriceMenu(false);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  const hasPriceFilter = activePriceRange && (activePriceRange.min > 0 || activePriceRange.max < Infinity);
  const activePriceLabel =
    PRICE_PRESETS.find(
      (preset) => preset.min === activePriceRange?.min && preset.max === activePriceRange?.max
    )?.label || "Все цены";

  return (
    <div
      className="sticky top-0 z-20 glass-bg border-b border-[var(--tg-theme-secondary-bg-color,#f0f0f0)]"
      ref={menuRef}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 w-max pr-1">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`
                    shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200
                    ${isActive
                      ? "bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] shadow-sm"
                      : "bg-[var(--tg-theme-secondary-bg-color,#f3f4f6)] text-[var(--tg-theme-text-color,#333)] opacity-75 active:scale-95"
                    }
                  `}
                >
                  {cat === "all" ? "Все" : cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowPriceMenu((p) => !p)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200
              ${hasPriceFilter
                ? "bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] shadow-sm"
                : "bg-[var(--tg-theme-secondary-bg-color,#f3f4f6)] text-[var(--tg-theme-text-color,#333)] opacity-75"
              }
            `}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Цена</span>
            {hasPriceFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
            )}
          </button>

          {showPriceMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden card-shadow-lg z-30 bg-[var(--tg-theme-bg-color,#fff)] border border-[var(--tg-theme-secondary-bg-color,#eee)] animate-scale-in origin-top-right">
              {PRICE_PRESETS.map((preset, idx) => {
                const isActive =
                  activePriceRange?.min === preset.min && activePriceRange?.max === preset.max;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePriceSelect(preset)}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                      ${isActive
                        ? "text-[var(--tg-theme-button-color,#f472b6)] bg-[var(--tg-theme-secondary-bg-color,#f9fafb)]"
                        : "text-[var(--tg-theme-text-color,#333)] active:bg-[var(--tg-theme-secondary-bg-color,#f9fafb)]"
                      }
                    `}
                  >
                    {preset.label}
                    {isActive && (
                      <span className="material-symbols-outlined text-[16px] float-right">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={() => setShowPriceMenu((p) => !p)}
          className={`
            w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-left transition-all duration-200
            ${hasPriceFilter
              ? "bg-[color:var(--tg-theme-button-color,#f472b6)]/10 text-[var(--tg-theme-text-color,#333)]"
              : "bg-[var(--tg-theme-secondary-bg-color,#f8f8f8)] text-[var(--tg-theme-text-color,#333)]"
            }
          `}
        >
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--tg-theme-hint-color,#999)]">
              Фильтр по цене
            </div>
            <div className="text-[13px] font-semibold truncate">{activePriceLabel}</div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[var(--tg-theme-hint-color,#999)]">
            {showPriceMenu ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>
    </div>
  );
}
