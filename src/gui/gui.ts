import { mouse, worldToScreen } from "../game";
import { clamp } from "../utils";
import { Vector } from "../vector";
import { DialogueNode, sleep } from "../dialogue";
import { SoundEffect } from "../sound";
import { removeListener } from "process";
import { Color } from "../color";
import { Entity } from "../entity";

export class GUI {
    static init() {
        GUI.cursorElement.id = "cursorElement";
        GUI.cursorElement.classList.add("cursorElement");
        GUI.container.appendChild(GUI.cursorElement);
        TutorialPrompt.container = document.createElement("div");
        TutorialPrompt.container.classList.add("fullscreen");
        GUI.container.appendChild(TutorialPrompt.container);


        let elements = document.getElementsByClassName("ui");
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            let p = element.parentElement;
            let topLevel = true;
            while (p != document.body) {
                if (p.classList.contains("ui")) {
                    topLevel = false;
                    break;
                }
                p = p.parentElement;
            }
            if (topLevel) {
                element.addEventListener("mouseenter", (e) => { mouse.gui++; });
                element.addEventListener("mouseleave", (e) => { mouse.gui = 0; });
            }
        }
        GuiTooltip.container.moving = true;




    }
    static update(dt: number) {
        GuiTooltip.update();
        for (const el of GuiElement.list) {
            if (el.moving)
                el.update(dt);
        }
    }
    static container = document.getElementById("guiContainer");
    static sounds = {
        hover: new SoundEffect("sound/fx/hover3.wav", .7),
        click: new SoundEffect("sound/fx/click.wav", .8),
        talk: new SoundEffect("sound/fx/talk.wav"),
        appear: new SoundEffect("sound/fx/appear.wav", .6),
        hide: new SoundEffect("sound/fx/hide.wav"),
        unhide: new SoundEffect("sound/fx/unhide.wav"),
        discovery: new SoundEffect("sound/fx/ping.wav", .1),
        tutorial: new SoundEffect("sound/fx/tutorial.wav", .2),
    };
    static cursorElement = document.createElement("div");
    static hover(on: boolean) {
        if (on) {
            GUI.sounds.hover.play();
            this.cursorElement.classList.add("hover")
        }
        else {
            this.cursorElement.classList.remove("hover")
        }
    }
    static addHoverListeners(element: HTMLElement) {
        element.addEventListener("mouseenter", () => { GUI.hover(true) })
        element.addEventListener("mouseleave", () => { GUI.hover(false) })
    }
    static healthBar: GuiProgressBar;
    static energyBar: GuiProgressBar;
    static oxygenBar: GuiProgressBar;
    static weaponButton: GuiButton;

}

interface GuiElementOptions {
    parent?: GuiElement,
    content?: string,
    blankStyle?: boolean,
    fillContainer?: boolean
    flexDirection?: "row" | "column";
    alignItems?: "center" | "start" | "end";
    fadeIn?: boolean
    flex?: boolean
    hidden?: boolean
    width?: number
    classes?: string[]
}

interface PositionableGuiElementOptions extends GuiElementOptions {
    position?: Vector,
    centerX?: boolean,
    centerY?: boolean,
    invertHorizontalPosition?: boolean,
    invertVerticalPosition?: boolean,
    blockHover?: boolean
}

interface CollapsibleGuiElementOptions extends GuiElementOptions {
    edge: "left" | "right" | "top" | "bottom",
    position: number,
    positioningEdge?: "left" | "right" | "top" | "bottom",
    collapsed?: boolean,
}

interface TutorialPromptOptions extends PositionableGuiElementOptions {
    keys?: string[]
    duration?: number
}

interface GuiPanelOptions extends GuiElementOptions {
}

interface GuiButtonOptions extends PositionableGuiElementOptions {
    callback: () => void,
    image?: string,
    enabled?: boolean
}

interface GuiProgressBarOptions extends GuiElementOptions {
    progress?: number,
    color?: Color | string,
    label?: string,
    labelWidth?: number,
    warnThreshold?: number
}

