const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'permit',
    description: 'Ủy quyền quản lý bot (Chỉ dành cho Admin)',
    async execute(message, args, db, userData, supabase) {
        // KHÓA CỨNG: Lệnh này CHỈ Admin gốc mới được xài, cấm tuyệt đối role được ủy quyền dùng lệnh này!
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Chỉ Quản trị viên (Administrator) của server mới được phân quyền!');
        }

        const embed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('🛡️ Bảng Phân Quyền Quản Lý')
            .setDescription('Vui lòng chọn các Role (Mana, Mod...) được phép sử dụng các lệnh: `madd`, `mremove` và nút `Thêm Link` trong Shop.\n*Lưu ý: Quản trị viên mặc định luôn có quyền.*');

        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('select_authorized_roles')
            .setPlaceholder('Click vào đây để chọn các Role...')
            .setMinValues(0)  // Có thể bỏ tick hết để thu hồi toàn bộ quyền
            .setMaxValues(10); // Chọn tối đa 10 role cùng lúc

        const row = new ActionRowBuilder().addComponents(roleSelect);

        await message.reply({ embeds: [embed], components: [row] });
    }
};