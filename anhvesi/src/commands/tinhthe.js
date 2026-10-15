const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tinhthe',
    description: 'Kiểm tra số lượng Tinh Thể lấp lánh trong tủ đồ thời trang',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first() || message.author;
        
        const { data } = await supabase.from('economy').select('dau').eq('user_id', targetUser.id).single();
        const balance = data ? data.dau : 0;

        const embed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink
            .setTitle('🎀 Bộ Sưu Tập Tinh Thể')
            .setDescription(`Stylist ${targetUser} hiện đang cất giữ \`${balance.toLocaleString('en-US')}\` <a:gemheartpalepink:1551126619546976267> Tinh Thể trong chiếc Hộp Nhạc của mình!`);

        await message.reply({ embeds: [embed] });
    },
};