export class BaseGuiElement {
    element: HTMLElement;
    topLevel = false;
    constructor(type: keyof HTMLElementTagNameMap, ...classes: string[]) {
        this.element = document.createElement(type);
        for (const c of classes) {
            this.element.classList.add(c);
        }
    }
    addMouseListeners() {
        this.topLevel = true;
        this.element.addEventListener("mouseenter", (e) => { mouse.gui++; });
        this.element.addEventListener("mouseleave", (e) => { mouse.gui = 0; });
    }
}

export class CustomGuiElement extends BaseGuiElement {
    constructor(type: keyof HTMLElementTagNameMap, content = "none", ...classes: string[]) {
        super(type, ...classes)
        this.element.innerText = content;
    }

}

class GuiElement extends BaseGuiElement {
    element: HTMLElement;
    moving = false;
    removed = false;
    constructor(options: GuiElementOptions) {
        super("div");
        if (options.flex === undefined || options.flex) {
            this.element.classList.add("flex");
        }
        if (options.classes) {
            for (const c of options.classes) {
                this.element.classList.add(c);
            }
        }
        if (options.width) this.element.style.width = options.width + "em";
        if (options.alignItems) this.element.style.alignItems = options.alignItems;
        this.element.style.flexDirection = options.flexDirection ?? "";
        GUI.container.appendChild(this.element);
        if (!options.blankStyle)
            this.element.classList.add("ui");
        if (options.fillContainer)
            this.element.classList.add("fill");
        this.content = options.content ?? "";
        GuiElement.list.push(this);
        if (options.parent) {
            options.parent.addChild(this);
        }
        if (options.hidden) this.element.classList.add("hidden");
        if (options.fadeIn) this.fadeIn();
    }
    remove() {
        if (this.removed) return;
        if (this.topLevel) mouse.gui = 0; //TODO Not a clean fix for the mouse bug
        this.removed = true;
        this.element.remove();
        //GUI.container.removeChild(this.element);
        GuiElement.list.splice(GuiElement.list.indexOf(this), 1);
    }
    update(dt: number) {

    }
    addChild(...children: BaseGuiElement[]) {
        for (const child of children) {
            this.element.appendChild(child.element);
            child.element.classList.remove("absolute");
        }
        return this;
    }
    removeChild(child: BaseGuiElement) {
        this.element.removeChild(child.element);
    }
    private _content = "text";

    public set content(content) {
        this._content = content;
        this.element.innerHTML = content.replace(GuiElement.highlightRegex, `<em>$1</em>`).replace(GuiElement.keyPromptRegex, `<kbd>$1</kbd>`);
        for (const node of this.element.childNodes) {
            if (node.nodeType == node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (element.tagName == "KBD") {
                    let k = element.innerText.toLowerCase();
                    if (k == "space") k = " ";
                    let downListener = (e: KeyboardEvent) => {
                        if (!document.body.contains(element)) document.removeEventListener("keydown", downListener);
                        if (e.key.toLowerCase() == k) {
                            element.classList.add("pressed");
                        };
                    }
                    let upListener = (e: KeyboardEvent) => {
                        if (!document.body.contains(element)) document.removeEventListener("keyup", upListener);
                        if (e.key.toLowerCase() == k) {
                            element.classList.remove("pressed");
                        }
                    };
                    document.addEventListener("keydown", downListener);
                    document.addEventListener("keyup", upListener);
                }
            }
        }

    }
    public get content() {
        return this._content;
    }

    public set text(content: string) {
        this._content = content;
        this.element.innerText = content;
    }

    async fadeOut() {
        this.element.classList.add("hidden");
        await sleep(1000);
        this.remove();
        return;
    }

    async fadeIn() {
        this.element.classList.add("hidden");
        await sleep(50);
        this.element.classList.remove("hidden");
        await sleep(1000);
        return;
    }

    static list: GuiElement[] = [];
    static keyPromptRegex = /\[(.+?)\]/g;
    static highlightRegex = /\*(.+?)\*/g;
}

export class PositionableGuiElement extends GuiElement {
    position: Vector;
    invertHorizontalPosition: boolean;
    invertVerticalPosition: boolean;

