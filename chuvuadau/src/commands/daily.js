const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Điểm danh nhận Dâu',
    async execute(message, args, db, userData, supabase) {
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Lỗi đọc Supabase: \`${selectError.message}\``);
        }

        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };

        if (now - data.last_daily < ONE_DAY) {
            const timeLeft = Math.ceil((ONE_DAY - (now - data.last_daily)) / (60 * 1000));
            const hours = Math.floor(timeLeft / 60);
            const mins = timeLeft % 60;
            
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#ff99af')
                .setTitle('Chưa tới giờ điểm danh!')
                .setDescription(`Bạn đã nhận Dâu hôm nay rồi. Hãy quay lại sau **${hours} giờ ${mins} phút** nữa nhé!`);
                
            return message.reply({ embeds: [cooldownEmbed] });
        }
        
        const newBalance = Number(data.dau) + 10000;
        
        const { error: upsertError } = await supabase.from('economy').upsert({ 
            user_id: userId, 
            dau: newBalance, 
            last_daily: now,
            last_message: data.last_message 
        });

        if (upsertError) {
            return message.reply(`Lỗi ghi Supabase: \`${upsertError.message}\``);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('Đã điểm danh!')
            .setDescription(`${message.author} nhận được <a:Strawberry:1536056987668713558>**10,000**`);

        await message.reply({ embeds: [successEmbed] });
    },
};