import { removeAllListeners } from "process";
import { mouse, worldToScreen } from "../game";
import { clamp } from "../utils";
import { Vector } from "../vector";
import { DialogueNode } from "../dialogue";

export class GUI {
    static init() {
        this.sounds.hover.volume = .35;
        this.sounds.click.volume = .4;
        this.sounds.appear.volume = .3;
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
        hover: new Audio("sound/fx/hover3.wav"),
        click: new Audio("sound/fx/click.wav"),
        talk: new Audio("sound/fx/talk.wav"),
        appear: new Audio("sound/fx/appear.wav"),
        hide: new Audio("sound/fx/hide.wav"),
        unhide: new Audio("sound/fx/unhide.wav"),
    };
}

interface GuiElementOptions {
    parent?: GuiElement,
    content?: string,
    blankStyle?: boolean,
    fillContainer?: boolean
}

interface PositionableGuiElementOptions extends GuiElementOptions {
    position?: Vector,
    centerX?: boolean,
    centerY?: boolean,
}

interface GuiPanelOptions extends GuiElementOptions {
    flexDirection?: "row" | "column";
}

interface GuiButtonOptions extends PositionableGuiElementOptions {
    callback: () => void
}

export class BaseGuiElement {
    element: HTMLElement;
    constructor(type: keyof HTMLElementTagNameMap, ...classes: string[]) {
        this.element = document.createElement(type);
        for (const c of classes) {
            this.element.classList.add(c);
        }
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
        super("div", "flex");
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
        this.element.innerText = content;
    }
    public get content() {
        return this._content;
    }

    static list: GuiElement[] = [];
}

export class PositionableGuiElement extends GuiElement {
    position: Vector;

    constructor(options: PositionableGuiElementOptions) {
        super(options);
        if (!options.parent) {
            this.position = options.position;
            this.element.addEventListener("mouseenter", (e) => { mouse.gui++; });
            this.element.addEventListener("mouseleave", (e) => { mouse.gui = 0; });
            this.element.classList.add("absolute");
            if (options.centerX) this.element.classList.add("centerX");
            else if (options.position) this.element.style.left = this.position.x + "px";
            if (options.centerY) this.element.classList.add("centerY");
            else if (options.position) this.element.style.top = this.position.y + "px";
        }
    }
    update() {
        this.element.style.left = this.position.x + "px";
        this.element.style.top = this.position.y + "px";
    }
}

export class GuiPanel extends GuiElement {
    constructor(options: GuiPanelOptions) {
        super(options);
        this.element.style.flexDirection = options.flexDirection ?? "row";
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
    lastOpacity = 0;
    constructor(position: Vector, content = "none") {
        super({ position: new Vector(0, 0), content: content });
        this.worldPosition = position.result();
        this.element.classList.add("label");
    }
    update(): void {
        this.position = worldToScreen(this.worldPosition.result()).add(new Vector(0, 100));
        const op = clamp((.25 - Math.abs(this.position.x / window.innerWidth - .5)) * 8);
        if (this.lastOpacity != op) {
            if (op <= 0) this.element.style.display = "none";
            else {
                this.element.style.opacity = op + "";
                this.element.style.display = "flex";
            }
            this.lastOpacity = op;
        }
        super.update();
    }
}

export class GuiTooltip extends PositionableGuiElement {
    moving = true;
    constructor(content = "none") {
        super({ position: new Vector(0, 0), content: content });
        this.element.classList.add("tooltip");
    }
    update(): void {
        this.position = new Vector(mouse.x + 10, mouse.y + 10);
        super.update();
    }
}

export class GuiButton extends PositionableGuiElement {
    private callback: () => void;
    constructor(options: GuiButtonOptions) {
        super(options);
        this.element.classList.add("button");
        this.callback = options.callback;
        this.element.onclick = this.click.bind(this);
        this.element.onmouseenter = () => { GUI.sounds.hover.play(); }
    }
    click() {
        GUI.sounds.click.play();
        this.callback();
    }
}

export class GuiSplash {
    element: HTMLElement;
    constructor(content = "none", duration = 5) {
        this.element = document.createElement("h1");
        GUI.container.appendChild(this.element);
        this.element.classList.add("splash");
        this.element.innerText = content;
        this.element.style.animationDuration = duration + "s";
        setTimeout(() => {
            this.element.remove();
        }, duration * 1000);
    }
}