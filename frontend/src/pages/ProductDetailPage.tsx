import { useParams, Link } from 'react-router-dom';
import { useGetProductWithCategoryQuery } from '../features/products/productsApiSlice';
import { FaShoppingCart } from 'react-icons/fa';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  console.log('Product ID:', id);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductWithCategoryQuery(id || '');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-lg loading-spinner text-primary"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Hata: {(error as any)?.data?.message || 'Ürün yüklenemedi.'}</span>
      </div>
    );
  }

  if (!product) {
    return <div>Ürün bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Breadcrumb - Kategori Yolu */}
      <div className="text-sm breadcrumbs mb-4">
        <ul>
          <li>
            <Link to="/">Anasayfa</Link>
          </li>
          {product.category?.ancestors?.map((ancestor) => (
            <li key={ancestor._id}>
              {/* Kategori sayfalarına link eklenebilir */}
              <Link to={`/category/${ancestor._id}`}>{ancestor.name}</Link>
            </li>
          ))}
          {product.category && (
            <li>
              <Link to={`/category/${product.category._id}`}>
                {product.category.name}
              </Link>
            </li>
          )}
          <li>{product.name}</li>
        </ul>
      </div>

      <div className="card lg:card-side bg-base-100 shadow-xl">
        <figure className="lg:w-1/2">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/800x600'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </figure>
        <div className="card-body lg:w-1/2">
          <h1 className="card-title text-3xl md:text-4xl">{product.name}</h1>
          <p className="text-2xl font-bold text-primary my-2">{product.price} TL</p>
          <p className="mt-4 text-base-content/80">{product.description}</p>

          {/* Stok Durumu */}
          <div className="my-4">
            {product.stock > 0 ? (
              <div className="badge badge-success gap-2">Stokta</div>
            ) : (
              <div className="badge badge-error gap-2">Tükendi</div>
            )}
            <span className="ml-2 text-sm">({product.stock} adet)</span>
          </div>
          
          {/* Ürün Özellikleri (Attributes) */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Ürün Özellikleri</h3>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <tbody>
                        {product.attributes.map((attr, index) => (
                            <tr key={index} className="hover">
                                <th className="w-1/3">{attr.key}</th>
                                <td>{attr.value}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          <div className="card-actions justify-end mt-6">
            <button className="btn btn-primary w-full md:w-auto" disabled={product.stock === 0}>
              <FaShoppingCart />
              Sepete Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;