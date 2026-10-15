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
            // 1. TÌM HOẶC TỰ ĐỘNG TẠO ROLE "ĐẠI GIA NẮP BIA"
            const roleName = 'Đại Gia Nắp Bia';
            // Tìm role trong cache của server
            let baHoRole = message.guild.roles.cache.find(r => r.name === roleName);

            // Nếu chưa có, bot sẽ dùng quyền Admin để tự tạo
            if (!baHoRole) {
                baHoRole = await message.guild.roles.create({
                    name: roleName,
                    color: '#FF8C00', // Màu cam/vàng của bia
                    hoist: true,      // Bật hiển thị tách biệt với người dùng online khác
                    reason: 'Tự động tạo Role cho khách VIP của Quán Nhậu Ba Miền'
                });
                console.log(`Đã gò xong biển hiệu mới: ${roleName}`);
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
                console.error('Hệ thống máy tính tiền bị kẹt bill (Event Role):', error.message);
                return;
            }

            const currentDau = data ? Number(data.dau) : 0;
            const THRESHOLD = 1000000; // Mốc 1.000.000 Nắp Bia
            const hasRole = member.roles.cache.has(baHoRole.id);

            // 3. KIỂM TRA VÀ XỬ LÝ (CẤP/TƯỚC ROLE)
            if (currentDau >= THRESHOLD && !hasRole) {
                // Đủ 1 triệu Nắp Bia nhưng chưa có Role -> Cấp
                await member.roles.add(baHoRole);
                
                await message.reply(`🍻 **VIP ĐÂY RỒI!** Cả quán đứng dậy vỗ tay chúc mừng dân chơi đã tích lũy đủ **${THRESHOLD.toLocaleString('en-US')}** <:np:1557713580831547462>. Quản lý xin phép gắn ngay biển hiệu **${roleName}** cho bạn, dô dô dô!`);
                
            } else if (currentDau < THRESHOLD && hasRole) {
                // Tiêu xài tụt dưới 1 triệu Nắp Bia mà vẫn cầm Role -> Tước
                await member.roles.remove(baHoRole);
                await message.reply(`💸 **TOANG RỒI ĐẠI GIA ƠI!** Ăn nhậu xõa quá tay rớt quỹ xuống dưới 1 củ rồi. Quán xin phép lột tạm biển hiệu **${roleName}** nha, ráng bơm thêm mồi đi bạn hiền!`);
            }
            
        } catch (error) {
            console.error('Sự cố hệ thống cấp role quán nhậu:', error);
        }
    },
};