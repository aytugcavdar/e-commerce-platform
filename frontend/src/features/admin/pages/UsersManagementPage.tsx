// frontend/src/features/admin/pages/UsersManagementPage.tsx

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { USER_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: Kullanıcı Yönetimi
 * 
 * Admin tüm kullanıcıları görür ve yönetir.
 * 
 * Özellikler:
 * - Kullanıcı listesi
 * - Arama (isim, email)
 * - Rol filtreleme
 * - Kullanıcı engelleme/aktif etme
 * - Kullanıcı detay modal
 */

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'seller';
  isActive: boolean;
  isBlocked: boolean;
  isEmailVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastLogin?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  /**
   * 📊 FETCH USERS
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;

      const response = await apiClient.get(USER_ENDPOINTS.ADMIN_LIST, { params });
      setUsers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  /**
   * 🔄 TOGGLE BLOCK STATUS
   */
  const toggleBlockStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(USER_ENDPOINTS.ADMIN_TOGGLE_BLOCK(userId));
      toast.success(`Kullanıcı ${currentStatus ? 'aktif' : 'engellendi'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Durum güncellenemedi');
    }
  };

  /**
   * 🎨 ROLE COLORS
   */
  const roleConfig: Record<string, { label: string; color: string }> = {
    customer: { label: 'Müşteri', color: 'bg-blue-100 text-blue-800' },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
    seller: { label: 'Satıcı', color: 'bg-green-100 text-green-800' },
  };

  /**
   * 💰 FORMAT CURRENCY
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  /**
   * 📅 FORMAT DATE
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Hiç';
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading && users.length === 0) {
    return <Loading fullScreen message="Kullanıcılar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* 📌 HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Kullanıcı Yönetimi
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Toplam {users.length} kullanıcı
        </p>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="İsim veya email ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="customer">Müşteri</option>
            <option value="seller">Satıcı</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* 📋 USERS TABLE */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Kullanıcı bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sipariş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Harcama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kayıt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[user.role].color}`}>
                        {roleConfig[user.role].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.totalOrders} sipariş
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.isEmailVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                            ✓ Doğrulandı
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                            🚫 Engelli
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setDetailModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Detay"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {user.role !== 'admin' && (
                          <button
                            onClick={() => toggleBlockStatus(user._id, user.isBlocked)}
                            className={`${user.isBlocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'} p-1`}
                            title={user.isBlocked ? 'Aktif Et' : 'Engelle'}
                          >
                            {user.isBlocked ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📄 USER DETAIL MODAL */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Kullanıcı Detayı
                </h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ad Soyad</p>
                    <p className="font-medium text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rol</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[selectedUser.role].color}`}>
                      {roleConfig[selectedUser.role].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Toplam Sipariş</p>
                    <p className="font-medium text-gray-900">{selectedUser.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Toplam Harcama</p>
                    <p className="font-medium text-gray-900">{formatCurrency(selectedUser.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kayıt Tarihi</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Son Giriş</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedUser.lastLogin)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedUser.isEmailVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ E-posta Doğrulandı
                    </span>
                  )}
                  {selectedUser.isBlocked ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                      🚫 Engelli
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;