const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'give',
    description: 'Bao kèo, mời Nắp Bia chiến hữu hoặc các khách VIP khác',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser || targetUser.bot) return message.reply('Vui lòng tag tên người anh em bạn muốn mời bia nha!');
        
        // ĐÃ THÊM: Chốt chặn không cho tự chuyển tiền cho bản thân
        if (targetUser.id === message.author.id) {
            return message.reply('❌ Éc, nhậu một mình sầu lắm, sao lại tự rót tự uống thế kia! Mời người khác đi bạn hiền ơi.');
        }

        if (!amount || amount <= 0) return message.reply('Số Nắp Bia không hợp lệ, say quá hoa mắt nhìn nhầm số rồi hả?');

        let { data: senderData } = await supabase.from('economy').select('*').eq('user_id', message.author.id).single();
        const senderBalance = senderData ? Number(senderData.dau) : 0;

        if (senderBalance < amount) return message.reply('Quỹ nhậu của bạn không có đủ <:np:1557713580831547462> để bao kèo này rồi, ráng đi lượm thêm nha!');

        let { data: receiverData } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!receiverData) receiverData = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0 };

        // Cập nhật trực tiếp trên object data để không làm mất các dữ liệu khác (như last_daily)
        senderData.dau = senderBalance - amount;
        receiverData.dau = Number(receiverData.dau) + amount;

        await supabase.from('economy').upsert(senderData);
        await supabase.from('economy').upsert(receiverData);

        const giveEmbed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng cho giống màu bia
            .setTitle('🍻 Mời Bia Thành Công!')
            .setDescription(`Khách VIP ${message.author} vừa hào phóng bao luôn **${amount.toLocaleString('en-US')}** <:np:1557713580831547462> cho chiến hữu ${targetUser}! Dô dô dô!!!`);

        await message.reply({ embeds: [giveEmbed] });
    },
};