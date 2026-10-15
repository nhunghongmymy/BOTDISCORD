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

// --- 30 KỊCH BẢN CUỘC THI "CHỒNG KHỎE CHỒNG ĐẸP" ---
const buffActions = [
    { text: "Khoe cơ bụng 6 múi 🍫", steps: 5 },
    { text: "Lột áo khoe bắp tay cuồn cuộn 💪", steps: 4 },
    { text: "Biểu diễn catwalk xuất thần 🚶‍♂️✨", steps: 4 },
    { text: "Nháy mắt thả thính ban giám khảo 😉", steps: 3 },
    { text: "Vuốt tóc ướt sũng mồ hôi quyến rũ 💦", steps: 3 },
    { text: "Bắn tim tung tóe khắp sân khấu 🫰💖", steps: 3 },
    { text: "Hát nhép điêu luyện chuẩn nhịp 🎤", steps: 2 },
    { text: "Cười tỏa nắng làm lóa mắt fan 😎", steps: 2 },
    { text: "Tạo dáng góc nghiêng thần thánh 📸", steps: 2 },
    { text: "Đi sát rìa sân khấu hóng hớt 🎥", steps: 1 }
];

const debuffActions = [
    { text: "Tụt thắt lưng lộ quần đùi bông 🩳", steps: -2 },
    { text: "Dẫm gấu quần vấp té sấp mặt 🤕", steps: -2 },
    { text: "Nháy mắt nhưng bị chuột rút cơ mặt 🥴", steps: -1 },
    { text: "Vuốt keo xịt tóc trúng mắt 😵", steps: -1 },
    { text: "Lỡ hắt xì văng cả nước mũi 🤧", steps: -1 },
    { text: "Quên bài catwalk đứng gãi đầu 🐒", steps: -1 },
    { text: "Rớt mic xuống sàn cái boong 🎤💥", steps: -1 },
    { text: "Lỡ cười thấy cọng hành dính răng 🥬", steps: -1 },
    { text: "Vẫy tay nhưng không ai thèm hét 🦗", steps: -1 },
    { text: "Mồ hôi trôi sạch lớp makeup 🐼", steps: 0 }
];

const neutralActions = [
    { text: "Đứng đực ra nhìn khán giả 🧍‍♂️", steps: 0 },
    { text: "Chớp chớp mắt ngây thơ 🥺", steps: 0 },
    { text: "Bận liếc xem đối thủ làm gì 👀", steps: 0 },
    { text: "Tranh thủ uống ngụm nước 💧", steps: 0 },
    { text: "Đang nghĩ xem tối nay ăn gì 🍜", steps: 0 },
    { text: "Chỉnh lại cravat 👔", steps: 0 },
    { text: "Vẫy tay với mẹ ở dưới khán đài 👋", steps: 0 },
    { text: "Ngáp ngắn ngáp dài 🥱", steps: 0 },
    { text: "Tìm góc sáng để đứng 💡", steps: 0 },
    { text: "Chỉ tay lên trời không rõ lý do ☝️", steps: 0 }
];

const allActions = [...buffActions, ...debuffActions, ...neutralActions];

// Random các Emoji bảnh tỏn cho các Chồng
const EMOJI_LIST = ['🕺', '🤵', '🦸‍♂️', '🧛‍♂️', '🧝‍♂️', '🧜‍♂️', '👼', '🕵️‍♂️', '👨‍🎤', '🧑‍🚀', '🤴', '😎'];

