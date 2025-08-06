const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörlerini oluştur
const baseUploadDir = path.join(__dirname, '..', 'uploads');
const tempUploadDir = path.join(baseUploadDir, 'temp');

// Klasörleri oluştur
[baseUploadDir, tempUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Klasör oluşturuldu: ${dir}`);
    } else {
        console.log(`📁 Klasör mevcut: ${dir}`);
    }
});

// Multer storage yapılandırması
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(`📤 Dosya yükleme konumu: ${tempUploadDir}`);
        cb(null, tempUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        console.log(`📝 Dosya adı oluşturuldu: ${filename}`);
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Sadece resim dosyalarına izin ver
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;