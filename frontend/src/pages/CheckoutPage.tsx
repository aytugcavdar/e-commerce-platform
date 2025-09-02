import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { useCreateOrderMutation } from '../features/orders/orderApiSlice';
import { useGetCartQuery, useClearCartMutation } from '../features/cart/cartApiSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Address, ApiResponse, Cart } from '../types'; // ApiResponse ve Cart tiplerini ekledik
import { FaPlus } from 'react-icons/fa';

const CheckoutPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: cartResponse, isLoading: isCartLoading } = useGetCartQuery<ApiResponse<Cart>>();
    const [createOrder, { isLoading: isOrderCreating }] = useCreateOrderMutation();
    const [clearCart] = useClearCartMutation();
    const navigate = useNavigate();

    const cart = cartResponse?.data;
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

    useEffect(() => {
        const defaultAddress = user?.addresses?.find(addr => addr.isDefault);
        if (defaultAddress) {
            setSelectedAddress(defaultAddress._id);
        } else if (user?.addresses && user.addresses.length > 0) {
            setSelectedAddress(user.addresses[0]._id);
        }
    }, [user]);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error('Please select a shipping address.');
            return;
        }

        const address = user?.addresses?.find(addr => addr._id === selectedAddress);
        if (!address) {
            toast.error('Selected address not found.');
            return;
        }

        // *** HATA ÇÖZÜMÜ: Geçerli ürünleri filtrele ***
        // Sadece 'product' alanı null olmayan ürünleri al
        const validOrderItems = cart?.items.filter(item => item.product).map(item => ({
            product: item.product._id,
            name: item.product.name,
            image: item.product.images[0]?.url || '',
            price: item.product.price,
            quantity: item.quantity,
        }));

        // Eğer geçerli ürün kalmadıysa kullanıcıyı uyar
        if (!validOrderItems || validOrderItems.length === 0) {
            toast.error("Your cart contains unavailable items. Please review your cart.");
            navigate('/cart');
            return;
        }

        const orderData = {
            orderItems: validOrderItems,
            shippingAddress: {
                street: address.street,
                city: address.city,
                zipCode: address.zipCode,
            },
            paymentMethod: 'Stripe', 
            totalPrice: cart?.totalPrice,
        };

        try {
            const order = await createOrder(orderData).unwrap();
            await clearCart().unwrap();
            navigate(`/payment/${order.data._id}`);
        } catch (error) {
            toast.error('Failed to create order.');
        }
    };

    if (isCartLoading) {
        return <div className="text-center"><span className="loading loading-lg"></span></div>;
    }
    
    // Sepet boşsa veya ürün yoksa gösterilecek mesaj
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold">Your cart is empty</h1>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">Shipping Address</h2>
                            <div className="space-y-4">
                                {user?.addresses?.map(address => (
                                    <div key={address._id} className={`p-4 rounded-lg border cursor-pointer ${selectedAddress === address._id ? 'border-primary bg-primary-light' : 'bg-gray-50'}`} onClick={() => setSelectedAddress(address._id)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{address.name}</h3>
                                                <p>{address.street}</p>
                                                <p>{address.city}, {address.zipCode}</p>
                                            </div>
                                            <input
                                                type="radio"
                                                name="address"
                                                className="radio radio-primary"
                                                checked={selectedAddress === address._id}
                                                onChange={() => setSelectedAddress(address._id)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <div className="mt-4">
                                <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')}>
                                    <FaPlus className="mr-2" /> Add/Manage Addresses
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">Order Summary</h2>
                            <div className="space-y-2">
                                {/* Sadece geçerli ürünleri göster */}
                                {cart.items.filter(item => item.product).map(item => (
                                    <div key={item.product._id} className="flex justify-between">
                                        <span>{item.product.name} x {item.quantity}</span>
                                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="divider"></div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${cart.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="card-actions justify-end mt-6">
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={handlePlaceOrder}
                                    disabled={isOrderCreating}
                                >
                                    {isOrderCreating ? 'Placing Order...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;