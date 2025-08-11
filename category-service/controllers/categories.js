const Category = require('../models/Category');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
// @desc    Tüm kategorileri getir (Hiyerarşik yapı ile)
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
    const { includeChildren = 'true' } = req.query;
    
    let query;
    
    if (includeChildren === 'true') {
        // Hiyerarşik yapı ile getir (sadece ana kategoriler + alt kategorileri)
        query = Category.find({ parent: null }).populate({
            path: 'children',
            select: 'name slug description parent createdAt'
        });
    } else {
        // Düz liste olarak getir
        query = Category.find().populate('parent', 'name slug');
    }
    
    const categories = await query.sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Kategoriye göre alt kategorileri getir
// @route   GET /api/categories/:id/children
// @access  Public
exports.getCategoryChildren = asyncHandler(async (req, res, next) => {
    const parentCategory = await Category.findById(req.params.id);

    if (!parentCategory) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kategori bulunamadı`, 404));
    }

    const children = await Category.find({ parent: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        parent: parentCategory.name,
        count: children.length,
        data: children
    });
});

// @desc    Tek bir kategori getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id)
        .populate('parent', 'name slug')
        .populate('children', 'name slug description');

    if (!category) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kategori bulunamadı`, 404));
    }

    res.status(200).json({ 
        success: true, 
        data: category 
    });
});

// @desc    Yeni bir kategori oluştur
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
    // Kategoriyi oluşturan kullanıcının ID'sini req.user'dan al
    req.body.user = req.user.id;

    // Eğer bir üst kategori (parent) belirtilmişse, var olup olmadığını kontrol et
    if (req.body.parent) {
        const parentCategory = await Category.findById(req.body.parent);
        if (!parentCategory) {
            return next(new ErrorResponse(`Üst kategori (ID: ${req.body.parent}) bulunamadı`, 404));
        }

        // Alt kategorinin altında başka alt kategori olmasını önle (sadece 2 seviye)
        if (parentCategory.parent) {
            return next(new ErrorResponse('Alt kategorinin altında başka alt kategori oluşturamazsınız', 400));
        }
    }

    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await Category.findOne({ 
        name: req.body.name,
        parent: req.body.parent || null 
    });

    if (existingCategory) {
        return next(new ErrorResponse('Bu isimde bir kategori zaten mevcut', 400));
    }

    const category = await Category.create(req.body);

    // Oluşturulan kategoriyi populate ile geri döndür
    const populatedCategory = await Category.findById(category._id)
        .populate('parent', 'name slug');

    res.status(201).json({
        success: true,
        data: populatedCategory
    });
});

// @desc    Kategoriyi güncelle
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kategori bulunamadı`, 404));
    }

    // Eğer parent güncellenmek isteniyorsa kontrol et
    if (req.body.parent) {
        const parentCategory = await Category.findById(req.body.parent);
        if (!parentCategory) {
            return next(new ErrorResponse(`Üst kategori (ID: ${req.body.parent}) bulunamadı`, 404));
        }

        // Kategorinin kendisini parent yapmasını önle
        if (req.body.parent === req.params.id) {
            return next(new ErrorResponse('Kategori kendisinin üst kategorisi olamaz', 400));
        }

        // Döngüsel referansı önle
        if (parentCategory.parent && parentCategory.parent.toString() === req.params.id) {
            return next(new ErrorResponse('Döngüsel kategori referansı oluşturamazsınız', 400));
        }
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }).populate('parent', 'name slug');

    res.status(200).json({ 
        success: true, 
        data: category 
    });
});

// @desc    Kategoriyi sil
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    console.log(`🗑️ Kategori silme işlemi başlatıldı - ID: ${req.params.id}`);
    
    const category = await Category.findById(req.params.id);

    if (!category) {
        console.log(`❌ Kategori bulunamadı - ID: ${req.params.id}`);
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kategori bulunamadı`, 404));
    }

    console.log(`📋 Kategori bulundu: ${category.name}`);

    try {
        // Alt kategorileri kontrol et
        const childCategories = await Category.find({ parent: req.params.id });
        
        if (childCategories.length > 0) {
            console.log(`🔄 ${childCategories.length} alt kategori bulundu`);
            
            // Alt kategorilerin parent'ını null yap (silmek yerine)
            await Category.updateMany(
                { parent: req.params.id }, 
                { $unset: { parent: 1 } }
            );
            
            console.log(`✅ Alt kategoriler ana kategori olarak güncellendi`);
        }

        // Ana kategoriyi sil
        await Category.findByIdAndDelete(req.params.id);
        console.log(`✅ Ana kategori silindi: ${category.name}`);

        res.status(200).json({ 
            success: true, 
            message: `'${category.name}' kategorisi başarıyla silindi. ${childCategories.length > 0 ? `${childCategories.length} alt kategori ana kategori oldu.` : ''}`,
            data: {} 
        });
    } catch (error) {
        console.error(`❌ Kategori silme hatası:`, error);
        return next(new ErrorResponse(`Kategori silinirken hata oluştu: ${error.message}`, 500));
    }
});

// @desc    Kategori istatistikleri getir
// @route   GET /api/categories/stats
// @access  Public
exports.getCategoryStats = asyncHandler(async (req, res, next) => {
    const stats = await Category.aggregate([
        {
            $group: {
                _id: { $ifNull: ["$parent", "main"] },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                totalCategories: { $sum: "$count" },
                mainCategories: {
                    $sum: {
                        $cond: [{ $eq: ["$_id", "main"] }, "$count", 0]
                    }
                },
                subCategories: {
                    $sum: {
                        $cond: [{ $ne: ["$_id", "main"] }, "$count", 0]
                    }
                }
            }
        }
    ]);

    const result = stats[0] || {
        totalCategories: 0,
        mainCategories: 0,
        subCategories: 0
    };

    res.status(200).json({
        success: true,
        data: result
    });
});