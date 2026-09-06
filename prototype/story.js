(() => {
  const THEME_REQUEST = "story:theme-request";
  const THEME_UPDATE = "story:theme-update";
  const THEME_PROPERTIES = new Set([
    "--color-forum",
    "--color-link",
    "--color-lnthoverbg",
    "--font-1",
  ]);

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

  const story = document.getElementById("story");

  if (!story) return;

  const tabs = story.querySelectorAll(".story-tab");
  const panels = story.querySelectorAll(".story-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;

      panels.forEach((panel) => {
        panel.hidden = panel.id !== targetId;
      });

      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    });
  });

  if (window.parent !== window) {
    window.parent.postMessage({ type: THEME_REQUEST }, "*");
  }
})();
