import { forumConfig } from "../../config/forum.js";
import { t } from "../../i18n/index.js";

const EDITOR_SELECTOR = "#main-reply, #post textarea";
const DICE_PATTERN = /\[dice=((?:\d+[-—])*)(?:(\d)(\d+)|(\d+):(\d+))\]/g;

export function initEditors(root) {
  if (!root) return;

  processEditorContent(root);
  configureMyBBEditor();

  if (root.dataset.editorObserverReady) return;
  root.dataset.editorObserverReady = "true";

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node instanceof Element) processEditorContent(node);
      });
    });
  });

  observer.observe(root, { childList: true, subtree: true });
}

function processEditorContent(root) {
  const editors = [];

  if (root instanceof HTMLTextAreaElement && root.matches(EDITOR_SELECTOR))
    editors.push(root);
  editors.push(...root.querySelectorAll(EDITOR_SELECTOR));
  editors.forEach(initEditor);

  initDiceButton(root);
  initFlexibleToolbar(root);
  initExtraColors(root);
  initDiceResults(root);
}

function initEditor(textarea) {
  initCharacterCounter(textarea);
  initDraft(textarea);
}

function initCharacterCounter(textarea) {
  if (textarea.dataset.characterCounterReady) return;
  textarea.dataset.characterCounterReady = "true";

  const fieldset = textarea.closest("fieldset");
  const legend =
    fieldset?.querySelector(":scope > legend") ||
    fieldset?.querySelector("legend");
  let counter = fieldset?.querySelector("#plng, .editor-character-count");

  if (!counter) {
    counter = document.createElement("small");
    counter.className = "editor-character-count";
    if (!document.getElementById("plng")) counter.id = "plng";

    const label = document.createElement("span");
    const value = document.createElement("b");

    label.dataset.characterCountLabel = "true";
    value.dataset.characterCountValue = "true";
    counter.append(label, value);
    if (legend) {
      legend.prepend(counter);
    } else {
      textarea.before(counter);
    }
  }

  const value = counter.querySelector("[data-character-count-value], b");
  const label = counter.querySelector("[data-character-count-label]");
  const update = () => {
    if (label) label.textContent = `${t("editor.characters")} `;
    if (value)
      value.textContent = String(textarea.value.length).padStart(2, "0");
  };

  counter.setAttribute("aria-live", "polite");
  textarea.addEventListener("input", update);
  document.addEventListener("forum-language-changed", update);
  update();
}

function initDraft(textarea) {
  // Совместимо со старым скриптом из HTML-низ: он использует тот же флаг.
  if (textarea.dataset.draftInitialized === "true") return;
  textarea.dataset.draftInitialized = "true";

  const storageKey = getDraftStorageKey(textarea);
  const legacyStorageKey = getLegacyDraftStorageKey(textarea);
  const savedText = readStorage(storageKey) ?? readStorage(legacyStorageKey);

  if (savedText !== null && textarea.value.trim() === "") {
    textarea.value = savedText;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  textarea.addEventListener("input", () => {
    writeStorage(storageKey, textarea.value);
  });

  const form = textarea.closest("form");
  if (!form || form.dataset.draftSubmitReady) return;

  form.dataset.draftSubmitReady = "true";
  form.addEventListener("submit", () => {
    form.querySelectorAll(EDITOR_SELECTOR).forEach((editor) => {
      removeStorage(getDraftStorageKey(editor));
      removeStorage(getLegacyDraftStorageKey(editor));
    });
  });
}

function getDraftStorageKey(textarea) {
  const url = new URL(window.location.href);
  const form = textarea.closest("form");
  const entityId =
    textarea.dataset.postId ||
    form?.querySelector('[name="pid"], [name="post"], [name="edit"]')?.value ||
    url.searchParams.get("id") ||
    url.searchParams.get("fid") ||
    "new";
  const editorId = textarea.id || textarea.name || "reply";

  return ["forum-design", "draft", url.pathname, entityId, editorId].join(":");
}

function getLegacyDraftStorageKey(textarea) {
  const url = new URL(window.location.href);
  const topicId =
    url.searchParams.get("id") ||
    url.searchParams.get("tid") ||
    url.searchParams.get("topic");
  if (!topicId) return null;

  const form = textarea.closest("form");
  const postId =
    textarea.dataset.postId ||
    form?.querySelector('[name="pid"], [name="post"], [name="edit"]')?.value ||
    textarea.id ||
    textarea.name ||
    "reply";

  return `draft_topic_${topicId}_${postId}`;
}

function initDiceButton(root) {
  const toolbars = [];

  if (root instanceof Element && root.id === "form-buttons") {
    toolbars.push(root);
  }

  toolbars.push(...root.querySelectorAll("#form-buttons"));

  toolbars.forEach((toolbar) => {
    let cell = toolbar.querySelector("#button-dice");

    if (!cell) {
      const row = toolbar.querySelector("tr");
      if (!row) return;

      cell = document.createElement("td");
      cell.id = "button-dice";
      row.append(cell);
    }

    if (cell.dataset.diceButtonReady) return;

    const button = document.createElement("button");

    cell.title = t("editor.dice.title");
    cell.dataset.i18nAttr = "title:editor.dice.title";

    button.type = "button";
    button.className = "editor-toolbar-button editor-toolbar-button--dice";
    button.setAttribute("aria-label", t("editor.dice.title"));
    button.dataset.i18nAttr = "aria-label:editor.dice.title";

    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const textarea =
        toolbar.closest("form")?.querySelector(EDITOR_SELECTOR) ||
        document.querySelector(EDITOR_SELECTOR);

      if (textarea) rollDice(textarea);
    });

    cell.replaceChildren(button);
    cell.dataset.diceButtonReady = "true";
  });

  if (typeof window.dice !== "function") {
    window.dice = () => {
      const textarea = document.querySelector(EDITOR_SELECTOR);
      if (textarea) rollDice(textarea);
    };
  }
}

