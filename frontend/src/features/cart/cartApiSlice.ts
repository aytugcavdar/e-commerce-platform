import { apiSlice } from '../../app/apiSlice';

export const cartApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        // Sepet içeriğini getirmek için yeni bir query ekliyoruz
        getCart: builder.query({
            query: () => '/cart', // API Gateway'deki /api/cart adresine GET isteği atacak
            providesTags: ['Cart'] // Bu sorgunun sonuçlarını 'Cart' olarak etiketle
        }),
        addToCart: builder.mutation({
            query: ({ productId, quantity }) => ({
                url: '/cart',
                method: 'POST',
                body: { productId, quantity }
            }),
            invalidatesTags: ['Cart'] // Sepete ekleme yapıldığında 'Cart' etiketli cache'i geçersiz kıl
        })
    })
});

// Yeni oluşturulan hook'u da export ediyoruz
export const { useGetCartQuery, useAddToCartMutation } = cartApiSlice;