const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');

const app = express();
app.use(cors());

console.log('[Search Service] Başlatılıyor...');

// Elasticsearch client'ını yapılandırıyoruz.
// Adres doğru, bağlantıyı istek geldiğinde deneyecek.
const client = new Client({ node: 'http://localhost:9200' });

app.get('/', async (req, res) => {
    const { q } = req.query;
    console.log(`[Search Service] Arama isteği alındı. Sorgu: "${q}"`);

    if (!q) {
        return res.status(400).json({ message: 'Arama yapmak için "q" parametresi zorunludur.' });
    }
    
    try {
        const { body } = await client.search({
            index: 'products',
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: ['name', 'description', 'category'],
                    },
                },
            },
        });
        
        const results = body.hits.hits.map(hit => hit._source);
        console.log(`[Search Service] "${q}" sorgusu için ${results.length} sonuç bulundu.`);
        res.json(results);

    } catch (error) {
        // Hata olursa, burada detaylı olarak göreceğiz.
        console.error('[Search Service] KRİTİK HATA: Elasticsearch ile iletişim kurulamadı.', error.meta.body);
        res.status(500).send('Arama servisi veritabanına bağlanamadı.');
    }
});

const PORT = 5008;

// Sunucuyu doğrudan başlatıyoruz.
app.listen(PORT, () => {
    console.log(`[Search Service] Elasticsearch bağlantısı hazır.`);
    console.log(`[Search Service] http://localhost:${PORT} adresinde başarıyla başlatıldı.`);
});