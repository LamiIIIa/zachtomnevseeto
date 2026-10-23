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
  confirmLogout: "Выйти из аккаунта?",
});

class MobileNavigation {
  constructor(root, labels = DEFAULT_LABELS) {
    this.root = root;
    this.labels = labels;
    this.navLinks = {};
    this.menuLinks = [];
    this.elements = {};

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  init() {
    if (!this.root) return this;
    if (this.root.querySelector(".mobile-dock")) return this;

    this.navLinks = this.getNavigationLinks();
    this.menuLinks = this.getMenuLinks();

    const dockElements = this.createDock();
    const menuElements = this.createMenu();

    this.elements = {
      ...dockElements,
      ...menuElements,
    };

    this.bindEvents();
    this.root.append(this.elements.menu, this.elements.dock);
    this.initMessagesBadge();
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

  getMenuLinks() {
    const mainLinks = [
      this.root.querySelector("#navuserlist a"),
      this.root.querySelector("#navsearch a"),
      this.root.querySelector("#navprofile a"),
      this.root.querySelector("#navadmin a"),
    ].filter(Boolean);

    const userLinks = Array.from(
      this.root.querySelectorAll("#pun-ulinks a[href]")
    );

    // Сначала идут основные пункты, затем все ссылки #pun-ulinks
    // в том порядке, в котором их вывел движок форума.
    return [...mainLinks, ...userLinks];
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

  initMessagesBadge() {
    const source = this.root.querySelector("#navpm");
    const target = this.elements.dock?.querySelector(
      ".mobile-dock__item--message"
    );

    if (!source || !target) return;

    const updateBadge = () => {
      const separateBadge = source.querySelector(".num_msg");
      const sourceLabel = source.querySelector(
        "a span[data-last-unread]"
      );
      const separateCount = separateBadge?.textContent.match(/\d+/)?.[0];
      const inlineCount = sourceLabel?.textContent.match(/\((\d+)\)\s*$/)?.[1];
      const count = separateCount || inlineCount || "";
      let badge = target.querySelector(".mobile-dock__badge");

      if (!count || Number(count) <= 0) {
        badge?.remove();
        target.removeAttribute("aria-label");
        return;
      }

      if (!badge) {
        badge = document.createElement("span");
        badge.className = "mobile-dock__badge";
        badge.setAttribute("aria-hidden", "true");
        target.append(badge);
      }

      badge.textContent = count;
      target.setAttribute(
        "aria-label",
        `${this.labels.messages}, непрочитанных: ${count}`
      );
    };

    updateBadge();

    const observer = new MutationObserver(updateBadge);

    observer.observe(source, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-last-unread"],
    });
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

    const pageElements = this.createMenuPage({
      id: "mobile-menu-page",
      title: this.labels.menuTitle,
      backLabel: this.labels.closeMenu,
      links: this.menuLinks,
    });

    menu.append(pageElements.page);

    return {
      menu,
      backButton: pageElements.backButton,
    };
  }

  createMenuPage({ id, title, backLabel, links }) {
    const titleId = `${id}-title`;

    const page = this.createElement("section", {
      className: "mobile-menu__page",
      attributes: {
        id,
        "aria-labelledby": titleId,
      },
    });

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
      text: this.getSourceLinkLabel(sourceLink),
    });

    link.href = sourceLink.href;

    if (sourceLink.target) link.target = sourceLink.target;
    if (sourceLink.rel) link.rel = sourceLink.rel;

    item.append(link);

    return item;
  }

  getSourceLinkLabel(sourceLink) {
    const standardLabel = sourceLink.querySelector(":scope > span");

    return this.normalizeText(
      standardLabel?.textContent || sourceLink.textContent
    );
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
    const { menu, moreButton, backButton, logoutButton } = this.elements;

    moreButton.addEventListener("click", () => this.openMenu());
    backButton.addEventListener("click", () => this.closeMenu());

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
    const { menu, moreButton } = this.elements;

    menu.hidden = false;

    moreButton.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("mobile-menu-open");

    this.focusLater(this.elements.backButton);
  }

  closeMenu({ restoreFocus = true } = {}) {
    const { menu, moreButton } = this.elements;

    menu.hidden = true;

    moreButton.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("mobile-menu-open");

    if (restoreFocus) moreButton.focus();
  }

  handleKeydown(event) {
    if (event.key !== "Escape" || this.elements.menu?.hidden) return;

    event.preventDefault();
    this.closeMenu();
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
