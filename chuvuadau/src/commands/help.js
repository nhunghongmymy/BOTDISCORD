const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Xem bảng hướng dẫn lệnh',
    async execute(message, args, db, userData, supabase) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('🍓 Bảng Hướng Dẫn Sử Dụng Bot')
            .setDescription('Tiền tố lệnh của hệ thống là `m`. Dưới đây là danh sách toàn bộ các tính năng:')
            .addFields(
                {
                    name: '👛 Kinh Tế & Dâu',
                    value: [
                        '• `mdau [@user]`: Kiểm tra số dư trong ví Dâu.',
                        '• `mtop`: Xem bảng xếp hạng top 10 đại gia Dâu.',
                        '• `mdaily`: Điểm danh nhận **10.000** Dâu mỗi ngày.',
                        '• `manxin`: Ra vỉa hè kiếm Dâu (hồi chiêu 3 phút).',
                        '• `mgive @user <số_tiền>`: Chuyển Dâu cho người khác.',
                        '• 💬 *Nhắn tin giao lưu nhận tự động **500** Dâu mỗi phút.*'
                    ].join('\n')
                },
                {
                    name: '🎮 Giải Trí & Minigame',
                    value: [
                        '• `mcuoc <số_tiền>`: Chơi chẵn lẻ 50/50 với nhà cái.',
                        '• `mdomin <số_tiền>`: Game Dò mìn tâm lý chiến. Đào càng sâu lãi càng khủng (Max x150).',
                    ].join('\n')
                },
                {
                    name: '🎀 Cửa Hàng Roleplay',
                    value: [
                        '• `mshop`: Mở menu mua link private nhân vật (Giá: **300.000** Dâu/char).'
                    ].join('\n')
                },
                {
                    name: '👑 Dành Cho Quản Trị Viên',
                    value: [
                        '• `madd @user <số_dâu>`: Bơm thêm Dâu cho thành viên.',
                        '• `mremove @user <số_dâu>`: Thu hồi bớt Dâu của thành viên.',
                        '• `msong <thời gian>`: Tổ chức Cuộc thi Chồng khỏe Chồng đẹp.',
                        '• `mpermit`: Cấp quyền quản lý kho bạc cho Role (Chỉ Admin gốc).'
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Rô Rô An An • Hệ thống tự động trên đám mây' })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    },
};