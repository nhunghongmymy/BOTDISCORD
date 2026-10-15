const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'add',
    description: 'Tặng thêm lấp lánh cho tủ đồ của Stylist',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn không có đặc quyền mở khóa Hộp Nhạc Trang Sức!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag Stylist bạn muốn trao Tinh Thể!');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số lượng Tinh Thể không hợp lệ!');

        let { data } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!data) data = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };

        const newBalance = Number(data.dau) + amount;
        data.dau = newBalance;
        await supabase.from('economy').upsert(data);

        // ĐÃ SỬA: Thêm ${} và khoảng trắng cho message.author và amount
        message.reply(`✨ Quản lý thời trang ${message.author} vừa đính thêm **${amount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267> vào bộ sưu tập của Nhà Sưu Tầm ${targetUser}!`);
    }
};