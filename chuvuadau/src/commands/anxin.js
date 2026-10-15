const { EmbedBuilder } = require('discord.js');

// Tạo một bộ nhớ tạm để đếm ngược thời gian chờ
const cooldowns = new Map();

module.exports = {
    name: 'anxin',
    description: 'Ra đường ăn xin kiếm Dâu',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;

        // LƯU Ý: Phải lấy dữ liệu Supabase TRƯỚC để check xem có Kim Bài không
        let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (selectError && selectError.code !== 'PGRST116') {
            return message.reply(`Lỗi đọc Supabase: \`${selectError.message}\``);
        }
        if (!data) data = { user_id: userId, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };

        // Kiểm tra buff Kim Bài
        let expireTime = data.kimbai_expire_time || 0;
        let hasKimBai = Date.now() < expireTime;

        // Xử lý Cooldown (3 phút = 180.000 ms) - Bỏ qua nếu có Kim Bài
        if (cooldowns.has(userId) && !hasKimBai) {
            const expirationTime = cooldowns.get(userId) + 180000;
            if (Date.now() < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - Date.now()) / 1000);
                const mins = Math.floor(timeLeft / 60);
                const secs = timeLeft % 60;
                
                const timeText = mins > 0 ? `${mins} phút ${secs} giây` : `${secs} giây`;
                return message.reply(`Công an đang đi tuần! Trốn đi, **${timeText}** nữa hãy ra xin tiếp.`);
            }
        }
        
        // Chỉ cài đặt lại Cooldown nếu KHÔNG có Kim Bài
        if (!hasKimBai) cooldowns.set(userId, Date.now());

        // Danh sách 18 kịch bản (6 Thành công, 6 Hòa, 6 Thất bại)
        const successMsgs = [
            "Một phú bà đi ngang qua thấy thương tình nên ném cho bạn",
            "Trổ tài hát bolero não nề, khán giả rơi nước mắt bo cho bạn",
            "Đang ngồi thì có người đi ngang qua làm rớt ví, bạn nhặt lên và trút được",
            "Cầm nón lá ra ngã tư múa lân, một đại gia đi ngang quẹt thẻ cho bạn",
            "Giả vờ vấp ngã đáng thương, crush chạy lại đỡ và an ủi bạn bằng",
            "Bà hàng xóm trúng số bao lô, vui vẻ dúi vào tay bạn"
        ];
        
        const neutralMsgs = [
            "Ngồi xin cả buổi sáng, nhưng người qua đường chỉ nhìn rồi lắc đầu. Đói meo!",
            "Chìa tay ra, một con chó chạy ngang qua liếm tay bạn rồi đi mất. Không được đồng nào.",
            "Gặp ngay ngày bảo vệ đi tuần, bạn phải ôm nón chạy trối chết, thu nhập bằng 0.",
            "Mỏi miệng xin xỏ, nhưng ai cũng tưởng bạn đang quay top top nên bơ đẹp. Trắng tay!",
            "Có người ném cho bạn tờ rơi quảng cáo hút hầm cầu. Thu nhập không có, chỉ có rác.",
            "Trời đổ mưa to, ướt như chuột lột phải chạy về nhà, hôm nay móm."
        ];
        
        const failMsgs = [
            "Đang ngồi xin tiền thì bị giang hồ khu vực thu phí bến bãi. Bạn ngậm ngùi nộp",
            "Lỡ xin nhầm ngay cảnh sát chìm, bạn bị phạt tội gây rối trật tự công cộng mất",
            "Một đàn bồ câu sà xuống mổ lủng túi áo, bạn đánh rơi mất",
            "Đói quá đi mượn tiền vốn làm bát phở, xin không được còn bị chủ quán chém giá, âm",
            "Đang ngủ gật, một tên móc túi chuyên nghiệp đi ngang cuỗm luôn của bạn",
            "Hắt xì một cái mạnh quá, lỡ tay làm rớt nón đựng tiền xuống cống, trôi tuột"
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
            
            embedColor = '#57F287'; 
            title = '💸 Vô mánh!';
            description = `${randomMsg} **+${amount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558>`;
            
        } else if (roll < 0.67) { 
            // 33% Hòa (Cộng 0)
            resultType = 'neutral';
            randomMsg = neutralMsgs[Math.floor(Math.random() * neutralMsgs.length)];
            
            embedColor = '#FEE75C'; 
            title = '🍂 Ế ẩm...';
            description = `${randomMsg}\n*(Không nhận được Dâu nào)*`;
            
        } else { 
            // 33% Thất bại (Trừ 500 - 2000)
            resultType = 'fail';
            amount = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
            randomMsg = failMsgs[Math.floor(Math.random() * failMsgs.length)];
            currentDau -= amount;
            if (currentDau < 0) currentDau = 0; 
            
            embedColor = '#ED4245'; 
            title = '❌ Xui xẻo!';
            description = `${randomMsg} **-${amount.toLocaleString('en-US')}** <a:Strawberry:1536056987668713558>`;
        }

        // Lưu lại dữ liệu (Ghi đè thuộc tính dau và đẩy thẳng biến data đã cập nhật lên)
        data.dau = currentDau;
        const { error: upsertError } = await supabase.from('economy').upsert(data);

        if (upsertError) {
            if (!hasKimBai) cooldowns.delete(userId);
            return message.reply(`Lỗi ghi Supabase: \`${upsertError.message}\``);
        }

        // Gửi Embed phản hồi
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(`${message.author},${description}`)
            // Thêm icon đồng hồ cát nhỏ nếu đang xài bùa
            .setFooter({ text: `Ví hiện tại: ${currentDau.toLocaleString('en-US')} Dâu${hasKimBai ? ' | ⏳ Đang buff Kim Bài' : ''}` });

        await message.reply({ embeds: [embed] });
    },
};