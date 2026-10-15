const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'remove',
    description: 'Tịch thu hoặc phạt Nắp Bia của khách (Chỉ dành cho Bảo Kê/Quản lý)',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN (Admin hoặc Role được cấp phép)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Ấy ấy, bạn chưa được cấp quyền đụng vào két Nắp Bia của quán đâu nha!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag tên người bạn muốn tịch thu Nắp Bia! VD: `mremove @TenKhach 1000`');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số Nắp Bia không hợp lệ, tỉnh rượu rồi gõ lại đi bạn hiền!');

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

        // ĐÃ SỬA: Thay đổi thông báo cho chuẩn không khí quán nhậu
        message.reply(`✅ Dám quậy phá mâm nhậu hả? Bảo Kê ${message.author} vừa tịch thu **${amount.toLocaleString('en-US')}** <:np:1557713580831547462> của ${targetUser}!\n*(Quỹ nhậu của người này chỉ còn: ${newBalance.toLocaleString('en-US')} Nắp Bia)*`);
    }
};