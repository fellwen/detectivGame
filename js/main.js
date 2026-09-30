import {
    getState,
    resetState,
    subscribe,
    addJournalEntry
} from "./core/game.js";

import {
    locations
} from "./data/locations.js";

import {
    characters
} from "./data/characters.js";

import {
    investigateLocation,
    updateProgress
} from "./systems/investigation.js";

import {
    interrogateCharacter
} from "./systems/interrogation.js";

import {
    accuse,
    getAccusationOptions
} from "./systems/accusation.js";

import {
    showGameScreen,
    showStartScreen,
    showEndingScreen
} from "./ui/screens.js";

import {
    renderCharacters
} from "./ui/characters.js";

import {
    renderClues
} from "./ui/clues.js";

import {
    renderJournal
} from "./ui/journal.js";

import {
    showCharacterDialogue,
    updateStory
} from "./ui/dialogue.js";


/* =========================================
   DOM
========================================= */

const startGameButton =
    document.getElementById(
        "startGameButton"
    );

const continueGameButton =
    document.getElementById(
        "continueGameButton"
    );

const restartGameButton =
    document.getElementById(
        "restartGameButton"
    );

const endingJournalButton =
    document.getElementById(
        "endingJournalButton"
    );

const locationsContainer =
    document.getElementById(
        "locationsContainer"
    );

const charactersContainer =
    document.getElementById(
        "charactersContainer"
    );

const openAccusationButton =
    document.getElementById(
        "openAccusationButton"
    );

const navInvestigation =
    document.getElementById(
        "navInvestigation"
    );

const navJournal =
    document.getElementById(
        "navJournal"
    );

const navRules =
    document.getElementById(
        "navRules"
    );


/* =========================================
   BOOT
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    renderLocations();

    subscribe(() => {

        renderCharacters();
        renderClues();
        renderJournal();
        updateStats();
        updateClock();
        updateProgressUI();

    });

    renderCharacters();
    renderClues();
    renderJournal();
    updateStats();
    updateClock();
    updateProgressUI();

    setupEvents();

    showStartScreen();
}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    startGameButton?.addEventListener(
        "click",
        startGame
    );

    continueGameButton?.addEventListener(
        "click",
        startGame
    );

    restartGameButton?.addEventListener(
        "click",
        restartGame
    );

    endingJournalButton?.addEventListener(
        "click",
        showJournalModal
    );

    openAccusationButton?.addEventListener(
        "click",
        openAccusation
    );

    navInvestigation?.addEventListener(
        "click",
        () => showGameScreen()
    );

    navJournal?.addEventListener(
        "click",
        showJournalModal
    );

    navRules?.addEventListener(
        "click",
        showRulesModal
    );

    locationsContainer?.addEventListener(
        "click",
        handleLocationClick
    );

    charactersContainer?.addEventListener(
        "click",
        handleCharacterClick
    );
}


/* =========================================
   START
========================================= */

function startGame() {

    showGameScreen();

    addJournalEntry(
        "Расследование началось. Необходимо установить настоящее время смерти."
    );

    updateStory(
        "Сержант Кот",
        `
            Аркадий Вельский найден мёртвым
            в своём кабинете.

            <br><br>

            Дверь заперта изнутри.
            Ключ торчит в замке.

            <br><br>

            Теперь нужно понять,
            действительно ли всё произошло так,
            как кажется.
        `
    );
}


/* =========================================
   RESTART
========================================= */

function restartGame() {

    resetState();

    renderLocations();

    showStartScreen();

    updateStory(
        "Сержант Кот",
        "Расследование начинается заново."
    );
}


/* =========================================
   LOCATIONS
========================================= */

function renderLocations() {

    if (!locationsContainer) {
        return;
    }

    locationsContainer.innerHTML = "";

    const state = getState();

    locations.forEach(location => {

        const visited =
            state.investigation
                .visitedLocations
                .includes(location.id);

        locationsContainer.innerHTML += `

            <div class="col-md-6">

                <article
                    class="
                        location-card
                        ${visited ? "location-investigated" : ""}
                    "
                    data-location-id="${location.id}"
                >

                    <div class="location-icon">
                        ${location.icon}
                    </div>

                    <div class="location-name">
                        ${location.name}
                    </div>

                    <div class="location-description">
                        ${location.description}
                    </div>

                </article>

            </div>
        `;
    });
}


function handleLocationClick(event) {

    const card =
        event.target.closest(
            "[data-location-id]"
        );

    if (!card) {
        return;
    }

    const locationId =
        card.dataset.locationId;

    const location =
        investigateLocation(locationId);

    if (!location) {
        return;
    }

    showGameModal(
        location.name,
        location.investigationText
    );

    renderLocations();

    updateProgress();
}


/* =========================================
   CHARACTERS
========================================= */

