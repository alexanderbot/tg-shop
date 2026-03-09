import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../API/products";
import { useCart } from "../context/CartContext";
import getFinalPrice from "../utils/getFinalPrice";
import formatPrice from "../utils/formatPrice";

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, getItemQty } = useCart();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdded, setShowAdded] = useState(false);
  const galleryRef = useRef(null);

  useEffect(() => {
    getProduct(productId)
      .then((res) => {
        setProduct(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить товар");
        setIsLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    const handleBack = () => {
      navigate("/");
      window.Telegram?.WebApp?.BackButton?.hide();
    };
    window.Telegram?.WebApp?.BackButton?.onClick(handleBack);
    window.Telegram?.WebApp?.BackButton?.show();

    return () => {
      window.Telegram?.WebApp?.BackButton?.offClick(handleBack);
    };
  }, [navigate]);

  const handleScroll = () => {
    if (!galleryRef.current) return;
    const el = galleryRef.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(idx);
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-[var(--tg-theme-hint-color,#ccc)] animate-pulse">
          shopping_bag
        </span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--tg-theme-hint-color,#999)] mb-3">
          error_outline
        </span>
        <p className="text-[var(--tg-theme-hint-color,#999)]">{error || "Товар не найден"}</p>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.thumbnail];
  const finalPrice = getFinalPrice(product);
  const hasDiscount = product.discountPercentage > 0;
  const cartQty = getItemQty(product.id);

  return (
    <div className="pb-nav animate-fade-in-up">
      <div className="relative">
        <div
          ref={galleryRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-full aspect-[4/3] bg-[var(--tg-theme-secondary-bg-color,#f3f4f6)]"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeSlide
                    ? "w-5 bg-white shadow-sm"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold leading-snug flex-1">{product.title}</h1>
          {cartQty > 0 && (
            <div className="shrink-0 bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] text-xs font-bold px-2.5 py-1 rounded-full">
              В корзине: {cartQty}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-extrabold">{formatPrice(parseFloat(finalPrice))}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-[var(--tg-theme-hint-color,#999)] line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs font-bold text-[#ef4444] bg-[#fef2f2] px-1.5 py-0.5 rounded">
                -{Math.ceil(product.discountPercentage)}%
              </span>
            </>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-[var(--tg-theme-hint-color,#777)] leading-relaxed mt-4">
            {product.description}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center bg-[var(--tg-theme-secondary-bg-color,#f3f4f6)] rounded-xl overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center text-lg font-bold text-[var(--tg-theme-hint-color,#999)] active:bg-[rgba(0,0,0,0.05)] transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-[15px]">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-11 h-11 flex items-center justify-center text-lg font-bold text-[var(--tg-theme-text-color,#333)] active:bg-[rgba(0,0,0,0.05)] transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 h-11 rounded-xl bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150 shadow-sm"
          >
            {showAdded ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-pop-in">check_circle</span>
                Добавлено!
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                В корзину
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
