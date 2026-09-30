import { locations } from "../data/locations.js";
import {
    addJournalEntry,
    advanceTime,
    getState,
    updateState
} from "../core/game.js";

import {
    discoverClue,
    hasClue
} from "./evidence.js";


export function getLocation(locationId) {

    return locations.find(
        location => location.id === locationId
    );
}


export function investigateLocation(locationId) {

    const location =
        getLocation(locationId);

    if (!location) {
        return null;
    }

    const state = getState();

    const alreadyVisited =
        state.investigation.visitedLocations
            .includes(locationId);

    if (!alreadyVisited) {

        updateState(state => {

            state.investigation.visitedLocations
                .push(locationId);

        });

        addJournalEntry(
            `Осмотрено помещение: ${location.name}.`
        );

        location.clues.forEach(clueId => {

            discoverClue(clueId);

        });

        advanceTime(5);
    }

    /*
     * Комната Кота становится особенно важной,
     * если игрок уже знает о раннем времени смерти
     * или видел свидетеля.
     */

    if (
        locationId === "catroom" &&
        (
            hasClue("bodyTime") ||
            hasClue("witness")
        )
    ) {

        discoverClue("documents");
    }

    return location;
}


export function calculateProgress() {

    const state = getState();

    const cluesProgress =
        Math.min(
            state.investigation.clues.length * 10,
            70
        );

    const interrogationProgress =
        Math.min(
            state.investigation.interrogated.length * 4,
            20
        );

    const locationProgress =
        Math.min(
            state.investigation.visitedLocations.length * 3,
            10
        );

    return Math.min(
        100,
        cluesProgress +
        interrogationProgress +
        locationProgress
    );
}


export function updateProgress() {

    const progress =
        calculateProgress();

    updateState(state => {

        state.investigation.progress =
            progress;

    });

    return progress;
}