module.exports = {
    name: 'song',
    description: 'Mở cổng bình chọn Đại Hội Chồng Khỏe Chồng Đẹp',
    async execute(message, args, db, userData, supabase) {
        // 1. KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn không có thẩm quyền mở cổng bình chọn!');

        // 2. KÉO DANH SÁCH "CHỒNG" TỪ DATABASE
        const { data: petsData } = await supabase.from('pets').select('*').eq('guild_id', message.guild.id);
        if (!petsData || petsData.length === 0) {
            return message.reply('❌ Hậu trường đang trống vắng! Chưa có ứng viên nào được thêm vào danh sách, Quản lý vui lòng dùng lệnh `mshop` để thêm Búp Bê/Chồng trước nhé!');
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
                // ĐÃ BỎ: Không set Emoji ở menu nữa theo yêu cầu
                .setValue(r.id)
                .setDescription('Cược Dâu ngay!')
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_racer')
            .setPlaceholder('💎 Chọn Ứng Viên để đặt cược 💎')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const openEmbed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('👑 ĐẠI HỘI CHỒNG KHỎE CHỒNG ĐẸP 👑')
            .setDescription(`**Cổng bình chọn sẽ đóng trong vòng ${minutes} phút.**\n\n📌 **Luật chơi:**\nChọn Ứng Viên ở menu bên dưới để cược Dâu **(Có thể cược cho nhiều Chồng cùng lúc)**.\n\nTối đa **1.000.000 Dâu** / 1 Chồng.\n\nTiền sẽ bị trừ ngay. Nếu ứng viên của bạn trình diễn cuốn hút nhất, bạn sẽ được chia tổng giải (Ban tổ chức thu 5% thuế phí).`)
            .setTimestamp();

        const sMessage = await message.channel.send({ embeds: [openEmbed], components: [row] });

        // 5. LẮNG NGHE SỰ KIỆN CHỌN
        const collector = sMessage.createMessageComponentCollector({ time: bettingTimeMs });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'select_racer') {
                if (isRaceStarted) {
                    return interaction.reply({ content: '❌ Cổng bình chọn đã đóng, các thí sinh đang trình diễn!', ephemeral: true });
                }

                const racerId = interaction.values[0];
                const racer = RACERS[racerId];

                const modal = new ModalBuilder()
                    .setCustomId(`modal_cuoc_${racerId}_${interaction.id}`)
                    .setTitle(`Cược cho ${racer.name}`);

                const moneyInput = new TextInputBuilder()
                    .setCustomId('cuoc_amount')
                    .setLabel('Số Dâu cược (Tối đa 1M):')
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
                        return modalSubmit.reply({ content: '❌ Chậm tay rồi! Cổng đã đóng nên vé tài trợ này không được công nhận.', ephemeral: true });
                    }

                    const amountStr = modalSubmit.fields.getTextInputValue('cuoc_amount').replace(/,/g, '');
                    const amount = parseInt(amountStr);

                    if (isNaN(amount) || amount <= 0) {
                        return modalSubmit.reply({ content: '❌ Số Dâu không hợp lệ!', ephemeral: true });
                    }

                    const userId = interaction.user.id;
                    if (!bets[userId]) bets[userId] = {};
                    const currentBet = bets[userId][racerId] || 0;

                    if (currentBet + amount > 1000000) {
                        return modalSubmit.reply({ content: `❌ Bạn chỉ được cược tối đa 1.000.000 Dâu cho ${racer.name}! (Hiện đã cược: **${currentBet.toLocaleString('en-US')}**)`, ephemeral: true });
                    }

                    let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                    if (!data || Number(data.dau) < amount) {
                        return modalSubmit.reply({ content: '❌ Ví bạn còn đúng cái nịt, lấy Dâu đâu ra mà đòi đu idol!', ephemeral: true });
                    }

                    data.dau = Number(data.dau) - amount;
                    await supabase.from('economy').upsert(data);

                    bets[userId][racerId] = currentBet + amount;
                    totalPool += amount;

                    await modalSubmit.reply({ content: `✅ Đã xuống xác **${amount.toLocaleString('en-US')}** Dâu cho ${racer.name}!`, ephemeral: true });
                } catch (err) {
                    // Timeout
                }
            }
        });

        // 6. HẾT GIỜ -> BẮT ĐẦU TRÌNH DIỄN GỬI TIN NHẮN MỚI
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
                return sMessage.edit({ content: '🥀 **CUỘC THI BỊ HỦY!**\nKhông có Stylist nào chịu chi Dâu ủng hộ. Các ứng viên đã lủi thủi đi về.', embeds: [], components: [disabledRow] });
            }

            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await sMessage.edit({ content: '🔒 **ĐÃ KHÓA SỔ! CÁC ỨNG VIÊN ĐANG BƯỚC LÊN SÀN DIỄN (Vui lòng xem tin nhắn mới bên dưới)!**', components: [disabledRow] });

            let raceMessage = await message.channel.send('✨ **SÀN DIỄN ĐANG ĐƯỢC CHUẨN BỊ...** ✨');

            const trackLength = 20; 
            let raceState = {};
            participatingIds.forEach(id => raceState[id] = 0);

            let historyLog = [];

            const getProgressBar = (steps) => {
                const safeSteps = Math.max(0, Math.min(steps, trackLength));
                const filled = '💖'.repeat(safeSteps);
                const empty = '🖤'.repeat(trackLength - safeSteps);
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
                    
                    // ĐÃ SỬA: Loại bỏ dấu ** vì Footer không hỗ trợ Markdown, giữ nguyên tiếng Việt và Emoji
                    let actionTextClean = action.text.replace(/\*\*/g, '');
                    historyLog.push(`${RACERS[rId].name}: ${actionTextClean} (${action.steps > 0 ? '+'+action.steps : action.steps} điểm)`);
                }

                let descriptionLines = [];
                for (const rId of participatingIds) {
                    const bar = getProgressBar(raceState[rId]);
                    descriptionLines.push(`${RACERS[rId].emoji} ${bar} ✨\n└ **${RACERS[rId].name}**\n`);
                }

                let footerContent = `Diễn biến vòng ${currentRound}\n${historyLog.join('\n')}\nTổng quỹ giải thưởng: ${totalPool.toLocaleString('en-US')} Dâu`;
                
                // Đề phòng nội dung Footer vượt 2048 ký tự gây lỗi sập bot
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
                        
                        // ĐÃ SỬA: Bọc Try Catch cho việc cộng tiền, chống sập bot cuối game
                        try {
                            let { data: winData, error } = await supabase.from('economy').select('*').eq('user_id', uid).single();
                            if (!error && winData) {
                                winData.dau = Number(winData.dau) + payout;
                                await supabase.from('economy').upsert(winData);
                            }
                        } catch (error) {
                            console.error(`Lỗi trả thưởng cho user ${uid}:`, error);
                        }
                        
                        winLog.push(`<@${uid}>: +**${payout.toLocaleString('en-US')}** Dâu`);
                    }
                }
            } else {
                winLog.push('Không ai đu đúng Idol. Ban tổ chức húp trọn!');
            }

            let finalDesc = [];
            for (const rId of participatingIds) {
                const bar = getProgressBar(raceState[rId]);
                const isWinner = rId === winningRacerId ? '👑 (NAM VƯƠNG)' : '';
                finalDesc.push(`${RACERS[rId].emoji} ${bar} ✨\n└ **${RACERS[rId].name}** ${isWinner}\n`);
            }
            finalDesc.push(`\n**💰 TỔNG KẾT PHẦN THƯỞNG:**\nNam Vương: **${winnerObj.name}**\n${winLog.join('\n')}`);

            const finalEmbed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('👑 KẾT QUẢ ĐẠI HỘI CHỒNG ĐẸP 👑')
                .setDescription(finalDesc.join('\n'))
                .setFooter({ text: `Tổng quỹ: ${totalPool.toLocaleString('en-US')} Dâu | Đã trừ 5% thuế phí` });

            await raceMessage.edit({ content: '🎉 **CUỘC THI ĐÃ KẾT THÚC!**', embeds: [finalEmbed] });
        });
    }
};