let canvas, ctx;
let canvas_width = 600;
let canvas_height = 800;

const font = new FontFace('AntonSC', 'url(assets/fonts/AntonSC-Regular.ttf)');
const bg = new Image();
const ground = new Image();
const pointer = new Image();
const player_img = new Image();
const pipe_top = new Image();
const pipe_bottom = new Image();
bg.src = "assets/images/background.png";
ground.src = "assets/images/ground.png";
pointer.src = "assets/images/pointer.png";
player_img.src = "assets/images/player.png";
pipe_top.src = "assets/images/pipe-top.png";
pipe_bottom.src = "assets/images/pipe-bottom.png";

let player_x = 100;
let player_y = 280;
let player_width = 64;
let player_height = 44;
let velocity = 0;
let gravity = 950;

let pipes = [];
const pipe_width = 100;
const pipe_gap = 180;
const pipe_speed = 180;
const pipe_interval = 1.8;
let pipeTimer = 0;

let player = {
    x: player_x,
    y: player_y,
    width: player_width,
    height: player_height
}

let canFlap = true;
let lastTime = 0;
let score = 0;

const ground_height = 80;
const ground_y = canvas_height - ground_height;
let ground_x = 0;
let ground_speed = pipe_speed;

const GameState = {
    START: "start",
    PLAYING: "playing",
    GAME_OVER: "game_over"
};

let gameState = GameState.START;

window.onload = function() {
    canvas = document.getElementById("gameCanvas");
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    ctx = canvas.getContext("2d");

    canvas.addEventListener("contextmenu", e => e.preventDefault());
    canvas.addEventListener("mousedown", () => handleInput("pointer"));
    canvas.addEventListener("touchstart", () => handleInput("pointer"));

    window.addEventListener("keydown", e => {
        if (e.code === "Space") handleInput("keyboard");
    });

    window.addEventListener("keyup", e => {
        if (e.code === "Space") canFlap = true;
    });

    window.addEventListener("wheel", e => {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener("keydown", e => {
        if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) {
            e.preventDefault();
        }
    });

    font.load().then(function(loadedFont) {
        document.fonts.add(loadedFont);
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    });
}

function handleInput(source) {
    if (gameState === GameState.START) {
        startGame();
        return;
    }

    if (gameState === GameState.GAME_OVER) {
        resetGame();
        return;
    }

    if (gameState === GameState.PLAYING) {
        if (source === "keyboard") {
            if (!canFlap) return;
            canFlap = false;
        }

        velocity = -350;
    }
}


function gameLoop(timestamp) {
    const delta = (timestamp - lastTime)/1000;
    lastTime = timestamp;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
}


function update(delta) {
    if (gameState !== GameState.GAME_OVER) {
        ground_x -= ground_speed * delta;
        if (ground_x <= -canvas_width) {
            ground_x = 0;
        }
    }

    if (gameState !== GameState.PLAYING) return;
        
    velocity += gravity * delta
    player.y += velocity * delta

    pipes.forEach(pipe => {
        pipe.x -= pipe_speed * delta;
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    pipeTimer += delta;
    if (pipeTimer > pipe_interval) {
        pipeTimer = 0;
        spawnPipe();
    }

    pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + pipe.width < player.x) {
            pipe.passed = true;
            incrementScore();
        }
    });

    checkCollision();
}


function draw() {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawPipes();
    drawScore();
    drawGround();

    if (gameState === GameState.GAME_OVER) {
        drawGameOver();
    }

    if (gameState === GameState.START) {
        drawStartText();
    }
}

function drawGround() {
    ctx.drawImage(ground, ground_x, ground_y, canvas.width, ground_height);
    ctx.drawImage(ground, ground_x + canvas.width, ground_y, canvas.width, ground_height);
}


function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    ctx.drawImage(
        player_img,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
    );

    ctx.restore();
}


function drawPipes() {
    pipes.forEach(pipe => {
        ctx.drawImage(
            pipe_top,
            pipe.x,
            pipe.height - pipe_top.height,
            pipe.width,
            pipe_top.height
        );

        ctx.drawImage(
            pipe_bottom,
            pipe.x,
            pipe.bottomY,
            pipe.width,
            pipe_bottom.height
        );
    });
}


function drawScore() {
    ctx.font = "bold 50px AntonSC";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillText(score, canvas.width / 2, 25);
}


function drawStartText() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "bold 50px AntonSC";
    ctx.textAlign = "center";
    ctx.fillText("TAP", canvas.width / 2 + 35, canvas.height / 2 + 30);
    
    const pointerWidth = 61;
    const pointerHeight = 75;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(
        pointer,
        canvas.width / 2 - pointerWidth / 2 - 25,
        canvas.height / 2 + 50,
        pointerWidth,
        pointerHeight
    );
    ctx.restore();
}


function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 120px AntonSC";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = "40px AntonSC";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillText("TAP TO PLAY AGAIN", canvas.width / 2, canvas.height / 2 + 40);
}


function spawnPipe() {
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;
    
    let topHeight = getRandomInt(50, ground_y - pipe_gap - 50);
    let bottomY = topHeight + pipe_gap;
    let bottomHeight = canvas.height - bottomY;

    pipes.push({
        x: canvas.width,
        y: 0,
        width: pipe_width,
        height: topHeight,
        bottomY: bottomY,
        bottomHeight: bottomHeight,
        passed: false  
    });
}


function checkCollision() {
    if (player.y + player.height >= ground_y || player.y <= 0) {
        gameState = GameState.GAME_OVER;
        return;
    }

    for (let pipe of pipes) {
        const hitTop = player.x < pipe.x + pipe.width &&
                       player.x + player.width > pipe.x &&
                       player.y < pipe.height;

        const hitBottom = player.x < pipe.x + pipe.width &&
                          player.x + player.width > pipe.x &&
                          player.y + player.height > pipe.bottomY;

        if (hitTop || hitBottom) {
            gameState = GameState.GAME_OVER;
            return;
        }
    }
}


function startGame() {
    gameState = GameState.PLAYING;
    velocity = -350;
}


function resetGame() {
    player.y = player_y;
    velocity = 0;
    pipes = [];
    score = 0;
    pipeTimer = 0;
    canFlap = true;
    lastTime = performance.now();
    gameState = GameState.START;
}


function incrementScore() {
    score++;
}
