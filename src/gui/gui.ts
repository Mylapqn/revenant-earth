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

class GuiElement {
    position: Vector;
    content: string;
    element: HTMLElement;
    moving = false;
    constructor(position: Vector, content = "none") {
        this.position = position;
        this.content = content;
        this.element = document.createElement("div");
        GUI.container.appendChild(this.element);
        this.element.classList.add("ui", "absolute");
        this.element.innerText = this.content;
        GuiElement.list.push(this);
    }
    update() {
        this.element.style.left = this.position.x + "px";
        this.element.style.top = this.position.y + "px";
    }
    remove() {
        GUI.container.removeChild(this.element);
        GuiElement.list.splice(GuiElement.list.indexOf(this), 1);
    }
    addChild(child: GuiElement) {
        this.element.appendChild(child.element);
        child.element.classList.remove("absolute");
    }
    static list: GuiElement[] = [];
}

export class GuiLabel extends GuiElement {
    worldPosition: Vector;
    moving = true;
    lastOpacity = 0;
    constructor(position: Vector, content = "none") {
        super(new Vector(0, 0), content);
        this.worldPosition = position.result();
        this.element.classList.add("label");
    }
    update(): void {
        this.position = worldToScreen(this.worldPosition.result()).add(new Vector(0, -250));
        const op = clamp((.4 - Math.abs(this.position.x / window.innerWidth - .5)) * 8);
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
        super(new Vector(0, 0), content);
        this.element.classList.add("tooltip");
    }
    update(): void {
        this.position = new Vector(mouse.x, mouse.y);
        super.update();
    }
}

export class GuiButton extends GuiElement {
    constructor(position: Vector, content = "none", callback = () => { }) {
        super(position, content);
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
        }, duration*1000);
    }
}