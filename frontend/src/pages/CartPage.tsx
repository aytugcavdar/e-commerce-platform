import React from 'react';
import { useGetCartQuery } from '../features/cart/cartApiSlice'; // Eksik importu ekleyin
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Cart, ApiResponse } from '../../types';

const CartPage: React.FC = () => {
  const { data: cartResponse, isLoading, isSuccess } = useGetCartQuery<ApiResponse<Cart>>(undefined);
  // Sepetten silme işlemini daha sonra ekleyeceğiz. Şimdilik yorum satırı olarak kalsın.
  // const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation(); 
  const navigate = useNavigate();
  
  const handleCheckout = () => {
    navigate('/checkout');
  }

  let content;

  if (isLoading) {
    content = <div className="text-center"><span className="loading loading-lg"></span></div>;
  } else if (isSuccess && cartResponse?.data && cartResponse.data.items.length > 0) {
    const { items, totalPrice } = cartResponse.data;
    content = (
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Fiyat</th>
              <th>Adet</th>
              <th>Ara Toplam</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId}>
                <td>
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="mask mask-squircle w-12 h-12">
                        <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{item.name}</div>
                    </div>
                  </div>
                </td>
                <td>{item.price} TL</td>
                <td>{item.quantity}</td>
                <td>{item.price * item.quantity} TL</td>
                <th>
                  <button className="btn btn-ghost btn-xs">Sil</button>
                </th>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-8 items-center">
            <h2 className="text-2xl font-bold mr-4">Toplam Tutar: {totalPrice} TL</h2>
            <button onClick={handleCheckout} className="btn btn-primary">Ödemeye Geç</button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="text-center">
        <h2 className="text-2xl">Sepetiniz Boş</h2>
        <Link to="/" className="btn btn-primary mt-4">Alışverişe Başla</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Alışveriş Sepetim</h1>
      {content}
    </div>
  );
};

export default CartPage;