const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hud = document.getElementById("hud");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const homeBtn = document.getElementById("homeBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const bestText = document.getElementById("best");

const finalScoreText = document.getElementById("finalScore");
const newBestText = document.getElementById("newBest");


/* =========================================
   CANVAS
========================================= */

let W;
let H;

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================================
   GAME VARIABLES
========================================= */

let gameRunning = false;

let score = 0;

let lives = 3;

let bestScore =
    Number(localStorage.getItem("slimeBest")) || 0;

let obstacles = [];

let particles = [];

let clouds = [];

let islands = [];

let birds = [];

let lastTime = 0;

let obstacleTimer = 0;

let obstacleInterval = 850;

let gameTime = 0;

let difficulty = 1;


/* =========================================
   SLIME
========================================= */

const slime = {

    x: 0,

    y: 0,

    width: 55,

    height: 45,

    speed: 450,

    vx: 0,

    squish: 0,

    hitTimer: 0

};


/* =========================================
   INPUT
========================================= */

const keys = {

    left: false,

    right: false

};


document.addEventListener("keydown", (e) => {

    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = true;
    }

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = true;
    }

});


document.addEventListener("keyup", (e) => {

    if (
        e.key === "ArrowLeft" ||
        e.key.toLowerCase() === "a"
    ) {
        keys.left = false;
    }

    if (
        e.key === "ArrowRight" ||
        e.key.toLowerCase() === "d"
    ) {
        keys.right = false;
    }

});


/* =========================================
   MOBILE BUTTONS
========================================= */

function holdButton(button, direction) {

    button.addEventListener("pointerdown", (e) => {

        e.preventDefault();

        keys[direction] = true;

    });

    button.addEventListener("pointerup", () => {

        keys[direction] = false;

    });

    button.addEventListener("pointerleave", () => {

        keys[direction] = false;

    });

    button.addEventListener("pointercancel", () => {

        keys[direction] = false;

    });

}

holdButton(leftBtn, "left");

holdButton(rightBtn, "right");


/* =========================================
   START GAME
========================================= */

startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", startGame);

homeBtn.addEventListener("click", () => {

    gameRunning = false;

    gameOverScreen.classList.add("hidden");

    startScreen.classList.remove("hidden");

    hud.classList.add("hidden");

});


function startGame() {

    resizeCanvas();

    gameRunning = true;

    score = 0;

    lives = 3;

    obstacles = [];

    particles = [];

    gameTime = 0;

    difficulty = 1;

    obstacleTimer = 0;

    obstacleInterval = 850;

    slime.x = W / 2;

    slime.y = H - 75;

    slime.hitTimer = 0;

    scoreText.textContent = "0";

    livesText.textContent = "3";

    bestText.textContent = bestScore;

    startScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    hud.classList.remove("hidden");

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);

}


/* =========================================
   CREATE OBSTACLE
========================================= */

function createObstacle() {

    const size =
        25 + Math.random() * 35;

    const x =
        size +
        Math.random() *
        (W - size * 2);

    const speed =
        (180 + Math.random() * 150)
        * difficulty;

    obstacles.push({

        x: x,

        y: -size,

        size: size,

        speed: speed,

        rotation:
            Math.random() * Math.PI,

        rotationSpeed:
            (Math.random() - 0.5) * 4,

        counted: false

    });

}


/* =========================================
   CREATE CLOUD
========================================= */

function createClouds() {

    clouds = [];

    for (let i = 0; i < 8; i++) {

        clouds.push({

            x: Math.random() * W,

            y: Math.random() * H * 0.55,

            size: 35 + Math.random() * 55,

            speed: 6 + Math.random() * 12

        });

    }

}

createClouds();


/* =========================================
   CREATE BACKGROUND ISLANDS
========================================= */

function createIslands() {

    islands = [
        { x: W * 0.08, y: H * 0.20, size: 60, bob: Math.random() * 10 },
        { x: W * 0.90, y: H * 0.15, size: 52, bob: Math.random() * 10 },
        { x: W * 0.30, y: H * 0.34, size: 34, bob: Math.random() * 10 },
        { x: W * 0.83, y: H * 0.38, size: 40, bob: Math.random() * 10 }
    ];

}

