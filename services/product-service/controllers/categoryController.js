const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter, CloudinaryHelper },
  constants: { httpStatus, errorMessages },
  logger,
} = require("@ecommerce/shared-utils");

class CategoryController {
  /**
   * Get all categories
   * @route GET /api/categories
   * @access Public
   */
  static getAllCategories = asyncHandler(async (req, res) => {
    const { isActive, isFeatured, parentId, includeChildren } = req.query;

    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (parentId) {
      filter.parent = parentId;
    } else if (parentId === null || req.query.rootOnly === "true") {
      filter.parent = null;
    }

    let query = Category.find(filter).sort({ order: 1, name: 1 });

    if (includeChildren === "true") {
      query = query.populate({
        path: "children",
        match: { isActive: true },
        select: "name isActive slug image order",
      });
    }

    const categories = await query;

    res
      .status(httpStatus.OK)
      .json(
        ResponseFormatter.success(
          categories,
          "Kategoriler başarıyla getirildi"
        )
      );
  });

  /**
   * Get category tree
   * @route GET /api/categories/tree
   * @access Public
   */
  static getCategoryTree = asyncHandler(async (req, res) => {
    const rootCategories = await Category.find({
      parent: null,
      isActive: true,
    })
      .sort({ order: 1 })
      .populate({
        path: "children",
        match: { isActive: true },
        populate: {
          path: "children",
          match: { isActive: true },
        },
      });

    res
      .status(httpStatus.OK)
      .json(
        ResponseFormatter.success(
          { tree: rootCategories },
          "Kategori ağacı getirildi"
        )
      );
  });

