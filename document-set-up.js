function toggleDropDownMenu(id) {
    const arrow = document.getElementById(id).children[1].style;
    const menu = document.getElementById(id).children[2];
    const menuOptions = menu.children;
    if (menu.style.display !== "") {
        for (let i = 0; i < menuOptions.length; i++) {
            menuOptions[i].style.pointerEvents = "";
        }
        arrow.transition = "transform 0.3s ease-in-out";
        arrow.transform = "";
        setTimeout(() => arrow.transition = "", 300);
        menu.animate(
            [{ opacity: "1", transform: "translateY(0)" }, { opacity: "0", transform: "translateY(-32px)" }],
            { duration: 300, easing: emphasisAnimation },
        );
        setTimeout(() => menu.style.display = "", 200);
    } else {
        arrow.transition = "transform 0.3s ease-in-out";
        arrow.transform = "translateY(-50%) rotate(0)";
        setTimeout(() => {
            arrow.transition = "";
            for (let i = 0; i < menuOptions.length; i++) {
                menuOptions[i].style.pointerEvents = "all";
            }
        }, 200);
        menu.style.display = "block";
        menu.animate(
            [{ opacity: "0", transform: "translateY(-32px)" }, { opacity: "1", transform: "translateY(0)" }],
            { duration: 300, easing: emphasisAnimation },
        );
    }
}
function setDropDownValue(dropDownId, newValue) {
    const menu = document.getElementById(dropDownId);
    const menuDisplay = menu.children[0];
    menuDisplay.setAttribute("value", newValue);
    menuDisplay.innerText = menu.querySelector(`button[value=${newValue}]`).innerText;
    if (dropDownId === "font-selector") {
        setFont(newValue);
    }
}

function showFullScreenBox(id) {
    const box = document.getElementById(id);
    const boxContent = box.querySelector("div");
    box.style.display = "block";
    box.animate(
        [{ opacity: "0" }, { opacity: "1" }],
        { duration: 300, easing: emphasisAnimation },
    )
    boxContent.animate(
        [{ transform: "translate(-50%, -60%)" }, { transform: "translate(-50%, -50%)" }],
        { duration: 300, easing: "ease" },
    );
}
function hideFullScreenBox(id) {
    const box = document.getElementById(id);
    const boxContent = box.querySelector("div");
    boxContent.animate(
        [{ transform: "translate(-50%, -50%)" }, { transform: "translate(-50%, -60%)" }],
        { duration: 300, easing: "ease" },
    );
    box.animate(
        [{ opacity: "1" }, { opacity: "0" }],
        { duration: 300, easing: emphasisAnimation },
    )
    setTimeout(() => box.style.display = "", 200);
}

function toggleOverflowContainer(callerId) {
    const overflowButton = document.getElementById(callerId);
    const overflowMenu = document.querySelector(`#${callerId} + .overflow-container`);
    const menuOptions = overflowMenu.children;
    if (overflowMenu.style.display !== "") {
        for (let i = 0; i < menuOptions.length; i++) {
            menuOptions[i].style.pointerEvents = "";
        }
        overflowButton.style.fill = "";
        overflowButton.style.color = "";
        overflowButton.style.backgroundColor = "";
        overflowMenu.animate(
            [{ opacity: "1", transform: "translateY(0)" }, { opacity: "0", transform: "translateY(32px)" }],
            { duration: 300, easing: emphasisAnimation },
        );
        setTimeout(() => overflowMenu.style.display = "", 300);
    } else {
        overflowButton.style.fill = "var(--active-color)";
        overflowButton.style.color = "var(--active-color)";
        overflowButton.style.backgroundColor = "var(--active-background-color)";
        overflowMenu.style.display = "var(--overflow-menu-display)";
        setTimeout(() => {
            for (let i = 0; i < menuOptions.length; i++) {
                menuOptions[i].style.pointerEvents = "all";
            }
        }, 300);
        overflowMenu.animate(
            [{ opacity: "0", transform: "translateY(32px)" }, { opacity: "1", transform: "translateY(0)" }],
            { duration: 300, easing: emphasisAnimation },
        );
    }
}
function setStarRating(id, rating) {
    const ratings = document.getElementById(id).children;
    for (let i = 0; i < ratings.length; i++) {
        if (i > 9 - rating) {
            ratings[i].querySelector("div").style.backgroundColor = "var(--star-color)";
            continue;
        }
        ratings[i].querySelector("div").style.backgroundColor = "";
    }
}

