import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logOut } from '../features/auth/authSlice'; // logOut eylemini import ediyoruz

// Orijinal baseQuery'yi tanımlıyoruz
const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',
    credentials: 'include'
});

// Hata yönetimini yapacak olan özel bir baseQuery wrapper'ı oluşturuyoruz
const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // Eğer 401 (Unauthorized) hatası alırsak, kullanıcıyı sistemden çıkar
    if (result.error && result.error.status === 401) {
        console.error('Yetkilendirme hatası! Kullanıcı çıkış yapıyor.');
        api.dispatch(logOut());
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth, // baseQuery'yi yeni wrapper'ımız ile değiştiriyoruz
    tagTypes: ['Product', 'User', 'Order', 'Cart', 'Category'], // Category tag'ını ekliyoruz
    endpoints: builder => ({})
});