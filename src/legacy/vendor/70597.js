/* Snapshot source: https://forumstatic.ru/files/001c/03/d0/70597.js; source encoding: utf-8 */
/**
 * скрипт снега
 * автор: astaarus
 */

document.addEventListener("DOMContentLoaded", () => {
    const snowContainer = document.createElement("div");
    snowContainer.className = "snow-container";
    document.body.appendChild(snowContainer);

    const toggleButton = document.createElement("button");
    toggleButton.className = "snow-toggle";
    document.body.appendChild(toggleButton);

    let snowActive = localStorage.getItem("snowActive") === "true";
    let snowInterval;
    const maxSnowflakes = 100;
    const activeSnowflakes = [];

    function updateButton() {
        toggleButton.innerHTML = `<i class="fas fa-${snowActive ? "times" : "snowflake"}"></i>`;
    }

    function createSnowflake() {
        const snowflake = document.createElement("i");
        snowflake.className = "fas fa-snowflake snowflake";
        Object.assign(snowflake.style, {
            left: Math.random() * 100 + "vw",
            animationDuration: `${Math.random() * 10 + 20}s`,
            fontSize: `${Math.random() * 5 + 3}px`,
            opacity: Math.random()
        });

        snowContainer.appendChild(snowflake);
        activeSnowflakes.push(snowflake);

        snowflake.addEventListener("animationend", () => {
            snowflake.remove();
            activeSnowflakes.shift();
        });

        if (activeSnowflakes.length > maxSnowflakes) {
            activeSnowflakes.shift().remove();
        }
    }

    function toggleSnow() {
        snowActive = !snowActive;
        localStorage.setItem("snowActive", snowActive);
        snowActive
            ? (snowInterval = setInterval(createSnowflake, 300))
            : (clearInterval(snowInterval), activeSnowflakes.splice(0).forEach((s) => s.remove()));
        updateButton();
    }

    toggleButton.onclick = toggleSnow;
    if (snowActive) snowInterval = setInterval(createSnowflake, 300);
    updateButton();
});
