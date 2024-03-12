const express = require('express');
const app = express();
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const cron = require('node-cron');
const shell = require('shelljs');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const errorHandler = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/userRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactsRoutes = require('./routes/contactsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { default: axios } = require('axios');

// Development === http://localhost:5173
// Production === https://jays-auto-spa.netlify.app

app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: 'https://jays-auto-spa.netlify.app',
    credentials: true,
  })
);

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.get('/', (req, res) => {
  router.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '1800');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'PUT, POST, GET, DELETE, PATCH, OPTIONS'
    );
  });
});

// USER ROUTES
app.use('/api/users', userRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/reviews', reviewRoutes);

// CALENDAR SCHEDULE
cron.schedule('0 4 * * *', async function () {
  const calendarID = process.env.CALENDAR_ID;
  await axios.post('http://localhost:5000/api/calendar/updateDateToToday', {
    id: calendarID,
  });
});

// ERROR HANDLER MIDDLEWARE
app.use(errorHandler);

// DB CONNECTION
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('DB CONNECTED');
  })
  .catch((err) => {
    console.log(`DB CONNECTION ERROR: ${err}`);
  });

// PORT CONNECTION
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});
