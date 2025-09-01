const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const amqp = require('amqp-connection-manager');
const colors = require('colors');
const axios = require('axios');

const app = express();
console.log('[Search Service] Başlatılıyor...'.yellow);

// =========================================================================
//                             BAĞLANTI AYARLARI
// =========================================================================
const PRODUCT_SERVICE_URL = 'http://localhost:5002';
const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || 'http://localhost:9200';
const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost';
const PORT = 5008;

const client = new Client({
    node: ELASTICSEARCH_HOST,
    requestTimeout: 10000,
    maxRetries: 5,
});

// =========================================================================
//                     MEVCUT ÜRÜNLERİ İNDEKSLEME
// =========================================================================
async function indexExistingProducts() {
    try {
        console.log(`[Search Service] Mevcut ürünler ${PRODUCT_SERVICE_URL} adresinden alınıyor...`.cyan);
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/?limit=10000`);
        const products = response.data.data;

        if (!products || products.length === 0) {
            console.log('[Search Service] İndekslenecek mevcut ürün bulunamadı.'.yellow);
            return;
        }

        console.log(`[Search Service] ${products.length} adet mevcut ürün indekslenmek üzere hazırlanıyor...`.cyan);
        const body = products.flatMap(doc => [
            { index: { _index: 'products', _id: doc._id } },
            {
                name: doc.name,
                description: doc.description,
                category: doc.categoryInfo?.name || '',
            }
        ]);
        await client.bulk({ refresh: true, body });
        console.log(`[Search Service] ${products.length} ürün başarıyla indekslendi!`.green.bold);
    } catch (error) {
        console.error('[Search Service] KRİTİK HATA: Mevcut ürünler alınamadı!'.red.bold);
        if (error.code === 'ECONNREFUSED') {
            console.error('Bağlantı Hatası: Product servisine ulaşılamıyor. Lütfen product-service\'in çalıştığından emin olun.'.red);
        } else {
            console.error('Hata Detayı:', error.message);
        }
        console.log('[Search Service] 15 saniye sonra tekrar denenecek...'.yellow);
        setTimeout(indexExistingProducts, 15000);
    }
}

// =========================================================================
//                       RABBITMQ DİNLEYİCİSİ
// =========================================================================
function startProductListeners() {
    try {
        const connection = amqp.connect([AMQP_URL]);
        connection.on('connect', () => console.log('[Search Service] RabbitMQ bağlantısı başarılı!'.green));
        connection.on('disconnect', (err) => console.error('[Search Service] RabbitMQ bağlantısı koptu!'.red, err));

        const upsertProduct = async (msg) => {
            try {
                const product = JSON.parse(msg.content.toString());
                await client.index({
                    index: 'products',
                    id: product._id,
                    body: {
                        name: product.name,
                        description: product.description,
                        category: product.categoryInfo?.name || '',
                    }
                });
                console.log(`[Search Service] Ürün indekslendi: ${product.name}`.green);
                msg.ack();
            } catch (error) {
                console.error('[Search Service] Ürün indekslenirken hata:', error);
                msg.nack();
            }
        };

        const deleteProduct = async (msg) => {
            try {
                const product = JSON.parse(msg.content.toString());
                await client.delete({
                    index: 'products',
                    id: product._id
                });
                console.log(`[Search Service] Ürün silindi: ${product.name}`.yellow);
                msg.ack();
            } catch (error) {
                console.error('[Search Service] Ürün silinirken hata:', error);
                msg.nack();
            }
        };

        const channelWrapper = connection.createChannel({
            setup: (channel) => Promise.all([
                channel.assertQueue('product.created', { durable: true }),
                channel.consume('product.created', upsertProduct),
                channel.assertQueue('product.updated', { durable: true }),
                channel.consume('product.updated', upsertProduct),
                channel.assertQueue('product.deleted', { durable: true }),
                channel.consume('product.deleted', deleteProduct),
            ]).then(() => console.log('[Search Service] Ürün kuyrukları dinleniyor...'.cyan))
        });
        
    } catch (error) {
        console.error('[Search Service] RabbitMQ dinleyicisi başlatılamadı!'.red.bold, error);
    }
}

app.get('/', async (req, res) => {
    const { q } = req.query;
    console.log(`[Search Service] Arama isteği alındı. Sorgu: "${q}"`);

    if (!q) {
        return res.status(400).json({ message: 'Arama yapmak için "q" parametresi zorunludur.' });
    }
    
    try {
        const searchParams = {
            index: 'products',
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: [
                            'name^3',         
                            'description',
                            'category'
                        ],
                        fuzziness: "AUTO", 
                        type: "best_fields"
                    }
                }
            }
        };
        console.log('[Search Service] Elasticsearch sorgusu gönderiliyor...'.cyan);
        const response = await client.search(searchParams);
        
        // Farklı Elasticsearch sürümleri için uyumlu sonuç okuma
        let results = [];
        if (response.body && response.body.hits && response.body.hits.hits) {
            // Elasticsearch v7/v8
            results = response.body.hits.hits.map(hit => hit._source);
        } else if (response.hits && response.hits.hits) {
            // Elasticsearch v6 ve öncesi
            results = response.hits.hits.map(hit => hit._source);
        } else {
            console.error('[Search Service] Beklenmeyen response formatı:', JSON.stringify(response, null, 2));
            throw new Error('Elasticsearch response formatı tanınmıyor');
        }

        console.log(`[Search Service] "${q}" sorgusu için ${results.length} sonuç bulundu.`.green);
        res.json(results);

    } catch (error) {
        console.error('[Search Service] KRİTİK HATA: Elasticsearch araması başarısız oldu.'.red);
        console.error('Hata detayı:', error);
        
        // Debug için response'u logla
        if (error.meta && error.meta.body) {
            console.error('Elasticsearch error body:', error.meta.body);
        }
        
        res.status(500).json({ 
            message: 'Arama servisi veritabanına bağlanamadı veya arama sırasında bir hata oluştu.',
            error: error.message 
        });
    }
});

app.listen(PORT, async () => {
    console.log(`[Search Service] http://localhost:${PORT} adresinde başarıyla başlatıldı.`.green.bold);
    await indexExistingProducts();
    startProductListeners();
});