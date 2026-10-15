const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'give',
    description: 'Chuyển tiền cho người khác',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        // 1. Kiểm tra người dùng hợp lệ
        if (!targetUser || targetUser.bot) return message.reply('Vui lòng tag một người dùng hợp lệ!');
        
        // ❌ VÁ LỖI: Chặn người dùng tự chuyển cho bản thân
        if (targetUser.id === message.author.id) return message.reply('❌ Bạn không thể tự chuyển Dâu cho chính mình!');

        // 2. Kiểm tra số lượng hợp lệ
        if (!amount || isNaN(amount) || amount <= 0) return message.reply('Vui lòng nhập số lượng hợp lệ!');

        // 3. Kiểm tra số dư người gửi
        let { data: senderData } = await supabase.from('economy').select('*').eq('user_id', message.author.id).single();
        const senderBalance = senderData ? senderData.dau : 0;

        if (senderBalance < amount) return message.reply('Bạn không có đủ <a:Strawberry:1536056987668713558> để chuyển!');

        // 4. Lấy thông tin người nhận
        let { data: receiverData } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!receiverData) receiverData = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0 };

        // 5. Cập nhật cơ sở dữ liệu
        await supabase.from('economy').upsert({ user_id: message.author.id, dau: senderBalance - amount });
        await supabase.from('economy').upsert({ user_id: targetUser.id, dau: Number(receiverData.dau) + amount });

        // 6. Gửi thông báo thành công
        const giveEmbed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('Giao dịch thành công')
            .setDescription(`${message.author} đã chuyển <a:Strawberry:1536056987668713558>**${amount.toLocaleString('en-US')}** Dâu cho ${targetUser}!`);

        await message.reply({ embeds: [giveEmbed] });
    },
};