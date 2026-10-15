const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAuthorized } = require('../utils/permissions');

module.exports = {
    name: 'shop',
    description: 'Mở menu VIP của quán (Mua Link Private & Tuyển Bạn Nhậu)',
    async execute(message, args, db, userData, supabase) {
        const guildId = message.guild.id;
        const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', guildId).order('id', { ascending: true });
        const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', guildId).order('id', { ascending: true });

        const embed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng của bia
            .setTitle('🍻 Menu VIP Quán Nhậu Ba Miền')
            .setDescription(`**💌 Phần Thưởng Kín (300.000 <:np:1557713580831547462>)**\nMỗi Khách VIP chỉ mua được 1 lần để lấy link private của cô chủ Me An.\n\n**🍻 Sảnh Tìm Bạn Nhậu (50.000 <:np:1557713580831547462>)**\nThu nạp chiến hữu về bàn để cụng ly, tâm sự và phụ chạy bàn kiếm lúa mỗi ngày.`);

        const components = [];

        // 1. Menu Nhân Vật (Link Private của Me An)
        const charOptions = (chars && chars.length > 0) ? chars.slice(0, 25).map(c =>
            new StringSelectMenuOptionBuilder().setLabel(c.name).setDescription('Mua link private (300k Nắp Bia)').setValue(`buy_char_${c.id}`).setEmoji('🔗')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_char_menu').setPlaceholder('Mở danh sách Link Private...').setDisabled(!chars || chars.length === 0).addOptions(charOptions)
        ));

        // 2. Menu Thú Cưng (Bạn nhậu)
        const petOptions = (pets && pets.length > 0) ? pets.slice(0, 25).map(p =>
            new StringSelectMenuOptionBuilder().setLabel(p.name).setDescription('Rước chiến hữu về bàn (50k Nắp Bia)').setValue(`buy_pet_${p.id}`).setEmoji('🍗')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_pet_menu').setPlaceholder('Mở sảnh chọn bạn nhậu...').setDisabled(!pets || pets.length === 0).addOptions(petOptions)
        ));

        // 3. Thanh công cụ Admin (Chia làm 2 hàng cho gọn gàng)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (hasPerm) {
            // Hàng 1: Quản lý Link Private
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_shop_add').setLabel('Thêm Link VIP').setStyle(ButtonStyle.Secondary).setEmoji('🔗'),
                new ButtonBuilder().setCustomId('btn_shop_edit').setLabel('Sửa Link VIP').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('btn_shop_del').setLabel('Xóa Link VIP').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
            ));
            // Hàng 2: Quản lý Bạn Nhậu
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_pet_add').setLabel('Thêm Chiến Hữu').setStyle(ButtonStyle.Success).setEmoji('🍻'),
                new ButtonBuilder().setCustomId('btn_pet_edit').setLabel('Sửa Chiến Hữu').setStyle(ButtonStyle.Secondary).setEmoji('✨'),
                new ButtonBuilder().setCustomId('btn_pet_del').setLabel('Xóa Chiến Hữu').setStyle(ButtonStyle.Secondary).setEmoji('❌')
            ));
        }

        await message.reply({ embeds: [embed], components: components });
    }
};