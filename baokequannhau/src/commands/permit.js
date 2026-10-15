const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'permit',
    description: 'Ủy quyền quản lý két Nắp Bia của quán (Chỉ dành cho Admin/Cổ đông)',
    async execute(message, args, db, userData, supabase) {
        // KHÓA CỨNG: Lệnh này CHỈ Admin gốc mới được xài, cấm tuyệt đối role được ủy quyền dùng lệnh này!
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Ấy ấy, chỉ có cô chủ Me An hoặc đại cổ đông (Administrator) mới có quyền giao lại sổ sách và chìa khóa két bia thôi nha!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF8C00') // Đổi sang màu cam/vàng của bia
            .setTitle('🗝️ Sổ Phân Quyền Quản Lý Quán')
            .setDescription('Vui lòng chọn các Chức vụ (Quản lý, Bảo kê, Trưởng ca...) được phép động vào két Nắp Bia để dùng các lệnh: `madd`, `mremove` và nút `Thêm Chiến Hữu` ở cửa hàng.\n*Lưu ý: Cổ đông lớn (Admin) mặc định luôn có sẵn quyền đụng két.*');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('select_authorized_roles')
            .setPlaceholder('Chọn các chức vụ để giao chìa khóa két...')
            .setMinValues(0)  // Có thể bỏ tick hết để thu hồi toàn bộ quyền
            .setMaxValues(10); // Chọn tối đa 10 role cùng lúc

        const row = new ActionRowBuilder().addComponents(roleSelect);

        await message.reply({ embeds: [embed], components: [row] });
    }
};