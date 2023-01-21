performance.mark("1");
/** 
 * @type {HTMLCanvasElement}
*/
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pcanvas = document.getElementById("particleCanvas");
const pctx = pcanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
pctx.imageSmoothingEnabled = false;
let dimensions = { x: 512, y: 216 };
let scaleRatioY = window.innerHeight / 280
let scaleRatioX = window.innerWidth / 200
let scaleRatio = Math.min(scaleRatioX, scaleRatioY);
dimensions = { x: Math.floor(window.innerWidth / scaleRatio), y: Math.floor(window.innerHeight / scaleRatio) }
//const dimensions = { x: 3440, y: 1440 };
canvas.width = dimensions.x;
canvas.height = dimensions.y;
pcanvas.width = dimensions.x;
pcanvas.height = dimensions.y;

let mouseCoords = { x: 0, y: 0 }

document.addEventListener("mousemove", e => {
    mouseCoords.x = Math.floor(e.clientX / scaleRatio);
    mouseCoords.y = Math.floor(e.clientY / scaleRatio);
})

const renderer = new Renderer(canvas);
const particleRenderer = new Renderer(pcanvas);

const infoText = document.getElementById("info");

let maxGrowStepSize = .01;
let growSpeed = 1;

let windX = random(-10, 10);

perf("init");

const leafGen = 7;
const treeSettings = new Map()
treeSettings.set("Oak", {
    lifetime: .7,
    minSplitTime: .3,
    thickness: 4,
    gravityInitial: .3,
    warping: 5,
    leafGeneration: 5,
    gravityPerGen: .35,
    angularDifference: 1.3,
    leafAmount: 6,
    leafLength: .17,
    leafGravity: 0,
    leafThickness: 3,
    splitEndMax: 5,
    splitMiddleMax: 4,
    skipGenMax: 0,
    leafStepsAdditional: 1,
    colorBase: new Color(50, 40, 35),
    colorLeaves: new Color(60, 100, 30)
});
treeSettings.set("Sakura", {
    lifetime: .5,
    minSplitTime: .8,
    thickness: 6,
    gravityInitial: 3,
    warping: 40,
    leafGeneration: 12,
    gravityPerGen: 1,
    angularDifference: 1,
    leafAmount: 3,
    leafLength: .6,
    leafGravity: 0,
    leafThickness: 3,
    splitEndMax: 2,
    splitMiddleMax: 2,
    leafStepsAdditional: 1,
    colorBase: new Color(50, 30, 30),
    colorLeaves: new Color(220, 140, 150)
});
treeSettings.set("Palm", {
    lifetime: 1.1,
    minSplitTime: 2,
    thickness: 3,
    gravityInitial: -.5,
    warping: 3,
    leafGeneration: 2,
    gravityPerGen: .5,
    angularDifference: 0,
    leafAmount: 10,
    leafLength: .3,
    leafGravity: -7,
    leafThickness: 3,
    splitEndMax: 1,
    splitMiddleMax: 1,
    skipGenMax: 0,
    leafStepsAdditional: 2,
    colorBase: new Color(60, 30, 25),
    colorLeaves: new Color(40, 100, 20)
});
treeSettings.set("OakWinter", {
    lifetime: .7,
    minSplitTime: .3,
    thickness: 4,
    gravityInitial: .3,
    warping: 20,
    leafGeneration: 6,
    gravityPerGen: .1,
    angularDifference: 1.4,
    leafAmount: 1,
    leafLength: .3,
    leafGravity: 0,
    leafThickness: 3,
    splitEndMax: 4,
    splitMiddleMax: 3,
    skipGenMax: 1,
    leafStepsAdditional: 1,
    colorBase: new Color(70, 80, 85),
    colorLeaves: new Color(185, 190, 200),
});
treeSettings.set("Birch", {
    lifetime: .7,
    minSplitTime: .6,
    thickness: 3,
    gravityInitial: .5,
    warping: 3,
    leafGeneration: 6,
    gravityPerGen: .35,
    angularDifference: .9,
    leafAmount: 6,
    leafLength: 1.5,
    leafGravity: -30,
    leafThickness: 1,
    splitEndMax: 4,
    splitMiddleMax: 6,
    skipGenMax: 0,
    leafStepsAdditional: 0,
    colorBase: new Color(180, 170, 160),
    colorLeaves: new Color(70, 110, 20),
});
treeSettings.set("Flower", {
    lifetime: .09,
    minSplitTime: 2,
    thickness: 1,
    gravityInitial: -1,
    warping: 7,
    leafGeneration: 2,
    gravityPerGen: .35,
    angularDifference: .9,
    leafAmount: 6,
    leafLength: .15,
    leafGravity: 0,
    leafThickness: 1,
    splitEndMax: 1,
    splitMiddleMax: 1,
    skipGenMax: 0,
    leafStepsAdditional: 0,
    colorBase: new Color(20, 120, 40),
    colorLeaves: new Color(230, 200, 160),
});
treeSettings.set("Grass", {
    lifetime: .02,
    minSplitTime: 2,
    thickness: 1,
    gravityInitial: 100,
    warping: 0,
    leafGeneration: 2,
    gravityPerGen: .35,
    angularDifference: .9,
    leafAmount: 1,
    leafLength: .1,
    leafGravity: 0,
    leafThickness: 1,
    splitEndMax: 1,
    splitMiddleMax: 1,
    skipGenMax: 0,
    leafStepsAdditional: 0,
    colorBase: new Color(20, 120, 40),
    colorLeaves: new Color(20, 150, 40),
});
treeSettings.set("Roots", {
    lifetime: .3,
    minSplitTime: .5,
    thickness: 2,
    gravityInitial: -.1,
    warping: 20,
    leafGeneration: 5,
    gravityPerGen: 3,
    angularDifference: 1.9,
    leafAmount: 0,
    leafLength: 1,
    leafGravity: 0,
    leafThickness: 1,
    splitEndMax: 4,
    splitMiddleMax: 2,
    skipGenMax: 0,
    leafStepsAdditional: 0,
    colorBase: new Color(60, 30, 20),
    colorLeaves: Color.Blue,
});
treeSettings.set("Grassroots", {
    lifetime: .02,
    minSplitTime: 2,
    thickness: 3,
    gravityInitial: -.1,
    warping: 20,
    leafGeneration: 2,
    gravityPerGen: .35,
    angularDifference: .9,
    leafAmount: 0,
    leafLength: 1,
    leafGravity: 0,
    leafThickness: 1,
    splitEndMax: 0,
    splitMiddleMax: 0,
    skipGenMax: 0,
    leafStepsAdditional: 0,
    colorBase: new Color(60, 100, 20),
    colorLeaves: Color.Blue,
});