  /**
   * Get category by ID
   * @route GET /api/categories/:id
   * @access Public
   */
  static getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id).populate({
      path: "parent",
      match: { isActive: true },
      select: "name slug",
      populate: {
        path: "children",
        match: { isActive: true },
        select: "name slug image",
      },
    });

    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    res
      .status(httpStatus.OK)
      .json(
        ResponseFormatter.success(
          category,
          "Kategori başarıyla getirildi"
        )
      );
  });

  /**
   * Get category by slug
   * @route GET /api/categories/slug/:slug
   * @access Public
   */
  static getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate('parent', 'name slug')
      .populate('children', 'name slug image');

    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(category, 'Kategori getirildi')
    );
  });

  /**
   * Create a new category
   * @route POST /api/categories
   * @access Private/Admin
   */
  static createCategory = asyncHandler(async (req, res) => {
    const { name, description, parent, isActive, isFeatured } = req.body;

    // Kategori kontrolü
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(httpStatus.CONFLICT).json(
        ResponseFormatter.error(errorMessages.CATEGORY_ALREADY_EXISTS, httpStatus.CONFLICT)
      );
    }

    // Parent kategori kontrolü
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.PARENT_CATEGORY_NOT_FOUND, httpStatus.BAD_REQUEST)
        );
      }
    }

    // Resim yükleme
    let imageData = {};
    if (req.file) {
      try {
        const result = await CloudinaryHelper.uploadFromBuffer(
          req.file.buffer,
          'categories'
        );
        imageData = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (error) {
        logger.error('Kategori resmi yüklenirken hata oluştu:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    // Yeni kategori oluştur
    const newCategory = new Category({
      name,
      description,
      parent: parent || null,
      image: imageData,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
    });

    try {
      await newCategory.save();

      res.status(httpStatus.CREATED).json(
        ResponseFormatter.success(newCategory, 'Kategori başarıyla oluşturuldu')
      );
    } catch (error) {
      logger.error('Kategori oluşturulurken hata:', error);

      // Eğer resim yüklendiyse geri al
      if (imageData.public_id) {
        try {
          await CloudinaryHelper.deleteFile(imageData.public_id);
        } catch (deleteError) {
          logger.error('Resim geri alınamadı:', deleteError);
        }
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Update a category
   * @route PUT /api/categories/:id
   * @access Private/Admin
   */
  static updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Kategori kontrolü
    const category = await Category.findById(id);
    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // İsim değişikliği kontrolü
    if (updates.name && updates.name !== category.name) {
      const existingCategory = await Category.findOne({ name: updates.name });
      if (existingCategory) {
        return res.status(httpStatus.CONFLICT).json(
          ResponseFormatter.error(errorMessages.CATEGORY_ALREADY_EXISTS, httpStatus.CONFLICT)
        );
      }
    }

    // Parent kategori kontrolü
    if (updates.parent) {
      // Kendi kendine parent olamaz
      if (updates.parent === id) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.CATEGORY_CANNOT_BE_OWN_PARENT, httpStatus.BAD_REQUEST)
        );
      }

      // Alt kategori, ana kategori yapılamaz
      const children = await Category.find({ parent: id });
      const childIds = children.map(c => c._id.toString());
      if (childIds.includes(updates.parent)) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.SUBCATEGORY_CANNOT_BE_PARENT, httpStatus.BAD_REQUEST)
        );
      }

      // Parent kategorinin var olduğunu kontrol et
      const parentCategory = await Category.findById(updates.parent);
      if (!parentCategory) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.PARENT_CATEGORY_NOT_FOUND, httpStatus.BAD_REQUEST)
        );
      }
    }

    let oldImagePublicId = null;

    // Yeni resim yükleme
    if (req.file) {
      try {
        // Yeni resmi yükle
        const result = await CloudinaryHelper.uploadFromBuffer(
          req.file.buffer,
          'categories'
        );

        // Eski resim bilgisini sakla
        oldImagePublicId = category.image?.public_id;

        updates.image = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (error) {
        logger.error('Kategori resmi güncellenirken hata oluştu:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    try {
      // Kategoriyi güncelle
      const updatedCategory = await Category.findByIdAndUpdate(id, updates, { 
        new: true,
        runValidators: true 
      });

      // Güncelleme başarılı, eski resmi sil
      if (oldImagePublicId) {
        try {
          await CloudinaryHelper.deleteFile(oldImagePublicId);
        } catch (deleteError) {
          logger.warn('Eski resim silinirken hata:', deleteError);
          // Eski resim silinemese bile güncelleme başarılı
        }
      }

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(updatedCategory, 'Kategori başarıyla güncellendi')
      );
    } catch (error) {
      logger.error('Kategori güncellenirken hata:', error);

      // Güncelleme başarısız, yeni yüklenen resmi sil
      if (updates.image?.public_id) {
        try {
          await CloudinaryHelper.deleteFile(updates.image.public_id);
        } catch (deleteError) {
          logger.error('Yeni resim geri alınamadı:', deleteError);
        }
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Delete a category
   * @route DELETE /api/categories/:id
   * @access Private/Admin
   */
  static deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Kategori kontrolü
    const category = await Category.findById(id);
    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Alt kategori kontrolü
    const children = await Category.find({ parent: id });
    if (children.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.CATEGORY_HAS_SUBCATEGORIES, httpStatus.BAD_REQUEST)
      );
    }

    // Ürün kontrolü
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.CATEGORY_HAS_PRODUCTS, httpStatus.BAD_REQUEST)
      );
    }

    try {
      // Resim silme
      if (category.image?.public_id) {
        try {
          await CloudinaryHelper.deleteFile(category.image.public_id);
        } catch (error) {
          logger.warn('Kategori resmi silinemedi:', error);
          // Resim silinemese bile kategoriyi silmeye devam et
        }
      }

      // Kategoriyi sil
      await category.deleteOne();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Kategori başarıyla silindi')
      );
    } catch (error) {
      logger.error('Kategori silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Update category order
   * @route PUT /api/categories/order
   * @access Private/Admin
   */
  static updateCategoryOrder = asyncHandler(async (req, res) => {
    const { categoryOrders } = req.body;

    // Validation
    if (!categoryOrders || !Array.isArray(categoryOrders)) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.INVALID_INPUT, httpStatus.BAD_REQUEST)
      );
    }

    if (categoryOrders.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.MISSING_REQUIRED_FIELDS, httpStatus.BAD_REQUEST)
      );
    }

    // Her öğenin id ve order alanına sahip olduğunu kontrol et
    const isValid = categoryOrders.every(item => 
      item.id && typeof item.order === 'number'
    );

    if (!isValid) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.INVALID_INPUT, httpStatus.BAD_REQUEST)
      );
    }

    try {
      const updatePromises = categoryOrders.map(item =>
        Category.findByIdAndUpdate(
          item.id, 
          { order: item.order },
          { runValidators: true }
        )
      );

      await Promise.all(updatePromises);

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Kategori sıralaması güncellendi')
      );
    } catch (error) {
      logger.error('Kategori sıralaması güncellenirken hata:', error);
      
      // MongoDB hataları için özel kontrol
      if (error.name === 'CastError') {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.INVALID_ID_FORMAT, httpStatus.BAD_REQUEST)
        );
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });
}

module.exports = CategoryController;