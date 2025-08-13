const advancedResults = (model, populate) => async (req, res, next) => {
    let query;

    // Kopyalanan sorgu objesi
    const reqQuery = { ...req.query };

    // Filtreleme için hariç tutulacak alanlar
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Sorgu string'ini oluştur
    let queryStr = JSON.stringify(reqQuery);

    // MongoDB operatörleri ($gt, $gte, vb.) için düzenleme
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Modeli sorgula
    query = model.find(JSON.parse(queryStr));

    // 'select' ile alan seçimi
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // 'sort' ile sıralama
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Varsayılan: en yeni
    }

    // Sayfalama (Pagination)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // İlişkili verileri getirme (populate)
    if (populate) {
        query = query.populate(populate);
    }

    // Sorguyu çalıştır
    const results = await query;

    // Sayfalama sonucu
    const pagination = {};
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        total,
        pagination,
        data: results
    };

    next();
};

module.exports = advancedResults;