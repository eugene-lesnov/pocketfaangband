const scope = new URL("./", import.meta.url);
const legacyWorker = new URL("sw.js", scope);
const versionPattern = /^[a-f0-9]{64}$/;
let legacyPin;

function workerUrl(version) {
    return new URL(`sw-${version}.js`, scope);
}

async function readVersion(path, options) {
    const response = await fetch(new URL(path, scope), options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const info = await response.json();
    if (typeof info?.version !== "string" || !versionPattern.test(info.version)) {
        throw new Error("Invalid package version.");
    }
    return info;
}

async function registerWorker(url) {
    return navigator.serviceWorker.register(url, { scope: scope.href, updateViaCache: "none" });
}

async function pinLegacyWorker() {
    const { version } = await readVersion("installed-package.json");
    const registration = await navigator.serviceWorker.getRegistration(scope);
    if (registration?.active?.scriptURL !== legacyWorker.href ||
        [registration.installing, registration.waiting].some((worker) => worker && worker.scriptURL !== legacyWorker.href)) {
        return;
    }
    await registerWorker(workerUrl(version));
}

async function installWorker(url, reportProgress, waitForActivation = false) {
    const serviceWorkers = navigator.serviceWorker;
    const onMessage = ({ data, source }) => {
        if (source?.scriptURL === url.href && data?.type === "pocketfaangband-download") {
            reportProgress(data.percent);
        }
    };
    serviceWorkers.addEventListener("message", onMessage);
    try {
        const registration = await registerWorker(url);
        const worker = [registration.installing, registration.waiting, registration.active]
            .find((candidate) => candidate?.scriptURL === url.href);
        if (!worker) throw new Error("The game download did not start.");
        await new Promise((resolve, reject) => {
            function checkState() {
                const { state } = worker;
                if (state === "activated" || (!waitForActivation && state === "installed")) {
                    worker.removeEventListener("statechange", checkState);
                    resolve();
                } else if (state === "redundant") {
                    worker.removeEventListener("statechange", checkState);
                    reject(new Error("Could not download the game package."));
                }
            }
            worker.addEventListener("statechange", checkState);
            checkState();
        });
        return worker;
    } finally {
        serviceWorkers.removeEventListener("message", onMessage);
    }
}

export async function prepareOffline(reportProgress) {
    const serviceWorkers = navigator.serviceWorker;
    if (!serviceWorkers) {
        throw new Error("Offline play requires a browser with service workers and an HTTPS or localhost address.");
    }
    const controller = serviceWorkers.controller;
    if (controller?.state === "activated") {
        if (controller.scriptURL === legacyWorker.href) {
            legacyPin = pinLegacyWorker().catch(console.error);
        }
        return true;
    }
    try {
        const { version } = await readVersion("update.json", { cache: "no-store" });
        await installWorker(workerUrl(version), reportProgress, true);
        return false;
    } catch (error) {
        console.error(error);
        throw new Error("Could not download the game. Check your connection and try again.");
    }
}

export async function checkOfflineUpdate() {
    const [current, latest] = await Promise.all([
        readVersion("installed-package.json"),
        readVersion("update.json", { cache: "no-store" }),
    ]);
    if (typeof latest.release !== "string" || !latest.release) throw new Error("Invalid release name.");
    return latest.version === current.version ? undefined : latest;
}

export async function applyOfflineUpdate(update, reportProgress) {
    await legacyPin;
    let worker;
    try {
        worker = await installWorker(workerUrl(update.version), reportProgress);
    } catch (error) {
        console.error(error);
        throw new Error("Could not download the update. Check your connection and try again.");
    }
    if (navigator.serviceWorker.controller !== worker) await activateWorker(worker);
}

function activateWorker(worker) {
    return new Promise((resolve, reject) => {
        const serviceWorkers = navigator.serviceWorker;
        const channel = new MessageChannel();
        const unavailable = "Could not apply the update. Close all PocketFAangband windows and reopen the app.";
        const timeout = setTimeout(() => finish(unavailable), 10_000);

        function finish(message) {
            clearTimeout(timeout);
            serviceWorkers.removeEventListener("controllerchange", onControllerChange);
            channel.port1.close();
            if (message) reject(new Error(message));
            else resolve();
        }

        function onControllerChange() {
            if (serviceWorkers.controller === worker) finish();
        }

        channel.port1.onmessage = ({ data }) => {
            if (data === "other-windows") finish("Close other PocketFAangband windows and try again.");
            else finish(unavailable);
        };
        serviceWorkers.addEventListener("controllerchange", onControllerChange);
        try {
            worker.postMessage({ type: "pocketfaangband-apply-update" }, [channel.port2]);
            onControllerChange();
        } catch {
            channel.port2.close();
            finish(unavailable);
        }
    });
}
