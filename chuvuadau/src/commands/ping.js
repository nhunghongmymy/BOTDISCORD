module.exports = {
    name: 'ping',
    description: 'Kiểm tra độ trễ',
    async execute(message, args, db, userData) {
        await message.reply('Pong!');
    },
};