import { mouse, worldToScreen } from "..";
import { clamp } from "../utils";
import { Vector } from "../vector";

export class GUI {
    static update(dt: number) {
        for (const el of GuiElement.list) {
            if (el.moving)
                el.update();
        }
    }
    static container = document.getElementById("guiContainer");
}

interface GuiElementOptions {
    position?: Vector,
    parent?: GuiElement,
    centerX?: boolean,
    centerY?: boolean,
    content?: string,
}

class GuiElement {
    position: Vector;
    element: HTMLElement;
    moving = false;
    removed = false;
    constructor(options: GuiElementOptions) {
        this.element = document.createElement("div");
        GUI.container.appendChild(this.element);
        this.element.classList.add("ui");
        this.content = options.content ?? "none";
        GuiElement.list.push(this);
        if (options.parent) {
            options.parent.addChild(this);
        }
        else {
            this.position = options.position;
            this.element.addEventListener("mouseenter", (e) => { mouse.gui = true; });
            this.element.addEventListener("mouseleave", (e) => { mouse.gui = false; });
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
    remove() {
        if (this.removed) return;
        this.removed = true;
        this.element.remove();
        //GUI.container.removeChild(this.element);
        GuiElement.list.splice(GuiElement.list.indexOf(this), 1);
    }
    private addChild(child: GuiElement) {
        this.element.appendChild(child.element);
        child.element.classList.remove("absolute");
    }
    private removeChild(child: GuiElement) {
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

export class DialogBox extends GuiElement {
    static container = document.getElementById("messagesContainer");
    static wrapper = document.getElementById("dialogContainer");
    constructor(content = "none", speaker = 0) {
        super({ content });
        this.element.classList.remove("absolute");
        this.element.classList.add("dialogBox");
        if (speaker == 1) this.element.classList.add("dialogLeft");
        else if (speaker == 2) this.element.classList.add("dialogRight");
        DialogBox.container.appendChild(this.element);
        //this.element.scrollIntoView({behavior:"smooth",})
        DialogBox.wrapper.scrollBy({ top: this.element.offsetHeight + 500, behavior: "smooth" })
    }
}

class DialogChoice extends DialogBox {
    constructor(content = "none", callback = () => { }, parent: DialogChoices) {
        super(content, 2);
        this.element.classList.add("button", "dialogChoice");
        this.element.onclick = () => { parent.remove(); callback(); };
    }
}

export class DialogChoices {
    children: DialogChoice[]=[];
    constructor(choices: { content: string, callback: () => void }[] = []) {
        for (const options of choices) {
            this.children.push(new DialogChoice(options.content, options.callback, this));
        }
    }
    remove() {
        for (const choice of this.children) {
            choice.remove()
        }
    }
}

export class GuiLabel extends GuiElement {
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

export class GuiTooltip extends GuiElement {
    moving = true;
    constructor(content = "none") {
        super({ position: new Vector(0, 0), content: content });
        this.element.classList.add("tooltip");
    }
    update(): void {
        this.position = new Vector(mouse.x, mouse.y);
        super.update();
    }
}

export class GuiButton extends GuiElement {
    constructor(position?: Vector, content = "none", callback = () => { }, parent: GuiElement = null) {
        super({ position, content, parent });
        this.element.classList.add("button");
        this.element.onclick = callback;
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