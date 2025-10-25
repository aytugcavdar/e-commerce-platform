const Product = require('../models/Product');
const Category = require('../models/Category');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatte,CloudinaryHelper },
  constants: { httpStatus, errorMessages },
  logger,
} = require("@ecommerce/shared-utils");

class ProductController {
    /**  * Get all products
   * @route GET /api/products
   * @access Public
   */
    static getAllProducts = asyncHandler(async (req, res) => {});

    /**  * Get product by ID
   * @route GET /api/products/:id
   * @access Public
   */
    static getProductById = asyncHandler(async (req, res) => {});
    
    /**  * Get product by slug
   * @route GET /api/products/slug/:slug
   * @access Public
   */
    static getProductBySlug = asyncHandler(async (req, res) => {});

    /**  * Create a new product
   * @route POST /api/products
   * @access Private/Admin
   */
    static createProduct = asyncHandler(async (req, res) => {});

    /**  * Update a product
   * @route PUT /api/products/:id
   * @access Private/Admin
   */
    static updateProduct = asyncHandler(async (req, res) => {});

    /**  * Delete a product
   * @route DELETE /api/products/:id
   * @access Private/Admin
   */
    static deleteProduct = asyncHandler(async (req, res) => {});

    /**  * Update product order
   * @route PUT /api/products/order
   * @access Private/Admin
   */
    static updateProductOrder = asyncHandler(async (req, res) => {});






}