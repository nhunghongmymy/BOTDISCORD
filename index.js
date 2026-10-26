const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

// 1. BẬT WEB SERVER CHỐNG SLEEP
app.get('/', (req, res) => res.send('Hệ thống Bot đang hoạt động!'));
app.listen(port, () => console.log(`Web server đang chạy trên port ${port}`));

// 2. GỌI 3 BOT THỨC DẬY (XẾP HÀNG ĐỂ TRÁNH QUÁ TẢI CPU)
console.log("Bắt đầu khởi động hệ thống đa Bot...");

setTimeout(() => {
    console.log("Đang mở cửa cho Anh Vệ Sĩ...");
    require('./anhvesi/src/index.js'); 
}, 1000);

setTimeout(() => {
    console.log("Đang mở cửa cho Bảo Kê Quán Nhậu...");
    require('./baokequannhau/src/index.js'); 
}, 8000);

setTimeout(() => {
    console.log("Đang mở cửa cho Chú Vừa Đâu...");
    require('./chuvuadau/src/index.js'); 
}, 15000);