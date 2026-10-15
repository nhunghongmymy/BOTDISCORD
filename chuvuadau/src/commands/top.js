const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Xem bảng xếp hạng phú hào Dâu',
    async execute(message, args, db, userData, supabase) {
        // Truy xuất top 10 người có số Dâu cao nhất, sắp xếp giảm dần
        const { data, error } = await supabase
            .from('economy')
            .select('user_id, dau')
            .order('dau', { ascending: false })
            .limit(10);

        if (error) {
            return message.reply(`Lỗi đọc Supabase: \`${error.message}\``);
        }

        if (!data || data.length === 0) {
            return message.reply('Bảng xếp hạng hiện đang trống không!');
        }

        const topEmbed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('🏆 Bảng Xếp Hạng Phú Hào Dâu')
            .setThumbnail(message.guild ? message.guild.iconURL({ dynamic: true }) : null);

        let leaderboardText = '';

        for (let i = 0; i < data.length; i++) {
            const userRow = data[i];
            const balance = Number(userRow.dau).toLocaleString('en-US');
            
            // Gắn huy chương cho top 3
            let rankIcon = '';
            if (i === 0) rankIcon = '🥇';
            else if (i === 1) rankIcon = '🥈';
            else if (i === 2) rankIcon = '🥉';
            else rankIcon = `**#${i + 1}**`;

            // Cú pháp <@id> giúp Discord tự động render tên người dùng
            leaderboardText += `${rankIcon} <@${userRow.user_id}>: **${balance}** <a:Strawberry:1536056987668713558>\n\n`;
        }

        topEmbed.setDescription(leaderboardText)
            .setFooter({ text: `Yêu cầu bởi ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await message.reply({ embeds: [topEmbed] });
    },
};