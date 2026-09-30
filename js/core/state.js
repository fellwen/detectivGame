export const initialState = {
    screen: "start",

    time: {
        hour: 23,
        minute: 5
    },

    player: {
        role: "detective"
    },

    investigation: {
        progress: 0,

        clues: [],

        interrogated: [],

        visitedLocations: [],

        accusations: []
    },

    suspicion: {
        cat: 15,
        elena: 35,
        nikolai: 40,
        oleg: 45,
        dunya: 25,
        somov: 20,
        plyushkin: 30
    },

    journal: [],

    ending: null
};


export function createState() {
    return structuredClone(initialState);
}