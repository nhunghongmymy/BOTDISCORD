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

// ==========================================
// ĐIỂM DANH XẾP HÀNG (TRÁNH BỊ DISCORD BLOCK)
// ==========================================
console.log("Bắt đầu gọi hệ thống đa Bot dậy...");

setTimeout(() => {
    console.log("Đang kết nối Anh Vệ Sĩ...");
    require('./anhvesi/src/index.js');
}, 1000);

setTimeout(() => {
    console.log("Đang kết nối Chủ Vựa Dâu...");
    require('./chuvuadau/src/index.js');
}, 8000);

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