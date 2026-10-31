const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const FOOD_MENU = [
    { id: '1', name: 'Trà Sữa', emoji: '🧋', price: 3000 }, { id: '2', name: 'Gà Rán', emoji: '🍗', price: 5000 },
    { id: '3', name: 'Sushi', emoji: '🍣', price: 10000 }, { id: '4', name: 'Salad Trộn', emoji: '🥗', price: 2000 },
    { id: '5', name: 'Mì Cay', emoji: '🌶️', price: 4000 }, { id: '6', name: 'Pizza', emoji: '🍕', price: 6000 },
    { id: '7', name: 'Hamburger', emoji: '🍔', price: 5000 }, { id: '8', name: 'Kem', emoji: '🍦', price: 2000 },
    { id: '9', name: 'Bít tết', emoji: '🥩', price: 12000 }, { id: '10', name: 'Lẩu', emoji: '🍲', price: 15000 }
];

const QUEST_LIST = [
    { cmd: 'manxin', desc: 'chủ nhân đi ăn xin (`manxin`) kiếm tiền về mua đồ ăn' },
    { cmd: 'mdaily', desc: 'chủ nhân đi điểm danh (`mdaily`) để lấy tiền tiêu vặt' },
    { cmd: 'mcuoc', desc: 'chủ nhân thử vận may bằng cách chơi xóc đĩa (`mcuoc`)' },
    { cmd: 'mdomin', desc: 'chủ nhân đi đào mìn (`mdomin`) để thử cảm giác mạnh' }
];

// Hàm kiểm tra 2 mốc thời gian có cùng thuộc một ngày (theo giờ Việt Nam UTC+7) không
const checkIsSameDayVN = (time1, time2) => {
    const d1 = new Date(Number(time1) + 7 * 3600 * 1000);
    const d2 = new Date(Number(time2) + 7 * 3600 * 1000);
    return d1.getUTCFullYear() === d2.getUTCFullYear() && 
           d1.getUTCMonth() === d2.getUTCMonth() && 
           d1.getUTCDate() === d2.getUTCDate();
};

