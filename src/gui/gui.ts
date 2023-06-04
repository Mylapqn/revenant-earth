import { mouse, worldToScreen } from "../game";
import { clamp } from "../utils";
import { Vector } from "../vector";
import { DialogueNode, sleep } from "../dialogue";
import { SoundEffect } from "../sound";
import { removeListener } from "process";

export class GUI {
    static init() {
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
    }
    static update(dt: number) {
        for (const el of GuiElement.list) {
            if (el.moving)
                el.update();
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
}

interface PositionableGuiElementOptions extends GuiElementOptions {
    position?: Vector,
    centerX?: boolean,
    centerY?: boolean,
    invertHorizontalPosition?: boolean,
    invertVerticalPosition?: boolean,
    blockHover?: boolean
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

export class BaseGuiElement {
    element: HTMLElement;
    constructor(type: keyof HTMLElementTagNameMap, ...classes: string[]) {
        this.element = document.createElement(type);
        for (const c of classes) {
            this.element.classList.add(c);
        }
    }
    addMouseListeners() {
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
        if (options.width) this.element.style.width = options.width + "em";
        if (options.alignItems) this.element.style.alignItems = options.alignItems;
        this.element.style.flexDirection = options.flexDirection ?? "column";
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
        this.removed = true;
        this.element.remove();
        //GUI.container.removeChild(this.element);
        GuiElement.list.splice(GuiElement.list.indexOf(this), 1);
    }
    update() {

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
    update() {
        if (!this.invertHorizontalPosition) this.element.style.left = this.position.x + "px";
        else this.element.style.right = this.position.x + "px";
        if (!this.invertVerticalPosition) this.element.style.top = this.position.y + "px";
        else this.element.style.bottom = this.position.y + "px";
    }
}

export class TutorialPrompt extends PositionableGuiElement {
    awaitDone: Promise<void>;
    constructor(options: TutorialPromptOptions) {
        let c = options.content;
        options.content = "";
        options.centerX = options.centerX ?? true;
        super(options);
        this.element.classList.add("tutorialPrompt");
        this.fadeIn();
        options.parent = this;
        options.blankStyle = true;
        options.flex = false;
        options.content = c;
        new GuiPanel(options);
        GUI.sounds.tutorial.play();
        this.awaitDone = new Promise(async (resolve, reject) => {
            if (options.keys) {
                let a = async (e: KeyboardEvent) => {
                    if (this.removed) return;
                    for (const k of options.keys) {
                        if (e.key.toLowerCase() == k.toLowerCase()) {
                            document.removeEventListener("keyup", a);
                            await this.fadeOut();
                            resolve();
                            return;
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
}

export class GuiPanel extends GuiElement {
    constructor(options: GuiPanelOptions) {
        super(options);
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
        this.element.onmouseenter = () => { GUI.sounds.hover.play(); }
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
    update(): void {
        this.position = worldToScreen(this.worldPosition.result()).add(new Vector(0, 100));
        let op = clamp((.25 - Math.abs(this.position.x / window.innerWidth - .5)) * 8);
        if (this.lastOpacity != op || op > 0) {
            if (op <= 0) this.element.style.display = "none";
            else {
                this.element.style.opacity = op + "";
                this.element.style.display = "flex";
                super.update();
            }
            this.lastOpacity = op;
        }
    }
}

export class GuiTooltip extends PositionableGuiElement {
    moving = true;
    constructor(content = "none") {
        super({ position: new Vector(0, 0), content: content, blockHover: false });
        this.element.classList.add("tooltip");
    }
    update(): void {
        this.position = new Vector(mouse.x + 10, mouse.y + 10);
        super.update();
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
        this.element.onmouseenter = () => { GUI.sounds.hover.play(); }
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