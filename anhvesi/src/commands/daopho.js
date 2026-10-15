const { EmbedBuilder } = require('discord.js');

// Tạo một bộ nhớ tạm để đếm ngược thời gian chờ
const cooldowns = new Map();

module.exports = {
    name: 'daopho',
    description: 'Dạo bước trên con phố thời trang để tìm kiếm Tinh Thể lấp lánh',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;

        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Giai điệu bị lỗi nhịp khi đọc dữ liệu: \`${selectError.message}\``);
        }
        
        // ĐÃ SỬA: Loại bỏ các trường kimbai
        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };

        // Xử lý Cooldown (3 phút = 180.000 ms) - Đã bỏ check Kim Bài
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 180000;
            if (Date.now() < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                
                // ĐÃ SỬA: Thêm ${} cho biến secs
                const timeText = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
                return message.reply(`Buổi trình diễn thời trang đang chuẩn bị hậu trường! Hãy nghỉ ngơi, **${timeText}** nữa hãy quay lại sải bước nhé.`);
            }
        }
        
        // Cài đặt lại Cooldown
        cooldowns.set(userId, Date.now());

        // Danh sách 18 kịch bản (6 Thành công, 6 Hòa, 6 Thất bại)
        const successMsgs = [
            "Một nhà thiết kế danh tiếng đi ngang qua, ấn tượng với gu thời trang của bạn và tặng bạn",
            "Giai điệu hộp nhạc vang lên, bạn xoay vòng múa ballet duyên dáng, khán giả tán thưởng và tặng bạn",
            "Bạn vô tình nhặt được một chiếc Khớp Nối Mạ Vàng lấp lánh trên phố, đem bán được",
            "Bạn diện bộ Váy Pha Lê lộng lẫy dạo phố, một nhiếp ảnh gia bị thu hút và trả cát-xê cho bạn",
            "Bạn vấp ngã nhưng vẫn giữ được thần thái sành điệu, một Stylist nổi tiếng chạy lại đỡ và tặng bạn",
            "Một tín đồ thời trang vừa mua trúng món hời, vui vẻ chia sẻ cùng bạn"
        ];
        
        const neutralMsgs = [
            "Dạo phố cả buổi sáng nhưng chẳng có Cửa Hàng Búp Bê nào mở cửa. Trắng tay!",
            "Một cơn gió thổi qua làm tung bay dải Ruy Băng Ngọc Trai của bạn. Không thu hoạch được gì.",
            "Gặp ngay ngày tuần lễ thời trang đóng cửa, bạn đành ngậm ngùi quay về hộp nhạc.",
            "Tạo dáng mỏi cả lưng nhưng ai cũng tưởng bạn là ma-nơ-canh nên lơ đẹp. Tủ đồ trống trơn!",
            "Có người ném cho bạn tờ rơi quảng cáo tiệm giặt ủi. Không có Tinh Thể, chỉ có rác.",
            "Trời đổ mưa to làm ướt sũng lớp ren váy, bạn phải chạy vội về nhà, hôm nay chẳng có gì lấp lánh."
        ];
        
        const failMsgs = [
            "Đang dạo phố thì lỡ tay làm vỡ Lọ Nước Hoa Tinh Thể của một cửa tiệm, bạn ngậm ngùi đền",
            "Vô tình vướng váy vào hàng rào hoa hồng, bạn phải chi tiền sửa chữa mất",
            "Một đàn bồ câu sà xuống mổ đứt sợi Ruy Băng Ngọc Trai, bạn đánh rơi mất",
            "Mê mẩn bộ sưu tập mùa mới, bạn cà thẻ quá tay tại Cửa Hàng Búp Bê, thâm hụt",
            "Đang thiu thiu ngủ trong hộp nhạc, một chú quạ bay qua cuỗm mất của bạn",
            "Xoay vòng quá nhanh theo tiếng nhạc, bạn làm rớt túi xách xuống hồ nước, trôi tuột"
        ];

        // Random kết quả
        const roll = Math.random();
        let resultType = '';
        let amount = 0;
        let randomMsg = '';
        let currentDau = Number(data.dau);

        let embedColor = '';
        let title = '';
        let description = '';

        if (roll < 0.34) {
            // 34% Thành công (Cộng 1000 - 5000)
            resultType = 'success';
            amount = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
            randomMsg = successMsgs[Math.floor(Math.random() * successMsgs.length)];
            currentDau += amount;
            
            embedColor = '#FF69B4'; // Chic Pink
            title = '✨ Tỏa Sáng Khắp Phố!';
            // ĐÃ SỬA: Thêm ${} cho randomMsg và cách khoảng trắng
            description = `${randomMsg} **+${amount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>`;
            
        } else if (roll < 0.67) {
            // 33% Hòa (Cộng 0)
            resultType = 'neutral';
            randomMsg = neutralMsgs[Math.floor(Math.random() * neutralMsgs.length)];
            
            embedColor = '#FFFFFF'; // White (Hộp nhạc mộng mơ)
            title = '🩰 Giai Điệu Buồn...';
            description = `${randomMsg}\n*(Không nhận được Tinh Thể nào)*`;
            
        } else {
            // 33% Thất bại (Trừ 500 - 2000)
            resultType = 'fail';
            amount = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
            randomMsg = failMsgs[Math.floor(Math.random() * failMsgs.length)];
            currentDau -= amount;
            if (currentDau < 0) currentDau = 0;
            
            embedColor = '#FFB6C1'; // Light Pink for failure
            title = '🥀 Sự Cố Thời Trang!';
            // ĐÃ SỬA: Thêm ${} cho randomMsg và cách khoảng trắng
            description = `${randomMsg} **-${amount.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>`;
        }

        // Lưu lại dữ liệu (Ghi đè thuộc tính dau và đẩy thẳng biến data đã cập nhật lên)
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            cooldowns.delete(userId); // Xóa thời gian chờ nếu gặp lỗi lưu data
            return message.reply(`Giai điệu bị lỗi nhịp khi ghi dữ liệu: \`${upsertError.message}\``);
        }

        // Gửi Embed phản hồi
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`Nhà Sưu Tầm ${message.author},\n${description}`)
            // ĐÃ SỬA: Dọn dẹp Kim Bài và thêm ${} cho currentDau
            .setFooter({ text: `Tủ đồ hiện tại: ${currentDau.toLocaleString('en-US')} Tinh Thể` });

        await message.reply({ embeds: [embed] });
    },
};