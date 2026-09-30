    export function updateStory(
    speaker,
    text
) {

    const speakerElement =
        document.getElementById(
            "storySpeaker"
        );

    const textElement =
        document.getElementById(
            "storyText"
        );

    if (speakerElement) {
        speakerElement.textContent =
            speaker;
    }

    if (textElement) {
        textElement.innerHTML =
            text;
    }
}


export function showCharacterDialogue(
    character,
    dialogue
) {

    updateStory(
        character.name,
        dialogue.text
    );
}