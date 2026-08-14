/* Snapshot source: https://forumstatic.ru/files/001c/6f/41/11599.js?v=4; source encoding: windows-1251 */
/**
 * Скрипт падающих сердечек
 * автор: astaarus (модифицировано)
 */

document.addEventListener("DOMContentLoaded", () => {
    // Создаём контейнер для сердечек
    const snowContainer = document.createElement("div");
    snowContainer.className = "snow-container";
    document.body.appendChild(snowContainer);

    // Создаём кнопку активации/деактивации
    const toggleButton = document.createElement("button");
    toggleButton.className = "snow-toggle";
    document.body.appendChild(toggleButton);

    // Статус активации
    let snowActive = localStorage.getItem("snowActive") === "true";
    let snowInterval;
    const maxSnowflakes = 100;
    const activeSnowflakes = [];

    // Обновляем кнопку
    function updateButton() {
        toggleButton.innerHTML = `<i class="fas fa-${snowActive ? "times" : "heart"}"></i>`;
        toggleButton.style.color = snowActive ? "#888" : "#ff4d6d"; // крестик серый, сердце красное
    }

    // Создаём сердечко
    function createSnowflake() {
        const heart = document.createElement("i");
        heart.className = "fas fa-heart snowflake heart";

        const colors = ["#ff4d6d", "#ff758f", "#ff8fa3", "#fb6f92", "#ffb3c1"];

        Object.assign(heart.style, {
            left: Math.random() * 100 + "vw",
            animationDuration: `${Math.random() * 10 + 15}s`,
            fontSize: `${Math.random() * 8 + 8}px`,
            opacity: Math.random() * 0.7 + 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            transform: `rotate(${Math.random() * 360}deg)`
        });

        snowContainer.appendChild(heart);
        activeSnowflakes.push(heart);

        // Удаляем сердечко после завершения анимации
        heart.addEventListener("animationend", () => {
            heart.remove();
            activeSnowflakes.shift();
        });

        // Ограничиваем количество сердечек
        if (activeSnowflakes.length > maxSnowflakes) {
            activeSnowflakes.shift().remove();
        }
    }

    // Включение/выключение сердечек
    function toggleSnow() {
        snowActive = !snowActive;
        localStorage.setItem("snowActive", snowActive);

        if (snowActive) {
            snowInterval = setInterval(createSnowflake, 300);
        } else {
            clearInterval(snowInterval);
            activeSnowflakes.splice(0).forEach((s) => s.remove());
        }

        updateButton();
    }

    toggleButton.onclick = toggleSnow;

    // Если был активен — включаем
    if (snowActive) snowInterval = setInterval(createSnowflake, 300);
    updateButton();
});

