const { PermissionsBitField } = require('discord.js');




async function isAuthorized(member, supabase) {
    if (!member) return false;
   
    // Nhà Thiết Kế Trưởng (Admin) LUÔN LUÔN có đặc quyền cao nhất, không cần kiểm tra chìa khóa
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;




    // Đọc danh sách vai trò được nắm giữ chìa khóa Hộp Nhạc từ Database
    const { data, error } = await supabase.from('authorized_roles').select('role_id');
    if (error || !data) return false;




    const authorizedRoleIds = data.map(r => r.role_id);
   
    // Nếu Stylist/Quản lý đang mang ít nhất 1 vai trò nằm trong danh sách cấp phép -> Cho phép sải bước
    return member.roles.cache.some(role => authorizedRoleIds.includes(role.id));
}




module.exports = { isAuthorized };