createIslands();


/* =========================================
   CREATE BIRDS
========================================= */

function createBirds() {

    birds = [];

    for (let i = 0; i < 3; i++) {

        birds.push({

            x: Math.random() * W,

            y: H * 0.12 + Math.random() * H * 0.28,

            speed: 18 + Math.random() * 14,

            size: 7 + Math.random() * 3,

            flap: Math.random() * 10

        });

    }

}

createBirds();


/* =========================================
   UPDATE
========================================= */

function update(dt) {

    gameTime += dt;

    difficulty =
        1 + gameTime / 30;

    /* SCORE */

    score += dt * 10;

    scoreText.textContent =
        Math.floor(score);


    /* SLIME MOVEMENT */

    slime.vx = 0;

    if (keys.left) {

        slime.vx = -slime.speed;

    }

    if (keys.right) {

        slime.vx = slime.speed;

    }

    slime.x += slime.vx * dt;

    /* Screen boundary */

    const halfWidth =
        slime.width / 2;

    if (slime.x < halfWidth) {

        slime.x = halfWidth;

    }

    if (slime.x > W - halfWidth) {

        slime.x = W - halfWidth;

    }


    /* SLIME ANIMATION */

    if (slime.vx !== 0) {

        slime.squish += dt * 15;

    } else {

        slime.squish += dt * 5;

    }


    if (slime.hitTimer > 0) {

        slime.hitTimer -= dt;

    }


    /* OBSTACLE SPAWN */

    obstacleTimer += dt * 1000;

    obstacleInterval =
        Math.max(
            250,
            850 - gameTime * 10
        );

    if (obstacleTimer >= obstacleInterval) {

        obstacleTimer = 0;

        createObstacle();

    }


    /* UPDATE OBSTACLES */

    for (
        let i = obstacles.length - 1;
        i >= 0;
        i--
    ) {

        const rock = obstacles[i];

        rock.y += rock.speed * dt;

        rock.rotation +=
            rock.rotationSpeed * dt;


        /* COLLISION */

        if (
            slime.hitTimer <= 0 &&
            checkCollision(slime, rock)
        ) {

            hitSlime();

            obstacles.splice(i, 1);

            continue;

        }


        /* Passed player */

        if (
            rock.y >
            H + rock.size
        ) {

            if (!rock.counted) {

                rock.counted = true;

                score += 20;

            }

            obstacles.splice(i, 1);

        }

    }


    /* PARTICLES */

    updateParticles();


    /* BIRDS */

    birds.forEach(bird => {

        bird.x += bird.speed * dt;

        bird.flap += dt * 10;

        if (bird.x > W + 20) {

            bird.x = -20;

            bird.y = H * 0.12 + Math.random() * H * 0.28;

        }

    });


    /* ISLAND BOB */

    islands.forEach(isl => {

        isl.bob += dt * 1.2;

    });

}


/* =========================================
   COLLISION
========================================= */

function checkCollision(slime, rock) {

    const slimeLeft =
        slime.x - slime.width / 2;

    const slimeRight =
        slime.x + slime.width / 2;

    const slimeTop =
        slime.y - slime.height / 2;

    const slimeBottom =
        slime.y + slime.height / 2;

    const rockLeft =
        rock.x - rock.size;

    const rockRight =
        rock.x + rock.size;

    const rockTop =
        rock.y - rock.size;

    const rockBottom =
        rock.y + rock.size;


    return (
        slimeLeft < rockRight &&
        slimeRight > rockLeft &&
        slimeTop < rockBottom &&
        slimeBottom > rockTop
    );

}


/* =========================================
   HIT SLIME
========================================= */

function hitSlime() {

    lives--;

    livesText.textContent = lives;

    slime.hitTimer = 1;

    createExplosion(
        slime.x,
        slime.y
    );


    if (lives <= 0) {

        endGame();

    }

}


/* =========================================
   GAME OVER
========================================= */