    constructor(options: PositionableGuiElementOptions) {
        super(options);
        if (!options.parent) {
            this.position = options.position;
            this.invertHorizontalPosition = options.invertHorizontalPosition;
            this.invertVerticalPosition = options.invertVerticalPosition;
            if (options.blockHover ?? true) this.addMouseListeners();
            this.element.classList.add("absolute");
            if (options.centerX) this.element.classList.add("centerX");
            else if (options.position) {
                if (!options.invertHorizontalPosition) this.element.style.left = this.position.x + "px";
                else this.element.style.right = this.position.x + "px";
            }
            if (options.centerY) this.element.classList.add("centerY");
            else if (options.position) {
                if (!options.invertVerticalPosition) this.element.style.top = this.position.y + "px";
                else this.element.style.bottom = this.position.y + "px";
            }
        }
    }
    update(dt: number) {
        if (!this.invertHorizontalPosition) this.element.style.left = this.position.x + "px";
        else this.element.style.right = this.position.x + "px";
        if (!this.invertVerticalPosition) this.element.style.top = this.position.y + "px";
        else this.element.style.bottom = this.position.y + "px";
    }
}

export class CollapsibleGuiElement extends GuiElement {
    container: GuiElement;
    constructor(options: CollapsibleGuiElementOptions) {
        let text = options.content;
        options.content = "";
        let dir = options.flexDirection;
        options.flexDirection = null;
        super(options);
        this.element.classList.add("collapsible", "ui");
        this.element.classList.add("collapsible-" + options.edge);
        let edge: string;
        if (options.positioningEdge) {
            edge = options.positioningEdge;
        }
        else {
            if (options.edge == "right" || options.edge == "left") edge = "top";
            else edge = "left";
        }
        this.element.style[edge as any] = (options.position ?? 0) + "em";
        let clicker = new GuiElement({ parent: this, content: text, blankStyle: true, classes: ["collapsibleClicker"] })
        clicker.element.addEventListener("click", this.toggleCollapse.bind(this));
        GUI.addHoverListeners(clicker.element)
        this.container = new GuiElement({ parent: this, blankStyle: true, classes: ["collapsibleContent"], flexDirection: dir });
        clicker = new GuiElement({ parent: this, content: "Close", blankStyle: true, classes: ["collapsibleClicker"] })
        clicker.element.addEventListener("click", this.toggleCollapse.bind(this));
        GUI.addHoverListeners(clicker.element)
        this.addMouseListeners();
        this.setCollapse(options.hidden);
    }
    async toggleCollapse() {
        GUI.sounds.click.play();
        this.element.classList.toggle("collapsed");
        if (this.element.classList.contains("collapsed")) mouse.gui = 0; //TODO Not a very clean fix for the mouse-blocking-by-hidden-gui bug, as this will trigger clickthrough even if the mouse wasn't hovering over this element
        await sleep(1000);
    }
    async setCollapse(collapsed: boolean) {
        if (collapsed) {
            this.element.classList.add("collapsed");
            mouse.gui = 0; //same as above
        }
        else this.element.classList.remove("collapsed");
        await sleep(1000);
    }
}

export class TutorialPrompt extends PositionableGuiElement {
    awaitDone: Promise<void>;
    panel: GuiPanel;
    constructor(options: TutorialPromptOptions) {
        let c = options.content;
        options.content = "";
        options.centerX = options.centerX ?? true;
        super(options);
        TutorialPrompt.container.appendChild(this.element);
        this.element.classList.add("tutorialPrompt");
        this.fadeIn();
        options.parent = this;
        options.blankStyle = true;
        options.flex = false;
        options.content = c;
        this.panel = new GuiPanel(options);
        GUI.sounds.tutorial.play();
        TutorialPrompt.list.push(this);

        this.awaitDone = new Promise(async (resolve, reject) => {
            if (options.keys) {
                if (options.keys[0] == "e") {
                    let c = async () => { GUI.sounds.click.play(); await this.fadeOut(); resolve() };
                    this.element.onclick = c;
                }
                let a = async (e: KeyboardEvent) => {
                    if (this.removed) return;
                    if (TutorialPrompt.list[TutorialPrompt.list.length - 1] == this) {
                        for (const k of options.keys) {
                            if (e.key.toLowerCase() == k.toLowerCase()) {
                                document.removeEventListener("keyup", a);
                                await this.fadeOut();
                                resolve();
                                return;
                            }
                        }
                    }
                };
                document.addEventListener("keyup", a);
            }
            if (options.duration) {
                await sleep(1000 * options.duration);
                await this.fadeOut();
                resolve();
            }
        })
    }

