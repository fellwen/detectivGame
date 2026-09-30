import { getState, updateState } from "../core/game.js";
import { endings } from "../data/endings.js";

import { hasClue } from "./evidence.js";


const requiredCatClues = [
    "poison",
    "lock",
    "bodyTime",
    "witness",
    "glove",
    "documents"
];


export function calculateCatEvidence() {

    return requiredCatClues
        .filter(clueId => hasClue(clueId))
        .length;
}


export function accuse(targetId) {

    updateState(state => {

        state.investigation.accusations
            .push(targetId);

    });

    if (targetId !== "cat") {

        return endings.wrongAccusation;

    }

    const evidence =
        calculateCatEvidence();

    if (evidence >= 5) {

        return endings.justice;

    }

    return endings.tooEarly;
}


export function getAccusationOptions() {

    return [
        {
            id: "cat",
            name: "Сержант Кот"
        },

        {
            id: "elena",
            name: "Елена Вельская"
        },

        {
            id: "nikolai",
            name: "Николай Вельский"
        },

        {
            id: "oleg",
            name: "Олег Грачев"
        },

        {
            id: "dunya",
            name: "Дуня"
        },

        {
            id: "somov",
            name: "Доктор Сомов"
        },

        {
            id: "plyushkin",
            name: "Господин Плюшкин"
        }
    ];
}