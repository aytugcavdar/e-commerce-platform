const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/payments');

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());
app.use(cookieParser());


if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/', paymentRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5007;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Payment Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});