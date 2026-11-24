import createFAangband from "./faangband.js";
import { graphicsModes } from "./tiles.js";

const profileDirectory = "/pocketfaangband-profile";
let preferredSaveSlot = new URL(self.location.href).searchParams.get("slot") || "";
const input = [];
let waiting;
let request = 0;
let backgroundSavePending = false;
let interruptPending = false;
let runningRequest;
let exploreResting = false;
let checkpointTimer;
let readMessageRecall;

function wakeInput(action) {
    clearTimeout(checkpointTimer);
    const { wake } = waiting;
    waiting = undefined;
    wake(action);
}

function deleteSaveError(message, request) {
    self.postMessage({ type: "save-delete-error", message, request });
}

self.addEventListener("message", ({ data }) => {
    if (data.type === "message-recall") {
        if (readMessageRecall) readMessageRecall(data.recall);
        else self.postMessage({ type: "message-recall", recall: data.recall });
        return;
    }
    if (data.type === "list-details") {
        if (waiting?.mode !== "details" || data.request !== waiting.request || !Number.isInteger(data.row)) return;
        const row = waiting.context.list?.[data.row];
        if (row?.race || row?.object) {
            const detail = waiting.readListDetails(row);
            self.postMessage({ type: "list-details", request: data.request, row: data.row, detail });
        }
        return;
    }
    if (data.type === "background-save") {
        if (waiting?.mode === "command") wakeInput("background-save");
        else if (!waiting || waiting.playing) backgroundSavePending = true;
        return;
    }
    if (data.type === "interrupt") {
        if (!waiting && runningRequest !== undefined && data.request === runningRequest) {
            interruptPending = true;
        }
        return;
    }
    if (data.type === "delete-save") {
        if (waiting?.mode !== "save-slots" || data.request !== waiting.request ||
            !waiting.menu?.rows.some((row) => row.index === data.code && row.enabled)) {
            deleteSaveError("The save slot selection changed. Try again.", waiting?.request);
            return;
        }
        input.push(data);
        wakeInput();
        return;
    }
    if (input.length >= 256 || (data.request !== undefined && data.request !== waiting?.request)) {
        return;
    }
    if (data.type === "key") {
        if (!Number.isInteger(data.code) || data.code <= 0 || data.code > 0x10ffff) return;
        if (data.command && (waiting?.mode !== "command" || data.request !== waiting.request)) return;
        if (data.mods !== undefined && (!Number.isInteger(data.mods) || data.mods < 0 || data.mods > 31)) return;
    } else if (data.type === "new-game") {
        if (waiting?.mode !== "save-slots" || data.request !== waiting.request ||
            !waiting.menu?.actions.some((action) => action.key === 0)) return;
    } else if (data.type === "open-character") {
        if (waiting?.mode !== "command" || data.request !== waiting.request) return;
    } else if (data.type === "quick-action") {
        if (waiting?.mode !== "command" || data.request !== waiting.request ||
            !Number.isInteger(data.code) || data.code < 0 || data.code >= 128 ||
            !"123456789dmrA".includes(String.fromCharCode(data.code))) return;
    } else if (data.type === "run-direction") {
        if (waiting?.mode !== "command" || data.request !== waiting.request ||
            !Number.isInteger(data.code) || data.code < 1 || data.code > 9 || data.code === 5) return;
    } else if (data.type === "submit-name") {
        const renaming = waiting?.mode === "character" && waiting.playing && waiting.context.nameMaxBytes !== undefined;
        if (!(renaming || ["name", "birth-stats", "birth-roll"].includes(waiting?.mode)) ||
            data.request !== waiting.request || typeof data.value !== "string") return;
    } else if (data.type === "submit-history") {
        if (!["birth-stats", "birth-roll"].includes(waiting?.mode) ||
            data.request !== waiting.request || typeof data.value !== "string") return;
    } else if (data.type === "submit-text") {
        if (waiting?.mode !== "text" || data.request !== waiting.request || typeof data.value !== "string") return;
    } else if (data.type === "random-name") {
        if (!["birth-stats", "birth-roll"].includes(waiting?.mode) || data.request !== waiting.request) return;
    } else if (data.type === "set-tiles") {
        if (waiting?.mode !== "command" || data.request !== waiting.request || !graphicsModes.has(data.code)) return;
    } else if (["aim-cell", "target-cell", "map-cell", "map-action"].includes(data.type)) {
        if (!waiting || data.request !== waiting.request) return;
        if (data.type === "aim-cell" && !["aim", "direction", "run-direction"].includes(waiting.mode)) return;
        if (data.type === "aim-cell") data.code = data.fast === true ? 1 : 0;
        if (data.type === "target-cell" && waiting.mode !== "target") return;
        if (data.type === "map-cell" || data.type === "map-action") {
            if (waiting.mode !== "command" || !waiting.context.worldView) return;
            const selected = waiting.context.mapCell;
            if (data.type === "map-action") {
                const action = selected?.actions?.find(({ code }) => code === data.code);
                if (!action) return;
                if (action.targets) {
                    if (!action.targets.some(({ x, y }) => x === data.x && y === data.y)) return;
                } else {
                    data.x = selected.x;
                    data.y = selected.y;
                }
            } else {
                const repeat = selected?.canRoute && data.x === selected.x && data.y === selected.y;
                if (data.openMenu === true) data.code = 1;
                else if (data.inspect === true) data.code = 3;
                else if (data.mouse === true) data.code = repeat ? 5 : 4;
                else data.code = repeat ? 2 : 0;
            }
        }
        const { region } = waiting;
        if (!region || !Number.isInteger(data.x) || !Number.isInteger(data.y) ||
            data.x < region.x || data.y < region.y ||
            data.x >= region.x + region.width || data.y >= region.y + region.height) return;
    } else if (data.type === "buy-stat" || data.type === "sell-stat") {
        if (waiting?.mode !== "birth-stats" || data.request !== waiting.request ||
            !Number.isInteger(data.code) || data.code < 0) return;
        const stat = waiting.context.birthStats?.rows[data.code];
        if (!(data.type === "buy-stat" ? stat?.canIncrease : stat?.canDecrease)) return;
    } else if (["menu-row", "menu-preview", "menu-section", "store-action"].includes(data.type)) {
        if (!waiting?.menu || waiting.mode === "more" || data.request !== waiting.request) return;
        const { rows, sections, actions } = waiting.menu;
        if (data.type === "menu-preview" && !waiting.menu.birth) return;
        if ((data.type === "menu-row" || data.type === "menu-preview") &&
            !rows.some((row) => row.index === data.code && row.enabled)) return;
        if (data.type === "menu-section" &&
            !sections?.some((section) => section.id === data.code && !section.active)) return;
        if (data.type === "store-action" &&
            (!actions.some((action) => action.key === data.code) ||
                (data.code !== "s".charCodeAt(0) && !rows.some((row) => row.index === data.row && row.enabled)))) return;
    } else {
        return;
    }
    input.push(data);
    runningRequest = waiting?.playing && data.type !== "set-tiles" ? waiting.request : undefined;
    if (waiting) wakeInput();
});

