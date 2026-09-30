import { getState } from "../core/game.js";


export function renderJournal() {

    const container =
        document.getElementById(
            "logContainer"
        );

    if (!container) {
        return;
    }

    const state = getState();

    if (state.journal.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Журнал пока пуст.
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.journal
            .map(entry => `

                <div class="log-entry">

                    <div class="log-time">
                        ${entry.time}
                    </div>

                    ${entry.text}

                </div>

            `)
            .join("");
}