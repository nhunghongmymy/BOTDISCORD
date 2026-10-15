const { PermissionsBitField } = require('discord.js');

async function isAuthorized(member, supabase) {
    if (!member) return false;
    
    // Quản trị viên gốc (Admin) LUÔN LUÔN có quyền cao nhất, khỏi cần check DB
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

    // Đọc danh sách role được cấp phép từ Database
    const { data, error } = await supabase.from('authorized_roles').select('role_id');
    if (error || !data) return false;

    const authorizedRoleIds = data.map(r => r.role_id);
    
    // Nếu người dùng đang mang ít nhất 1 role nằm trong danh sách cấp phép -> OK
    return member.roles.cache.some(role => authorizedRoleIds.includes(role.id));
}

module.exports = { isAuthorized };