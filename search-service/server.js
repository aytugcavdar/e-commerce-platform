const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const amqp = require('amqp-connection-manager');
const colors = require('colors');
const axios = require('axios');

const app = express();
app.use(express.json());

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
//                     ELASTICSEARCH INDEX YARATMA VE TEMİZLEME
// =========================================================================
async function resetIndex() {
    try {
        console.log('[Search Service] Index sıfırlanıyor...'.yellow);
        
        // Mevcut index'i sil
        try {
            await client.indices.delete({ index: 'products' });
            console.log('[Search Service] Mevcut index silindi.'.cyan);
        } catch (error) {
            if (error.statusCode !== 404) {
                console.log('[Search Service] Index silinirken hata (normal olabilir):', error.message);
            }
        }

        // Yeni index oluştur (DÜZELTİLMİŞ MAPPING)
        await client.indices.create({
            index: 'products',
            body: {
                mappings: {
                    properties: {
                        // _id alanını mapping'den çıkardık (otomatik olarak oluşturuluyor)
                        name: { 
                            type: 'text', 
                            analyzer: 'standard',
                            fields: {
                                keyword: { type: 'keyword' }
                            }
                        },
                        description: { 
                            type: 'text', 
                            analyzer: 'standard' 
                        },
                        price: { type: 'float' },
                        category: {
                            properties: {
                                _id: { type: 'keyword' },
                                name: { 
                                    type: 'text', 
                                    analyzer: 'standard',
                                    fields: {
                                        keyword: { type: 'keyword' }
                                    }
                                },
                                slug: { type: 'keyword' }
                            }
                        },
                        categoryInfo: {
                            properties: {
                                name: { 
                                    type: 'text', 
                                    analyzer: 'standard',
                                    fields: {
                                        keyword: { type: 'keyword' }
                                    }
                                },
                                slug: { type: 'keyword' }
                            }
                        },
                        stock: { type: 'integer' },
                        averageRating: { type: 'float' },
                        images: {
                            properties: {
                                public_id: { type: 'keyword' },
                                url: { type: 'keyword' }
                            }
                        },
                        attributes: {
                            properties: {
                                key: { type: 'keyword' },
                                value: { type: 'text' }
                            }
                        },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                },
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                    analysis: {
                        analyzer: {
                            standard: {
                                type: 'standard'
                            }
                        }
                    }
                }
            }
        });
        
        console.log('[Search Service] Yeni index başarıyla oluşturuldu!'.green);
        return true;
    } catch (error) {
        console.error('[Search Service] Index oluşturulurken hata:', error.message);
        return false;
    }
}

