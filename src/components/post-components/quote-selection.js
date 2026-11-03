const POST_CONTENT_SELECTOR = ".post-content";

const QUOTE_LINK_SELECTOR = ".pl-quote > a[href^='javascript:quote']";

export function initQuoteSelection(root = document) {
  if (!root || root.dataset.quoteSelectionReady === "true") return;

  root.dataset.quoteSelectionReady = "true";

  let savedSelection = null;
  let quoteSelection = null;

  function rememberSelection() {
    if (quoteSelection) return;
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      savedSelection = null;
      return;
    }

    savedSelection = null;
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const rangeContainer = range.commonAncestorContainer;

    const selectedElement =
      rangeContainer.nodeType === Node.ELEMENT_NODE
        ? rangeContainer
        : rangeContainer.parentElement;

    const postContent = selectedElement?.closest(POST_CONTENT_SELECTOR);

    if (!postContent || !root.contains(postContent)) return;

    const post = postContent.closest(".post[id^='p']");
    const postIdMatch = post?.id.match(/^p(\d+)$/);

    if (!postIdMatch) return;

    savedSelection = {
      postId: postIdMatch[1],
      text: selectedText,
    };
  }

  function quoteSelectedText(event) {
    if (!(event.target instanceof Element)) return;

    const quoteLink = event.target.closest(QUOTE_LINK_SELECTOR);

    const selected = quoteSelection || savedSelection;
    quoteSelection = null;

    if (!quoteLink || !root.contains(quoteLink) || !selected) {
      return;
    }

    const post = quoteLink.closest(".post[id^='p']");
    const postId = post?.id.match(/^p(\d+)$/)?.[1];

    if (postId !== selected.postId) return;

    const href = quoteLink.getAttribute("href") || "";

    const quoteArguments = href.match(/quote\('(.+?)'\s*,\s*(\d+)\)/);

    if (!quoteArguments || typeof window.insert !== "function") {
      return;
    }

    event.preventDefault();

    const quoteAuthorData = quoteArguments[1];

    window.insert(
      `[quote="${quoteAuthorData}"]${selected.text}[/quote]\n`
    );

    window.getSelection()?.removeAllRanges();
    savedSelection = null;
  }

  // Read the complete live range before the quote link receives focus.
  // selectionchange may still contain an earlier double-clicked word, and
  // legacy mouse handlers can collapse the range before the click arrives.
  root.addEventListener("pointerdown", (event) => {
    quoteSelection = null;
    rememberSelection();
    if (event.target instanceof Element && event.target.closest(QUOTE_LINK_SELECTOR)) {
      quoteSelection = savedSelection;
    }
  }, true);
  root.addEventListener("pointerup", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(QUOTE_LINK_SELECTOR)) rememberSelection();
  }, true);
  document.addEventListener("selectionchange", rememberSelection);

  root.addEventListener("click", quoteSelectedText, true);
}
