const fs = require("fs");
const {MessageAttachment} = require('discord.js');
const ChessWebAPI = require('chess-web-api');
const chessAPI = new ChessWebAPI();
const {Chess} = require('chess.js');
const chess = new Chess();
const GIFEncoder = require('gif-encoder-2');
const _canvas = {createCanvas, loadImage} = require('canvas');
global.loadImage = _canvas.loadImage;
global.canvas = createCanvas(96*8, 96*8);
global.ctx = canvas.getContext("2d");
// const { start } = require('repl');

const Board = require('./Board.js');


module.exports = class ReplayBot {

    constructor() {
        this.prefix = "!";
        this.whitePlayer = "";
        this.blackPlayer = "";
        this.userSide = "";
        this.players;
        this.dataFilePath = "players.json";
        this.delay = 2000;
        this.getDiscordUserData();
    }

    handleMessage(message) {
        if (!message.content.startsWith(this.prefix)) return;
    
        const args = message.content.slice(this.prefix.length).split(/ +/);
    
        let startMove;
        let endMove;
    
        let name = message.author.username;
    
        let recognizedCommand = false;
    
        switch(args.length) {
            case 1:
                if (args[0] == "game") {
                    recognizedCommand = true;
                    startMove = 0;
                } else if (args[0] == "delay") {
                    message.channel.send("Current delay is " + this.delay/1000 + " seconds");
                    return;
                } else if (args[0] == "add") {
                    message.channel.send("Please specify your chess.com username when using !add");
                    return;
                } else if (args[0] == "help") {
                    if (message.channel.id == "782988284480585758") {
                        message.channel.send("This bot will display your chess.com games in Discord.  To get started, type !add <chess.com username>\n\nCommands:\n!game: Displays your most recent chess.com game\n!game 3: Displays your most recent game starting from move 3\n!game 6 28: Displays your most recent game from moves 6 to 28\n!delay 2: Sets the animation delay between each ply to 2 seconds");
                    }
                    return;
                }
                break;
            case 2:
                if (args[0] == "game") {
                    recognizedCommand = true;
                    if (isNaN(args[1])) {
                        message.channel.send("Please enter a valid start move!");
                        return;
                    }
                    startMove = args[1];
                } else if (args[0] == "add") {
                    recognizedCommand = true;
                    if (this.players.hasOwnProperty(name) && this.players[name].chessComUsername != "") {
                        this.players[name].chessComUsername = args[1];
                        fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                        message.channel.send("I updated your chess.com username: " + this.players[name].chessComUsername);
                        return;
                    }

                    this.players[name] = {score: -1, status: "Yes", lichessUsername: "", chessComUsername: ""};

                    this.players[name].chessComUsername = args[1];
                    fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                    message.channel.send("I have saved your chess.com username.");
                    return;
                } else if (args[0] == "delay") {
                    recognizedCommand = true;
                    if (isNaN(args[1])) {
                        message.channel.send("Please specifiy a delay!");
                        return;
                    }
                    this.delay = parseFloat(args[1]) * 1000;
                    //message.channel.send("Delay set to " + delay/1000 + " seconds");
                    return;
                }
                break;
            case 3:
                if (isNaN(args[1]) || isNaN(args[2])) {
                    message.channel.send("Please enter valid start and stop moves! Ex: !game 5 10");
                    return;
                }
                recognizedCommand = true;
                startMove = args[1];
                endMove = args[2];
                break;
        }
    
        if (!this.players.hasOwnProperty(name)) {
            message.channel.send("Please tell me your chess.com username by typing !add <chess.com username>");
            return;
        }
        let username = this.players[name].chessComUsername;
    
        let encoder = new GIFEncoder(96*8, 96*8);
    
        const date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        encoder.setDelay(this.delay);
        encoder.start();
    
        let board = new Board();
        chess.reset();
    
        //message.channel.send("Please wait a moment.");
    
        chessAPI.getPlayerCompleteMonthlyArchives(username, year, month).then(async (response) => { 
            let numGames = response.body.games.length;
            this.whitePlayer = response.body.games[numGames-1].pgn.match(/\[White\s"(.*?)"\]/)[1];
            this.blackPlayer = response.body.games[numGames-1].pgn.match(/\[Black\s"(.*?)"\]/)[1];
            this.userSide = this.whitePlayer.toLowerCase() == username.toLowerCase() ? "white" : "black";
            let moves = response.body.games[numGames-1].pgn.split(/Link.*?]/)[1].replace(/{.*?\.\s/g, "").replace(/{.*/, "").slice(5).split(" ");
            startMove = Math.min(Math.max(parseInt(startMove), 1), moves.length/2);
            if (!endMove) {
                endMove = moves.length;
            } else {
                endMove = Math.min(Math.max(parseInt(endMove), 1), moves.length/2);   
            }
            this.playGame(board, moves, 0, startMove-1, endMove, message, encoder);
        }).catch(() => {
            message.channel.send("Unable to find a chess.com user with username: " + username);
            return;
        });
    }


    getDiscordUserData() {
        let playersData = fs.readFileSync(this.dataFilePath);
        this.players = JSON.parse(playersData);
    }

    playGame(board, moves, move, startMove, endMove, message, encoder) {
        if (move < startMove) {
            chess.move(moves[0]);
            moves = moves.slice(1);
            this.playGame(board, moves, move+0.5, startMove, endMove, message, encoder);
        } else if (moves.length > 0 && move <= endMove) {
            board.setPosition(chess.board(), this.userSide);
            board.updateCanvas().then(() => {
                encoder.addFrame(ctx);
                chess.move(moves[0]);
                moves = moves.slice(1);
                this.playGame(board, moves, move+0.5, startMove, endMove, message, encoder);
            });
        } else {
            encoder.finish();
            let buffer = encoder.out.getData();
            const attachment = new MessageAttachment(buffer, "image.gif");
            message.channel.send(`${this.whitePlayer} vs ${this.blackPlayer}`, attachment);
        }
    }
}