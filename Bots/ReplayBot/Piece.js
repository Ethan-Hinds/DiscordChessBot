module.exports = class Piece {
    constructor(type, color, square) {
        this.type = type;
        this.color = color;
        this.square = square;
    }

    show() {
        let imgPath = `Bots/ReplayBot/assets/${this.color}_${this.type}.png`;
        loadImage(imgPath).then((image) => {
            ctx.drawImage(image, this.square.x, this.square.y);
        });
    }
}