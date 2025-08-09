import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';

const AdminRoute: React.FC = () => {
    const user = useSelector(selectCurrentUser);

    // Kullanıcı bilgisi yüklenirken veya kullanıcı yoksa bekle/yönlendir
    // `PersistLogin` zaten bu kontrolleri yaptığı için burada sade bir kontrol yeterli.
    if (!user) {
        // Eğer giriş yapmış bir kullanıcı yoksa ana sayfaya yönlendir
        return <Navigate to="/auth" replace />;
    }

    // Kullanıcının rolü 'admin' ise alt rotaları göster, değilse ana sayfaya yönlendir
    return user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;