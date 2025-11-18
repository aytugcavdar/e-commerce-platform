const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app.js');
const User = require('../models/User');

// =========================================================
// MOCK KURULUMU
// =========================================================

// 1. Multer Middleware'ini Mocklama
jest.mock('multer', () => {
    const mockMemoryStorage = jest.fn(() => ({
        _handleFile: jest.fn(),
        _removeFile: jest.fn(),
    }));

    const multerMock = jest.fn(() => ({
        single: jest.fn(() => (req, res, next) => {
            // Mock dosya verisi
            req.file = { 
                fieldname: 'avatar',
                originalname: 'mock_avatar.jpg',
                mimetype: 'image/jpeg',
                size: 1000,
                path: 'mock/path/temp'
            }; 
            next();
        }),
        array: jest.fn(),
        fields: jest.fn(),
        none: jest.fn(),
        any: jest.fn(),
    }));

    multerMock.memoryStorage = mockMemoryStorage;
    return multerMock;
});

// 2. Cloudinary ve Email Helper'ları Mocklama
jest.mock('@ecommerce/shared-utils', () => {
    const original = jest.requireActual('@ecommerce/shared-utils');
    
    const mockCloudinaryHelper = {
        uploadImage: jest.fn().mockResolvedValue({ 
            secure_url: 'https://mock-cloudinary.com/avatar.jpg', 
            public_id: 'mock-id' 
        }),
        deleteFile: jest.fn().mockResolvedValue({ result: 'ok' }),
        uploadFromBuffer: jest.fn().mockResolvedValue({ // Product service vb. için gerekebilir
             secure_url: 'https://mock-cloudinary.com/image.jpg',
             public_id: 'mock-id'
        })
    };

    return {
        ...original,
        helpers: {
            ...original.helpers,
            CloudinaryHelper: mockCloudinaryHelper,
            EmailHelper: {
                sendEmail: jest.fn().mockResolvedValue(true),
                getWelcomeEmailTemplate: jest.fn().mockReturnValue({ text: 'mock text', html: 'mock html' }),
            },
            PasswordUtils: original.helpers.PasswordUtils 
        },
    };
});
// =========================================================


let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
  jest.clearAllMocks();
});

describe('User Service Auth Tests', () => {
  
  // Geçerli kullanıcı verisi
  const validUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'Password123!', 
    phone: '5551234567'
  };

  describe('POST /api/auth/register', () => {
    
    it('should register a new user successfully (Expected 201)', async () => {
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // 1. Status Code Kontrolü
      expect(response.status).toBe(201);
      
      // 2. Response Body Kontrolü (ResponseFormatter yapısına uygun)
      // 'success' yerine 'status' alanını kontrol ediyoruz
      expect(response.body.status).toBe('success'); 
      
      // 3. Data Kontrolü
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(validUserData.email);

      // 4. DB Kontrolü
      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeDefined();
      expect(user.firstName).toBe(validUserData.firstName);
    });

    it('should not register a user with existing email (Expected 409)', async () => {
      // Ön hazırlık: Kullanıcıyı oluştur
      await User.create({
        ...validUserData,
        password: 'Password456?'
      }); 

      // Aynı veriyle tekrar istek at
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData); 

      // 1. Status Code Kontrolü
      expect(response.status).toBe(409);

      // 2. Response Body Kontrolü
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Bu e-posta zaten kayıtlı'); 
    });
  });
});