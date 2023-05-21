import { app } from ".";
import { Camera } from "./camera";
import { DialogBox, DialogChoices } from "./gui/gui";

let speakersHidden = [true, true];
let profiles = document.getElementsByClassName("profileIcon") as any as HTMLElement[];
let speakerProfiles = [
    profiles[0],
    profiles[1]
]

function showSpeaker(index: number) {
    speakerProfiles[index].classList.remove("hidden");
    speakersHidden[index] = false;
}
function hideSpeaker(index: number) {
    speakerProfiles[index].classList.add("hidden");
    speakersHidden[index] = true;
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
        if (speakersHidden[this.speaker - 1]) {
            showSpeaker(this.speaker - 1);
            delay += 800
        }
        setTimeout(this.showBox.bind(this), delay);
    }
    private showBox() {
        new DialogBox(this.content, this.speaker);
        if (this.nextNode) {
            let delay = this.content.length * 20 + 800;
            if (speakersHidden[this.nextNode.speaker - 1]) {
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
            app.view.style.scale="100%";
            DialogBox.conversationElement.classList.add("hidden");
            Camera.yOffset = 50;
        }
    }
    finish() {
        return this.topNode.getTop();
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
        app.view.style.scale="200%";
        DialogBox.conversationElement.classList.remove("hidden");
        Camera.yOffset = 10;
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