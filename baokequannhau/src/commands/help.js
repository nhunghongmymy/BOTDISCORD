const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Mở Menu & Cẩm Nang của Quán Nhậu Ba Miền',
    async execute(message, args, db, userData, supabase) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng của bia
            .setTitle('🍻 Menu & Cẩm Nang Quán Nhậu Ba Miền')
            .setDescription('Gọi phục vụ với tiền tố lệnh là `m`. Dưới đây là toàn bộ dịch vụ của quán:')
            .addFields(
                {
                    name: '🍺 Quỹ Nhậu & Nắp Bia',
                    value: [
                        '• `mnap [@user]`: Kiểm tra số dư Nắp Bia trong túi.',
                        '• `mtop`: Xem bảng vàng top 10 đại gia quán nhậu.',
                        '• `mdaily`: Điểm danh bàn nhậu nhận **10.000** <:np:1557713580831547462> mỗi ngày.',
                        '• `mrunhau`: Gọi bạn nhậu ra bàn để cụng ly, tâm sự, và gọi mồi.',
                        '• `mdaoquan`: Đi dạo quanh bãi xe và gầm bàn lượm mót Nắp Bia (hồi chiêu 3 phút).',
                        '• `mxocdia <số_cược>`: Thử nhân phẩm tại sới xóc đĩa góc quán tỷ lệ 50/50.',
                        '• `mlatnap <số_cược>`: Chơi lật thùng phế liệu dò mìn né gián. Kèo rủi ro cao, lợi nhuận lớn (Max x150).',
                        '• `mgive @user <số_lượng>`: Bao kèo, mời <:np:1557713580831547462> cho chiến hữu khác.',
                        '• 💬 *Tám chuyện rôm rả tại quán nhận tự động **500** <:np:1557713580831547462> mỗi phút.*'
                    ].join('\n')
                },
                {
                    name: '🛍️ Cửa Hàng & Dịch Vụ VIP',
                    value: [
                        '• `mshop`: Mở menu mua **Link Private của Me An** (Giá: **300.000** Nắp Bia) và thu nạp bạn nhậu.'
                    ].join('\n')
                },
                {
                    name: '🍗 Cẩm Nang Dân Nhậu',
                    value: [
                        '• **Kết nạp:** Ghé `mshop` để rước chiến hữu về bàn với giá 50.000 Nắp Bia.',
                        '• **Tương tác:** Dùng lệnh `mrunhau` để gọi mồi, kiểm tra độ no và độ hưng phấn.',
                        '• **Gạ kèo:** Chiến hữu sẽ gạ kèo mỗi ngày. Gõ đúng lệnh yêu cầu ở kênh chat để nhận thưởng Nắp Bia.',
                        '• **Phụ quán:** Sau mỗi 12 tiếng, nếu chiến hữu đủ no và sung (>50%), có thể rủ phụ chạy bàn để kiếm 20.000 Nắp Bia tiền bo.',
                        '• 🚨 **LƯU Ý:** Nếu bỏ bê không cụng ly quá 3 ngày, bạn nhậu sẽ dỗi bỏ sang bàn khác và cuỗm mất 50.000 Nắp Bia của bạn!'
                    ].join('\n')
                },
                {
                    name: '👑 Dành Cho Ban Quản Lý Quán',
                    value: [
                        '• `madd @user <số_lượng>`: Bơm thêm Nắp Bia cho khách VIP.',
                        '• `mremove @user <số_lượng>`: Tịch thu Nắp Bia, phạt khách quậy phá.',
                        '• `mthinhau`: Mở sới cá cược Đại Hội Thần Tửu xem ai uống sung nhất.',
                        '• `mpermit`: Giao sổ sách và chìa khóa két Nắp Bia (Chỉ dành cho Cổ đông/Admin).'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Quán Nhậu Ba Miền • Không say không về' })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    },
};