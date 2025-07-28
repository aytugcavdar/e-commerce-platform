const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const axios = require('axios');

// @desc    Bir sipariş için ödeme işlemini başlatır (Simülasyon)
// @route   POST /api/payments/charge
// @access  Private
exports.processPayment = asyncHandler(async (req, res, next) => {
    const { orderId, paymentMethod } = req.body; // paymentMethod'da sahte kart bilgileri olabilir.
    const userToken = req.cookies.token;

    if (!orderId) {
        return next(new ErrorResponse('Sipariş ID\'si gereklidir', 400));
    }

    // --- ÖDEME SİMÜLASYONU ---
    // Gerçek dünyada burada Stripe, Iyzico gibi bir servisle konuşulur.
    // Biz burada basitçe ödemenin başarılı olduğunu varsayıyoruz.
    console.log(`ÖDEME BİLGİSİ: Sipariş #${orderId} için ödeme işlemi başlatıldı...`.yellow);
    const paymentSuccessful = true; // Simülasyon: her zaman başarılı
    // -------------------------

    if (paymentSuccessful) {
        console.log(`ÖDEME BİLGİSİ: Sipariş #${orderId} için ödeme BAŞARILI.`.green);

        // --- SERVİSLER ARASI İLETİŞİM ---
        // Ödeme başarılı olduğu için Order Service'e gidip siparişin durumunu güncellemesini söylüyoruz.
        try {
            const { data } = await axios.put(
                `http://localhost:5006/api/orders/${orderId}/pay`,
                {}, // Body'de bir şey göndermemize gerek yok, controller hallediyor.
                { headers: { 'Cookie': `token=${userToken}` } } // işlemi yapan kullanıcının token'ı ile isteği yap
            );

            // Başarılı bir şekilde güncellenen sipariş bilgisini istemciye geri dön.
            res.status(200).json({ success: true, data: data.data });

        } catch (err) {
            console.error(`SİPARİŞ GÜNCELLEME HATASI: Ödeme başarılı olmasına rağmen sipariş #${orderId} güncellenemedi.`.red, err.message);
            return next(new ErrorResponse('Ödeme alındı fakat sipariş güncellenirken bir hata oluştu. Lütfen destek ile iletişime geçin.', 500));
        }
        // ---------------------------------

    } else {
        console.log(`ÖDEME BİLGİSİ: Sipariş #${orderId} için ödeme BAŞARISIZ.`.red);
        // Ödeme başarısız olursa, Order Service'e gidip sipariş durumunu "Başarısız" olarak güncelleyebiliriz.
        return next(new ErrorResponse('Ödeme işlemi başarısız oldu.', 400));
    }
});