const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Điểm danh mở hộp nhạc mỗi ngày để nhận Tinh Thể',
    async execute(message, args, db, userData, supabase) {
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Giai điệu bị lỗi nhịp khi đọc dữ liệu: \`${selectError.message}\``);
        }

        // ĐÃ SỬA: Bỏ hoàn toàn kimbai_expire_time và last_kimbai_buy
        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };

        if (now - data.last_daily < ONE_DAY) {
            const timeLeft = Math.ceil((ONE_DAY - (now - data.last_daily)) / (60 * 1000));
            const hours = Math.floor(timeLeft / 60);
            const mins = timeLeft % 60;
            
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#FFFFFF') // White cho thông báo hệ thống/cooldown
                .setTitle('⏳ Hộp Nhạc Đang Lên Dây Cót!')
                .setDescription(`Stylist đã nhận đặc quyền thời trang hôm nay rồi. Hãy quay lại mở tủ đồ sau **${hours} giờ ${mins} phút** nữa nhé!`);
                
            return message.reply({ embeds: [cooldownEmbed] });
        }
        
        // ĐÃ SỬA: Cập nhật trực tiếp vào object data để giữ nguyên các cột khác nếu có
        data.dau = Number(data.dau) + 10000;
        data.last_daily = now;
        
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            return message.reply(`Giai điệu bị lỗi nhịp khi ghi dữ liệu: \`${upsertError.message}\``);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink cho sự kiện nhận thưởng
            .setTitle('🎀 Điểm Danh Tủ Đồ Thành Công!')
            .setDescription(`Nhà Sưu Tầm ${message.author} vừa mở hộp nhạc và nhận được **10,000** <a:gemheartpalepink:1551126619546976267> lấp lánh!`);

        await message.reply({ embeds: [successEmbed] });
    },
};