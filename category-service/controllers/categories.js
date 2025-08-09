const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Tüm kategorileri getir
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
    // Sadece ana kategorileri (parent'ı olmayanları) getirip,
    // alt kategorileri populate ile doldurabiliriz. Veya hepsini düz liste olarak dönebiliriz.
    // Şimdilik hepsini listeleyelim.
    const categories = await Category.find(); //.populate('children');

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Tek bir kategori getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kategori bulunamadı`, 404));
    }

    res.status(200).json({ success: true, data: category });
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
    }

    const category = await Category.create(req.body);

    res.status(201).json({
        success: true,
        data: category
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

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: category });
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
        // Alt kategorileri kontrol et ve sil
        const childCategories = await Category.find({ parent: req.params.id });
        
        if (childCategories.length > 0) {
            console.log(`🔄 ${childCategories.length} alt kategori bulundu, siliniyor...`);
            await Category.deleteMany({ parent: req.params.id });
            console.log(`✅ Alt kategoriler silindi`);
        }

        // Ana kategoriyi sil
        await Category.findByIdAndDelete(req.params.id);
        console.log(`✅ Ana kategori silindi: ${category.name}`);

        res.status(200).json({ 
            success: true, 
            message: `'${category.name}' kategorisi başarıyla silindi`,
            data: {} 
        });
    } catch (error) {
        console.error(`❌ Kategori silme hatası:`, error);
        return next(new ErrorResponse(`Kategori silinirken hata oluştu: ${error.message}`, 500));
    }
});