function initFlexibleToolbar(root) {
  const toolbars = [];

  if (root instanceof Element && root.id === "form-buttons") {
    toolbars.push(root);
  }
  toolbars.push(...root.querySelectorAll("#form-buttons"));

  toolbars.forEach((toolbar) => {
    if (toolbar.dataset.flexibleToolbarReady) return;

    const table = toolbar.querySelector("table");
    if (!table) return;

    const cells = Array.from(table.querySelectorAll("td"));
    if (cells.length === 0) return;

    const buttonList = document.createElement("div");
    buttonList.className = "editor-toolbar-items";
    buttonList.setAttribute("role", "toolbar");
    buttonList.setAttribute("aria-label", "Панель форматирования");

    cells.forEach((cell) => {
      cell.classList.add("editor-toolbar-item");
      cell.setAttribute("role", "button");
      buttonList.append(cell);
    });

    table.replaceWith(buttonList);

    toolbar.classList.add("editor-toolbar-ready");
    toolbar.dataset.flexibleToolbarReady = "true";
  });
}

function rollDice(textarea) {
  // Формат совместим с установленным на форуме DICE © @4eD0.
  const diceCount = requestInteger({
    message: t("editor.dice.countPrompt"),
    defaultValue: forumConfig.editor.defaultDiceCount,
    maximum: forumConfig.editor.maxDiceCount,
    errorMessage: t("editor.dice.countError"),
  });
  if (diceCount === null) return;

  const sideCount = requestInteger({
    message: t("editor.dice.sidesPrompt"),
    defaultValue: forumConfig.editor.defaultDiceSides,
    maximum: forumConfig.editor.maxDiceSides,
    errorMessage: t("editor.dice.sidesError"),
  });
  if (sideCount === null) return;

  const encodedRolls = Array.from({ length: diceCount }, () => {
    return (Math.floor(Math.random() * sideCount) + 1) * 1936;
  });
  const bbCode = `[dice=${encodedRolls.join("-")}-${diceCount}:${sideCount}]`;

  insertAtCursor(textarea, bbCode);
}

function requestInteger({ message, defaultValue, maximum, errorMessage }) {
  const answer = window.prompt(message, String(defaultValue));
  if (answer === null) return null;

  const value = Number(answer);
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    window.alert(errorMessage);
    return null;
  }

  return value;
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;

  textarea.setRangeText(text, start, end, "end");
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function initExtraColors(root) {
  const colorAreas = [];
  if (root instanceof Element && root.id === "color-area")
    colorAreas.push(root);
  colorAreas.push(...root.querySelectorAll("#color-area"));

  colorAreas.forEach((colorArea) => {
    if (
      colorArea.querySelector('[data-forum-extra-colors], td[style*="thistle"]')
    )
      return;

    const table = colorArea.querySelector("table");
    if (!table) return;

    const body =
      table.tBodies[0] || table.appendChild(document.createElement("tbody"));

    chunk(forumConfig.editor.colors, 10).forEach((colors) => {
      const row = document.createElement("tr");
      row.dataset.forumExtraColors = "true";

      colors.forEach((color) => {
        const cell = document.createElement("td");
        const button = document.createElement("button");

        cell.style.backgroundColor = color;
        button.type = "button";
        button.className = "editor-color-swatch";
        button.style.backgroundColor = color;
        button.title = color;
        button.setAttribute("aria-label", t("editor.color", { color }));
        button.addEventListener("click", () => {
          window.bbcode?.(`[color=${color}]`, "[/color]");
        });

        cell.append(button);
        row.append(cell);
      });

      body.append(row);
    });
  });
}

