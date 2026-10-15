const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAuthorized } = require('../utils/permissions');

module.exports = {
    name: 'shop',
    description: 'Mở cửa hàng thời trang lấp lánh (Bộ Sưu Tập Giới Hạn & Búp Bê Thời Trang)',
    async execute(message, args, db, userData, supabase) {
        const guildId = message.guild.id;
        const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', guildId).order('id', { ascending: true });
        const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', guildId).order('id', { ascending: true });

        const embed = new EmbedBuilder()
            .setColor('#FF69B4') // Chic Pink for shops
            .setTitle('🛍️ Boutique Hộp Nhạc Trang Sức')
            .setDescription(`**🎭 Bộ Sưu Tập Giới Hạn (300.000 <a:gemheartpalepink:1551126619546976267>)**\nMỗi Nhà Sưu Tầm chỉ mua được 1 lần.\n\n**🩰 Cửa Hàng Búp Bê (50.000 <a:gemheartpalepink:1551126619546976267>)**\nTuyển mộ búp bê vào tủ đồ để bảo dưỡng và tỏa sáng trên thảm đỏ mỗi ngày.`);

        const components = [];

        // 1. Menu Nhân Vật (Link Private -> Bộ Sưu Tập Giới Hạn)
        const charOptions = (chars && chars.length > 0) ? chars.slice(0, 25).map(c =>
            new StringSelectMenuOptionBuilder().setLabel(c.name).setDescription('Mua thiết kế độc quyền (300k)').setValue(`buy_char_${c.id}`).setEmoji('🪞')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_char_menu').setPlaceholder('Mở danh sách Thiết Kế Giới Hạn...').setDisabled(!chars || chars.length === 0).addOptions(charOptions)
        ));

        // 2. Menu Thú Cưng (Pets -> Búp Bê Thời Trang)
        const petOptions = (pets && pets.length > 0) ? pets.slice(0, 25).map(p =>
            new StringSelectMenuOptionBuilder().setLabel(p.name).setDescription('Rước búp bê về tủ đồ (50k)').setValue(`buy_pet_${p.id}`).setEmoji('🎀')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_pet_menu').setPlaceholder('Mở Cửa Hàng Búp Bê...').setDisabled(!pets || pets.length === 0).addOptions(petOptions)
        ));

        // 3. Thanh công cụ Admin (Chia làm 2 hàng cho gọn gàng)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (hasPerm) {
            // Hàng 1: Quản lý Thiết kế độc quyền
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_shop_add').setLabel('Thêm Thiết Kế').setStyle(ButtonStyle.Secondary).setEmoji('🔗'),
                new ButtonBuilder().setCustomId('btn_shop_edit').setLabel('Sửa Thiết Kế').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('btn_shop_del').setLabel('Xóa Thiết Kế').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
            ));
            // Hàng 2: Quản lý Búp Bê
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_pet_add').setLabel('Thêm Búp Bê').setStyle(ButtonStyle.Success).setEmoji('🩰'),
                new ButtonBuilder().setCustomId('btn_pet_edit').setLabel('Sửa Búp Bê').setStyle(ButtonStyle.Secondary).setEmoji('✨'),
                new ButtonBuilder().setCustomId('btn_pet_del').setLabel('Xóa Búp Bê').setStyle(ButtonStyle.Secondary).setEmoji('❌')
            ));
        }

        await message.reply({ embeds: [embed], components: components });
    }
};