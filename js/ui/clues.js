import {
    getDiscoveredClues
} from "../systems/evidence.js";


export function renderClues() {

    const container =
        document.getElementById(
            "cluesContainer"
        );

    if (!container) {
        return;
    }

    const discovered =
        getDiscoveredClues();

    if (discovered.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Пока не найдено ни одной существенной улики.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    discovered.forEach(clue => {

        const typeClass =
            clue.type === "real"
                ? "real"
                : "false";

        const badge =
            clue.type === "real"
                ? "улика"
                : "ложный след";

        container.innerHTML += `

            <article class="clue-card ${typeClass}">

                <div class="clue-header">

                    <div class="clue-title">
                        ${clue.title}
                    </div>

                    <span class="clue-badge">
                        ${badge}
                    </span>

                </div>

                <div class="clue-description">
                    ${clue.description}
                </div>

            </article>
        `;
    });
}