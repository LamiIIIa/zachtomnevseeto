const POST_CONTENT_SELECTOR = ".post-content";

const QUOTE_LINK_SELECTOR = ".pl-quote > a[href^='javascript:quote']";

export function initQuoteSelection(root = document) {
  if (!root || root.dataset.quoteSelectionReady === "true") return;

  root.dataset.quoteSelectionReady = "true";

  let savedSelection = null;

  function rememberSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

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

    if (!quoteLink || !root.contains(quoteLink) || !savedSelection) {
      return;
    }

    const post = quoteLink.closest(".post[id^='p']");
    const postId = post?.id.match(/^p(\d+)$/)?.[1];

    if (postId !== savedSelection.postId) return;

    const href = quoteLink.getAttribute("href") || "";

    const quoteArguments = href.match(/quote\('(.+?)'\s*,\s*(\d+)\)/);

    if (!quoteArguments || typeof window.insert !== "function") {
      return;
    }

    event.preventDefault();

    const quoteAuthorData = quoteArguments[1];

    window.insert(
      `[quote="${quoteAuthorData}"]${savedSelection.text}[/quote]\n`
    );

    window.getSelection()?.removeAllRanges();
    savedSelection = null;
  }

  document.addEventListener("selectionchange", rememberSelection);

  root.addEventListener("click", quoteSelectedText, true);
}
