require('dotenv').config();
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { isAuthorized } = require('../utils/permissions');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const FOOD_MENU = [
    { id: '1', name: 'Trà Sữa', emoji: '🧋' }, { id: '2', name: 'Gà Rán', emoji: '🍗' },
    { id: '3', name: 'Sushi', emoji: '🍣' }, { id: '4', name: 'Salad Trộn', emoji: '🥗' },
    { id: '5', name: 'Mì Cay', emoji: '🌶️' }, { id: '6', name: 'Pizza', emoji: '🍕' },
    { id: '7', name: 'Hamburger', emoji: '🍔' }, { id: '8', name: 'Kem', emoji: '🍦' },
    { id: '9', name: 'Bít tết', emoji: '🥩' }, { id: '10', name: 'Lẩu', emoji: '🍲' }
];

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // ==============================
        // XỬ LÝ: NÚT BẤM
        // ==============================
        if (interaction.isButton()) {
            const hasPerm = await isAuthorized(interaction.member, supabase);
            const adminButtons = ['btn_shop_add', 'btn_shop_edit', 'btn_shop_del', 'btn_pet_add', 'btn_pet_edit', 'btn_pet_del'];
            
            if (adminButtons.includes(interaction.customId)) {
                if (!hasPerm) return interaction.reply({ content: '❌ Khách hàng không được lảng vảng vào kho của Shop!', ephemeral: true });
            }

            // MENU: Thêm Pet
            if (interaction.customId === 'btn_pet_add') {
                const modal = new ModalBuilder().setCustomId('modal_pet_add').setTitle('Đăng Ký Pet Mới');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Pet (Char)').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_img').setLabel('Link Ảnh (URL)').setStyle(TextInputStyle.Short).setRequired(true)));
                await interaction.showModal(modal);
                return;
            }

            // MENU: Sửa Pet
            if (interaction.customId === 'btn_pet_edit') {
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Chưa có Pet nào để sửa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_edit')
                    .setPlaceholder('Chọn Pet cần SỬA...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('🐾')));
                await interaction.reply({ content: 'Vui lòng chọn Pet bạn muốn sửa thông tin:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            // MENU: Xóa Pet
            if (interaction.customId === 'btn_pet_del') {
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Chưa có Pet nào để xóa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_del')
                    .setPlaceholder('Chọn Pet cần XÓA...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('🐾')));
                await interaction.reply({ content: 'Vui lòng chọn Pet bạn muốn xóa vĩnh viễn khỏi Shop:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            // MENU: Thêm Link
            if (interaction.customId === 'btn_shop_add') {
                const modal = new ModalBuilder().setCustomId('modal_shop_add').setTitle('Thêm Link Private');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên nhân vật').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Link Private').setStyle(TextInputStyle.Paragraph).setRequired(true)));
                await interaction.showModal(modal);
            }

            // MENU: Sửa Link
            if (interaction.customId === 'btn_shop_edit') {
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có nhân vật nào để sửa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_edit').setPlaceholder('Chọn nhân vật cần SỬA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn nhân vật bạn muốn sửa thông tin:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }

            // MENU: Xóa Link
            if (interaction.customId === 'btn_shop_del') {
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có nhân vật nào để xóa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_del').setPlaceholder('Chọn nhân vật cần XÓA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn nhân vật bạn muốn xóa vĩnh viễn khỏi Shop:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }
        }

        // ==============================
        // XỬ LÝ: LƯU FORM ĐIỀN (MODAL)
        // ==============================
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_pet_add') {
                const name = interaction.fields.getTextInputValue('pet_name');
                const img = interaction.fields.getTextInputValue('pet_img');
                const guildId = interaction.guild.id;
                const { data, error } = await supabase.from('pets').insert([{ name, image_url: img, guild_id: guildId }]).select('id').single();
                if (error) return interaction.reply({ content: `Lỗi: ${error.message}`, ephemeral: true });
                const options = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(f.name).setValue(f.id).setEmoji(f.emoji));
                const likeMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_likes_${data.id}`).setPlaceholder('Chọn đúng 3 món YÊU THÍCH...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.reply({ content: `✅ Đã tạo Char **${name}**.\n👉 Bước 2: Hãy chọn **3 món YÊU THÍCH** của bé này:`, components: [new ActionRowBuilder().addComponents(likeMenu)], ephemeral: true });
                return;
            }

            // Bắt form Sửa Pet
            if (interaction.customId.startsWith('modal_pet_edit_')) {
                const petId = interaction.customId.replace('modal_pet_edit_', '');
                const name = interaction.fields.getTextInputValue('pet_name');
                const img = interaction.fields.getTextInputValue('pet_img');
                const { error } = await supabase.from('pets').update({ name, image_url: img }).eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật thành công thông tin cho Pet **${name}**!`, ephemeral: true });
                return;
            }

            if (interaction.customId === 'modal_shop_add') {
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').insert([{ name, link, guild_id: interaction.guild.id }]);
                if (error) return interaction.reply({ content: `Lỗi: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã thêm nhân vật **${name}** thành công!`, ephemeral: true });
            }

            if (interaction.customId.startsWith('modal_shop_edit_')) {
                const charId = interaction.customId.replace('modal_shop_edit_', '');
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').update({ name, link }).eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật thành công thông tin cho **${name}**!`, ephemeral: true });
            }
        }

        // ==============================
        // XỬ LÝ: DROPDOWN CHỌN (SELECT MENU)
        // ==============================
        if (interaction.isStringSelectMenu()) {
            
            // Xóa Pet
            if (interaction.customId === 'menu_pet_del') {
                const petId = interaction.values[0];
                const { error } = await supabase.from('pets').delete().eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi xóa: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑️ Đã xóa Pet khỏi cửa hàng thành công!', components: [] });
                return;
            }

            // Sửa Pet -> Bắn ra Modal
            if (interaction.customId === 'menu_pet_edit') {
                const petId = interaction.values[0];
                const { data: petData } = await supabase.from('pets').select('*').eq('id', petId).single();
                if (!petData) return interaction.reply({ content: 'Lỗi: Không tìm thấy Pet này trong CSDL!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_pet_edit_${petId}`).setTitle('Sửa Thông Tin Pet');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Pet').setStyle(TextInputStyle.Short).setValue(petData.name).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_img').setLabel('Link Ảnh (URL)').setStyle(TextInputStyle.Short).setValue(petData.image_url).setRequired(true))
                );
                await interaction.showModal(modal);
                try { await interaction.deleteReply(); } catch(e) {}
                return;
            }

            if (interaction.customId.startsWith('set_pet_likes_')) {
                const petId = interaction.customId.replace('set_pet_likes_', '');
                const likes = interaction.values.join(','); 
                await supabase.from('pets').update({ likes }).eq('id', petId);
                const options = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(f.name).setValue(f.id).setEmoji(f.emoji));
                const hateMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_hates_${petId}`).setPlaceholder('Chọn đúng 3 món CỰC GHÉT...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.update({ content: `👉 Bước 3 (Cuối): Hãy chọn **3 món CỰC GHÉT** của bé này:`, components: [new ActionRowBuilder().addComponents(hateMenu)] });
                return;
            }

            if (interaction.customId.startsWith('set_pet_hates_')) {
                const petId = interaction.customId.replace('set_pet_hates_', '');
                const hates = interaction.values.join(','); 
                await supabase.from('pets').update({ hates }).eq('id', petId);
                await interaction.update({ content: `🎉 TẠO PET HOÀN TẤT! Gõ lại lệnh \`mshop\` để xem trại thú cưng.`, components: [] });
                return;
            }

            // [PET] User Mua Pet
            if (interaction.customId === 'shop_pet_menu') {
                await interaction.deferReply({ ephemeral: true });
                const petId = interaction.values[0].replace('buy_pet_', '');
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                if (!userData || Number(userData.dau) < 50000) return interaction.editReply('Bạn không có đủ 50.000 <a:Strawberry:1536056987668713558> để rước bé này về!');

                const { data: ownPet } = await supabase.from('user_pets').select('*').eq('user_id', userId).eq('pet_id', petId).eq('guild_id', guildId).single();
                if (ownPet) return interaction.editReply('Bạn đã rước bé này về nhà rồi, không thể nhận nuôi thêm bản sao nữa đâu!');

                await supabase.from('economy').update({ dau: Number(userData.dau) - 50000 }).eq('user_id', userId);
                await supabase.from('user_pets').insert([{ user_id: userId, guild_id: guildId, pet_id: petId, hunger: 100, happiness: 100 }]);
                await interaction.editReply('🐾 Đón Char thành công! Gõ lệnh `mcare` để tương tác và chăm sóc bé mỗi ngày nhé!');
                return;
            }

            // [ADMIN] Xóa Link Private
            if (interaction.customId === 'menu_shop_del') {
                const charId = interaction.values[0];
                const { error } = await supabase.from('characters').delete().eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi xóa: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑️ Đã xóa nhân vật khỏi cửa hàng thành công!', components: [] });
            }

            // [ADMIN] Sửa Link Private
            if (interaction.customId === 'menu_shop_edit') {
                const charId = interaction.values[0];
                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.reply({ content: 'Lỗi: Không tìm thấy nhân vật này trong CSDL!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_shop_edit_${charId}`).setTitle('Sửa Link Private');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên nhân vật').setStyle(TextInputStyle.Short).setValue(charData.name).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Link Private').setStyle(TextInputStyle.Paragraph).setValue(charData.link).setRequired(true)));
                await interaction.showModal(modal);
                try { await interaction.deleteReply(); } catch(e) {}
            }

            // [USER] Mua Link Private
            if (interaction.customId === 'shop_char_menu') {
                await interaction.deferReply({ ephemeral: true });
                const charId = interaction.values[0].replace('buy_char_', '');
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                const { data: ownData } = await supabase.from('inventory').select('*').eq('user_id', userId).eq('char_id', charId).eq('guild_id', guildId).single();
                if (ownData) return interaction.editReply('Bạn đã sở hữu link này rồi, không cần tốn tiền mua lại đâu!');

                let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                const balance = userData ? Number(userData.dau) : 0;
                if (balance < 300000) return interaction.editReply('Bạn không có đủ 300.000 <a:Strawberry:1536056987668713558> để mua!');

                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.editReply('Nhân vật không tồn tại hoặc đã bị quản lý xóa!');

                await supabase.from('economy').update({ dau: balance - 300000 }).eq('user_id', userId);
                
                try {
                    await interaction.user.send(`Cảm ơn đại gia đã ủng hộ! Đây là link private của **${charData.name}**:\n${charData.link}`);
                    await supabase.from('inventory').insert([{ user_id: userId, char_id: charId, guild_id: guildId }]);
                    await interaction.editReply('Giao dịch thành công! Đã trừ 300.000 <a:Strawberry:1536056987668713558>. Vui lòng kiểm tra tin nhắn chờ (DM) để lấy link!');
                } catch (e) {
                    await supabase.from('economy').update({ dau: balance }).eq('user_id', userId); 
                    await interaction.editReply('Bot không thể gửi tin nhắn riêng. Vui lòng mở khóa DM server để nhận link. (Tiền đã được hoàn lại)');
                }
            }
        }
    }
};