const emphasisAnimation = "linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%)";
document.querySelector("meta[name='theme-color']").content = getComputedStyle(document.querySelector(":root")).getPropertyValue("--board-color");

document.querySelectorAll(".loading-indicator-container").forEach(indicatorContainer => {
    indicatorContainer.innerHTML = `
        <div class="loading-indicator"></div>
        <div class="loading-indicator"></div>
        <div class="loading-indicator"></div>`;
});
document.querySelectorAll(".rating-area").forEach(area => {
    const name = area.getAttribute("data-name");
    const id = area.id;
    const ratingStart = parseInt(area.getAttribute("data-start-rating"));
    const ratingEnd = parseInt(area.getAttribute("data-end-rating"));
    let ratings = "";
    for (let i = ratingEnd; i >= ratingStart; i--) {
        ratings += `<label class="radio-input">
            <input type="radio" name="${name}" value="${i}" onchange="setStarRating('${id}', value);" />
            <div></div>
            <span>${i}</span>
        </label>
        `;
    }
    area.innerHTML = ratings;
});

document.querySelectorAll(".radio-input > div").forEach(radioDiv => {
    radioDiv.setAttribute("tabindex", "0");
    radioDiv.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        click();
        }
    });
});
document.querySelectorAll(".drop-down-menu-container").forEach(menuContainer => {
    let defaultValue = "", defaultValueText = "";
    menuContainer.querySelectorAll("button").forEach(option => {
        option.classList.add("drop-down-options");
        option.addEventListener("click", function () {
            setDropDownValue(menuContainer.id, this.value);
        });
        if (option.getAttribute("selected") === "") {
            defaultValue = option.value;
            defaultValueText = option.innerText;
        }
    });
    if (defaultValueText === "") {
        if (menuContainer.getAttribute("data-pre-filled")) {
            defaultValueText = menuContainer.getAttribute("data-pre-filled");
        } else {
            defaultValueText = "<span style='font-style: italic; color: darkgray;'>Choose…</span>";
        }
    }
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "drop-down-menu";
    optionsContainer.innerHTML = menuContainer.innerHTML;
    menuContainer.innerHTML = `
        <div class="drop-down-menu-selection" value="${defaultValue}" onclick="toggleDropDownMenu('${menuContainer.id}');" tabindex="0" onkeydown="{
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            click();
        }
        }">${defaultValueText}</div>
        <!-- Icon sourced from Google Fonts (Material Icons) — Apache license 2.0 -->
        <svg class="drop-down-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
            <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
        </svg>`;
    menuContainer.appendChild(optionsContainer);
});

document.querySelectorAll(".full-screen-box-container").forEach(box => {
    box.innerHTML = `
        <div>
            ${box.innerHTML}
        </div>`;
});

document.querySelectorAll(".more-button").forEach(button => {
    button.addEventListener("click", () => toggleOverflowContainer(button.id));
});

document.addEventListener("click", (event) => {
    const targetClass = event.target.classList;
    if (!(targetClass.contains("more-button") ||
        targetClass.contains("overflow-container") ||
        targetClass.contains("drop-down-menu-selection") ||
        targetClass.contains("drop-down-menu"))) {
        document.querySelectorAll(".more-button").forEach(button => {
            if (document.querySelector(`#${button.id} + .overflow-container`).style.display !== "") {
                toggleOverflowContainer(button.id);
            }
        });
        document.querySelectorAll(".drop-down-menu-container").forEach(container => {
            if (container.children[2].style.display !== "") {
                toggleDropDownMenu(container.id);
            }
        });
    }
});
