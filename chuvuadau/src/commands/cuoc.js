const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'cuoc',
    description: 'Cược Dâu 1:1 tỷ lệ 50/50',
    async execute(message, args, db, userData, supabase) {
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
            return message.reply('Vui lòng nhập số tiền hợp lệ để cược! VD: `mcuoc 10000`');
        }

        // Tăng giới hạn lên 1.000.000 Dâu
        if (betAmount > 1000000) {
            return message.reply('Giới hạn cược tối đa là **1.000.000** <a:Strawberry:1536056987668713558> mỗi lần để tránh tán gia bại sản!');
        }

        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Lỗi đọc Supabase: \`${selectError.message}\``);
        }
        
        if (!data || Number(data.dau) < betAmount) {
            return message.reply('Bạn không có đủ Dâu để cược mức này. Điểm danh hoặc ra vỉa hè ăn xin thêm đi!');
        }

        const winEmoji = '<:mongcnhin:1554156776910356500>';
        const loseEmoji = '<:mocry:1554157034767777872>';
        
        // Gửi tin nhắn trạng thái chờ, không hiển thị emoji nhấp nháy
        const gambleMsg = await message.reply('🎲 Nhà cái đang xóc đĩa...');

        // Chờ đúng 8 giây
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        await delay(8000);

        const isWin = Math.random() < 0.5;
        let currentDau = Number(data.dau);
        let embedColor = '';
        let title = '';
        let desc = '';

        if (isWin) {
            currentDau += betAmount;
            embedColor = '#57F287';
            title = '🎉 Thắng cược!';
            desc = `Tuyệt vời! Nhà cái khóc thét, bạn hốt được **${betAmount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558>${winEmoji}`;
        } else {
            currentDau -= betAmount;
            embedColor = '#ED4245';
            title = '💸 Thua trắng!';
            desc = `Đen thôi đỏ quên đi! Bạn đã cúng cho nhà cái **${betAmount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558>${loseEmoji}`;
        }

        // Cập nhật số tiền và lưu toàn bộ data (để không đè mất các cột dữ liệu khác như kimbai_expire_time)
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            return gambleMsg.edit(`Lỗi ghi Supabase: \`${upsertError.message}\``);
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`${message.author}, ${desc}`)
            .setFooter({ text: `Ví hiện tại: ${currentDau.toLocaleString('en-US')} Dâu` });

        await gambleMsg.edit({ content: '🎲 Chốt hạ!', embeds: [resultEmbed] });
    },
};