module.exports = {
    name: 'care',
    description: 'Chăm sóc, cho ăn và tương tác với thú cưng',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        const { data: myPetsChecked } = await supabase
            .from('user_pets')
            .select('*, pets(name, image_url, likes, hates)')
            .eq('user_id', userId)
            .eq('guild_id', guildId);

        if (!myPetsChecked || myPetsChecked.length === 0) {
            return message.reply('Bạn chưa nhận nuôi bé Char nào cả! Hãy dùng lệnh `mshop` để ghé trại thú cưng nhé.');
        }

        const petOptions = myPetsChecked.map(p => new StringSelectMenuOptionBuilder().setLabel(p.pets.name).setValue(p.id.toString()).setEmoji('🐾'));
        const petMenu = new StringSelectMenuBuilder().setCustomId('select_pet_to_care').setPlaceholder('Chọn bé Char bạn muốn chăm sóc...').addOptions(petOptions);

        const msg = await message.reply({ content: 'Vui lòng chọn Char bạn muốn tương tác:', components: [new ActionRowBuilder().addComponents(petMenu)] });
        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Đừng phá chuồng thú của người khác!', ephemeral: true });

            let currentPetId;
            const now = Date.now();
            
            if (i.isStringSelectMenu() && i.customId === 'select_pet_to_care') {
                currentPetId = parseInt(i.values[0]);
                await renderPetDashboard(i, currentPetId);
            }

            // Nút Quay Lại từ Menu Siêu Thị
            if (i.isButton() && i.customId.startsWith('btnBack_')) {
                currentPetId = parseInt(i.customId.split('_')[1]);
                await renderPetDashboard(i, currentPetId);
            }

            if (i.isButton() && (i.customId.startsWith('btnHarvest_') || i.customId.startsWith('btnQuest_') || i.customId.startsWith('btnFeed_'))) {
                const action = i.customId.split('_')[0]; 
                currentPetId = parseInt(i.customId.split('_')[1]);
                
                let { data: petData } = await supabase.from('user_pets').select('*, pets(*)').eq('id', currentPetId).single();
                let { data: economyData } = await supabase.from('economy').select('*').eq('user_id', userId).single();

                if (action === 'btnHarvest') {
                    if (now - Number(petData.last_harvest) < TWELVE_HOURS && Number(petData.last_harvest) !== 0) {
                        return i.reply({ content: '⏳ Char chưa làm ra tiền! Hãy quay lại sau 12 tiếng.', ephemeral: true });
                    }
                    if (petData.hunger < 50 || petData.happiness < 50) {
                        return i.reply({ content: '😠 Char đang đói và buồn nên đình công không thèm làm việc! Hãy cho ăn đi.', ephemeral: true });
                    }

                    economyData.dau = Number(economyData.dau) + 20000;
                    await supabase.from('economy').upsert(economyData);
                    
                    petData.last_harvest = now;
                    petData.hunger = Math.max(0, petData.hunger - 20);
                    petData.happiness = Math.max(0, petData.happiness - 10);
                    
                    await supabase.from('user_pets').update({
                        last_harvest: petData.last_harvest,
                        hunger: petData.hunger,
                        happiness: petData.happiness
                    }).eq('id', currentPetId);

                    await i.reply({ content: `💰 Bạn đã thu hoạch được **20.000 Dâu** từ ${petData.pets.name}! (Độ no và vui vẻ bị giảm đôi chút)`, ephemeral: true });
                    await renderPetDashboard(i, currentPetId, true);
                }

                if (action === 'btnQuest') {
                    if (!petData.daily_quest || now - Number(petData.last_quest_reset) > 24 * 60 * 60 * 1000) {
                        const randomQuest = QUEST_LIST[Math.floor(Math.random() * QUEST_LIST.length)];
                        petData.daily_quest = randomQuest.cmd;
                        
                        await supabase.from('user_pets').update({
                            daily_quest: randomQuest.cmd,
                            quest_status: false,
                            last_quest_reset: now
                        }).eq('id', currentPetId);
                        
                        return i.reply({ content: `📜 **Nhiệm vụ mới:**\n${petData.pets.name} muốn ${randomQuest.desc}!\n*(Hãy ra ngoài chat gõ lệnh \`${randomQuest.cmd}\` để hoàn thành nhé)*`, ephemeral: true });
                    }

                    if (!petData.quest_status) {
                        const q = QUEST_LIST.find(q => q.cmd === petData.daily_quest);
                        return i.reply({ content: `📜 **Nhiệm vụ chưa xong:**\n${petData.pets.name} đang đợi ${q ? q.desc : 'bạn làm nhiệm vụ'}!\n*(Bạn hãy gõ lệnh \`${petData.daily_quest}\` ở bên ngoài kênh chat để nhận thưởng nhé)*`, ephemeral: true });
                    } else {
                        await i.reply({ content: '✅ Nhiệm vụ hôm nay đã làm xong rồi! Hãy quay lại vào ngày mai.', ephemeral: true });
                    }
                }

                if (action === 'btnFeed') {
                    // Kiểm tra giới hạn 3 bữa/ngày ngay trước khi mở menu Siêu Thị
                    const isSameDay = checkIsSameDayVN(now, petData.last_fed || 0);
                    const currentFeedCount = isSameDay ? (petData.feed_count || 0) : 0;

                    if (currentFeedCount >= 3) {
                        return i.reply({ content: '❌ Char đã no căng bụng (**3/3 bữa** hôm nay) rồi! Hãy quay lại cho ăn vào ngày mai nhé.', ephemeral: true });
                    }

                    const foodOptions = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(`${f.name} (${f.price} Dâu)`).setValue(`feed_${currentPetId}_${f.id}`).setEmoji(f.emoji));
                    const feedMenu = new StringSelectMenuBuilder().setCustomId('menu_feed_pet').setPlaceholder('Chọn món ăn từ Siêu Thị...').addOptions(foodOptions);
                    
                    const row = new ActionRowBuilder().addComponents(feedMenu);
                    const backRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`btnBack_${currentPetId}`).setLabel('Quay lại bảng điều khiển').setStyle(ButtonStyle.Secondary)
                    );
                    
                    await i.update({ content: '🛒 **Siêu Thị Thực Phẩm**\nTiền sẽ bị trừ trực tiếp khi bạn chọn món:', embeds: [], components: [row, backRow] });
                }
            }

            if (i.isStringSelectMenu() && i.customId === 'menu_feed_pet') {
                const [_, petIdStr, foodId] = i.values[0].split('_');
                currentPetId = parseInt(petIdStr);
                const food = FOOD_MENU.find(f => f.id === foodId);

                let { data: petData } = await supabase.from('user_pets').select('*, pets(*)').eq('id', currentPetId).single();
                let { data: economyData } = await supabase.from('economy').select('*').eq('user_id', userId).single();

                // Kiểm tra lại lần nữa chặn lỗi nhấp menu liên tục
                const isSameDay = checkIsSameDayVN(now, petData.last_fed || 0);
                const currentFeedCount = isSameDay ? (petData.feed_count || 0) : 0;

                if (currentFeedCount >= 3) {
                    return i.reply({ content: '❌ Char đã no căng bụng (**3/3 bữa** hôm nay) rồi! Hãy quay lại cho ăn vào ngày mai nhé.', ephemeral: true });
                }

                if (Number(economyData.dau) < food.price) {
                    return i.reply({ content: '❌ Bạn không có đủ tiền mua món này!', ephemeral: true });
                }

                const likes = petData.pets.likes ? petData.pets.likes.split(',') : [];
                const hates = petData.pets.hates ? petData.pets.hates.split(',') : [];

                let msgReply = '';
                let dauChange = -food.price; 
                
                if (likes.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 30);
                    petData.happiness = Math.min(100, petData.happiness + 20);
                    dauChange += 5000; 
                    msgReply = `🥰 **Tuyệt vời!** ${petData.pets.name} RẤT THÍCH món ${food.emoji} ${food.name}. \n*Bạn được thưởng nóng 5.000 Dâu!*`;
                } else if (hates.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 10);
                    petData.happiness = Math.max(0, petData.happiness - 30);
                    dauChange -= 5000; 
                    msgReply = `🤮 **Eo ôi!** ${petData.pets.name} CỰC KỲ GHÉT món ${food.emoji} ${food.name} và đã ném nó đi. \n*Độ vui vẻ tụt thảm hại, bạn bị phạt 5.000 Dâu!*`;
                } else {
                    petData.hunger = Math.min(100, petData.hunger + 20);
                    petData.happiness = Math.min(100, petData.happiness + 5);
                    msgReply = `😋 ${petData.pets.name} đã ăn hết món ${food.emoji} ${food.name}. Phản ứng bình thường.`;
                }

                economyData.dau = Math.max(0, Number(economyData.dau) + dauChange);
                await supabase.from('economy').upsert(economyData);

                // Cập nhật Database, tăng số lần đã ăn hôm nay
                await supabase.from('user_pets').update({
                    hunger: petData.hunger,
                    happiness: petData.happiness,
                    last_fed: now,
                    feed_count: currentFeedCount + 1
                }).eq('id', currentPetId);

                await renderPetDashboard(i, currentPetId);
                await i.followUp({ content: msgReply, ephemeral: true });
            }
        });

        async function renderPetDashboard(interaction, petId, isUpdate = false) {
            const payload = await getDashboardPayload(petId);
            if (isUpdate) {
                try { await msg.edit(payload); } catch(e){}
            } else {
                await interaction.update(payload);
            }
        }

        async function getDashboardPayload(petId) {
            const currentTime = Date.now();
            const { data: p } = await supabase.from('user_pets').select('*, pets(*)').eq('id', petId).single();
            const hBar = '🟩'.repeat(Math.floor(p.hunger/10)) + '⬛'.repeat(10 - Math.floor(p.hunger/10));
            const hapBar = '🟪'.repeat(Math.floor(p.happiness/10)) + '⬛'.repeat(10 - Math.floor(p.happiness/10));

            let harvestStatus = '⏳ Đang sản xuất...';
            if (currentTime - Number(p.last_harvest) >= TWELVE_HOURS || Number(p.last_harvest) === 0) {
                harvestStatus = (p.hunger < 50 || p.happiness < 50) ? '😠 Đang đình công (Đói/Buồn)' : '💰 Đã sẵn sàng thu hoạch!';
            }

            // Tính số bữa ăn hôm nay để hiển thị
            const isSameDay = checkIsSameDayVN(currentTime, p.last_fed || 0);
            const displayFeedCount = isSameDay ? (p.feed_count || 0) : 0;
            const feedStatusText = displayFeedCount >= 3 ? 'Đã no căng (3/3 bữa)' : `Đã ăn ${displayFeedCount}/3 bữa`;

            const isNewQuestAvailable = !p.daily_quest || (currentTime - Number(p.last_quest_reset) > 24 * 60 * 60 * 1000);
            const showQuestDone = p.quest_status && !isNewQuestAvailable;

            const embed = new EmbedBuilder()
                .setColor('#ff99af')
                .setTitle(`Bảng Điều Khiển: ${p.pets.name}`)
                .setDescription(`**Chỉ số sinh tồn:**\n🍗 Độ no: ${hBar} **${p.hunger}%**\n💖 Vui vẻ: ${hapBar} **${p.happiness}%**\n🍲 Hôm nay: **${feedStatusText}**\n\n**Tình trạng Dâu:** ${harvestStatus}`)
                .setImage(p.pets.image_url)
                .setFooter({ text: 'Lưu ý: Nếu bỏ đói quá 3 ngày, Char sẽ bỏ đi và cuỗm mất 50k Dâu!' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btnFeed_${petId}`).setLabel('Cho Ăn').setStyle(ButtonStyle.Success).setEmoji('🍖'),
                new ButtonBuilder().setCustomId(`btnQuest_${petId}`).setLabel(showQuestDone ? 'Đã Xong Quest' : 'Xem Nhiệm Vụ').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                new ButtonBuilder().setCustomId(`btnHarvest_${petId}`).setLabel('Thu Hoạch').setStyle(ButtonStyle.Primary).setEmoji('💸')
            );

            const backRow = new ActionRowBuilder().addComponents(petMenu);
            return { content: 'Vui lòng chọn Char bạn muốn tương tác:', embeds: [embed], components: [row, backRow] };
        }
    }
};