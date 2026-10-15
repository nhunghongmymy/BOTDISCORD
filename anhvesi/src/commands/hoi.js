const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');
const { isAuthorized } = require('../utils/permissions');

// --- 30 KỊCH BẢN ĐÊM HỘI THỜI TRANG (CONCEPT BÚP BÊ NAM / MỸ NAM) ---
const buffActions = [
    { text: "Khoe góc nghiêng cực bén 📸", steps: 5 },
    { text: "Sải bước catwalk điêu luyện trên thảm đỏ 🚶‍♂️✨", steps: 4 },
    { text: "Bắt trúng camera với thần thái ngút ngàn 🎥", steps: 4 },
    { text: "Tháo hờ khuy măng sét đầy quyến rũ 🤵", steps: 3 },
    { text: "Vuốt ngược mái tóc ướt đẫm mồ hôi 💦", steps: 3 },
    { text: "Giao lưu ánh mắt làm fan điêu đứng 😉", steps: 3 },
    { text: "Xoay người tung vạt áo khoác cực nghệ 🧥", steps: 2 },
    { text: "Nở nụ cười mỉm ma mị 😎", steps: 2 },
    { text: "Tạo dáng Vogue thần thánh 🌟", steps: 2 },
    { text: "Hất tóc lãng tử dưới ánh đèn Spotlight 💡", steps: 1 }
];

const debuffActions = [
    { text: "Trượt chân vì sàn thảm đỏ quá trơn 🧊", steps: -2 },
    { text: "Bước sai nhịp điệu bài nhạc nền 🎵", steps: -2 },
    { text: "Ánh đèn Flash chói làm nheo mắt nhăn nhó 😵", steps: -1 },
    { text: "Bị tuột dây giày giữa sàn diễn 👟", steps: -1 },
    { text: "Lỡ hắt xì phá hỏng góc quay đẹp 🤧", steps: -1 },
    { text: "Đứng sượng trân quên mất pose dáng 🗿", steps: -1 },
    { text: "Rớt phụ kiện lấp lánh xuống sàn 💍", steps: -1 },
    { text: "Bị vướng áo choàng vào đạo cụ 🥀", steps: -1 },
    { text: "Nháy mắt trúng lúc bị chụp dìm 🥴", steps: -1 },
    { text: "Lớp makeup hơi trôi do mồ hôi 🐼", steps: 0 }
];

const neutralActions = [
    { text: "Đứng chờ ánh đèn rọi tới mình ⏳", steps: 0 },
    { text: "Đưa tay vuốt cằm trầm ngâm 🤔", steps: 0 },
    { text: "Chỉnh lại chiếc cravat cho ngay ngắn 👔", steps: 0 },
    { text: "Chớp mắt lạnh lùng nhìn quanh 👀", steps: 0 },
    { text: "Bước chậm lại một nhịp thở 😮‍💨", steps: 0 },
    { text: "Chờ giai điệu lên đoạn cao trào 🎶", steps: 0 },
    { text: "Nhếch mép cười nhạt 🍷", steps: 0 },
    { text: "Cởi nhẹ chiếc áo khoác ngoài 🧥", steps: 0 },
    { text: "Vuốt lại nếp áo cho phẳng phiu ✨", steps: 0 },
    { text: "Xoay nhẹ gót giày lấp lánh 👞", steps: 0 }
];

const allActions = [...buffActions, ...debuffActions, ...neutralActions];

// Random các Emoji thanh lịch cho các Búp Bê Nam
const EMOJI_LIST = ['🤵', '🤴', '🧛‍♂️', '🧝‍♂️', '🎩', '🍷', '🎭', '🎻', '🌟', '💎', '✨', '👑'];

