// Остановился на 16 файле 






import { getState, updateState } from "../core/game.js";


export function changeSuspicion(
    characterId,
    amount
) {

    updateState(state => {

        if (
            typeof state.suspicion[characterId]
            !== "number"
        ) {
            return;
        }

        state.suspicion[characterId] =
            Math.max(
                0,
                Math.min(
                    100,
                    state.suspicion[characterId] + amount
                )
            );
    });
}


export function getSuspicionLevel() {

    const state = getState();

    const values =
        Object.values(state.suspicion);

    const average =
        values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length;

    if (average >= 70) {
        return "Критическое";
    }

    if (average >= 50) {
        return "Высокое";
    }

    if (average >= 30) {
        return "Среднее";
    }

    return "Низкое";
}


export function getCharacterSuspicion(characterId) {

    return getState()
        .suspicion[characterId] ?? 0;
}