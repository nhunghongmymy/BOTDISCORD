const { EmbedBuilder } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); // Gọi hàm check quyền

module.exports = {
    name: 'add',
    description: 'Mời thêm Nắp Bia cho khách VIP',
    async execute(message, args, db, userData, supabase) {
        // KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Ấy ấy, bạn chưa được cấp quyền mở két bia của cô chủ Me An đâu nha!');

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser) return message.reply('Vui lòng tag tên người bạn muốn mời thêm bia nha!');
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Số lượng Nắp Bia không hợp lệ, say quá nhìn nhầm số rồi hả bạn hiền?');

        let { data } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!data) data = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };

        const newBalance = Number(data.dau) + amount;
        data.dau = newBalance;
        await supabase.from('economy').upsert(data);

        message.reply(`🍻 Chà chà! Bảo Kê ${message.author} vừa xách ra tặng khách VIP ${targetUser} **${amount.toLocaleString('en-US')}** <:np:1557713580831547462>. Lên bia cạn ly nàooo!`);
    }
};