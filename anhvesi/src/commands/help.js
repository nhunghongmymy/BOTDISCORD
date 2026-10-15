const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Mở cuốn sổ tay hướng dẫn của Hộp Nhạc Trang Sức',
    async execute(message, args, db, userData, supabase) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink
            .setTitle('🎀 Cuốn Sổ Tay Của The Gemlit Dollhouse')
            .setDescription('Giai điệu cất lên với tiền tố lệnh là `m`. Dưới đây là danh sách toàn bộ các đặc quyền thời trang:')
            .addFields(
                {
                    name: '🩰 Tủ Đồ Thời Trang & Tinh Thể',
                    value: [
                        '• `mtinhthe [@user]`: Kiểm tra số dư Tinh Thể trong Hộp Nhạc.',
                        '• `mtop`: Xem bảng xếp hạng top 10 Nhà Sưu Tầm sành điệu nhất.',
                        '• `mdaily`: Điểm danh mở tủ đồ nhận **10.000** <a:gemheartpalepink:1551126619546976267> mỗi ngày.',
                        '• `mbaoduong`: Bảo dưỡng, làm đẹp và tương tác với các búp bê trong bộ sưu tập.',
                        '• `mdaopho`: Sải bước dạo phố tìm Tinh Thể lấp lánh (hồi chiêu 3 phút).',
                        '• `mtvm <số_lượng>`: Thử vận may thời trang cùng vòng quay hộp nhạc 50/50.',
                        '• `mthamdo <số_lượng>`: Trình diễn thảm đỏ né sự cố. Hào quang càng rực rỡ, lợi nhuận càng cao (Max x150).',
                        '• `mgive @user <số_lượng>`: Chia sẻ <a:gemheartpalepink:1551126619546976267> cho Stylist khác.',
                        '• 💬 *Trò chuyện giao lưu nhận tự động **500** <a:gemheartpalepink:1551126619546976267> mỗi phút.*'
                    ].join('\n')
                },
                {
                    name: '🛍️ Boutique Hộp Nhạc Trang Sức',
                    value: [
                        '• `mshop`: Mở cửa hàng mua sắm Thiết Kế Độc Quyền (Giá: **300.000** Tinh Thể/mẫu) và tuyển mộ Búp Bê.'
                    ].join('\n')
                },
                {
                    name: '🎀 Sổ Tay Bảo Dưỡng Búp Bê',
                    value: [
                        '• **Tuyển mộ:** Ghé `mshop` để rước búp bê về tủ đồ với giá 50.000 Tinh Thể.',
                        '• **Tương tác:** Dùng lệnh `mbaoduong` để cho ăn, kiểm tra độ no và tâm trạng.',
                        '• **Yêu cầu:** Búp bê sẽ đưa ra yêu cầu mỗi ngày. Gõ đúng lệnh yêu cầu ở kênh chat để nhận thưởng Tinh Thể.',
                        '• **Lịch trình:** Sau mỗi 12 tiếng, nếu búp bê đủ no và vui vẻ (>50%), búp bê có thể chạy sự kiện để đem về cho bạn 20.000 Tinh Thể cát-xê.',
                        '• 🚨 **LƯU Ý:** Nếu không bảo dưỡng quá 3 ngày, búp bê sẽ rời đi và mang theo 50.000 Tinh Thể của bạn!'
                    ].join('\n')
                },
                {
                    name: '👑 Dành Cho Quản Lý Boutique',
                    value: [
                        '• `madd @user <số_lượng>`: Đính thêm Tinh Thể vào tủ đồ của Nhà Sưu Tầm.',
                        '• `mremove @user <số_lượng>`: Gỡ bỏ Tinh Thể khỏi bộ sưu tập.',
                        '• `mhoi`: Mở cổng bình chọn Đêm Hội Vedette Lấp Lánh.',
                        '• `mpermit`: Cấp đặc quyền nắm giữ chìa khóa Hộp Nhạc (Chỉ Nhà Thiết Kế Trưởng).'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'The Gemlit Dollhouse • Giai điệu lấp lánh trên đám mây' })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    },
};