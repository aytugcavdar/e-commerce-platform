import React from 'react';
import { useGetUsersQuery, useUpdateUserMutation } from '../features/users/usersApiSlice';
import { User, ApiResponse } from '../types';
import { useNotify } from '../hooks/useNotify';

const ManageUsersPage: React.FC = () => {
    const { data: usersResponse, isLoading } = useGetUsersQuery<ApiResponse<User[]>>();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const notify = useNotify();

    const handleRoleChange = async (user: User, newRole: string) => {
        if (window.confirm(`${user.fullName} kullanıcısının rolünü "${newRole}" olarak değiştirmek istediğinizden emin misiniz?`)) {
            try {
                await updateUser({ id: user.id, role: newRole }).unwrap();
                notify.success('Kullanıcı rolü güncellendi.');
            } catch {
                notify.error('Rol güncellenemedi.');
            }
        }
    };

    if (isLoading) return <div className="text-center"><span className="loading loading-lg"></span></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Kullanıcı Yönetimi</h1>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Kullanıcı</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Kayıt Tarihi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersResponse?.data?.map((user) => (
                            <tr key={user.id}>
                                <td>{user.fullName}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        className="select select-bordered select-sm"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user, e.target.value)}
                                        disabled={isUpdating}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsersPage;