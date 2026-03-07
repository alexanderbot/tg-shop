import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const tabs = [
  { path: "/", icon: "grid_view", label: "Каталог" },
  { path: "/cart", icon: "shopping_cart", label: "Корзина" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();

  const isProductPage = location.pathname.startsWith("/product/");
  if (isProductPage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-bg border-t border-[var(--tg-theme-secondary-bg-color,#eee)]"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex h-[var(--nav-height)]">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => {
                navigate(tab.path);
                window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
              }}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200
                ${isActive
                  ? "text-[var(--tg-theme-button-color,#f472b6)]"
                  : "text-[var(--tg-theme-hint-color,#999)]"
                }
              `}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  {tab.icon}
                </span>
                {tab.path === "/cart" && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pop-in">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
