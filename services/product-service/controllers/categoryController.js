const { CloudinaryHelper } = require("@ecommerce/shared-utils/helpers");
const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter },
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

      const categories = await query;

      res
        .status(httpStatus.OK)
        .json(
          ResponseFormatter.success(
            categories,
            "Kategoriler başarıyla getirildi"
          )
        );
    }
  });

  /**   * Get category tree
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
    /**  * Get category by ID
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
        ResponseFormatter.error('Kategori bulunamadı', httpStatus.NOT_FOUND)
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
    /**  * Get category by slug
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
        ResponseFormatter.error('Kategori bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(category, 'Kategori getirildi')
    );
  });


  /**  * Create a new category
   * @route POST /api/categories
   * @access Private/Admin
   */
  static createCategory = asyncHandler(async (req, res) => {
    const { name, slug, parent, isActive, isFeatured, order, image } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(httpStatus.CONFLICT).json(
        ResponseFormatter.error('Kategori zaten mevcut', httpStatus.CONFLICT)
      );
    }
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Belirtilen ana kategori bulunamadı', httpStatus.BAD_REQUEST)
        );
      }
    }
    let imageData = {};
    if(req.file){
        try{
            const result = await CloudinaryHelper.uploadFromBuffer(
                req.file.buffer,
                'categories'
            );
            imageData = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }catch(error){
            logger.error('Kategori resmi yüklenirken hata oluştu:', error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
                ResponseFormatter.error('Kategori resmi yüklenirken hata oluştu', httpStatus.INTERNAL_SERVER_ERROR)
            );
        }
    }
    const newCategory = new Category({
        name,
        description,
        parent:parent || null,
        image: imageData,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
    });
    await newCategory.save();

    res.status(httpStatus.CREATED).json(
        ResponseFormatter.success(newCategory, 'Kategori başarıyla oluşturuldu', httpStatus.CREATED)
    );

  })



    /**  * Update a category
   * @route PUT /api/categories/:id
   * @access Private/Admin
   */
  static updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Kategori bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    if (updates.name && updates.name !== category.name) {
      const existingCategory = await Category.findOne({ name: updates.name });
      if (existingCategory) {
        return res.status(httpStatus.CONFLICT).json(
          ResponseFormatter.error('Bu isimde bir kategori zaten mevcut', httpStatus.CONFLICT)
        );
      }
    }

    if (updates.parent) {
      if (updates.parent === id) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Kategori kendi alt kategorisi olamaz', httpStatus.BAD_REQUEST)
        );
      }

      
      const children = await Category.find({ parent: id });
      const childIds = children.map(c => c._id.toString());
      if (childIds.includes(updates.parent)) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Alt kategori, ana kategori yapılamaz', httpStatus.BAD_REQUEST)
        );
      }
    }

    if(req.file){
        if(category.image && category.image.publicId){
            try{
                await CloudinaryHelper.deleteFile(category.image.publicId);
            }catch(error){
                logger.warn('Kategori resmi silinirken hata oluştu:', error);
            }
        }
    }
    const result = await CloudinaryHelper.uploadFromBuffer(
        req.file.buffer,
        'categories'
    );
    updates.image = {
        url: result.secure_url,
        publicId: result.public_id
    };
    
    res.status(httpStatus.OK).json(
        ResponseFormatter.success(category, 'Kategori başarıyla güncellendi')
    );

  });

  /**  * Delete a category
   * @route DELETE /api/categories/:id
   * @access Private/Admin
   */

  static deleteCategory = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Kategori bulunamadı', httpStatus.NOT_FOUND)
      );
    }
    const children = await Category.find({ parent: id });
    if (children.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(
          'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.',
          httpStatus.BAD_REQUEST
        )
      );
    }
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(
         `Bu kategoride ${productCount} adet ürün var. Silmek için önce ürünleri taşıyın.`,
          httpStatus.BAD_REQUEST
        )
      );
    }
    if (category.image?.public_id) {
      try {
        await CloudinaryHelper.deleteFile(category.image.public_id);
      } catch (error) {
        logger.warn('Kategori resmi silinemedi:', error);
      }
    }
     await category.deleteOne();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Kategori başarıyla silindi')
    );
  });

    /**  * Update category order
   * @route PUT /api/categories/order
   * @access Private/Admin
   */
  static updateCategoryOrder = asyncHandler(async (req, res) => {
    const { categoryOrders } = req.body; 
    const updatePromises = categoryOrders.map(item =>
      Category.findByIdAndUpdate(item.id, { order: item.order })
    );

    await Promise.all(updatePromises);

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Kategori sıralaması güncellendi')
    );
  });

}

module.exports = CategoryController;
