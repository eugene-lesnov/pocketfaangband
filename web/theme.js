const atlasTheme = (() => {
    const key = "pocketfaangband-theme";
    const system = matchMedia("(prefers-color-scheme: light)");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const tabIcon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    const iconURL = new URL(tabIcon.href);
    let choice;
    try { choice = localStorage.getItem(key); } catch {}

    function apply() {
        const systemTheme = system.matches ? "light" : "dark";
        const theme = choice === "light" || choice === "dark" ? choice : systemTheme;
        document.documentElement.dataset.theme = theme;
        themeColor.content = theme === "light" ? "#e4dfd0" : "#101c29";
        iconURL.hash = theme;
        tabIcon.href = iconURL.href;
        window.dispatchEvent(new Event("atlas-theme-change"));
    }

    system.addEventListener("change", apply);
    window.addEventListener("storage", (event) => {
        if (event.key === key || event.key === null) {
            choice = event.newValue;
            apply();
        }
    });
    apply();

    return {
        toggle() {
            choice = document.documentElement.dataset.theme === "light" ? "dark" : "light";
            try { localStorage.setItem(key, choice); } catch {}
            apply();
        },
    };
})();
