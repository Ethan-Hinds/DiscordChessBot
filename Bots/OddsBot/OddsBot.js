const fs = require("fs");

module.exports = class OddsBot {
    constructor() {
        this.prefix = "!";
        this.players;
        this.dataFilePath = "players.json";
        this.getData();
    }

    handleMessage(message) {
        if (!message.content.startsWith(this.prefix)) return;

        const args = message.content.slice(this.prefix.length).split(/ +/);
        let name = message.author.username;
        let command = args[0];

        switch(command) {
            case "join":
                if (this.players.hasOwnProperty(name) && this.players[name].score != -1) {
                    message.channel.send("You have already joined!");
                    return;
                }
                this.players[name] = {score: 0, status: "Yes", lichessUsername: "", chessComUsername: ""};
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "win":
                if (!this.players.hasOwnProperty(name)) {
                    message.channel.send("You have not joined!");
                    return;
                }
    
                this.players[name].score = parseFloat(this.players[name].score) + 1;
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "oops":
                if (!this.players.hasOwnProperty(name)) {
                    message.channel.send("You have not joined!");
                    return;
                }
    
                this.players[name].score = parseFloat(this.players[name].score) - 1;
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "unpause":
                if (!this.players.hasOwnProperty(name)) {
                    message.channel.send("You have not joined!");
                    return;
                }
    
                this.players[name].status = "Yes";
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "pause":
                if (!this.players.hasOwnProperty(name)) {
                    message.channel.send("You have not joined!");
                    return;
                }
    
                this.players[name].status = "No";
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "name":
                if (!this.players.hasOwnProperty(name)) {
                    message.channel.send("You have not joined!");
                    return;
                }
                if (args.length < 2) {
                    message.channel.send("Please specify a name for yourself!");
                    return;
                }
    
                this.players[name].lichessUsername = args[1];
                fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                this.showData(message);
                break;
            case "setScore":
                if (args.length == 3) {
                    let _player = args[1];
                    let _score = args[2];
                    if (this.players.hasOwnProperty(_player) && !isNaN(_score)) {
                        this.players[_player].score = _score;
                        fs.writeFile(this.dataFilePath, JSON.stringify(this.players), (err) => {});
                        this.showData(message);
                    }
                }
                break;
            case "show":
                this.showData(message);
                break;
            case "help":
                message.channel.send(`Use the following commands:\n\n!rules to see the league's rules\n!join to add yourself to the competition\n!win to add a point to yourself\n!oops to remove a point from yourself\n!show to display the current standings\n!name <your username> to set your lichess username\n!pause to take a break from receiving challenges – please don't @ players who are inactive\n!unpause to re-join the competition\n!help to show this list`);
                break;
            case "rules":
                message.channel.send(`Introducing the Odds League!\n\nThis is an ongoing, long-term ladder. People can join or leave whenever. It's called the Odds League because matches are played with odds, which in chess means that one player starts with fewer pieces than their opponent.\n\nRules & Guidelines\n• You may challenge any active player to a game. Type !pause to go inactive.\n• The same 2 players may only face each other for 1 decisive game in a row (this is to prevent inflation). \n• The winner gets 1 point. If there's a draw, you may rematch until there's a winner if both agree.\n• Odds are decided by the points difference in the standings. \n\t• Pawn = 1 point \n\t• Knight = 3 points\n\t• Bishop = 4 points \n\t• Rook = 5 points \n\t• Queen = 9 points\n• The player who is ahead chooses what pieces to spot and plays with the white pieces.\n• The player who is behind chooses the time control and plays with the black pieces.\n• Time control options are 3, 5 and 10 minutes. No increment.\n\nInstructions\n• On the lichess.org home page, go to Tools > Board Editor. \n• Remove pieces as needed, then click "Continue from here" and "Play with a friend". \n • Time control: 3, 5 or 10 minutes according to your opponent's decision. 0 increment.\n• Copy the url and paste in this channel.\n• Winner types !win in this channel.\n\n\Have fun!`);
                break;
        }
    }

    showData(message) {
        let playersArray = [];
        for (let key in this.players) {
            if (this.players[key].score != -1) {
                playersArray.push([key, this.players[key].score, this.players[key].status, this.players[key].lichessUsername]);
            }
        }
    
        playersArray.sort(function(a, b) {
            return b[1] - a[1];
        });
    
        let columns = [["   Player"], ["Wins"], ["Active"], ["Lichess Name"]];
        for (let i = 0; i < playersArray.length; i += 1) {
            let player = playersArray[i];
            columns[0].push(`${i+1}. ${player[0]}`);
            columns[1].push(`${player[1]}`);
            columns[2].push(`${player[2]}`);
            columns[3].push(`${player[3]}`);
        }
    
        for (let column of columns) {
            let maxLength = 0;
            for (let i = 0; i < column.length; i += 1) {
                maxLength = Math.max(maxLength, column[i].length);
            }
            for (let i = 0; i < column.length; i += 1) {
                column[i] += " ".repeat(maxLength - column[i].length + 3);
            }
        }
    
        let rows = this.transpose(columns);
    
        let text = "```";
        for (let i = 0; i < rows.length; i += 1) {
            for (let j = 0; j < rows[i].length; j += 1) {
                text += rows[i][j];
            }
            text += "\n";
        }
        text += "```";
    
        message.channel.send(text);
    
    }
    
    transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }
    
    getData() {
        let playersData = fs.readFileSync(this.dataFilePath);
        this.players = JSON.parse(playersData);
    }
}
