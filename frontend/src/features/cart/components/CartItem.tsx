// frontend/src/features/cart/components/CartItem.tsx

import { Link } from 'react-router-dom';
import type { CartItem as CartItemType } from '../types/cart.types';

/**
 * 🎓 ÖĞREN: CartItem Component
 * 
 * Sepetteki tek bir ürünü gösteren component.
 * 
 * Özellikler:
 * - Ürün resmi ve bilgileri
 * - Adet artır/azalt butonları
 * - Sepetten çıkar butonu
 * - Ara toplam göstergesi
 * - Stok kontrolü
 */

interface CartItemProps {
  item: CartItemType;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
}

const CartItem = ({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onQuantityChange,
}: CartItemProps) => {
  const finalPrice = item.discountPrice || item.price;
  const hasDiscount = !!item.discountPrice;
  const subtotal = finalPrice * item.quantity;

  /**
   * 📝 Manuel Adet Girişi
   */
  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 1 && value <= item.stock) {
      onQuantityChange(item.productId, value);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* 🖼️ Ürün Resmi */}
      <Link
        to={`/products/${item.slug}`}
        className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* 📝 Ürün Bilgileri */}
      <div className="flex-1 min-w-0">
        {/* Ürün Adı */}
        <Link
          to={`/products/${item.slug}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
        >
          {item.name}
        </Link>

        {/* Fiyat */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            {finalPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          )}
        </div>

        {/* Stok Durumu */}
        {item.stock <= 5 && (
          <p className="mt-1 text-sm text-orange-600 font-medium">
            ⚠️ Stokta sadece {item.stock} adet kaldı!
          </p>
        )}

        {/* Mobilde Adet ve Sil Butonu */}
        <div className="mt-3 flex items-center gap-4 sm:hidden">
          {/* Adet Kontrolleri */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => onDecrement(item.productId)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Azalt"
            >
              −
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={handleQuantityInput}
              min="1"
              max={item.stock}
              className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
            />
            <button
              onClick={() => onIncrement(item.productId)}
              disabled={item.quantity >= item.stock}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Artır"
            >
              +
            </button>
          </div>

          {/* Sil Butonu */}
          <button
            onClick={() => onRemove(item.productId)}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Sil
          </button>
        </div>
      </div>

      {/* Desktop: Adet, Toplam ve Sil */}
      <div className="hidden sm:flex items-center gap-6">
        {/* Adet Kontrolleri */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">Adet</label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => onDecrement(item.productId)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Azalt"
            >
              −
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={handleQuantityInput}
              min="1"
              max={item.stock}
              className="w-14 text-center border-x border-gray-300 py-2 focus:outline-none"
            />
            <button
              onClick={() => onIncrement(item.productId)}
              disabled={item.quantity >= item.stock}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Artır"
            >
              +
            </button>
          </div>
        </div>

        {/* Ara Toplam */}
        <div className="flex flex-col items-end gap-2">
          <label className="text-xs text-gray-500 font-medium">Toplam</label>
          <span className="text-xl font-bold text-gray-900">
            {subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>

        {/* Sil Butonu */}
        <button
          onClick={() => onRemove(item.productId)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Sepetten Çıkar"
          aria-label="Sepetten Çıkar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartItem;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * import CartItem from '@/features/cart/components/CartItem';
 * import { useCart } from '@/features/cart/hooks/useCart';
 * 
 * const CartPage = () => {
 *   const {
 *     items,
 *     incrementItem,
 *     decrementItem,
 *     removeItem,
 *     updateItemQuantity,
 *   } = useCart();
 *   
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <CartItem
 *           key={item.productId}
 *           item={item}
 *           onIncrement={incrementItem}
 *           onDecrement={decrementItem}
 *           onRemove={removeItem}
 *           onQuantityChange={updateItemQuantity}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 */