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
            // 1. TÌM HOẶC TỰ ĐỘNG TẠO ROLE "VEDETTE LẤP LÁNH"
            const roleName = 'Vedette Lấp Lánh';
            // Tìm role trong cache của server
            let baHoRole = message.guild.roles.cache.find(r => r.name === roleName);

            // Nếu chưa có, bot sẽ dùng quyền Admin để tự tạo
            if (!baHoRole) {
                baHoRole = await message.guild.roles.create({
                    name: roleName,
                    color: '#FF69B4', // Chic Pink
                    hoist: true,      // Bật hiển thị tách biệt với người dùng online khác
                    reason: 'Tự động tạo Role cho hệ thống Hộp Nhạc Trang Sức'
                });
                console.log(`Đã tự động đúc danh hiệu mới: ${roleName}`);
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
                console.error('Giai điệu bị lỗi nhịp khi đọc dữ liệu (Event Role):', error.message);
                return;
            }

            const currentDau = data ? Number(data.dau) : 0;
            const THRESHOLD = 1000000; // Mốc 1.000.000 Tinh Thể
            const hasRole = member.roles.cache.has(baHoRole.id);

            // 3. KIỂM TRA VÀ XỬ LÝ (CẤP/TƯỚC ROLE)
            if (currentDau >= THRESHOLD && !hasRole) {
                // Đủ 1 triệu Tinh Thể nhưng chưa có Role -> Cấp
                await member.roles.add(baHoRole);
                
                // ĐÃ SỬA LỖI BIẾN Ở DÒNG DƯỚI ĐÂY (Thêm ${} và sửa lại khoảng trắng)
                await message.reply(`✨ **VEDETTE TỎA SÁNG!** Giai điệu đã cất lên chúc mừng Stylist tích lũy đủ **${THRESHOLD.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>. Tủ đồ của bạn thêm phần lấp lánh, hệ thống trao tặng bạn danh hiệu kiêu kỳ **${roleName}**!`);
                
            } else if (currentDau < THRESHOLD && hasRole) {
                // Tiêu xài tụt dưới 1 triệu Tinh Thể mà vẫn cầm Role -> Tước
                await member.roles.remove(baHoRole);
                await message.reply(`🥀 **BÁO ĐỘNG THỜI TRANG!** Bộ sưu tập của bạn đã rớt xuống dưới mốc Vedette. Hộp nhạc đành khép lại và thu hồi danh hiệu **${roleName}**!`);
            }
            
        } catch (error) {
            console.error('Sự cố thời trang auto role:', error);
        }
    },
};