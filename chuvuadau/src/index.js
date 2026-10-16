require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits, Collection, Options } = require('discord.js');
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