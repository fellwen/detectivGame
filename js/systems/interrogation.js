import { characters } from "../data/characters.js";
import { dialogues } from "../data/dialogues.js";

import {
    addJournalEntry,
    advanceTime,
    getState,
    updateState
} from "../core/game.js";

import { discoverClue } from "./evidence.js";


export function interrogateCharacter(characterId) {

    const character =
        characters.find(
            character => character.id === characterId
        );

    if (!character) {
        return null;
    }

    const dialogue =
        dialogues[characterId]?.first;

    if (!dialogue) {
        return null;
    }

    const alreadyInterrogated =
        getState()
            .investigation
            .interrogated
            .includes(characterId);

    if (!alreadyInterrogated) {

        updateState(state => {

            state.investigation.interrogated
                .push(characterId);

        });

        addJournalEntry(
            `Допрошен: ${character.name}.`
        );

        advanceTime(5);

        if (dialogue.clues) {

            dialogue.clues.forEach(
                clueId => discoverClue(clueId)
            );

        }
    }

    return {
        character,
        dialogue,
        alreadyInterrogated
    };
}