const terrainTypes = new Map();
terrainTypes.set("Dirt", {
    color: new Color(80, 30, 30),
    fertility: 1
})

class TerrainTile {
    type;
    x;
    y;
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        renderer.setPixel(this.x, this.y, this.type.color.randomise(5));
        renderer.pixelData[x][y].terrain = this;
    }

}

class Planter {
    angle;
    startX;
    startY;
    x;
    y;
    fx;
    fy;
    speed = 100;
    age = 0;
    lifeTime;
    splitTime;
    generation = 1;
    thickness;
    gravity;
    color;
    enabled = true;

    constructor(x, y, angle = random(0, Math.PI * 2), settings = treeSettings.values().next(), generation = 1) {
        this.generation = generation;
        this.fx = x;
        this.fy = y;
        this.x = Math.floor(this.fx);
        this.y = Math.floor(this.fy);
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.settings = settings;
        this.lifeTime = this.settings.lifetime * random(.4, 1.6);
        this.splitTime = this.lifeTime * random(this.settings.minSplitTime, (this.settings.maxSplitTime ?? (this.settings.minSplitTime + .1)));
        this.thickness = this.settings.thickness;
        this.gravity = this.settings.gravityInitial;
        this.color = this.settings.colorBase.randomise(7);
        if (this.settings != treeSettings.get("Roots") && this.settings != treeSettings.get("Grassroots") && this.generation == 1) {
            if (this.thickness == 1)
                new Planter(this.x, this.y, Math.PI / 2, treeSettings.get("Grassroots"));
            else if (this.thickness > 1)
                new Planter(this.x, this.y, Math.PI / 2, treeSettings.get("Roots")).thickness = this.thickness;

        }
        Planter.list.push(this);
    }
    update() {
        this.angle += random(-this.settings.warping, this.settings.warping) * growDeltaTime;
        this.angle = rotateAngle(this.angle, Math.PI / -2, this.gravity * growDeltaTime);
        //this.angle = rotateAngle(this.angle, Math.atan2(mouseCoords.y - this.fy, mouseCoords.x - this.fx), .02 * growDeltaTime * Math.hypot(mouseCoords.y - this.fy, mouseCoords.x - this.fx));
        this.fx += Math.cos(this.angle) * this.speed * growDeltaTime;
        this.fy += Math.sin(this.angle) * this.speed * growDeltaTime;
        if (this.fx >= dimensions.x) this.fx = dimensions.x - 1;
        if (this.fy >= dimensions.y) this.fy = dimensions.y - 1;
        if (this.fx < 0) this.fx = 0;
        if (this.fy < 0) this.fy = 0;
        this.x = Math.floor(this.fx);
        this.y = Math.floor(this.fy);
        this.age += growDeltaTime;
        if (this.age > this.splitTime) {
            this.split(0, this.settings.splitMiddleMax);
            this.splitTime += random(this.settings.minSplitTime, this.settings.maxSplitTime ?? (this.settings.minSplitTime * 2));
        }
        renderer.fillRect(Math.ceil(this.x - this.thickness / 2), Math.ceil(this.y - this.thickness / 2), this.thickness, this.thickness, this.color);

        //particleRenderer.drawLine(mouseCoords.x, mouseCoords.y, this.x, this.y, this.color.add(new Color(0, 0, 0, -250+Math.hypot(mouseCoords.y - this.fy, mouseCoords.x - this.fx))));

        if (this.age > this.lifeTime) {
            this.split(1, this.settings.splitEndMax);
            renderer.fillRect(this.x, this.y, 1, 1, this.color);
            this.enabled = false;
            if (this.generation >= this.settings.leafGeneration) {
                //Planter.leaves.push({ x1: this.startX, y1: this.startY, x2: this.x, y2: this.y, thickness: this.thickness, color: this.color, life: random(3, 6) });
                if (random(0, 1) < (2 / (this.settings.leafAmount * this.settings.leafGeneration * this.settings.splitEndMax * this.settings.splitMiddleMax))) {
                    let particle = new Particle(this.x, this.y, this.angle);
                    particle.planterSettings = this.settings;
                    particle.color = this.color;
                }
            }
            Planter.list.splice(Planter.list.indexOf(this), 1);
        }
    }
    split(min = 0, max = 3) {
        let r = randomInt(min, max);
        let angularDifference = this.settings.angularDifference;
        if (this.generation >= this.settings.leafGeneration) r = 1;
        if (this.generation >= this.settings.leafGeneration + (this.settings.leafStepsAdditional ?? 0)) r = 0;
        if (r == 1) angularDifference = 0.1;
        if (this.generation + 1 == this.settings.leafGeneration) {
            angularDifference = 3;
            r = this.settings.leafAmount;
        }

        for (let i = 0; i < r; i++) {
            //console.log(this.generation, r, this.settings.leafGeneration);
            let pla = new Planter(this.x, this.y, rotateAngle((this.angle + random(-angularDifference, angularDifference)), Math.PI / -2, .3), this.settings, this.generation + 1);
            pla.thickness = Math.max(1, this.thickness - 1);
            if (this.generation < this.settings.leafGeneration) pla.generation += randomInt(0, (this.settings.skipGenMax ?? 1))
            pla.lifeTime /= pla.generation;
            pla.splitTime /= pla.generation / pla.generation;
            pla.gravity -= pla.generation * this.settings.gravityPerGen
            if (pla.generation >= this.settings.leafGeneration) {
                //pla.enabled = false;
                pla.color = this.settings.colorLeaves.randomise(20);
                pla.lifeTime *= this.settings.leafLength;
                pla.thickness = Math.max(1, this.settings.leafThickness - (pla.generation - this.settings.leafGeneration))
                pla.gravity = this.settings.leafGravity;
            }
        }
    }
}
Planter.list = [];
Planter.leaves = [];

