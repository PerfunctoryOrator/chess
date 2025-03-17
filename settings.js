function setAppearance(mode) {
    function setAppearanceColors(values) {
        const root = document.querySelector(":root");
        root.style.setProperty("--color", values[0]);
        root.style.setProperty("--background-color", values[1]);
        root.style.setProperty("--contrast-background-color", values[2]);
        root.style.setProperty("--active-color", values[3]);
        root.style.setProperty("--active-background-color", values[4]);
        root.style.setProperty("--border-color", values[5]);
        root.style.setProperty("--shadow-color", values[6]);
    }
    switch (mode) {
        case "system":
            setAppearanceColors(["", "", "", "", "", "", ""]);
            break;
        case "light":
            setAppearanceColors(["var(--dark-gray)", "whitesmoke", "white", "rgb(42, 100, 227)", "rgba(0, 0, 0, 0.05)", "gainsboro", "rgba(0, 0, 0, 0.2)"]);
            break;
        case "dark":
            setAppearanceColors(["whitesmoke", "var(--dark-gray)", "black", "rgb(150, 200, 255)", "rgba(255, 255, 255, 0.2)", "rgb(112, 112, 112)", "rgba(0, 0, 0, 0.8)"]);
    }
    currentSettings.appearance = mode;
}
function setEdges(mode) {
    switch (mode) {
        case "soft":
            document.querySelector(":root").style.setProperty("--box-radius", "");
            break;
        case "sharp":
            document.querySelector(":root").style.setProperty("--box-radius", "0");
    }
    currentSettings.edges = mode;
}
function setButtons(mode) {
    switch (mode) {
        case "round":
            document.querySelector(":root").style.setProperty("--button-radius", "");
            break;
        case "subtle":
            document.querySelector(":root").style.setProperty("--button-radius", "0.5em");
            break;
        case "sharp":
            document.querySelector(":root").style.setProperty("--button-radius", "0");
    }
    currentSettings.buttons = mode;
}
function setFont(font) {
    switch (font) {
        case "system":
            document.querySelector(":root").style.setProperty("--font-family", "");
            break;
        case "noto-sans":
            document.querySelector(":root").style.setProperty("--font-family", "Noto Sans");
            break;
        case "noto-serif":
            document.querySelector(":root").style.setProperty("--font-family", "Noto Serif");
    }
    currentSettings.font = font;
}
function applyCurrentSettings() {
    document.querySelector(`input[name="appearance"][value="${currentSettings.appearance}"]`).checked = true;
    document.querySelector(`input[name="edges"][value="${currentSettings.edges}"]`).checked = true;
    document.querySelector(`input[name="buttons"][value="${currentSettings.buttons}"]`).checked = true;
    setAppearance(currentSettings.appearance);
    setEdges(currentSettings.edges);
    setButtons(currentSettings.buttons);
    setDropDownValue("font-selector", currentSettings.font, true);
}

const Settings = {
    default: {
        version: "beta6",
        appearance: "system",
        edges: "soft",
        buttons: "round",
        font: "system",
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

let currentSettings = Settings.get();
if (!currentSettings) {
    Settings.save(Settings.default);
    currentSettings = {...Settings.default};
}
applyCurrentSettings();
