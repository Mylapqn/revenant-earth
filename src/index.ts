import { initGame, mouse } from "./game";
import { BaseGuiElement, CustomGuiElement, DialogBox, GUI, GuiButton, GuiPanel, GuiSplash, PositionableGuiElement } from "./gui/gui";
import { SoundManager } from "./sound";

GUI.container.classList.add("mainMenu");

let mainMenuContainer: PositionableGuiElement;
let menuActive = true;
let menuSound: HTMLAudioElement;

class MenuBackground {
    element: HTMLDivElement;
    depth: number;
    constructor(url: string, depth: number) {
        this.depth = depth;
        this.element = document.createElement("div");
        this.element.classList.add("menubg");
        this.element.style.backgroundImage = `url(menu-bg/${url})`;
        if (depth < 0) {
            this.element.classList.add("menustation")
        }
        if (depth >= .1) {
            this.element.classList.add("menufg");
        }
        if (depth >= .2) {
            this.element.classList.add("menufg2");
        }
        MenuBackground.list.push(this);
        mainMenuContainer.element.appendChild(this.element);
    }
    update() {
        this.element.style.left = -(mouse.x - window.innerWidth / 2) * this.depth + "px";
        this.element.style.top = -(mouse.y - window.innerHeight / 2) * this.depth + "px";
    }
    static list: MenuBackground[] = [];
}

function init() {
    SoundManager.music.menu.play();
    mainMenuContainer = new PositionableGuiElement({ centerX: true, centerY: true, blankStyle: true, fillContainer: true });
    new MenuBackground("1.png", -.02);
    new MenuBackground("2.png", .02);
    new MenuBackground("3.png", .04);
    new MenuBackground("4.png", .07);
    new MenuBackground("5.gif", .09);
    new MenuBackground("6.gif", .12);
    new MenuBackground("7.gif", .2);
    mainMenuContainer.addChild(new CustomGuiElement("h1", "Revenant Earth", "gameTitle"));
    let buttonPanel = new GuiPanel({ blankStyle: true, parent: mainMenuContainer, flexDirection: "column" });
    buttonPanel.addChild(
        new GuiButton({ content: "NEW GAME", callback: startGame, fillContainer: true }),
        new GuiPanel({ blankStyle: true, flexDirection: "row" })
            .addChild(
                new GuiButton({ content: "CONTINUE", callback: continueGame }),
                new GuiButton({ content: "EXIT", callback: () => { window.location.href = "index.html"; } })
            )
    );
    menuActive = true;
    menuUpdate();
}

function menuUpdate() {
    for (const bg of MenuBackground.list) {
        bg.update();
    }
    if (menuActive)
        requestAnimationFrame(menuUpdate);
}

function startGame() {
    SoundManager.music.menu.pause();
    menuActive = false;
    let black = document.createElement("div");
    black.classList.add("fade");
    document.body.appendChild(black);
    setTimeout(() => {
        black.style.opacity = "1";
    }, 1);
    setTimeout(() => {

        GUI.container.classList.remove("mainMenu");
        mainMenuContainer.remove();

        mouse.gui = 0;
        let crashAudio = new Audio("sound/fx/crash2.ogg");
        crashAudio.volume = .35;
        crashAudio.play();
        setTimeout(() => {
            let a = new CustomGuiElement("div", "The following game is a demo not representative of the final product.", "introText", "ui", "blank", "small");
            black.appendChild(a.element);
            setTimeout(() => {
                let b = new CustomGuiElement("div", "REVENANT EARTH", "introText", "ui", "blank", "big");
                black.appendChild(b.element);
            }, 10000);
        }, 1000);
    }, 2000);
    setTimeout(() => {
        initGame();
        setTimeout(() => {
            black.style.opacity = "0";
            setTimeout(() => {
                black.remove();
            }, 2000);
        }, 2000);
    }, 22000);
}

function continueGame() {
    SoundManager.music.menu.pause();
    menuActive = false;
    let black = document.createElement("div");
    black.classList.add("fade");
    document.body.appendChild(black);
    setTimeout(() => {
        black.style.opacity = "1";
    }, 1);
    setTimeout(() => {
        GUI.container.classList.remove("mainMenu");
        mainMenuContainer.remove();
        mouse.gui = 0;
        initGame(true);
        black.style.opacity = "0";
        setTimeout(() => {
            black.remove();
        }, 2000);
    }, 2000);
}

init();

