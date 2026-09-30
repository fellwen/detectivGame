import { createState } from "./state.js";

let state = createState();

const listeners = new Set();


export function getState() {
    return state;
}


export function resetState() {
    state = createState();

    notify();
}


export function subscribe(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}


export function updateState(callback) {
    callback(state);

    notify();
}


function notify() {
    listeners.forEach(listener => {
        listener(state);
    });
}


export function addJournalEntry(text) {

    state.journal.unshift({
        id: crypto.randomUUID(),

        time:
            `${String(state.time.hour).padStart(2, "0")}:` +
            `${String(state.time.minute).padStart(2, "0")}`,

        text
    });

    notify();
}


export function advanceTime(minutes = 5) {

    let total =
        state.time.hour * 60 +
        state.time.minute +
        minutes;

    total %= 24 * 60;

    state.time.hour =
        Math.floor(total / 60);

    state.time.minute =
        total % 60;

    notify();
}


export function setScreen(screen) {

    state.screen = screen;

    notify();
}