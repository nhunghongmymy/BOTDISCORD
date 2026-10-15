const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// Lưu trạng thái người chơi để chống spam nhiều game cùng lúc
const activeGames = new Set(); 

module.exports = {
    name: 'domin',
    description: 'Chơi dò mìn lấy hệ số nhân tiền (Giống game Mines ở Casino)',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount < 1000) {
            return message.reply('Vui lòng nhập số tiền cược hợp lệ (Tối thiểu 1.000 Dâu)! VD: `mdomin 5000`');
        }

        if (activeGames.has(userId)) {
            return message.reply('Bạn đang dở dang một ván dò mìn khác rồi! Vui lòng chơi xong ván đó đã.');
        }

        // Lấy dữ liệu ví
        let { data, error } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') return message.reply(`Lỗi Database: \`${error.message}\``);
        if (!data || Number(data.dau) < betAmount) return message.reply('Bạn không có đủ Dâu để thuê bãi đào mìn này!');

        // 1. Trừ tiền cược ngay từ đầu
        data.dau = Number(data.dau) - betAmount;
        await supabase.from('economy').upsert(data);
        activeGames.add(userId);

        // 2. Khởi tạo thuật toán bãi mìn (20 ô: 16 kim cương, 4 mìn)
        let grid = Array(20).fill('safe');
        let bombsPlaced = 0;
        while (bombsPlaced < 4) {
            let rand = Math.floor(Math.random() * 20);
            if (grid[rand] !== 'bomb') {
                grid[rand] = 'bomb';
                bombsPlaced++;
            }
        }

        // Hệ số nhân (16 mốc cho 16 viên kim cương)
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
                    let emoji = '🟦'; // Ô chưa mở
                    let disabled = isGameOver || isClicked;

                    if (isClicked || revealAll) {
                        if (grid[index] === 'bomb') {
                            style = isClicked ? ButtonStyle.Danger : ButtonStyle.Secondary;
                            emoji = '💣';
                        } else {
                            style = ButtonStyle.Success;
                            emoji = '💎';
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
                    .setLabel(safeClicks > 0 ? `💰 Chốt Lời (${currentWinnings.toLocaleString()} Dâu)` : '💰 Chưa thể chốt lời')
                    .setStyle(safeClicks > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(isGameOver || safeClicks === 0)
            );
            rows.push(cashoutRow);

            return rows;
        };

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle('⛏️ Bãi Mìn Khảo Cổ')
            .setDescription(`Vốn cược: **${betAmount.toLocaleString('en-US')}** Dâu\nBãi đất có chứa **4 💣 Mìn** và **16 💎 Kim cương**.\n\nHãy cẩn thận chọn từng ô! Hệ số nhân hiện tại: **x${safeClicks > 0 ? multipliers[safeClicks - 1] : '1.0'}**`)
            .setFooter({ text: 'Rủi ro càng cao, lợi nhuận càng lớn!' });

        const gameMsg = await message.reply({ embeds: [embed], components: generateComponents() });

        // 4. Mở bộ thu thập lượt bấm nút trong 5 phút
        const collector = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            // Chống người khác bấm ké
            if (i.user.id !== userId) {
                return i.reply({ content: 'Đừng có táy máy vào khu mỏ của người khác!', ephemeral: true });
            }

            // XỬ LÝ CHỐT LỜI
            if (i.customId === 'mine_cashout') {
                isGameOver = true;
                collector.stop('cashed_out');
                
                const finalWinnings = Math.floor(betAmount * multipliers[safeClicks - 1]);
                
                // Trả tiền thưởng về ví
                data.dau = Number(data.dau) + finalWinnings;
                await supabase.from('economy').upsert(data);

                embed.setColor('#57F287')
                     .setTitle('💰 Chốt Lời Thành Công!')
                     .setDescription(`Bạn đã dừng lại đúng lúc và rút êm với **${finalWinnings.toLocaleString('en-US')}** Dâu (Hệ số **x${multipliers[safeClicks-1]}**)!\nĐã cập nhật số dư vào ví.`);
                
                await i.update({ embeds: [embed], components: generateComponents(true) });
                return;
            }

            // XỬ LÝ BẤM Ô ĐẤT
            const index = parseInt(i.customId.replace('mine_', ''));
            clicked.add(index);

            if (grid[index] === 'bomb') {
                // Đạp mìn -> Thua trắng
                isGameOver = true;
                collector.stop('boom');
                
                embed.setColor('#ED4245')
                     .setTitle('💥 BÙM! Tán Gia Bại Sản')
                     .setDescription(`Bạn đã đạp trúng mìn và mất sạch **${betAmount.toLocaleString('en-US')}** Dâu tiền cược!\nLòng tham không đáy sẽ giết chết bạn.`);
                
                await i.update({ embeds: [embed], components: generateComponents(true) });
            } else {
                // Đào trúng Kim cương -> Cập nhật hệ số
                safeClicks++;
                
                if (safeClicks === 16) {
                    // Trúng toàn bộ kim cương (Clear map - Cực kỳ hiếm)
                    isGameOver = true;
                    collector.stop('perfect');
                    
                    const finalWinnings = Math.floor(betAmount * multipliers[15]);
                    data.dau = Number(data.dau) + finalWinnings;
                    await supabase.from('economy').upsert(data);

                    embed.setColor('#FEE75C')
                         .setTitle('🏆 THẦN ĐỒNG DÒ MÌN!')
                         .setDescription(`Không thể tin được! Bạn đã tìm ra toàn bộ 16 viên Kim Cương!\nHốt trọn **${finalWinnings.toLocaleString('en-US')}** Dâu (Hệ số **x150.0**)!`);
                    
                    await i.update({ embeds: [embed], components: generateComponents(true) });
                } else {
                    // Tiếp tục chơi
                    const currentMultiplier = multipliers[safeClicks - 1];
                    const nextMultiplier = multipliers[safeClicks];
                    
                    embed.setDescription(`Vốn cược: **${betAmount.toLocaleString('en-US')}** Dâu\nĐã tìm thấy: **${safeClicks}** 💎\n\nHệ số hiện tại: **x${currentMultiplier}**\nNếu mở trúng kim cương ô tiếp theo: **x${nextMultiplier}**\n*Chú ý: Bạn có thể ấn nút Chốt Lời màu xanh bên dưới để dừng lại ôm tiền về.*`);
                    
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
                        embed.setColor('#FEE75C')
                             .setTitle('⏰ Hết Giờ - Tự Động Chốt Lời')
                             .setDescription(`Bạn ngâm quá lâu! Hệ thống đã tự động chốt lời bảo toàn **${finalWinnings.toLocaleString('en-US')}** Dâu cho bạn.`);
                        gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                    });
                } else if (!isGameOver) {
                    // Chưa bấm được ô nào mà treo máy thì auto mất tiền cược
                    embed.setColor('#ED4245').setTitle('⏰ Bỏ Cuộc').setDescription('Bạn đã rời bỏ khu mỏ mà không đào viên nào. Đã bị tịch thu tiền cược.');
                    gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                }
            }
        });
    }
};