const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');
const orderRoutes = require('./routes/orders');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI);
console.log(`OrderDB Bağlandı: ${mongoose.connection.host}`.cyan.underline.bold);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/', orderRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5006;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Order Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});