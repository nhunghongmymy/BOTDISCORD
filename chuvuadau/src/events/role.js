const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Khởi tạo Supabase ngay trong file event để hoạt động độc lập
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        // Bỏ qua tin nhắn của bot hoặc tin nhắn nhắn riêng (DM)
        if (message.author.bot || !message.guild) return;

        try {
            // 1. TÌM HOẶC TỰ ĐỘNG TẠO ROLE "BÁ HỘ DÂU"
            const roleName = 'Bá Hộ Dâu';
            // Tìm role trong cache của server
            let baHoRole = message.guild.roles.cache.find(r => r.name === roleName);

            // Nếu chưa có, bot sẽ dùng quyền Admin để tự tạo
            if (!baHoRole) {
                baHoRole = await message.guild.roles.create({
                    name: roleName,
                    color: '#FFD700', // Mã màu Vàng Gold
                    hoist: true,      // Bật hiển thị tách biệt với người dùng online khác
                    reason: 'Tự động tạo Role cho hệ thống kinh tế Rô Rô An An'
                });
                console.log(`Đã tự động tạo mới role: ${roleName}`);
            }

            const member = message.member;
            if (!member) return;

            // 2. LẤY SỐ DƯ TỪ SUPABASE
            const { data, error } = await supabase
                .from('economy')
                .select('dau')
                .eq('user_id', message.author.id)
                .single();

            // Nếu bị lỗi (khác lỗi chưa có dữ liệu) thì báo ra console
            if (error && error.code !== 'PGRST116') {
                console.error('Lỗi đọc Supabase (Event Role):', error.message);
                return;
            }

            const currentDau = data ? Number(data.dau) : 0;
            const THRESHOLD = 1000000; // Mốc 1.000.000 Dâu
            const hasRole = member.roles.cache.has(baHoRole.id);

            // 3. KIỂM TRA VÀ XỬ LÝ (CẤP/TƯỚC ROLE)
            if (currentDau >= THRESHOLD && !hasRole) {
                // Đủ 1 triệu Dâu nhưng chưa có Role -> Cấp
                await member.roles.add(baHoRole);
                await message.reply(`🎉 **ĐẠI GIA XUẤT HIỆN!** Chúc mừng bạn đã tích lũy đủ **${THRESHOLD.toLocaleString('en-US')}** Dâu. Hệ thống thăng cấp bạn thành **${roleName}**!`);
                
            } else if (currentDau < THRESHOLD && hasRole) {
                // Tiêu xài tụt dưới 1 triệu Dâu mà vẫn cầm Role -> Tước
                await member.roles.remove(baHoRole);
                await message.reply(`📉 **CẢNH BÁO TÀI CHÍNH!** Tài sản của bạn đã rớt xuống dưới mốc đại gia. Hệ thống đã thu hồi danh hiệu **${roleName}**!`);
            }
            
        } catch (error) {
            console.error('Lỗi hệ thống auto role:', error);
        }
    },
};