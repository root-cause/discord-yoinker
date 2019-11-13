const { Client, Util } = require("discord.js");
const bot = new Client({ disableEveryone: true });

bot.once("ready", () => {
    console.info("Bot ready.");
});

bot.on("message", async (message) => {
    if (message.author.bot || message.channel.type !== "text" || !message.mentions.users.has(bot.user.id)) {
        return;
    }

    const authorMember = await message.guild.fetchMember(message.author).catch(e => null); // can't trust message.member
    if (!authorMember || !authorMember.hasPermission("MANAGE_EMOJIS")) {
        return;
    }

    const botMember = await message.guild.fetchMember(bot.user).catch(e => null); // can't trust message.guild.me
    if (!botMember) {
        return;
    }

    if (!botMember.hasPermission("MANAGE_EMOJIS") || !message.channel.permissionsFor(botMember).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) {
        console.error(`Bot doesn't have required permissions in guild: ${message.guild.name} (${message.guild.id})`);
        return;
    }

    const emotesInMessage = message.content.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi);
    if (!emotesInMessage) {
        return;
    }

    const promises = [];
    for (const emoteText of emotesInMessage) {
        const { animated, name, id } = Util.parseEmoji(emoteText);
        if (message.guild.emojis.has(id)) {
            continue;
        }

        promises.push(message.guild.createEmoji(`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`, name));
    }

    if (promises.length === 0) {
        return;
    }

    try {
        const results = await Promise.all(promises);
        message.channel.send(`Added ${results.length === 1 ? "emote" : "emotes"}:\n${results.map(emote => `${emote.toString()} \`:${emote.name}:\``).join("\n")}`);
    } catch (ex) {
        message.channel.send(`Failed: ${ex.message}`);
    }
});

bot.login("TOKEN_HERE");