class Particle {
    planterSettings;
    angle;
    x;
    y;
    fx;
    fy;
    vx = 0;
    vy = 0;
    velocity = 0;
    speed = 120;
    age = 0;
    lifeTime;
    size;
    gravity;
    color;
    drag = 1.8;
    lift = .002;
    aeroRandom = 7;
    enabled = true;

    constructor(x, y, angle = random(0, Math.PI * 2)) {
        this.fx = x;
        this.fy = y;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        //this.settings = settings;
        this.lifeTime = 20;
        this.size = 1
        this.gravity = 30;
        this.color = new Color(150, 150, 150).randomise(100);
        Particle.list.push(this);
        if (Particle.list.length > 200) Particle.list.shift();
    }
    update() {
        this.vy *= (1 - (this.drag * deltaTime));
        this.vx *= (1 - (this.drag * deltaTime));

        if (this.fy >= dimensions.y - 1) {
            this.vy = 0;
            if (this.planterSettings && random(0, 1) < (2 / (this.planterSettings.leafAmount * this.planterSettings.leafGeneration * this.planterSettings.splitEndMax * this.planterSettings.splitMiddleMax))) {
                new Planter(this.x, dimensions.y, random(Math.PI / -2 - .3, Math.PI / -2 + .3), this.planterSettings);
            }
            this.destroy();
        }
        else {
            if (this.y < dimensions.y && renderer.pixelData[this.x][this.y + 1].terrain?.type == terrainTypes.get("Dirt")) {
                //if (this.planterSettings && random(0, 1) < (2 / (this.planterSettings.leafAmount * this.planterSettings.leafGeneration * this.planterSettings.splitEndMax * this.planterSettings.splitMiddleMax))) {
                new Planter(this.x, this.y + 1, random(Math.PI / -2 - .3, Math.PI / -2 + .3), this.planterSettings);
                //}
                this.destroy();
            }
            this.vx += (random(-this.aeroRandom, this.aeroRandom) * this.velocity + windX) * deltaTime;
            if (this.fy < dimensions.y - 20) this.vy += random(-this.aeroRandom, this.aeroRandom) * this.velocity * deltaTime;
            this.vy += this.gravity * deltaTime;
            this.vy -= Math.abs(this.vx) * this.lift;
        }
        this.fx += this.vx * deltaTime;
        this.fy += this.vy * deltaTime;
        if (this.fx >= dimensions.x) this.fx = dimensions.x - 1;
        if (this.fy >= dimensions.y) this.fy = dimensions.y - 1;

        if (this.fx < 0) this.fx = 0;
        if (this.fy < 0) this.fy = 0;
        this.x = Math.floor(this.fx);
        this.y = Math.floor(this.fy);
        this.age += deltaTime;
        this.velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        particleRenderer.fillRect(Math.ceil(this.x - this.size / 2), Math.ceil(this.y - this.size / 2), this.size, this.size, this.color);

        if (this.age > this.lifeTime) {
            this.destroy();
        }
    }
    destroy() {
        this.enabled = false;
        Particle.list.splice(Particle.list.indexOf(this), 1);
    }
}
Particle.list = [];

