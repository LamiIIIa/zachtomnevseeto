(() => {
  const RUNTIME_KEY = "__mybbStoryRuntimeInitialized";
  const THEME_REQUEST = "story:theme-request";
  const THEME_UPDATE = "story:theme-update";
  const THEME_PROPERTIES = new Set([
    "--color-forum",
    "--color-link",
    "--color-lnthoverbg",
    "--font-1",
    "--color-txt1",
  ]);

  // Один и тот же файл может быть подключён в нескольких постах темы.
  if (window[RUNTIME_KEY]) return;
  window[RUNTIME_KEY] = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    if (event.data?.type !== THEME_UPDATE) return;

    const properties = event.data.properties;
    if (!properties || typeof properties !== "object") return;

    Object.entries(properties).forEach(([property, value]) => {
      if (!THEME_PROPERTIES.has(property)) return;
      if (typeof value !== "string" || value.length > 200) return;

      document.documentElement.style.setProperty(property, value);
    });
  });

  // Делегирование позволяет обслуживать все блоки #story, включая следующие посты.
  document.addEventListener("click", (event) => {
    const tab = event.target.closest?.("#story .story-tab");
    if (!tab) return;

    const story = tab.closest("#story");
    const targetId = tab.dataset.target;
    if (!story || !targetId) return;

    const panels = story.querySelectorAll(".story-panel");
    const tabs = story.querySelectorAll(".story-tab");
    const hasTarget = Array.from(panels).some((panel) => panel.id === targetId);
    if (!hasTarget) return;

    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });

    tabs.forEach((button) => {
      const isActive = button === tab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  });

  if (window.parent !== window) {
    window.parent.postMessage({ type: THEME_REQUEST }, "*");
  }
})();
