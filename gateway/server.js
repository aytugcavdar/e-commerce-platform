require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const {createProxyMiddleware} = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const {
  logger,
  middleware: { ErrorHandler },
  helpers: { ResponseFormatter },
  constants: { httpStatus }
} = require('@ecommerce/shared-utils');

const app = express();

app.use(cookieParser());

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(httpStatus.OK).json(
    ResponseFormatter.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }, 'Gateway is healthy')
  );
});

app.get('/status', async (req, res) => {
  const services = {
    'user-service': { 
        url: process.env.USER_SERVICE_URL || 'http://user-service:5001', 
        healthPath: '/api/auth/refresh-token',
        method: 'POST'
    },
    'product-service': { 
        url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002', 
        healthPath: '/health',
        method: 'GET'
    },
    'order-service': { 
        url: process.env.ORDER_SERVICE_URL || 'http://order-service:5003', 
        healthPath: '/health',
        method: 'GET'
    },
    'inventory-service': { 
        url: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5005', 
        healthPath: '/api/inventory/health',
        method: 'GET'
    },
    'shipping-service': { 
        url: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:5006', 
        healthPath: '/health',
        method: 'GET'
    },
     'payment-service': { 
        url: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5004', 
        healthPath: '/health',
        method: 'GET'
    }
  };

  const serviceStatuses = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    try {
      let response;
      if (config.method === 'POST') {
        await axios.post(`${config.url}${config.healthPath}`, {}, { timeout: 5000 });
        serviceStatuses[serviceName] = { status: 'healthy', url: config.url };
      } else {
        response = await axios.get(`${config.url}${config.healthPath}`, { timeout: 5000 });
        serviceStatuses[serviceName] = {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          url: config.url,
          responseTime: response.headers['x-response-time'] || '< 100ms'
        };
      }
    } catch (error) {
       if (serviceName === 'user-service' && error.response) {
            serviceStatuses[serviceName] = { status: 'healthy', url: config.url, note: 'Responded with status ' + error.response.status };
       } else {
            serviceStatuses[serviceName] = {
              status: 'unreachable',
              url: config.url,
              error: error.message
            };
       }
    }
  }

  res.status(httpStatus.OK).json(
    ResponseFormatter.success({
      gateway: 'healthy',
      services: serviceStatuses,
      timestamp: new Date().toISOString()
    }, 'Service status check')
  );
});

const onProxyError = (err, req, res) => {
    logger.error(`Proxy Error (${req.path}):`, err.message);
    res.status(httpStatus.SERVICE_UNAVAILABLE || 503).json(
      ResponseFormatter.error('Service is currently unavailable', httpStatus.SERVICE_UNAVAILABLE || 503)
    );
};

// ============================================
// AUTH & USER SERVICE PROXIES
// ============================================

const authServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:5001', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/'
  },
  cookieDomainRewrite: {
    "*": ""
  },
  cookiePathRewrite: {
    "*": "/"
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`🚀 Proxying to User Service: ${req.method} ${req.url}`);
    
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
      logger.info(`🍪 Forwarding cookies to backend: ${req.headers.cookie.substring(0, 100)}...`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ User Service Response: ${proxyRes.statusCode}`);
    
    const setCookieHeaders = proxyRes.headers['set-cookie'];
    if (setCookieHeaders) {
      logger.info(`🍪 Backend sent ${setCookieHeaders.length} cookies`);
      setCookieHeaders.forEach((cookie, index) => {
        logger.info(`🍪 Cookie ${index + 1}: ${cookie.substring(0, 150)}...`);
      });
    } else {
      logger.warn(`⚠️ No Set-Cookie headers from backend for ${req.url}`);
    }
  }
});

const userServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:5001', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/'
  },
  cookieDomainRewrite: {
    "*": "" 
  },
  cookiePathRewrite: {
    "*": "/" 
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`🚀 Proxying to User Service (Users): ${req.method} ${req.url}`);
    
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
      logger.info(`🍪 Forwarding cookies to backend: ${req.headers.cookie.substring(0, 100)}...`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ User Service (Users) Response: ${proxyRes.statusCode}`);
  }
});

