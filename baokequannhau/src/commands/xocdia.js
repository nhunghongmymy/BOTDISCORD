const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'xocdia', // Đổi tên từ tvm thành xocdia
    description: 'Thử nhân phẩm tại sới xóc đĩa góc quán nhậu tỷ lệ 50/50',
    async execute(message, args, db, userData, supabase) {
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
            return message.reply('Vui lòng đặt cược số Nắp Bia hợp lệ! VD: `mxocdia 10000`');
        }

        // Tăng giới hạn lên 1.000.000 Nắp Bia
        if (betAmount > 1000000) {
            return message.reply('Bảo Kê không nhận kèo quá **1.000.000** <:np:1557713580831547462> mỗi ván để tránh sập tiệm của cô chủ nha!');
        }

        const userId = message.author.id;
        
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Hệ thống sổ sách bị lag: \`${selectError.message}\``);
        }
        
        if (!data || Number(data.dau) < betAmount) {
            return message.reply('Cháy túi rồi khách VIP ơi, làm gì đủ Nắp Bia để theo kèo này! Đi dạo quanh quán nhặt nhạnh thêm rồi hẵng quay lại sới nhé.');
        }

        // Gửi tin nhắn trạng thái chờ
        const gambleMsg = await message.reply('🎲 Anh Bảo Kê đang lắc bát xóc đĩa lạch cạch lạch cạch...');

        // Chờ đúng 5 giây
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        await delay(5000);

        const isWin = Math.random() < 0.5;
        let currentDau = Number(data.dau);
        let embedColor = '';
        let title = '';
        let desc = '';

        if (isWin) {
            currentDau += betAmount;
            embedColor = '#00FF00'; // Xanh lá - Thắng cược
            title = '💰 MỞ BÁT: HÚP TRỌN MÂM!';
            // ĐÃ SỬA: Thêm ${} cho betAmount
            desc = `Nhân phẩm chói lóa! Bát mở ra chuẩn bài, khách VIP ẵm trọn **${betAmount.toLocaleString('en-US')}** <:np:1557713580831547462> tiền cược mang về bàn.`;
        } else {
            currentDau -= betAmount;
            embedColor = '#FF0000'; // Đỏ - Thua cược
            title = '💸 MỞ BÁT: RA ĐÊ MÀ Ở!';
            // ĐÃ SỬA: Thêm ${} cho betAmount
            desc = `Đen thôi đỏ quên đi! Mở bát ra chả thấy gì, khách VIP bay mất sạch **${betAmount.toLocaleString('en-US')}** <:np:1557713580831547462> tiền mồi nhậu.`;
        }

        // Cập nhật số tiền và lưu toàn bộ data
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            return gambleMsg.edit(`Sổ sách quán đang lỗi: \`${upsertError.message}\``);
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`Dân chơi ${message.author}, ${desc}`)
            .setFooter({ text: `Quỹ nhậu hiện tại: ${currentDau.toLocaleString('en-US')} Nắp Bia` });

        await gambleMsg.edit({ content: '🎲 Bát đã mở, tay đưa ra nào!', embeds: [resultEmbed] });
    },
};