const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// Lưu trạng thái người chơi để chống spam nhiều game cùng lúc
const activeGames = new Set();

module.exports = {
    name: 'latnap', // Đổi tên từ thamdo thành latnap
    description: 'Chơi lật thùng phế liệu dò mìn, né gián để x2, x3 Nắp Bia',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount < 1000) {
            return message.reply('Vui lòng nhập số Nắp Bia muốn cược (Tối thiểu 1.000)! VD: `mlatnap 5000`');
        }

        if (activeGames.has(userId)) {
            return message.reply('Khách VIP đang dở tay mò thùng ở mâm khác rồi! Vui lòng chơi xong bên đó đã nha.');
        }

        // Lấy dữ liệu ví
        let { data, error } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') return message.reply(`Hệ thống thu ngân bị lỗi: \`${error.message}\``);
        if (!data || Number(data.dau) < betAmount) return message.reply('Cháy túi rồi bạn hiền ơi, lấy đâu ra Nắp Bia mà đòi mở sới cá cược!');

        // 1. Trừ tiền cược ngay từ đầu
        data.dau = Number(data.dau) - betAmount;
        await supabase.from('economy').upsert(data);
        activeGames.add(userId);

        // 2. Khởi tạo thuật toán bãi mìn (20 ô: 16 bia xịn, 4 gián)
        let grid = Array(20).fill('safe');
        let bombsPlaced = 0;
        while (bombsPlaced < 4) {
            let rand = Math.floor(Math.random() * 20);
            if (grid[rand] !== 'bomb') {
                grid[rand] = 'bomb';
                bombsPlaced++;
            }
        }

        // Hệ số nhân (16 mốc cho 16 chai bia)
        const multipliers = [1.2, 1.5, 1.9, 2.4, 3.0, 3.8, 4.8, 6.2, 8.1, 10.8, 14.8, 21.0, 31.5, 50.0, 85.0, 150.0];
        
        let clicked = new Set();
        let safeClicks = 0;
        let isGameOver = false;

        // 3. Hàm tạo giao diện lưới nút bấm (4 hàng x 5 cột = 20 ô) + 1 hàng cho nút Chốt Lời
        const generateComponents = (revealAll = false) => {
            const rows = [];
            for (let i = 0; i < 4; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 5; j++) {
                    const index = i * 5 + j;
                    const isClicked = clicked.has(index);
                    
                    let style = ButtonStyle.Secondary;
                    let emoji = '📦'; // Thùng chưa mở
                    let disabled = isGameOver || isClicked;

                    if (isClicked || revealAll) {
                        if (grid[index] === 'bomb') {
                            style = isClicked ? ButtonStyle.Danger : ButtonStyle.Secondary;
                            emoji = '🪳'; // Tiểu cường (Mìn)
                        } else {
                            style = ButtonStyle.Success;
                            emoji = '🍺'; // Bia xịn (An toàn)
                            // Nếu thua mà hệ thống lật bài hộ, thì hiện mờ mờ ô an toàn
                            if (!isClicked && revealAll) style = ButtonStyle.Secondary;
                        }
                    }

                    row.addComponents(
                        new ButtonBuilder().setCustomId(`mine_${index}`).setEmoji(emoji).setStyle(style).setDisabled(disabled)
                    );
                }
                rows.push(row);
            }

            // Dòng chứa nút "Chốt Lời"
            let currentWinnings = Math.floor(betAmount * (safeClicks > 0 ? multipliers[safeClicks - 1] : 0));
            const cashoutRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('mine_cashout')
                    .setLabel(safeClicks > 0 ? `🏃 Chốt Kèo Chuồn (${currentWinnings.toLocaleString()} Nắp Bia)` : '🏃 Chưa thể chuồn')
                    .setStyle(safeClicks > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(isGameOver || safeClicks === 0)
            );
            rows.push(cashoutRow);

            return rows;
        };

        const embed = new EmbedBuilder()
            .setColor('#FF8C00') // Cam/vàng bia
            .setTitle('📦 Lật Thùng Dò Mìn')
            .setDescription(`Mức cọc: **${betAmount.toLocaleString('en-US')}** Nắp Bia\nTrong đống thùng phế liệu này có ẩn chứa **4 con 🪳 Tiểu Cường (Gián)** và **16 🍺 Chai Bia Xịn**.\n\nHãy cẩn thận khi thò tay vào! Hệ số lời hiện tại: **x${safeClicks > 0 ? multipliers[safeClicks - 1] : '1.0'}**`)
            .setFooter({ text: 'Rủi ro càng cao, Nắp Bia thu về càng nhiều!' });

        const gameMsg = await message.reply({ embeds: [embed], components: generateComponents() });

        // 4. Mở bộ thu thập lượt bấm nút trong 5 phút
        const collector = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            // Chống người khác bấm ké
            if (i.user.id !== userId) {
                return i.reply({ content: 'Ê, tiền của ai nấy chơi, đừng thò tay vào mâm của khách khác!', ephemeral: true });
            }

            // XỬ LÝ CHỐT LỜI
            if (i.customId === 'mine_cashout') {
                isGameOver = true;
                collector.stop('cashed_out');
                
                const finalWinnings = Math.floor(betAmount * multipliers[safeClicks - 1]);
                
                // Trả tiền thưởng về ví
                data.dau = Number(data.dau) + finalWinnings;
                await supabase.from('economy').upsert(data);

                embed.setColor('#00FF00') // Xanh lá cây ăn mừng
                     .setTitle('🍻 Chốt Kèo Rút Lui An Toàn!')
                     .setDescription(`Khách VIP rất biết điểm dừng! Bạn đã gom gọn **${finalWinnings.toLocaleString('en-US')}** <:np:1557713580831547462> (Hệ số **x${multipliers[safeClicks - 1]}**) mang về bàn.\nQuản lý đã nạp tiền vào quỹ nhậu cho bạn.`);
                
                await i.update({ embeds: [embed], components: generateComponents(true) });
                return;
            }

            // XỬ LÝ BẤM Ô
            const index = parseInt(i.customId.replace('mine_', ''));
            clicked.add(index);

            if (grid[index] === 'bomb') {
                // Đạp mìn -> Thua trắng
                isGameOver = true;
                collector.stop('boom');
                
                embed.setColor('#FF0000') // Đỏ báo động
                     .setTitle('🪳 Á Á Á! BỐC TRÚNG GIÁN!')
                     .setDescription(`Thò tay lật thùng bốc ngay con tiểu cường biết bay, bạn giật mình đá lật bàn, đền đứt **${betAmount.toLocaleString('en-US')}** Nắp Bia cho quán!\nTrò này nhân phẩm kém là toang.`);
                
                await i.update({ embeds: [embed], components: generateComponents(true) });
            } else {
                // Đào trúng Bia -> Cập nhật hệ số
                safeClicks++;
                
                if (safeClicks === 16) {
                    // Trúng toàn bộ kim cương (Clear map - Cực kỳ hiếm)
                    isGameOver = true;
                    collector.stop('perfect');
                    
                    const finalWinnings = Math.floor(betAmount * multipliers[15]);
                    data.dau = Number(data.dau) + finalWinnings;
                    await supabase.from('economy').upsert(data);

                    embed.setColor('#FFD700') // Vàng óng kim loại (Gold)
                         .setTitle('👑 THẦN BÀI QUÁN NHẬU!')
                         .setDescription(`Hảo hán phương nào đây! Bạn đã mò ra toàn bộ 16 chai bia xịn mà không dính một con gián nào!\nHúp trọn **${finalWinnings.toLocaleString('en-US')}** <:np:1557713580831547462> (Hệ số **x150.0**)! Cả quán đang đứng dậy vỗ tay cho bạn!`);
                    
                    await i.update({ embeds: [embed], components: generateComponents(true) });
                } else {
                    // Tiếp tục chơi
                    const currentMultiplier = multipliers[safeClicks - 1];
                    const nextMultiplier = multipliers[safeClicks];
                    
                    embed.setDescription(`Mức cọc: **${betAmount.toLocaleString('en-US')}** Nắp Bia\nĐã mò được: **${safeClicks}** 🍺\n\nHệ số hiện tại: **x${currentMultiplier}**\nNếu lật trúng bia tiếp: **x${nextMultiplier}**\n*Chú ý: Bạn có thể ấn nút Chốt Kèo Chuồn màu xanh bên dưới để ôm tiền về bàn an toàn.*`);
                    
                    await i.update({ embeds: [embed], components: generateComponents(false) });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            activeGames.delete(userId);
            if (reason === 'time') {
                // Quá 5 phút không chơi tiếp -> Auto chốt lời giúp nếu đang có lãi
                if (!isGameOver && safeClicks > 0) {
                    const finalWinnings = Math.floor(betAmount * multipliers[safeClicks - 1]);
                    data.dau = Number(data.dau) + finalWinnings;
                    supabase.from('economy').upsert(data).then(() => {
                        embed.setColor('#00FF00')
                             .setTitle('⏰ Hết Giờ - Say Gục Tại Bàn')
                             .setDescription(`Bạn thò tay vào thùng lâu quá ngủ gục luôn! Bảo Kê đã lôi bạn về ghế, chốt lời bảo toàn **${finalWinnings.toLocaleString('en-US')}** Nắp Bia giúp bạn.`);
                        gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                    });
                } else if (!isGameOver) {
                    // Chưa bấm được ô nào mà treo máy thì auto mất tiền cược
                    embed.setColor('#FFB6C1').setTitle('⏰ Ngủ Quên Ở Quán').setDescription('Vừa bày sới ra chưa lật được nắp nào bạn đã say bí tỉ lăn ra ngủ. Quản lý tịch thu tiền cọc coi như phí dọn dẹp!');
                    gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                }
            }
        });
    }
};