function initDiceResults(root) {
  const postContents = [];
  if (root instanceof Element && root.matches(".post-content"))
    postContents.push(root);
  postContents.push(...root.querySelectorAll(".post-content"));
  postContents.forEach(replaceDiceCodes);
}

function replaceDiceCodes(postContent) {
  const walker = document.createTreeWalker(postContent, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode.parentElement?.closest("code, pre, textarea, .dice-result"))
      continue;
    DICE_PATTERN.lastIndex = 0;
    if (DICE_PATTERN.test(textNode.data)) textNodes.push(textNode);
  }

  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    const source = textNode.data;
    let lastIndex = 0;

    DICE_PATTERN.lastIndex = 0;
    for (const match of source.matchAll(DICE_PATTERN)) {
      fragment.append(source.slice(lastIndex, match.index));
      fragment.append(createDiceResult(postContent, match));
      lastIndex = match.index + match[0].length;
    }

    fragment.append(source.slice(lastIndex));
    textNode.replaceWith(fragment);
  });
}

function createDiceResult(postContent, match) {
  const encodedRolls = match[1]
    .replace(/—/g, "-")
    .split("-")
    .filter(Boolean)
    .map(Number);
  const isNewScheme = Boolean(match[4]);
  const diceCount = Number(isNewScheme ? match[4] : match[2]);
  const sideCount = Number(isNewScheme ? match[5] : match[3]);
  const rolls = decodeDiceRolls({
    postContent,
    encodedRolls,
    sideCount,
    isNewScheme,
  });
  const total = rolls.reduce((sum, value) => sum + value, 0);
  const result = document.createElement("div");
  const quote = document.createElement("blockquote");
  const paragraph = document.createElement("p");
  const heading = document.createElement("b");

  result.className = "quote-box dice-result";
  heading.textContent = t("editor.dice.rollDescription", {
    count: diceCount,
    sides: sideCount,
  });
  paragraph.append(
    heading,
    document.createElement("br"),
    document.createElement("br")
  );
  paragraph.append(
    t("editor.dice.result", { rolls: rolls.join(" + "), total })
  );
  quote.append(paragraph);
  result.append(quote);
  return result;
}

function decodeDiceRolls({
  postContent,
  encodedRolls,
  sideCount,
  isNewScheme,
}) {
  // Сохраняем прежний детерминированный алгоритм, чтобы старые броски не изменились.
  let postNumber = getPostNumber(postContent);
  let seconds = getPostSeconds(postContent);
  let randomState = postNumber + seconds;

  return encodedRolls.map((encodedRoll) => {
    let value = Math.floor(encodedRoll / 1936);
    if (!isNewScheme || sideCount <= 0) return value;

    seconds = ((seconds >> 1) + ((seconds & 1) << 21)) & 0x3fffff;
    postNumber = ((postNumber >> 1) + ((postNumber & 1) << 22)) & 0x7fffff;
    randomState =
      (((randomState >> 1) +
        ((randomState & 1 ? 0 : 1) << 23) +
        value +
        seconds) ^
        postNumber) &
      0xffffff;

    value = (randomState % sideCount) + 1;
    return value;
  });
}

function getPostNumber(postContent) {
  const identifier =
    postContent.closest(".post[id]")?.id || postContent.id || "";
  return Number(identifier.match(/\d+/)?.[0] || 0);
}

function getPostSeconds(postContent) {
  const post = postContent.closest(".post");
  const timestamp = Number(
    postContent.dataset.posted || post?.dataset.posted || 0
  );
  return timestamp ? new Date(timestamp * 1000).getSeconds() : 0;
}

function configureMyBBEditor() {
  try {
    window.FORUM?.set?.("editor.link.short_url", () => false);
  } catch (error) {
    console.warn("Не удалось отключить сокращение ссылок MyBB", error);
  }
}

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => {
    return items.slice(index * size, (index + 1) * size);
  });
}

function readStorage(key) {
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Редактор продолжит работать, даже если хранилище браузера недоступно.
  }
}

function removeStorage(key) {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ошибка очистки черновика не должна блокировать отправку формы.
  }
}
