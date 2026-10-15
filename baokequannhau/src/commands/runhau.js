const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// MENU MỒI NHẬU & BIA RƯỢU
const FOOD_MENU = [
    { id: '1', name: 'Đậu Phộng Luộc', emoji: '🥜', price: 3000 },
    { id: '2', name: 'Mực Khô Nướng Nước Mắm', emoji: '🦑', price: 5000 },
    { id: '3', name: 'Lẩu Thái Chua Cay', emoji: '🍲', price: 10000 },
    { id: '4', name: 'Nem Chua Thanh Hóa', emoji: '🥓', price: 2000 },
    { id: '5', name: 'Chân Gà Sả Tắc', emoji: '🍗', price: 4000 },
    { id: '6', name: 'Bò Lúc Lắc Lửa Hồng', emoji: '🥩', price: 6000 },
    { id: '7', name: 'Tôm Hùm Nướng Phô Mai', emoji: '🦞', price: 15000 },
    { id: '8', name: 'Gỏi Ngó Sen Tai Heo', emoji: '🥗', price: 2000 },
    { id: '9', name: 'Bia Hơi Hà Nội', emoji: '🍺', price: 5000 },
    { id: '10', name: 'Rượu Mơ Má Đào', emoji: '🍶', price: 8000 }
];

// DANH SÁCH LỆNH CỦA QUÁN
const QUEST_LIST = [
    { cmd: 'mdaoquan', desc: 'Khách VIP đi dạo quanh quán (`mdaoquan`) để lượm lặt Nắp Bia rơi vãi' },
    { cmd: 'mdaily', desc: 'Khách VIP điểm danh bàn nhậu (`mdaily`) để nhận Nắp Bia miễn phí từ quán' },
    { cmd: 'mxocdia', desc: 'Khách VIP thử nhân phẩm xóc dĩa ăn tiền (`mxocdia`)' },
    { cmd: 'mlatnap', desc: 'Khách VIP chơi trò lật nắp bia dưới gầm bàn (`mlatnap`)' }
];

