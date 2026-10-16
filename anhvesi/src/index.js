require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits, Collection, Options } = require('discord.js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL_ANHVESI;
const supabaseKey = process.env.SUPABASE_KEY_ANHVESI;
const supabase = createClient(supabaseUrl, supabaseKey);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    // Ép bot dọn rác liên tục để giải phóng RAM
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 10,  // Chỉ nhớ tối đa 10 tin nhắn
        PresenceManager: 0,  // Không lưu trạng thái online
        ThreadManager: 0,    // Không lưu cache của luồng
        GuildMemberManager: 10, // Chỉ lưu cache 10 member
    }),
});

client.commands = new Collection();
const PREFIX = 'm';

// ==========================================
// 1. ĐỌC THƯ MỤC COMMANDS
// ==========================================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
    }
}

// ==========================================
// 2. ĐỌC THƯ MỤC EVENTS
// ==========================================
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

client.once('clientReady', () => {
    console.log(`Giai điệu lấp lánh đã cất lên với tư cách ${client.user.tag}`);
});

// ==========================================
// 3. XỬ LÝ LỆNH VÀ CỘNG TINH THỂ TỪ TIN NHẮN
// ==========================================
client.on('messageCreate', async message => {
    // Chặn tin nhắn từ bot và tin nhắn riêng (DM) để tránh lỗi hệ thống
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;

    let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
    if (!userData) {
        userData = { user_id: userId, dau: 0, last_daily: 0, last_message: 0 };
    }

    let currentDau = Number(userData.dau);
    let lastMessageTime = Number(userData.last_message);

    // Cộng 500 Tinh Thể mỗi phút khi chat
    if (now - lastMessageTime >= ONE_MINUTE) {
        currentDau += 500;
        userData.dau = currentDau;
        userData.last_message = now;
        await supabase.from('economy').upsert(userData);
    }

    // ==========================================
    // MÁY QUÉT BÚP BÊ (LOGIC BỎ NHÀ RA ĐI)
    // ==========================================
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    
    // Tìm xem người này có nuôi Búp Bê nào trong server này không
    const { data: userPets } = await supabase
        .from('user_pets')
        .select('*, pets(name)')
        .eq('user_id', userId)
        .eq('guild_id', guildId);

    if (userPets && userPets.length > 0) {
        let hasRunaway = false;
        let runawayMsg = '';

        for (let pet of userPets) {
            let lastFed = Number(pet.last_fed);
            if (lastFed === 0) {
                await supabase.from('user_pets').update({ last_fed: now }).eq('id', pet.id);
                continue;
            }

            // KIỂM TRA ĐÃ QUA 3 NGÀY CHƯA?
            if (now - lastFed >= THREE_DAYS) {
                hasRunaway = true;
                
                // 1. Trừ 50k Tinh Thể
                currentDau = Math.max(0, currentDau - 50000);
                
                // 2. Xóa Búp Bê khỏi tủ đồ
                await supabase.from('user_pets').delete().eq('id', pet.id);
                
                // 3. Ghi log thông báo
                runawayMsg += `\n🥀 **SỰ CỐ THỜI TRANG!** Vì không được bảo dưỡng ròng rã suốt 3 ngày, búp bê **${pet.pets.name}** đã phai màu và rời bỏ bộ sưu tập. Trước khi đi, Búp Bê đã mang theo **50.000** <a:gemheartpalepink:1551126619546976267> lấp lánh của bạn! (Bạn có thể ghé thăm Boutique để tuyển mộ lại từ đầu).`;
            }
        }

        if (hasRunaway) {
            userData.dau = currentDau;
            await supabase.from('economy').upsert(userData);
            
            message.channel.send({ content: `<@${userId}> ${runawayMsg}` });
        }
    }
    // ==========================================

    // Chạy lệnh text (các lệnh có tiền tố m)
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const fullCommand = PREFIX + commandName; // Khai báo fullCommand để xử lý Nhiệm Vụ

    // ==========================================
    // TỰ ĐỘNG THEO DÕI VÀ TRẢ THƯỞNG YÊU CẦU CỦA NHÂN VẬT
    // ==========================================
    const { data: qPets } = await supabase.from('user_pets').select('*, pets(name)').eq('user_id', userId);
    if (qPets) {
        for (let pet of qPets) {
            // Kiểm tra xem lệnh vừa gõ có khớp với nhiệm vụ không
            if ((pet.daily_quest === commandName || pet.daily_quest === fullCommand) && !pet.quest_status) {
                
                // Random phần thưởng từ 5.000 đến tối đa 10.000
                const reward = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                
                let { data: eco } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                
                if (eco) {
                    eco.dau = Number(eco.dau) + reward;
                    await supabase.from('economy').upsert(eco);
                    await supabase.from('user_pets').update({ quest_status: true, happiness: 100 }).eq('id', pet.id);
                    
                    message.channel.send(`🎉 **Chúc mừng!** <@${userId}> vừa hoàn thành yêu cầu của **${pet.pets.name}** và được thưởng nóng **${reward.toLocaleString('en-US')}** <a:gemheartpalepink:1551126619546976267>!`);
                }
            }
        }
    }
    // ==========================================

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, null, null, supabase);
    } catch (error) {
        console.error('Sự cố khi chạy lệnh:', error);
        message.reply('Đã có sự cố thời trang xảy ra khi sải bước lệnh này!');
    }
});

client.login(process.env.DISCORD_TOKEN_ANHVESI);

// ==========================================
// MÃ CHỐNG SẬP DÂY CHUYỀN (ANTI-CRASH)
// ==========================================
process.on('unhandledRejection', (reason, p) => {
    console.log('🛑 [ANTI-CRASH Anh Vệ Sĩ] Lỗi Promise:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('🛑 [ANTI-CRASH Anh Vệ Sĩ] Lỗi hệ thống:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('🛑 [ANTI-CRASH Anh Vệ Sĩ] Lỗi ngoại lệ:', err);
});