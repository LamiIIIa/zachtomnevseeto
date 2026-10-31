/* Akatsuki Shop v21 - all posts from additional equipment topic 515 */

(() => {
  "use strict";

  const DEFAULT_BASE_URL = "https://akatsukigood.forum.cool";
  const DEFAULT_SOURCES = [
    { topicId: 83, label: "\u041f\u0440\u0435\u043f\u0430\u0440\u0430\u0442\u044b" },
    { topicId: 82, label: "\u0412\u043e\u043e\u0440\u0443\u0436\u0435\u043d\u0438\u0435 \u0438 \u0437\u0430\u0449\u0438\u0442\u0430" },
    { topicId: 81, label: "\u041c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438" },
    { topicId: 515, label: "\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u0435" }
  ];
  const userConfig = window.AKATSUKI_SHOP_CONFIG || {};
  const configuredBaseUrl = String(userConfig.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const configuredBaseOrigin = new URL(configuredBaseUrl).origin;

  const isForumDocument = window.top === window
    && window.location.origin === configuredBaseOrigin;

  function currentTopicId() {
    try {
      return Number(new URL(window.location.href).searchParams.get("id") || 0);
    } catch (_) {
      const match = String(window.location.search || "").match(/[?&]id=(\d+)/);
      return match ? Number(match[1]) : 0;
    }
  }

  function findPostContainer(postId) {
    const selectors = postId ? [
      "#p" + postId + "-content",
      "#p" + postId + " .post-content",
      "#p" + postId + " .post-entry",
      "#p" + postId + " .usercontent",
      "#p" + postId
    ] : [];
    for (let index = 0; index < selectors.length; index += 1) {
      const node = document.querySelector(selectors[index]);
      if (node) return node;
    }
    const candidates = document.querySelectorAll(
      "#pun-main .post-content, #pun-main .post-entry, #pun-main .usercontent"
    );
    return candidates.length ? candidates[candidates.length - 1] : null;
  }

  function hideLegacyFrames(container) {
    if (!container) return;
    const frames = container.querySelectorAll("iframe");
    for (let index = 0; index < frames.length; index += 1) {
      frames[index].hidden = true;
      frames[index].style.display = "none";
    }
  }

  function hideShopPostSignature(postId, container) {
    const post = (postId && document.getElementById("p" + postId))
      || (container && container.closest && container.closest(".post, [id^='p']"));
    if (!post) return;
    post.setAttribute("data-akatsuki-shop-post", "1");
    const signatures = post.querySelectorAll(
      ".post-sig, .post-signature, .signature, .sig-content, [class*='post-sig']"
    );
    for (let index = 0; index < signatures.length; index += 1) {
      signatures[index].hidden = true;
      signatures[index].style.setProperty("display", "none", "important");
    }
  }

  function mountShopRoot() {
    if (!isForumDocument) return null;
    const mountTopicId = Number(userConfig.mountTopicId || 476);
    if (mountTopicId && currentTopicId() !== mountTopicId) return null;
    const mountPostId = Number(userConfig.mountPostId || 43400);
    const container = findPostContainer(mountPostId);
    if (!container) return null;
    hideLegacyFrames(container);
    hideShopPostSignature(mountPostId, container);
    let mountedRoot = container.querySelector('[data-akatsuki-shop-host="main"]');
    if (!mountedRoot) {
      mountedRoot = document.createElement("div");
      mountedRoot.setAttribute("data-akatsuki-shop", "");
      mountedRoot.setAttribute("data-akatsuki-shop-host", "main");
      container.appendChild(mountedRoot);
    }
    return mountedRoot;
  }

  const root = mountShopRoot();
  if (!root || root.getAttribute("data-akatsuki-shop-started") === "1") return;
  root.setAttribute("data-akatsuki-shop-started", "1");
  root.classList.add("ashop");

  if (!document.getElementById("akatsuki-shop-styles-v13")) {
    const style = document.createElement("style");
    style.id = "akatsuki-shop-styles-v13";
    style.textContent = "\r\n\r\n  .ashop {\r\n    --ashop-accent: var(--color-link, #8f3131);\r\n    --ashop-hover: var(--color-hover, #b24040);\r\n    --ashop-surface: var(--color-forum, #f5f1f1);\r\n    --ashop-panel: var(--color-qv, #fbf8f8);\r\n    --ashop-soft: var(--color-lnthoverbg, #e9e3e3);\r\n    --ashop-text: var(--color-txt1, #292627);\r\n    --ashop-muted: var(--color-txt2, #746b69);\r\n    --ashop-border: var(--color-sub-border, #b7a7a7);\r\n    --ashop-on-accent: var(--color-txt3, #fff);\r\n    --ashop-shadow: var(--shedow1, rgba(0, 0, 0, .18));\r\n    --ashop-font-body: var(--font-g, \"Nunito Sans\"), Arial, sans-serif;\r\n    --ashop-font-heading: var(--font, \"Oswald\"), Arial, sans-serif;\r\n    box-sizing: border-box;\r\n    width: 100%;\r\n    color: var(--ashop-text);\r\n    font: 300 14px/1.5 var(--ashop-font-body);\r\n    letter-spacing: .35px;\r\n    color-scheme: light;\r\n  }\r\n\r\n  html.kakashi .ashop, body.kakashi .ashop { color-scheme: dark; }\r\n\r\n  .ashop *, .ashop *::before, .ashop *::after { box-sizing: border-box; }\r\n  .ashop button, .ashop input, .ashop select, .ashop textarea {\r\n    color: inherit;\r\n    font: inherit;\r\n    letter-spacing: inherit;\r\n  }\r\n\r\n  .ashop strong, .ashop b { font-weight: 600; }\r\n  .ashop h2, .ashop h3, .ashop h4 { font-family: var(--ashop-font-heading); font-weight: 500; letter-spacing: .7px; }\r\n\r\n  .ashop__shell {\r\n    overflow: hidden;\r\n    border: 1px solid var(--ashop-border);\r\n    border-radius: 12px 40px 18px 18px;\r\n    background: var(--ashop-surface);\r\n    box-shadow: -4px 6px 16px var(--ashop-shadow);\r\n  }\r\n\r\n  .ashop__head {\r\n    display: flex;\r\n    gap: 18px;\r\n    padding: 15px 20px;\r\n    background: var(--ashop-accent);\r\n    color: var(--ashop-on-accent);\r\n    align-items: center;\r\n    justify-content: space-between;\r\n  }\r\n\r\n  .ashop__head h2 {\r\n    margin: 0 !important;\r\n    color: inherit !important;\r\n    font-size: 21px !important;\r\n    line-height: 1.15 !important;\r\n    letter-spacing: .8px;\r\n    text-transform: uppercase;\r\n  }\r\n\r\n  .ashop__head p { margin: 4px 0 0; opacity: .82; }\r\n\r\n  .ashop__button {\r\n    display: inline-flex;\r\n    min-height: 38px;\r\n    border: 1px solid var(--ashop-accent);\r\n    border-radius: 7px 16px 7px 7px;\r\n    padding: 8px 14px;\r\n    background: var(--ashop-accent);\r\n    color: var(--ashop-on-accent) !important;\r\n    align-items: center;\r\n    justify-content: center;\r\n    cursor: pointer;\r\n    font-weight: 400 !important;\r\n    text-transform: uppercase;\r\n    transition: background .2s ease, border-color .2s ease, transform .2s ease;\r\n  }\r\n\r\n  .ashop__button:hover, .ashop__button:focus-visible {\r\n    border-color: var(--ashop-hover);\r\n    background: var(--ashop-hover);\r\n    outline: 0;\r\n    transform: translateY(-1px);\r\n  }\r\n\r\n  .ashop__button--ghost {\r\n    border-color: currentColor;\r\n    background: transparent;\r\n    color: inherit !important;\r\n  }\r\n\r\n  .ashop__button--ghost:hover, .ashop__button--ghost:focus-visible {\r\n    border-color: currentColor;\r\n    background: rgba(255, 255, 255, .12);\r\n  }\r\n\r\n  .ashop__head .ashop__button { flex: 0 0 auto; border-color: currentColor; }\r\n\r\n  .ashop__toolbar {\r\n    display: grid;\r\n    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(150px, .7fr);\r\n    gap: 8px;\r\n    padding: 12px 14px;\r\n    border-bottom: 1px solid var(--ashop-soft);\r\n    background: var(--ashop-surface);\r\n  }\r\n\r\n  .ashop__toolbar > * { min-width: 0 !important; }\r\n  .ashop__toolbar .ashop__button { width: 100%; }\r\n\r\n  .ashop__field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }\r\n  .ashop__field > span { color: var(--ashop-muted); font-size: 11px; }\r\n\r\n  .ashop__input, .ashop__select, .ashop__textarea {\r\n    width: 100%;\r\n    min-width: 0;\r\n    border: 1px solid var(--ashop-soft) !important;\r\n    border-radius: 9px 18px 9px 9px !important;\r\n    background: var(--ashop-panel) !important;\r\n    color: var(--ashop-text) !important;\r\n    box-shadow: none !important;\r\n  }\r\n\r\n  .ashop__input, .ashop__select { height: 39px; padding: 7px 10px !important; }\r\n  .ashop__textarea { min-height: 160px; padding: 11px !important; resize: vertical; }\r\n  .ashop__input:focus, .ashop__select:focus, .ashop__textarea:focus {\r\n    border-color: var(--ashop-accent) !important;\r\n    outline: 0;\r\n  }\r\n  .ashop__input::placeholder, .ashop__textarea::placeholder { color: var(--ashop-muted); opacity: .75; }\r\n\r\n  .ashop__status {\r\n    min-height: 32px;\r\n    padding: 7px 15px;\r\n    border-bottom: 1px solid var(--ashop-soft);\r\n    color: var(--ashop-muted);\r\n  }\r\n  .ashop__status.is-error { color: var(--ashop-hover); }\r\n  .ashop__status.is-loading { color: var(--ashop-accent); }\r\n\r\n  .ashop__loading {\r\n    display: flex;\r\n    min-height: 78px;\r\n    gap: 13px;\r\n    margin: 12px 14px 0;\r\n    padding: 14px 16px;\r\n    border: 1px solid var(--ashop-border);\r\n    border-radius: 10px 26px 12px 12px;\r\n    background: var(--ashop-panel);\r\n    color: var(--ashop-text);\r\n    align-items: center;\r\n  }\r\n  .ashop__loading[hidden] { display: none !important; }\r\n  .ashop__spinner {\r\n    width: 31px;\r\n    height: 31px;\r\n    flex: 0 0 31px;\r\n    border: 3px solid var(--ashop-soft);\r\n    border-top-color: var(--ashop-accent);\r\n    border-radius: 50%;\r\n    animation: ashop-spin .8s linear infinite;\r\n  }\r\n  .ashop__loading-copy { display: grid; gap: 2px; min-width: 0; }\r\n  .ashop__loading-copy strong { color: var(--ashop-accent); font-size: 14px; }\r\n  .ashop__loading-copy span { color: var(--ashop-muted); font-size: 12px; }\r\n  @keyframes ashop-spin { to { transform: rotate(360deg); } }\r\n  @media (prefers-reduced-motion: reduce) { .ashop__spinner { animation-duration: 1.8s; } }\r\n\r\n  .ashop__stats {\r\n    margin: 12px 14px 0;\r\n    border: 1px solid var(--ashop-soft);\r\n    border-radius: 10px 26px 12px 12px;\r\n    background: var(--ashop-panel);\r\n    overflow: hidden;\r\n  }\r\n\r\n  .ashop__stats > summary {\r\n    display: flex;\r\n    min-height: 44px;\r\n    padding: 10px 14px;\r\n    color: var(--ashop-accent);\r\n    align-items: center;\r\n    justify-content: space-between;\r\n    cursor: pointer;\r\n    font-weight: 500;\r\n    list-style: none;\r\n    text-transform: uppercase;\r\n  }\r\n  .ashop__stats > summary::-webkit-details-marker { display: none; }\r\n  .ashop__stats > summary::after { content: \"+\"; font-size: 20px; }\r\n  .ashop__stats[open] > summary::after { content: \"\u2212\"; }\r\n\r\n  .ashop__stats-body { padding: 0 14px 14px; border-top: 1px solid var(--ashop-soft); }\r\n  .ashop__stats-grid {\r\n    display: grid;\r\n    grid-template-columns: repeat(5, minmax(110px, 1fr));\r\n    gap: 8px;\r\n    margin-top: 12px;\r\n  }\r\n  .ashop__stats-grid label { display: flex; flex-direction: column; gap: 4px; color: var(--ashop-muted); font-size: 11px; }\r\n  .ashop__stats-note { margin: 9px 0 0; color: var(--ashop-muted); font-size: 11px; }\r\n\r\n  .ashop__layout {\r\n    display: flex;\r\n    min-width: 0;\r\n    gap: 18px;\r\n    padding: 12px 14px 14px;\r\n    flex-direction: column;\r\n  }\r\n\r\n  .ashop__layout > main { width: 100%; min-width: 0; }\r\n\r\n  .ashop__catalog-head, .ashop__cart-head {\r\n    display: flex;\r\n    gap: 10px;\r\n    margin-bottom: 10px;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n  }\r\n  .ashop__catalog-head h3, .ashop__cart-head h3 { margin: 0 !important; color: var(--ashop-accent) !important; font-size: 17px !important; text-transform: uppercase; }\r\n  .ashop__count { color: var(--ashop-muted); font-size: 12px; }\r\n  .ashop__catalog-filter { margin-bottom: 12px; }\r\n  .ashop__catalog-filter[hidden] { display: none !important; }\r\n\r\n  .ashop__items {\r\n    display: grid;\r\n    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\r\n    gap: 9px;\r\n    width: 100%;\r\n    min-width: 0;\r\n  }\r\n\r\n  .ashop__card {\r\n    display: grid;\r\n    grid-template-columns: minmax(0, 1fr);\r\n    align-content: start;\r\n    width: 100%;\r\n    min-width: 0;\r\n    border: 1px solid var(--ashop-soft);\r\n    border-radius: 9px 22px 12px 12px;\r\n    background: var(--ashop-panel);\r\n    overflow: hidden;\r\n    transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;\r\n  }\r\n  .ashop__card:hover { border-color: var(--ashop-accent); box-shadow: -2px 3px 8px var(--ashop-shadow); transform: translateY(-1px); }\r\n  .ashop__card.is-unavailable { opacity: .72; }\r\n\r\n  .ashop__image {\r\n    display: flex;\r\n    width: 100%;\r\n    height: 190px;\r\n    padding: 12px;\r\n    background: var(--ashop-soft);\r\n    align-items: center;\r\n    justify-content: center;\r\n    overflow: hidden;\r\n  }\r\n  .ashop__image img { display: block; width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: scale-down !important; object-position: center; cursor: default; }\r\n  .ashop__image span { padding: 10px; color: var(--ashop-muted); text-align: center; font-size: 11px; }\r\n  .ashop__image-open { display: block; padding: 10px 12px; border-top: 1px solid var(--ashop-soft); color: var(--ashop-accent); font-size: 12px; text-align: right; }\r\n  .ashop__image-open:focus-visible { outline: 2px solid var(--ashop-accent); outline-offset: -3px; }\r\n  .ashop__card-body { width: 100%; min-width: 0; padding: 10px; overflow: hidden; }\r\n  .ashop__card-title { display: flex; gap: 9px; align-items: flex-start; justify-content: space-between; }\r\n  .ashop__card-title h4 { margin: 0 !important; color: var(--ashop-text) !important; font-size: 13px !important; line-height: 1.3 !important; }\r\n  .ashop__price { flex: 0 0 auto; color: var(--ashop-accent); font-weight: 500; white-space: nowrap; }\r\n  .ashop__meta { margin-top: 4px; color: var(--ashop-muted); font-size: 11px; }\r\n  .ashop__summary {\r\n    display: -webkit-box;\r\n    margin: 7px 0;\r\n    color: var(--ashop-text);\r\n    font-size: 12px;\r\n    line-height: 1.42;\r\n    overflow: hidden;\r\n    overflow-wrap: anywhere;\r\n    -webkit-box-orient: vertical;\r\n    -webkit-line-clamp: 3;\r\n  }\r\n  .ashop__availability { margin: 7px 0; color: #37815d; font-size: 11px; }\r\n  .ashop__availability.is-bad { color: var(--ashop-hover); }\r\n\r\n  .ashop__details { margin: 8px 0; border-top: 1px solid var(--ashop-soft); border-bottom: 1px solid var(--ashop-soft); }\r\n  .ashop__details summary { padding: 7px 0; color: var(--ashop-accent); cursor: pointer; font-size: 11px; }\r\n  .ashop__details dl { display: grid; grid-template-columns: minmax(90px, .42fr) minmax(0, 1fr); gap: 5px 8px; margin: 0 0 9px; font-size: 11px; }\r\n  .ashop__details dt { color: var(--ashop-muted); }\r\n  .ashop__details dd { margin: 0; overflow-wrap: anywhere; }\r\n\r\n  .ashop__source { color: var(--ashop-accent) !important; font-size: 11px; text-decoration: none; }\r\n  .ashop__source:hover { color: var(--ashop-hover) !important; }\r\n  .ashop__buy { display: grid; grid-template-columns: 76px minmax(110px, 1fr); gap: 7px; margin-top: 9px; }\r\n  .ashop__buy .ashop__input { text-align: center; }\r\n  .ashop__buy .ashop__button { width: 100%; }\r\n  .ashop__button:disabled { opacity: .42; cursor: not-allowed; transform: none; }\r\n\r\n  .ashop__empty { grid-column: 1/-1; padding: 32px 18px; border: 1px dashed var(--ashop-border); border-radius: 10px 28px 14px 14px; color: var(--ashop-muted); text-align: center; }\r\n\r\n  .ashop__pagination { display: flex; gap: 6px; margin: 14px 0 2px; align-items: center; justify-content: center; flex-wrap: wrap; }\r\n  .ashop__page { min-width: 34px; min-height: 32px; padding: 5px 9px; border: 1px solid var(--ashop-soft); border-radius: 7px; background: var(--ashop-panel); color: var(--ashop-accent); cursor: pointer; }\r\n  .ashop__page:hover, .ashop__page.is-current { border-color: var(--ashop-accent); background: var(--ashop-accent); color: var(--ashop-button-text); }\r\n  .ashop__page:disabled { opacity: .38; cursor: default; }\r\n\r\n  .ashop__character { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; margin: 12px 14px 0; padding: 13px; border: 1px solid var(--ashop-soft); border-radius: 9px 22px 12px 12px; background: var(--ashop-panel); }\r\n  .ashop__character .ashop__field { min-width: 0; }\r\n  .ashop__character-status { grid-column: 1/-1; color: var(--ashop-muted); font-size: 11px; }\r\n  .ashop__wallet { color: var(--ashop-accent); font-weight: 500; }\r\n\r\n  .ashop__cart {\r\n    position: static;\r\n    width: 100%;\r\n    max-width: none;\r\n    max-height: none;\r\n    padding: 16px;\r\n    border: 1px solid var(--ashop-soft);\r\n    border-radius: 10px 27px 14px 14px;\r\n    background: var(--ashop-panel);\r\n    box-shadow: none;\r\n    overflow: visible;\r\n  }\r\n  .ashop__cart-empty { min-height: 70px; padding: 22px 10px; color: var(--ashop-muted); text-align: center; }\r\n  .ashop__cart-scroll { overflow-x: auto; }\r\n  .ashop__cart-table { width: 100%; border-collapse: collapse; font-size: 11px; }\r\n  .ashop__cart-table th, .ashop__cart-table td { padding: 7px 5px; border-bottom: 1px solid var(--ashop-soft); text-align: left; vertical-align: middle; }\r\n  .ashop__cart-table th { color: var(--ashop-muted); font-weight: 400; }\r\n  .ashop__cart-table td:nth-child(3), .ashop__cart-table th:nth-child(3) { text-align: right; white-space: nowrap; }\r\n  .ashop .ashop__cart-table { display: table; table-layout: fixed; width: 100%; }\r\n  .ashop .ashop__cart-table thead { display: table-header-group; }\r\n  .ashop .ashop__cart-table tbody { display: table-row-group; }\r\n  .ashop .ashop__cart-table tr { display: table-row; }\r\n  .ashop .ashop__cart-table th, .ashop .ashop__cart-table td { display: table-cell; box-sizing: border-box; float: none; }\r\n  .ashop .ashop__cart-table th:first-child, .ashop .ashop__cart-table td:first-child { width: calc(100% - 268px); }\r\n  .ashop .ashop__cart-table th:nth-child(2), .ashop .ashop__cart-table td:nth-child(2) { width: 120px; text-align: center; }\r\n  .ashop .ashop__cart-table th:nth-child(3), .ashop .ashop__cart-table td:nth-child(3) { width: 110px; text-align: right; }\r\n  .ashop .ashop__cart-table th:nth-child(4), .ashop .ashop__cart-table td:nth-child(4) { width: 38px; text-align: right; }\r\n  .ashop .ashop__cart-table th { white-space: nowrap; }\r\n  .ashop .ashop__cart-name { overflow-wrap: anywhere; }\r\n  .ashop .ashop__qty { width: 98px; margin: 0 auto; }\r\n  .ashop .ashop__qty input { box-sizing: border-box; min-width: 0; padding: 0 3px; }\r\n\r\n  .ashop__cart-name { display: block; font-weight: 500; }\r\n  .ashop__cart-meta { color: var(--ashop-muted); font-size: 10px; }\r\n\r\n  .ashop__qty { display: grid; grid-template-columns: 26px 46px 26px; align-items: center; }\r\n  .ashop__qty button, .ashop__remove {\r\n    height: 28px;\r\n    border: 1px solid var(--ashop-soft);\r\n    background: var(--ashop-surface);\r\n    color: var(--ashop-accent);\r\n    cursor: pointer;\r\n  }\r\n  .ashop__qty input { width: 46px; height: 28px; border: 1px solid var(--ashop-soft); background: var(--ashop-panel); color: var(--ashop-text); text-align: center; }\r\n  .ashop__remove { width: 28px; border-radius: 7px; }\r\n\r\n  .ashop__totals { display: grid; grid-template-columns: 1fr auto; gap: 5px 12px; margin-top: 11px; padding: 11px; border-radius: 9px 22px 12px 12px; background: var(--ashop-soft); }\r\n  .ashop__totals span:nth-child(2n) { text-align: right; }\r\n  .ashop__grand { color: var(--ashop-accent); font-size: 16px; font-weight: 500; }\r\n\r\n  .ashop__post-tools { display: grid; gap: 8px; margin-top: 11px; }\r\n  .ashop__post-tools .ashop__button { width: 100%; }\r\n  .ashop__copy-note { min-height: 18px; color: var(--ashop-muted); text-align: center; font-size: 11px; }\r\n\r\n  @media (max-width: 1180px) {\r\n    .ashop__toolbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }\r\n    .ashop__toolbar .ashop__field:first-child { grid-column: 1/-1; }\r\n    .ashop__toolbar .ashop__button { grid-column: 1/-1; }\r\n    .ashop__items { grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }\r\n    .ashop__stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\r\n  }\r\n\r\n  @media (max-width: 820px) {\r\n    .ashop__shell { border-radius: 10px 30px 16px 16px; }\r\n    .ashop__head { padding: 14px 16px; }\r\n    .ashop__head h2 { font-size: 18px !important; }\r\n    .ashop__head p { display: none; }\r\n    .ashop__layout { padding: 10px; }\r\n    .ashop__items { grid-template-columns: 1fr; }\r\n  }\r\n\r\n  @media (max-width: 620px) {\r\n    .ashop { font-size: 13px; letter-spacing: .25px; }\r\n    .ashop__head { align-items: flex-start; }\r\n    .ashop__head .ashop__button { min-height: 34px; padding: 6px 10px; font-size: 11px; }\r\n    .ashop__toolbar { grid-template-columns: 1fr; padding: 9px; }\r\n    .ashop__toolbar .ashop__field:first-child { grid-column: 1/-1; }\r\n    .ashop__toolbar .ashop__button { grid-column: 1/-1; }\r\n    .ashop__stats { margin: 9px 9px 0; }\r\n    .ashop__character { grid-template-columns: 1fr; margin: 9px 9px 0; }\r\n    .ashop__character .ashop__button { width: 100%; }\r\n    .ashop__character-status { grid-column: 1; }\r\n    .ashop__loading { margin: 9px 9px 0; }\r\n    .ashop__stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\r\n    .ashop__items { grid-template-columns: 1fr; }\r\n    .ashop__card { grid-template-columns: minmax(0, 1fr); border-radius: 9px 22px 12px 12px; }\r\n    .ashop__image { height: 170px; }\r\n    .ashop__card-body { padding: 10px; }\r\n    .ashop__card-title { display: block; }\r\n    .ashop__price { margin-top: 4px; }\r\n    .ashop__details dl { grid-template-columns: 1fr; }\r\n    .ashop__details dd { padding-bottom: 4px; }\r\n    .ashop__buy { grid-template-columns: 68px minmax(0, 1fr); }\r\n    .ashop__cart-table { min-width: 350px; }\r\n  }";
    (document.head || document.documentElement).appendChild(style);
  }
  root.innerHTML = "<div class=\"ashop__shell\">\r\n    <header class=\"ashop__head\">\r\n      <div>\r\n        <h2>\u041c\u0430\u0433\u0430\u0437\u0438\u043d \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u044f</h2>\r\n        <p>\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u0437\u0430\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f \u0438\u0437 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u043e\u0432 \u0444\u043e\u0440\u0443\u043c\u0430.</p>\r\n      </div>\r\n      <button class=\"ashop__button ashop__button--ghost\" type=\"button\" data-role=\"refresh\">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433</button>\r\n    </header>\r\n\r\n    <div class=\"ashop__toolbar\">\r\n      <label class=\"ashop__field\">\r\n        <span>\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0432\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044e</span>\r\n        <input class=\"ashop__input\" type=\"search\" placeholder=\"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435, \u044d\u0444\u0444\u0435\u043a\u0442, \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u0435...\" data-role=\"search\">\r\n      </label>\r\n      <label class=\"ashop__field\">\r\n        <span>\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f</span>\r\n        <select class=\"ashop__select\" data-role=\"section\"><option value=\"all\">\u0412\u0441\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438</option></select>\r\n      </label>\r\n      <button class=\"ashop__button\" type=\"button\" data-role=\"reset\">\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c</button>\r\n    </div>\r\n\r\n    <div class=\"ashop__loading\" data-role=\"loading\" role=\"status\" aria-live=\"polite\">\r\n      <span class=\"ashop__spinner\" aria-hidden=\"true\"></span>\r\n      <span class=\"ashop__loading-copy\">\r\n        <strong>\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043a\u0430\u0442\u0430\u043b\u043e\u0433</strong>\r\n        <span data-role=\"loading-text\">\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0430\u0435\u043c\u0441\u044f \u043a \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0430\u043c\u2026</span>\r\n      </span>\r\n    </div>\r\n    <div class=\"ashop__status is-loading\" data-role=\"status\">\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430\u2026</div>\r\n\r\n    <div class=\"ashop__character\">\r\n      <label class=\"ashop__field\">\r\n        <span>\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430</span>\r\n        <select class=\"ashop__select\" data-role=\"character\">\r\n          <option value=\"\">\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0441\u043a\u0438\u043b\u043b\u044b \u0432\u0440\u0443\u0447\u043d\u0443\u044e</option>\r\n        </select>\r\n      </label>\r\n      <button class=\"ashop__button ashop__button--ghost\" type=\"button\" data-role=\"character-refresh\">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a</button>\r\n      <div class=\"ashop__character-status\" data-role=\"character-status\">\u041c\u043e\u0436\u043d\u043e \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u0438\u043b\u0438 \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0441\u043a\u0438\u043b\u043b\u044b \u0432\u0440\u0443\u0447\u043d\u0443\u044e.</div>\r\n    </div>\r\n\r\n    <details class=\"ashop__stats\" open>\r\n      <summary>\u0421\u043a\u0438\u043b\u043b\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430 \u0434\u043b\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438 \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u0439</summary>\r\n      <div class=\"ashop__stats-body\">\r\n        <div class=\"ashop__stats-grid\">\r\n          <label>\u0421\u0438\u043b\u0430<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"sila\"></label>\r\n          <label>\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"skor\"></label>\r\n          <label>\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"zdr\"></label>\r\n          <label>\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"tai\"></label>\r\n          <label>\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"nin\"></label>\r\n          <label>\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"fuin\"></label>\r\n          <label>\u0422\u0430\u043a\u0442\u0438\u043a\u0430<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"takt\"></label>\r\n          <label>\u0417\u043d\u0430\u043d\u0438\u044f<input class=\"ashop__input\" type=\"number\" min=\"0\" value=\"0\" data-stat=\"znan\"></label>\r\n        </div>\r\n        <p class=\"ashop__stats-note\">\u0410\u0432\u0442\u043e\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0443\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442 \u0447\u0438\u0441\u043b\u043e\u0432\u044b\u0435 \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f. \u0412\u043b\u0430\u0434\u0435\u043d\u0438\u0435 \u0442\u0435\u0445\u043d\u0438\u043a\u0430\u043c\u0438, \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043b\u043e\u043a\u0430\u0446\u0438\u044f\u043c \u0438 \u0438\u043d\u044b\u0435 \u0442\u0435\u043a\u0441\u0442\u043e\u0432\u044b\u0435 \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u043d\u0443\u0436\u043d\u043e \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u0432 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0435.</p>\r\n      </div>\r\n    </details>\r\n\r\n    <div class=\"ashop__layout\">\r\n      <main>\r\n        <div class=\"ashop__catalog-filter\" data-role=\"type-filter-wrap\" hidden>\r\n          <label class=\"ashop__field\">\r\n            <span>\u0422\u0438\u043f</span>\r\n            <select class=\"ashop__select\" data-role=\"type\"><option value=\"all\">\u0412\u0441\u0435 \u0442\u0438\u043f\u044b</option></select>\r\n          </label>\r\n        </div>\r\n        <div class=\"ashop__catalog-head\">\r\n          <h3>\u041a\u0430\u0442\u0430\u043b\u043e\u0433</h3>\r\n          <span class=\"ashop__count\" data-role=\"catalog-count\"></span>\r\n        </div>\r\n        <div class=\"ashop__items\" data-role=\"items\"></div>\r\n        <nav class=\"ashop__pagination\" data-role=\"pagination\" aria-label=\"\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430\"></nav>\r\n      </main>\r\n\r\n      <aside class=\"ashop__cart\">\r\n        <div class=\"ashop__cart-head\">\r\n          <h3>\u041a\u043e\u0440\u0437\u0438\u043d\u0430</h3>\r\n          <button class=\"ashop__button ashop__button--ghost\" type=\"button\" data-role=\"clear\">\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c</button>\r\n        </div>\r\n        <div class=\"ashop__cart-empty\" data-role=\"cart-empty\">\u041f\u043e\u043a\u0430 \u043f\u0443\u0441\u0442\u043e</div>\r\n        <div data-role=\"cart-content\" hidden>\r\n          <div class=\"ashop__cart-scroll\">\r\n            <table class=\"ashop__cart-table\">\r\n              <thead><tr><th>\u041f\u0440\u0435\u0434\u043c\u0435\u0442</th><th>\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e</th><th>\u0421\u0443\u043c\u043c\u0430</th><th></th></tr></thead>\r\n              <tbody data-role=\"cart-rows\"></tbody>\r\n            </table>\r\n          </div>\r\n\r\n          <div class=\"ashop__totals\">\r\n            <span>\u041f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432</span><span data-role=\"total-qty\">0</span>\r\n            <span>\u041f\u043e\u0434\u044b\u0442\u043e\u0433</span><span><span data-role=\"subtotal\">0</span> \u0440\u0451</span>\r\n            <span>\u0421\u043a\u0438\u0434\u043a\u0430</span><span><span data-role=\"discount\">0% (\u22120)</span> \u0440\u0451</span>\r\n            <span class=\"ashop__grand\">\u0418\u0442\u043e\u0433\u043e</span><span class=\"ashop__grand\"><span data-role=\"grand-total\">0</span> \u0440\u0451</span>\r\n            <span data-role=\"wallet-label\" hidden>\u0411\u044b\u043b\u043e \u0432 \u043a\u043e\u0448\u0435\u043b\u044c\u043a\u0435</span><span data-role=\"wallet-value\" hidden></span>\r\n            <span data-role=\"wallet-after-label\" hidden>\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u043a\u0443\u043f\u043a\u0438</span><span data-role=\"wallet-after\" hidden></span>\r\n          </div>\r\n\r\n          <div class=\"ashop__post-tools\">\r\n            <input class=\"ashop__input\" type=\"text\" placeholder=\"\u0421\u0442\u0440\u043e\u043a\u0430 \u044d\u043f\u0438\u0437\u043e\u0434\u0430 \u2014 \u043d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\" data-role=\"episode\">\r\n            <button class=\"ashop__button\" type=\"button\" data-role=\"copy\">\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u043a\u0441\u0442 \u043f\u043e\u043a\u0443\u043f\u043a\u0438</button>\r\n            <div class=\"ashop__copy-note\" data-role=\"copy-note\"></div>\r\n            <textarea class=\"ashop__textarea\" rows=\"9\" readonly data-role=\"output\"></textarea>\r\n          </div>\r\n        </div>\r\n      </aside>\r\n    </div>\r\n  </div>";

  window.AKATSUKI_SHOP_WATCHDOG = window.setTimeout(() => {
    const loading = root.querySelector('[data-role="loading"]');
    const status = root.querySelector('[data-role="status"]');
    const refresh = root.querySelector('[data-role="refresh"]');
    if (!loading || loading.hidden) return;
    loading.hidden = true;
    if (refresh) refresh.disabled = false;
    if (status) {
      status.className = "ashop__status is-error";
      status.textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c. \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u00ab\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u00bb \u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0430\u043c.";
    }
  }, 25000);

  const config = {
    baseUrl: configuredBaseUrl,
    cacheMinutes: Number.isFinite(Number(userConfig.cacheMinutes)) ? Number(userConfig.cacheMinutes) : 20,
    sources: userConfig.sources || DEFAULT_SOURCES
  };

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => Array.from(root.querySelectorAll(selector));
  const ui = {
    refresh: $('[data-role="refresh"]'),
    reset: $('[data-role="reset"]'),
    loading: $('[data-role="loading"]'),
    loadingText: $('[data-role="loading-text"]'),
    status: $('[data-role="status"]'),
    search: $('[data-role="search"]'),
    section: $('[data-role="section"]'),
    typeWrap: $('[data-role="type-filter-wrap"]'),
    type: $('[data-role="type"]'),
    character: $('[data-role="character"]'),
    characterRefresh: $('[data-role="character-refresh"]'),
    characterStatus: $('[data-role="character-status"]'),
    items: $('[data-role="items"]'),
    pagination: $('[data-role="pagination"]'),
    catalogCount: $('[data-role="catalog-count"]'),
    clear: $('[data-role="clear"]'),
    cartEmpty: $('[data-role="cart-empty"]'),
    cartContent: $('[data-role="cart-content"]'),
    cartRows: $('[data-role="cart-rows"]'),
    totalQty: $('[data-role="total-qty"]'),
    subtotal: $('[data-role="subtotal"]'),
    discount: $('[data-role="discount"]'),
    grandTotal: $('[data-role="grand-total"]'),
    walletLabel: $('[data-role="wallet-label"]'),
    walletValue: $('[data-role="wallet-value"]'),
    walletAfterLabel: $('[data-role="wallet-after-label"]'),
    walletAfter: $('[data-role="wallet-after"]'),
    episode: $('[data-role="episode"]'),
    copy: $('[data-role="copy"]'),
    copyNote: $('[data-role="copy-note"]'),
    output: $('[data-role="output"]')
  };

  const statLabels = {
    sila: "\u0421\u0438\u043b\u0430", skor: "\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c", zdr: "\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435", tai: "\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443",
    nin: "\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443", fuin: "\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443", takt: "\u0422\u0430\u043a\u0442\u0438\u043a\u0430", znan: "\u0417\u043d\u0430\u043d\u0438\u044f"
  };

  const statAliases = {
    sila: ["\u0441\u0438\u043b\u0430"],
    skor: ["\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c"],
    zdr: ["\u0437\u0434\u043e\u0440\u043e\u0432\u044c\u0435"],
    tai: ["\u0442\u0430\u0439\u0434\u0437\u044e\u0446\u0443"],
    nin: ["\u043d\u0438\u043d\u0434\u0437\u044e\u0446\u0443", "\u043d\u0438\u0434\u0437\u044e\u0446\u0443"],
    fuin: ["\u0444\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443", "\u0444\u0443\u0438\u043d\u0434\u0446\u044e\u0446\u0443", "\u0444\u0443\u0438\u043d\u0434\u0437\u0443\u0446\u0443"],
    takt: ["\u0442\u0430\u043a\u0442\u0438\u043a\u0430"],
    znan: ["\u0437\u043d\u0430\u043d\u0438\u044f"]
  };

  const rankOrder = { "-": 0, "E": 1, "D": 2, "C": 3, "B": 4, "A": 5, "S": 6 };
  const state = {
    items: [], cart: new Map(), errors: [], page: 1, pageSize: 10,
    characters: [], character: null, wallet: null
  };

  function normalize(value) {
    return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return normalize(value).toLocaleLowerCase("ru-RU").replace(/\u0451/g, "\u0435");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function textWithBreaks(element) {
    if (!element) return "";
    const clone = element.cloneNode(true);
    clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    clone.querySelectorAll("li").forEach((li) => li.append("\n"));
    return String(clone.textContent || "")
      .replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, " \u00b7 ").replace(/(?:\s*\u00b7\s*){2,}/g, " \u00b7 ").trim();
  }

  function parseMoney(value) {
    const match = String(value || "").replace(/[\u2019']/g, " ").match(/\d[\d\s\u00a0]*/);
    if (!match) return null;
    const digits = match[0].replace(/\D/g, "");
    return digits ? Number(digits) : null;
  }

  function characterForumUrl(page) {
    return `${config.baseUrl}/viewforum.php?id=144${page > 1 ? `&p=${page}` : ""}`;
  }

  function parseCharacterTopics(doc) {
    const result = [];
    const seen = new Set();
    const selector = [
      '#pun-main td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-viewforum td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      'td.tcl .tclcon > a[href*="viewtopic.php?id="]',
      '#pun-main .main-item a[href*="viewtopic.php?id="]',
      '#pun-viewforum .main-item a[href*="viewtopic.php?id="]'
    ].join(",");
    let links = doc.querySelectorAll(selector);
    if (!links.length) links = doc.querySelectorAll('a[href*="viewtopic.php?id="]');
    links.forEach((link) => {
      const match = String(link.getAttribute("href") || "").match(/[?&]id=(\d+)/);
      const title = normalize(link.textContent || link.getAttribute("title"));
      const personalCase = /^\u043b\u0438\u0447\u043d\u043e\u0435\s+\u0434\u0435\u043b\u043e\s*(?:[:\u2014\u2013-]\s*)?(.+)$/i.exec(title);
      const name = personalCase ? normalize(personalCase[1]) : "";
      if (!match || !name || seen.has(match[1])) return;
      seen.add(match[1]);
      result.push({ id: match[1], name, url: topicUrl(match[1]) });
    });
    return result;
  }

  function getLastForumPage(doc) {
    let last = 1;
    doc.querySelectorAll('a[href*="viewforum.php"]').forEach((link) => {
      const match = String(link.getAttribute("href") || "").match(/[?&]p=(\d+)/);
      if (match) last = Math.max(last, Number(match[1]) || 1);
    });
    return Math.min(last, 50);
  }

  function parseCharacterStat(value) {
    const text = normalize(value).replace(/[\u2212\u2013\u2014]/g, "-");
    const first = text.match(/-?\d+/);
    if (!first) return 0;
    let result = Number(first[0]) || 0;
    const rest = text.slice((first.index || 0) + first[0].length);
    let match;
    const expression = /([+-])\s*(\d+)/g;
    while ((match = expression.exec(rest))) result += (match[1] === "+" ? 1 : -1) * Number(match[2]);
    const displayedTotal = text.match(/=\s*(-?\d+)\s*$/);
    return Math.max(0, displayedTotal ? Number(displayedTotal[1]) : result);
  }

  function parseCharacterStats(post) {
    const result = {};
    if (!post) return result;
    post = akcmNormalizePost(post);
    post.querySelectorAll("table tr").forEach((row) => {
      const cells = Array.from(row.cells || row.children || []);
      if (cells.length < 2) return;
      const label = normalizeKey(cells[0].textContent);
      Object.entries(statAliases).forEach(([key, aliases]) => {
        if (aliases.some((alias) => label === alias || label.startsWith(alias))) {
          result[key] = parseCharacterStat(cells.slice(1).map((cell) => cell.textContent).join(" "));
        }
      });
    });
    return result;
  }

  function parseWallet(post) {
    post = akcmThirdSection(post, "\u041a\u043e\u0448\u0435\u043b\u0451\u043a");
    if (!post) return null;
    const text = textWithBreaks(post).replace(/\u00b7/g, "\n");
    const card = /\u043a\u043e\u0448\u0435\u043b[\u0435\u0451]\u043a[\s\S]{0,240}?(\d[\d\s\u00a0]*)\s*\u0440[\u0435\u0451]/i.exec(text);
    if (card) return parseMoney(card[1]);
    const phrase = /\u043d\u0430\s+\u0434\u0430\u043d\u043d\u044b\u0439\s+\u043c\u043e\u043c\u0435\u043d\u0442\s+\u0432\s+\u043a\u043e\u0448\u0435\u043b\u044c\u043a\u0435[\s\S]{0,180}?(\d[\d\s\u00a0]*)/i.exec(text);
    if (phrase) return parseMoney(phrase[1]);
    const row = Array.from(post.querySelectorAll("table tr")).find((candidate) =>
      normalizeKey(candidate.textContent).includes("\u043d\u0430 \u0434\u0430\u043d\u043d\u044b\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u0432 \u043a\u043e\u0448\u0435\u043b\u044c\u043a\u0435"));
    return row ? parseMoney(row.textContent.replace(/\u043d\u0430\s+\u0434\u0430\u043d\u043d\u044b\u0439\s+\u043c\u043e\u043c\u0435\u043d\u0442\s+\u0432\s+\u043a\u043e\u0448\u0435\u043b\u044c\u043a\u0435/i, "")) : null;
  }

  function fillCharacterSelect(items) {
    const selected = ui.character.value;
    ui.character.innerHTML = '<option value="">\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0441\u043a\u0438\u043b\u043b\u044b \u0432\u0440\u0443\u0447\u043d\u0443\u044e</option>';
    items.slice().sort((a, b) => a.name.localeCompare(b.name, "ru")).forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      ui.character.appendChild(option);
    });
    if (items.some((item) => item.id === selected)) ui.character.value = selected;
  }

  async function loadCharacterDirectory(force = false) {
    ui.character.disabled = true;
    ui.characterRefresh.disabled = true;
    ui.characterStatus.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u043f\u0438\u0441\u043e\u043a \u043b\u0438\u0447\u043d\u044b\u0445 \u0434\u0435\u043b\u2026";
    try {
      if (state.characters.length && !force) return state.characters;
      const firstDoc = await loadForumDocument(characterForumUrl(1));
      const pages = getLastForumPage(firstDoc);
      const docs = [firstDoc];
      for (let page = 2; page <= pages; page += 1) docs.push(await loadForumDocument(characterForumUrl(page)));
      const unique = new Map();
      docs.forEach((doc) => parseCharacterTopics(doc).forEach((item) => unique.set(item.id, item)));
      state.characters = Array.from(unique.values());
      fillCharacterSelect(state.characters);
      ui.characterStatus.textContent = `\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u043b\u0438\u0447\u043d\u044b\u0445 \u0434\u0435\u043b: ${state.characters.length}.`;
      return state.characters;
    } catch (error) {
      ui.characterStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043b\u0438\u0447\u043d\u044b\u0435 \u0434\u0435\u043b\u0430: ${error && error.message ? error.message : "\u043e\u0448\u0438\u0431\u043a\u0430"}`;
      return [];
    } finally {
      ui.character.disabled = false;
      ui.characterRefresh.disabled = false;
    }
  }

  async function selectCharacter(topicId) {
    state.character = null;
    state.wallet = null;
    const inputs = $$('[data-stat]');
    if (!topicId) {
      inputs.forEach((input) => { input.disabled = false; });
      ui.characterStatus.textContent = "\u0420\u0443\u0447\u043d\u043e\u0439 \u0440\u0435\u0436\u0438\u043c: \u0441\u043a\u0438\u043b\u043b\u044b \u043c\u043e\u0436\u043d\u043e \u0438\u0437\u043c\u0435\u043d\u044f\u0442\u044c.";
      renderItems();
      renderCart();
      return;
    }
    ui.character.disabled = true;
    ui.characterStatus.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u0441\u043a\u0438\u043b\u043b\u044b \u0438 \u043a\u043e\u0448\u0435\u043b\u0451\u043a \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430\u2026";
    try {
      const character = state.characters.find((item) => item.id === String(topicId));
      const doc = await loadForumDocument(topicUrl(topicId));
      let posts = doc.querySelectorAll(".post-content");
      if (!posts.length) posts = doc.querySelectorAll(".post-entry, .usercontent");
      if (posts.length < 2) throw new Error("\u0432\u043e \u0432\u0442\u043e\u0440\u043e\u043c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b");
      const stats = parseCharacterStats(posts[1]);
      inputs.forEach((input) => {
        input.value = String(stats[input.dataset.stat] || 0);
        input.disabled = true;
      });
      state.character = character || { id: String(topicId), name: "\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u0436", url: topicUrl(topicId) };
      state.wallet = parseWallet(posts[2]);
      state.cart.clear();
      const walletText = Number.isFinite(state.wallet) ? `${formatMoney(state.wallet)} \u0440\u0451` : "\u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d";
      ui.characterStatus.innerHTML = `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436: <strong>${escapeHtml(state.character.name)}</strong>. \u041a\u043e\u0448\u0435\u043b\u0451\u043a: <span class="ashop__wallet">${walletText}</span>.`;
      state.page = 1;
      renderItems();
      renderCart();
    } catch (error) {
      inputs.forEach((input) => { input.disabled = false; });
      ui.characterStatus.textContent = `\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430: ${error && error.message ? error.message : "\u043e\u0448\u0438\u0431\u043a\u0430"}`;
    } finally {
      ui.character.disabled = false;
    }
  }

  function normalizeRank(value) {
    const raw = normalize(value).toUpperCase().replace(/[\u0421]/g, "C").replace(/[\u0412]/g, "B").replace(/[\u0415]/g, "E").replace(/[\u0410]/g, "A");
    const match = raw.match(/(?:\u0420\u0410\u041d\u0413\s*)?([EDCBAS])(?:\s*-?\s*\u0420\u0410\u041d\u0413)?/);
    return match ? match[1] : (raw && raw !== "\u2014" ? raw : "-");
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function parseRequirements(value) {
    const result = {};
    const chunks = normalizeKey(value).split(/[,;]|\s+\u0438\s+(?=[\u0430-\u044f\u0451\s-]+(?:\u043d\u0435\s+\u043c\u0435\u043d\u0435\u0435|\u043d\u0435\s+\u043d\u0438\u0436\u0435|\u043e\u0442\s+)?\d)/i);
    chunks.forEach((chunk) => {
      const number = chunk.match(/\d+/);
      if (!number) return;
      const amount = Number(number[0]);
      Object.entries(statAliases).forEach(([key, aliases]) => {
        if (aliases.some((alias) => chunk.includes(alias))) result[key] = Math.max(result[key] || 0, amount);
      });
    });

    if (!Object.keys(result).length) {
      const whole = normalizeKey(value);
      const number = whole.match(/\d+/);
      if (number) {
        Object.entries(statAliases).forEach(([key, aliases]) => {
          if (aliases.some((alias) => whole.includes(alias))) result[key] = Number(number[0]);
        });
      }
    }
    return result;
  }

  function topicUrl(topicId) {
    return `${config.baseUrl}/viewtopic.php?id=${encodeURIComponent(topicId)}`;
  }

  function makeAbsolute(url, base) {
    try { return new URL(url, base).href; } catch (_) { return url || ""; }
  }

  function categoryName(value) {
    const cleaned = normalize(value)
      .replace(/^\u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d(?:\u044b\u0439|\u0430\u044f|\u043e\u0435|\u044b\u0435)\s+/i, "")
      .replace(/^[\u2726\u25c6\u25c8]+\s*/, "");
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
  }

  function isCatalogCategory(value) {
    const key = normalizeKey(value);
    return Boolean(key)
      && !/(?:^|\s)(?:\u0448\u0430\u0431\u043b\u043e\u043d|\u043f\u0440\u0438\u043c\u0435\u0440|\u043e\u0431\u0440\u0430\u0437\u0435\u0446|\u043a\u043e\u0434 \u0434\u043b\u044f \u0432\u0441\u0442\u0430\u0432\u043a\u0438|\u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435|\u043d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f|\u0441\u043e\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435|\u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f)(?:\s|$)/i.test(key);
  }

  function deriveName(fields, source, section, rowIndex) {
    const nameField = Object.keys(fields).find((key) => /^\u043d\u0430\u0437\u0432\u0430\u043d/i.test(normalize(key)));
    const direct = nameField ? fields[nameField] : "";
    if (direct && direct !== "-") return direct;
    if (source.topicId === 81 && normalizeKey(section) === "\u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438") {
      const rank = normalizeRank(fields["\u0420\u0430\u043d\u0433"] || "");
      return `\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u0430\u044f \u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0430${rank !== "-" ? ` ${rank}-\u0440\u0430\u043d\u0433\u0430` : ""}`;
    }
    if (section === "\u041e\u0441\u043e\u0431\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b") {
      const type = fields["\u0422\u0438\u043f"];
      if (type && type !== "-") return type;
      const description = normalize(fields["\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435"] || "");
      if (description) return description.split(/[.!?]/)[0].slice(0, 80);
    }
    return `${source.label}: \u043f\u043e\u0437\u0438\u0446\u0438\u044f ${rowIndex}`;
  }

  function parseSectionTable(table, source, section, postUrl) {
    const rows = Array.from(table.rows || []);
    if (rows.length < 2) return [];
    const headers = Array.from(rows[0].cells || []).map((cell) => normalize(textWithBreaks(cell)));
    if (!headers.some(Boolean)) return [];
    const templateNameField = headers.find((header) => /^\u043d\u0430\u0437\u0432\u0430\u043d/i.test(normalize(header)));
    const templatePriceField = headers.find((header) => normalizeKey(header).includes("\u0441\u0442\u043e\u0438\u043c"));
    const puppetTemplate = source.topicId === 81
      && normalizeKey(section) === "\u043c\u0430\u0440\u0438\u043e\u043d\u0435\u0442\u043a\u0438"
      && headers.some((header) => normalizeKey(header) === "\u0440\u0430\u043d\u0433")
      && headers.some((header) => normalizeKey(header) === "\u043a\u043e\u043c\u043f\u043b\u0435\u043a\u0442\u0430\u0446\u0438\u044f");
    if ((!templateNameField && !puppetTemplate) || !templatePriceField) return [];

    return rows.slice(1).map((row, index) => {
      const cells = Array.from(row.cells || []);
      if (!cells.length) return null;
      const fields = {};
      headers.forEach((header, cellIndex) => {
        if (header) fields[header] = textWithBreaks(cells[cellIndex]);
      });
      const joined = normalize(Object.values(fields).join(" "));
      if (!joined) return null;

      const nameField = Object.keys(fields).find((key) => /^\u043d\u0430\u0437\u0432\u0430\u043d/i.test(normalize(key)));
      const name = deriveName(fields, source, section, index + 1);
      const priceField = Object.keys(fields).find((key) => normalizeKey(key).includes("\u0441\u0442\u043e\u0438\u043c"));
      const rankField = Object.keys(fields).find((key) => /^(\u0440\u0430\u043d\u0433|\u0443\u0440\u043e\u0432\u0435\u043d\u044c)$/i.test(normalize(key)));
      const requirementsField = Object.keys(fields).find((key) => normalizeKey(key).includes("\u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d"));
      const price = parseMoney(priceField ? fields[priceField] : "");
      const rank = normalizeRank(rankField ? fields[rankField] : "");
      const imageCellIndex = headers.findIndex((header) => normalizeKey(header).includes("\u0438\u0437\u043e\u0431\u0440\u0430\u0436"));
      const imageNode = imageCellIndex >= 0 && cells[imageCellIndex] ? cells[imageCellIndex].querySelector("img") : null;
      const image = imageNode ? makeAbsolute(imageNode.getAttribute("src"), postUrl) : "";
      const requirementsText = requirementsField ? fields[requirementsField] : "";
      const req = parseRequirements(requirementsText);
      const typeField = Object.keys(fields).find((key) => normalizeKey(key) === "\u0442\u0438\u043f");
      const type = typeField ? fields[typeField] : "";
      const omitted = new Set([nameField, priceField, rankField, requirementsField].filter(Boolean));
      const details = Object.entries(fields)
        .filter(([key, value]) => !omitted.has(key) && !normalizeKey(key).includes("\u0438\u0437\u043e\u0431\u0440\u0430\u0436") && normalize(value) && normalize(value) !== "-")
        .map(([label, value]) => ({ label, value: normalize(value) }));
      const summary = details.slice(0, 2).map((part) => `${part.label}: ${part.value}`).join(" \u00b7 ");
      const id = `t${source.topicId}-${hash([postUrl, section, rank, name, price, index].join("|"))}`;

      const nameCellIndex = nameField ? headers.indexOf(nameField) : -1;
      const nameLink = nameCellIndex >= 0 && cells[nameCellIndex]
        ? cells[nameCellIndex].querySelector('a[href*="viewtopic.php"]')
        : null;
      const specialItemUrl = normalizeKey(section) === normalizeKey("\u041e\u0441\u043e\u0431\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b") && nameLink
        ? makeAbsolute(nameLink.getAttribute("href"), postUrl)
        : postUrl;

      return {
        id, name, price, rank, type, image, req, requirementsText: normalize(requirementsText),
        details, summary, section, topicId: source.topicId, topicLabel: source.label,
        sourceUrl: specialItemUrl, catalogUrl: postUrl,
        searchText: normalizeKey([name, rank, type, section, joined].join(" "))
      };
    }).filter(Boolean);
  }

  function parseTopic(documentOrHtml, source) {
    const doc = documentOrHtml && documentOrHtml.querySelectorAll
      ? documentOrHtml
      : new DOMParser().parseFromString(String(documentOrHtml || ""), "text/html");
    const result = [];
    let posts = doc.querySelectorAll(".post-content");
    if (!posts.length) posts = doc.querySelectorAll(".post-entry, .usercontent");
    posts.forEach((post) => {
      const postId = String(post.id || "").match(/p(\d+)-content/i);
      const postUrl = `${topicUrl(source.topicId)}${postId ? `#p${postId[1]}` : ""}`;
      post.querySelectorAll(".spoiler-box").forEach((box) => {
        const titleNode = box.querySelector(
          ":scope > div:first-child, :scope > .spoiler-title:first-child"
        );
        const rawSection = normalize(titleNode ? titleNode.textContent : "");
        if (!isCatalogCategory(rawSection)) return;
        const section = categoryName(rawSection);
        Array.from(box.querySelectorAll("table"))
          .filter((table) => table.closest(".spoiler-box") === box)
          .forEach((table) => result.push(...parseSectionTable(table, source, section, postUrl)));
      });
    });
    return result;
  }

  function uniqueItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function cacheKey() {
    return `akatsuki-shop-v11:${config.baseUrl}:${config.sources.map((source) => source.topicId).join("-")}`;
  }

  function readCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey()) || "null");
      const maxAge = Math.max(0, config.cacheMinutes) * 60 * 1000;
      if (cached && Array.isArray(cached.items) && Date.now() - cached.savedAt < maxAge) return cached.items;
    } catch (_) {}
    return null;
  }

  function writeCache(items) {
    try { sessionStorage.setItem(cacheKey(), JSON.stringify({ savedAt: Date.now(), items })); } catch (_) {}
  }

  function withTimeout(promise, timeoutMs, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(`${label}: \u043f\u0440\u0435\u0432\u044b\u0448\u0435\u043d\u043e \u0432\u0440\u0435\u043c\u044f \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u044f`)), timeoutMs);
      })
    ]);
  }


/* CHARACTER_TEMPLATE_START */
/* Shared personal-case template adapter. No network calls. */
function akcmLegacyCode(raw) {
  if (!/\[akcm\]/i.test(raw)) return raw;
  var text = String(raw), row = function (name, value) { return '[tr][td]' + name + '[/td][td]' + value + '[/td][/tr]'; };
  text = text.replace(/\[akcmhead\]([\s\S]*?)\[\/akcmhead\]/gi, function (_, body) {
    var level = body.match(/\[akcmtitle\]\s*\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s+(\d+)\s*\[\/akcmtitle\]/i), sum = body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i);
    return level ? '[table]' + row('\u0423\u0440\u043e\u0432\u0435\u043d\u044c', level[1]) + (sum ? row('\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430', sum[1]) : '') + '[/table]' : '';
  });
  text = text.replace(/\[akcmskill\]([\s\S]*?)\[\/akcmskill\]/gi, function (_, body) {
    return row((body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1], (body.match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]);
  });
  text = text.replace(/\[akcmrow\]([\s\S]*?)\[\/akcmrow\]/gi, function (_, body) {
    var name = (body.match(/\[akcmname\]([\s\S]*?)\[\/akcmname\]/i) || [,''])[1].replace('\u0410\u0442\u0430\u043a\u0430: \u0431\u043b\u0438\u0436\u043d\u0438\u0439', '\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439');
    var values = Array.from(body.matchAll(/\[akcmval\]([\s\S]*?)\[\/akcmval\]/gi)).map(function (m) { return (m[1].match(/\[akcmvalue\]([\s\S]*?)\[\/akcmvalue\]/i) || [,''])[1]; });
    if (!values.length) values = [(body.match(/\[akcmvalues?\]([\s\S]*?)\[\/akcmvalues?\]/i) || [,''])[1]];
    return '[tr][td]' + name + '[/td]' + values.map(function (v) { return '[td]' + v + '[/td]'; }).join('') + '[/tr]';
  });
  text = text.replace(/\[akcmrank\]([\s\S]*?)\[\/akcmrank\]/gi, function (_, body) { return row('\u0420\u0430\u043d\u0433: ' + (body.match(/\[akcmrankname\]([\s\S]*?)\[\/akcmrankname\]/i) || [,''])[1], (body.match(/\[akcmlist\]([\s\S]*?)\[\/akcmlist\]/i) || [,''])[1]); });
  text = text.replace(/\[akcmabilities\]([\s\S]*?)\[\/akcmabilities\]/gi, function (_, body) { return '[table]' + row('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', body) + '[/table]'; });
  text = text.replace(/\[akcmequipment\]([\s\S]*?)\[\/akcmequipment\]/gi, function (_, body) { return '[table][tr][td]' + body.replace(/\[akcmsection\]([\s\S]*?)\[\/akcmsection\]/gi, '[b]$1[/b]\n').replace(/\[akcmequiprow\]([\s\S]*?)\[\/akcmequiprow\]/gi, function (_, entry) { return '\u2022 ' + entry.replace(/\[\/akcmvalue\]\s*\[akcm(?:name|small)\]/gi, ': ') + '\n'; }) + '[/td][/tr][/table]'; });
  return text.replace(/\[\/?(?:akcmskills|akcmcombat|akcmtechniques)\]/gi, function (tag) { return tag.indexOf('[/') === 0 ? '[/table]' : '[table]'; }).replace(/\[akcmsection\][\s\S]*?\[\/akcmsection\]/gi, '').replace(/\[\/akcmitem\]/gi, '\n').replace(/\[\/?akcm\w*\]/gi, '').replace(/\[\/?widepost\]/gi, '');
}
function akcmTemplateCode(raw) {
  raw = String(raw).replace(/\[\/?widepost\]/gi, '').trim();
  if (/\[akcm\]/i.test(raw)) return '[widepost]\n' + raw;
  var plain = function (s) { return s.replace(/\[[^\]]*\]/g, '').trim(); }, skills = [], combat = [], ranks = [], ability = '', level = '', sum = '', remaining = raw;
  var skillNames = /^(\u0427\u0430\u043a\u0440\u0430|\u0421\u0438\u043b\u0430|\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c|\u0422\u0430\u043a\u0442\u0438\u043a\u0430|\u041d\u0438\u043d\u0434\u0437\u044e\u0446\u0443|\u0422\u0430\u0439\u0434\u0437\u044e\u0446\u0443|\u0413\u0435\u043d\u0434\u0437\u044e\u0446\u0443|\u0424\u0443\u0438\u043d\u0434\u0437\u044e\u0446\u0443|\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435|\u0417\u043d\u0430\u043d\u0438\u044f)$/i;
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    var handled = false, previous = '', unknown = [];
    body.replace(/\[tr[^\]]*\]([\s\S]*?)\[\/tr\]/gi, function (row, content) {
      var cells = Array.from(content.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
      var label = plain(cells[0] || ''), value = cells.slice(1).join('\n');
      if (/^\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s*:?$/i.test(label)) { level = plain(value); handled = true; }
      else if (skillNames.test(label)) { skills.push('[akcmskill][akcmname]' + label + '[/akcmname][akcmvalue]' + value + '[/akcmvalue][/akcmskill]'); handled = true; }
      else if (/^\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430$/i.test(label)) { sum = value; handled = true; }
      else if (/^\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430$/i.test(previous) && cells.length === 1) { sum = cells[0]; handled = true; }
      else if (/^\u0420\u0430\u043d\u0433\s*:/i.test(label)) { ranks.push('[akcmrank][akcmrankname]' + label.replace(/^\u0420\u0430\u043d\u0433\s*:\s*/i, '') + '[/akcmrankname][akcmlist]\n' + value.split(/\n+/).filter(function (s) { return s.trim(); }).map(function (s) { return '[akcmitem]' + s + '[/akcmitem]'; }).join('\n') + '\n[/akcmlist][/akcmrank]'); handled = true; }
      else if (/^\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438$/i.test(label)) { ability = value; handled = true; }
      else if (/^(\u0411\u043e\u0435\u0441\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u044c|\u0417\u0430\u043f\u0430\u0441\s+\u0427\u0430\u043a\u0440\u044b|\u0423\u0440\u043e\u043d|\u0417\u0430\u0449\u0438\u0442\u0430|\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439|\u0410\u0442\u0430\u043a\u0430|\u0423\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435|\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043a\u0440\u0438\u0442)/i.test(label) && cells.length >= 2) {
        var labels = /^\u0417\u0430\u043f\u0430\u0441/i.test(label) ? ['\u041e\u0431\u0449\u0438\u0439', '\u0421\u043a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439'] : ['\u041e\u0431\u044b\u0447\u043d\u044b\u0445', '\u0422\u0435\u0445\u043d\u0438\u043a\u0438'];
        value = cells.length === 3 ? '[akcmvalues]' + cells.slice(1).map(function (v, i) { return '[akcmval][akcmsmall]' + labels[i] + '[/akcmsmall][akcmvalue]' + v + '[/akcmvalue][/akcmval]'; }).join('') + '[/akcmvalues]' : '[akcmvalue]' + value + '[/akcmvalue]';
        combat.push('[akcmrow][akcmname]' + label + '[/akcmname]' + value + '[/akcmrow]'); handled = true;
      } else if (label && !/^(\u0421\u043a\u0438\u043b\u043b\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430|\u0422\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430)$/i.test(label)) unknown.push(row);
      previous = label;
    });
    return handled ? (unknown.length ? '[table]' + unknown.join('\n') + '[/table]' : '') : table;
  });
  if (!level || skills.length !== 10) throw new Error('\u041d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0438 \u0434\u0435\u0441\u044f\u0442\u044c \u0441\u043a\u0438\u043b\u043b\u043e\u0432. \u0418\u0441\u0445\u043e\u0434\u043d\u044b\u0439 \u043f\u043e\u0441\u0442 \u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439.');
  remaining = remaining.replace(/\[table[^\]]*\]([\s\S]*?)\[\/table\]/gi, function (table, body) {
    if (!/\u042d\u041a\u0418\u041f\u0418\u0420\u041e\u0412\u041a\u0410 \u041f\u0415\u0420\u0421\u041e\u041d\u0410\u0416\u0410/i.test(plain(body))) return table;
    var parts = Array.from(body.matchAll(/\[td[^\]]*\]([\s\S]*?)\[\/td\]/gi)).map(function (m) { return m[1]; });
    return '[akcmequipment][akcmhead][akcmheadpart][akcmcaption]\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u00b7 \u0441\u043d\u0430\u0440\u044f\u0436\u0435\u043d\u0438\u0435[/akcmcaption][akcmtitle]\u042d\u043a\u0438\u043f\u0438\u0440\u043e\u0432\u043a\u0430[/akcmtitle][/akcmheadpart][/akcmhead]\n' + parts.slice(1).map(function (part) {
      var lines = part.split(/\n+/), title = plain(lines.shift()).replace(/^[\u25c8\u2694]\s*/, '');
      return '[akcmsection]' + title + '[/akcmsection][akcmequiplist]' + lines.filter(function (line) { return line.trim(); }).map(function (line) { var match = line.replace(/^\u2022\s*/, '').split(/\s+\u2014\s+|:\s+/); return '[akcmequiprow][akcmvalue]' + match.shift() + '[/akcmvalue][akcmname]' + match.join(' \u2014 ') + '[/akcmname][/akcmequiprow]'; }).join('\n') + '[/akcmequiplist]';
    }).join('\n') + '[/akcmequipment]';
  });
  return '[widepost]\n[akcm]\n[akcmhead][akcmheadpart][akcmcaption]\u041b\u0438\u0447\u043d\u043e\u0435 \u0434\u0435\u043b\u043e \u00b7 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438[/akcmcaption][akcmtitle]\u0423\u0440\u043e\u0432\u0435\u043d\u044c ' + level + '[/akcmtitle][/akcmheadpart][akcmheadpart][akcmsmall]\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430[/akcmsmall][akcmvalue]' + sum + '[/akcmvalue][/akcmheadpart][/akcmhead]\n[akcmsection]\u0421\u043a\u0438\u043b\u043b\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430[/akcmsection][akcmskills]\n' + skills.join('\n') + '\n[/akcmskills]\n[akcmsection]\u0411\u043e\u0435\u0432\u044b\u0435 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b[/akcmsection][akcmcombat]\n' + combat.join('\n') + '\n[/akcmcombat]\n[akcmsection]\u0422\u0435\u0445\u043d\u0438\u043a\u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430[/akcmsection][akcmtechniques]\n' + ranks.join('\n') + '\n[/akcmtechniques]\n[akcmsection]\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438[/akcmsection][akcmabilities]' + ability + '[/akcmabilities]\n[/akcm]\n' + remaining.trim();
}
function akcmNormalizePost(post) {
  if (!post) return post;
  var clone = post.cloneNode(true), select = function (tag, scope) { return (scope || clone).querySelectorAll('.' + tag + ',.custom_tag_' + tag + ',.akcm-' + tag.slice(4) + ',.akcm__' + tag.slice(4) + ',[data-bbcode="' + tag + '"]'); };
  var skills = select('akcmskill');
  if (!skills.length) return post;
  var doc = post.ownerDocument, table = doc.createElement('table');
  function row(name, values) { var tr = table.insertRow(); tr.insertCell().textContent = name; values.forEach(function (value) { tr.insertCell().innerHTML = value; }); }
  var title = Array.from(select('akcmtitle')).find(function (n) { return /\u0423\u0440\u043e\u0432\u0435\u043d\u044c\s*\d+/i.test(n.textContent); });
  if (title) row('\u0423\u0440\u043e\u0432\u0435\u043d\u044c', [title.textContent.match(/\d+/)[0]]);
  var head = select('akcmhead')[0];
  if (head) { var sum = select('akcmvalue', head)[0]; if (sum) row('\u041e\u0431\u0449\u0430\u044f \u0441\u0443\u043c\u043c\u0430', [sum.innerHTML]); }
  Array.from(skills).concat(Array.from(select('akcmrow'))).forEach(function (node) {
    var name = select('akcmname', node)[0], vals = select('akcmval', node), values;
    if (!name) return;
    if (vals.length) values = Array.from(vals).map(function (v) { var value = select('akcmvalue', v)[0]; return value ? value.innerHTML : ''; });
    else { var value = select('akcmvalues', node)[0] || select('akcmvalue', node)[0]; values = [value ? value.innerHTML : '']; }
    var label = name.textContent.replace('\u0410\u0442\u0430\u043a\u0430: \u0431\u043b\u0438\u0436\u043d\u0438\u0439','\u0410\u0442\u0430\u043a\u0430 \u0431\u043b\u0438\u0436\u043d\u0438\u0439');
    if (/^\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432/i.test(label)) label = '\u0417\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u044f\u0434\u043e\u0432 \u0438 \u0431\u043e\u043b\u0435\u0437\u043d\u0435\u0439';
    row(label, values);
  });
  Array.from(select('akcmrank')).forEach(function (node) { var rank = select('akcmrankname', node)[0], list = select('akcmlist', node)[0]; if (rank && list) row('\u0420\u0430\u043d\u0433: ' + rank.textContent, [list.innerHTML]); });
  Array.from(select('akcmabilities')).forEach(function (node) { row('\u0421\u043f\u043e\u0441\u043e\u0431\u043d\u043e\u0441\u0442\u0438', [node.innerHTML]); });
  var equipment = select('akcmequipment')[0];
  var inventory = Array.from(clone.querySelectorAll('.spoiler-box,details')).find(function (node) { var title=node.querySelector(':scope > div:first-child,:scope > summary');return title&&/^\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u044c$/i.test(title.textContent.trim()); });
  var free = clone.textContent.match(/-?\s*\u0441\u0432\u043e\u0431\u043e\u0434\u043d\u044b\u0439 \u0441\u043b\u043e\u0442 \u0442\u0435\u0445\u043d\u0438\u043a\u0438 \u043b\u044e\u0431\u043e\u0433\u043e \u0440\u0430\u043d\u0433\u0430/gi) || [];
  clone.innerHTML = ''; clone.appendChild(table);
  free.forEach(function (text) { var p=doc.createElement('p');p.textContent=text;clone.appendChild(p); });
  if (equipment) {
    Array.from(select('akcmequiprow', equipment)).forEach(function (entry) { var value=select('akcmvalue',entry)[0], name=select('akcmname',entry)[0]||select('akcmsmall',entry)[0];entry.textContent='\u2022 '+(value?value.textContent:'')+(name?' \u2014 '+name.textContent:''); });
    clone.appendChild(equipment);
  }
  if (inventory) clone.appendChild(inventory);
  return clone;
}

// Scope third-post readers to the requested shopcard section; legacy cards remain supported.
function akcmThirdSection(post, title) {
  if (!post) return post;
  var sections = post.querySelectorAll('.shopsection,.custom_tag_shopsection,.shop-section,.shop__section,[data-bbcode="shopsection"]');
  for (var i = 0; i < sections.length; i++) {
    var heading = sections[i].querySelector('.shoptitle,.custom_tag_shoptitle,.shop-title,.shop__title,[data-bbcode="shoptitle"]');
    if (heading && heading.textContent.trim().toLowerCase().replace(/\u0451/g,'\u0435') === title.toLowerCase().replace(/\u0451/g,'\u0435')) return sections[i];
  }
  return post;
}
/* CHARACTER_TEMPLATE_END */

/* NETWORK_HELPER_START */
/* Akatsuki request scheduler v2. No global fetch/XHR patching. */
function akatsukiNetwork() {
  var host = window;
  try { if (window.parent && window.parent.location.origin === window.location.origin) host = window.parent; } catch (_) {}
  if (host.AkatsukiNetworkV2) return host.AkatsukiNetworkV2;
  var queue = [], pending = new Map(), cache = new Map(), active = 0, timer = null, nextStart = 0, blockedUntil = 0;
  try { blockedUntil = Number(host.localStorage.getItem('akatsuki-network-pause')) || 0; } catch (_) {}
  var GAP = 200, CONCURRENCY = 3, MAX_QUEUE = 80, MAX_CACHE = 96;
  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function unavailable() { return new Error('\u0420\u2014\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u00b0 \u0420\u0457\u0421\u0402\u0420\u0451\u0420\u0455\u0421\u0403\u0421\u201a\u0420\u00b0\u0420\u0405\u0420\u0455\u0420\u0406\u0420\u00bb\u0420\u00b5\u0420\u0405\u0420\u00b0 \u0420\u0457\u0420\u0455\u0421\u0403\u0420\u00bb\u0420\u00b5 \u0420\u0455\u0421\u20ac\u0420\u0451\u0420\u00b1\u0420\u0454\u0420\u0451 \u0421\u201e\u0420\u0455\u0421\u0402\u0421\u0453\u0420\u0458\u0420\u00b0. \u0420\u045f\u0420\u0455\u0420\u0406\u0421\u201a\u0420\u0455\u0421\u0402\u0420\u0451\u0421\u201a\u0420\u00b5 \u0420\u0406\u0421\u0402\u0421\u0453\u0421\u2021\u0420\u0405\u0421\u0453\u0421\u040b \u0420\u0457\u0420\u0455\u0420\u00b7\u0420\u00b6\u0420\u00b5.'); }
  function canonical(value) {
    var url = new URL(value, window.location.href);
    if (!/^https?:$/.test(url.protocol)) throw new Error('\u0420\u045c\u0420\u00b5\u0420\u0491\u0420\u0455\u0420\u0457\u0421\u0453\u0421\u0403\u0421\u201a\u0420\u0451\u0420\u0458\u0421\u2039\u0420\u2116 \u0420\u00b0\u0420\u0491\u0421\u0402\u0420\u00b5\u0421\u0403 \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451');
    url.hash = ''; url.searchParams.delete('_'); url.searchParams.delete('_akcm');
    url.searchParams.sort();
    return url.href;
  }
  function stop(error) {
    var retry = error && error.retryAfter;
    var wait = retry ? Math.max(60000, retry) : /^(403|429|503)$/.test(String(error && error.status)) ? 300000 : 60000;
    blockedUntil = Math.max(blockedUntil, Date.now() + wait);
    // Notify same-origin tabs only on failure; no storage polling on page load.
    try { if (host.localStorage) host.localStorage.setItem('akatsuki-network-pause', String(blockedUntil)); } catch (_) {}
  }
  if (host.addEventListener) host.addEventListener('storage', function (event) {
    if (event.key === 'akatsuki-network-pause') blockedUntil = Math.max(blockedUntil, Number(event.newValue) || 0);
  });
  async function launch(job) {
    try {
      var locks = host.navigator && host.navigator.locks;
      // Coordinate start rate across tabs, never hold a lock for the response.
      if (locks) await locks.request('akatsuki-forum-network-v2-start', function () { return pause(GAP); });
      if (Date.now() < blockedUntil) throw unavailable();
      var value;
      try { value = await job.task(); }
      catch (error) { stop(error); throw error; }
      if (job.ttl) {
        cache.set(job.key, { value: value, expires: Date.now() + job.ttl });
        while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
      }
      job.resolve(value);
    } catch (error) { job.reject(error); }
    finally { pending.delete(job.key); active -= 1; drain(); }
  }
  function drain() {
    if (timer !== null || !queue.length || active >= CONCURRENCY) return;
    if (Date.now() < blockedUntil) {
      while (queue.length) { var stopped = queue.shift(); pending.delete(stopped.key); stopped.reject(unavailable()); }
      return;
    }
    var wait = nextStart - Date.now();
    if (wait > 0) { timer = setTimeout(function () { timer = null; drain(); }, wait); return; }
    var job = queue.shift();
    active += 1;
    nextStart = Date.now() + GAP;
    launch(job);
    drain();
  }
  function request(key, task, ttl) {
    if (pending.has(key)) return pending.get(key);
    var saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value);
    cache.delete(key);
    if (Date.now() < blockedUntil) return Promise.reject(unavailable());
    if (queue.length >= MAX_QUEUE) return Promise.reject(new Error('\u0420\u040e\u0420\u00bb\u0420\u0451\u0421\u20ac\u0420\u0454\u0420\u0455\u0420\u0458 \u0420\u0458\u0420\u0405\u0420\u0455\u0420\u0456\u0420\u0455 \u0421\u0403\u0421\u201a\u0421\u0402\u0420\u00b0\u0420\u0405\u0420\u0451\u0421\u2020 \u0420\u0491\u0420\u00bb\u0421\u040f \u0420\u0455\u0420\u0491\u0420\u0405\u0420\u0455\u0420\u2116 \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451. \u0420\u0408\u0421\u201a\u0420\u0455\u0421\u2021\u0420\u0405\u0420\u0451\u0421\u201a\u0420\u00b5 \u0420\u0406\u0421\u2039\u0420\u00b1\u0420\u0455\u0421\u0402.'));
    var promise = new Promise(function (resolve, reject) { queue.push({ key: key, task: task, ttl: ttl || 0, resolve: resolve, reject: reject }); });
    pending.set(key, promise); drain(); return promise;
  }
  function documentRequest(value, fresh) {
    var url;
    try { url = canonical(value); } catch (error) { return Promise.reject(error); }
    var key = 'document:' + url;
    if (fresh) cache.delete(key);
    return request(key, function () {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true); xhr.responseType = 'document'; xhr.timeout = 30000;
        xhr.withCredentials = new URL(url).origin === window.location.origin;
        xhr.onload = function () {
          if (xhr.status < 200 || xhr.status >= 400) {
            var error = new Error('HTTP ' + xhr.status); error.status = xhr.status;
            var retry = xhr.getResponseHeader('Retry-After');
            error.retryAfter = /^\d+$/.test(retry || '') ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now()) || 0;
            reject(error); return;
          }
          var doc = xhr.responseXML || xhr.response;
          if (!doc || !doc.querySelector) { reject(new Error('\u0420\u045f\u0421\u0453\u0421\u0403\u0421\u201a\u0420\u0455\u0420\u2116 HTML-\u0420\u0491\u0420\u0455\u0420\u0454\u0421\u0453\u0420\u0458\u0420\u00b5\u0420\u0405\u0421\u201a')); return; }
          resolve(doc);
        };
        xhr.onerror = xhr.ontimeout = xhr.onabort = function () { reject(new Error('\u0420\u045b\u0421\u20ac\u0420\u0451\u0420\u00b1\u0420\u0454\u0420\u00b0 \u0421\u0403\u0420\u00b5\u0421\u201a\u0420\u0451 \u0420\u0451\u0420\u00bb\u0420\u0451 \u0421\u201a\u0420\u00b0\u0420\u2116\u0420\u0458-\u0420\u00b0\u0421\u0453\u0421\u201a \u0420\u00b7\u0420\u00b0\u0420\u0456\u0421\u0402\u0421\u0453\u0420\u00b7\u0420\u0454\u0420\u0451')); };
        xhr.send();
      });
    }, fresh ? 0 : (/^\/viewtopic\.php$/.test(new URL(url).pathname) && /^(73|74|75|76|77|78|79|82|83)$/.test(new URL(url).searchParams.get('id') || '') ? 600000 : 60000));
  }
  host.AkatsukiNetworkV2 = { request: request, document: documentRequest, canonical: canonical };
  return host.AkatsukiNetworkV2;
}

/* NETWORK_HELPER_END */
  function loadForumDocument(url, force) {
    if (typeof userConfig.documentLoader === "function") {
      return Promise.resolve(userConfig.documentLoader(url)).then((value) => {
        if (value && value.querySelectorAll) return value;
        return new DOMParser().parseFromString(String(value || ""), "text/html");
      });
    }
    return akatsukiNetwork().document(url, force);
  }

  function topicPageCount(doc, topicId) {
    let maximum = 1;
    Array.from(doc.querySelectorAll('a[href*="viewtopic.php"]')).forEach((link) => {
      try {
        const url = new URL(link.getAttribute("href"), config.baseUrl);
        if (url.pathname !== "/viewtopic.php" || url.searchParams.get("id") !== String(topicId)) return;
        maximum = Math.max(maximum, Number(url.searchParams.get("p") || 1) || 1);
      } catch (_) { /* \u041f\u0440\u043e\u043f\u0443\u0441\u043a\u0430\u0435\u043c \u043d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u0443\u044e \u0441\u0441\u044b\u043b\u043a\u0443 \u043f\u0430\u0433\u0438\u043d\u0430\u0446\u0438\u0438. */ }
    });
    return maximum;
  }

  async function fetchSource(source, force) {
    const cacheSuffix = force ? `&_=${Date.now()}` : "";
    const first = await loadForumDocument(topicUrl(source.topicId) + cacheSuffix, force);
    const documents = [first];
    const pages = topicPageCount(first, source.topicId);
    for (let page = 2; page <= pages; page += 1) {
      documents.push(await loadForumDocument(`${topicUrl(source.topicId)}&p=${page}${cacheSuffix}`, force));
    }
    const items = uniqueItems(documents.reduce((all, doc) => all.concat(parseTopic(doc, source)), []));
    if (!items.length) {
      throw new Error("\u0432 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b \u0442\u043e\u0432\u0430\u0440\u043d\u044b\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438");
    }
    return items;
  }

  async function loadCatalog(force = false) {
    state.errors = [];
    setLoading(true, "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0430\u0435\u043c\u0441\u044f \u043a \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u0430\u043c\u2026");
    setStatus("\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430\u2026", "loading");
    ui.refresh.disabled = true;

    try {
      if (!force) {
        const cached = readCache();
        if (cached && cached.length) {
          state.items = cached;
          afterCatalogLoaded("\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d \u0438\u0437 \u043a\u044d\u0448\u0430. \u041a\u043d\u043e\u043f\u043a\u0430 \u00ab\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u00bb \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u044b \u0437\u0430\u043d\u043e\u0432\u043e.");
          return;
        }
      }

      let completed = 0;
      const total = config.sources.length;
      const batches = await Promise.all(config.sources.map(async (source) => {
        try { return await fetchSource(source, force); }
        catch (error) {
          state.errors.push(`${source.label}: ${error && error.message ? error.message : "\u043e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438"}`);
          return [];
        } finally {
          completed += 1;
          setLoading(true, `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0442\u0435\u043c: ${completed} \u0438\u0437 ${total}`);
        }
      }));

      state.items = batches.reduce((all, batch) => all.concat(batch), []).sort(compareItems);
      if (state.items.length) writeCache(state.items);
      const message = state.errors.length
        ? `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u043f\u043e\u0437\u0438\u0446\u0438\u0439: ${state.items.length}. \u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c: ${state.errors.join("; ")}`
        : `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u043f\u043e\u0437\u0438\u0446\u0438\u0439: ${state.items.length}. \u0414\u0430\u043d\u043d\u044b\u0435 \u0432\u0437\u044f\u0442\u044b \u0438\u0437 \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442\u043e\u0432.`;
      afterCatalogLoaded(message, state.errors.length ? "error" : "");
    } catch (error) {
      setStatus(`\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0430\u0433\u0430\u0437\u0438\u043d: ${error && error.message ? error.message : "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430"}`, "error");
    } finally {
      setLoading(false);
      ui.refresh.disabled = false;
    }
  }

  function compareItems(a, b) {
    const source = a.topicId - b.topicId;
    if (source) return source;
    const section = a.section.localeCompare(b.section, "ru");
    if (section) return section;
    const rankA = Object.prototype.hasOwnProperty.call(rankOrder, a.rank) ? rankOrder[a.rank] : 99;
    const rankB = Object.prototype.hasOwnProperty.call(rankOrder, b.rank) ? rankOrder[b.rank] : 99;
    const rank = rankA - rankB;
    return rank || a.name.localeCompare(b.name, "ru");
  }

  function setLoading(active, message) {
    ui.loading.hidden = !active;
    if (message) ui.loadingText.textContent = message;
    if (!active && window.AKATSUKI_SHOP_WATCHDOG) {
      window.clearTimeout(window.AKATSUKI_SHOP_WATCHDOG);
      window.AKATSUKI_SHOP_WATCHDOG = 0;
    }
  }

  function setStatus(message, kind) {
    ui.status.textContent = message;
    ui.status.className = "ashop__status" + (kind ? ` is-${kind}` : "");
  }

  function afterCatalogLoaded(message, kind) {
    rebuildFilterOptions();
    state.page = 1;
    renderItems();
    renderCart();
    setStatus(message, kind);
  }

  function replaceOptions(select, values, allLabel) {
    const selected = select.value;
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (Array.from(select.options).some((option) => option.value === selected)) select.value = selected;
  }

  function rebuildFilterOptions() {
    const sections = [...new Set(state.items.map((item) => item.section))].sort((a, b) => a.localeCompare(b, "ru"));
    replaceOptions(ui.section, sections, "\u0412\u0441\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438");
    rebuildTypeFilter();
  }

  function rebuildTypeFilter() {
    const selectedSection = ui.section.value;
    ui.typeWrap.hidden = selectedSection === "all";
    const types = selectedSection === "all" ? [] : [...new Set(state.items
      .filter((item) => item.section === selectedSection)
      .map((item) => normalize(item.type))
      .filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
    replaceOptions(ui.type, types, "\u0412\u0441\u0435 \u0442\u0438\u043f\u044b");
  }

  function getStats() {
    return Object.fromEntries($$("[data-stat]").map((input) => [input.dataset.stat, Math.max(0, Number(input.value) || 0)]));
  }

  function unmetRequirements(item, stats) {
    return Object.entries(item.req || {})
      .filter(([key, amount]) => (stats[key] || 0) < amount)
      .map(([key, amount]) => `${statLabels[key] || key} \u2265 ${amount}`);
  }

  function matchesFilters(item, stats) {
    const query = normalizeKey(ui.search.value);
    return (!query || item.searchText.includes(query))
      && (ui.section.value === "all" || item.section === ui.section.value)
      && (ui.section.value === "all" || ui.type.value === "all" || normalize(item.type) === ui.type.value);
  }

  function renderItems() {
    const stats = getStats();
    const filtered = state.items.filter((item) => matchesFilters(item, stats));
    const pageCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), pageCount);
    const start = (state.page - 1) * state.pageSize;
    const visible = filtered.slice(start, start + state.pageSize);
    ui.catalogCount.textContent = `${filtered.length} \u0438\u0437 ${state.items.length} \u00b7 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430 ${state.page}/${pageCount}`;
    ui.items.innerHTML = "";
    renderPagination(filtered.length);

    if (!filtered.length) {
      ui.items.innerHTML = '<div class="ashop__empty">\u041f\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u043c \u0443\u0441\u043b\u043e\u0432\u0438\u044f\u043c \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e.</div>';
      return;
    }

    visible.forEach((item) => {
      const missing = unmetRequirements(item, stats);
      const canBuy = !missing.length;
      const article = document.createElement("article");
      article.className = `ashop__card${canBuy ? "" : " is-unavailable"}`;
      const image = item.image
        ? `<img loading="lazy" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">`
        : "<span>\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e</span>";
      const details = item.details.map((part) => `<dt>${escapeHtml(part.label)}</dt><dd>${escapeHtml(part.value)}</dd>`).join("");
      const availability = missing.length
        ? `\u041d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442: ${missing.join(", ")}`
        : !Number.isFinite(item.price)
          ? "\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430 \u2014 \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u043c\u043e\u0436\u043d\u043e \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u0437\u0430\u044f\u0432\u043a\u0443"
          : "\u041c\u043e\u0436\u043d\u043e \u043a\u0443\u043f\u0438\u0442\u044c";
      const sectionMeta = [item.rank !== "-" ? `\u0420\u0430\u043d\u0433 ${item.rank}` : "", item.type, item.section].filter(Boolean).join(" \u00b7 ");

      article.innerHTML = `
        <div class="ashop__image">${image}</div>
        ${item.image ? `<a class="ashop__image-open" href="${escapeHtml(item.image)}" target="_blank" rel="noopener noreferrer">\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u2197</a>` : ""}
        <div class="ashop__card-body">
          <div class="ashop__card-title">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="ashop__price">${Number.isFinite(item.price) ? `${formatMoney(item.price)} \u0440\u0451` : "\u0426\u0435\u043d\u0430 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430"}</span>
          </div>
          <div class="ashop__meta">${escapeHtml(item.topicLabel)} \u00b7 ${escapeHtml(sectionMeta)}</div>
          ${item.summary ? `<p class="ashop__summary">${escapeHtml(item.summary)}</p>` : ""}
          <div class="ashop__availability${canBuy ? "" : " is-bad"}">${escapeHtml(availability)}</div>
          ${details ? `<details class="ashop__details"><summary>\u0412\u0441\u0435 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438 \u0438 \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f</summary><dl>${details}${item.requirementsText ? `<dt>\u0422\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f</dt><dd>${escapeHtml(item.requirementsText)}</dd>` : ""}</dl></details>` : ""}
          <a class="ashop__source" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0430\u0441\u0442\u0435\u0440-\u043f\u043e\u0441\u0442 \u2197</a>
          <div class="ashop__buy">
            <input class="ashop__input" type="number" min="1" max="999" value="1" aria-label="\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e ${escapeHtml(item.name)}" data-role="card-qty">
            <button class="ashop__button" type="button" data-role="add" ${canBuy ? "" : "disabled"}>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c</button>
          </div>
        </div>`;

      article.querySelector('[data-role="add"]').addEventListener("click", () => {
        const qty = Math.max(1, Math.min(999, Math.floor(Number(article.querySelector('[data-role="card-qty"]').value) || 1)));
        addToCart(item.id, qty);
      });
      ui.items.appendChild(article);
    });
  }

  function renderPagination(totalItems) {
    const pageCount = Math.max(1, Math.ceil(totalItems / state.pageSize));
    ui.pagination.innerHTML = "";
    if (pageCount <= 1) return;
    const addButton = (label, page, disabled, current) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ashop__page${current ? " is-current" : ""}`;
      button.textContent = label;
      button.disabled = disabled;
      button.addEventListener("click", () => {
        state.page = page;
        renderItems();
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      ui.pagination.appendChild(button);
    };
    addButton("\u2039", Math.max(1, state.page - 1), state.page === 1, false);
    const first = Math.max(1, Math.min(state.page - 2, pageCount - 4));
    const last = Math.min(pageCount, first + 4);
    for (let page = first; page <= last; page += 1) addButton(String(page), page, false, page === state.page);
    addButton("\u203a", Math.min(pageCount, state.page + 1), state.page === pageCount, false);
  }

  function formatMoney(value) {
    return Math.round(Number(value) || 0).toLocaleString("ru-RU");
  }

  function calculateCart(cart = state.cart) {
    let totalQty = 0;
    let subtotal = 0;
    let unknownQty = 0;
    cart.forEach((row, id) => {
      const item = state.items.find((candidate) => candidate.id === id);
      if (!item) return;
      totalQty += row.qty;
      if (Number.isFinite(item.price)) subtotal += item.price * row.qty;
      else unknownQty += row.qty;
    });
    const discountPercent = Math.min(10, Math.floor(totalQty / 10));
    const discountAmount = Math.round(subtotal * discountPercent / 100);
    return { totalQty, unknownQty, subtotal, discountPercent, discountAmount, total: subtotal - discountAmount };
  }

  function acceptCart(nextCart) {
    const totals = calculateCart(nextCart);
    if (Number.isFinite(state.wallet) && totals.total > state.wallet) {
      ui.copyNote.textContent = `\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0441\u0440\u0435\u0434\u0441\u0442\u0432: \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e ${formatMoney(state.wallet)} \u0440\u0451.`;
      window.setTimeout(() => { ui.copyNote.textContent = ""; }, 2500);
      return false;
    }
    state.cart = nextCart;
    renderCart();
    return true;
  }

  function addToCart(id, qty) {
    const nextCart = new Map(state.cart);
    const current = nextCart.get(id);
    nextCart.set(id, { qty: Math.min(999, (current ? current.qty : 0) + qty) });
    acceptCart(nextCart);
  }

  function setCartQty(id, qty) {
    const next = Math.floor(Number(qty) || 0);
    const nextCart = new Map(state.cart);
    if (next <= 0) nextCart.delete(id);
    else nextCart.set(id, { qty: Math.min(999, next) });
    acceptCart(nextCart);
  }

  function buildOutput(totals) {
    const lines = [];
    const episode = normalize(ui.episode.value);
    if (episode) lines.push(episode, "");
    if (Number.isFinite(state.wallet)) lines.push(`[b]\u0411\u044b\u043b\u043e \u0432 \u043a\u043e\u0448\u0435\u043b\u044c\u043a\u0435:[/b] ${formatMoney(state.wallet)} \u0440\u0451`, "");
    lines.push("[b]\u041f\u043e\u043a\u0443\u043f\u043a\u0430:[/b]");
    state.cart.forEach((row, id) => {
      const item = state.items.find((candidate) => candidate.id === id);
      if (!item) return;
      const amount = Number.isFinite(item.price)
        ? `${formatMoney(item.price)} \u00d7 ${row.qty} = ${formatMoney(item.price * row.qty)} \u0440\u0451`
        : "\u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430";
      lines.push(`${row.qty} \u00d7 [url=${item.sourceUrl}]${item.name}${item.rank && item.rank !== "-" && state.items.filter((candidate) => normalizeKey(candidate.name) === normalizeKey(item.name)).length > 1 ? ` \u2014 \u0420\u0430\u043d\u0433 ${item.rank}` : ""}[/url] \u2014 ${amount}`);
    });
    lines.push("", `[b]\u041f\u043e\u0434\u044b\u0442\u043e\u0433:[/b] ${formatMoney(totals.subtotal)} \u0440\u0451`);
    if (totals.discountPercent) lines.push(`[b]\u0421\u043a\u0438\u0434\u043a\u0430 \u0437\u0430 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e:[/b] ${totals.discountPercent}% (\u2212${formatMoney(totals.discountAmount)} \u0440\u0451)`);
    lines.push(`[b]\u0418\u0442\u043e\u0433\u043e:[/b] ${formatMoney(totals.total)} \u0440\u0451`);
    if (totals.unknownQty) lines.push(`[i]\u0412 \u0438\u0442\u043e\u0433 \u043d\u0435 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u044b \u043f\u043e\u0437\u0438\u0446\u0438\u0438 \u0431\u0435\u0437 \u0443\u043a\u0430\u0437\u0430\u043d\u043d\u043e\u0439 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u0438: ${totals.unknownQty} \u0448\u0442.[/i]`);
    if (Number.isFinite(state.wallet)) lines.push(`[b]\u0418\u0442\u043e\u0433 \u043f\u043e\u0441\u043b\u0435 \u043f\u043e\u043a\u0443\u043f\u043a\u0438:[/b] ${formatMoney(state.wallet - totals.total)} \u0440\u0451`);
    return lines.join("\n");
  }

  function renderCart() {
    for (const id of Array.from(state.cart.keys())) {
      if (!state.items.some((item) => item.id === id)) state.cart.delete(id);
    }
    const hasItems = state.cart.size > 0;
    ui.cartEmpty.hidden = hasItems;
    ui.cartContent.hidden = !hasItems;
    ui.cartRows.innerHTML = "";

    state.cart.forEach((row, id) => {
      const item = state.items.find((candidate) => candidate.id === id);
      if (!item) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="ashop__cart-name">${escapeHtml(item.name)}</span><span class="ashop__cart-meta">${escapeHtml(item.rank !== "-" ? `\u0420\u0430\u043d\u0433 ${item.rank}` : item.section)}</span></td>
        <td><div class="ashop__qty"><button type="button" data-action="dec">\u2212</button><input type="number" min="1" max="999" value="${row.qty}"><button type="button" data-action="inc">+</button></div></td>
        <td>${Number.isFinite(item.price) ? `${formatMoney(item.price * row.qty)} \u0440\u0451` : "\u0426\u0435\u043d\u0430 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430"}</td>
        <td><button class="ashop__remove" type="button" data-action="remove" aria-label="\u0423\u0434\u0430\u043b\u0438\u0442\u044c ${escapeHtml(item.name)}">\u00d7</button></td>`;
      const input = tr.querySelector("input");
      tr.querySelector('[data-action="dec"]').addEventListener("click", () => setCartQty(id, row.qty - 1));
      tr.querySelector('[data-action="inc"]').addEventListener("click", () => setCartQty(id, row.qty + 1));
      tr.querySelector('[data-action="remove"]').addEventListener("click", () => setCartQty(id, 0));
      input.addEventListener("change", () => setCartQty(id, input.value));
      ui.cartRows.appendChild(tr);
    });

    const totals = calculateCart();
    ui.totalQty.textContent = String(totals.totalQty);
    ui.subtotal.textContent = formatMoney(totals.subtotal);
    ui.discount.textContent = `${totals.discountPercent}% (\u2212${formatMoney(totals.discountAmount)})`;
    ui.grandTotal.textContent = formatMoney(totals.total);
    const hasWallet = Number.isFinite(state.wallet);
    ui.walletLabel.hidden = !hasWallet;
    ui.walletValue.hidden = !hasWallet;
    ui.walletAfterLabel.hidden = !hasWallet;
    ui.walletAfter.hidden = !hasWallet;
    if (hasWallet) {
      ui.walletValue.textContent = `${formatMoney(state.wallet)} \u0440\u0451`;
      ui.walletAfter.textContent = `${formatMoney(state.wallet - totals.total)} \u0440\u0451`;
    }
    ui.output.value = hasItems ? buildOutput(totals) : "";
  }

  async function copyOutput() {
    const text = ui.output.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      ui.output.focus();
      ui.output.select();
      document.execCommand("copy");
    }
    ui.copyNote.textContent = "\u0422\u0435\u043a\u0441\u0442 \u043f\u043e\u043a\u0443\u043f\u043a\u0438 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d.";
    window.setTimeout(() => { ui.copyNote.textContent = ""; }, 1600);
  }

  function resetFilters() {
    ui.search.value = "";
    ui.section.value = "all";
    rebuildTypeFilter();
    state.page = 1;
    renderItems();
  }

  [ui.search, ui.section, ui.type].forEach((control) => {
    control.addEventListener(control === ui.search ? "input" : "change", () => {
      if (control === ui.section) rebuildTypeFilter();
      state.page = 1;
      renderItems();
    });
  });
  $$("[data-stat]").forEach((input) => input.addEventListener("input", () => {
    state.page = 1;
    renderItems();
  }));
  ui.refresh.addEventListener("click", () => loadCatalog(true));
  ui.characterRefresh.addEventListener("click", () => loadCharacterDirectory(true));
  ui.character.addEventListener("change", () => selectCharacter(ui.character.value));
  ui.reset.addEventListener("click", resetFilters);
  ui.clear.addEventListener("click", () => { state.cart.clear(); renderCart(); });
  ui.episode.addEventListener("input", renderCart);
  ui.copy.addEventListener("click", copyOutput);

  loadCatalog(false);
  loadCharacterDirectory(false);
})();

