// ============================================
// CANVAS & CONTEXT
// ============================================
let canvas, ctx;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

// ============================================
// ASSETS
// ============================================
const font = new FontFace('AntonSC', 'url(assets/fonts/AntonSC-Regular.ttf)');
let bg, ground, playerImg, pipeTop, pipeBottom, pointer;

// ============================================
// PLAYER
// ============================================
const PLAYER_X = 100;
const PLAYER_Y = 280;
const PLAYER_WIDTH = 64;
const PLAYER_HEIGHT = 44;

let player = {
    x: PLAYER_X,
    y: PLAYER_Y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
}

let velocity = 0;
let GRAVITY = 950;

// ============================================
// PIPES
// ============================================
let pipes = [];
const PIPE_WIDTH = 110;
const PIPE_GAP = 180;
const PIPE_SPEED = 180;
const PIPE_INTERVAL = 2;
let pipeTimer = 0;

// ============================================
// GROUND
// ============================================
const GROUND_HEIGHT = 80;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;
let groundX = 0;
let groundSpeed = PIPE_SPEED;

// ============================================
// GAME STATE
// ============================================
const GAME_STATE = {
    START: "start",
    PLAYING: "playing",
    GAME_OVER: "game_over"
};

let gameState = GAME_STATE.START;
let score = 0;

// ============================================
// INPUT
// ============================================
let canFlap = true;
let inputLocked = false;
let lastTime = 0;


function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}


async function preloadImages() {
    const sources = {
        bg: "assets/images/background.png",
        ground: "assets/images/ground.png",
        player: "assets/images/player.png",
        pipe_top: "assets/images/pipe-top.png",
        pipe_bottom: "assets/images/pipe-bottom.png",
        pointer: "assets/images/pointer.png"
    };

    const entries = Object.entries(sources);
    const loadedEntries = await Promise.all(
        entries.map(([key, src]) => loadImage(src).then(img => [key, img]))
    );

    return Object.fromEntries(loadedEntries);
}

window.onload = async function() {
    canvas = document.getElementById("game-canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
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

    const images = await preloadImages();
    bg = images.bg;
    ground = images.ground;
    playerImg = images.player;
    pipeTop = images.pipe_top;
    pipeBottom = images.pipe_bottom;
    pointer = images.pointer;

    await font.load();
    document.fonts.add(font);

    inputLocked = false;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function handleInput(source) {
    if (inputLocked) return;

    if (gameState === GAME_STATE.START) {
        inputLocked = true;
        startGame();
        return;
    }

    if (gameState === GAME_STATE.GAME_OVER) {
        inputLocked = true;
        resetGame();
        return;
    }

    if (gameState === GAME_STATE.PLAYING) {
        if (source === "keyboard") {
            if (!canFlap) return;
            canFlap = false;
        }

        velocity = -350;
    }
}


function gameLoop(timestamp) {
    inputLocked = false;

    const delta = Math.min((timestamp - lastTime) / 1000, 0.033);
    lastTime = timestamp;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
}


function update(delta) {
    if (gameState !== GAME_STATE.GAME_OVER) {
        groundX -= groundSpeed * delta;
        if (groundX <= -CANVAS_WIDTH) {
            groundX = 0;
        }
    }

    if (gameState !== GAME_STATE.PLAYING) return;
        
    velocity += GRAVITY * delta
    player.y += velocity * delta

    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED * delta;
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    pipeTimer += delta;
    if (pipeTimer > PIPE_INTERVAL) {
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

    if (gameState === GAME_STATE.GAME_OVER) {
        drawGameOver();
    }

    if (gameState === GAME_STATE.START) {
        drawStartText();
    }
}

function drawGround() {
    ctx.drawImage(ground, groundX, GROUND_Y, canvas.width, GROUND_HEIGHT);
    ctx.drawImage(ground, groundX + canvas.width, GROUND_Y, canvas.width, GROUND_HEIGHT);
}


function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    ctx.drawImage(
        playerImg,
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
            pipeTop,
            pipe.x,
            pipe.height - pipeTop.height,
            pipe.width,
            pipeTop.height
        );

        ctx.drawImage(
            pipeBottom,
            pipe.x,
            pipe.bottomY,
            pipe.width,
            pipeBottom.height
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

    const POINTER_WIDTH = 61;
    const POINTER_HEIGHT = 75;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.drawImage(
        pointer,
        canvas.width / 2 - POINTER_WIDTH / 2 - 25,
        canvas.height / 2 + 50,
        POINTER_WIDTH,
        POINTER_HEIGHT
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
    
    let topHeight = getRandomInt(50, GROUND_Y - PIPE_GAP - 50);
    let bottomY = topHeight + PIPE_GAP;
    let bottomHeight = canvas.height - bottomY;

    pipes.push({
        x: canvas.width,
        y: 0,
        width: PIPE_WIDTH,
        height: topHeight,
        bottomY: bottomY,
        bottomHeight: bottomHeight,
        passed: false  
    });
}


function checkCollision() {
    if (player.y + player.height >= GROUND_Y || player.y <= 0) {
        gameState = GAME_STATE.GAME_OVER;
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
            gameState = GAME_STATE.GAME_OVER;
            return;
        }
    }
}


function startGame() {
    gameState = GAME_STATE.PLAYING;
    velocity = -350;
}


function resetGame() {
    player.y = PLAYER_Y;
    velocity = 0;
    pipes = [];
    score = 0;
    pipeTimer = 0;
    canFlap = true;
    lastTime = performance.now();
    gameState = GAME_STATE.START;
}


function incrementScore() {
    score++;
}
