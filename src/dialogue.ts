import { app } from "./game";
import { Camera } from "./camera";
import { CustomGuiElement, DialogBox, DialogChoices, GUI } from "./gui/gui";


export class Dialogue {
    static speakersHidden = [true, true];
    static profiles: HTMLElement[] = [];
    static speakerProfiles: HTMLElement[] = [];
    static init() {

        DialogBox.container = new CustomGuiElement("div", "", "messagesContainer").element;
        DialogBox.wrapper = new CustomGuiElement("div", "", "dialogContainer").element;
        DialogBox.conversationElement = new CustomGuiElement("div", "", "conversationWrapper", "absolute", "centerX", "hidden", "ui").element;
        GUI.container.appendChild(DialogBox.conversationElement);
        DialogBox.wrapper.appendChild(DialogBox.container);


        this.speakerProfiles[0] = new CustomGuiElement("div", "", "profileIcon", "hidden").element;
        let temp = document.createElement("img");
        temp.src = "characters/director.png";
        this.speakerProfiles[0].appendChild(temp);
        this.speakerProfiles[0].appendChild(new CustomGuiElement("div", "General Director", "ui").element);
        DialogBox.conversationElement.appendChild(this.speakerProfiles[0]);

        DialogBox.conversationElement.appendChild(DialogBox.wrapper);

        this.speakerProfiles[1] = new CustomGuiElement("div", "", "profileIcon", "hidden","playerIcon").element;
        temp = document.createElement("img");
        temp.src = "characters/player.png";
        this.speakerProfiles[1].appendChild(temp);
        this.speakerProfiles[1].appendChild(new CustomGuiElement("div", "Player", "ui").element);
        DialogBox.conversationElement.appendChild(this.speakerProfiles[1]);
    }
}

function showSpeaker(index: number) {
    GUI.sounds.appear.play();
    Dialogue.speakerProfiles[index].classList.remove("hidden");
    Dialogue.speakersHidden[index] = false;
}
function hideSpeaker(index: number) {
    Dialogue.speakerProfiles[index].classList.add("hidden");
    Dialogue.speakersHidden[index] = true;
}

interface BaseNode {
    execute: () => void
}

class DialogueNode implements BaseNode {
    topNode: TopNode;
    content = "none";
    nextNode: DialogueNode | ChoiceNode;
    speaker = 1;
    constructor(content = "none", speaker = 1) {
        this.speaker = speaker;
        this.content = content;
    }
    chainNode(node: TopNode) {
        this.nextNode = node;
        node.topNode = this.topNode;
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
        return this.topNode;
    }
    execute() {
        let delay = 10;
        if (Dialogue.speakersHidden[this.speaker - 1]) {
            showSpeaker(this.speaker - 1);
            delay += 800
        }
        setTimeout(this.showBox.bind(this), delay);
    }
    private showBox() {
        new DialogBox(this.content, this.speaker);
        if (this.nextNode) {
            let delay = this.content.length * 40 + 800;
            delay=10;
            if (Dialogue.speakersHidden[this.nextNode.speaker - 1]) {
                setTimeout(() => {
                    showSpeaker(this.nextNode.speaker - 1);
                }, 800);
                delay += 1000;
            }
            setTimeout(() => {
                this.nextNode.execute();
            }, delay);
        }
        else {
            app.view.style.scale = "100%";
            DialogBox.conversationElement.classList.add("hidden");
            Camera.yOffset = 50;
        }
    }
    finish() {
        return this.topNode.getTop();
    }
}

export class NodeStack {
    constructor(){
        
    }
}

export class TopNode extends DialogueNode {
    isTop = true;
    constructor(content = "none", speaker = 1) {
        super(content, speaker);
        this.topNode = this;
    }
    getTop(): TopNode {
        if (this.topNode != this) return this.topNode.getTop();
        else return this;
    }
    execute(): void {
        app.view.style.scale = "200%";
        Camera.yOffset = 10;
        DialogBox.conversationElement.classList.remove("hidden");
        super.execute();
    }
}

export class ChoiceNode implements BaseNode {
    topNode: DialogueNode;
    choices: DialogueNode[] = [];
    speaker = 2;
    constructor(choices: DialogueNode[] = []) {
        this.choices = choices;
    }
    execute() {
        let c = [];
        for (const choice of this.choices) {
            c.push({ content: choice.content, callback: () => { choice.execute(); } });
        }
        new DialogChoices(c);
    };
}