function endGame() {

    gameRunning = false;

    const finalScore =
        Math.floor(score);

    finalScoreText.textContent =
        finalScore;


    if (finalScore > bestScore) {

        bestScore = finalScore;

        localStorage.setItem(
            "slimeBest",
            bestScore
        );

        newBestText.classList.remove(
            "hidden"
        );

    } else {

        newBestText.classList.add(
            "hidden"
        );

    }


    setTimeout(() => {

        gameOverScreen.classList.remove(
            "hidden"
        );

        hud.classList.add("hidden");

    }, 400);

}


/* =========================================
   DRAW BACKGROUND
========================================= */

function drawBackground() {

    /* Sky */

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(
        0,
        "#65b8ff"
    );

    gradient.addColorStop(
        1,
        "#d8f3ff"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* Floating islands (background) */

    islands.forEach(drawIsland);


    /* Birds */

    ctx.strokeStyle = "rgba(255,255,255,0.85)";

    ctx.lineWidth = 2;

    birds.forEach(drawBird);


    /* Clouds */

    ctx.fillStyle =
        "rgba(255,255,255,0.75)";

    clouds.forEach(cloud => {

        drawCloud(
            cloud.x,
            cloud.y,
            cloud.size
        );

    });


    /* Ground */

    const groundHeight = 65;

    ctx.fillStyle = "#72b84b";

    ctx.fillRect(
        0,
        H - groundHeight,
        W,
        groundHeight
    );


    /* Grass */

    ctx.fillStyle = "#9bdd62";

    ctx.fillRect(
        0,
        H - groundHeight,
        W,
        10
    );


    /* Ground flowers */

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const x =
            (i * 137 + 40) % W;

        const y =
            H - 22 -
            ((i * 53) % 14);

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(x, y, 3, 0, Math.PI * 2);

        ctx.fill();

        ctx.fillStyle = "#ffd75e";

        ctx.beginPath();

        ctx.arc(x, y, 1.3, 0, Math.PI * 2);

        ctx.fill();

    }


    /* Corner foliage vignette */

    drawBush(W * -0.02, H, W * 0.16);

    drawBush(W * 1.02, H, W * 0.16);

}


/* =========================================
   DRAW BUSH (corner foliage)
========================================= */

function drawBush(x, y, size) {

    ctx.fillStyle = "#2c5c2a";

    ctx.beginPath();

    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);

    ctx.arc(x - size * 0.4, y - size * 0.12, size * 0.4, 0, Math.PI * 2);

    ctx.arc(x + size * 0.4, y - size * 0.12, size * 0.4, 0, Math.PI * 2);

    ctx.fill();

}


/* =========================================
   DRAW FLOATING ISLAND
========================================= */

function drawIsland(isl) {

    const bobY = Math.sin(isl.bob) * 4;

    const x = isl.x;

    const y = isl.y + bobY;

    const size = isl.size;

    ctx.save();

    /* Waterfall */

    const fallGrad = ctx.createLinearGradient(0, y, 0, y + size * 1.8);

    fallGrad.addColorStop(0, "rgba(220,245,255,0.7)");

    fallGrad.addColorStop(1, "rgba(220,245,255,0)");

    ctx.fillStyle = fallGrad;

    ctx.fillRect(x - size * 0.08, y + size * 0.35, size * 0.16, size * 1.6);

    /* Rock */

    ctx.fillStyle = "#7c8a99";

    ctx.beginPath();

    ctx.moveTo(x - size, y + size * 0.25);

    ctx.lineTo(x - size * 0.55, y + size * 0.85);

    ctx.lineTo(x + size * 0.55, y + size * 0.85);

    ctx.lineTo(x + size, y + size * 0.25);

    ctx.lineTo(x + size * 0.5, y);

    ctx.lineTo(x - size * 0.5, y);

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.12)";

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.lineTo(x + size, y + size * 0.25);

    ctx.lineTo(x + size * 0.55, y + size * 0.85);

    ctx.lineTo(x, y + size * 0.6);

    ctx.closePath();

    ctx.fill();

    /* Grass top */

    ctx.fillStyle = "#6bbf47";

    ctx.beginPath();

    ctx.ellipse(x, y, size * 1.05, size * 0.42, 0, Math.PI, Math.PI * 2);

    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.25)";

    ctx.beginPath();

    ctx.ellipse(x - size * 0.2, y - size * 0.1, size * 0.4, size * 0.14, 0, Math.PI, Math.PI * 2);

    ctx.fill();

    ctx.restore();

}