function generate() {
    renderer.clear();
    let cy = dimensions.y - 50;
    let dy = 0;
    let my = dimensions.y;
    for (let x = 0; x < dimensions.x; x++) {
        dy += random(-.05, .05);
        cy += dy;
        cy = Math.min(Math.max(50, cy), dimensions.y - 10);
        let ry = Math.round(cy);
        if (ry < my) my = ry;
        for (let y = ry; y < dimensions.y; y++) {
            new TerrainTile(x, y, terrainTypes.get("Dirt"));
        }
    }
    Planter.list = [];
    //Particle.list = [];
    //new Planter(dimensions.x / 2, dimensions.y - 40, random(Math.PI / -2 - .3, Math.PI / -2 + .3), Array.from(treeSettings.values())[randomInt(0, 4)]);
    new Particle(dimensions.x * random(0.4, 0.6), my, random(Math.PI / 2 - .3, Math.PI / 2 + .3)).planterSettings = Array.from(treeSettings.values())[randomInt(0, 4)];
    for (let index = 0; index < 5; index++) {
        new Particle(dimensions.x * random(0.2, 0.8), my, random(Math.PI / 2 - .3, Math.PI / 2 + .3)).planterSettings = treeSettings.get("Flower");
    }
    for (let index = 0; index < 35; index++) {
        new Particle(dimensions.x * random(0, 1), my, random(Math.PI / 2 - .3, Math.PI / 2 + .3)).planterSettings = treeSettings.get("Grass");
        //new Planter(dimensions.x * random(0, 1), dimensions.y - 40, random(Math.PI / -2 - .3, Math.PI / -2 + .3), treeSettings.get("Grass"))
    }
    //new Particle(dimensions.x / 2, dimensions.y / 2);
}
generate();



