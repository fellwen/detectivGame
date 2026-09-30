import { clues } from "../data/clues.js";
import {
    getState,
    updateState,
    addJournalEntry
} from "../core/game.js";


export function discoverClue(clueId) {

    const clue = clues[clueId];

    if (!clue) {
        return false;
    }

    const state = getState();

    if (
        state.investigation.clues.includes(clueId)
    ) {
        return false;
    }

    updateState(state => {

        state.investigation.clues.push(clueId);

    });

    addJournalEntry(
        `Найдена улика: «${clue.title}».`
    );

    return true;
}


export function hasClue(clueId) {

    return getState()
        .investigation
        .clues
        .includes(clueId);
}


export function getDiscoveredClues() {

    return getState()
        .investigation
        .clues
        .map(id => clues[id])
        .filter(Boolean);
}


export function getRealClueCount() {

    return getDiscoveredClues()
        .filter(clue => clue.type === "real")
        .length;
}