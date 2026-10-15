const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'add',
    description: 'Bơm Dâu cho thành viên',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn không có thẩm quyền truy cập kho bạc Dâu!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag người cần bơm Dâu!');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số Dâu không hợp lệ!');

        let { data } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!data) data = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };

        const newBalance = Number(data.dau) + amount;
        data.dau = newBalance;
        await supabase.from('economy').upsert(data);

        message.reply(`✅ Quản lý ${message.author} đã xuất kho **${amount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558> cho ${targetUser}!`);
    }
};