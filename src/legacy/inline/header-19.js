hvScriptSet.addMask({
    guestAccess: ['АРХИВ ЭПИЗОДОВ', 'Мусорка =)'],
    forumAccess: {
        'ФЛЕШБЕКИ И АЛЬТЕРНАТИВНАЯ РЕАЛЬНОСТЬ': ['Игроки'],
        'ИГРОВЫЕ ЭПИЗОДЫ': ['Игроки'],
        'ФЛУД': ['Игроки', 'Пользователи'],
        'ИГРЫ': ['Игроки', 'Пользователи']
    },
    forumAccessExtended: {
        'ФЛЕШБЕКИ И АЛЬТЕРНАТИВНАЯ РЕАЛЬНОСТЬ': ['Игроки'],
        'ИГРОВЫЕ ЭПИЗОДЫ': ['Игроки'],
        'ФЛУД': ['Игроки', 'Пользователи'],
        'ИГРЫ': ['Игроки', 'Пользователи']
    },
    changeList: {
        'pafld1': {
            title: 'Протектор Коноха',
            description: 'Шаблоны лежат по ссылке: https://akatsukigood.forum.cool/viewtopic.php?id=272',
            tag: 'protector',
            class: 'pa-fld1',
            defaultCode: '',
            type: 'html'
        },
        'pafld2': {
            title: 'Возраст, звание',
            description: '',
            tag: 'info',
            class: 'pa-fld2',
            defaultCode: '',
            type: 'text'
        }
    },
    userFields: ['pa-author', 'pa-title', 'pa-avatar', 'pa-fld1', 'pa-reg', 'pa-online', 'pa-fld2', 'pa-fld3', 'pa-fld4', 'pa-respect', 'pa-posts', 'pa-ua']
});
