require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL_CHUVUADAU;
const supabaseKey = process.env.SUPABASE_KEY_CHUVUADAU;
const supabase = createClient(supabaseUrl, supabaseKey);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ]
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
// 2. ĐỌC THƯ MỤC EVENTS (Phần Fix Lỗi Menu)
// Hệ thống sẽ tự động tìm các file như shopInteraction.js để chạy
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
    console.log(`Logged in as ${client.user.tag}`);
});

// ==========================================
// 3. XỬ LÝ LỆNH VÀ CỘNG DÂU TỪ TIN NHẮN
// ==========================================
client.on('messageCreate', async message => {
    // Chặn tin nhắn từ bot và tin nhắn riêng (DM) để tránh lỗi hệ thống
    if (message.author.bot || !message.guild) return; 

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;

    // ĐÃ SỬA: Bỏ .eq('guild_id', guildId) đi vì ví tiền là Global
    let { data: userData } = await supabase.from('economy').select('*').eq('user_id', userId).single();
    if (!userData) {
        userData = { user_id: userId, dau: 0, last_daily: 0, last_message: 0, kimbai_expire_time: 0, last_kimbai_buy: 0 };
    }

    let currentDau = Number(userData.dau);
    let lastMessageTime = Number(userData.last_message);

    // Cộng 500 Dâu mỗi phút khi chat
    if (now - lastMessageTime >= ONE_MINUTE) {
        currentDau += 500;
        userData.dau = currentDau;
        userData.last_message = now;
        await supabase.from('economy').upsert(userData);
    }

    // ==========================================
    // MÁY QUÉT THÚ CƯNG (LOGIC BỎ NHÀ RA ĐI)
    // ==========================================
    // 3 ngày = 3 * 24 * 60 * 60 * 1000 = 259,200,000 ms
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    
    // Tìm xem người này có nuôi Char nào trong server này không
    const { data: userPets } = await supabase
        .from('user_pets')
        .select('*, pets(name)')
        .eq('user_id', userId)
        .eq('guild_id', guildId);

    if (userPets && userPets.length > 0) {
        let hasRunaway = false;
        let runawayMsg = '';

        for (let pet of userPets) {
            // Nếu last_fed = 0 tức là mới mua chưa cho ăn lần nào, thì lấy mốc là lúc mua (hiện tại)
            let lastFed = Number(pet.last_fed);
            if (lastFed === 0) {
                // Cập nhật lại cho công bằng
                await supabase.from('user_pets').update({ last_fed: now }).eq('id', pet.id);
                continue; 
            }

            // KIỂM TRA ĐÃ QUA 3 NGÀY CHƯA?
            if (now - lastFed >= THREE_DAYS) {
                hasRunaway = true;
                
                // 1. Trừ 50k Dâu
                currentDau = Math.max(0, currentDau - 50000); 
                
                // 2. Xóa Char khỏi chuồng
                await supabase.from('user_pets').delete().eq('id', pet.id);
                
                // 3. Ghi log thông báo
                runawayMsg += `\n🚨 **TIN BUỒN!** Vì bị bỏ đói ròng rã suốt 3 ngày, bé Char **${pet.pets.name}** đã thu dọn hành lý rời đi. Trước khi đi, bé đã cạy két sắt của bạn và cuỗm mất **50.000 Dâu** làm vốn tự lập! (Bạn có thể ra Shop để rước lại em ấy từ đầu).`;
            }
        }

        if (hasRunaway) {
            // Cập nhật lại ví tiền sau khi bị mất trộm
            userData.dau = currentDau;
            await supabase.from('economy').upsert(userData);
            
            // Thông báo ngay trên kênh chat
            message.channel.send({ content: `<@${userId}> ${runawayMsg}` });
        }
    }
    // ==========================================

// Chạy lệnh text (các lệnh có tiền tố m)
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, null, null, supabase);

        // ==========================================
        // TỰ ĐỘNG THEO DÕI VÀ TRẢ THƯỞNG NHIỆM VỤ PET
        // ==========================================
        const { data: qPets } = await supabase.from('user_pets').select('*, pets(name)').eq('user_id', userId).eq('guild_id', guildId);
        if (qPets) {
            for (let pet of qPets) {
                // Nếu lệnh user vừa gõ trùng với Quest và Quest chưa làm
                if (pet.daily_quest === (PREFIX + commandName) && !pet.quest_status) {
                    const reward = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
                    let { data: eco } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                    if (eco) {
                        eco.dau = Number(eco.dau) + reward;
                        await supabase.from('economy').upsert(eco);
                        await supabase.from('user_pets').update({ quest_status: true, happiness: 100 }).eq('id', pet.id);
                        
                        message.channel.send(`🎉 **Chúc mừng!** <@${userId}> vừa thực hiện xong lệnh \`${commandName}\`, hoàn thành nhiệm vụ của bé **${pet.pets.name}** và được thưởng nóng **${reward.toLocaleString('en-US')} Dâu**!`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Lỗi khi chạy lệnh:', error);
        message.reply('Đã có lỗi xảy ra khi thực thi lệnh này!');
    }
});

client.login(process.env.DISCORD_TOKEN_CHUVUADAU);