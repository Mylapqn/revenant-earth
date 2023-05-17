import { DialogBox, DialogChoices } from "./gui/gui";

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
        new DialogBox(this.content, this.speaker);
        if (this.nextNode) {
            setTimeout(() => {
                this.nextNode.execute();
            }, 1000);
        }
    };
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
}

export class ChoiceNode implements BaseNode {
    topNode: DialogueNode;
    choices: DialogueNode[] = [];
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