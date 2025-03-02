function setAppearance(mode) {
    function setAppearanceColours(values) {
        const root = document.querySelector(":root");
        root.style.setProperty("--shadow-colour", values[0]);
        root.style.setProperty("--active-colour", values[1]);
        root.style.setProperty("--colour", values[2]);
        root.style.setProperty("--background-colour", values[3]);
        root.style.setProperty("--contrast-background-colour", values[4]);
        root.style.setProperty("--border-colour", values[5]);
    }
    switch (mode) {
        case undefined:
            setAppearanceColours([null, null, null, null, null, null]);
            break;
        case "light":
            setAppearanceColours(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.05)", "var(--dark-grey)", "var(--off-white)", "white", "gainsboro"]);
            break;
        case "dark":
            setAppearanceColours(["rgba(0, 0, 0, 0.8)", "rgba(255, 255, 255, 0.2)", "var(--off-white)", "var(--dark-grey)", "black", "rgb(112, 112, 112)"]);
    }
}

window.onload = () => {
    document.getElementById("theme-colour").content = getComputedStyle(document.querySelector(":root")).getPropertyValue("--board-colour");
}
