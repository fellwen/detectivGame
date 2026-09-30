import { characters } from "../data/characters.js";

import {
    getState
} from "../core/game.js";

import {
    getCharacterSuspicion
} from "../systems/suspicion.js";


export function renderCharacters() {

    const container =
        document.getElementById(
            "charactersContainer"
        );

    if (!container) {
        return;
    }

    const state = getState();

    container.innerHTML = "";

    characters.forEach(character => {

        const interrogated =
            state.investigation.interrogated
                .includes(character.id);

        const suspicion =
            getCharacterSuspicion(
                character.id
            );

        container.innerHTML += `

            <div class="col-md-6">

                <article class="character-card">

                    <div class="character-avatar">
                        ${character.avatar}
                    </div>

                    <div class="character-name">
                        ${character.name}
                    </div>

                    <div class="character-role">
                        ${character.role}
                    </div>

                    <div class="character-motive">
                        <strong>Мотив:</strong>
                        ${character.motive}
                    </div>

                    <div class="small text-secondary mb-2">
                        Подозрение: ${getSuspicionLabel(suspicion)}
                    </div>

                    <button
                        class="btn btn-blue-game btn-sm w-100"
                        data-character-id="${character.id}"
                        ${interrogated ? "disabled" : ""}
                    >
                        ${interrogated
                            ? "Допрошен"
                            : "Допросить"}
                    </button>

                </article>

            </div>
        `;
    });
}


function getSuspicionLabel(value) {

    if (value >= 70) {
        return "критическое";
    }

    if (value >= 50) {
        return "высокое";
    }

    if (value >= 30) {
        return "среднее";
    }

    return "низкое";
}