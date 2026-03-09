import { useCart } from "../context/CartContext";
import getFinalPrice from "../utils/getFinalPrice";
import formatPrice from "../utils/formatPrice";

export default function ProductCard({ product, onClick, style }) {
  const { addToCart, getItemQty } = useCart();
  const qty = getItemQty(product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
  };

  const finalPrice = getFinalPrice(product);
  const hasDiscount = product.discountPercentage > 0;

  return (
    <div
      onClick={onClick}
      style={style}
      className="animate-fade-in-up rounded-2xl overflow-hidden bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow active:scale-[0.97] transition-transform duration-150 cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-[#ef4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
            -{Math.ceil(product.discountPercentage)}%
          </div>
        )}

        <button
          onClick={handleAddToCart}
          className={`
            absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center
            transition-all duration-200 active:scale-90
            ${qty > 0
              ? "bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] shadow-lg"
              : "bg-[var(--tg-theme-bg-color,#fff)] text-[var(--tg-theme-text-color,#333)] shadow-md"
            }
          `}
        >
          {qty > 0 ? (
            <span className="text-[11px] font-extrabold">{qty}</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">add</span>
          )}
        </button>
      </div>

      <div className="px-3 pt-2 pb-3">
        <h3 className="text-[13px] font-semibold leading-tight line-clamp-2 min-h-[2.4em]">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[15px] font-extrabold">{formatPrice(parseFloat(finalPrice))}</span>
          {hasDiscount && (
            <span className="text-[11px] text-[var(--tg-theme-hint-color,#999)] line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
