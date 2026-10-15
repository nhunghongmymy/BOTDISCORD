const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'permit',
    description: 'Phân phát chìa khóa Hộp Nhạc Trang Sức cho các Quản lý (Chỉ dành cho Admin)',
    async execute(message, args, db, userData, supabase) {
        // KHÓA CỨNG: Lệnh này CHỈ Admin gốc mới được xài, cấm tuyệt đối role được ủy quyền dùng lệnh này!
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Chỉ Nhà Thiết Kế Trưởng (Administrator) của boutique mới được phép đúc chìa khóa!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FFFFFF') // White for system/general info
            .setTitle('🗝️ Bảng Phân Quyền Hộp Nhạc Trang Sức')
            .setDescription('Vui lòng chọn các Vai trò (Mana, Mod...) được phép nắm giữ đặc quyền thời trang để dùng: `madd`, `mremove` và nút `Thêm Vật Phẩm` trong Boutique.\n*Lưu ý: Nhà Thiết Kế Trưởng mặc định luôn có quyền.*');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('select_authorized_roles')
            .setPlaceholder('Chọn các Vai trò để trao chìa khóa...')
            .setMinValues(0)  // Có thể bỏ tick hết để thu hồi toàn bộ quyền
            .setMaxValues(10); // Chọn tối đa 10 role cùng lúc

        const row = new ActionRowBuilder().addComponents(roleSelect);

        await message.reply({ embeds: [embed], components: [row] });
    }
};