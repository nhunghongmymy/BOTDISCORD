const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Xem bảng xếp hạng các Nhà Sưu Tầm sành điệu sở hữu nhiều <a:gemheartpalepink:1551126619546976267> nhất',
    async execute(message, args, db, userData, supabase) {
        // Truy xuất top 10 người có số Dâu cao nhất, sắp xếp giảm dần (Giữ nguyên logic database)
        const { data, error } = await supabase
            .from('economy')
            .select('user_id, dau')
            .order('dau', { ascending: false })
            .limit(10);

        if (error) {
            return message.reply(`Giai điệu bị lỗi nhịp khi đọc dữ liệu: \`${error.message}\``);
        }

        if (!data || data.length === 0) {
            return message.reply('Tủ đồ và hộp nhạc hiện đang trống không. Giai điệu chưa cất lên và các ma-nơ-canh vẫn đang chờ được lấp đầy!');
        }

        const topEmbed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink
            .setTitle('🩰 Bảng Xếp Hạng Nhà Sưu Tầm Sành Điệu 💎')
            .setThumbnail(message.guild ? message.guild.iconURL({ dynamic: true }) : null);

        let leaderboardText = '';

        for (let i = 0; i < data.length; i++) {
            const userRow = data[i];
            const balance = Number(userRow.dau).toLocaleString('en-US');
           
            // Gắn huy chương cho top 3
            let rankIcon = '';
            if (i === 0) rankIcon = '👑'; // Vương Miện Dây Cót
            else if (i === 1) rankIcon = '💎';
            else if (i === 2) rankIcon = '🎀';
            else rankIcon = `**#${i + 1}**`;

            // Cú pháp <@id> giúp Discord tự động render tên người dùng
            // ĐÃ SỬA: Thêm ${} cho rankIcon và userRow.user_id
            leaderboardText += `${rankIcon}<@${userRow.user_id}>: **${balance}** <a:gemheartpalepink:1551126619546976267>\n\n`;
        }

        topEmbed.setDescription(leaderboardText)
            .setFooter({ text: `Giai điệu lấp lánh yêu cầu bởi Stylist ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await message.reply({ embeds: [topEmbed] });
    },
};