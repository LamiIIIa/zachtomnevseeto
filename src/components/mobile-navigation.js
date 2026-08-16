const DEFAULT_LABELS = Object.freeze({
  navigation: "Мобильная навигация",
  menu: "Мобильное меню",
  menuTitle: "Меню",
  home: "Главная",
  messages: "Сообщения",
  register: "Регистрация",
  more: "Ещё",
  logout: "Выйти",
  login: "Войти",
  back: "Назад",
  closeMenu: "Закрыть меню",
  returnToMenu: "Вернуться в основное меню",
  userLinks: "Личные ссылки",
  confirmLogout: "Выйти из аккаунта?",
});

class MobileNavigation {
  constructor(root, labels = DEFAULT_LABELS) {
    this.root = root;
    this.labels = labels;
    this.currentPage = "main";
    this.navLinks = {};
    this.menuData = {};
    this.elements = {};

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  init() {
    if (!this.root) return this;
    if (this.root.querySelector(".mobile-dock")) return this;

    this.navLinks = this.getNavigationLinks();
    this.menuData = this.getMenuPagesData();

    const dockElements = this.createDock();
    const menuElements = this.createMenu();

    this.elements = {
      ...dockElements,
      ...menuElements,
    };

    this.bindEvents();
    this.root.append(this.elements.menu, this.elements.dock);
    this.root.classList.add("mobile-navigation-ready");

    return this;
  }

  getNavigationLinks() {
    return {
      home: this.root.querySelector("#navindex a"),
      messages: this.root.querySelector("#navpm a"),
      logout: this.root.querySelector("#navlogout a"),
      login: this.root.querySelector("#navlogin a"),
      register: this.root.querySelector("#navregister a"),
    };
  }

  getMenuPagesData() {
    const mainPageLinks = [
      this.root.querySelector("#navuserlist a"),
      this.root.querySelector("#navsearch a"),
      this.root.querySelector("#navprofile a"),
      this.root.querySelector("#navadmin a"),
    ].filter(Boolean);

    const userPageLinks = Array.from(
      this.root.querySelectorAll("#pun-ulinks a[href]")
    );

    const userPageTitle =
      this.normalizeText(
        this.root.querySelector("#pun-ulinks h2")?.textContent
      ) || this.labels.userLinks;

    return {
      mainPageLinks,
      userPageLinks,
      userPageTitle,
    };
  }

  createDock() {
    const dock = this.createElement("nav", {
      className: "mobile-dock",
      attributes: {
        "aria-label": this.labels.navigation,
      },
    });

    const isAuthenticated = Boolean(this.navLinks.logout);

    const home = this.createDockLink(
      this.navLinks.home,
      this.labels.home,
      "mobile-dock__item--home"
    );

    const second = isAuthenticated
      ? this.createDockLink(
          this.navLinks.messages,
          this.labels.messages,
          "mobile-dock__item--message"
        )
      : this.createDockLink(
          this.navLinks.register,
          this.labels.register,
          "mobile-dock__item--register"
        );

    const moreButton = this.createElement("button", {
      className: "mobile-dock__item mobile-dock__item--more",
      text: this.labels.more,
      attributes: {
        type: "button",
        "aria-controls": "mobile-menu",
        "aria-expanded": "false",
      },
    });

    const last = isAuthenticated
      ? this.createDockLink(
          this.navLinks.logout,
          this.labels.logout,
          "mobile-dock__item--logout"
        )
      : this.createDockLink(
          this.navLinks.login,
          this.labels.login,
          "mobile-dock__item--login"
        );

    dock.append(...[home, second, moreButton, last].filter(Boolean));

    return {
      dock,
      moreButton,
      logoutButton: isAuthenticated ? last : null,
    };
  }

  createDockLink(sourceLink, label, modifierClass) {
    if (!sourceLink) return null;

    const link = this.createElement("a", {
      className: `mobile-dock__item ${modifierClass}`,
      text: label,
    });

    link.href = sourceLink.href;

    return link;
  }

  createMenu() {
    const menu = this.createElement("div", {
      className: "mobile-menu",
      attributes: {
        id: "mobile-menu",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": this.labels.menu,
      },
    });

    menu.hidden = true;

    const mainPageElements = this.createMenuPage({
      id: "mobile-menu-main-page",
      name: "main",
      modifierClass: "mobile-menu__page--main",
      title: this.labels.menuTitle,
      backLabel: this.labels.closeMenu,
      links: this.menuData.mainPageLinks,
      hidden: false,
    });

    const userPageElements = this.createMenuPage({
      id: "mobile-menu-user-page",
      name: "user",
      modifierClass: "mobile-menu__page--user",
      title: this.menuData.userPageTitle,
      backLabel: this.labels.returnToMenu,
      links: this.menuData.userPageLinks,
      hidden: true,
    });

    const userPageButton = this.createUserPageButton();

    if (userPageButton) {
      const userPageItem = this.createElement("li", {
        className: "mobile-menu__list-item",
      });

      userPageItem.append(userPageButton);
      mainPageElements.list.append(userPageItem);
    }

    menu.append(mainPageElements.page, userPageElements.page);

    return {
      menu,
      mainPage: mainPageElements.page,
      mainBackButton: mainPageElements.backButton,
      userPage: userPageElements.page,
      userBackButton: userPageElements.backButton,
      userPageButton,
    };
  }

  createMenuPage({
    id,
    name,
    modifierClass,
    title,
    backLabel,
    links,
    hidden,
  }) {
    const titleId = `${id}-title`;

    const page = this.createElement("section", {
      className: `mobile-menu__page ${modifierClass}`,
      attributes: {
        id,
        "aria-labelledby": titleId,
      },
    });

    page.dataset.mobilePage = name;
    page.hidden = hidden;

    const headerElements = this.createMenuHeader({
      title,
      titleId,
      backLabel,
    });

    const list = this.createElement("ul", {
      className: "mobile-menu__list",
    });

    links.forEach((sourceLink) => {
      const item = this.createMenuListItem(sourceLink);

      if (item) list.append(item);
    });

    page.append(headerElements.header, list);

    return {
      page,
      list,
      backButton: headerElements.backButton,
    };
  }

  createMenuHeader({ title, titleId, backLabel }) {
    const header = this.createElement("header", {
      className: "mobile-menu__header",
    });

    const backButton = this.createElement("button", {
      className: "mobile-menu__back",
      text: this.labels.back,
      attributes: {
        type: "button",
        "aria-label": backLabel,
      },
    });

    const heading = this.createElement("h2", {
      className: "mobile-menu__title",
      text: title,
      attributes: {
        id: titleId,
      },
    });

    header.append(backButton, heading);

    return {
      header,
      backButton,
    };
  }

  createMenuListItem(sourceLink) {
    if (!sourceLink) return null;

    const item = this.createElement("li", {
      className: "mobile-menu__list-item",
    });

    const link = this.createElement("a", {
      className: "mobile-menu__link",
      text: this.normalizeText(sourceLink.textContent),
    });

    link.href = sourceLink.href;

    if (sourceLink.target) link.target = sourceLink.target;
    if (sourceLink.rel) link.rel = sourceLink.rel;

    item.append(link);

    return item;
  }

  createUserPageButton() {
    if (this.menuData.userPageLinks.length === 0) return null;

    return this.createElement("button", {
      className: "mobile-menu__submenu-button",
      text: this.menuData.userPageTitle,
      attributes: {
        type: "button",
        "aria-controls": "mobile-menu-user-page",
        "aria-expanded": "false",
      },
    });
  }

  createElement(tagName, { className = "", text = "", attributes = {} } = {}) {
    const element = document.createElement(tagName);

    if (className) element.className = className;
    if (text) element.textContent = text;

    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(name, String(value));
      }
    });

    return element;
  }

  bindEvents() {
    const {
      menu,
      moreButton,
      mainBackButton,
      userBackButton,
      userPageButton,
      logoutButton,
    } = this.elements;

    moreButton.addEventListener("click", () => this.openMenu());
    mainBackButton.addEventListener("click", () => this.closeMenu());
    userBackButton.addEventListener("click", () => this.returnToMainPage());
    userPageButton?.addEventListener("click", () => this.openUserPage());

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        this.closeMenu({ restoreFocus: false });
      }
    });

    logoutButton?.addEventListener("click", (event) => {
      if (!window.confirm(this.labels.confirmLogout)) {
        event.preventDefault();
      }
    });

    document.addEventListener("keydown", this.handleKeydown);
  }

  openMenu() {
    const { menu, mainPage, userPage, moreButton, userPageButton } =
      this.elements;

    this.currentPage = "main";
    mainPage.hidden = false;
    userPage.hidden = true;
    menu.hidden = false;

    moreButton.setAttribute("aria-expanded", "true");
    userPageButton?.setAttribute("aria-expanded", "false");
    document.documentElement.classList.add("mobile-menu-open");

    this.focusLater(this.elements.mainBackButton);
  }

  closeMenu({ restoreFocus = true } = {}) {
    const { menu, mainPage, userPage, moreButton, userPageButton } =
      this.elements;

    menu.hidden = true;
    this.currentPage = "main";
    mainPage.hidden = false;
    userPage.hidden = true;

    moreButton.setAttribute("aria-expanded", "false");
    userPageButton?.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("mobile-menu-open");

    if (restoreFocus) moreButton.focus();
  }

  openUserPage() {
    const { mainPage, userPage, userPageButton, userBackButton } =
      this.elements;

    if (!userPageButton) return;

    this.currentPage = "user";
    mainPage.hidden = true;
    userPage.hidden = false;
    userPageButton.setAttribute("aria-expanded", "true");

    this.focusLater(userBackButton);
  }

  returnToMainPage() {
    const { mainPage, userPage, userPageButton } = this.elements;

    this.currentPage = "main";
    userPage.hidden = true;
    mainPage.hidden = false;
    userPageButton?.setAttribute("aria-expanded", "false");

    this.focusLater(userPageButton);
  }

  handleKeydown(event) {
    if (event.key !== "Escape" || this.elements.menu?.hidden) return;

    event.preventDefault();

    if (this.currentPage === "user") {
      this.returnToMainPage();
    } else {
      this.closeMenu();
    }
  }

  focusLater(element) {
    if (!element) return;

    requestAnimationFrame(() => element.focus());
  }

  normalizeText(value) {
    return value?.replace(/\s+/g, " ").trim() || "";
  }
}

// Сохраняем прежний публичный интерфейс для common.js.
export function initMobileNavigation({ root }) {
  return new MobileNavigation(root).init();
}
