const express = require('express');
const cors = require('cors');

const app = express();

// إعداد CORS
const corsOptions = {
  origin: 'https://ta4ha.com',  // السماح بالنطاق المحدد
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// قم بتشغيل التطبيق
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