    remove(): void {
        TutorialPrompt.list.pop();
        super.remove();
    }
    static list: TutorialPrompt[] = [];
    static container: HTMLDivElement;
}

export class GuiPanel extends GuiElement {
    constructor(options: GuiPanelOptions) {
        super(options);
    }
}

export class GuiProgressBar extends GuiElement {
    private fillElement: HTMLDivElement;
    private smoothFillElement: HTMLDivElement;
    private barElement: HTMLDivElement;
    private labelElement: HTMLDivElement;
    private _fill: number;
    warnThreshold = .3;
    constructor(options: GuiProgressBarOptions) {
        options.color = options.color ?? Color.white();
        options.blankStyle = true;
        options.flex = true;
        options.flexDirection = "row"
        options.progress = options.progress ?? .66;
        super(options);
        this.warnThreshold = options.warnThreshold ?? 0;
        this.element.classList.add("progressBarContainer")
        if (options.label) {
            this.labelElement = document.createElement("div");
            this.element.appendChild(this.labelElement);
            this.labelElement.innerText = options.label;
            if (options.labelWidth) {
                this.labelElement.style.minWidth = options.labelWidth + "em";
                this.labelElement.style.textAlign = "right"
            }
        }
        this.barElement = document.createElement("div");
        this.barElement.classList.add("progressBar");
        this.element.appendChild(this.barElement);
        this.fillElement = document.createElement("div");
        this.fillElement.classList.add("progressBarFill")
        this.barElement.appendChild(this.fillElement);
        this.smoothFillElement = document.createElement("div");
        this.smoothFillElement.classList.add("progressBarFill", "smoothFill")
        this.barElement.appendChild(this.smoothFillElement);
        if (options.color instanceof Color)
            this.fillElement.style.backgroundColor = options.color.toCSS();
        else
            this.fillElement.style.backgroundColor = `var(--color-${options.color})`;
        this.smoothFillElement.style.backgroundColor = this.fillElement.style.backgroundColor;
        this.fill = options.progress;
    }
    set fill(f: number) {
        if (this.warnThreshold > f && this.warnThreshold < this._fill)
            this.barElement.classList.add("flashRed");
        if (this.warnThreshold < f && this.warnThreshold > this._fill)
            this.barElement.classList.remove("flashRed");
        this._fill = f;
        this.fillElement.style.width = `${f * 100}%`;
        this.smoothFillElement.style.width = `${f * 100}%`;
    }
    get fill() {
        return this._fill;
    }
}

export class DialogBox extends GuiElement {
    static container = document.getElementById("messagesContainer");
    static wrapper = document.getElementById("dialogContainer");
    static conversationElement = document.getElementById("conversationWrapper");
    constructor(content = "none", speaker = 0) {
        super({ content });
        this.element.classList.add("dialogBox");
        if (speaker == 1) this.element.classList.add("dialogLeft");
        else if (speaker == 2) this.element.classList.add("dialogRight");
        else this.element.classList.add("dialogMiddle")
        DialogBox.container.appendChild(this.element);
        GUI.sounds.talk.play();
        //this.element.scrollIntoView({behavior:"smooth",})
        DialogBox.wrapper.scrollBy({ top: this.element.offsetHeight + 500, behavior: "smooth" })
    }
}

class DialogChoice extends DialogBox {
    node: DialogueNode;
    constructor(content = "none", node: DialogueNode, parent: DialogChoices) {
        super(content, 2);
        this.node = node;
        this.element.classList.add("button", "dialogChoice");
        this.element.onclick = () => {
            GUI.sounds.click.play();
            parent.remove();
            this.select();
            DialogBox.wrapper.scrollBy({ top: -1, behavior: "smooth" })
        };
        GUI.addHoverListeners(this.element)

    }
    select() {

    }
}