module.exports = {
    name: 'hoi',
    description: 'Mở cổng bình chọn Đêm Hội Vedette Lấp Lánh',
    async execute(message, args, db, userData, supabase) {
        // 1. KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Khách tham quan không có thẩm quyền tổ chức sự kiện!');

        // 2. KÉO DANH SÁCH "BÚP BÊ" TỪ DATABASE
        const { data: petsData } = await supabase.from('pets').select('*').eq('guild_id', message.guild.id);
        if (!petsData || petsData.length === 0) {
            return message.reply('❌ Hậu trường đang trống vắng! Chưa có ứng viên nào được thêm vào danh sách, Quản lý Boutique vui lòng dùng lệnh `mshop` để thêm Búp Bê trước nhé!');
        }

        const RACERS = {};
        petsData.slice(0, 25).forEach((p, index) => {
            RACERS[p.id.toString()] = {
                id: p.id.toString(),
                name: p.name,
                emoji: EMOJI_LIST[index % EMOJI_LIST.length]
            };
        });

        // 3. LẤY THỜI GIAN CƯỢC
        let minutes = parseInt(args[0]);
        if (!minutes || isNaN(minutes) || minutes <= 0) minutes = 3;
        const bettingTimeMs = minutes * 60 * 1000;

        const bets = {}; 
        let totalPool = 0; 
        let isRaceStarted = false; 

        // 4. TẠO GIAO DIỆN
        const options = Object.values(RACERS).map(r => 
            new StringSelectMenuOptionBuilder()
                .setLabel(r.name)
                .setValue(r.id)
                .setDescription('Đầu tư Tinh Thể ngay!')
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_racer')
            .setPlaceholder('💎 Chọn Búp Bê để tài trợ 💎')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const openEmbed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('👠 ĐÊM HỘI VEDETTE LẤP LÁNH 👠')
            .setDescription(`**Cổng bình chọn sẽ đóng trong vòng ${minutes} phút.**\n\n📌 **Thể lệ Hộp Nhạc:**\nChọn Ứng Viên ở menu bên dưới để tài trợ Tinh Thể **(Có thể đầu tư cho nhiều Búp Bê cùng lúc)**.\n\nTối đa **1.000.000 Tinh Thể** / 1 người.\n\nTiền sẽ bị trừ ngay. Nếu Búp Bê của bạn trình diễn cuốn hút nhất (tới đích đầu tiên), bạn sẽ được chia tổng giải (Quản lý thu 5% phí bảo dưỡng).`)
            .setTimestamp();

        const sMessage = await message.channel.send({ embeds: [openEmbed], components: [row] });

        // 5. LẮNG NGHE SỰ KIỆN CHỌN
        const collector = sMessage.createMessageComponentCollector({ time: bettingTimeMs });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'select_racer') {
                if (isRaceStarted) {
                    return interaction.reply({ content: '❌ Cổng bình chọn đã khép lại, sàn diễn đang lên đèn!', ephemeral: true });
                }

                const racerId = interaction.values[0];
                const racer = RACERS[racerId];

                const modal = new ModalBuilder()
                    .setCustomId(`modal_cuoc_${racerId}_${interaction.id}`)
                    .setTitle(`Tài trợ cho ${racer.name}`);

                const moneyInput = new TextInputBuilder()
                    .setCustomId('cuoc_amount')
                    .setLabel('Số Tinh Thể tài trợ (Tối đa 1M):')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('VD: 500000')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
                await interaction.showModal(modal);

                try {
                    const modalSubmit = await interaction.awaitModalSubmit({
                        filter: i => i.customId === `modal_cuoc_${racerId}_${interaction.id}` && i.user.id === interaction.user.id,
                        time: 60000
                    });

                    if (isRaceStarted) {
                        return modalSubmit.reply({ content: '❌ Chậm tay rồi! Hộp nhạc đã bắt đầu xoay nên phiếu tài trợ này không được công nhận.', ephemeral: true });
                    }

                    const amountStr = modalSubmit.fields.getTextInputValue('cuoc_amount').replace(/,/g, '');
                    const amount = parseInt(amountStr);

                    if (isNaN(amount) || amount <= 0) {
                        return modalSubmit.reply({ content: '❌ Số Tinh Thể không hợp lệ!', ephemeral: true });
                    }

                    const userId = interaction.user.id;
                    if (!bets[userId]) bets[userId] = {};
                    const currentBet = bets[userId][racerId] || 0;

                    if (currentBet + amount > 1000000) {
                        return modalSubmit.reply({ content: `❌ Bạn chỉ được tài trợ tối đa 1.000.000 Tinh Thể cho ${racer.name}! (Hiện đã rót: **${currentBet.toLocaleString('en-US')}**)`, ephemeral: true });
                    }

                    let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                    if (!data || Number(data.dau) < amount) {
                        return modalSubmit.reply({ content: '❌ Tủ đồ bạn còn đúng cái nịt, lấy Tinh Thể đâu ra mà đòi đu idol!', ephemeral: true });
                    }

                    data.dau = Number(data.dau) - amount;
                    await supabase.from('economy').upsert(data);

                    bets[userId][racerId] = currentBet + amount;
                    totalPool += amount;

                    await modalSubmit.reply({ content: `✅ Đã rót **${amount.toLocaleString('en-US')}** Tinh Thể để cổ vũ cho ${racer.name}!`, ephemeral: true });
                } catch (err) {
                    // Timeout
                }
            }
        });

        // 6. HẾT GIỜ -> BẮT ĐẦU TRÌNH DIỄN (TẠO TIN NHẮN MỚI)
        collector.on('end', async () => {
            isRaceStarted = true;
            
            const participatingIds = new Set();
            for (const uid in bets) {
                for (const rId in bets[uid]) {
                    participatingIds.add(rId);
                }
            }

            if (participatingIds.size === 0) {
                const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
                return sMessage.edit({ content: '🥀 **ĐÊM HỘI BỊ HỦY!**\nKhông có Nhà Sưu Tầm nào chịu chi Tinh Thể ủng hộ. Các ứng viên đã lủi thủi quay về hậu trường.', embeds: [], components: [disabledRow] });
            }

            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await sMessage.edit({ content: '🔒 **CỔNG BÌNH CHỌN ĐÃ KHÉP LẠI! ÁNH ĐÈN ĐANG CHIẾU XUỐNG SÀN DIỄN (Vui lòng theo dõi ở tin nhắn mới bên dưới)!**', components: [disabledRow] });

            let raceMessage = await message.channel.send('✨ **CÁC BÚP BÊ ĐANG BƯỚC RA SÀN DIỄN...** ✨');

            const trackLength = 20; 
            let raceState = {};
            participatingIds.forEach(id => raceState[id] = 0);

            let historyLog = [];

            // Giao diện thanh tiến trình Hộp Nhạc lấp lánh
            const getProgressBar = (steps) => {
                const safeSteps = Math.max(0, Math.min(steps, trackLength));
                const filled = '✨'.repeat(safeSteps);
                const empty = '➖'.repeat(trackLength - safeSteps);
                return `${filled}${empty}`;
            };

            let isRaceFinished = false;
            let currentRound = 1;
            const MAX_ROUNDS = 50; 

            while (!isRaceFinished && currentRound <= MAX_ROUNDS) {
                await new Promise(r => setTimeout(r, 3000));
                historyLog = []; 

                for (const rId of participatingIds) {
                    const action = allActions[Math.floor(Math.random() * allActions.length)];
                    raceState[rId] += action.steps;
                    
                    if (raceState[rId] < 0) raceState[rId] = 0; 
                    
                    if (raceState[rId] >= trackLength) {
                        raceState[rId] = trackLength;
                        isRaceFinished = true; 
                    }
                    
                    historyLog.push(`${RACERS[rId].name}: ${action.text} (${action.steps > 0 ? '+'+action.steps : action.steps} điểm)`);
                }

                let descriptionLines = [];
                for (const rId of participatingIds) {
                    const bar = getProgressBar(raceState[rId]);
                    descriptionLines.push(`${RACERS[rId].emoji} ${bar} 📸\n└ **${RACERS[rId].name}**\n`);
                }

                let footerContent = `Diễn biến vòng ${currentRound}\n${historyLog.join('\n')}\nTổng quỹ đầu tư: ${totalPool.toLocaleString('en-US')} Tinh Thể`;
                
                if (footerContent.length > 2000) {
                    footerContent = footerContent.substring(0, 1995) + '...';
                }

                const raceEmbed = new EmbedBuilder()
                    .setColor('#FFB6C1')
                    .setTitle('✨ SÀN DIỄN ĐANG NÓNG LÊN... ✨')
                    .setDescription(descriptionLines.join('\n'))
                    .setFooter({ text: footerContent });

                await raceMessage.edit({ content: '', embeds: [raceEmbed], components: [] });
                currentRound++;
            }

            // 7. KẾT THÚC VÀ TÍNH THƯỞNG
            let maxSteps = -1;
            let winnersList = [];
            for (const rId of participatingIds) {
                if (raceState[rId] > maxSteps) {
                    maxSteps = raceState[rId];
                    winnersList = [rId];
                } else if (raceState[rId] === maxSteps) {
                    winnersList.push(rId);
                }
            }

            const winningRacerId = winnersList[0]; 
            const winnerObj = RACERS[winningRacerId];

            const rewardPool = Math.floor(totalPool * 0.95);
            
            let betOnWinner = 0;
            for (const uid in bets) {
                if (bets[uid][winningRacerId]) {
                    betOnWinner += bets[uid][winningRacerId];
                }
            }

            let winLog = [];
            if (betOnWinner > 0) {
                for (const uid in bets) {
                    const userBet = bets[uid][winningRacerId];
                    if (userBet) {
                        const payout = Math.floor((userBet / betOnWinner) * rewardPool);
                        
                        try {
                            let { data: winData, error } = await supabase.from('economy').select('*').eq('user_id', uid).single();
                            if (!error && winData) {
                                winData.dau = Number(winData.dau) + payout;
                                await supabase.from('economy').upsert(winData);
                            }
                        } catch (error) {
                            console.error(`Lỗi trả thưởng cho user ${uid}:`, error);
                        }
                        
                        winLog.push(`<@${uid}>: +**${payout.toLocaleString('en-US')}** Tinh Thể`);
                    }
                }
            } else {
                winLog.push('Không ai đu đúng Vedette. Quản lý Boutique húp trọn!');
            }

            let finalDesc = [];
            for (const rId of participatingIds) {
                const bar = getProgressBar(raceState[rId]);
                const isWinner = rId === winningRacerId ? '👑 (VEDETTE)' : '';
                finalDesc.push(`${RACERS[rId].emoji} ${bar} 📸\n└ **${RACERS[rId].name}** ${isWinner}\n`);
            }
            finalDesc.push(`\n**💰 TỔNG KẾT PHẦN THƯỞNG:**\nGương mặt đại diện: **${winnerObj.name}**\n${winLog.join('\n')}`);

            const finalEmbed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('👑 KẾT QUẢ ĐÊM HỘI VEDETTE 👑')
                .setDescription(finalDesc.join('\n'))
                .setFooter({ text: `Tổng quỹ chia thưởng: ${totalPool.toLocaleString('en-US')} Tinh Thể | Đã trừ 5% phí bảo dưỡng` });

            await raceMessage.edit({ content: '🎉 **MÀN TRÌNH DIỄN ĐÃ KẾT THÚC! CÙNG TUNG HOA NÀO!** <a:gemheartpalepink:1551126619546976267>', embeds: [finalEmbed] });
        });
    }
};