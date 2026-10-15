require('dotenv').config();
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { isAuthorized } = require('../utils/permissions');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ĐỒNG BỘ THỰC ĐƠN MỒI NHẬU & BIA RƯỢU TỪ FILE RUNHAU.JS
const FOOD_MENU = [
    { id: '1', name: 'Đậu Phộng Luộc', emoji: '🥜' },
    { id: '2', name: 'Mực Khô Nướng', emoji: '🦑' },
    { id: '3', name: 'Lẩu Thái Chua Cay', emoji: '🍲' },
    { id: '4', name: 'Nem Chua Thanh Hóa', emoji: '🥓' },
    { id: '5', name: 'Chân Gà Sả Tắc', emoji: '🍗' },
    { id: '6', name: 'Bò Lúc Lắc', emoji: '🥩' },
    { id: '7', name: 'Tôm Hùm Nướng', emoji: '🦞' },
    { id: '8', name: 'Gỏi Ngó Sen', emoji: '🥗' },
    { id: '9', name: 'Bia Hơi Hà Nội', emoji: '🍺' },
    { id: '10', name: 'Rượu Mơ Má Đào', emoji: '🍶' }
];

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isButton()) {
            const hasPerm = await isAuthorized(interaction.member, supabase);
            const adminButtonIds = ['btn_shop_add', 'btn_shop_edit', 'btn_shop_del', 'btn_pet_add', 'btn_pet_edit', 'btn_pet_del'];
            if (adminButtonIds.includes(interaction.customId)) {
                if (!hasPerm) return interaction.reply({ content: '❌ Ê ê, khách nhậu không được tự ý xông vào quầy thu ngân của quán nha!', ephemeral: true });
            }

            if (interaction.customId === 'btn_pet_add') {
                const modal = new ModalBuilder().setCustomId('modal_pet_add').setTitle('Tuyển Mộ Chiến Hữu Mới');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Chiến Hữu').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_img').setLabel('Link Ảnh (URL)').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
                return;
            }

            if (interaction.customId === 'btn_pet_edit') {
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Quán chưa có ai để sửa thông tin!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_edit')
                    .setPlaceholder('Chọn chiến hữu cần SỬA...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('🍺')));
                await interaction.reply({ content: 'Vui lòng chọn chiến hữu bạn muốn cập nhật thông tin:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            if (interaction.customId === 'btn_pet_del') {
                const { data: pets } = await supabase.from('pets').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!pets || pets.length === 0) return interaction.reply({ content: 'Chưa có chiến hữu nào để đuổi!', ephemeral: true });
                const menu = new StringSelectMenuBuilder()
                    .setCustomId('menu_pet_del')
                    .setPlaceholder('Chọn người cần ĐUỔI KHỎI QUÁN...')
                    .addOptions(pets.slice(0, 25).map(p => new StringSelectMenuOptionBuilder().setLabel(p.name).setValue(p.id.toString()).setEmoji('🍺')));
                await interaction.reply({ content: 'Vui lòng chọn chiến hữu bạn muốn cấm cửa vĩnh viễn khỏi quán:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
                return;
            }

            if (interaction.customId === 'btn_shop_add') {
                const modal = new ModalBuilder().setCustomId('modal_shop_add').setTitle('Tạo Link Private Mới');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên Link / Phân Loại').setStyle(TextInputStyle.Short).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Nội dung Link Private').setStyle(TextInputStyle.Paragraph).setRequired(true)));
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'btn_shop_edit') {
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có Link Private nào để sửa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_edit').setPlaceholder('Chọn Link cần SỬA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn Link Private bạn muốn cập nhật nội dung:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            }

            if (interaction.customId === 'btn_shop_del') {
                const { data: chars } = await supabase.from('characters').select('*').eq('guild_id', interaction.guild.id).order('id', { ascending: true });
                if (!chars || chars.length === 0) return interaction.reply({ content: 'Chưa có Link Private nào để xóa!', ephemeral: true });
                const menu = new StringSelectMenuBuilder().setCustomId('menu_shop_del').setPlaceholder('Chọn Link cần XÓA...').addOptions(chars.slice(0, 25).map(c => new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id.toString())));
                await interaction.reply({ content: 'Vui lòng chọn Link Private bạn muốn gỡ bỏ khỏi Menu VIP:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
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
                const likeMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_likes_${data.id}`).setPlaceholder('Chọn đúng 3 món KHOÁI KHẨU...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.reply({ content: `✅ Đã kéo chiến hữu **${name}** vào bàn.\n👉 Bước 2: Hãy chọn **3 món MỒI/BIA KHOÁI KHẨU** của người này:`, components: [new ActionRowBuilder().addComponents(likeMenu)], ephemeral: true });
                return;
            }

            if (interaction.customId.startsWith('modal_pet_edit_')) {
                const petId = interaction.customId.replace('modal_pet_edit_', '');
                const name = interaction.fields.getTextInputValue('pet_name');
                const img = interaction.fields.getTextInputValue('pet_img');
                const { error } = await supabase.from('pets').update({ name, image_url: img }).eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật xong thông tin cho chiến hữu **${name}**!`, ephemeral: true });
                return;
            }

            if (interaction.customId === 'modal_shop_add') {
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').insert([{ name, link, guild_id: interaction.guild.id }]);
                if (error) return interaction.reply({ content: `Lỗi: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cất giấu Link Private **${name}** thành công!`, ephemeral: true });
            }

            if (interaction.customId.startsWith('modal_shop_edit_')) {
                const charId = interaction.customId.replace('modal_shop_edit_', '');
                const name = interaction.fields.getTextInputValue('char_name');
                const link = interaction.fields.getTextInputValue('char_link');
                const { error } = await supabase.from('characters').update({ name, link }).eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi cập nhật: ${error.message}`, ephemeral: true });
                await interaction.reply({ content: `✅ Đã cập nhật xong Link Private **${name}**!`, ephemeral: true });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('set_pet_likes_')) {
                const petId = interaction.customId.replace('set_pet_likes_', '');
                const likes = interaction.values.join(',');
                await supabase.from('pets').update({ likes }).eq('id', petId);
                const options = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(f.name).setValue(f.id).setEmoji(f.emoji));
                const hateMenu = new StringSelectMenuBuilder().setCustomId(`set_pet_hates_${petId}`).setPlaceholder('Chọn đúng 3 món CHÊ CỰC MẠNH...').setMinValues(3).setMaxValues(3).addOptions(options);
                await interaction.update({ content: `👉 Bước 3 (Cuối): Hãy chọn **3 món MỒI CHÊ TỚI BẾN** của người này:`, components: [new ActionRowBuilder().addComponents(hateMenu)] });
                return;
            }

            if (interaction.customId.startsWith('set_pet_hates_')) {
                const petId = interaction.customId.replace('set_pet_hates_', '');
                const hates = interaction.values.join(',');
                await supabase.from('pets').update({ hates }).eq('id', petId);
                await interaction.update({ content: `🎉 TUYỂN BẠN NHẬU XONG XUÔI! Gõ lại lệnh \`mshop\` để xem mặt mũi chiến hữu nhé.`, components: [] });
                return;
            }

            if (interaction.customId === 'menu_pet_del') {
                const petId = interaction.values[0];
                const { error } = await supabase.from('pets').delete().eq('id', petId);
                if (error) return interaction.reply({ content: `Lỗi đuổi khách: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑️ Đã tống cổ tên bợm nhậu này ra khỏi quán thành công!', components: [] });
                return;
            }

            if (interaction.customId === 'menu_pet_edit') {
                const petId = interaction.values[0];
                const { data: petData } = await supabase.from('pets').select('*').eq('id', petId).single();
                if (!petData) return interaction.reply({ content: 'Lỗi: Không tìm thấy chiến hữu này trong quán!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_pet_edit_${petId}`).setTitle('Sửa Thông Tin Chiến Hữu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pet_name').setLabel('Tên Chiến Hữu').setStyle(TextInputStyle.Short).setValue(petData.name).setRequired(true)),
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
                if (!userData || Number(userData.dau) < 50000) return interaction.editReply('Quỹ nhậu của bạn không đủ 50.000 <:np:1557713580831547462> để bao người này ra bàn chung!');

                const { data: ownPet } = await supabase.from('user_pets').select('*').eq('user_id', userId).eq('pet_id', petId).eq('guild_id', guildId).single();
                if (ownPet) return interaction.editReply('Khách VIP đang nhậu với người này ở bàn rồi, tính phân thân hay gì!');

                await supabase.from('economy').update({ dau: Number(userData.dau) - 50000 }).eq('user_id', userId);
                await supabase.from('user_pets').insert([{ user_id: userId, guild_id: guildId, pet_id: petId, hunger: 100, happiness: 100 }]);
                await interaction.editReply('🍻 Rước chiến hữu về bàn thành công! Gõ lệnh `mrunhau` để gọi mồi và cụng ly mỗi ngày nhé!');
                return;
            }

            if (interaction.customId === 'menu_shop_del') {
                const charId = interaction.values[0];
                const { error } = await supabase.from('characters').delete().eq('id', charId);
                if (error) return interaction.reply({ content: `Lỗi xóa: ${error.message}`, ephemeral: true });
                await interaction.update({ content: '🗑 Đã hủy Link Private này khỏi Menu thành công!', components: [] });
            }

            if (interaction.customId === 'menu_shop_edit') {
                const charId = interaction.values[0];
                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.reply({ content: 'Lỗi: Không tìm thấy Link này trong CSDL!', ephemeral: true });
                const modal = new ModalBuilder().setCustomId(`modal_shop_edit_${charId}`).setTitle('Cập Nhật Link Private');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel('Tên Link / Phân Loại').setStyle(TextInputStyle.Short).setValue(charData.name).setRequired(true)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_link').setLabel('Nội dung Link').setStyle(TextInputStyle.Paragraph).setValue(charData.link).setRequired(true)));
                await interaction.showModal(modal);
                try { await interaction.deleteReply(); } catch(e) {}
            }

            if (interaction.customId === 'shop_char_menu') {
                await interaction.deferReply({ ephemeral: true });
                const charId = interaction.values[0].replace('buy_char_', '');
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                const { data: ownData } = await supabase.from('inventory').select('*').eq('user_id', userId).eq('char_id', charId).eq('guild_id', guildId).single();
                if (ownData) return interaction.editReply('Khách VIP đã mua Link Private này rồi, tiền nhiều quá tính ném qua cửa sổ à!');

                let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                const balance = userData ? Number(userData.dau) : 0;
                if (balance < 300000) return interaction.editReply('Ví bạn cháy khét lẹt rồi, không có đủ 300.000 <:np:1557713580831547462> để mua Link xịn đâu!');

                const { data: charData } = await supabase.from('characters').select('*').eq('id', charId).single();
                if (!charData) return interaction.editReply('Link này bị cô chủ giấu đi rồi hoặc không tồn tại!');

                await supabase.from('economy').update({ dau: balance - 300000 }).eq('user_id', userId);
                
                try {
                    await interaction.user.send(`🤫 **Suỵt!** Cô chủ Me An lén gửi riêng cho khách VIP phần thưởng kín của **${charData.name}** đây:\n${charData.link}`);
                    await supabase.from('inventory').insert([{ user_id: userId, char_id: charId, guild_id: guildId }]);
                    await interaction.editReply('🎉 Giao dịch thành công! Đã cắn 300.000 <:np:1557713580831547462>. Mau check tin nhắn riêng (DM) để nhận hàng nóng!');
                } catch (e) {
                    await supabase.from('economy').update({ dau: balance }).eq('user_id', userId);
                    await interaction.editReply('Ế! Quán không gửi tin nhắn riêng cho bạn được. Nhớ mở khóa DM server để nhận Link nhé. (Nắp Bia đã được hoàn lại túi)');
                }
            }
        }
    }
};