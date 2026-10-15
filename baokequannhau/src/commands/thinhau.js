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

// --- 30 KỊCH BẢN ĐẠI HỘI THẦN TỬU (CONCEPT QUÁN NHẬU / ĐUA BIA) ---
const buffActions = [
    { text: "Nốc cạn 100% ly bia không chớp mắt 🍻", steps: 5 },
    { text: "Hô to '1..2..3.. Dô' làm cả quán chú ý 🗣️", steps: 4 },
    { text: "Múa quạt điêu luyện trên bàn nhậu 🪭", steps: 4 },
    { text: "Khuấy đảo sân khấu bằng bài 'Đắp Mộ Cuộc Tình' 🎤", steps: 3 },
    { text: "Khui bia bằng đũa điệu nghệ như nghệ sĩ 🥢", steps: 3 },
    { text: "Cụng ly lốp cốp, giao lưu thành công với bàn bên 🥂", steps: 3 },
    { text: "Bao trọn tiền mâm mồi hải sản cho anh em 🦞", steps: 2 },
    { text: "Uống bia bằng bát xịn xò 🥣", steps: 2 },
    { text: "Biểu diễn tung hứng vỏ chai bia cực nghệ 🍾", steps: 2 },
    { text: "Rót bia không bọt chuẩn dân chuyên 🍺", steps: 1 }
];

const debuffActions = [
    { text: "Chạy vội vào NVS nôn thốc nôn tháo 🤢", steps: -2 },
    { text: "Gục ngã tại chỗ, ngủ ngáy o o 😴", steps: -2 },
    { text: "Say quá nói nhảm, chửi lộn với cái cột nhà 🤬", steps: -1 },
    { text: "Bị gấu gọi về gấp báo hại anh em mất hứng 🐻", steps: -1 },
    { text: "Đang uống thì hắt xì văng bia tung tóe 🤧", steps: -1 },
    { text: "Chưa uống đã đỏ mặt sượng trân 🍅", steps: -1 },
    { text: "Trượt tay làm đổ ly bia ra quần 💦", steps: -1 },
    { text: "Say xỉn bốc nhầm ly trà đá tưởng là bia 🍵", steps: -1 },
    { text: "Nhậu xỉn gọi điện khóc lóc với người yêu cũ 📱", steps: -1 },
    { text: "Lỡ ăn trúng miếng ớt cay xé lưỡi 🔥", steps: 0 }
];

const neutralActions = [
    { text: "Từ tốn nhấp môi nhẹ nhàng giữ sức 👄", steps: 0 },
    { text: "Gắp miếng đậu phộng luộc nhai nhóp nhép 🥜", steps: 0 },
    { text: "Xin phép ra ngoài hút điếu thuốc 🚬", steps: 0 },
    { text: "Gắp cục nước đá bỏ vô ly cho mát 🧊", steps: 0 },
    { text: "Cười hì hì nhìn mọi người quậy 😆", steps: 0 },
    { text: "Mở điện thoại lướt tóp tóp chờ tiêu mồi 📱", steps: 0 },
    { text: "Đưa tay vuốt tóc cho bớt nóng 🥵", steps: 0 },
    { text: "Phẩy tay nhường anh em uống trước ✋", steps: 0 },
    { text: "Châm thêm xíu bia cho đỡ vơi 🍺", steps: 0 },
    { text: "Nhai mực nướng sái cả quai hàm 🦑", steps: 0 }
];

const allActions = [...buffActions, ...debuffActions, ...neutralActions];

// Random các Emoji chuẩn quán nhậu cho các Chiến Hữu
const EMOJI_LIST = ['🍻', '🍾', '🥃', '🍷', '🍺', '🥩', '🦑', '🦞', '🥜', '🍗', '🧊', '🚬'];

