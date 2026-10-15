const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// Lưu trạng thái người chơi để chống spam nhiều game cùng lúc
const activeGames = new Set();

module.exports = {
    name: 'thamdo',
    description: 'Sải bước trên thảm đỏ, né tránh sự cố thời trang để nhân đôi Tinh Thể lấp lánh',
    async execute(message, args, db, userData, supabase) {
        const userId = message.author.id;
        const betAmount = parseInt(args[0]);

        if (!betAmount || isNaN(betAmount) || betAmount < 1000) {
            return message.reply('Vui lòng nhập số Tinh Thể hợp lệ để thuê thảm đỏ (Tối thiểu 1.000)! VD: `mthamdo 5000`');
        }

        if (activeGames.has(userId)) {
            return message.reply('Stylist đang sải bước trên một sàn diễn khác rồi! Vui lòng hoàn thành màn trình diễn đó đã.');
        }

        // Lấy dữ liệu ví
        let { data, error } = await supabase.from('economy').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') return message.reply(`Giai điệu bị lỗi: \`${error.message}\``);
        if (!data || Number(data.dau) < betAmount) return message.reply('Bạn không có đủ Tinh Thể để tham gia show diễn thời trang này!');

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
                    let emoji = '🪞'; // Ô chưa mở
                    let disabled = isGameOver || isClicked;

                    if (isClicked || revealAll) {
                        if (grid[index] === 'bomb') {
                            style = isClicked ? ButtonStyle.Danger : ButtonStyle.Secondary;
                            emoji = '🥀'; // Sự cố thời trang
                        } else {
                            style = ButtonStyle.Success;
                            emoji = '✨'; // Tỏa sáng
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
                    .setLabel(safeClicks > 0 ? `🎀 Rời Sàn Diễn (${currentWinnings.toLocaleString()} Tinh Thể)` : '🎀 Chưa thể rời đi')
                    .setStyle(safeClicks > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(isGameOver || safeClicks === 0)
            );
            rows.push(cashoutRow);

            return rows;
        };

        const embed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle('🩰 Sàn Diễn Thảm Đỏ')
            // ĐÃ SỬA: Lỗi xuống dòng bị gãy ở phần hệ số nhân
            .setDescription(`Chi phí đầu tư: **${betAmount.toLocaleString('en-US')}** Tinh Thể\nSàn diễn có ẩn chứa **4 🥀 Sự cố thời trang** và **16 ✨ Khoảnh khắc tỏa sáng**.\n\nHãy cẩn thận từng bước đi kiêu kỳ! Hệ số nhân thần thái hiện tại: **x${safeClicks > 0 ? multipliers[safeClicks - 1] : '1.0'}**`)
            .setFooter({ text: 'Rủi ro càng cao, ánh hào quang càng rực rỡ!' });

        const gameMsg = await message.reply({ embeds: [embed], components: generateComponents() });

        // 4. Mở bộ thu thập lượt bấm nút trong 5 phút
        const collector = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            // Chống người khác bấm ké
            if (i.user.id !== userId) {
                return i.reply({ content: 'Đừng bước tranh thảm đỏ của Nhà Sưu Tầm khác!', ephemeral: true });
            }

            // XỬ LÝ CHỐT LỜI
            if (i.customId === 'mine_cashout') {
                isGameOver = true;
                collector.stop('cashed_out');
                
                const finalWinnings = Math.floor(betAmount * multipliers[safeClicks - 1]);
                
                // Trả tiền thưởng về ví
                data.dau = Number(data.dau) + finalWinnings;
                await supabase.from('economy').upsert(data);

                embed.setColor('#FF69B4')
                     .setTitle('🎀 Màn Trình Diễn Hoàn Hảo!')
                     // ĐÃ SỬA: Thêm ${}, sửa lỗi khoảng trắng và dính chữ phần Hệ số
                     .setDescription(`Bạn đã cúi chào khán giả đúng lúc và mang về **${finalWinnings.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267> (Hệ số **x${multipliers[safeClicks - 1]}**)!\nTinh Thể đã được cất vào hộp nhạc.`);
                
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
                
                embed.setColor('#FFB6C1')
                     .setTitle('🥀 SỰ CỐ! Gãy Gót Giày')
                     .setDescription(`Bạn đã vấp ngã trên thảm đỏ, chiếc Váy Pha Lê bị vướng và mất sạch **${betAmount.toLocaleString('en-US')}** Tinh Thể!\nGiới thời trang thật khắc nghiệt.`);
                
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

                    embed.setColor('#FF69B4')
                         .setTitle('👑 VEDETTE CỦA ĐÊM DIỄN!')
                         .setDescription(`Thật khó tin! Bạn đã sải bước qua toàn bộ 16 khoảnh khắc hoàn hảo!\nThu về **${finalWinnings.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267> (Hệ số **x150.0**)! Khán giả đang hò reo tên bạn!`);
                    
                    await i.update({ embeds: [embed], components: generateComponents(true) });
                } else {
                    // Tiếp tục chơi
                    const currentMultiplier = multipliers[safeClicks - 1];
                    const nextMultiplier = multipliers[safeClicks];
                    
                    embed.setDescription(`Chi phí đầu tư: **${betAmount.toLocaleString('en-US')}** Tinh Thể\nĐã thu thập: **${safeClicks}** ✨\n\nHệ số hiện tại: **x${currentMultiplier}**\nNếu bước tiếp hoàn hảo: **x${nextMultiplier}**\n*Chú ý: Bạn có thể ấn nút Rời Sàn Diễn màu xanh bên dưới để giữ lại ánh hào quang hiện tại.*`);
                    
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
                        embed.setColor('#FF69B4')
                             .setTitle('⏰ Hết Giờ - Tự Động Rút Lui')
                             .setDescription(`Bạn tạo dáng quá lâu! Quản lý đã kéo bạn vào cánh gà, bảo toàn **${finalWinnings.toLocaleString('en-US')}** Tinh Thể cho bạn.`);
                        gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                    });
                } else if (!isGameOver) {
                    // Chưa bấm được ô nào mà treo máy thì auto mất tiền cược
                    embed.setColor('#FFB6C1').setTitle('⏰ Bỏ Cuộc').setDescription('Bạn đã rời bỏ thảm đỏ mà không bước một nhịp nào. Chi phí đầu tư coi như mất trắng.');
                    gameMsg.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                }
            }
        });
    }
};