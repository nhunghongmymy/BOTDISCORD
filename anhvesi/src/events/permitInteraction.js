require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PermissionsBitField } = require('discord.js');




const supabase = createClient(process.env.SUPABASE_URL_ANHVESI, process.env.SUPABASE_KEY_ANHVESI);




module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isRoleSelectMenu()) return;
       
        if (interaction.customId === 'select_authorized_roles') {
            // Chốt chặn bảo mật thứ 2: Chống hacker bắt gói tin ấn nút thay Admin
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bạn không phải là Nhà Thiết Kế Trưởng để tinh chỉnh bản phác thảo này!', ephemeral: true });
            }




            await interaction.deferReply({ ephemeral: true });
            const selectedRoles = interaction.values;




            // Xóa sạch quyền cũ trên DB trước khi cập nhật quyền mới
            await supabase.from('authorized_roles').delete().neq('role_id', '0');




            if (selectedRoles.length > 0) {
                const insertData = selectedRoles.map(id => ({ role_id: id }));
                const { error } = await supabase.from('authorized_roles').insert(insertData);
               
                if (error) return interaction.editReply(`Giai điệu bị lỗi nhịp khi lưu dữ liệu: ${error.message}`);
               
                const roleMentions = selectedRoles.map(id => `<@&${id}>`).join(', ');
                return interaction.editReply(`✨ Hoàn hảo! Đặc quyền nắm giữ chìa khóa Hộp Nhạc và Boutique đã được giao phó cho: ${roleMentions}`);
            } else {
                return interaction.editReply(`🎀 Đã thu hồi toàn bộ chìa khóa. Hiện tại bộ sưu tập chỉ được quản lý độc quyền bởi Nhà Thiết Kế Trưởng.`);
            }
        }
    }
};



