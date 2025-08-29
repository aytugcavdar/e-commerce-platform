const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');

const app = express();


console.log('[Search Service] Başlatılıyor...');

const client = new Client({ node: 'http://localhost:9200' });

app.get('/', async (req, res) => {
    const { q } = req.query;
    console.log(`[Search Service] Arama isteği alındı. Sorgu: "${q}"`);

    if (!q) {
        return res.status(400).json({ message: 'Arama yapmak için "q" parametresi zorunludur.' });
    }
    
    try {
       
        const response = await client.search({
            index: 'products',
            query: {
                multi_match: {
                    query: q,
                    fields: ['name', 'description', 'category'],
                },
            },
        });
        
        
        const results = response.hits.hits.map(hit => hit._source);
        console.log(`[Search Service] "${q}" sorgusu için ${results.length} sonuç bulundu.`);
        res.json(results);

    } catch (error) {
        console.error('[Search Service] KRİTİK HATA: Elasticsearch araması başarısız oldu. Asıl Hata:', error);
        res.status(500).send('Arama servisi veritabanına bağlanamadı veya arama sırasında bir hata oluştu.');
    }
});

const PORT = 5008;

app.listen(PORT, () => {
    console.log(`[Search Service] Elasticsearch bağlantısı hazır.`);
    console.log(`[Search Service] http://localhost:${PORT} adresinde başarıyla başlatıldı.`);
});