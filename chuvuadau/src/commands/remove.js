const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'remove',
    description: 'Thu hồi Dâu của thành viên',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN (Admin hoặc Role được cấp phép)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn không có thẩm quyền để can thiệp vào kho bạc Dâu!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag người cần thu hồi Dâu! VD: `mremove @MeoMeo 1000`');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số lượng Dâu không hợp lệ!');

        // Đọc dữ liệu ví của người bị thu hồi
        let { data } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        
        // Nếu họ chưa từng nhắn tin hay có dữ liệu
        if (!data) data = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };

        let currentBalance = Number(data.dau);
        let newBalance = currentBalance - amount;

        // Chặn lỗi tiền âm (Thu 100k của người chỉ có 50k thì ví về 0)
        if (newBalance < 0) {
            newBalance = 0;
        }

        // Ghi lại dữ liệu mới
        data.dau = newBalance;
        await supabase.from('economy').upsert(data);

        // Báo cáo thành công
        message.reply(`✅ Quản lý ${message.author} đã thu hồi **${amount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558> từ ${targetUser}!\n*(Số dư hiện tại của họ: ${newBalance.toLocaleString('en-US')} Dâu)*`);
    }
};