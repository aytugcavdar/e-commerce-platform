const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter, CloudinaryHelper },
  constants: { httpStatus, errorMessages },
  logger,
} = require("@ecommerce/shared-utils");

class ProductController {
    /**  * Get all products
   * @route GET /api/products
   * @access Public
   */
    static getAllProducts = asyncHandler(async (req, res) => {
      const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      status = 'active',
      tags
    } = req.query;
    const filter ={};

    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      filter.category = category;
    }
    if (brand) {
      filter.brand = brand;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

   
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        {
          products,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        },
        'Ürünler başarıyla getirildi'
      )
    );
  });

    /**  * Get product by ID
   * @route GET /api/products/:id
   * @access Public
   */
    static getProductById = asyncHandler(async (req, res) => {
      const { id } = req.params;

      const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('brand', 'name slug logo website');

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(product, 'Ürün başarıyla getirildi')
    );


    });
    
    /**  * Get product by slug
   * @route GET /api/products/slug/:slug
   * @access Public
   */
    static getProductBySlug = asyncHandler(async (req, res) => {
     const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('brand', 'name slug logo website');

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(product, 'Ürün getirildi')
    );
  });

    /**  * Create a new product
   * @route POST /api/products
   * @access Private/Admin
   */
    static createProduct = asyncHandler(async (req, res) => {
      const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      tags,
      stock,
      specifications,
      shipping,
      seo,
      isFeatured
    } = req.body;

      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.BAD_REQUEST)
        );
      }
      const brandExists = await Brand.findById(brand);
    if (!brandExists) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.BAD_REQUEST)
      );
    }
     if (subcategory) {
      const subcategoryExists = await Category.findById(subcategory);
      if (!subcategoryExists) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Alt kategori bulunamadı', httpStatus.BAD_REQUEST)
        );
      }
      }
    
      let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => 
          CloudinaryHelper.uploadFromBuffer(file.buffer, 'products')
        );
        
        const results = await Promise.all(uploadPromises);
        
        uploadedImages = results.map((result, index) => ({
          url: result.secure_url,
          public_id: result.public_id,
          isMain: index === 0 // First image is main
        }));
      } catch (error) {
        logger.error('Ürün resimleri yüklenirken hata:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }
    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      brand,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      images: uploadedImages,
      stock: stock || 0,
      specifications,
      shipping,
      seo,
      isFeatured: isFeatured || false,
      seller: req.user?.userId 

    });
    try {
      await product.save();

      
      await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug logo' }
      ]);

      res.status(httpStatus.CREATED).json(
        ResponseFormatter.success(product, 'Ürün başarıyla oluşturuldu')
      );
    } catch (error) {
      logger.error('Ürün oluşturulurken hata:', error);

      // Rollback uploaded images
      if (uploadedImages.length > 0) {
        const deletePromises = uploadedImages.map(img => 
          CloudinaryHelper.deleteFile(img.public_id).catch(err => 
            logger.error('Resim geri alınamadı:', err)
          )
        );
        await Promise.all(deletePromises);
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });
  

    /**  * Update a product
   * @route PUT /api/products/:id
   * @access Private/Admin
   */
    static updateProduct = asyncHandler(async (req, res) => {


     const { id } = req.params;
    const updates = req.body;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    
    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.CATEGORY_NOT_FOUND, httpStatus.BAD_REQUEST)
        );
      }
    }

    
    if (updates.brand) {
      const brandExists = await Brand.findById(updates.brand);
      if (!brandExists) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.BAD_REQUEST)
        );
      }
    }

    
    let newImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => 
          CloudinaryHelper.uploadFromBuffer(file.buffer, 'products')
        );
        
        const results = await Promise.all(uploadPromises);
        
        newImages = results.map(result => ({
          url: result.secure_url,
          public_id: result.public_id,
          isMain: false
        }));

        
        updates.images = [...product.images, ...newImages];
      } catch (error) {
        logger.error('Ürün resimleri güncellenirken hata:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(tag => tag.trim());
    }

    try {
      
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      )
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo');

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(updatedProduct, 'Ürün başarıyla güncellendi')
      );
    } catch (error) {
      logger.error('Ürün güncellenirken hata:', error);

      
      if (newImages.length > 0) {
        const deletePromises = newImages.map(img => 
          CloudinaryHelper.deleteFile(img.public_id).catch(err => 
            logger.error('Yeni resim geri alınamadı:', err)
          )
        );
        await Promise.all(deletePromises);
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

    /**  * Delete a product
   * @route DELETE /api/products/:id
   * @access Private/Admin
   */
    static deleteProduct = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    try {
      
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(img => 
          CloudinaryHelper.deleteFile(img.public_id).catch(err => 
            logger.warn('Ürün resmi silinirken hata:', err)
          )
        );
        await Promise.all(deletePromises);
      }

      
      await product.deleteOne();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Ürün başarıyla silindi')
      );
    } catch (error) {
      logger.error('Ürün silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });
   /**
   * Delete product image
   * @route DELETE /api/products/:id/images/:imageId
   * @access Private/Admin
   */
  static deleteProductImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Resim bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    const image = product.images[imageIndex];

    // Don't allow deleting the main image if it's the only image
    if (image.isMain && product.images.length === 1) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Tek resim olan ana resim silinemez', httpStatus.BAD_REQUEST)
      );
    }

    try {
      // Delete from Cloudinary
      await CloudinaryHelper.deleteFile(image.public_id);

      // Remove from product
      product.images.splice(imageIndex, 1);

      // If deleted image was main, set first remaining image as main
      if (image.isMain && product.images.length > 0) {
        product.images[0].isMain = true;
      }

      await product.save();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(product, 'Resim başarıyla silindi')
      );
    } catch (error) {
      logger.error('Resim silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.IMAGE_DELETE_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Set main product image
   * @route PATCH /api/products/:id/images/:imageId/main
   * @access Private/Admin
   */
  static setMainImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    const imageExists = product.images.some(
      img => img._id.toString() === imageId
    );

    if (!imageExists) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Resim bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    // Set all images to not main
    product.images.forEach(img => {
      img.isMain = img._id.toString() === imageId;
    });

    await product.save();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(product, 'Ana resim başarıyla güncellendi')
    );
  });

    /**
   * Delete a product
   * @route DELETE /api/products/:id
   * @access Private/Admin
   */
  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    try {
      // Delete all product images from Cloudinary
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(img => 
          CloudinaryHelper.deleteFile(img.public_id).catch(err => 
            logger.warn('Ürün resmi silinirken hata:', err)
          )
        );
        await Promise.all(deletePromises);
      }

      // Delete product
      await product.deleteOne();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Ürün başarıyla silindi')
      );
    } catch (error) {
      logger.error('Ürün silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Delete product image
   * @route DELETE /api/products/:id/images/:imageId
   * @access Private/Admin
   */
  static deleteProductImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Resim bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    const image = product.images[imageIndex];

    // Don't allow deleting the main image if it's the only image
    if (image.isMain && product.images.length === 1) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Tek resim olan ana resim silinemez', httpStatus.BAD_REQUEST)
      );
    }

    try {
      // Delete from Cloudinary
      await CloudinaryHelper.deleteFile(image.public_id);

      // Remove from product
      product.images.splice(imageIndex, 1);

      // If deleted image was main, set first remaining image as main
      if (image.isMain && product.images.length > 0) {
        product.images[0].isMain = true;
      }

      await product.save();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(product, 'Resim başarıyla silindi')
      );
    } catch (error) {
      logger.error('Resim silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.IMAGE_DELETE_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Set main product image
   * @route PATCH /api/products/:id/images/:imageId/main
   * @access Private/Admin
   */
  static setMainImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    const imageExists = product.images.some(
      img => img._id.toString() === imageId
    );

    if (!imageExists) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Resim bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    // Set all images to not main
    product.images.forEach(img => {
      img.isMain = img._id.toString() === imageId;
    });

    await product.save();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(product, 'Ana resim başarıyla güncellendi')
    );
  });

  /**
   * Update product stock
   * @route PATCH /api/products/:id/stock
   * @access Private/Admin
   */
  static updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Geçersiz stok değeri', httpStatus.BAD_REQUEST)
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    product.stock = stock;
    
    // Update status based on stock
    if (stock === 0) {
      product.status = 'out-of-stock';
    } else if (product.status === 'out-of-stock') {
      product.status = 'active';
    }

    await product.save();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(product, 'Stok başarıyla güncellendi')
    );
  });

  /**
   * Get featured products
   * @route GET /api/products/featured
   * @access Public
   */
  static getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      isFeatured: true,
      status: 'active'
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .limit(Number(limit))
      .sort('-createdAt')
      .lean();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(products, 'Öne çıkan ürünler getirildi')
    );
  });

  /**
   * Get related products
   * @route GET /api/products/:id/related
   * @access Public
   */
  static getRelatedProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Find products in same category, excluding current product
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      status: 'active'
    })
      .populate('brand', 'name slug logo')
      .limit(Number(limit))
      .sort('-createdAt')
      .lean();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(relatedProducts, 'İlgili ürünler getirildi')
    );
  });
  static getBulkProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json(
      ResponseFormatter.error('Ürün ID listesi gerekli', httpStatus.BAD_REQUEST)
    );
  }

  // ObjectId formatını kontrol et
  const ObjectId = require('mongoose').Types.ObjectId;
  const validIds = ids.filter(id => ObjectId.isValid(id));

  if (validIds.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json(
      ResponseFormatter.error('Geçerli ürün ID\'si bulunamadı', httpStatus.BAD_REQUEST)
    );
  }

  try {
    const products = await Product.find({ 
      _id: { $in: validIds },
      status: 'active'  // Sadece aktif ürünleri getir
    })
    .select('_id name price discountPrice images stock status')  // Sadece gerekli alanlar
    .lean();

    if (products.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Ürün bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    // Bulunamayan ID'leri logla
    const foundIds = products.map(p => p._id.toString());
    const notFoundIds = validIds.filter(id => !foundIds.includes(id.toString()));
    
    if (notFoundIds.length > 0) {
      logger.warn(`Some products not found: ${notFoundIds.join(', ')}`);
    }

    logger.info(`✅ Bulk products fetched: ${products.length} products`);

    return res.status(httpStatus.OK).json(
      ResponseFormatter.success(products, 'Ürünler getirildi')
    );

  } catch (error) {
    logger.error('Bulk products fetch failed:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      ResponseFormatter.error('Ürünler getirilemedi', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
});
}

module.exports = ProductController;


