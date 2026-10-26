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
require('./baokequannhau/src/index.js');;
require('./chuvuadau/src/index.js')

// ==========================================
// MÃ CHỐNG SẬP DÂY CHUYỀN (ANTI-CRASH)
// ==========================================
process.on('unhandledRejection', (reason, p) => {
    console.log('🛑 [ANTI-CRASH] Lỗi Promise không được xử lý:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('🛑 [ANTI-CRASH] Lỗi hệ thống nghiêm trọng:', err);
});


process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('🛑 [ANTI-CRASH] Lỗi ngoại lệ:', err);
});