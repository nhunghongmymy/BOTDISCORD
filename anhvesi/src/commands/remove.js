const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'remove',
    description: 'Thu hồi Tinh Thể từ tủ đồ của một Stylist',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN (Admin hoặc Role được cấp phép)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn không có đặc quyền để can thiệp vào Hộp Nhạc Trang Sức!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag Nhà Sưu Tầm cần thu hồi Tinh Thể! VD: `mremove @Doll 1000`');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số lượng Tinh Thể không hợp lệ!');

        // Đọc dữ liệu ví của người bị thu hồi
        let { data } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        
        // ĐÃ SỬA: Dọn dẹp các trường liên quan đến Kim Bài
        if (!data) data = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0 };

        let currentBalance = Number(data.dau);
        let newBalance = currentBalance - amount;

        // Chặn lỗi tiền âm (Thu 100k của người chỉ có 50k thì ví về 0)
        if (newBalance < 0) {
            newBalance = 0;
        }

        // Ghi lại dữ liệu mới
        data.dau = newBalance;
        await supabase.from('economy').upsert(data);

        // ĐÃ SỬA: Thêm ${} và khoảng trắng cho message.author và amount
        message.reply(`✅ Quản lý Boutique ${message.author} đã gỡ bỏ **${amount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267> khỏi bộ sưu tập của ${targetUser}!\n*(Tủ đồ hiện tại của họ: ${newBalance.toLocaleString('en-US')} Tinh Thể)*`);
    }
};