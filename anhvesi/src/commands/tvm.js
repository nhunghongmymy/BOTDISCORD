const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tvm',
    description: 'Thử vận may thời trang cùng vòng quay hộp nhạc tỷ lệ 50/50',
    async execute(message, args, db, userData, supabase) {
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
            return message.reply('Vui lòng nhập số lượng Tinh Thể hợp lệ để thử vận may! VD: `mtvm 10000`');
        }

        // Tăng giới hạn lên 1.000.000 Tinh Thể
        if (betAmount > 1000000) {
            return message.reply('Giới hạn tham gia tối đa là **1.000.000** <a:gemheartpalepink:1551126619546976267> mỗi lần để tránh làm hỏng tủ đồ lấp lánh của bạn!');
        }

        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Giai điệu bị lỗi nhịp khi đọc dữ liệu: \`${selectError.message}\``);
        }
        
        if (!data || Number(data.dau) < betAmount) {
            return message.reply('Stylist không có đủ Tinh Thể để tham gia sàn diễn này. Hãy sải bước dạo phố hoặc điểm danh tủ đồ để thu thập thêm nhé!');
        }

        
        // Gửi tin nhắn trạng thái chờ, không hiển thị emoji nhấp nháy
        const gambleMsg = await message.reply('🩰 Chiếc Hộp Nhạc đang xoay vòng giai điệu...');

        // Chờ đúng 8 giây
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        await delay(5000);

        const isWin = Math.random() < 0.5;
        let currentDau = Number(data.dau);
        let embedColor = '';
        let title = '';
        let desc = '';

        if (isWin) {
            currentDau += betAmount;
            embedColor = '#FF69B4'; // Chic Pink
            title = '✨ Tỏa Sáng Thảm Đỏ!';
            // ĐÃ SỬA: Thêm ${} cho betAmount và winEmoji
            desc = `Giai điệu cất lên rực rỡ! Khán giả trầm trồ với phong cách của bạn, thu về **${betAmount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>`;
        } else {
            currentDau -= betAmount;
            embedColor = '#FFFFFF'; // White (Hộp nhạc)
            title = '🥀 Trượt Chân Sàn Diễn!';
            // ĐÃ SỬA: Thêm ${} cho betAmount và loseEmoji
            desc = `Một sự cố thời trang đáng tiếc! Chiếc Váy Pha Lê bị vướng, bạn đã đánh rơi **${betAmount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>`;
        }

        // Cập nhật số tiền và lưu toàn bộ data
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            return gambleMsg.edit(`Giai điệu bị lỗi nhịp khi ghi dữ liệu: \`${upsertError.message}\``);
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`Nhà Sưu Tầm ${message.author}, ${desc}`)
            .setFooter({ text: `Tủ đồ hiện tại: ${currentDau.toLocaleString('en-US')} Tinh Thể` });

        await gambleMsg.edit({ content: '🎀 Màn trình diễn kết thúc!', embeds: [resultEmbed] });
    },
};