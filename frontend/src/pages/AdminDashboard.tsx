import React from "react";
import { Link } from "react-router-dom";
import Card from "../components/common/Card"; // Yeni bileşeni import edin

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Yönetim Paneli</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card to="/admin/products">
          <h2 className="card-title">Ürünleri Yönet</h2>
          <p>Yeni ürün ekle, mevcut ürünleri düzenle veya sil.</p>
        </Card>
        <Card to="/admin/categories">
          <h2 className="card-title">Kategorileri Yönet</h2>
          <p>Ürün kategorilerini yönet.</p>
        </Card>
        <Card to="/admin/orders">
          <h2 className="card-title">Siparişleri Yönet</h2>
          <p>Müşteri siparişlerini görüntüle ve yönet.</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;