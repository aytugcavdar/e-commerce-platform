const Brand = require("../models/Brand");
const Product = require('../models/Product');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter, CloudinaryHelper },
  constants: { httpStatus },
  logger,
} = require("@ecommerce/shared-utils");

class BrandController {

    /**  * Get all brands
   * @route GET /api/brands
   * @access Public
   */

  static getAllBrands = asyncHandler(async (req, res) => {
    const { isActive, isFeatured, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const brands = await Brand.find(filter).sort({ name: 1 });

    res
      .status(httpStatus.OK)
      .json(ResponseFormatter.success(brands, "Markalar başarıyla getirildi"));
  });
  /**  * Get brand by ID
   * @route GET /api/brands/:id
   * @access Public
   */
  static getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          ResponseFormatter.error("Marka bulunamadı", httpStatus.NOT_FOUND)
        );
    }

    res
      .status(httpStatus.OK)
      .json(ResponseFormatter.success(brand, "Marka detayı getirildi"));
  });

 /**  * Get brand by slug
   * @route GET /api/brands/slug/:slug
   * @access Public
   */
  

  static getBrandBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug });

    if (!brand) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(
          ResponseFormatter.error("Marka bulunamadı", httpStatus.NOT_FOUND)
        );
    }

    res
      .status(httpStatus.OK)
      .json(ResponseFormatter.success(brand, "Marka getirildi"));
  });



    /**  * Create a new brand
   * @route POST /api/brands
   * @access Private/Admin
   */
  static createBrand = asyncHandler(async (req, res) => {
    const { name, description, website, socialMedia, isActive, isFeatured } = req.body;

    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(httpStatus.CONFLICT).json(
        ResponseFormatter.error('Marka zaten mevcut', httpStatus.CONFLICT)
      );
    }

    let logoData = {};
    if (req.file) {
    const result = await CloudinaryHelper.uploadFromBuffer(req.file.buffer, 'brands');
      logoData = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }
    const brand = new Brand({
      name,
      description,
      website,
      socialMedia,
      logo: logoData,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false
    });

    await brand.save();

    res.status(httpStatus.CREATED).json(
      ResponseFormatter.success(brand, 'Marka başarıyla oluşturuldu')
    );
    
      

  });


    /**  * Update a brand
   * @route PUT /api/brands/:id
   * @access Private/Admin
   */
  static updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Marka bulunamadı', httpStatus.NOT_FOUND)
      );
    }
    if (updates.name && updates.name !== brand.name) {
      const existingBrand = await Brand.findOne({ name: updates.name });
      if (existingBrand) {
        return res.status(httpStatus.CONFLICT).json(
          ResponseFormatter.error('Bu isimde bir marka zaten mevcut', httpStatus.CONFLICT)
        );
      }
    }
    if (req.file) {
      if (brand.logo?.public_id) {
        await CloudinaryHelper.deleteFile(brand.logo.public_id);
      }
      const result = await CloudinaryHelper.uploadFromBuffer(req.file.buffer, 'brands');
      updates.logo = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }
    await Brand.findByIdAndUpdate(id, updates);
     res.status(httpStatus.OK).json(
      ResponseFormatter.success(brand, 'Marka başarıyla güncellendi')
    );

  });

   /**  * Delete a brand
   * @route DELETE /api/brands/:id
   * @access Private/Admin
   */

  static deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Marka bulunamadı', httpStatus.NOT_FOUND)
      );
    }
    const productCount = await Product.countDocuments({ brand: id });
    if (productCount > 0) {
       return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(
           `Bu markaya ait ${productCount} adet ürün var.`,
           httpStatus.BAD_REQUEST
         )
    );
    }
    if (brand.logo?.public_id) {
      await CloudinaryHelper.deleteFile(brand.logo.public_id);
    }

    await brand.deleteOne();

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Marka başarıyla silindi')
    );

});
}
