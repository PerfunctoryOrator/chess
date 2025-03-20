function setAppearance(mode) {
    function setAppearanceColors(values) {
        root.setProperty("--color", values[0]);
        root.setProperty("--background-color", values[1]);
        root.setProperty("--contrast-background-color", values[2]);
        root.setProperty("--active-color", values[3]);
        root.setProperty("--active-background-color", values[4]);
        root.setProperty("--border-color", values[5]);
        root.setProperty("--shadow-color", values[6]);
        root.setProperty("--star-color", values[7]);
    }
    switch (mode) {
        case "system":
            setAppearanceColors(["", "", "", "", "", "", "", ""]);
            break;
        case "light":
            setAppearanceColors(["var(--dark-gray)", "whitesmoke", "white", "rgb(42, 100, 227)", "rgba(0, 0, 0, 0.05)", "gainsboro", "rgba(0, 0, 0, 0.2)", "gold"]);
            break;
        case "dark":
            setAppearanceColors(["whitesmoke", "var(--dark-gray)", "black", "rgb(150, 200, 255)", "rgba(255, 255, 255, 0.2)", "rgb(112, 112, 112)", "rgba(0, 0, 0, 0.8)", "goldenrod"]);
            break;
    }
    currentSettings.appearance = mode;
}
function setEdges(mode) {
    switch (mode) {
        case "soft":
            root.setProperty("--box-radius", "");
            break;
        case "sharp":
            root.setProperty("--box-radius", "0");
            break;
    }
    currentSettings.edges = mode;
}
function setButtons(mode) {
    switch (mode) {
        case "round":
            root.setProperty("--button-radius", "");
            break;
        case "subtle":
            root.setProperty("--button-radius", "0.5em");
            break;
        case "sharp":
            root.setProperty("--button-radius", "0");
            break;
    }
    currentSettings.buttons = mode;
}
function setFont(font) {
    const customFontInputBox = document.getElementById("font-input");
    const hideCustomFontInput = () => {
        if (customFontInputBox.style.display === "") {
            customFontInputBox.style.display = "none";
            document.getElementById("font-input-text").style.display = "none";
        }
    };
    switch (font) {
        case "system":
            root.setProperty("--font-family", "");
            hideCustomFontInput();
            break;
        case "noto-sans":
            root.setProperty("--font-family", "Noto Sans");
            hideCustomFontInput();
            break;
        case "noto-serif":
            root.setProperty("--font-family", "Noto Serif");
            hideCustomFontInput();
            break;
        default:
            if (customFontInputBox.style.display !== "") {
                customFontInputBox.style.display = "";
                document.getElementById("font-input-text").style.display = "";
            }
            if (customFontInputBox.value === "") root.setProperty("--font-family", "");
                else root.setProperty("--font-family", `${customFontInputBox.value}, var(--system-font-stack)`);
            currentSettings.customFont = customFontInputBox.value;
    }
    currentSettings.font = font;
}
function applyCurrentSettings() {
    document.querySelector(`input[name="appearance"][value="${currentSettings.appearance}"]`).checked = true;
    document.querySelector(`input[name="edges"][value="${currentSettings.edges}"]`).checked = true;
    document.querySelector(`input[name="buttons"][value="${currentSettings.buttons}"]`).checked = true;
    document.getElementById("font-input").value = currentSettings.customFont;
    if (currentSettings.customFont !== "") {
        document.querySelector("#font-selector button[value='custom']").style.fontFamily = currentSettings.customFont;
    }

    setAppearance(currentSettings.appearance);
    setEdges(currentSettings.edges);
    setButtons(currentSettings.buttons);
    setDropDownValue("font-selector", currentSettings.font);
}

const Settings = {
    default: {
        version: "beta10",
        appearance: "system",
        edges: "soft",
        buttons: "round",
        font: "system",
        customFont: "",
    },
    areValid: function(settings) {
        if (!settings) return false;
        if (settings.version !== this.default.version) {
            alert("Your settings have been reset to default due to a recent version update of our chess website. This ensures compatibility with the new features and improvements we’ve added. You can reconfigure your preferences in the ‘Settings’ menu.\n\nThank you for your understanding.");
            return false;
        }
        const keys = Object.keys(this.default);
        for (const key of keys) {
            if (!(key in settings)) return false;
        }
        return true;
    },
    save: function(settings) {
        try {
            localStorage.setItem("userSettings", JSON.stringify(settings));
        } catch (error) {
            console.error("Could not save settings to local storage:", error);
        }
    },
    get: function() {
        try {
            const stored = localStorage.getItem("userSettings");
            if (stored) {
                const settings = JSON.parse(stored);
                if (this.areValid(settings)) {
                    return settings;
                }
            }
        } catch (error) {
            console.error("Could not retrieve settings from local storage:", error);
        }
        return null;
    },
};

const root = document.querySelector(":root").style;
let currentSettings = Settings.get();
if (!currentSettings) {
    Settings.save(Settings.default);
    currentSettings = {...Settings.default};
}
applyCurrentSettings();
