const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Điểm danh bàn nhậu mỗi ngày để nhận Nắp Bia từ cô chủ',
    async execute(message, args, db, userData, supabase) {
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Úi, quán đang đông khách quá nên hệ thống tính tiền hơi lú xíu: \`${selectError.message}\``);
        }

        // ĐÃ SỬA: Bỏ hoàn toàn kimbai_expire_time và last_kimbai_buy
        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };

        if (now - data.last_daily < ONE_DAY) {
            const timeLeft = Math.ceil((ONE_DAY - (now - data.last_daily)) / (60 * 1000));
            const hours = Math.floor(timeLeft / 60);
            const mins = timeLeft % 60;
            
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#FFFFFF') // White cho thông báo hệ thống/cooldown
                .setTitle('⏳ Cứ từ từ, bia chưa ướp lạnh xong đâu!')
                .setDescription(`Khách VIP nay đã được cô chủ tặng Nắp Bia rồi nè. Hãy ghé lại bàn nhậu sau **${hours} giờ ${mins} phút** nữa nha!`);
                
            return message.reply({ embeds: [cooldownEmbed] });
        }
        
        // ĐÃ SỬA: Cập nhật trực tiếp vào object data để giữ nguyên các cột khác nếu có
        data.dau = Number(data.dau) + 10000;
        data.last_daily = now;
        
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            return message.reply(`Ối, nhân viên lỡ làm đổ bia vô máy chủ rồi: \`${upsertError.message}\``);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#FF8C00') // Đổi sang màu vàng/cam của bia
            .setTitle('🍻 Điểm Danh Bàn Nhậu Thành Công!')
            .setDescription(`Khách VIP ${message.author} vừa ghé quán và được cô chủ tặng ngay **10,000** <:np:1557713580831547462> để lên mồi xõa tới bến nha!`);

        await message.reply({ embeds: [successEmbed] });
    },
};