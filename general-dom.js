function toggleDropDownMenu(id) {
    const arrow = document.getElementById(id).children[1].style;
    const menu = document.getElementById(id).children[2];
    const emphasisAnimation = "linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%)";
    if (menu.style.display === "block") {
        arrow.transition = "transform 0.3s ease-in-out";
        arrow.transform = "";
        setTimeout(() => arrow.transition = "", 300);
        menu.animate(
            [{ opacity: "1", transform: "translateY(0)" }, { opacity: "0", transform: "translateY(-32px)" }],
            { duration: 300, easing: emphasisAnimation },
        );
        setTimeout(() => menu.style.display = "", 300);
    } else {
        arrow.transition = "transform 0.3s ease-in-out";
        arrow.transform = "translateY(-50%) rotate(0)";
        setTimeout(() => arrow.transition = "", 300);
        menu.style.display = "block";
        menu.animate(
            [{ opacity: "0", transform: "translateY(-32px)" }, { opacity: "1", transform: "translateY(0)" }],
            { duration: 300, easing: emphasisAnimation },
        );
    }
}
function setDropDownValue(dropDownId, newValue, isSetUp) {
    const menu = document.getElementById(dropDownId);
    const menuDisplay = menu.children[0];
    menuDisplay.setAttribute("value", newValue);
    menuDisplay.innerText = menu.querySelector(`button[value=${newValue}]`).innerText;
    if (!isSetUp) toggleDropDownMenu(dropDownId);
    if (dropDownId === "font-selector") {
        setFont(newValue);
    }
}

document.querySelectorAll(".loading-indicator-container").forEach(container => {
    container.innerHTML = `
        <div class="loading-indicator"></div>
        <div class="loading-indicator"></div>
        <div class="loading-indicator"></div>`;
});
document.querySelectorAll(".drop-down-menu-container").forEach(menuContainer => {
    let defaultValue = "", defaultValueText = "";
    menuContainer.querySelectorAll("button").forEach((option) => {
        option.setAttribute("onclick", `setDropDownValue('${menuContainer.id}', value);`);
        if (option.getAttribute("selected") === "") {
            defaultValue = option.value;
            defaultValueText = option.innerText;
        }
    });
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "drop-down-menu";
    optionsContainer.innerHTML = menuContainer.innerHTML;
    menuContainer.innerHTML = `
        <div class="drop-down-menu-selection" value="${defaultValue}" onclick="toggleDropDownMenu('${menuContainer.id}');">${defaultValueText}</div>
        <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
        <svg class="drop-down-arrow" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
            <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
        </svg>`;
    menuContainer.appendChild(optionsContainer);
});
