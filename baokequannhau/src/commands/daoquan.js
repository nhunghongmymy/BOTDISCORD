const { EmbedBuilder } = require('discord.js');

// Tạo một bộ nhớ tạm để đếm ngược thời gian chờ
const cooldowns = new Map();

module.exports = {
    name: 'daoquan', // Đổi từ daopho thành daoquan cho hợp concept
    description: 'Dạo quanh gầm bàn và bãi xe của quán để lượm mót Nắp Bia',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;

        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Hệ thống quán đang bị kẹt bill khi đọc dữ liệu: \`${selectError.message}\``);
        }
        
        // ĐÃ SỬA: Loại bỏ các trường kimbai
        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };

        // Xử lý Cooldown (3 phút = 180.000 ms)
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 180000;
            if (Date.now() < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                
                // ĐÃ SỬA: Thêm ${} cho biến secs
                const timeText = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
                return message.reply(`Nhân viên đang quét dọn bãi chiến trường! Hãy kiếm chỗ ngồi uống nước lọc giải rượu, **${timeText}** nữa hẵng đi dạo tiếp nhé.`);
            }
        }
        
        // Cài đặt lại Cooldown
        cooldowns.set(userId, Date.now());

        // Danh sách 18 kịch bản (6 Thành công, 6 Hòa, 6 Thất bại)
        const successMsgs = [
            "Cô chủ Me An đi ngang qua, thấy bạn nhậu nhiệt tình quá nên thưởng nóng cho bạn",
            "Đang đi dạo quanh bãi xe thì lụm được cọc tiền của ông khách say xỉn đánh rơi, bạn đổi ra được",
            "Bạn xung phong lên hát loa kẹo kéo bài 'Đắp Mộ Cuộc Tình', cả quán vỗ tay bo cho bạn",
            "Phụ lặt rau, bưng bê mồi nhậu giúp nhân viên quán, bà chủ nháy mắt thưởng cho bạn",
            "Bạn phát hiện một mâm mồi xịn ở bàn bên khách vừa bỏ đi, lén hốt nốt và quy đổi ra được",
            "Giao lưu chén tạc chén thù với bàn bên cạnh thành công, người ta sảng khoái quyên góp cho bạn"
        ];
        
        const neutralMsgs = [
            "Dạo quanh quán cả buổi nhưng chẳng thấy Nắp Bia nào rơi vãi dưới gầm bàn. Trắng tay đi về!",
            "Lượn lờ ra bãi xe tính lụm mót nhưng bị anh Bảo Kê lườm rách mặt. Khum xơ múi được gì.",
            "Đang định đi loanh quanh lượm lặt thì bị hội bạn nhậu lôi cổ lại bàn ép uống 3 ly phạt. Bụng óc ách nước!",
            "Đi vệ sinh xong vô tình đi lạc sang quán trà sữa kế bên. Chẳng kiếm chác được gì.",
            "Gặp người bán đậu phộng dạo mời chào nhưng bạn không mua. Tay không đi về bàn.",
            "Mải mê ngắm nhan sắc cô chủ Me An nên quên mất mục đích đi lượm đồ. Đành lủi thủi quay về chỗ."
        ];
        
        const failMsgs = [
            "Đang đi dạo lảo đảo lỡ chân đá đổ thùng bia của quán, đành ngậm ngùi đền",
            "Đi nhầm vào phòng VIP của giang hồ thôn, xém bị xách cổ ra ngoài, phải nộp mạng",
            "Mải nhìn các em gái xinh xắn lỡ trượt chân ngã sấp mặt vào thau đá, tốn tiền thuốc men mất",
            "Vui mồm gọi thêm dĩa mực nướng với 5 lon bia nhưng bạn nhậu bùng bill, thâm hụt",
            "Đang say ngà ngà thiu thiu ngủ ngoài hiên, bị đạo chích đi ngang nẫng mất của bạn",
            "Múa quạt hăng quá văng luôn chiếc điện thoại xuống sàn vỡ màn hình, tốn tiền đem đi sửa mất"
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
            
            embedColor = '#FF8C00'; // Màu cam/vàng của bia
            title = '🍻 Thơm Phức Mùi Lúa Mạch!';
            // ĐÃ SỬA: Thêm ${} cho randomMsg và cách khoảng trắng
            description = `${randomMsg} **+${amount.toLocaleString('en-US')}** <:np:1557713580831547462>`;
            
        } else if (roll < 0.67) {
            // 33% Hòa (Cộng 0)
            resultType = 'neutral';
            randomMsg = neutralMsgs[Math.floor(Math.random() * neutralMsgs.length)];
            
            embedColor = '#FFFFFF'; // White (Nhẹ nhàng êm ái)
            title = '💨 Đời Không Như Là Mơ...';
            description = `${randomMsg}\n*(Hảo hán không nhận được Nắp Bia nào)*`;
            
        } else {
            // 33% Thất bại (Trừ 500 - 2000)
            resultType = 'fail';
            amount = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
            randomMsg = failMsgs[Math.floor(Math.random() * failMsgs.length)];
            currentDau -= amount;
            if (currentDau < 0) currentDau = 0;
            
            embedColor = '#FF0000'; // Đỏ (Báo động)
            title = '🤕 Toang Rồi Hảo Hán Ạ!';
            // ĐÃ SỬA: Thêm ${} cho randomMsg và cách khoảng trắng
            description = `${randomMsg} **-${amount.toLocaleString('en-US')}** <:np:1557713580831547462>`;
        }

        // Lưu lại dữ liệu (Ghi đè thuộc tính dau và đẩy thẳng biến data đã cập nhật lên)
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            cooldowns.delete(userId); // Xóa thời gian chờ nếu gặp lỗi lưu data
            return message.reply(`Hệ thống tính tiền của quán đang bị chập mạch: \`${upsertError.message}\``);
        }

        // Gửi Embed phản hồi
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`Khách VIP ${message.author},\n${description}`)
            // ĐÃ SỬA: Dọn dẹp Kim Bài và thêm ${} cho currentDau
            .setFooter({ text: `Quỹ nhậu hiện tại: ${currentDau.toLocaleString('en-US')} Nắp Bia` });

        await message.reply({ embeds: [embed] });
    },
};