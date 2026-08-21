import { initMutualPromotion } from "../components/mutual-promotion.js";
import { initScrollablePostTables } from "../components/post-components/tables-in-posts.js";
import { initQuoteSelection } from "../components/post-components/quote-selection.js";

export function initTopicView({ main, topicId }) {
  main?.classList.add("forum-design-topic");
  if (topicId !== null) main?.setAttribute("data-topic-id", String(topicId));

  main?.querySelectorAll('.post[id^="p"]').forEach((post, index) => {
    post.dataset.postIndex = String(index);
  });

  initTopicTools(main);
  initEditorPreviewControls(main);
  initMutualPromotion(main);
  initScrollablePostTables(main ?? document);
  initQuoteSelection(main);
}

function initTopicTools(main) {
  if (!main || main.dataset.topicToolsReady === "true") return;

  const moderation = main.querySelector("#topic-modmenu");
  const search = main.querySelector("#s-block");

  if (!moderation || !search) return;

  const searchButton = search.querySelector("#isk");

  if (searchButton) searchButton.value = "\ue8b6";

  const toolbar = document.createElement("div");

  toolbar.className = "topic-tools-row";
  toolbar.setAttribute("aria-label", "Инструменты темы");
  moderation.before(toolbar);
  toolbar.append(moderation, search);
  main.dataset.topicToolsReady = "true";
}

function initEditorPreviewControls(main) {
  if (!main || main.dataset.previewControlsReady === "true") return;

  const toggle = main.querySelector("#post #togglePreview");
  const counter = main.querySelector(
    "#post #plng, #post .editor-character-count"
  );
  const fieldset = toggle?.closest("fieldset");
  const legend = fieldset?.querySelector(":scope > legend");

  if (!toggle || !counter || !fieldset || !legend) return;

  const controls = document.createElement("div");

  controls.className = "editor-preview-controls";
  legend.after(controls);
  controls.append(toggle, counter);
  main.dataset.previewControlsReady = "true";
}
