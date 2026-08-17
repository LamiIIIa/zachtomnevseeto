import { forumConfig } from '../config/forum.js'

const primaryOrigin = forumConfig.primaryOrigin

const lonkObj = {
  linkForMobHead: {
    maketLD: {
      link: `${primaryOrigin}/viewtopic.php?id=68#p245`,
      title: "Шаблон личного дела",
    },
    storyline: {
      link: `${primaryOrigin}/viewtopic.php?id=99`,
      title: "Сюжет",
    },
    looking: {
      link: `${primaryOrigin}/viewtopic.php?id=333`,
      title: "Игроки ищут!",
    },
    calc: {
      link: `${primaryOrigin}/pages/kalkulyator`,
      title: "Калькулятор",
    },
    map: {
      link: "https://forumstatic.ru/files/001a/12/f3/34431.jpg",
      title: "Карта",
    },
  },
};

export default lonkObj;
