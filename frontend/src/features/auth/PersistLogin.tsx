import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useGetMeQuery } from './authApiSlice';
import { setCredentials } from './authSlice';

const PersistLogin: React.FC = () => {
    const dispatch = useDispatch();
    const { data, error, isLoading, isSuccess, isError } = useGetMeQuery();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (isSuccess && data?.data?.user) {
            // API'den kullanıcı bilgisi başarıyla geldiyse, Redux state'ini güncelle
            dispatch(setCredentials({ user: data.data.user, token: 'token_from_cookie' }));
        }
        if (isSuccess || isError) {
            // İstek tamamlandığında (başarılı veya başarısız), ilk yükleme durumunu kapat
            setIsInitialLoad(false);
        }
    }, [isSuccess, isError, data, dispatch]);

    if (isLoading || isInitialLoad) {
        // Sayfa ilk yüklendiğinde veya kullanıcı bilgisi çekilirken bekleme ekranı göster
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    // Kullanıcı bilgisi çekildikten sonra uygulamanın geri kalanını render et
    return <Outlet />;
};

export default PersistLogin;