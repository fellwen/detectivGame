import {
    getState,
    setScreen,
    updateState
} from "../core/game.js";


const screens = [
    "startScreen",
    "gameScreen",
    "endingScreen"
];


export function showScreen(screenName) {

    screens.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.classList.toggle(
            "active",
            id === screenName
        );
    });

    setScreen(screenName);
}


export function showStartScreen() {
    showScreen("startScreen");
}


export function showGameScreen() {
    showScreen("gameScreen");
}


export function showEndingScreen() {
    showScreen("endingScreen");
}