// =========================================================================
//                     MEVCUT ÜRÜNLERİ İNDEKSLEME
// =========================================================================
async function indexExistingProducts() {
    try {
        console.log(`[Search Service] Mevcut ürünler ${PRODUCT_SERVICE_URL} adresinden alınıyor...`.cyan);
        
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/?limit=10000`, {
            timeout: 30000
        });
        
        console.log('[Search Service] Product Service yanıtı:', {
            status: response.status,
            hasData: !!response.data,
            dataStructure: response.data ? Object.keys(response.data) : 'No data'
        });

        let products = [];

        // Response formatı kontrolü
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            products = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
            products = response.data;
        } else {
            console.error('[Search Service] Beklenmeyen response formatı:', response.data);
            return;
        }

        if (!products || products.length === 0) {
            console.log('[Search Service] İndekslenecek mevcut ürün bulunamadı.'.yellow);
            return;
        }

        console.log(`[Search Service] ${products.length} adet mevcut ürün bulundu. İndeksleniyor...`.cyan);

        // Tek tek index et
        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                console.log(`[Search Service] İndeksleniyor: ${product.name} (ID: ${product._id})`);
                
                const categoryObj = product.categoryInfo ? {
                    _id: product.categoryId,
                    name: product.categoryInfo.name,
                    slug: product.categoryInfo.slug,
                } : null;

                const indexData = {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    images: product.images || [],
                    attributes: product.attributes || [],
                    category: categoryObj,
                    categoryInfo: product.categoryInfo,
                    stock: product.stock,
                    averageRating: product.averageRating || 0,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                };

                await client.index({
                    index: 'products',
                    id: product._id,
                    body: indexData,
                    refresh: false // performans için false
                });

                successCount++;
                console.log(`[Search Service] ✅ Başarılı: ${product.name}`.green);

            } catch (error) {
                errorCount++;
                console.error(`[Search Service] ❌ Hata (${product.name}):`, error.message);
            }
        }

        // Manuel refresh
        await client.indices.refresh({ index: 'products' });

        console.log(`[Search Service] İndeksleme tamamlandı! ✅ ${successCount} başarılı, ❌ ${errorCount} hatalı`.green.bold);
        
        // Index'teki toplam döküman sayısını kontrol et (güvenli erişim)
        const count = await client.count({ index: 'products' });
        const totalDocs = count?.body?.count ?? count?.count ?? 0;
        console.log(`[Search Service] Index'teki toplam döküman sayısı: ${totalDocs}`.green);

        return true;

    } catch (error) {
        console.error('[Search Service] KRİTİK HATA: Mevcut ürünler alınamadı!'.red.bold);

        if (error.code === 'ECONNREFUSED') {
            console.error('Bağlantı Hatası: Product servisine ulaşılamıyor. Lütfen product-service\'in çalıştığından emin olun.'.red);
            console.log('[Search Service] 15 saniye sonra tekrar denenecek...'.yellow);
            setTimeout(indexExistingProducts, 15000);
        } else if (error.response) {
            console.error('HTTP Hata:', error.response.status, error.response.statusText);
            console.error('Response Data:', error.response.data);
        } else {
            console.error('Hata Detayı:', error.message);
        }

        return false;
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
                const data = JSON.parse(msg.content.toString());
                const product = data.product || data;

                console.log(`[Search Service] Ürün güncelleniyor: ${product.name} (${product._id})`);

                const categoryObj = product.categoryInfo ? {
                    _id: product.categoryId,
                    name: product.categoryInfo.name,
                    slug: product.categoryInfo.slug,
                } : null;

                await client.index({
                    index: 'products',
                    id: product._id,
                    body: {
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        images: product.images || [],
                        attributes: product.attributes || [],
                        category: categoryObj,
                        categoryInfo: product.categoryInfo,
                        stock: product.stock,
                        averageRating: product.averageRating || 0,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                    }
                });
                
                console.log(`[Search Service] Ürün indekslendi: ${product.name}`.green);
                msg.ack();
            } catch (error) {
                console.error('[Search Service] Ürün indekslenirken hata:', error.message);
                console.error('Message content:', msg.content.toString());
                msg.nack();
            }
        };

        const deleteProduct = async (msg) => {
            try {
                const data = JSON.parse(msg.content.toString());
                const productId = data.productId || data._id;
                
                await client.delete({
                    index: 'products',
                    id: productId
                });
                
                console.log(`[Search Service] Ürün silindi: ${productId}`.yellow);
                msg.ack();
            } catch (error) {
                console.error('[Search Service] Ürün silinirken hata:', error.message);
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

// =========================================================================
//                           API ENDPOINTS
// =========================================================================

// Ana arama endpoint'i
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
                    bool: {
                        should: [
                            {
                                multi_match: {
                                    query: q,
                                    fields: [
                                        'name^4', 
                                        'category.name^3', 
                                        'categoryInfo.name^3', 
                                        'description'
                                    ],
                                    type: 'best_fields',
                                    fuzziness: "AUTO"
                                }
                            },
                            {
                                multi_match: {
                                    query: q,
                                    fields: [
                                        'name', 
                                        'category.name', 
                                        'categoryInfo.name', 
                                        'description'
                                    ],
                                    type: 'phrase_prefix'
                                }
                            },
                            {
                                wildcard: {
                                    "name.keyword": {
                                        value: `*${q.toLowerCase()}*`
                                    }
                                }
                            }
                        ],
                        minimum_should_match: 1,
                        filter: [
                            { range: { stock: { gt: 0 } } }
                        ]
                    }
                },
                sort: [
                    { _score: { order: 'desc' } },
                    { averageRating: { order: 'desc' } }
                ],
                size: 50
            }
        };

        console.log('[Search Service] Elasticsearch sorgusu gönderiliyor...'.cyan);
        
        const response = await client.search(searchParams);
        
        let results = [];
        if (response.body && response.body.hits && response.body.hits.hits) {
            results = response.body.hits.hits.map(hit => hit._source);
        } else if (response.hits && response.hits.hits) {
            results = response.hits.hits.map(hit => hit._source);
        }

        console.log(`[Search Service] "${q}" sorgusu için ${results.length} sonuç bulundu.`.green);
        res.json(results);

    } catch (error) {
        console.error('[Search Service] Arama hatası:', error.message);
        if (error.meta && error.meta.body) {
            console.error('Elasticsearch error:', JSON.stringify(error.meta.body, null, 2));
        }
        
        res.status(500).json({ 
            message: 'Arama sırasında bir hata oluştu.',
            error: error.message 
        });
    }
});

// Debug endpoint'i
app.get('/debug', async (req, res) => {
    try {
        const count = await client.count({ index: 'products' });
        const health = await client.cluster.health();
        const mapping = await client.indices.getMapping({ index: 'products' });
        
        res.json({
            elasticsearch: {
                cluster_health: health.body,
                products_count: count.body.count,
                mapping: mapping.body.products.mappings
            },
            service: {
                name: 'Search Service',
                version: '1.0.0',
                uptime: process.uptime()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manuel reindex endpoint'i
app.post('/reindex', async (req, res) => {
    try {
        console.log('[Search Service] Manuel reindex başlatıldı...');
        
        // Önce index'i sıfırla
        const resetSuccess = await resetIndex();
        if (!resetSuccess) {
            throw new Error('Index sıfırlanamadı');
        }

        // Sonra ürünleri indeksle
        const indexSuccess = await indexExistingProducts();
        if (!indexSuccess) {
            throw new Error('Ürünler indekslenemedi');
        }

        res.json({ message: 'Reindex başarıyla tamamlandı' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =========================================================================
//                           SERVER BAŞLATMA
// =========================================================================
app.listen(PORT, async () => {
    console.log(`[Search Service] http://localhost:${PORT} adresinde başarıyla başlatıldı.`.green.bold);
    
    try {
        // Elasticsearch bağlantısını test et
        await client.ping();
        console.log('[Search Service] Elasticsearch bağlantısı başarılı!'.green);
        
        // Index'i sıfırla ve yeniden oluştur
        const resetSuccess = await resetIndex();
        if (resetSuccess) {
            // 3 saniye bekle ve ürünleri indeksle
            setTimeout(indexExistingProducts, 3000);
        }
        
        // RabbitMQ dinleyicilerini başlat
        setTimeout(startProductListeners, 5000);
        
    } catch (error) {
        console.error('[Search Service] Başlatma hatası:', error.message);
    }
});