import { GuiSpeechBubble } from "../../gui/gui";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";

export class NetworkBuildable extends Buildable {
    network: WiringNetwork;
    connected: boolean;
    providesEnergy?: boolean;
    providesOxygen?: boolean;
    cableOffset: Vector;

    remove(): void {
        if (this.network) this.network.removeElement(this);
        super.remove();
    }
    onConnect() {

    }
}

export class WiringNetwork {
    static nextId = 0;
    id: number;
    list: Set<NetworkBuildable>;
    oxygen: boolean;
    energy: boolean;
    constructor(...elements: NetworkBuildable[]) {
        this.id = WiringNetwork.nextId;
        WiringNetwork.nextId++;
        this.list = new Set();
        for (const el of elements) {
            this.addElement(el);
        }
    }
    addElement(element: NetworkBuildable) {
        if (element.network && element.network != this) {
            this.mergeFrom(element.network)
        }
        else if (!element.network) {
            this.actuallyAddElement(element)

        }

    }
    removeElement(element: NetworkBuildable) {
        this.list.delete(element);
        element.network = undefined;
        //new GuiSpeechBubble(element, "Removed from network " + this.id);
    }
    mergeFrom(network: WiringNetwork) {
        this.oxygen = this.oxygen || network.oxygen;
        this.energy = this.energy || network.energy;
        for (const el of this.list) {
            el.onConnect()
        }
        for (const el of network.list) {
            this.actuallyAddElement(el)
        }
    }
    actuallyAddElement(element: NetworkBuildable) {
        if (element.providesEnergy) this.energy = true;
        if (element.providesOxygen) this.oxygen = true;
        element.network = this;
        this.list.add(element);
        element.onConnect();
        //new GuiSpeechBubble(element, "Added to network " + this.id);
    }
}