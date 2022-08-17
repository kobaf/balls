'use strict';

// setup canvas

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;


const counter = document.getElementById('count');

// function to generate random number

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

// function to generate random color

function randomRGB() {
  return `rgb(${random(20, 255)},${random(20, 255)},${random(20, 255)})`;
}

class Figure {
    constructor(x,y, size, velX, velY, collisionRadius, color, evil = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.velX = velX;
        this.velY = velY;
        this.collisionRadius = collisionRadius; // maximum distance when two objects considered collided
        this.color = color;
        this.evil = evil;
    }
    draw() {}
    update() {
        if ((this.x + this.size/2) >= width) {
           this.velX = -(this.velX);
        }
     
        if ((this.x - this.size/2) <= 0) {
           this.velX = -(this.velX);
        }
     
        if ((this.y + this.size/2) >= height) {
           this.velY = -(this.velY);
        }
     
        if ((this.y - this.size/2) <= 0) {
           this.velY = -(this.velY);
        }
     
        this.x += this.velX;
        this.y += this.velY;
    }
    collisionDetect(figure) {
        const dx = this.x - figure.x;
        const dy = this.y - figure.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return ((this !== figure) && (distance < this.collisionRadius + figure.collisionRadius));
    }
    bounce() {
        this.velX = random(-7,7);
        this.velY = random(-7,7);
    }

}

class Ball extends Figure {

    constructor(x, y, size, velX, velY, color) {
        super(x, y, size, velX, velY, size, color); // for Ball collisionRadius is equal to size
         
    }
    
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }

} 

class Square extends Figure {

    constructor(x, y, size, velX, velY, color) {
        let collisionRadius = Math.sqrt(2*size*size)/2;
        super(x, y, size, velX, velY, collisionRadius, color);
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    }

} 

class Evil extends Figure {
    static #_count = 0;
    constructor(x, y, size) {
        super(x, y, size, 0, 0, size/5, 'white', true); // collisionRadius is 1/5 of size
        Evil.#_count++;  
    }

    static get count() { return this.#_count; }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.stroke();
    }

    update() {
        return; //Evil circle doesn't move 
    }

} 

class FiguresRepo {
    static #figures = [];

    static #push(figure) {
        if (figure instanceof Figure) {
            this.#figures.push(figure);
        }
        else {
            throw new TypeError('Incorrect call of FigureRepo');
        }
    }

    // Main iterator for updating ball on the screen
    static [Symbol.iterator]() {
        let current = 0;
        return {next: () => {
                                if (current <= this.#figures.length-1) {
                                return { done: false, value: this.#figures[current++] };
                                } else {
                                return { done: true } };
                            }
                }
    }

    // Additional iterator for collision detection
    static items() {return {[Symbol.iterator]: () => {
                        let current = 0;
                        return {next: () => {
                                    if (current <= this.#figures.length-1) {
                                    return { done: false, value: this.#figures[current++] };
                                    } else {
                                    return { done: true } };
                                            }
                                }
                        }
                    }
    }

    static addFigure(type, x, y, 
                    size = random(10,20), 
                    velX = random(-7,7), 
                    velY = random(-7,7), 
                    color = randomRGB()) {

        let _x = x ?? random(2 * size, width - 2 * size); // figure position must be drawn at least one width
        let _y = y ?? random(2 * size,height - 2 * size); // away from the edge of the canvas, to avoid drawing errors

        const figure = new type(
           _x,
           _y,
           size,
           velX,
           velY,
           color);
        this.#push(figure);
    }

    static generateFigures(type, number) {
        for (let i = 0; i < number; i++) {
            this.addFigure(type);
        }
    }

    static remove(figure) {
        let idx = this.#figures.indexOf(figure);
        this.#figures.splice(idx,1);
    }

    static get count() {
        return this.#figures.length;
    }
    

}

function loop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, width, height);

    for (let figure of FiguresRepo) {        
        figure.draw();
        figure.update();
        for (let otherFigure of FiguresRepo.items()) {
            if (figure.collisionDetect(otherFigure)) {
                if (!otherFigure.evil) {
                    figure.color = otherFigure.color = randomRGB();
                    figure.bounce();
                    otherFigure.bounce();
                }
                else {
                    FiguresRepo.remove(figure);
                    if (FiguresRepo.count - Evil.count === 0) {
                        const theend = document.getElementById('theend');
                        theend.style.visibility = 'visible';
                    }
                }
            }
            counter.innerText = FiguresRepo.count - Evil.count;
        }   
    }  

    requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

window.addEventListener('click',(event) => {
    let type = (random(0,2) > 1) ? Ball : Square; // Random figure
    FiguresRepo.addFigure(type, event.clientX, event.clientY);  
});


FiguresRepo.generateFigures(Evil,5);
FiguresRepo.generateFigures(Ball,15);
FiguresRepo.generateFigures(Square,15);

loop();
 

