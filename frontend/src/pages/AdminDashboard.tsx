import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Yönetim Paneli</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/products"
          className="card bg-base-200 shadow-xl hover:bg-base-300 transition-colors"
        >
          <div className="card-body items-center text-center">
            <h2 className="card-title">Ürünleri Yönet</h2>
            <p>Yeni ürün ekle, mevcut ürünleri düzenle veya sil.</p>
          </div>
        </Link>
        <Link
          to="/admin/categories"
          className="card bg-base-200 shadow-xl hover:bg-base-300 transition-colors"
        >
          <div className="card-body items-center text-center">
            <h2 className="card-title">Kategorileri Yönet</h2>
            <p>Ürün kategorilerini yönet.</p>
          </div>
        </Link>
        <Link
          to="/admin/orders"
          className="card bg-base-200 shadow-xl hover:bg-base-300 transition-colors"
        >
          <div className="card-body items-center text-center">
            <h2 className="card-title">Siparişleri Yönet</h2>
            <p>Müşteri siparişlerini görüntüle ve yönet.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
