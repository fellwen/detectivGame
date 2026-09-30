import { addJournalEntry } from "../core/game.js";
import { discoverClue } from "./evidence.js";


export const killerSystem = {

    plantClue(clueId) {

        discoverClue(clueId);

        addJournalEntry(
            "Кто-то незаметно изменил расположение улики."
        );
    },


    manipulateSuspicion(
        targetId,
        amount,
        changeSuspicion
    ) {

        changeSuspicion(
            targetId,
            amount
        );

        addJournalEntry(
            "Подозрение было направлено в сторону другого гостя."
        );
    },


    destroyEvidence(clueId, getState, updateState) {

        const state = getState();

        updateState(state => {

            state.investigation.clues =
                state.investigation.clues
                    .filter(id => id !== clueId);

        });

        addJournalEntry(
            "Одна из улик исчезла."
        );
    }

};