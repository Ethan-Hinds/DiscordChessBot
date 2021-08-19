require("dotenv").config();
const {Client} = require('discord.js');
const client = new Client();
client.login(process.env.DISCORD_TOKEN);

const OddsBot = require('./Bots/OddsBot/OddsBot.js');
const ReplayBot = require("./Bots/ReplayBot/ReplayBot.js");


const oddsBot = new OddsBot();
const replayBot = new ReplayBot();

client.once("ready", () => {
    console.log("Chess Bot is online!");
});

client.on("message", message => {
    if (message.author.bot) return;
    let channel = message.channel.id;

    switch (channel) {
        case "807678896602349619":
            oddsBot.handleMessage(message);
            break;
        case "782988284480585758":
            replayBot.handleMessage(message);
        case "781964007434354729":
            replayBot.handleMessage(message);
            break;
    }
});