require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL_BAOKEQUANNHAU;
const supabaseKey = process.env.SUPABASE_KEY_BAOKEQUANNHAU;
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
    console.log(`Bảo Kê đã vào việc với tư cách ${client.user.tag}`);
});

// ==========================================
// 3. XỬ LÝ LỆNH VÀ CỘNG NẮP BIA TỪ TIN NHẮN
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

    // Cộng 500 Nắp Bia mỗi phút khi chat rôm rả trong quán
    if (now - lastMessageTime >= ONE_MINUTE) {
        currentDau += 500;
        userData.dau = currentDau;
        userData.last_message = now;
        await supabase.from('economy').upsert(userData);
    }

    // ==========================================
    // QUẢN LÝ ĐÀN EM (LOGIC BỎ BÀN NHẬU RA ĐI)
    // ==========================================
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    
    // Tìm xem người này có thu nạp Đàn em nào trong quán này không
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

            // KIỂM TRA ĐÃ QUA 3 NGÀY CHƯA RỦ NHẬU CHƯA?
            if (now - lastFed >= THREE_DAYS) {
                hasRunaway = true;
                
                // 1. Trừ 50k Nắp Bia
                currentDau = Math.max(0, currentDau - 50000);
                
                // 2. Xóa Đàn em khỏi bàn nhậu
                await supabase.from('user_pets').delete().eq('id', pet.id);
                
                // 3. Ghi log thông báo
                runawayMsg += `\n🍺 **TOANG RỒI ĐẠI CA!** Vì không được rủ rê nhậu nhẹt ròng rã suốt 3 ngày, đàn em **${pet.pets.name}** đã dỗi và rời khỏi bàn. Trước khi xách mông đi, nó còn tiện tay cuỗm luôn **50.000** <:np:1557713580831547462> của anh lớn! (Hãy tương tác để thu nạp đàn em mới nhé).`;
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
    // TỰ ĐỘNG THEO DÕI VÀ TRẢ THƯỞNG YÊU CẦU CỦA ĐÀN EM
    // ==========================================
    const { data: qPets } = await supabase.from('user_pets').select('*, pets(name)').eq('user_id', userId);
    if (qPets) {
        for (let pet of qPets) {
            // Kiểm tra xem lệnh vừa gõ có khớp với nhiệm vụ (yêu cầu) của đàn em không
            if ((pet.daily_quest === commandName || pet.daily_quest === fullCommand) && !pet.quest_status) {
                
                // Random phần thưởng từ 5.000 đến tối đa 10.000 Nắp bia
                const reward = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
                
                let { data: eco } = await supabase.from('economy').select('*').eq('user_id', userId).single();
                
                if (eco) {
                    eco.dau = Number(eco.dau) + reward;
                    await supabase.from('economy').upsert(eco);
                    await supabase.from('user_pets').update({ quest_status: true, happiness: 100 }).eq('id', pet.id);
                    
                    message.channel.send(`🍻 **Vô! 1.. 2.. 3.. Dô!** <@${userId}> vừa chiều ý người anh em **${pet.pets.name}** tới bến và được giang hồ quyên góp nóng **${reward.toLocaleString('en-US')}** <:np:1557713580831547462>!`);
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
        message.reply('Á đù! Có lỗi xảy ra, hình như bọn giang hồ thôn nào đang quậy phá hệ thống lệnh này!');
    }
});

client.login(process.env.DISCORD_TOKEN_BAOKEQUANNHAU);