module.exports = {
    name: 'runhau', // Đã đổi tên lệnh từ baoduong thành runhau
    description: 'Gọi chiến hữu ra bàn, gọi mồi bén và cụng ly tâm sự',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const now = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Lấy danh sách bạn nhậu
        const { data: myPetsChecked } = await supabase
            .from('user_pets')
            .select('*, pets(name, image_url, likes, hates)')
            .eq('user_id', userId);

        if (!myPetsChecked || myPetsChecked.length === 0) {
            return message.reply('Bàn của bạn trống trơn chưa có ai ngồi cùng! Hãy dùng lệnh `mshop` để mồi chài một chiến hữu nhé.');
        }

        const petOptions = myPetsChecked.map(p => new StringSelectMenuOptionBuilder().setLabel(p.pets.name).setValue(p.id.toString()).setEmoji('🍻'));
        const petMenu = new StringSelectMenuBuilder().setCustomId('select_pet_to_care').setPlaceholder('Chọn chiến hữu bạn muốn gọi ra bàn...').addOptions(petOptions);

        const msg = await message.reply({ content: 'Vui lòng chọn chiến hữu bạn muốn nâng ly cùng:', components: [new ActionRowBuilder().addComponents(petMenu)] });
        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ê ê, đừng có qua giành bạn nhậu của bàn khác nha!', ephemeral: true });

            let currentPetId;
            const currentTime = Date.now();
            
            // XỬ LÝ: Menu chọn Nhân vật gốc
            if (i.isStringSelectMenu() && i.customId === 'select_pet_to_care') {
                currentPetId = parseInt(i.values[0]);
                await renderPetDashboard(i, currentPetId);
            }

            // XỬ LÝ: Nút Quay Lại từ Menu Tương Tác
            if (i.isButton() && i.customId.startsWith('btnBack_')) {
                currentPetId = parseInt(i.customId.split('_')[1]);
                await renderPetDashboard(i, currentPetId);
            }

            // XỬ LÝ: Các nút chức năng chính
            if (i.isButton() && (i.customId.startsWith('btnHarvest_') || i.customId.startsWith('btnQuest_') || i.customId.startsWith('btnFeed_'))) {
                const action = i.customId.split('_')[0]; 
                currentPetId = parseInt(i.customId.split('_')[1]);
                
                let { data: petData } = await supabase.from('user_pets').select('*, pets(*)').eq('id', currentPetId).single();
                let { data: economyData } = await supabase.from('economy').select('*').eq('user_id', userId).single();

                // 1. CHẠY BÀN PHỤ QUÁN (HARVEST)
                if (action === 'btnHarvest') {
                    if (currentTime - Number(petData.last_harvest) < TWELVE_HOURS && Number(petData.last_harvest) !== 0) {
                        return i.reply({ content: '⏳ Chiến hữu đang say quắc cần câu! Hãy quay lại sau 12 tiếng để giải rượu nhé.', ephemeral: true });
                    }
                    if (petData.hunger < 50 || petData.happiness < 50) {
                        return i.reply({ content: '😠 Chiến hữu đang đói lả và tụt mood nên ứ thèm đi phụ quán đâu! Bơm mồi với bia vô đi.', ephemeral: true });
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

                    await renderPetDashboard(i, currentPetId); // Cập nhật Dashboard
                    await i.followUp({ content: `💰 **Tiền bo phụ quán:** Hai anh em đã hốt được **20.000** <:np:1557713580831547462> nhờ công sức của ${petData.pets.name}!`, ephemeral: true });
                }

                // 2. KÈO NHẬU / YÊU CẦU (QUEST)
                if (action === 'btnQuest') {
                    let lastReset = parseInt(petData.last_quest_reset) || 0;
                    let timeSinceReset = currentTime - lastReset;

                    // KIỂM TRA LOGIC 24H
                    if (!petData.daily_quest || timeSinceReset >= ONE_DAY) {
                        const randomQuest = QUEST_LIST[Math.floor(Math.random() * QUEST_LIST.length)];
                        petData.daily_quest = randomQuest.cmd;
                        
                        await supabase.from('user_pets').update({
                            daily_quest: randomQuest.cmd,
                            quest_status: false,
                            last_quest_reset: currentTime
                        }).eq('id', currentPetId);
                        
                        await renderPetDashboard(i, currentPetId);
                        await i.followUp({ content: `📜 **Kèo Nhậu Mới:**\n${petData.pets.name} đang nổi hứng muốn ${randomQuest.desc}!\n*(Hãy ra ngoài chat gõ lệnh \`${randomQuest.cmd}\` để chốt kèo nhé)*`, ephemeral: true });
                    } else {
                        // CHƯA QUA 24H -> HIỆN THÔNG BÁO TÙY TIẾN ĐỘ
                        if (!petData.quest_status) {
                            const q = QUEST_LIST.find(q => q.cmd === petData.daily_quest);
                            return i.reply({ content: `📜 **Kèo chưa xong:**\n${petData.pets.name} đang đợi ${q ? q.desc : 'bạn chốt kèo'}!\n*(Bạn hãy gõ lệnh \`${petData.daily_quest}\` ở bên ngoài kênh chat để nhận thưởng nhé)*`, ephemeral: true });
                        } else {
                            const timeLeft = ONE_DAY - timeSinceReset;
                            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                            const mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                            return i.reply({ content: `✅ Kèo hôm nay đã xõa xong xuôi! Hẹn anh em làm chầu mới sau **${hours} giờ ${mins} phút** nữa.`, ephemeral: true });
                        }
                    }
                }

                // 3. MỞ MENU GỌI MÓN (FEED)
                if (action === 'btnFeed') {
                    const foodOptions = FOOD_MENU.map(f => new StringSelectMenuOptionBuilder().setLabel(`${f.name} (${f.price} Nắp Bia)`).setValue(`feed_${currentPetId}_${f.id}`).setEmoji(f.emoji));
                    const feedMenu = new StringSelectMenuBuilder().setCustomId('menu_feed_pet').setPlaceholder('Đang gọi món và lên bia...').addOptions(foodOptions);
                    
                    const row = new ActionRowBuilder().addComponents(feedMenu);
                    const backRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`btnBack_${currentPetId}`).setLabel('Quay lại bàn nhậu').setStyle(ButtonStyle.Secondary)
                    );
                    
                    await i.update({ content: '🍽️ **Menu Mồi Bén & Đồ Uống**\nNắp Bia sẽ bị trừ trực tiếp khi bạn order món:', embeds: [], components: [row, backRow] });
                }
            }

            // XỬ LÝ: Khi người dùng chọn món ăn từ Menu
            if (i.isStringSelectMenu() && i.customId === 'menu_feed_pet') {
                const [_, petIdStr, foodId] = i.values[0].split('_');
                currentPetId = parseInt(petIdStr);
                const food = FOOD_MENU.find(f => f.id === foodId);

                let { data: petData } = await supabase.from('user_pets').select('*, pets(*)').eq('id', currentPetId).single();
                let { data: economyData } = await supabase.from('economy').select('*').eq('user_id', userId).single();

                if (Number(economyData.dau) < food.price) {
                    return i.reply({ content: '❌ Tài khoản không đủ Nắp Bia, định ăn quỵt của quán hả bạn hiền?', ephemeral: true });
                }

                const likes = petData.pets.likes ? petData.pets.likes.split(',') : [];
                const hates = petData.pets.hates ? petData.pets.hates.split(',') : [];

                let msgReply = '';
                let dauChange = -food.price; 
                
                if (likes.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 30);
                    petData.happiness = Math.min(100, petData.happiness + 20);
                    dauChange += 5000; 
                    msgReply = `🥰 **Quá đã!** ${petData.pets.name} RẤT KHOÁI món ${food.emoji} ${food.name}. \n*Chủ quán thấy vui nên bo lại cho bạn 5.000 <:np:1557713580831547462>!*`;
                } else if (hates.includes(foodId)) {
                    petData.hunger = Math.min(100, petData.hunger + 10);
                    petData.happiness = Math.max(0, petData.happiness - 30);
                    dauChange -= 5000; 
                    msgReply = `🙄 **Dở ẹc!** ${petData.pets.name} CHÊ CỰC MẠNH món ${food.emoji} ${food.name}. \n*Khách chửi rủa ỏm tỏi, bạn bị phạt 5.000 <:np:1557713580831547462> tiền làm ồn!*`;
                } else {
                    petData.hunger = Math.min(100, petData.hunger + 20);
                    petData.happiness = Math.min(100, petData.happiness + 5);
                    msgReply = `✨ ${petData.pets.name} đã nhậu xong món ${food.emoji} ${food.name}. Bụng no êm ái, tình anh em thêm gắn kết.`;
                }

                economyData.dau = Math.max(0, Number(economyData.dau) + dauChange);
                await supabase.from('economy').upsert(economyData);

                await supabase.from('user_pets').update({
                    hunger: petData.hunger,
                    happiness: petData.happiness,
                    last_fed: currentTime
                }).eq('id', currentPetId);

                await renderPetDashboard(i, currentPetId); // Cập nhật lại giao diện Dashboard bị khuất
                await i.followUp({ content: msgReply, ephemeral: true }); // Hiện tin nhắn báo kết quả ăn uống
            }
        });

        // HÀM: Đẩy giao diện hiển thị
        async function renderPetDashboard(interaction, petId) {
            const payload = await getDashboardPayload(petId);
            // Cập nhật đè trực tiếp lên tương tác cũ
            await interaction.update(payload);
        }

        // HÀM: Chế tạo Giao diện (Embed)
        async function getDashboardPayload(petId) {
            const currentTime = Date.now();
            const { data: p } = await supabase.from('user_pets').select('*, pets(*)').eq('id', petId).single();
            
            const safeHunger = Math.max(0, Math.min(100, p.hunger));
            const safeHappiness = Math.max(0, Math.min(100, p.happiness));
            const hungerBlocks = Math.floor(safeHunger / 10);
            const hapBlocks = Math.floor(safeHappiness / 10);
            
            const hBar = '🟩'.repeat(hungerBlocks) + '⬜'.repeat(10 - hungerBlocks);
            const hapBar = '🟪'.repeat(hapBlocks) + '⬜'.repeat(10 - hapBlocks);

            let harvestStatus = '⏳ Đang ngồi chờ kèo...';
            if (currentTime - Number(p.last_harvest) >= TWELVE_HOURS || Number(p.last_harvest) === 0) {
                harvestStatus = (safeHunger < 50 || safeHappiness < 50) ? '😠 Từ chối đi làm (Thiếu mồi/Đang quạu)' : '🍻 Đã tỉnh rượu, sẵn sàng chạy bàn kiếm lúa!';
            }

            // LOGIC KIỂM TRA NÚT YÊU CẦU
            let lastReset = parseInt(p.last_quest_reset) || 0;
            let timeSinceReset = currentTime - lastReset;
            let canDoNewQuest = (!p.daily_quest || timeSinceReset >= (24 * 60 * 60 * 1000));
            
            let buttonQuestLabel = (p.quest_status && !canDoNewQuest) ? 'Đã Xong Kèo' : 'Kèo Nhậu';

            const embed = new EmbedBuilder()
                .setColor('#FF8C00') // Đổi sang màu cam/vàng cho giống màu bia
                .setTitle(`Bàn Nhậu Của: ${p.pets.name}`)
                .setDescription(`**Trạng thái cơ thể:**\n🍖 Độ no (Mồi): ${hBar} **${safeHunger}%**\n💖 Độ hưng phấn: ${hapBar} **${safeHappiness}%**\n\n**Tình trạng chạy bàn:** ${harvestStatus}`)
                .setImage(p.pets.image_url)
                .setFooter({ text: 'Luật quán: Để chiến hữu leo cây 3 ngày không nhậu, người ta dỗi bỏ sang bàn khác và cuỗm luôn 50k Nắp Bia ráng chịu!' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btnFeed_${petId}`).setLabel('Gọi Món').setStyle(ButtonStyle.Success).setEmoji('🍗'),
                new ButtonBuilder().setCustomId(`btnQuest_${petId}`).setLabel(buttonQuestLabel).setStyle(ButtonStyle.Secondary).setEmoji('🍻'),
                new ButtonBuilder().setCustomId(`btnHarvest_${petId}`).setLabel('Chạy Bàn').setStyle(ButtonStyle.Primary).setEmoji('💸')
            );

            const backRow = new ActionRowBuilder().addComponents(petMenu);
            return { content: 'Vui lòng chọn chiến hữu bạn muốn nâng ly cùng:', embeds: [embed], components: [row, backRow] };
        }
    }
};