/* =========================================
   DRAW BIRD
========================================= */

function drawBird(bird) {

    const flap = Math.sin(bird.flap) * bird.size * 0.5;

    ctx.beginPath();

    ctx.moveTo(bird.x - bird.size, bird.y + flap);

    ctx.quadraticCurveTo(bird.x - bird.size * 0.3, bird.y - bird.size * 0.6, bird.x, bird.y);

    ctx.quadraticCurveTo(bird.x + bird.size * 0.3, bird.y - bird.size * 0.6, bird.x + bird.size, bird.y + flap);

    ctx.stroke();

}


/* =========================================
   DRAW CLOUD
========================================= */

function drawCloud(x, y, size) {

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        size * 0.45,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + size * 0.45,
        y - size * 0.1,
        size * 0.6,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + size,
        y,
        size * 0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================
   DRAW ROCK
========================================= */

function drawRockTrail(rock) {

    const len = Math.min(70, rock.size * 1.8);

    const grad = ctx.createLinearGradient(
        rock.x, rock.y - len,
        rock.x, rock.y - rock.size * 0.4
    );

    grad.addColorStop(0, "rgba(255,255,255,0)");

    grad.addColorStop(1, "rgba(255,255,255,0.4)");

    ctx.strokeStyle = grad;

    ctx.lineWidth = Math.max(1.5, rock.size * 0.12);

    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(rock.x - rock.size * 0.35, rock.y - len);

    ctx.lineTo(rock.x - rock.size * 0.1, rock.y - rock.size * 0.4);

    ctx.moveTo(rock.x + rock.size * 0.35, rock.y - len);

    ctx.lineTo(rock.x + rock.size * 0.1, rock.y - rock.size * 0.4);

    ctx.stroke();

}


function drawRock(rock) {

    ctx.save();

    ctx.translate(
        rock.x,
        rock.y
    );

    ctx.rotate(
        rock.rotation
    );


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.2)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        rock.size * 0.7,
        rock.size,
        rock.size * 0.3,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Rock base */

    ctx.fillStyle = "#5a6167";

    ctx.beginPath();

    ctx.moveTo(
        -rock.size,
        0
    );

    ctx.lineTo(
        -rock.size * 0.6,
        -rock.size * 0.8
    );

    ctx.lineTo(
        rock.size * 0.3,
        -rock.size
    );

    ctx.lineTo(
        rock.size,
        -rock.size * 0.2
    );

    ctx.lineTo(
        rock.size * 0.6,
        rock.size * 0.8
    );

    ctx.lineTo(
        -rock.size * 0.4,
        rock.size
    );

    ctx.closePath();

    ctx.fill();


    /* Facet shading (low-poly look) */

    ctx.fillStyle = "rgba(255,255,255,0.14)";

    ctx.beginPath();

    ctx.moveTo(-rock.size, 0);

    ctx.lineTo(-rock.size * 0.6, -rock.size * 0.8);

    ctx.lineTo(rock.size * 0.3, -rock.size);

    ctx.lineTo(0, 0);

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.18)";

    ctx.beginPath();

    ctx.moveTo(0, 0);

    ctx.lineTo(rock.size, -rock.size * 0.2);

    ctx.lineTo(rock.size * 0.6, rock.size * 0.8);

    ctx.lineTo(-rock.size * 0.4, rock.size);

    ctx.closePath();

    ctx.fill();


    /* Rock highlight */

    ctx.fillStyle =
        "rgba(255,255,255,0.25)";

    ctx.beginPath();

    ctx.arc(
        -rock.size * 0.25,
        -rock.size * 0.3,
        rock.size * 0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================================
   DRAW SLIME
========================================= */

function drawSlime() {

    ctx.save();

    ctx.translate(
        slime.x,
        slime.y
    );


    /* Blink when hit */

    if (
        slime.hitTimer > 0 &&
        Math.floor(
            slime.hitTimer * 10
        ) % 2 === 0
    ) {

        ctx.globalAlpha = 0.35;

    }


    const bounce =
        Math.sin(slime.squish) * 2;

    const scaleX =
        slime.vx !== 0
            ? 1.05
            : 1;

    const scaleY =
        slime.vx !== 0
            ? 0.95
            : 1;


    ctx.scale(
        scaleX,
        scaleY
    );


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.2)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        22.2,
        27,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Body — same shape/proportions as the .mascot-body on the
       home screen (90x74 box, border-radius 50% 50% 45% 45% / 65% 65% 35% 35%),
       scaled by 0.6 to fit the in-game slime. */

    const bodyGrad = ctx.createLinearGradient(0, -22.2, 0, 22.2);

    bodyGrad.addColorStop(0, "#a6e2ff");

    bodyGrad.addColorStop(1, "#5cb8f5");

    ctx.fillStyle = bodyGrad;

    ctx.beginPath();

    ctx.ellipse(0, 6.665, 27, 28.865, 0, -Math.PI / 2, 0, false);      // top-right corner

    ctx.ellipse(2.7, 6.665, 24.3, 15.535, 0, 0, Math.PI / 2, false);   // bottom-right corner

    ctx.lineTo(-2.7, 22.2);                                            // flat base

    ctx.ellipse(-2.7, 6.665, 24.3, 15.535, 0, Math.PI / 2, Math.PI, false); // bottom-left corner

    ctx.ellipse(0, 6.665, 27, 28.865, 0, Math.PI, Math.PI * 1.5, false);   // top-left corner

    ctx.closePath();

    ctx.fill();


    /* Body highlight */

    ctx.fillStyle = "rgba(255,255,255,0.5)";

    ctx.beginPath();

    ctx.ellipse(-11.9, -12.4, 5.4, 3.6, 0, 0, Math.PI * 2);

    ctx.fill();


    /* Cheeks */

    ctx.fillStyle = "rgba(255,150,175,0.7)";

    ctx.beginPath();

    ctx.ellipse(-17.7, 3.3, 3.9, 2.4, 0, 0, Math.PI * 2);

    ctx.ellipse(17.7, 3.3, 3.9, 2.4, 0, 0, Math.PI * 2);

    ctx.fill();


    /* Eyes */

    ctx.fillStyle = "#17251a";

    ctx.beginPath();

    ctx.arc(
        -8.4,
        -2,
        2.4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        8.4,
        -2,
        2.4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Mouth */

    ctx.strokeStyle =
        "#17251a";

    ctx.lineWidth = 1.8;

    ctx.beginPath();

    ctx.arc(
        0,
        1.8,
        4.2,
        0,
        Math.PI
    );

    ctx.stroke();


    ctx.restore();

}


/* =========================================
   PARTICLES
========================================= */

function createExplosion(x, y) {

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx:
                (Math.random() - 0.5)
                * 250,

            vy:
                (Math.random() - 0.5)
                * 250,

            life: 0.7,

            size:
                2 + Math.random() * 5

        });

    }

}


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx * 0.016;

        p.y += p.vy * 0.016;

        p.vy += 300 * 0.016;

        p.life -= 0.016;


        if (p.life <= 0) {

            particles.splice(i, 1);

        }

    }

}


function drawParticles() {

    particles.forEach(p => {

        ctx.globalAlpha =
            Math.max(0, p.life);

        ctx.fillStyle =
            "#ffd45c";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    });

    ctx.globalAlpha = 1;

}


/* =========================================
   GAME LOOP
========================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {

        return;

    }


    let dt =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;


    /* Prevent huge jump */

    dt = Math.min(
        dt,
        0.033
    );


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================
   DRAW
========================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    drawBackground();


    obstacles.forEach(
        drawRockTrail
    );

    obstacles.forEach(
        drawRock
    );


    drawSlime();

    drawParticles();

}


/* =========================================
   INITIAL
========================================= */

bestText.textContent =
    bestScore;

resizeCanvas();

slime.x = W / 2;

slime.y = H - 75;

draw();