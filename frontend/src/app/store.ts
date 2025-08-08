import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer, // API slice'ının reducer'ı
        auth: authReducer // Auth state'ini (user, token) yöneten reducer
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true // Geliştirme ortamında Redux DevTools'u etkinleştir
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;