module.exports = {
    name: 'thinhau', // Đổi tên từ 'hoi' thành 'thinhau'
    description: 'Mở sới cá cược Đại Hội Thần Tửu xem ai là người uống sung nhất',
    async execute(message, args, db, userData, supabase) {
        // 1. KIỂM TRA QUYỀN
        const hasPerm = await isAuthorized(message.member, supabase);
        if (!hasPerm) return message.reply('❌ Bạn chưa đủ số má để xin phép cô chủ mở sới cá cược ở quán đâu nha!');

        // 2. KÉO DANH SÁCH "BẠN NHẬU" TỪ DATABASE
        const { data: petsData } = await supabase.from('pets').select('*').eq('guild_id', message.guild.id);
        if (!petsData || petsData.length === 0) {
            return message.reply('❌ Sới nhậu đang vắng tanh! Chưa có chiến hữu nào được thêm vào danh sách, cô chủ vui lòng dùng lệnh `mshop` để gọi bạn nhậu ra trước nhé!');
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
                .setDescription('Bơm Nắp Bia bắt kèo ngay!')
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_racer')
            .setPlaceholder('🍻 Chọn Chiến Hữu để bơm bia 🍻')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const openEmbed = new EmbedBuilder()
            .setColor('#FF8C00') // Màu cam/vàng của bia
            .setTitle('🏆 ĐẠI HỘI THẦN TỬU BA MIỀN 🏆')
            .setDescription(`**Sới cược sẽ khóa sổ trong vòng ${minutes} phút.**\n\n📌 **Luật chơi của quán:**\nChọn Chiến Hữu ở menu bên dưới để bơm Nắp Bia tài trợ **(Có thể bắt kèo nhiều người cùng lúc)**.\n\nTối đa **1.000.000 Nắp Bia** / 1 tay chơi.\n\nTiền sẽ bị trừ ngay. Nếu chiến hữu của bạn quẩy sung nhất (uống tới đích đầu tiên), bạn sẽ được chia tổng mâm cược (Cô chủ thu 5% tiền dọn dẹp vệ sinh).`)
            .setTimestamp();

        const sMessage = await message.channel.send({ embeds: [openEmbed], components: [row] });

        // 5. LẮNG NGHE SỰ KIỆN CHỌN
        const collector = sMessage.createMessageComponentCollector({ time: bettingTimeMs });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'select_racer') {
                if (isRaceStarted) {
                    return interaction.reply({ content: '❌ Cổng bắt kèo đã đóng, các chiến hữu đang bắt đầu cụng ly rồi!', ephemeral: true });
                }

                const racerId = interaction.values[0];
                const racer = RACERS[racerId];

                const modal = new ModalBuilder()
                    .setCustomId(`modal_cuoc_${racerId}_${interaction.id}`)
                    .setTitle(`Bơm bia cho ${racer.name}`);

                const moneyInput = new TextInputBuilder()
                    .setCustomId('cuoc_amount')
                    .setLabel('Số Nắp Bia tài trợ (Tối đa 1M):')
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
                        return modalSubmit.reply({ content: '❌ Chậm tay rồi! Quán đã lên nhạc nên phiếu tài trợ này không được tính nha.', ephemeral: true });
                    }

                    const amountStr = modalSubmit.fields.getTextInputValue('cuoc_amount').replace(/,/g, '');
                    const amount = parseInt(amountStr);

                    if (isNaN(amount) || amount <= 0) {
                        return modalSubmit.reply({ content: '❌ Số Nắp Bia không hợp lệ!', ephemeral: true });
                    }

                    const userId = interaction.user.id;
                    if (!bets[userId]) bets[userId] = {};
                    const currentBet = bets[userId][racerId] || 0;

                    if (currentBet + amount > 1000000) {
                        return modalSubmit.reply({ content: `❌ Bạn chỉ được tài trợ tối đa 1.000.000 Nắp Bia cho ${racer.name}! (Hiện đã rót: **${currentBet.toLocaleString('en-US')}**)`, ephemeral: true });
                    }

                    let { data, error: selectError } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                    if (!data || Number(data.dau) < amount) {
                        return modalSubmit.reply({ content: '❌ Cháy túi rồi bạn hiền ơi, lấy Nắp Bia đâu ra mà đòi làm đại gia cá cược!', ephemeral: true });
                    }

                    data.dau = Number(data.dau) - amount;
                    await supabase.from('economy').upsert(data);

                    bets[userId][racerId] = currentBet + amount;
                    totalPool += amount;

                    await modalSubmit.reply({ content: `✅ Đã rót **${amount.toLocaleString('en-US')}** Nắp Bia để cổ vũ cho ${racer.name} quẩy tới bến!`, ephemeral: true });
                } catch (err) {
                    // Timeout
                }
            }
        });

        // 6. HẾT GIỜ -> BẮT ĐẦU THI NHẬU (TẠO TIN NHẮN MỚI)
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
                return sMessage.edit({ content: '🥀 **SỚI NHẬU BỊ HỦY!**\nKhông có dân chơi nào chịu chi Nắp Bia bắt kèo. Các chiến hữu chán nản ra về hết rồi.', embeds: [], components: [disabledRow] });
            }

            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await sMessage.edit({ content: '🔒 **SỚI CƯỢC ĐÃ KHÓA SỔ! CHUẨN BỊ LÊN BIA (Vui lòng theo dõi ở tin nhắn mới bên dưới)!**', components: [disabledRow] });

            let raceMessage = await message.channel.send('🍻 **CÁC CHIẾN HỮU ĐANG BẮT ĐẦU NÂNG LY... 1.. 2.. 3.. DÔ!** 🍻');

            const trackLength = 20; 
            let raceState = {};
            participatingIds.forEach(id => raceState[id] = 0);

            let historyLog = [];

            // Giao diện thanh tiến trình Đua Bia
            const getProgressBar = (steps) => {
                const safeSteps = Math.max(0, Math.min(steps, trackLength));
                const filled = '🍺'.repeat(safeSteps);
                const empty = '〰️'.repeat(trackLength - safeSteps);
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
                    descriptionLines.push(`${RACERS[rId].emoji} ${bar} 🏆\n└ **${RACERS[rId].name}**\n`);
                }

                let footerContent = `Diễn biến vòng ${currentRound}\n${historyLog.join('\n')}\nTổng mâm cược: ${totalPool.toLocaleString('en-US')} Nắp Bia`;
                
                if (footerContent.length > 2000) {
                    footerContent = footerContent.substring(0, 1995) + '...';
                }

                const raceEmbed = new EmbedBuilder()
                    .setColor('#FF8C00')
                    .setTitle('🔥 BÀN NHẬU ĐANG NÓNG DẦN LÊN... 🔥')
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
                        
                        winLog.push(`<@${uid}>: +**${payout.toLocaleString('en-US')}** Nắp Bia`);
                    }
                }
            } else {
                winLog.push('Không ai bắt trúng Thần Tửu. Cô chủ Me An húp trọn mâm cược này nha!');
            }

            let finalDesc = [];
            for (const rId of participatingIds) {
                const bar = getProgressBar(raceState[rId]);
                const isWinner = rId === winningRacerId ? '👑 (THẦN TỬU)' : '';
                finalDesc.push(`${RACERS[rId].emoji} ${bar} 🏆\n└ **${RACERS[rId].name}** ${isWinner}\n`);
            }
            finalDesc.push(`\n**💰 TỔNG KẾT MÂM CƯỢC:**\nThánh Nhậu Đêm Nay: **${winnerObj.name}**\n${winLog.join('\n')}`);

            const finalEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Màu đỏ ăn mừng
                .setTitle('👑 KẾT QUẢ ĐẠI HỘI THẦN TỬU 👑')
                .setDescription(finalDesc.join('\n'))
                .setFooter({ text: `Tổng quỹ chia thưởng: ${totalPool.toLocaleString('en-US')} Nắp Bia | Đã trừ 5% phí dọn dẹp quán` });

            await raceMessage.edit({ content: '🎉 **ĐÃ TÌM RA NGƯỜI QUẨY SUNG NHẤT! MAU MAU ĐƯA THẦN TỬU VỀ NHÀ NÀO!** <:np:1557713580831547462>', embeds: [finalEmbed] });
        });
    }
};