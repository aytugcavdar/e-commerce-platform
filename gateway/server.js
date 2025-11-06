require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
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

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
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

// === GÜNCELLENDİ (TÜM SERVİSLER EKLENDİ) ===
app.get('/status', async (req, res) => {
  const services = {
    'user-service': { 
        url: process.env.USER_SERVICE_URL || 'http://user-service:5001', 
        // user-service'de /health endpoint'i yok, 
      
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
        // user-service için POST denemesi
        await axios.post(`${config.url}${config.healthPath}`, {}, { timeout: 5000 });
        // Servis ayakta ancak 400/401 dönebilir, bu normal.
        serviceStatuses[serviceName] = { status: 'healthy', url: config.url };
      } else {
        // Diğer servisler için GET
        response = await axios.get(`${config.url}${config.healthPath}`, { timeout: 5000 });
        serviceStatuses[serviceName] = {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          url: config.url,
          responseTime: response.headers['x-response-time'] || '< 100ms'
        };
      }
    } catch (error) {
       // user-service'in 400/401 dönmesi 'unreachable' olduğu anlamına gelmez
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

// === Proxy Hata Yakalayıcı (Tekrarı önlemek için) ===
const onProxyError = (err, req, res) => {
    logger.error(`Proxy Error (${req.path}):`, err.message);
    res.status(httpStatus.SERVICE_UNAVAILABLE || 503).json(
      ResponseFormatter.error('Service is currently unavailable', httpStatus.SERVICE_UNAVAILABLE || 503)
    );
};

// 🔐 Auth Service (User Service) Proxy - DÜZELTİLDİ
const authServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:5001', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/'
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to User Service: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`User Service Response: ${proxyRes.statusCode}`);
  }
});
app.use('/api/auth', authServiceProxy);


// 📦 Product Service Proxy
const productServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products/products' 
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Product Service: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Product Service Response: ${proxyRes.statusCode}`);
  }
});
app.use('/api/products', productServiceProxy);

const brandServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/brands': '/api/products/brands' // Gelen /api/brands isteğini /api/products/brands olarak düzelt
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Product Service (Brands): ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Product Service (Brands) Response: ${proxyRes.statusCode}`);
  }
});
app.use('/api/brands', brandServiceProxy);

const categoryServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/categories': '/api/products/categories' // Gelen /api/categories isteğini /api/products/categories olarak düzelt
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Product Service (Categories): ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Product Service (Categories) Response: ${proxyRes.statusCode}`);
  }
});
app.use('/api/categories', categoryServiceProxy);


// 🛒 Order Service Proxy
const orderServiceProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:5003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': ''
  },
  onError: onProxyError,
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying to Order Service: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Order Service Response: ${proxyRes.statusCode}`);
  }
});
app.use('/api/orders', orderServiceProxy);


// 📊 Inventory Service Proxy
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
app.use('/api/inventory', inventoryServiceProxy);


// 🚚 Shipping Service Proxy
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
app.use('/api/shipping', shippingServiceProxy);

// =============================

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
      logger.info(`🌐 CORS Origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Gateway:', error);
    process.exit(1);
  }
};

startServer();