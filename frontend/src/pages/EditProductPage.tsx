import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { useGetProductQuery, useUpdateProductMutation } from '../features/products/productsApiSlice';
import { toast } from 'react-toastify'; // Geri bildirim için

const EditProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    // Ürün verisini çekmek için kullanılan hook
    const { data: productData, isLoading, isError } = useGetProductQuery(productId!, {
        skip: !productId,
    });

    // Ürünü güncellemek için mutation hook'u
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

    // Form gönderildiğinde çalışacak olan fonksiyon
    const handleUpdateProduct = async (formData: FormData) => {
        if (!productId) return;
        try {
            await updateProduct({ id: productId, productData: formData }).unwrap();
            toast.success('Ürün başarıyla güncellendi!');
            navigate('/admin/products'); // Başarılı güncelleme sonrası yönlendirme
        } catch (error) {
            toast.error('Ürün güncellenirken bir hata oluştu.');
            console.error('Update failed:', error);
        }
    };

    // Veri yükleniyorsa
    if (isLoading) {
        return <div className="text-center"><span className="loading loading-lg"></span></div>;
    }

    // Hata varsa veya veri gelmediyse
    if (isError || !productData?.data) {
        return <div className="text-center text-red-500">Ürün bilgileri yüklenemedi.</div>;
    }

    // Sayfanın render edilmesi
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Ürünü Düzenle</h1>
            <ProductForm
                product={productData.data}       
                onSubmit={handleUpdateProduct}   
                isLoading={isUpdating}            
            />
        </div>
    );
};

export default EditProductPage;