function syncProfile(fs, populate) {
    return new Promise((resolve, reject) => {
        fs.syncfs(populate, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

async function deleteProfileFiles(idbfs, paths) {
    const db = await new Promise((resolve, reject) => {
        idbfs.getDB(profileDirectory, (error, database) => {
            if (error) reject(error);
            else resolve(database);
        });
    });
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(idbfs.DB_STORE_NAME, "readwrite");
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error);
        try {
            const store = transaction.objectStore(idbfs.DB_STORE_NAME);
            for (const path of paths) store.delete(path);
        } catch (error) {
            transaction.abort();
            reject(error);
        }
    });
}

async function play(afterRun) {
    let world;
    let fileDownloadError;
    let currentTurns = 0;
    let savedTurns = -1;
    let attemptedTurns = 0;
    let checkpointStarted = false;
    let saveAttempt = Date.now();
    let lastError;
    let finish;
    const exited = new Promise((resolve) => {
        finish = resolve;
    });
    function readListDetails(row) {
        game._web_list_details(row.race, row.object);
        const detail = game.listDetail;
        game.listDetail = undefined;
        return detail;
    }
    const game = await createFAangband({
        skipSplash: !!afterRun,
        preferredSaveSlot,
        sendFrame(frame) {
            const buffers = [frame.codepoints.buffer, frame.attributes.buffer, frame.palette.buffer];
            if (frame.terrainAttributes) {
                buffers.push(frame.terrainCodepoints.buffer, frame.terrainAttributes.buffer);
            }
            self.postMessage({ type: "frame", ...frame }, buffers);
        },
        sendWorld(state) {
            world = state;
            currentTurns = state.turns;
        },
        sendMessageRecall(recall, entries) {
            self.postMessage({ type: "message-recall", recall, entries });
        },
        takeInput() {
            return input.shift();
        },
        takeInterrupt(exploring, resting) {
            const restingBeforeExplore = !!(exploring && resting);
            if (exploreResting !== restingBeforeExplore) {
                exploreResting = restingBeforeExplore;
                self.postMessage({ type: "explore-rest", resting: exploreResting, request: runningRequest });
            }
            const pending = interruptPending || (exploring && backgroundSavePending);
            interruptPending = false;
            return pending;
        },
        waitForInput(mode, region, playing, context, menu) {
            interruptPending = false;
            runningRequest = undefined;
            exploreResting = false;
            if (!playing) backgroundSavePending = false;
            const checkpoint = !checkpointStarted || (currentTurns !== savedTurns &&
                (currentTurns - attemptedTurns >= 10 || Date.now() - saveAttempt >= 15_000));
            if (mode === "command" && (backgroundSavePending || checkpoint)) {
                backgroundSavePending = false;
                checkpointStarted = true;
                attemptedTurns = currentTurns;
                saveAttempt = Date.now();
                world = undefined;
                return "background-save";
            }
            return new Promise((resolve) => {
                waiting = { request: ++request, mode, region, playing, context, menu, wake: resolve, readListDetails };
                if (mode === "command" && currentTurns !== savedTurns) {
                    const pendingRequest = request;
                    checkpointTimer = setTimeout(() => {
                        if (waiting?.request !== pendingRequest) return;
                        attemptedTurns = currentTurns;
                        saveAttempt = Date.now();
                        wakeInput("background-save");
                    }, Math.max(0, 15_000 - (Date.now() - saveAttempt)));
                }
                const data = context.resultsFile?.data;
                if (fileDownloadError) {
                    context.prompt = fileDownloadError;
                    fileDownloadError = undefined;
                }
                self.postMessage({ type: "waiting", request, mode, region, playing, world, context, menu },
                    data ? [data.buffer] : []);
                world = undefined;
            });
        },
        flushInput() {
            input.length = 0;
        },
        readResultsFile(path) {
            try {
                return game.FS.readFile(path);
            } catch (error) {
                console.error(error);
                return undefined;
            }
        },
        downloadFile(path, filename, error) {
            const data = path ? game.readResultsFile(path) : undefined;
            if (data?.length) self.postMessage({ type: "file-download", filename, data }, [data.buffer]);
            else fileDownloadError = error;
        },
        async deleteSaveFile(path, panic) {
            const fs = game.FS;
            const paths = panic ? [path, panic] : [path];
            try {
                const keys = paths.map((file) => {
                    const entry = fs.analyzePath(file, true);
                    if (!entry.exists || !entry.path.startsWith(profileDirectory + "/") ||
                        !fs.isFile(entry.object.mode)) {
                        throw new Error("The selected save is not a regular profile file.");
                    }
                    return entry.path;
                });
                await deleteProfileFiles(game.IDBFS, keys);
            } catch (error) {
                console.error(error);
                deleteSaveError("Could not delete the selected save.");
                return 0;
            }
            try {
                for (const file of paths) fs.unlink(file);
            } catch (error) {
                console.error(error);
                self.postMessage({ type: "error", message: "The save was deleted. Reopen the save slots." });
                return 0;
            }
            self.postMessage({ type: "save-deleted", slot: path.split("/").pop() });
            return 1;
        },
        async persistProfile(saved, outcome, automatic) {
            saveAttempt = Date.now();
            let ok = false;
            if (saved) {
                self.postMessage({ type: "saving", outcome, automatic });
                ok = await game.syncProfile();
                if (ok) {
                    backgroundSavePending = false;
                    savedTurns = currentTurns;
                    if (!outcome) preferredSaveSlot = game.saveSlot;
                }
            }
            self.postMessage({ type: "saved", ok, outcome, automatic, slot: game.saveSlot });
            return ok;
        },
        async syncProfile() {
            try {
                await syncProfile(game.FS, false);
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        },
        printErr(message) {
            lastError = message;
            console.error(message);
        },
        onAbort(reason) {
            readMessageRecall = undefined;
            clearTimeout(checkpointTimer);
            finish({ type: "exit", code: 1, message: String(reason || lastError || "FAangband aborted.") });
        },
        onExit(code) {
            readMessageRecall = undefined;
            clearTimeout(checkpointTimer);
            finish({ type: "exit", code, message: lastError, afterRun: game.afterRun });
        },
    });
    readMessageRecall = game._web_message_recall;

    try {
        game.FS.mkdir(profileDirectory);
        game.FS.mount(game.IDBFS, {}, profileDirectory);
        await syncProfile(game.FS, true);
    } catch (error) {
        console.error(error);
        throw new Error("Could not open the FAangband profile.");
    }
    game.callMain([afterRun === "new-game" ? "-n" : "-c", "-uPLAYER"]);
    return exited;
}

try {
    if (!navigator.locks) {
        throw new Error("The FAangband profile requires a browser with Web Locks and an HTTPS or localhost address.");
    }
    const result = await navigator.locks.request(profileDirectory, { ifAvailable: true }, async (lock) => {
        if (!lock) throw new Error("The FAangband profile is open in another tab.");
        let exit = await play();
        while (exit.code === 0 && exit.afterRun) {
            self.postMessage({ type: "restarting" });
            exit = await play(exit.afterRun);
        }
        return exit;
    });
    self.postMessage(result);
} catch (error) {
    self.postMessage({ type: "error", message: error.message || String(error) });
}
