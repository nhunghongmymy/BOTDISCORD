require('dotenv').config();
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { isAuthorized } = require('../utils/permissions');

const supabase = createClient(process.env.SUPABASE_URL_ANHVESI, process.env.SUPABASE_KEY_ANHVESI);

const FOOD_MENU = [
    { id: '1', name: 'Cà Phê Đen Đá', emoji: '☕' },
    { id: '2', name: 'Bánh Ngọt Macaron', emoji: '🧁' },
    { id: '3', name: 'Mì Ý Sốt Kem', emoji: '🍝' },
    { id: '4', name: 'Bánh Mì Kẹp Thịt', emoji: '🥪' },
    { id: '5', name: 'Gà Rán Sốt Cay', emoji: '🍗' },
    { id: '6', name: 'Pizza Hải Sản', emoji: '🍕' },
    { id: '7', name: 'Bít Tết Bò Thượng Hạng', emoji: '🥩' },
    { id: '8', name: 'Salad Trái Cây Tươi', emoji: '🥗' },
    { id: '9', name: 'Trà Sữa Trân Châu', emoji: '🧋' },
    { id: '10', name: 'Bánh Kem Socola', emoji: '🎂' }
];

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isButton()) {
            const hasPerm = await isAuthorized(interaction.member, supabase);
            const adminButtonIds = ['btn_shop_add', 'btn_shop_edit', 'btn_shop_del', 'btn_pet_add', 'btn_pet_edit', 'btn_pet_del'];
            if (adminButtonIds.includes(interaction.customId)) {
                if (!hasPerm) return interaction.reply({ content: '❌ Khách tham quan không được tự ý vào hậu trường của Boutique!', ephemeral: true });
            }

            if (interaction.customId === 'btn_pet_add') {
                const modal = new ModalBuilder().setCustomId('modal_pet_add').setTitle('Tuyển Mộ Nhân Vật Mới');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Nhân Vật').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_img').setLabel('Link Ảnh (URL)').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
                return;
            }

            if (interaction.customId === 'btn_pet_edit') {
                // Đã thêm .order('id', { ascending: true })
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Chưa có nhân vật nào để sửa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_edit')
                    .setPlaceholder('Chọn nhân vật cần SỬA...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('☕')));
                await interaction.reply({ content: 'Vui lòng chọn nhân vật bạn muốn tinh chỉnh thông tin:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            if (interaction.customId === 'btn_pet_del') {
                // Đã thêm .order('id', { ascending: true })
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Chưa có nhân vật nào để xóa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_del')
                    .setPlaceholder('Chọn nhân vật cần XÓA...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('☕')));
                await interaction.reply({ content: 'Vui lòng chọn nhân vật bạn muốn loại bỏ vĩnh viễn khỏi cửa hàng:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            if (interaction.customId === 'btn_shop_add') {
                const modal = new ModalBuilder().setCustomId('modal_shop_add').setTitle('Thêm Thiết Kế Độc Quyền');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên thiết kế').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Nội dung Thiết Kế').setStyle(TextInputStyle.Paragraph).setRequired(true)));
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'btn_shop_edit') {
                // Đã thêm .order('id', { ascending: true })
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có thiết kế nào để sửa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_edit').setPlaceholder('Chọn thiết kế cần SỬA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn thiết kế bạn muốn tinh chỉnh:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }

            if (interaction.customId === 'btn_shop_del') {
                // Đã thêm .order('id', { ascending: true })
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có thiết kế nào để xóa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_del').setPlaceholder('Chọn thiết kế cần XÓA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn thiết kế bạn muốn loại bỏ vĩnh viễn khỏi Boutique:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_pet_add') {
                const name = interaction.fields.getTextInputValue('pet_name');
                const img = interaction.fields.getTextInputValue('pet_img');
                const guildId = interaction.guild.id;
                const { data, error } = await supabase.from('pets').insert([{ name, image_url: img, guild_id: guildId }]).select('id').single();
                if (error) return interaction.reply({ content: `Lỗi: ${error.message}`, ephemeral: true });
                const options = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(f.name).setValue(f.id).setEmoji(f.emoji));
                const likeMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_likes_${data.id}`).setPlaceholder('Chọn đúng 3 món YÊU THÍCH...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.reply({ content: `✅ Đã tạo nhân vật **${name}**.\n👉 Bước 2: Hãy chọn **3 món ăn/thức uống YÊU THÍCH** của nhân vật này:`, components: [new ActionRowBuilder().addComponents(likeMenu)], ephemeral: true });
                return;
            }

            if (interaction.customId.startsWith('modal_pet_edit_')) {
                const petId = interaction.customId.replace('modal_pet_edit_', '');
                const name = interaction.fields.getTextInputValue('pet_name');
                const img = interaction.fields.getTextInputValue('pet_img');
                const { error } = await supabase.from('pets').update({ name, image_url: img }).eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật nhân vật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật thành công thông tin cho nhân vật **${name}**!`, ephemeral: true });
                return;
            }

            if (interaction.customId === 'modal_shop_add') {
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').insert([{ name, link, guild_id: interaction.guild.id }]);
                if (error) return interaction.reply({ content: `Lỗi: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã thêm thiết kế **${name}** thành công!`, ephemeral: true });
            }

            if (interaction.customId.startsWith('modal_shop_edit_')) {
                const charId = interaction.customId.replace('modal_shop_edit_', '');
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').update({ name, link }).eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật thành công thông tin cho thiết kế **${name}**!`, ephemeral: true });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('set_pet_likes_')) {
                const petId = interaction.customId.replace('set_pet_likes_', '');
                const likes = interaction.values.join(',');
                await supabase.from('pets').update({ likes }).eq('id', petId);
                const options = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(f.name).setValue(f.id).setEmoji(f.emoji));
                const hateMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_hates_${petId}`).setPlaceholder('Chọn đúng 3 món KHÔNG THÍCH...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.update({ content: `👉 Bước 3 (Cuối): Hãy chọn **3 món ăn/thức uống KHÔNG THÍCH** của nhân vật này:`, components: [new ActionRowBuilder().addComponents(hateMenu)] });
                return;
            }

            if (interaction.customId.startsWith('set_pet_hates_')) {
                const petId = interaction.customId.replace('set_pet_hates_', '');
                const hates = interaction.values.join(',');
                await supabase.from('pets').update({ hates }).eq('id', petId);
                await interaction.update({ content: `🎉 TUYỂN MỘ HOÀN TẤT! Gõ lại lệnh \`mshop\` để xem cửa hàng nhân vật.`, components: [] });
                return;
            }

            if (interaction.customId === 'menu_pet_del') {
                const petId = interaction.values[0];
                const { error } = await supabase.from('pets').delete().eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi xóa nhân vật: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑️ Đã loại bỏ nhân vật khỏi danh sách thành công!', components: [] });
                return;
            }

            if (interaction.customId === 'menu_pet_edit') {
                const petId = interaction.values[0];
                const { data: petData } = await supabase.from('pets').select('*').eq('id', petId).single();
                if (!petData) return interaction.reply({ content: 'Lỗi: Không tìm thấy nhân vật này trong CSDL!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_pet_edit_${petId}`).setTitle('Sửa Thông Tin Nhân Vật');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Nhân Vật').setStyle(TextInputStyle.Short).setValue(petData.name).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_img').setLabel('Link Ảnh (URL)').setStyle(TextInputStyle.Short).setValue(petData.image_url).setRequired(true))
                );
                await interaction.showModal(modal);
                try { await interaction.deleteReply(); } catch(e) {}
                return;
            }

            if (interaction.customId === 'shop_pet_menu') {
                await interaction.deferReply({ ephemeral: true });
                const petId = interaction.values[0].replace('buy_pet_', '');
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                if (!userData || Number(userData.dau) < 50000) return interaction.editReply('Tủ đồ của bạn không có đủ 50.000 <a:gemheartpalepink:1551126619546976267> để rước nhân vật này về!');

                const { data: ownPet } = await supabase.from('user_pets').select('*').eq('user_id', userId).eq('pet_id', petId).eq('guild_id', guildId).single();
                if (ownPet) return interaction.editReply('Nhà Sưu Tầm đã sở hữu nhân vật này rồi, không thể nhận thêm bản sao nữa đâu!');

                await supabase.from('economy').update({ dau: Number(userData.dau) - 50000 }).eq('user_id', userId);
                await supabase.from('user_pets').insert([{ user_id: userId, guild_id: guildId, pet_id: petId, hunger: 100, happiness: 100 }]);
                await interaction.editReply('🎀 Đón nhân vật thành công! Gõ lệnh `mbaoduong` để tương tác mỗi ngày nhé!');
                return;
            }

            if (interaction.customId === 'menu_shop_del') {
                const charId = interaction.values[0];
                const { error } = await supabase.from('characters').delete().eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi xóa: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑 Đã loại bỏ thiết kế khỏi Boutique thành công!', components: [] });
            }

            if (interaction.customId === 'menu_shop_edit') {
                const charId = interaction.values[0];
                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.reply({ content: 'Lỗi: Không tìm thấy thiết kế này trong CSDL!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_shop_edit_${charId}`).setTitle('Sửa Thiết Kế Độc Quyền');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên thiết kế').setStyle(TextInputStyle.Short).setValue(charData.name).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Nội dung Thiết Kế').setStyle(TextInputStyle.Paragraph).setValue(charData.link).setRequired(true)));
                await interaction.showModal(modal);
                try { await interaction.deleteReply(); } catch(e) {}
            }

            if (interaction.customId === 'shop_char_menu') {
                await interaction.deferReply({ ephemeral: true });
                const charId = interaction.values[0].replace('buy_char_', '');
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                const { data: ownData } = await supabase.from('inventory').select('*').eq('user_id', userId).eq('char_id', charId).eq('guild_id', guildId).single();
                if (ownData) return interaction.editReply('Nhà Sưu Tầm đã sở hữu thiết kế này rồi, không cần tốn Tinh Thể mua lại đâu!');

                let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                const balance = userData ? Number(userData.dau) : 0;
                if (balance < 300000) return interaction.editReply('Bạn không có đủ 300.000 <a:gemheartpalepink:1551126619546976267> để thanh toán!');

                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.editReply('Thiết kế không tồn tại hoặc đã bị Quản lý loại bỏ!');

                await supabase.from('economy').update({ dau: balance - 300000 }).eq('user_id', userId);
                
                try {
                    await interaction.user.send(`Giai điệu lấp lánh cất lên! Đây là thiết kế độc quyền của **${charData.name}** dành riêng cho Stylist:\n${charData.link}`);
                    await supabase.from('inventory').insert([{ user_id: userId, char_id: charId, guild_id: guildId }]);
                    await interaction.editReply('Giao dịch thành công! Đã thanh toán 300.000 <a:gemheartpalepink:1551126619546976267>. Vui lòng kiểm tra Hộp Nhạc (DM) để nhận thiết kế!');
                } catch (e) {
                    await supabase.from('economy').update({ dau: balance }).eq('user_id', userId);
                    await interaction.editReply('Hộp nhạc không thể gửi tin nhắn riêng. Vui lòng mở khóa DM server để nhận thiết kế. (Tinh Thể đã được hoàn lại)');
                }
            }
        }
    }
};