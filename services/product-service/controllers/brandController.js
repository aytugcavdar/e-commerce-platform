const Brand = require("../models/Brand");
const Product = require('../models/Product');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter, CloudinaryHelper },
  constants: { httpStatus, errorMessages },
  logger,
} = require("@ecommerce/shared-utils");

class BrandController {

  /**
   * Get all brands
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

  /**
   * Get brand by ID
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
          ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.NOT_FOUND)
        );
    }

    res
      .status(httpStatus.OK)
      .json(ResponseFormatter.success(brand, "Marka detayı getirildi"));
  });

  /**
   * Get brand by slug
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
          ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.NOT_FOUND)
        );
    }

    res
      .status(httpStatus.OK)
      .json(ResponseFormatter.success(brand, "Marka getirildi"));
  });

  /**
   * Create a new brand
   * @route POST /api/brands
   * @access Private/Admin
   */
  static createBrand = asyncHandler(async (req, res) => {
    const { name, description, website, socialMedia, isActive, isFeatured } = req.body;

    // Marka kontrolü
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(httpStatus.CONFLICT).json(
        ResponseFormatter.error(errorMessages.BRAND_ALREADY_EXISTS, httpStatus.CONFLICT)
      );
    }

    // Logo yükleme
    let logoData = {};
    if (req.file) {
      try {
        const result = await CloudinaryHelper.uploadFromBuffer(req.file.buffer, 'brands');
        logoData = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (error) {
        logger.error('Marka logosu yüklenirken hata:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    // Yeni marka oluştur
    const brand = new Brand({
      name,
      description,
      website,
      socialMedia,
      logo: logoData,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false
    });

    try {
      await brand.save();

      res.status(httpStatus.CREATED).json(
        ResponseFormatter.success(brand, 'Marka başarıyla oluşturuldu')
      );
    } catch (error) {
      logger.error('Marka oluşturulurken hata:', error);
      
      // Eğer logo yüklendiyse geri al
      if (logoData.public_id) {
        try {
          await CloudinaryHelper.deleteFile(logoData.public_id);
        } catch (deleteError) {
          logger.error('Logo geri alınamadı:', deleteError);
        }
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Update a brand
   * @route PUT /api/brands/:id
   * @access Private/Admin
   */
  static updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Marka kontrolü
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // İsim değişikliği kontrolü
    if (updates.name && updates.name !== brand.name) {
      const existingBrand = await Brand.findOne({ name: updates.name });
      if (existingBrand) {
        return res.status(httpStatus.CONFLICT).json(
          ResponseFormatter.error(errorMessages.BRAND_ALREADY_EXISTS, httpStatus.CONFLICT)
        );
      }
    }

    let oldLogoPublicId = null;

    // Yeni logo yükleme
    if (req.file) {
      try {
        // Yeni logoyu yükle
        const result = await CloudinaryHelper.uploadFromBuffer(req.file.buffer, 'brands');
        
        // Eski logo bilgisini sakla (güncelleme başarısız olursa geri almak için)
        oldLogoPublicId = brand.logo?.public_id;
        
        updates.logo = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (error) {
        logger.error('Marka logosu güncellenirken hata:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error(errorMessages.IMAGE_UPLOAD_FAILED, httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    try {
      // Markayı güncelle
      const updatedBrand = await Brand.findByIdAndUpdate(id, updates, { 
        new: true,
        runValidators: true 
      });

      // Güncelleme başarılı, eski logoyu sil
      if (oldLogoPublicId) {
        try {
          await CloudinaryHelper.deleteFile(oldLogoPublicId);
        } catch (deleteError) {
          logger.warn('Eski logo silinirken hata:', deleteError);
          // Eski logo silinemese bile güncelleme başarılı
        }
      }

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(updatedBrand, 'Marka başarıyla güncellendi')
      );
    } catch (error) {
      logger.error('Marka güncellenirken hata:', error);

      // Güncelleme başarısız, yeni yüklenen logoyu sil
      if (updates.logo?.public_id) {
        try {
          await CloudinaryHelper.deleteFile(updates.logo.public_id);
        } catch (deleteError) {
          logger.error('Yeni logo geri alınamadı:', deleteError);
        }
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });

  /**
   * Delete a brand
   * @route DELETE /api/brands/:id
   * @access Private/Admin
   */
  static deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Marka kontrolü
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.BRAND_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Ürün kontrolü
    const productCount = await Product.countDocuments({ brand: id });
    if (productCount > 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.BRAND_HAS_PRODUCTS, httpStatus.BAD_REQUEST)
      );
    }

    try {
      // Logo silme
      if (brand.logo?.public_id) {
        try {
          await CloudinaryHelper.deleteFile(brand.logo.public_id);
        } catch (error) {
          logger.warn('Marka logosu silinirken hata:', error);
          // Logo silinemese bile markayı silmeye devam et
        }
      }

      // Markayı sil
      await brand.deleteOne();

      res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Marka başarıyla silindi')
      );
    } catch (error) {
      logger.error('Marka silinirken hata:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  });
}

module.exports = BrandController;