const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAuthorized } = require('../utils/permissions'); 

module.exports = {
    name: 'shop',
    description: 'Mở cửa hàng mua sắm (Link Private & Thú Cưng)',
    async execute(message, args, db, userData, supabase) {
        const guildId = message.guild.id;
        const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', guildId).order('id', { ascending: true });
        const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', guildId).order('id', { ascending: true });

        const embed = new EmbedBuilder()
            .setColor('#ff99af')
            .setTitle('🛒 Cửa Hàng Tổng Hợp')
            .setDescription('**🎭 Link Private (300.000 Dâu)**\nMỗi người chỉ mua được 1 lần.\n\n**🐾 Trại Thú Cưng (50.000 Dâu)**\nMua thú cưng về nuôi để chăm sóc và sinh lời mỗi ngày.');

        const components = [];

        // 1. Menu Nhân Vật (Link Private)
        const charOptions = (chars && chars.length > 0) ? chars.slice(0, 25).map(c => 
            new StringSelectMenuOptionBuilder().setLabel(c.name).setDescription('Mua link private (300k)').setValue(`buy_char_${c.id}`).setEmoji('🎭')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_char_menu').setPlaceholder('Mở danh sách Link Private...').setDisabled(!chars || chars.length === 0).addOptions(charOptions)
        ));

        // 2. Menu Thú Cưng (Pets)
        const petOptions = (pets && pets.length > 0) ? pets.slice(0, 25).map(p => 
            new StringSelectMenuOptionBuilder().setLabel(p.name).setDescription('Đón bé về nuôi (50k)').setValue(`buy_pet_${p.id}`).setEmoji('🐾')
        ) : [new StringSelectMenuOptionBuilder().setLabel('Trống').setValue('none')];
        
        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('shop_pet_menu').setPlaceholder('Mở trại thú cưng...').setDisabled(!pets || pets.length === 0).addOptions(petOptions)
        ));

        // 3. Thanh công cụ Admin (Được chia làm 2 hàng để không bị quá giới hạn 5 nút)
        const hasPerm = await isAuthorized(message.member, supabase);
        if (hasPerm) {
            // Hàng 1: Quản lý Link Private
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_shop_add').setLabel('Thêm Link').setStyle(ButtonStyle.Secondary).setEmoji('🔗'),
                new ButtonBuilder().setCustomId('btn_shop_edit').setLabel('Sửa Link').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('btn_shop_del').setLabel('Xóa Link').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
            ));
            // Hàng 2: Quản lý Thú Cưng (Pet)
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_pet_add').setLabel('Thêm Pet Mới').setStyle(ButtonStyle.Success).setEmoji('🐾'),
                new ButtonBuilder().setCustomId('btn_pet_edit').setLabel('Sửa Pet').setStyle(ButtonStyle.Success).setEmoji('🛠️'),
                new ButtonBuilder().setCustomId('btn_pet_del').setLabel('Xóa Pet').setStyle(ButtonStyle.Success).setEmoji('🧨')
            ));
        }

        await message.reply({ embeds: [embed], components: components });
    }
};