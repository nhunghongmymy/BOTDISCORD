require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PermissionsBitField } = require('discord.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isRoleSelectMenu()) return;
        
        if (interaction.customId === 'select_authorized_roles') {
            // Chốt chặn bảo mật thứ 2: Chống hacker bắt gói tin ấn nút thay Admin
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Ấy ấy, bạn không phải là Cổ đông hay cô chủ Me An, đừng hòng táy máy vào sổ sách của quán!', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });
            const selectedRoles = interaction.values;

            // Xóa sạch quyền cũ trên DB trước khi cập nhật quyền mới
            await supabase.from('authorized_roles').delete().neq('role_id', '0');

            if (selectedRoles.length > 0) {
                const insertData = selectedRoles.map(id => ({ role_id: id }));
                const { error } = await supabase.from('authorized_roles').insert(insertData);
                
                if (error) return interaction.editReply(`Ối, nhân viên lỡ làm đổ bia lên sổ sách: ${error.message}`);
                
                const roleMentions = selectedRoles.map(id => `<@&${id}>`).join(', ');
                return interaction.editReply(`🍻 Chuẩn bài! Chìa khóa két Nắp Bia và quyền quản lý cửa hàng đã được tin tưởng giao phó cho các chức vụ: ${roleMentions}`);
            } else {
                return interaction.editReply(`🔒 Đã thu hồi toàn bộ chìa khóa phụ. Hiện tại két bia và sổ sách chỉ được quản lý độc quyền bởi đích thân cô chủ Me An và các đại cổ đông.`);
            }
        }
    }
};