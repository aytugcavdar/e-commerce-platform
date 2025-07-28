const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sendEmail = require('./utils/sendEmail'); // Kopyaladığınız dosyanın yolu

dotenv.config({ path: './config/config.env' });

const app = express();
app.use(express.json());
app.use(cors());

// Basit bir test endpoint'i
app.get('/api/notifications/test', (req, res) => {
    res.send('Notification Service çalışıyor!');
});

// E-posta göndermek için ana endpoint
app.post('/api/notifications/send', async (req, res) => {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi: to, subject, text gereklidir.' });
    }

    try {
        await sendEmail({
            to: to,
            subject: subject,
            text: text
        });
        res.status(200).json({ success: true, message: 'E-posta başarıyla gönderildi.' });
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        res.status(500).json({ success: false, message: 'E-posta gönderilemedi.' });
    }
});

const PORT = process.env.PORT || 5003; // Bu servis için yeni bir port

app.listen(PORT, () => console.log(`Notification Service http://localhost:${PORT} adresinde çalışıyor.`));