let deltaTime, growDeltaTime;
let newTime = Date.now();
let oldTime = Date.now();
perf("initEnd");
window.requestAnimationFrame(update);


function update() {
    newTime = Date.now();
    deltaTime = (newTime - oldTime) / 1000;
    oldTime = newTime;
    for (const particle of Particle.list) {
        if (particle.enabled) particle.update();
    }
    planterStepsElapsed = 0;
    growDeltaTime = Math.min(maxGrowStepSize, deltaTime * growSpeed);
    planterStepsPerUpdate = Math.max(1, Math.floor(deltaTime / growDeltaTime * growSpeed));
    planterUpdate();
    let a = 20;
    //renderer.addRect(0, 0, dimensions.x, dimensions.y, new Color(a*deltaTime, a*deltaTime, a*deltaTime, a*deltaTime));
    for (let index = 0; index < 200; index++) {
        //particleRenderer.drawThickLine(randomInt(20,180), randomInt(20,180), mouseCoords.x, mouseCoords.y, 2, Color.Red);
    }
    /* for (const leaf of Planter.leaves) {
        particleRenderer.drawThickLine(leaf.x1, leaf.y1, leaf.x2, leaf.y2, leaf.thickness, leaf.color);
        leaf.life -= deltaTime;
        leaf.color = leaf.color.add(new Color(-a * deltaTime * .01, -a * deltaTime * .8, -a * deltaTime, 0));
        if (leaf.life <= 0) {
            Planter.leaves.splice(Planter.leaves.indexOf(leaf), 1);
            if (random(0, 1) > .95) {
                let p = new Particle(leaf.x1, leaf.y1);
                p.vx = 0;
                p.vy = 0;
                p.color = leaf.color;
            }
        }
    } */
    renderer.render();
    particleRenderer.render();
    particleRenderer.clear();

    infoText.innerText = perf("tick") + "\n" + Particle.list.length;
    //setTimeout(() => {
    window.requestAnimationFrame(update);
    //}, 50);
    //renderer.ctx.font = "Serif Pixel-7";
}

let planterStepsPerUpdate = 1;
let planterStepsElapsed = 0;

function planterUpdate() {
    planterStepsElapsed++;
    for (const planter of Planter.list) {
        if (planter.enabled) planter.update();
    }
    if (Planter.list.length > 0 && planterStepsElapsed < planterStepsPerUpdate) planterUpdate();
}

function perf(name = "Performance") {
    performance.mark("2");
    const perf = performance.measure("perf", "1", "2").duration.toFixed(1) + " ms";
    performance.mark("1");
    //console.log(name + ": " + perf);
    return (perf);
}

function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function random(min, max) {

    return (Math.random() * (max - min)) + min;
}

function randomElement(array) {
    return array[randomInt(0, array.length - 1)];
}

function rotateAngle(from, to, amount) {
    amount = Math.min(1, Math.max(-1, amount))
    // Get the difference between the current angle and the target angle
    var netAngle = (from - to + Math.PI * 2) % (Math.PI * 2);
    var delta = Math.min(Math.abs(netAngle - Math.PI * 2), netAngle, amount);
    var sign = (netAngle - Math.PI) >= 0 ? 1 : -1;
    // Turn in the closest direction to the target
    from += sign * delta + Math.PI * 2;
    from %= Math.PI * 2;
    return from;
}
