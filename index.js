require('dotenv').config();

const express = require('express');
const app = express();

app.get('/', (_req, res) => {
  res.status(200).send('Các bot đang hoạt động');
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Web server đang chạy trên port ${port}`);
});

// Mỗi file khởi tạo và đăng nhập một Discord client
require('./anhvesi/src/index.js');
require('./baokequannhau/src/index.js');
require('./chuvuadau/src/index.js');