function handleCharacterClick(event) {

    const button =
        event.target.closest(
            "[data-character-id]"
        );

    if (!button) {
        return;
    }

    const characterId =
        button.dataset.characterId;

    const result =
        interrogateCharacter(
            characterId
        );

    if (!result) {
        return;
    }

    const {
        character,
        dialogue
    } = result;

    showCharacterDialogue(
        character,
        dialogue
    );

    let body = `
        <p>
            <strong class="gold-text">
                ${character.name}
            </strong>
        </p>

        <p>
            ${dialogue.text}
        </p>

        <hr>

        <p class="text-secondary">
            Мотив:
        </p>

        <p>
            ${character.motive}
        </p>
    `;

    if (dialogue.secret) {

        body += `
            <hr>

            <p class="text-secondary">
                Полученная информация:
            </p>

            <p>
                ${dialogue.secret}
            </p>
        `;
    }

    showGameModal(
        character.name,
        body
    );

    updateProgress();
}


/* =========================================
   ACCUSATION
========================================= */

function openAccusation() {

    const options =
        getAccusationOptions();

    const body = `
        <p class="text-secondary">
            Выберите человека, которого обвиняете
            в убийстве Аркадия Вельского.
        </p>

        <div class="d-grid gap-2">

            ${options.map(option => `

                <button
                    type="button"
                    class="btn btn-blue-game accusation-option"
                    data-accuse-id="${option.id}"
                >
                    ${option.name}
                </button>

            `).join("")}

        </div>
    `;

    showGameModal(
        "Предъявить обвинение",
        body
    );

    document
        .querySelectorAll(
            ".accusation-option"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.accuseId;

                    const ending =
                        accuse(targetId);

                    closeGameModal();

                    finishGame(
                        ending
                    );
                }
            );
        });
}


/* =========================================
   ENDING
========================================= */

function finishGame(ending) {

    const state = getState();

    state.ending = ending.id;

    document.getElementById(
        "endingTitle"
    ).textContent = ending.title;

    document.getElementById(
        "endingText"
    ).innerHTML = ending.text;

    showEndingScreen();
}


/* =========================================
   STATS
========================================= */

function updateStats() {

    const state = getState();

    const clueCount =
        document.getElementById(
            "clueCount"
        );

    const interrogatedCount =
        document.getElementById(
            "interrogatedCount"
        );

    const locationCount =
        document.getElementById(
            "locationCount"
        );

    if (clueCount) {

        clueCount.textContent =
            state.investigation.clues.length;
    }

    if (interrogatedCount) {

        interrogatedCount.textContent =
            state.investigation
                .interrogated.length;
    }

    if (locationCount) {

        locationCount.textContent =
            state.investigation
                .visitedLocations.length;
    }

    const suspicion =
        calculateGlobalSuspicion();

    const suspicionElement =
        document.getElementById(
            "suspicionLevel"
        );

    if (suspicionElement) {

        suspicionElement.textContent =
            getSuspicionLabel(suspicion);
    }
}


function calculateGlobalSuspicion() {

    const state = getState();

    const values =
        Object.values(
            state.suspicion
        );

    if (!values.length) {
        return 0;
    }

    return Math.round(
        values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length
    );
}


function getSuspicionLabel(value) {

    if (value >= 70) {
        return "Критическое";
    }

    if (value >= 50) {
        return "Высокое";
    }

    if (value >= 30) {
        return "Среднее";
    }

    return "Низкое";
}


/* =========================================
   CLOCK
========================================= */

function updateClock() {

    const state = getState();

    const clock =
        document.getElementById(
            "gameClock"
        );

    if (!clock) {
        return;
    }

    clock.textContent =
        `${String(state.time.hour).padStart(2, "0")}:` +
        `${String(state.time.minute).padStart(2, "0")}`;
}


/* =========================================
   PROGRESS
========================================= */

function updateProgressUI() {

    const state = getState();

    const progress =
        state.investigation.progress;

    const progressBar =
        document.getElementById(
            "investigationProgress"
        );

    const progressValue =
        document.getElementById(
            "progressValue"
        );

    if (progressBar) {

        progressBar.style.width =
            `${progress}%`;
    }

    if (progressValue) {

        progressValue.textContent =
            `${progress}%`;
    }
}


/* =========================================
   JOURNAL MODAL
========================================= */

function showJournalModal() {

    const state = getState();

    if (!state.journal.length) {

        showGameModal(
            "Досье",
            `
                <div class="empty-state">
                    Журнал пока пуст.
                </div>
            `
        );

        return;
    }

    const html =
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

    showGameModal(
        "Досье расследования",
        html
    );
}


/* =========================================
   RULES
========================================= */

function showRulesModal() {

    showGameModal(
        "Правила расследования",
        `
            <p>
                Исследуйте помещения отеля,
                допрашивайте гостей и собирайте улики.
            </p>

            <p>
                Некоторые улики настоящие,
                другие были специально подброшены убийцей.
            </p>

            <p>
                Не стоит делать вывод по одной детали.
                Главное оружие детектива —
                сопоставление фактов.
            </p>

            <hr>

            <p class="gold-text">
                Обратите особое внимание на время смерти,
                бутылку коньяка, замок и алиби Сержанта Кота.
            </p>
        `
    );
}


/* =========================================
   MODAL
========================================= */

function showGameModal(
    title,
    body
) {

    document.getElementById(
        "modalTitle"
    ).textContent = title;

    document.getElementById(
        "modalBody"
    ).innerHTML = body;

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "gameModal"
            )
        );

    modal.show();
}


function closeGameModal() {

    const modal =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "gameModal"
            )
        );

    modal?.hide();
}