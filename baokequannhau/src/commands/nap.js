const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'nap', // Đổi tên từ tinhthe thành nap
    description: 'Kiểm tra xem trong hầu bao còn bao nhiêu Nắp Bia để đi nhậu',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first() || message.author;
        
        const { data } = await supabase.from('economy').select('dau').eq('user_id', targetUser.id).single();
        const balance = data ? data.dau : 0;

        const embed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng của bia
            .setTitle('🍻 Kê Biên Quỹ Nhậu')
            .setDescription(`Khách VIP ${targetUser} hiện đang dắt túi \`${balance.toLocaleString('en-US')}\` <:np:1557713580831547462> Nắp Bia. Chuẩn bị gọi mồi xõa tới bến thôi!`);

        await message.reply({ embeds: [embed] });
    },
};