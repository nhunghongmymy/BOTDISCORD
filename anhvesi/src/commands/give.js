const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'give',
    description: 'Trao tặng Tinh Thể lấp lánh cho một Stylist khác',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser || targetUser.bot) return message.reply('Vui lòng tag một Nhà Sưu Tầm hợp lệ để trao tặng!');
        
        // ĐÃ THÊM: Chốt chặn không cho tự chuyển tiền cho bản thân
        if (targetUser.id === message.author.id) {
            return message.reply('❌ Bạn không thể tự trao tặng Tinh Thể cho chính Hộp Nhạc của mình được!');
        }

        if (!amount || amount <= 0) return message.reply('Vui lòng nhập số lượng Tinh Thể hợp lệ!');

        let { data: senderData } = await supabase.from('economy').select('*').eq('user_id', message.author.id).single();
        const senderBalance = senderData ? Number(senderData.dau) : 0;

        if (senderBalance < amount) return message.reply('Tủ đồ của bạn không có đủ <a:gemheartpalepink:1551126619546976267> để thực hiện giao dịch này!');

        let { data: receiverData } = await supabase.from('economy').select('*').eq('user_id', targetUser.id).single();
        if (!receiverData) receiverData = { user_id: targetUser.id, dau: 0, last_daily: 0, last_message: 0 };

        // Cập nhật trực tiếp trên object data để không làm mất các dữ liệu khác (như last_daily)
        senderData.dau = senderBalance - amount;
        receiverData.dau = Number(receiverData.dau) + amount;

        await supabase.from('economy').upsert(senderData);
        await supabase.from('economy').upsert(receiverData);

        const giveEmbed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink for transactions
            .setTitle('🎀 Chuyển Giao Tinh Thể Thành Công')
            .setDescription(`Nhà Sưu Tầm ${message.author} đã chia sẻ **${amount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267> lấp lánh cho Stylist ${targetUser}!`);

        await message.reply({ embeds: [giveEmbed] });
    },
};