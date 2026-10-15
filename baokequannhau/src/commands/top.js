const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Xem Bảng Vàng các dân chơi sở hữu nhiều Nắp Bia nhất quán',
    async execute(message, args, db, userData, supabase) {
        // Truy xuất top 10 người có số Nắp Bia cao nhất, sắp xếp giảm dần (Giữ nguyên logic database)
        const { data, error } = await supabase
            .from('economy')
            .select('user_id, dau')
            .order('dau', { ascending: false })
            .limit(10);

        if (error) {
            return message.reply(`Hệ thống tính tiền của quán đang bị kẹt bill: \`${error.message}\``);
        }

        if (!data || data.length === 0) {
            return message.reply('Quán đang ế, chưa có mâm nào mở bát. Các dân chơi mau mau gọi mồi lên bia đi nào!');
        }

        const topEmbed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng của bia
            .setTitle('🏆 BẢNG VÀNG ĐẠI GIA QUÁN NHẬU 🍻')
            .setThumbnail(message.guild ? message.guild.iconURL({ dynamic: true }) : null);

        let leaderboardText = '';

        for (let i = 0; i < data.length; i++) {
            const userRow = data[i];
            const balance = Number(userRow.dau).toLocaleString('en-US');
            
            // Gắn huy chương cho top 3
            let rankIcon = '';
            if (i === 0) rankIcon = '👑'; // Thần Tửu
            else if (i === 1) rankIcon = '🥈'; // Á Quân
            else if (i === 2) rankIcon = '🥉'; // Quý Quân
            else rankIcon = `**#${i + 1}**`;

            // Cú pháp <@id> giúp Discord tự động render tên người dùng
            leaderboardText += `${rankIcon} <@${userRow.user_id}>: **${balance}** <:np:1557713580831547462>\n\n`;
        }

        topEmbed.setDescription(leaderboardText)
            .setFooter({ text: `Yêu cầu check sổ bởi Khách VIP ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await message.reply({ embeds: [topEmbed] });
    },
};