export class DialogChoices {
    children: DialogChoice[] = [];
    wrapper: HTMLDivElement;
    constructor(choices: { content: string, node: DialogueNode }[] = []) {
        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("dialogChoiceWrapper", "ui");
        for (let i = 0; i < choices.length; i++) {
            const options = choices[i];
            let dc = new DialogChoice(options.content, options.node, this)
            this.wrapper.appendChild(dc.element);
            this.children.push(dc);
        }
        for (const options of choices) {
        }
        DialogBox.container.appendChild(this.wrapper);
        DialogBox.wrapper.scrollBy({ top: 500, behavior: "smooth" })

    }
    remove() {
        for (const choice of this.children) {
            choice.remove()
        }
        this.wrapper.remove();
    }
    async awaitSelection() {
        return new Promise<DialogueNode>((resolve, reject) => {
            for (const c of this.children) {
                c.select = () => resolve(c.node);
            }
        })
    }
}

export class GuiLabel extends PositionableGuiElement {
    worldPosition: Vector;
    moving = true;
    lastOpacity = 1;
    constructor(position: Vector, content = "none") {
        super({ position: new Vector(0, 0), content: content });
        this.worldPosition = position.result();
        this.element.classList.add("label");
    }
    update(dt: number): void {
        this.position = worldToScreen(this.worldPosition.result()).add(new Vector(0, 100));
        let op = clamp((.25 - Math.abs(this.position.x / window.innerWidth - .5)) * 8);
        if (this.lastOpacity != op || op > 0) {
            if (op <= 0) this.element.style.display = "none";
            else {
                this.element.style.opacity = op + "";
                this.element.style.display = "flex";
                super.update(dt);
            }
            this.lastOpacity = op;
        }
    }
}

export class GuiSpeechBubble extends PositionableGuiElement {
    parentEntity: Entity;
    moving = true;
    lastOpacity = 1;
    duration = 5;
    age = 0;
    constructor(entity: Entity, content = "none", duration = 3) {
        super({ position: new Vector(0, 0), content: content, classes: ["speechBubble"] });
        this.parentEntity = entity;
        this.duration = duration / 2; //TODO Stupid fix because deltatime in the whole game is divided by half and I don't have time to fix it now
    }
    update(dt: number): void {
        this.position = worldToScreen(this.parentEntity.position.result()).add(new Vector(0, -250));
        this.age += dt;
        if (this.age >= this.duration)
            this.remove();
        else
            super.update(dt);
    }
}

export class GuiTooltip extends GuiElement {
    private _visible = true;
    constructor(content = "none") {
        super({ content: content, parent: GuiTooltip.container });
        this.element.classList.add("tooltip");
    }
    static container = new PositionableGuiElement({ position: new Vector(0, 0), blockHover: false, blankStyle: true, alignItems: "start", classes: ["tooltipContainer"] });
    static update() {
        this.container.position = new Vector(mouse.x + 10, mouse.y + 10);
    }

    public get visible(): boolean {
        return this._visible;
    }
    public set visible(e: boolean) {
        if (e != this._visible) {
            this._visible = e;
            this.element.style.visibility = this._visible ? "visible" : "hidden";
        }
    }

}

export class GuiButton extends PositionableGuiElement {
    private _enabled = true;
    private callback: () => void;
    constructor(options: GuiButtonOptions) {
        super(options);
        this.element.classList.add("button");
        if (options.image) {
            let c = "<img src=" + options.image + ">";
            if (!options.content)
                this.element.classList.add("img");
            else c = c + options.content;
            this.content = c;
        }
        if (options.enabled !== undefined) {
            this.enabled = options.enabled;
        }
        this.callback = options.callback;
        this.element.onclick = this.click.bind(this);
        GUI.addHoverListeners(this.element)

    }
    set enabled(e) {
        this._enabled = e;
        if (e)
            this.element.classList.remove("disabled");
        else
            this.element.classList.add("disabled");
    }
    get enabled() {
        return this._enabled;
    }
    click() {
        GUI.sounds.click.play();
        this.callback();
    }
}

export class GuiSplash {
    element: HTMLElement;
    constructor(content = "none", newDiscovery = true, duration = 5) {
        this.element = document.createElement("h1");
        GUI.container.appendChild(this.element);
        this.element.classList.add("splash");
        this.element.innerText = content;
        this.element.style.animationDuration = duration + "s";
        if (newDiscovery) {
            GUI.sounds.discovery.play();
            this.element.classList.add("discovery");
        }
        setTimeout(() => {
            this.element.remove();
        }, duration * 1000);
    }
}