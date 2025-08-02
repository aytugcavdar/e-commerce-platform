const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

// Elasticsearch bağlantısı
const esClient = new Client({ node: 'http://localhost:9200' });

// Arama endpoint'i
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const { body } = await esClient.search({
            index: 'products',
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: ['name', 'description', 'category.name']
                    }
                }
            }
        });
        res.json(body.hits.hits.map(hit => hit._source));
    } catch (error) {
        res.status(500).send('Arama sırasında hata oluştu.');
    }
});

// product-service'ten gelen mesajları dinleyerek Elasticsearch'ü güncel tut
async function startProductSyncListener() {
    // ... RabbitMQ dinleme kodu ...
    // 'product.created', 'product.updated' gibi mesajları dinle
    // Gelen mesaja göre esClient.index(), esClient.update() veya esClient.delete() yap.
}

app.listen(5008, () => {
    console.log('Search Service 5008 portunda çalışıyor.');
    startProductSyncListener();
});