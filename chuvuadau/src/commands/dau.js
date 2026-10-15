const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'dau',
    description: 'Kiểm tra số Dâu',
    async execute(message, args, db, userData, supabase) {
        const targetUser = message.mentions.users.first() || message.author;
        
        const { data } = await supabase.from('economy').select('dau').eq('user_id', targetUser.id).single();
        const balance = data ? data.dau : 0;

        const embed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('Ví Dâu')
            .setDescription(`${targetUser} hiện có <a:Strawberry:1536056987668713558> \`${balance.toLocaleString('en-US')}\` Dâu!`);

        await message.reply({ embeds: [embed] });
    },
};