export const clues = {

    poison: {
        id: "poison",

        title: "Бутылка коньяка",

        description:
            "В бутылке обнаружены остатки цианида. Вещество распределено по жидкости равномерно.",

        type: "real",

        importance: 5,

        location: "office"
    },

    lock: {
        id: "lock",

        title: "Царапины на замке",

        description:
            "На механизме замка заметны микроскопические следы металла.",

        type: "real",

        importance: 5,

        location: "office"
    },

    glove: {
        id: "glove",

        title: "Перчатка с остатками цианида",

        description:
            "В комнате Сержанта Кота обнаружена перчатка со следами вещества.",

        type: "real",

        importance: 5,

        location: "catroom"
    },

    witness: {
        id: "witness",

        title: "Свидетель у кабинета",

        description:
            "Один из гостей видел Сержанта Кота возле кабинета примерно в 21:15.",

        type: "real",

        importance: 5,

        location: "hall"
    },

    bodyTime: {
        id: "bodyTime",

        title: "Настоящее время смерти",

        description:
            "Доктор Сомов считает, что признаки смерти указывают примерно на 21:30.",

        type: "real",

        importance: 5,

        location: "interrogation"
    },

    documents: {
        id: "documents",

        title: "Компрометирующие документы",

        description:
            "В переплёте старой книги найдены документы, связывающие Кота со старым сфабрикованным делом.",

        type: "real",

        importance: 10,

        location: "catroom"
    },

    handkerchief: {
        id: "handkerchief",

        title: "Платок Елены",

        description:
            "Под креслом найден платок Елены Вельской.",

        type: "false",

        importance: 1,

        location: "bar"
    },

    letter: {
        id: "letter",

        title: "Угроза Олега",

        description:
            "Найдена записка с угрозой в адрес Аркадия, якобы написанная Олегом.",

        type: "false",

        importance: 1,

        location: "cat"
    },

    button: {
        id: "button",

        title: "Пуговица Николая",

        description:
            "На полу кабинета найдена пуговица от пальто Николая.",

        type: "false",

        importance: 1,

        location: "cat"
    },

    footprints: {
        id: "footprints",

        title: "Следы Дуни",

        description:
            "У окна обнаружены следы обуви Дуни.",

        type: "false",

        importance: 1,

        location: "hall"
    }
};