import { initGame, mouse } from "./game";
import { BaseGuiElement, CustomGuiElement, GUI, GuiButton, GuiPanel, PositionableGuiElement } from "./gui/gui";

GUI.container.classList.add("mainMenu");

let mainMenuContainer: PositionableGuiElement;

function init() {
    mainMenuContainer = new PositionableGuiElement({ centerX: true, centerY: true, blankStyle: true });
    mainMenuContainer.addChild(new CustomGuiElement("h1", "Revenant Earth", "gameTitle"));
    let buttonPanel = new GuiPanel({ blankStyle: true, parent: mainMenuContainer, flexDirection: "column" });
    buttonPanel.addChild(
        new GuiButton({ content: "START GAME", callback: startGame, fillContainer: true }),
        new GuiPanel({ blankStyle: true, flexDirection: "row" })
            .addChild(
                new GuiButton({ content: "CONTINUE", callback: startGame }),
                new GuiButton({ content: "OPTIONS", callback: startGame })
            )
    );
}



function startGame() {
    GUI.container.classList.remove("mainMenu");
    mainMenuContainer.remove();
    initGame();
    mouse.gui = 0;
}

init();