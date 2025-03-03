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
        case "system":
            setAppearanceColours([null, null, null, null, null, null]);
            break;
        case "light":
            setAppearanceColours(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.05)", "var(--dark-grey)", "var(--off-white)", "white", "gainsboro"]);
            break;
        case "dark":
            setAppearanceColours(["rgba(0, 0, 0, 0.8)", "rgba(255, 255, 255, 0.2)", "var(--off-white)", "var(--dark-grey)", "black", "rgb(112, 112, 112)"]);
    }
    currentSettings.appearance = mode;
}
function setEdges(mode) {
    switch (mode) {
        case "soft":
            document.querySelector(":root").style.setProperty("--box-radius", null);
            break;
        case "sharp":
            document.querySelector(":root").style.setProperty("--box-radius", "0");
    }
    currentSettings.edges = mode;
}
function setButtons(mode) {
    switch (mode) {
        case "curved":
            document.querySelector(":root").style.setProperty("--button-radius", "2em");
            break;
        case "subtle":
            document.querySelector(":root").style.setProperty("--button-radius", null);
            break;
        case "angular":
            document.querySelector(":root").style.setProperty("--button-radius", "0");
    }
    currentSettings.buttons = mode;
}
function applyCurrentSettings() {
    document.querySelector(`input[name="appearance"][value="${currentSettings.appearance}"]`).checked = true;
    document.querySelector(`input[name="edges"][value="${currentSettings.edges}"]`).checked = true;
    document.querySelector(`input[name="buttons"][value="${currentSettings.buttons}"]`).checked = true;
    setAppearance(currentSettings.appearance);
    setEdges(currentSettings.edges);
    setButtons(currentSettings.buttons);
}
const defaultSettings = {
    appearance: "system",
    edges: "soft",
    buttons: "subtle",
};
const UserSettings = {
    saveSettings: function(settings, daysToExpire = 90) {
        const encoded = JSON.stringify(settings);
        document.cookie = `userSettings=${encoded}; path=/; max-age=${daysToExpire * 24 * 60 * 60}`;
    },
    getSettings: function() {
        const cookie = document.cookie.split("; ").find(row => row.startsWith("userSettings="));
        if (cookie) {
            return JSON.parse(cookie.split("=")[1]);
        }
        return null;
    },
};
let currentSettings = UserSettings.getSettings();
if (!currentSettings) {
    UserSettings.saveSettings(defaultSettings);
    currentSettings = defaultSettings;
}
applyCurrentSettings();
window.onload = () => {
    document.getElementById("theme-colour").content = getComputedStyle(document.querySelector(":root")).getPropertyValue("--board-colour");
}
