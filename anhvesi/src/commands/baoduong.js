const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const FOOD_MENU = [
    { id: '1', name: 'Cà Phê Đen Đá', emoji: '☕', price: 3000 },
    { id: '2', name: 'Bánh Ngọt Macaron', emoji: '🧁', price: 5000 },
    { id: '3', name: 'Mì Ý Sốt Kem', emoji: '🍝', price: 10000 },
    { id: '4', name: 'Bánh Mì Kẹp Thịt', emoji: '🥪', price: 2000 },
    { id: '5', name: 'Gà Rán Sốt Cay', emoji: '🍗', price: 4000 },
    { id: '6', name: 'Pizza Hải Sản', emoji: '🍕', price: 6000 },
    { id: '7', name: 'Bít Tết Bò Thượng Hạng', emoji: '🥩', price: 15000 },
    { id: '8', name: 'Salad Trái Cây Tươi', emoji: '🥗', price: 2000 },
    { id: '9', name: 'Trà Sữa Trân Châu', emoji: '🧋', price: 5000 },
    { id: '10', name: 'Bánh Kem Socola', emoji: '🎂', price: 8000 }
];

const QUEST_LIST = [
    { cmd: 'mdaopho', desc: 'Stylist dạo phố (`mdaopho`) để nhặt Tinh Thể lấp lánh' },
    { cmd: 'mdaily', desc: 'Stylist điểm danh tủ đồ (`mdaily`) để nhận trợ cấp thời trang' },
    { cmd: 'mtvm', desc: 'Stylist thử vận may tại sàn diễn (`mtvm`)' },
    { cmd: 'mthamdo', desc: 'Stylist bước đi trên thảm đỏ dò mìn (`mthamdo`)' }
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
    name: 'baoduong',
    description: 'Bảo dưỡng, làm đẹp và tương tác với các búp bê trong bộ sưu tập',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const now = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        const ONE_DAY = 24 * 60 * 60 * 1000;

        const { data: myPetsChecked } = await supabase
            .from('user_pets')
            .select('*, pets(name, image_url, likes, hates)')
            .eq('user_id', userId);

        if (!myPetsChecked || myPetsChecked.length === 0) {
            return message.reply('Tủ đồ của bạn chưa có nhân vật nào! Hãy dùng lệnh `mshop` để ghé thăm cửa hàng tuyển mộ nhé.');
        }

        const petOptions = myPetsChecked.map(p => new StringSelectMenuOptionBuilder().setLabel(p.pets.name).setValue(p.id.toString()).setEmoji('☕'));
        const petMenu = new StringSelectMenuBuilder().setCustomId('select_pet_to_care').setPlaceholder('Chọn nhân vật bạn muốn tương tác...').addOptions(petOptions);

        const msg = await message.reply({ content: 'Vui lòng chọn nhân vật bạn muốn tương tác:', components: [new ActionRowBuilder().addComponents(petMenu)] });
        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Đừng chạm vào bộ sưu tập của Nhà Sưu Tầm khác!', ephemeral: true });

            let currentPetId;
            const currentTime = Date.now();
            
            if (i.isStringSelectMenu() && i.customId === 'select_pet_to_care') {
                currentPetId = parseInt(i.values[0]);
                await renderPetDashboard(i, currentPetId);
            }

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
                    if (currentTime - Number(petData.last_harvest) < TWELVE_HOURS && Number(petData.last_harvest) !== 0) {
                        return i.reply({ content: '⏳ Nhân vật đang bận rộn lịch trình! Hãy quay lại sau 12 tiếng.', ephemeral: true });
                    }
                    if (petData.hunger < 50 || petData.happiness < 50) {
                        return i.reply({ content: '😠 Nhân vật đang mệt mỏi và đói bụng nên từ chối nhận lịch trình! Hãy chăm sóc ngay.', ephemeral: true });
                    }

                    economyData.dau = Number(economyData.dau) + 20000;
                    await supabase.from('economy').upsert(economyData);
                    
                    petData.last_harvest = currentTime;
                    petData.hunger = Math.max(0, petData.hunger - 20);
                    petData.happiness = Math.max(0, petData.happiness - 10);
                    
                    await supabase.from('user_pets').update({
                        last_harvest: petData.last_harvest,
                        hunger: petData.hunger,
                        happiness: petData.happiness
                    }).eq('id', currentPetId);

                    await renderPetDashboard(i, currentPetId);
                    await i.followUp({ content: `💎 Cát-xê công việc: Bạn đã thu về **20.000** <a:gemheartpalepink:1551126619546976267> từ ${petData.pets.name}!`, ephemeral: true }); 
                }

                if (action === 'btnQuest') {
                    let lastReset = parseInt(petData.last_quest_reset) || 0;
                    let timeSinceReset = currentTime - lastReset;

                    if (!petData.daily_quest || timeSinceReset >= ONE_DAY) {
                        const randomQuest = QUEST_LIST[Math.floor(Math.random() * QUEST_LIST.length)];
                        petData.daily_quest = randomQuest.cmd;
                        
                        await supabase.from('user_pets').update({
                            daily_quest: randomQuest.cmd,
                            quest_status: false,
                            last_quest_reset: currentTime
                        }).eq('id', currentPetId);
                        
                        await renderPetDashboard(i, currentPetId);
                        await i.followUp({ content: `📜 **Yêu Cầu Mới Từ Nhân Vật:**\n${petData.pets.name} muốn ${randomQuest.desc}!\n*(Hãy ra ngoài chat gõ lệnh \`${randomQuest.cmd}\` để hoàn thành nhé)*`, ephemeral: true });
                    } else {
                        if (!petData.quest_status) {
                            const q = QUEST_LIST.find(q => q.cmd === petData.daily_quest);
                            return i.reply({ content: `📜 **Nhiệm vụ chưa xong:**\n${petData.pets.name} đang đợi ${q ? q.desc : 'bạn làm nhiệm vụ'}!\n*(Bạn hãy gõ lệnh \`${petData.daily_quest}\` ở bên ngoài kênh chat để nhận thưởng nhé)*`, ephemeral: true });
                        } else {
                            const timeLeft = ONE_DAY - timeSinceReset;
                            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                            const mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                            return i.reply({ content: `✅ Lịch trình hôm nay đã hoàn tất! Lịch trình mới sẽ có sau **${hours} giờ ${mins} phút** nữa.`, ephemeral: true });
                        }
                    }
                }

                if (action === 'btnFeed') {
                    // Kiểm tra giới hạn 3 bữa/ngày ngay trước khi mở menu Ăn Uống
                    const isSameDay = checkIsSameDayVN(currentTime, petData.last_fed || 0);
                    const currentFeedCount = isSameDay ? (petData.feed_count || 0) : 0;

                    if (currentFeedCount >= 3) {
                        return i.reply({ content: '❌ Nhân vật đã no bụng (**3/3 bữa** hôm nay) rồi! Không thể nhét thêm nữa đâu, hãy quay lại vào ngày mai nhé.', ephemeral: true });
                    }

                    const foodOptions = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(`${f.name} (${f.price} Tinh Thể)`).setValue(`feed_${currentPetId}_${f.id}`).setEmoji(f.emoji));
                    const feedMenu = new StringSelectMenuBuilder().setCustomId('menu_feed_pet').setPlaceholder('Chọn món ăn / thức uống...').addOptions(foodOptions);
                    
                    const row = new ActionRowBuilder().addComponents(feedMenu);
                    const backRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`btnBack_${currentPetId}`).setLabel('Quay lại bảng điều khiển').setStyle(ButtonStyle.Secondary)
                    );
                    
                    await i.update({ content: '🍽️ **Thực Đơn Món Ăn & Thức Uống**\nTinh Thể sẽ bị trừ trực tiếp khi bạn chọn món:', embeds: [], components: [row, backRow] });
                }
            }

            if (i.isStringSelectMenu() && i.customId === 'menu_feed_pet') {
                const [_, petIdStr, foodId] = i.values[0].split('_');
                currentPetId = parseInt(petIdStr);
                const food = FOOD_MENU.find(f => f.id === foodId);

                let { data: petData } = await supabase.from('user_pets').select('*, pets(*)').eq('id', currentPetId).single();
                let { data: economyData } = await supabase.from('economy').select('*').eq('user_id', userId).single();

                // Kiểm tra lại chặn click liên tục
                const isSameDay = checkIsSameDayVN(currentTime, petData.last_fed || 0);
                const currentFeedCount = isSameDay ? (petData.feed_count || 0) : 0;

                if (currentFeedCount >= 3) {
                    return i.reply({ content: '❌ Nhân vật đã no bụng (**3/3 bữa** hôm nay) rồi! Không thể nhét thêm nữa đâu, hãy quay lại vào ngày mai nhé.', ephemeral: true });
                }

                if (Number(economyData.dau) < food.price) {
                    return i.reply({ content: '❌ Bạn không có đủ Tinh Thể để thanh toán món này!', ephemeral: true });
                }

                const likes = petData.pets.likes ? petData.pets.likes.split(',') : [];
                const hates = petData.pets.hates ? petData.pets.hates.split(',') : [];

                let msgReply = '';
                let dauChange = -food.price; 
                
                if (likes.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 30);
                    petData.happiness = Math.min(100, petData.happiness + 20);
                    dauChange += 5000; 
                    msgReply = `🥰 **Tuyệt vời!** ${petData.pets.name} RẤT THÍCH ${food.emoji} ${food.name}. \n*Bạn được thưởng nóng 5.000 <a:gemheartpalepink:1551126619546976267>!*`;
                } else if (hates.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 10);
                    petData.happiness = Math.max(0, petData.happiness - 30);
                    dauChange -= 5000; 
                    msgReply = `🙄 **Không hợp khẩu vị!** ${petData.pets.name} CỰC KỲ KHÔNG THÍCH ${food.emoji} ${food.name}. \n*Tâm trạng tụt giảm, bạn bị phạt 5.000 <a:gemheartpalepink:1551126619546976267>!*`;
                } else {
                    petData.hunger = Math.min(100, petData.hunger + 20);
                    petData.happiness = Math.min(100, petData.happiness + 5);
                    msgReply = `✨ ${petData.pets.name} đã dùng xong ${food.emoji} ${food.name}. Trải nghiệm khá ấm cúng và hài lòng.`;
                }

                economyData.dau = Math.max(0, Number(economyData.dau) + dauChange);
                await supabase.from('economy').upsert(economyData);

                // Cập nhật Database, tăng số bữa đã ăn
                await supabase.from('user_pets').update({
                    hunger: petData.hunger,
                    happiness: petData.happiness,
                    last_fed: currentTime,
                    feed_count: currentFeedCount + 1
                }).eq('id', currentPetId);

                await renderPetDashboard(i, currentPetId); 
                await i.followUp({ content: msgReply, ephemeral: true }); 
            }
        });

        async function renderPetDashboard(interaction, petId) {
            const payload = await getDashboardPayload(petId);
            await interaction.update(payload);
        }

        async function getDashboardPayload(petId) {
            const currentTime = Date.now();
            const { data: p } = await supabase.from('user_pets').select('*, pets(*)').eq('id', petId).single();
            
            const safeHunger = Math.max(0, Math.min(100, p.hunger));
            const safeHappiness = Math.max(0, Math.min(100, p.happiness));
            const hungerBlocks = Math.floor(safeHunger / 10);
            const hapBlocks = Math.floor(safeHappiness / 10);
            
            const hBar = '🟩'.repeat(hungerBlocks) + '⬜'.repeat(10 - hungerBlocks);
            const hapBar = '🟪'.repeat(hapBlocks) + '⬜'.repeat(10 - hapBlocks);

            let harvestStatus = '⏳ Đang chờ lịch trình...';
            if (currentTime - Number(p.last_harvest) >= TWELVE_HOURS || Number(p.last_harvest) === 0) {
                harvestStatus = (safeHunger < 50 || safeHappiness < 50) ? '😠 Từ chối làm việc (Đói bụng/Tâm trạng kém)' : '💎 Đã sẵn sàng nhận lịch trình mới!';
            }

            // Tính số bữa ăn hôm nay để hiển thị
            const isSameDay = checkIsSameDayVN(currentTime, p.last_fed || 0);
            const displayFeedCount = isSameDay ? (p.feed_count || 0) : 0;
            const feedStatusText = displayFeedCount >= 3 ? 'Đã no căng (3/3 bữa)' : `Đã ăn ${displayFeedCount}/3 bữa`;

            let lastReset = parseInt(p.last_quest_reset) || 0;
            let timeSinceReset = currentTime - lastReset;
            let canDoNewQuest = (!p.daily_quest || timeSinceReset >= (24 * 60 * 60 * 1000));
            
            let buttonQuestLabel = (p.quest_status && !canDoNewQuest) ? 'Đã Xong Yêu Cầu' : 'Yêu Cầu';

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`Góc Tương Tác: ${p.pets.name}`)
                .setDescription(`**Chỉ số nhân vật:**\n🍖 Độ no: ${hBar} **${safeHunger}%**\n💖 Vui vẻ: ${hapBar} **${safeHappiness}%**\n🍽️ Hôm nay: **${feedStatusText}**\n\n**Tình trạng công việc:** ${harvestStatus}`)
                .setImage(p.pets.image_url)
                .setFooter({ text: 'Lưu ý: Nếu để quá 3 ngày không tương tác, nhân vật sẽ rời đi và mang theo 50k Tinh Thể!' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btnFeed_${petId}`).setLabel('Ăn Uống').setStyle(ButtonStyle.Success).setEmoji('☕'),
                new ButtonBuilder().setCustomId(`btnQuest_${petId}`).setLabel(buttonQuestLabel).setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                new ButtonBuilder().setCustomId(`btnHarvest_${petId}`).setLabel('Lịch Trình').setStyle(ButtonStyle.Primary).setEmoji('💎')
            );

            const backRow = new ActionRowBuilder().addComponents(petMenu);
            return { content: 'Vui lòng chọn nhân vật bạn muốn tương tác:', embeds: [embed], components: [row, backRow] };
        }
    }
};