import { app } from "./game";
import { Camera } from "./camera";
import { CustomGuiElement, DialogBox, DialogChoices, GUI } from "./gui/gui";

const cinematicWrapper = document.getElementById("cinematicWrapper");

type Awaitable = (() => Promise<void>) | (() => void);
type AwaitableCondition = (() => Promise<boolean>) | (() => boolean);

export class Dialogue {
    static speakersHidden = [true, true];
    static profiles: HTMLElement[] = [];
    static speakerProfiles: HTMLElement[] = [];
    static init() {

        DialogBox.container = new CustomGuiElement("div", "", "messagesContainer").element;
        DialogBox.wrapper = new CustomGuiElement("div", "", "dialogContainer").element;
        const dbe = new CustomGuiElement("div", "", "conversationWrapper", "absolute", "centerX", "hidden", "ui")
        dbe.addMouseListeners();
        DialogBox.conversationElement = dbe.element;
        GUI.container.appendChild(DialogBox.conversationElement);
        DialogBox.wrapper.appendChild(DialogBox.container);


        this.speakerProfiles[0] = new CustomGuiElement("div", "", "profileIcon", "hidden").element;
        let temp = document.createElement("img");
        temp.src = "characters/director.png";
        this.speakerProfiles[0].appendChild(temp);
        this.speakerProfiles[0].appendChild(new CustomGuiElement("div", "General Director", "ui").element);
        DialogBox.conversationElement.appendChild(this.speakerProfiles[0]);

        DialogBox.conversationElement.appendChild(DialogBox.wrapper);

        this.speakerProfiles[1] = new CustomGuiElement("div", "", "profileIcon", "hidden", "playerIcon").element;
        temp = document.createElement("img");
        temp.src = "characters/player.png";
        this.speakerProfiles[1].appendChild(temp);
        this.speakerProfiles[1].appendChild(new CustomGuiElement("div", "Player", "ui").element);
        DialogBox.conversationElement.appendChild(this.speakerProfiles[1]);
    }
}

async function showSpeaker(index: number) {
    GUI.sounds.appear.play();
    Dialogue.speakerProfiles[index].classList.remove("hidden");
    Dialogue.speakersHidden[index] = false;
    sleep(800);
    return;
}
async function hideSpeaker(index: number) {
    Dialogue.speakerProfiles[index].classList.add("hidden");
    Dialogue.speakersHidden[index] = true;
    sleep(800);
    return;
}

interface BaseNode {
    execute: () => void
}

export class DialogueNode implements BaseNode {
    topNode: TopNode;
    content = "none";
    nextNode: DialogueNode | ChoiceNode;
    speaker = 1;
    constructor(content = "", speaker = 1) {
        this.speaker = speaker;
        this.content = content;
    }
    chainNode(node: NodeStack) {
        let n = node.copy();
        this.nextNode = n;
        n.topNode = this.topNode;
        return this.nextNode;
    }
    chain(content = "none", speaker: number = null) {
        this.nextNode = new DialogueNode(content);
        if (speaker || speaker === 0)
            this.nextNode.speaker = speaker;
        else this.nextNode.speaker = this.speaker;
        this.nextNode.topNode = this.topNode;
        return this.nextNode;
    }
    reply(content = "none") {
        this.nextNode = new DialogueNode(content);
        this.nextNode.speaker = (this.speaker == 1) ? 2 : 1;
        this.nextNode.topNode = this.topNode;
        return this.nextNode;
    }
    choice(choices: TopNode[] = []) {
        this.nextNode = new ChoiceNode(choices);
        this.nextNode.topNode = this.topNode;
        return this.nextNode;
    }
    callback(callback: Awaitable) {
        this.nextNode = new FunctionNode(callback);
        this.nextNode.topNode = this.topNode;
        return this.nextNode;
    }
    condition(test: AwaitableCondition, nodeTrue?: TopNode, nodeFalse?: TopNode) {
        this.nextNode = new ConditionNode(test, nodeTrue, nodeFalse);
        this.nextNode.topNode = this.topNode;
        return this.nextNode;
    }
    async execute() {
        if (Dialogue.speakersHidden[this.speaker - 1]) {
            await showSpeaker(this.speaker - 1);
        }
        await sleep(10);
        await this.showBox();
    }
    private async showBox() {
        new DialogBox(this.content, this.speaker);
        let delay = this.content.length * 45 + 1000;
        //delay = 100;
        await sleep(delay);
        await this.showNext();
    }
    async showNext() {
        if (this.nextNode) {
            if (Dialogue.speakersHidden[this.nextNode.speaker - 1]) {
                await showSpeaker(this.nextNode.speaker - 1);
                await sleep(2000);
            }
            await this.nextNode.execute();
        }
    }
    finish() {
        return this.topNode.getTop();
    }
}

export class ConditionNode extends DialogueNode {
    _callback: AwaitableCondition;
    nodeTrue: TopNode;
    nodeFalse: TopNode;
    constructor(callback: AwaitableCondition, nodeTrue?: TopNode, nodeFalse?: TopNode) {
        super();
        this.speaker = 0;
        this._callback = callback;
        this.nodeTrue = nodeTrue;
        this.nodeFalse = nodeFalse;
    }
    async execute() {
        if (await this._callback()) {
            if (this.nodeFalse) await this.nodeTrue.execute();
        }
        else {
            if (this.nodeFalse) await this.nodeFalse.execute();
        }
        await this.showNext();
    }

}


export class FunctionNode extends DialogueNode {
    _callback: Awaitable;
    constructor(callback: Awaitable) {
        super();
        this.speaker = 0;
        this._callback = callback;
    }
    async execute() {
        await this._callback();
        await this.showNext();
    }

}

export class NodeStack extends DialogueNode {
    startNode: TopNode;
    nextNode: DialogueNode
    constructor(startNode: TopNode) {
        super("", 0);
        this.startNode = startNode
    }
    copy() {
        let n = new NodeStack(this.startNode);
        return n;
    }
    async execute() {
        await this.startNode.execute();
        await sleep(800);
        if (this.nextNode) {
            await this.nextNode.execute();
        }
        else {
            if (cinematicWrapper) cinematicWrapper.classList.remove("active");
            DialogBox.conversationElement.classList.add("hidden");
            Camera.yOffset = 50;
            Camera.scale = 1;
        }
    }
}

export class TopNode extends DialogueNode {
    isTop = true;
    nodeStack: NodeStack;
    constructor(content = "none", speaker = 1) {
        super(content, speaker);
        this.topNode = this;
    }
    getTop(): TopNode {
        if (this.topNode != this) return this.topNode.getTop();
        else return this;
    }
    async execute() {
        Camera.scale = 2;
        Camera.yOffset = 10;
        DialogBox.conversationElement.classList.remove("hidden");
        if (cinematicWrapper) cinematicWrapper.classList.add("active");
        await super.execute();
    }
}

export class ChoiceNode extends DialogueNode {
    choices: DialogueNode[] = [];
    speaker = 2;
    constructor(choices: DialogueNode[] = []) {
        super();
        this.choices = choices;
    }
    async execute() {
        let c = [];
        for (const choice of this.choices) {
            choice.speaker = this.speaker;
            c.push({ content: choice.content, node: choice });
        }
        console.log("Select");

        await (await (new DialogChoices(c).awaitSelection())).execute();
        console.log("SelectDead");
        if (this.nextNode)
            await this.nextNode.execute();
        return;
    };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));