// ============================================
// PRODUCT SERVICE PROXIES
// ⚠️ KRITIK: SIRALAMA ÇOK ÖNEMLİ!
// ============================================

// 1️⃣ BRANDS - En spesifik route önce
const brandServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/brands': '/brands'  // ✅ /api/brands -> /brands
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`🏷️  Proxying to Product Service (Brands): ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ Product Service (Brands) Response: ${proxyRes.statusCode}`);
  }
});

// 2️⃣ CATEGORIES - İkinci spesifik route
const categoryServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/categories': '/categories'  // ✅ /api/categories -> /categories
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`📁 Proxying to Product Service (Categories): ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ Product Service (Categories) Response: ${proxyRes.statusCode}`);
  }
});

// 3️⃣ PRODUCTS - Genel route en sona
const productServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/'  // ✅ /api/products -> /
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`📦 Proxying to Product Service (Products): ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ Product Service (Products) Response: ${proxyRes.statusCode}`);
  }
});

// ============================================
// ORDER SERVICE PROXY
// ============================================

const orderServiceProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:5003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': ''
  },
  cookieDomainRewrite: {
    "*": ""
  },
  cookiePathRewrite: {
    "*": "/"
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`🚀 Proxying to Order Service: ${req.method} ${req.url}`);
    
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
      logger.info(`🍪 Forwarding cookies to Order Service: ${req.headers.cookie.substring(0, 100)}...`);
    } else {
      logger.warn('⚠️ No cookies to forward to Order Service');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`✅ Order Service Response: ${proxyRes.statusCode}`);
    
    const setCookieHeaders = proxyRes.headers['set-cookie'];
    if (setCookieHeaders) {
      logger.info(`🍪 Order Service sent ${setCookieHeaders.length} cookies`);
    }
  }
});

// ============================================
// OTHER SERVICE PROXIES
// ============================================

const inventoryServiceProxy = createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/inventory': '/api/inventory'
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Inventory Service: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Inventory Service Response: ${proxyRes.statusCode}`);
  }
});

const shippingServiceProxy = createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:5006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping': '/api/shipping'
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Shipping Service: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Shipping Service Response: ${proxyRes.statusCode}`);
  }
});

// ============================================
// ⚠️ REGISTER ROUTES - ORDER MATTERS!
// ============================================

app.use('/api/auth', authServiceProxy);
app.use('/api/users', userServiceProxy);

// ✅ CRITICAL: Specific routes BEFORE general routes
app.use('/api/brands', brandServiceProxy);        // 1. Brands first
app.use('/api/categories', categoryServiceProxy);  // 2. Categories second
app.use('/api/products', productServiceProxy);     // 3. Products last

app.use('/api/orders', orderServiceProxy);
app.use('/api/inventory', inventoryServiceProxy);
app.use('/api/shipping', shippingServiceProxy);

// ============================================
// ERROR HANDLERS
// ============================================

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚪 API Gateway is running on port ${PORT}`);
      logger.info(`🔗 User (Auth) Service URL: ${process.env.USER_SERVICE_URL || 'http://user-service:5001'}`);
      logger.info(`🔗 Product Service URL: ${process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002'}`);
      logger.info(`🔗 Order Service URL: ${process.env.ORDER_SERVICE_URL || 'http://order-service:5003'}`);
      logger.info(`🔗 Inventory Service URL: ${process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5005'}`);
      logger.info(`🔗 Shipping Service URL: ${process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:5006'}`);
      logger.info(`🔗 Payment Service (Health Check): ${process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5004'}`);
      logger.info(`🌐 CORS Origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173'}`);
      logger.info(`🍪 Cookie support: ENABLED`);
      logger.info(`🏷️  Brand proxy: /api/brands -> /brands`);
      logger.info(`📁 Category proxy: /api/categories -> /categories`);
      logger.info(`📦 Product proxy: /api/products -> /`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Gateway:', error);
    process.exit(1);
  }
};

startServer();