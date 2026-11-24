import { renderDescription, renderFrame, textColors } from "./frame-renderer.js";
import { ExploreCamera } from "./explore-camera.js";
import { renderInscriptionHelp } from "./inscriptions.js";
import { applyOfflineUpdate, checkOfflineUpdate, prepareOffline } from "./offline.js";
import { graphicsModes, loadTiles, styleTerminalTile, tileAt } from "./tiles.js";

const main = document.querySelector("main");
const launch = document.querySelector("#launch");
const status = document.querySelector("#status");
const progress = document.querySelector("#download-progress");
const retry = document.querySelector("#retry");
const updateApp = document.querySelector("#update-app");
const updateStatus = document.querySelector("#update-status");
const saveStatus = document.querySelector("#save-status");
const deleteSaveDialog = document.querySelector("#delete-save-dialog");
const deleteSaveLabel = document.querySelector("#delete-save-label");
const confirmDeleteSave = document.querySelector("#confirm-delete-save");
const deleteSaveIcon = document.querySelector("#delete-save-icon");
const deleteSaveStatus = document.querySelector("#delete-save-status");
const viewTitle = document.querySelector("#view-title");
const regionalMap = document.querySelector("#regional-map");
const regionPlaces = document.querySelector("#region-places");
const regionPlayer = document.querySelector("#region-player");
const monsterSort = document.querySelector("#monster-sort");
const zoom = document.querySelector("#zoom");
const zoomOut = document.querySelector("#zoom-out");
const zoomIn = document.querySelector("#zoom-in");
const hud = document.querySelector("#hud");
const vitals = document.querySelector("#vitals");
const mapStatus = document.querySelector("#map-status");
const mapIndicators = document.querySelector("#map-indicators");
const currentPlace = document.querySelector("#current-place");
const levelFeeling = document.querySelector("#level-feeling");
const feelingDanger = document.querySelector("#feeling-danger");
const feelingTreasure = document.querySelector("#feeling-treasure");
const gridLightValue = document.querySelector("#grid-light-value");
const gridTerrain = document.querySelector("#grid-terrain");
const hp = document.querySelector("#hp");
const hpValue = document.querySelector("#hp-value");
const sp = document.querySelector("#sp");
const spValue = document.querySelector("#sp-value");
const acValue = document.querySelector("#ac-value");
const speed = document.querySelector("#speed");
const monsterHealth = document.querySelector("#monster-health");
const monsterName = document.querySelector("#monster-name");
const monsterBar = document.querySelector("#monster-health-bar");
const monsterSegments = Array.from({ length: 10 }, () => document.createElement("span"));
monsterBar.append(...monsterSegments);
const hudStats = document.querySelector("#hud-stats");
const activeConditions = document.querySelector("#active-conditions");
const nourishment = document.querySelector("#nourishment");
const hiddenConditionCount = document.querySelector("#hidden-condition-count");
const characterScreen = document.querySelector("#character-screen");
const characterName = document.querySelector("#character-name");
const characterNameEdit = document.querySelector("#character-name-edit");
const characterNameEditor = document.querySelector("#character-name-editor");
const characterNameFields = document.querySelector("#character-name-fields");
const characterNameValue = document.querySelector("#character-name-value");
const characterDump = document.querySelector("#character-dump");
const characterClass = document.querySelector("#character-class");
const characterSummary = document.querySelector("#character-summary");
const characterAttributes = document.querySelector("#character-attributes");
const birthStartOver = document.querySelector("#birth-start-over");
const characterConditions = document.querySelector("#character-conditions");
const characterCombat = document.querySelector("#character-combat");
const characterDefenses = document.querySelector("#character-defenses");
const characterProgress = document.querySelector("#character-progress");
const characterProgressLabel = document.querySelector("#character-progress-label");
const journal = document.querySelector("#journal");
const messages = document.querySelector("#messages");
const knowledgeSearch = document.querySelector("#knowledge-search");
const knowledgeSearchToggle = document.querySelector("#knowledge-search-toggle");
let knowledgeScroll = 0;
const knowledgePageSize = 60;
const knowledgeLimits = new Map();
const messageSearchToggle = document.querySelector("#message-search-toggle");
const messageSearch = document.querySelector("#message-search");
const messageSearchStatus = document.querySelector("#message-search-status");
const earlierMessages = document.querySelector("#earlier-messages");
const latestMessage = document.querySelector("#latest-message");
const messagePause = document.querySelector("#message-pause");
const pausedMessage = document.querySelector("#paused-message");
const continueMessage = document.querySelector("#continue-message");
const pausedControls = [...messagePause.parentElement.children, hud, document.querySelector(".controls")]
    .filter((element) => element !== messagePause);
const directionPad = document.querySelector("#direction-pad");
const directionButtons = [...directionPad.querySelectorAll("button")];
const directionCenter = document.querySelector("#direction-center");
const centerDot = document.querySelector("#center-dot");
const centerCaption = document.querySelector("#center-caption");
const terminalKeys = document.querySelector("#terminal-keys");
const cancelKey = document.querySelector("#cancel-key");
const editHistory = document.querySelector("#edit-history");
const confirmKey = document.querySelector("#confirm-key");
const playKeys = document.querySelector("#play-keys");
const quickActionKeys = document.querySelector("#quick-actions");
const primaryActions = document.querySelector("#primary-actions");
const heroActions = document.querySelector("#hero-actions");
const useAction = document.querySelector("#use-action");
const combatAction = document.querySelector("#combat-action");
const repeatAction = document.querySelector("#repeat-action");
const movementMode = document.querySelector("#movement-mode");
const walkMode = document.querySelector("#walk-mode");
const runModeButton = document.querySelector("#run-mode");
const mapCellActions = document.querySelector("#map-cell-actions");
const mapActionButtons = document.querySelector("#map-action-buttons");
const mapActionDirection = document.querySelector("#map-action-direction");
const mapActionFooter = document.querySelector("#map-action-footer");
const closeMapCellActions = document.querySelector("#close-map-cell-actions");
const openMapLists = document.querySelector("#open-map-lists");
const mapLists = document.querySelector("#map-lists");
const mapKeyboardToggle = document.querySelector("#map-keyboard-toggle");
const openMenu = document.querySelector("#open-menu");
const discoveryArrow = document.querySelector("#discovery-arrow");
const exploreCamera = new ExploreCamera(discoveryArrow,
    [mapStatus, monsterHealth, zoom, mapKeyboardToggle, openMenu, openMapLists, saveStatus], draw);
const stopAction = document.querySelector("#stop-action");
const exploreAction = document.querySelector("#explore-action");
const nearest = document.querySelector("#nearest");
const targetActions = document.querySelector("#target-actions");
const previousTarget = document.querySelector("#previous-target");
const nextTarget = document.querySelector("#next-target");
const targetMode = document.querySelector("#target-mode");
const targetTypes = document.querySelector("#target-types");
const targetMonster = document.querySelector("#target-monster");
const targetLocation = document.querySelector("#target-location");
const confirmTarget = document.querySelector("#confirm-target");
const targetInspect = document.querySelector("#target-inspect");
const inputPrompt = document.querySelector("#input-prompt");
const messageDialog = document.querySelector("#message-dialog");
const nameScreen = document.querySelector("#name-screen");
const nameFields = document.querySelector("#name-fields");
const nameValue = document.querySelector("#name-value");
const namePrompt = document.querySelector("#name-prompt");
const textScreen = document.querySelector("#text-screen");
const textFields = document.querySelector("#text-fields");
const textValue = document.querySelector("#text-value");
const textHistoryValue = document.querySelector("#text-history-value");
const textPrompt = document.querySelector("#text-prompt");
const textTitle = document.querySelector("#text-title");
const textIntro = document.querySelector("#text-intro");
const inscriptionHelp = document.querySelector("#inscription-help");
const confirmText = document.querySelector("#confirm-text");
const editValue = document.querySelector("#edit-value");
const tradeQuantityLabel = document.querySelector("#trade-quantity-label");
const tradeSummary = document.querySelector("#trade-summary");
const tradeDetails = document.querySelector("#trade-details");
const detailsScreen = document.querySelector("#details-screen");
const unavailableScreen = document.querySelector("#unavailable-screen");
const helpScreen = document.querySelector("#help-screen");
const helpIndex = document.querySelector("#help-index");
const helpContent = document.querySelector("#help-content");
const helpButtons = [...helpIndex.querySelectorAll("button")];
const visibleListScreen = document.querySelector("#visible-list-screen");
const inspectionPanel = document.querySelector("#inspection-panel");
const inspectionTitle = document.querySelector("#inspection-title");
const listDetailsScreen = document.querySelector("#list-details-screen");
const splashScreen = document.querySelector("#splash-screen");
const angbandVersion = document.querySelector("#angband-version");
const victoryScreen = document.querySelector("#victory-screen");
const victoryName = document.querySelector("#victory-name");
const victoryClass = document.querySelector("#victory-class");
const outcomeSummary = document.querySelector("#outcome-summary");
const outcomeName = document.querySelector("#outcome-name");
const outcomeClass = document.querySelector("#outcome-class");
const outcomeCause = document.querySelector("#outcome-cause");
const outcomeStats = document.querySelector("#outcome-stats");
const outcomeDate = document.querySelector("#outcome-date");
const outcomeActions = document.querySelector("#outcome-actions");
const resultsList = document.querySelector("#results-list");
const resultsFile = document.querySelector("#results-file");
const resultsFileStatus = document.querySelector("#results-file-status");
const downloadResult = document.querySelector("#download-result");

function createMenuList(screenId, descriptionId) {
    const screen = document.getElementById(screenId);
    screen.append(document.querySelector("#menu-list-template").content.cloneNode(true));
    return {
        screen, scrollArea: screen, description: document.getElementById(descriptionId),
        summary: screen.querySelector(".menu-summary"), sections: screen.querySelector(".menu-sections"),
        items: screen.querySelector(".menu-items"), rows: screen.querySelector(".menu-rows"),
        empty: screen.querySelector(".menu-empty"),
    };
}

const pageList = createMenuList("menu-screen", "menu-description");
const pickerList = createMenuList("picker-list", "picker-description");
let activeList = pageList;
let lastMenuScrollSize;
const menuActions = document.querySelector("#menu-actions");
const optionSaveStatus = document.querySelector("#option-save-status");
const picker = document.querySelector("#picker");
const pickerHeading = document.querySelector("#picker-heading");
const pickerListShadow = document.querySelector("#picker-list-shadow");
const pickerDescriptionShadow = document.querySelector("#picker-description-shadow");
const controls = picker.parentElement;
const mainView = viewTitle.closest(".view");
const pickerToggle = document.querySelector("#picker-toggle");
const birthPreview = document.querySelector("#birth-preview");
const birthCard = document.querySelector("#birth-card");
const birthChoice = document.querySelector("#birth-choice");
const birthDescription = document.querySelector("#birth-description");
const birthRaceDescription = document.querySelector("#birth-race-description");
const birthAdjustments = document.querySelector("#birth-adjustments");
const birthVitals = document.querySelector("#birth-vitals");
const birthAbilities = document.querySelector("#birth-abilities");
const birthSkills = document.querySelector("#birth-skills > div");
const statMethodCharacter = document.querySelector("#stat-method-character");
const birthDescriptions = new Map([
    ["Easterling", "Easterlings fight well on open plains, particularly with swords and crossbows."],
    ["Green-Elf", "Green-Elves move freely among trees and excel at stealth and archery."],
    ["Grey-Elf", "Grey-Elves are at home in the forest. They resist light and are skilled in melee combat."],
    ["Hobbit", "Hobbits are stealthy and adept with slings, thrown weapons, locks and traps."],
    ["Petty-Dwarf", "Petty-Dwarves excel at magic and the use of magical devices."],
    ["Dwarf", "Dwarves are strong miners and fighters with keen infravision and immunity to blindness."],
    ["Drúadan", "The Drúedain are wise, stealthy woodspeople with a gift for druidry and telepathy."],
    ["Longbeard", "The Longbeards of Khazad Dum are the eldest of the seven lines of the Dwarves."],
    ["Adan", "The Edain are Elf-friends, hardy and wise, with a particular talent for melee."],
    ["High-Elf", "The Noldor came from Aman to reclaim the Silmarils. They can see invisible creatures."],
    ["Dark-Elf", "Dark-Elves are skilled in magic and at home in the forests of Beleriand."],
    ["Ent", "Ents are shepherds of the trees. They are powerful in melee but vulnerable to fire."],
    ["Beorning", "Beornings fight well on the plains and can take the shape of a bear."],
    ["Warrior", "Warriors strike more blows in melee than any other class. They excel with missile weapons and learn no spells."],
    ["Mage", "Mages rely on spells and magical devices to attack and escape. Intelligence is their primary stat."],
    ["Druid", "Druids use nature magic to shape their surroundings and take the forms of creatures. They rely on wisdom."],
    ["Priest", "Priests rely on wisdom and receive their prayers from a deity. They fight well with blessed or hafted weapons."],
    ["Necromancer", "Necromancers thrive in darkness and command spirits. Their powerful spells can also harm the caster."],
    ["Paladin", "Paladins combine strong melee fighting with priestly prayers. Strength and wisdom are their primary stats."],
    ["Rogue", "Rogues use stealth to strike first or steal from monsters. They excel at picking locks and disarming traps."],
    ["Ranger", "Rangers excel with bows and use spells of survival and forest craft. They are skilled at stealth and searching."],
    ["Blackguard", "Blackguards favour heavy weapons and shields, and learn destructive spells. They rely on strength and intelligence."],
]);
const birthStatsScreen = document.querySelector("#birth-stats");
const birthNameForm = document.querySelector("#birth-name-form");
const birthNameFields = document.querySelector("#birth-name-fields");
const birthNameValue = document.querySelector("#birth-name-value");
let birthNameSource;
let randomBirthNamePending = false;
const birthIdentity = document.querySelector("#birth-identity");
const birthPoints = document.querySelector("#birth-points");
const birthStatRows = document.querySelector("#birth-stat-rows");
const resetStats = document.querySelector("#reset-stats");
const birthRollActions = document.querySelector("#birth-roll-actions");
const previousRoll = document.querySelector("#previous-roll");
const birthHistoryPreview = document.querySelector("#birth-history-preview");
const birthHistoryEdit = document.querySelector("#birth-history-edit");
const birthHistoryEditor = document.querySelector("#birth-history-editor");
const birthHistoryValue = document.querySelector("#birth-history-value");
const actionsScreen = document.querySelector("#actions-screen");
const tilesMenu = makeButton("Tiles: ASCII");
tilesMenu.removeAttribute("aria-label");
tilesMenu.setAttribute("aria-controls", "actions-screen");
tilesMenu.addEventListener("click", () => showPanel("tiles", openMenu));
const tilesStatus = document.createElement("p");
tilesStatus.setAttribute("role", "status");
const quantity = document.querySelector("#quantity");
const optionDigits = document.querySelector("#option-digits");
const rest = document.querySelector("#rest");
const keyboard = document.querySelector("#keyboard");
const keyboardUtilities = document.querySelector("#keyboard-utilities");
const keyboardToggle = document.querySelector("#keyboard-toggle");
mapKeyboardToggle.append(keyboardToggle.querySelector(".keyboard-icon").cloneNode(true));

const specialKeys = new Map([
    ["Enter", 13], ["Backspace", 8], ["Escape", 27], ["Save", 19], ["SaveAndQuit", 24], ["Tab", 9],
    ["ArrowDown", 0x80], ["ArrowLeft", 0x81], ["ArrowRight", 0x82], ["ArrowUp", 0x83],
    ["Ctrl+A", 1], ["Ctrl+P", 16], ["CtrlT", 20], ["Ctrl+V", 22],
]);
const gameMenu = [
    ["=", "Options"], ["?", "Help"], ["~", "Knowledge"],
    ["Q", "Retire character and quit"],
    ["Save", "Save"], ["SaveAndQuit", "Save and quit"],
];
const useCommand = ["U", "Use an item", "X", "Use"];
const repeatCommand = ["n", "Repeat previous command", "Ctrl+V"];
const spellCommands = {
    look: ["l", "Look around", "x", "Look"],
    browse: ["b", "Browse a book", "P", "Browse"],
    study: ["G", "Gain new spells", null, "Study"],
    cast: ["m", "Cast a spell", null, "Cast"],
};
const fireCommand = ["f", "Fire your missile weapon", "t", "Fire"];
const throwCommand = ["v", "Throw an item", null, "Throw"];
const restCommand = ["R", "Rest for a while", null, "Rest"];
const runCommand = [".", "Start running", ","];
const stealCommand = ["s", "Steal from a monster"];
const visibleListCommands = [
    ["[", "Display visible monster list", null, "Monster list"],
    ["]", "Display visible item list", null, "Item list"],
];
const extraCommands = [
    runCommand, restCommand, spellCommands.look, useCommand, repeatCommand,
    ["r", "Read a scroll"], ["q", "Quaff a potion"], ["d", "Drop an item"],
    ["S", "View abilities"], ["M", "Full map"], ["$", "Move house"],
    ["g", "Pick up objects"], ["<", "Go up staircase or along a path"], [">", "Go down staircase or along a path"],
    ["u", "Use a staff", "Z"], ["a", "Aim a wand", "z"], ["z", "Zap a rod", "a"],
    spellCommands.study, spellCommands.browse, throwCommand, spellCommands.cast, fireCommand,
    ["E", "Eat some food"], ["A", "Activate an object"], ["F", "Fuel your light source"],
    [":", "Take notes"], ["/", "Identify symbol"],
    ["K", "Toggle ignoring of items", "O"],
    ["*", "Target monster or location"], ...visibleListCommands,
    ["h", "Fire at nearest target", "Tab"], ["+", "Alter a grid"], ["T", "Dig a tunnel", "CtrlT"],
    ["D", "Disarm a trap or chest, or lock a door"], ["o", "Open a door or a chest"], ["c", "Close a door"],
];
const panelTitles = { menu: "Menu", commands: "Commands", tiles: "Tiles", character: "Character",
    "touch-settings": "Touch settings" };
const screenTitles = new Map([
    ["aim", "Aim"], ["run-direction", "Run"], ["direction", "Direction"],
    ["overview", "Full map"], ["locate", "Map sectors"], ["details", "Details"], ["help", "Help"], ["history", "Character history"],
    ["birth-stats", "Point-based"], ["birth-roll", "Standard roller"],
    ["name", "Character name"], ["text", "Text entry"],
    ["key", "Key input"],
]);
const modesWithoutKeyboard = new Set([
    "splash", "save-slots", "birth-stats", "birth-roll", "birth-review", "history",
    "direction", "run-direction", "quantity", "option-number", "rest", "confirm", "overview", "details", "victory", "retire",
    "character", "help", "locate",
]);
const keyNames = new Map([["Escape", "Esc"], ["CtrlT", "Ctrl+T"], ["Save", "Ctrl+S"], ["SaveAndQuit", "Ctrl+X"]]);
const restLabels = new Map([["&", "As needed"], ["*", "HP and SP"], ["!", "HP or SP"], ["$", "Sunrise / sunset"]]);
const mapDirections = [
    null,
    { key: "1", roguelike: "b", arrow: "↙", name: "down left" },
    { key: "ArrowDown", roguelike: "j", arrow: "↓", name: "down" },
    { key: "3", roguelike: "n", arrow: "↘", name: "down right" },
    { key: "ArrowLeft", roguelike: "h", arrow: "←", name: "left" },
    { key: "5", name: "here" },
    { key: "ArrowRight", roguelike: "l", arrow: "→", name: "right" },
    { key: "7", roguelike: "y", arrow: "↖", name: "up left" },
    { key: "ArrowUp", roguelike: "k", arrow: "↑", name: "up" },
    { key: "9", roguelike: "u", arrow: "↗", name: "up right" },
];

const scales = [0.75, 0.875, 1, 1.25, 1.5, 1.75];
const mapScales = [...scales, 2, 2.25];
const defaultZoom = scales.indexOf(1.5);
const views = {
    terminal: {
        viewport: document.querySelector("#terminal-screen"),
        pre: document.querySelector("#terminal"),
        title: "PocketFAangband",
        zoom: 2,
    },
    map: {
        viewport: document.querySelector("#map-screen"),
        gridElement: document.querySelector("#map-surface"),
        pre: document.querySelector("#map"),
        canvas: document.querySelector("#map-tiles"),
        title: "Map",
    },
    target: {
        viewport: document.querySelector("#target-screen"),
        pre: document.querySelector("#target"),
        canvas: document.querySelector("#target-tiles"),
        title: "Targeting",
    },
};

let activeView = views.terminal;
let worker;
let request;
let mode;
let messagePauseTrigger;
let world;
let context = {};
let mapDirectionAction;
let menu;
let menuCursor;
const birthScroll = new Map();
let openPanel;
let panelTrigger;
let characterTrigger;
let pendingInput;
let stopTimer;
let speedHighlightTimer;
let saveNoticeTimer;
let running = false;
let runMode = false;
let runningFromPad = false;
let exploring = false;
let exploreResting = false;
let playingGame = false;
let saving = false;
let deletingSave = false;
let deleteTarget;
let availableUpdate;
let checkingUpdate = false;
let applyingUpdate = false;
let updateProgress = 0;
let resultURL;
let helpPage;
let outcomeSaveFailed = false;
let stopped = false;
let loadingTiles;
let backgroundSaveRequested = false;
let drawPending = false;
let centerPending = false;
let keyboardOpen = false;
let keyboardLayer = 0;
let shifted = false;
let controlKey = false;
let pickerExpanded = false;
let inspectingChoice = false;
const promptModes = new Set(["confirm", "key", "quantity", "option-number", "rest", "retire"]);
let renderedList;
let repeatName = "";
let graphicsRestored = false;
let messageRecallRequest = 0;
let messageRecallInput;
let recalledMessages = [];
let journalEntries;
let journalPrompt = "";
const preferencesKey = "pocketfaangband-touch";
const preferences = { leftHanded: false, fastAim: false, tapToMove: true, tiles: 0, lastSave: "" };
let preferencesWriteFailed = false;
try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) || "{}");
    for (const key of Object.keys(preferences)) {
        if (typeof saved[key] === typeof preferences[key]) preferences[key] = saved[key];
    }
    if (!graphicsModes.has(preferences.tiles)) preferences.tiles = 0;
} catch {}

function savePreferences() {
    try {
        localStorage.setItem(preferencesKey, JSON.stringify(preferences));
        preferencesWriteFailed = false;
    } catch {
        preferencesWriteFailed = true;
    }
}

function applyPreferences() {
    main.classList.toggle("left-handed", preferences.leftHanded);
}
applyPreferences();

function draw() {
    if (drawPending) return;
    drawPending = true;
    requestAnimationFrame(() => {
        drawPending = false;
        const view = activeView;
        const showDiscoveries = view === views.map && !view.viewport.hidden && mode === "command" &&
            request !== undefined && !exploring && !context.mapCell && picker.hidden && mapLists.hidden &&
            messagePause.hidden;
        if (!showDiscoveries) discoveryArrow.hidden = true;
        if (view.viewport.hidden || (!picker.hidden && view !== views.map)) return;
        const map = view === views.map;
        if (map && (!view.viewport.clientWidth || !view.viewport.clientHeight)) return;
        let region = view === views.target ? view.crop : view === views.terminal ? context.overview : undefined;
        const source = map ? view.frame : view === views.terminal ? context.overviewFrame : views.terminal.frame;
        if (!source) return;
        const aiming = mode === "aim" && request !== undefined;
        const target = aiming && context.target &&
            (view === views.map || containsCell(region, context.target)) ?
            context.target : undefined;
        const listCell = map ? context.listSelection?.cell : undefined;
        const selected = listCell ?? target ?? (map ? context.mapCell : undefined);
        const cursor = selected ? selected.y * source.width + selected.x : source.cursor;
        const path = aiming && view !== views.terminal ? context.aimPath : undefined;
        const marks = map && !exploring && world?.mapStatus?.discoveries;
        const discoveries = marks && source.player?.placeId === world.placeId &&
            source.player.x === marks.x && source.player.y === marks.y ? marks.cells : undefined;
        const frameStop = showDiscoveries && discoveries?.size && !exploreCamera.framed;
        const mapActions = view === views.map ? context.mapCell?.actions : undefined;
        const choosing = view === views.map ? mapDirectionAction : undefined;
        const previousGrid = view.gridElement;
        const cursorCell = mode === "target" && cursor >= 0 ?
            { x: cursor % source.width, y: Math.floor(cursor / source.width) } : undefined;
        let cell = map ? listCell ?? source.player : cursorCell ?? target ?? context.player;
        if (mode === "locate" && region && (!cell || !containsCell(region, cell))) {
            cell = { x: region.x + Math.floor(region.width / 2), y: region.y + Math.floor(region.height / 2) };
        }
        const focusChanged = cell?.x !== view.focusCell?.x || cell?.y !== view.focusCell?.y ||
            cell?.placeId !== view.focusCell?.placeId;
        const graphicsChanged = source.graphicsMode !== view.rendered?.graphicsMode;
        if (map) {
            const sizeChanged = source.width !== view.grid?.columns || source.height !== view.grid?.rows;
            if (sizeChanged) {
                view.grid = { x: 0, y: 0, columns: source.width, rows: source.height };
                view.gridElement.style.setProperty("--columns", source.width);
                view.gridElement.style.setProperty("--rows", source.height);
            }
            if (graphicsChanged) {
                view.gridElement.classList.toggle("tiles",
                    Boolean(graphicsModes.get(source.graphicsMode)?.atlas && source.terrainAttributes));
            }
            updateViewZoom(view);
            if (cell && !frameStop && (centerPending || focusChanged || sizeChanged || graphicsChanged)) {
                const reading = context.listSelection?.reading;
                centerCell(view, selected?.actions ? selected : cell,
                    listCell && reading ? source.player : undefined, listCell && !reading);
            }
            if (showDiscoveries && discoveries?.size) exploreCamera.update(view, discoveries);
            else discoveryArrow.hidden = true;
            region = visibleMapRegion(view);
        }
        const regionChanged = !sameRegion(region, view.region);
        const changed = source !== view.rendered || cursor !== view.cursor || regionChanged || path !== view.path ||
            mapActions !== view.mapActions || choosing !== view.choosing || discoveries !== view.discoveries;
        if (changed) {
            const positions = choosing?.targets ?? mapActions?.flatMap((action) => action.targets ?? []);
            const highlighted = path ? new Set(path) :
                positions?.length ? new Set(positions.map(({ x, y }) => y * source.width + x)) : undefined;
            const frame = cursor === source.cursor && !highlighted && !discoveries ? source :
                { ...source, cursor, highlighted, discoveries };
            const { grid, gridElement } = renderFrame(view, frame, region);
            if (map) {
                view.gridElement.style.setProperty("--first-column", grid.x);
                view.gridElement.style.setProperty("--first-row", grid.y);
            } else {
                view.grid = grid;
                view.gridElement = gridElement;
            }
            view.rendered = source;
            view.region = region;
            view.cursor = cursor;
            view.path = path;
            view.discoveries = discoveries;
            view.mapActions = mapActions;
            view.choosing = choosing;
        }
        if (!map) updateViewZoom(view);
        updatePrompt();
        if (view === views.target && !view.fit && cell &&
            (centerPending || focusChanged || regionChanged || graphicsChanged || previousGrid !== view.gridElement)) {
            centerCell(view, cell);
        }
        view.focusCell = cell;
        centerPending = false;
    });
}

function visibleMapRegion({ viewport, gridElement, grid: { columns, rows } }) {
    const screen = viewport.getBoundingClientRect();
    const bounds = gridElement.getBoundingClientRect();
    const left = screen.left + viewport.clientLeft - bounds.left;
    const top = screen.top + viewport.clientTop - bounds.top;
    const cellWidth = bounds.width / columns;
    const cellHeight = bounds.height / rows;
    const margin = 2;
    const x = Math.max(0, Math.floor(left / cellWidth) - margin);
    const y = Math.max(0, Math.floor(top / cellHeight) - margin);
    const right = Math.min(columns, Math.ceil((left + viewport.clientWidth) / cellWidth) + margin);
    const bottom = Math.min(rows, Math.ceil((top + viewport.clientHeight) / cellHeight) + margin);
    return { x, y, width: right - x, height: bottom - y };
}

function sameRegion(a, b) {
    return a === b || !!a && !!b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function containsCell(region, { x, y }) {
    return region && x >= region.x && y >= region.y &&
        x < region.x + region.width && y < region.y + region.height;
}

function centerCell(view, cell, companion, keepVisible) {
    const { viewport, gridElement, grid } = view;
    const column = cell.x - grid.x;
    const row = cell.y - grid.y;
    if (column < 0 || column >= grid.columns || row < 0 || row >= grid.rows) return;
    const bounds = gridElement.getBoundingClientRect();
    const screen = viewport.getBoundingClientRect();
    const cellWidth = bounds.width / grid.columns;
    const cellHeight = bounds.height / grid.rows;
    const left = bounds.left - screen.left - viewport.clientLeft + column * cellWidth;
    const top = bounds.top - screen.top - viewport.clientTop + row * cellHeight;
    if (keepVisible && left >= 0 && left + cellWidth <= viewport.clientWidth &&
        top >= 0 && top + cellHeight <= viewport.clientHeight) return;
    let x = column + 0.5;
    let y = row + 0.5;
    if (companion && (Math.abs(companion.x - cell.x) + 1) * cellWidth <= viewport.clientWidth &&
        (Math.abs(companion.y - cell.y) + 1) * cellHeight <= viewport.clientHeight) {
        x += (companion.x - cell.x) / 2;
        y += (companion.y - cell.y) / 2;
    }
    viewport.scrollLeft += bounds.left - screen.left - viewport.clientLeft +
        x * cellWidth - viewport.clientWidth / 2;
    viewport.scrollTop += bounds.top - screen.top - viewport.clientTop +
        y * cellHeight - viewport.clientHeight / 2;
}

function zoomIndex(view) {
    return view.zoom ?? defaultZoom;
}

function updateViewZoom(view) {
    const { viewport, gridElement, grid } = view;
    const levels = view === views.terminal ? scales : mapScales;
    const index = zoomIndex(view);
    const fitted = Boolean(view.fit);
    viewport.classList.toggle("fit-map", fitted);
    zoomOut.disabled = fitted || (index === 0 && mode !== "locate");
    if (!fitted) {
        viewport.style.setProperty("--zoom", levels[index]);
        zoomIn.disabled = index === levels.length - 1;
        return;
    }
    const { clientWidth, clientHeight } = viewport;
    if (clientWidth <= 1 || clientHeight <= 1) return;
    const key = `${clientWidth}/${clientHeight}/${grid.columns}/${grid.rows}/${gridElement.id}/${view.rendered.graphicsMode}`;
    viewport.style.setProperty("--zoom", 1);
    if (key !== view.fitKey) {
        view.fitScale = Math.min((clientWidth - 1) / gridElement.offsetWidth,
            (clientHeight - 1) / gridElement.offsetHeight, 1);
        view.fitKey = key;
    }
    viewport.style.setProperty("--fit-scale", view.fitScale);
    zoomIn.disabled = false;
}

function recenterView() {
    centerPending = true;
    draw();
}

function changeZoom(step) {
    const fitted = activeView.fit;
    if (fitted && (step < 0 || activeView.fitScale === undefined)) return;
    const levels = activeView === views.terminal ? scales : mapScales;
    const index = fitted ? levels.findIndex((scale) => scale > activeView.fitScale) - 1 : zoomIndex(activeView);
    const next = Math.max(0, Math.min(levels.length - 1, index + step));
    if (mode === "locate" && !fitted && step < 0 && (index === 0 || levels[next] <= activeView.fitScale)) {
        activeView.fit = true;
        recenterView();
        return;
    }
    if (!fitted && next === index) return;
    activeView.fit = false;
    activeView.zoom = next;
    recenterView();
}

function renderMonsterHealth(health) {
    monsterHealth.hidden = hud.hidden || !health;
    if (monsterHealth.hidden) return;
    const { name, segments, color } = health;
    monsterHealth.classList.toggle("unknown", !name);
    monsterName.hidden = !name;
    monsterName.textContent = name || "";
    monsterHealth.setAttribute("aria-label", name ?
        `${name}: ${segments} of 10 health segments` : "Monster health");
    monsterHealth.style.setProperty("--monster-health-color", color ?? "");
    monsterSegments.forEach((segment, index) => segment.classList.toggle("filled", index < segments));
}

function renderResource(element, value, current, maximum) {
    value.textContent = `${current}/${maximum}`;
    const fill = maximum > 0 ? Math.max(0, Math.min(100, current * 100 / maximum)) : 0;
    element.style.setProperty("--fill", `${fill}%`);
}

function renderMapStatus(state, previousSpeed) {
    currentPlace.textContent = state.place;
    const { feeling, light, terrain } = state.mapStatus;
    levelFeeling.hidden = !feeling;
    if (feeling) {
        feelingDanger.textContent = feeling.danger;
        feelingDanger.style.color = feeling.dangerColor;
        feelingTreasure.textContent = feeling.treasure;
        feelingTreasure.style.color = feeling.treasureColor;
        const danger = feeling.danger === "?" ? "unknown" : feeling.danger;
        const treasure = feeling.treasure === "?" ? "unknown" : feeling.treasure;
        levelFeeling.setAttribute("aria-label", `Level feeling: danger ${danger}, treasure ${treasure}`);
    }
    gridLightValue.textContent = light;
    gridLightValue.classList.toggle("dark", light <= 0);
    gridTerrain.textContent = terrain;
    mapIndicators.hidden = !state.mapStatus.indicators.length;
    mapIndicators.replaceChildren(...state.mapStatus.indicators.map(({ label, color, description }) => {
        const indicator = document.createElement("span");
        indicator.textContent = label;
        indicator.style.color = color;
        indicator.setAttribute("role", "img");
        indicator.setAttribute("aria-label", `${label}, ${description}`);
        return indicator;
    }));
    const normal = state.speed === "Normal";
    speed.textContent = state.speed;
    speed.classList.toggle("fast", state.speed.startsWith("Fast "));
    speed.classList.toggle("slow", state.speed.startsWith("Slow "));
    if (!mapStatus.hidden && previousSpeed !== undefined && previousSpeed !== state.speed) {
        mapStatus.classList.add("speed-changed");
        clearTimeout(speedHighlightTimer);
        speedHighlightTimer = setTimeout(() => {
            mapStatus.classList.remove("speed-changed");
            speed.hidden = world?.speed === "Normal";
        }, 1200);
    }
    speed.hidden = normal && !mapStatus.classList.contains("speed-changed");
}

function renderWorld(state, previousSpeed) {
    renderMapStatus(state, previousSpeed);
    renderResource(hp, hpValue, state.hp, state.maxHp);
    hp.classList.toggle("low", state.lowHp);
    renderResource(sp, spValue, state.sp, state.maxSp);
    sp.hidden = !state.magic;
    acValue.textContent = state.ac;
    renderMonsterHealth(state.monsterHealth);
    for (const [index, { label, value, reduced, lowered }] of state.stats.entries()) {
        let stat = hudStats.children[index];
        if (!stat) {
            stat = document.createElement("span");
            stat.append(document.createElement("small"), document.createElement("span"));
            hudStats.append(stat);
        }
        stat.firstElementChild.textContent = reduced ? `${label}↓` : label;
        const current = stat.lastElementChild;
        if (current.textContent !== value) current.textContent = value;
        stat.classList.toggle("reduced", reduced);
        stat.classList.toggle("lowered", !!lowered);
    }
    const food = [state.foodGrade, `${state.food}%`].filter(Boolean).join(" ");
    const conditions = state.conditions.filter(({ label }) => label !== state.foodGrade);
    nourishment.textContent = food;
    nourishment.classList.toggle("alert", state.conditions.some(({ label, priority }) =>
        label === state.foodGrade && priority > 0));
    const alerts = conditions.filter(({ priority }) => priority > 0)
        .sort((left, right) => right.priority - left.priority);
    const selected = (alerts.length ? alerts : conditions).slice(0, 2);
    const labels = conditions.filter((effect) => selected.includes(effect)).map(({ label }) => label);
    const hiddenCount = conditions.length - labels.length;
    activeConditions.textContent = labels.join(" · ");
    activeConditions.classList.toggle("alert", !!alerts.length);
    hiddenConditionCount.hidden = !hiddenCount;
    hiddenConditionCount.textContent = `+${hiddenCount}`;
    vitals.setAttribute("aria-label", ["Open Character", `HP ${hpValue.textContent}`,
        state.magic && `SP ${spValue.textContent}`,
        `Armor class ${state.ac}`,
        `Speed ${state.speed}`, state.place,
        ...state.stats.map(({ label, value, reduced }) => `${label} ${value}${reduced ? " (reduced)" : ""}`), food, ...labels,
        hiddenCount > 0 && `${hiddenCount} hidden ${hiddenCount === 1 ? "condition" : "conditions"}`]
        .filter(Boolean).join(", "));

    updateJournal();
}

function characterRows(rows) {
    const list = document.createElement("dl");
    list.className = "character-rows";
    for (const { label, value, temporary, sources } of rows) {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        if (temporary) {
            const effect = document.createElement("small");
            effect.textContent = `${temporary} (temporary)`;
            description.append(effect);
        }
        if (sources?.length) {
            const breakdown = document.createElement("ul");
            breakdown.className = "defense-sources";
            for (const { name, value: property } of sources) {
                const source = document.createElement("li");
                source.textContent = `${name} · ${property}`;
                breakdown.append(source);
            }
            description.append(breakdown);
        }
        row.append(term, description);
        list.append(row);
    }
    return list;
}

const resultNumber = new Intl.NumberFormat("en");
const resultDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const outcomeTitles = { dead: "Character died", retired: "Character retired", victory: "Victory summary" };

function renderOutcome({ kind, name, race, className, level, place, exp, gold, cause, timestamp }) {
    const identity = `${race} ${className} · Level ${level}`;
    if (mode === "victory") {
        victoryName.textContent = name;
        victoryClass.textContent = identity;
        return;
    }
    outcomeName.textContent = name;
    outcomeClass.textContent = identity;
    outcomeCause.textContent = kind === "victory" ? "Retired after defeating Morgoth." :
        kind === "retired" ? "Retired from adventuring." : `Killed by ${cause}.`;
    outcomeStats.replaceChildren(characterRows([
        { label: "Location", value: place },
        { label: "Experience", value: resultNumber.format(exp) },
        { label: "Gold", value: resultNumber.format(gold) },
    ]));
    const date = new Date(timestamp * 1000);
    outcomeDate.dateTime = date.toISOString();
    outcomeDate.textContent = resultDate.format(date);
}

function renderResultsList({ title, sections, description }) {
    const nodes = [];
    for (const { title: section, entries } of sections) {
        if (!section && !entries.length && sections.length > 1) continue;
        if (section) {
            const heading = document.createElement("h3");
            heading.textContent = section;
            nodes.push(heading);
        }
        if (!entries.length) {
            const empty = document.createElement("p");
            empty.className = "results-empty";
            empty.textContent = title === "Hall of Fame" ? "No scores recorded." :
                title === "Messages" ? "No messages." : title === "Player history" ?
                    "No history recorded." : title === "Examine items" ? "Nothing to examine." : "Empty";
            nodes.push(empty);
            continue;
        }
        const list = document.createElement("ul");
        for (const { text, detail, highlighted } of entries) {
            const item = document.createElement("li");
            item.textContent = text;
            if (highlighted) item.setAttribute("aria-current", "true");
            if (detail) {
                const caption = document.createElement("small");
                caption.textContent = highlighted ? `This run\n${detail}` : detail;
                item.append(caption);
            }
            list.append(item);
        }
        nodes.push(list);
    }
    if (description) {
        const body = document.createElement("div");
        body.className = "detail-text";
        renderDescription(body, description);
        nodes.push(body);
    }
    resultsList.replaceChildren(...nodes);
    resultsList.scrollTop = 0;
}

function clearResultFile() {
    if (resultURL) {
        const url = resultURL;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        resultURL = undefined;
    }
    downloadResult.removeAttribute("href");
    downloadResult.hidden = true;
}

function createDownloadURL(filename, data) {
    const type = /\.html?$/i.test(filename) ? "text/html" : "text/plain";
    return URL.createObjectURL(new Blob([data], { type: type + ";charset=utf-8" }));
}

function renderResultFile({ filename, data }) {
    clearResultFile();
    resultsFileStatus.textContent = data?.length ? filename : "Could not prepare the file.";
    if (!data?.length) return;
    resultURL = createDownloadURL(filename, data);
    downloadResult.href = resultURL;
    downloadResult.download = filename;
    downloadResult.hidden = false;
}

function downloadFile({ filename, data }) {
    const url = createDownloadURL(filename, data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, "_");
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function appendCharacterGroup(container, title, rows) {
    if (!rows.length) return;
    const heading = document.createElement("h3");
    heading.textContent = title;
    container.append(heading, characterRows(rows));
}

function renderConditions(container) {
    const state = world;
    const rows = [
        { label: "Nourishment", value: [state.foodGrade, `${state.food}%`].filter(Boolean).join(" · ") },
        { label: "Speed", value: state.speed },
        { label: "Light source", value: state.light },
    ];
    container.replaceChildren(characterRows(rows));
    if (state.mapStatus.indicators.length) {
        const indicators = state.mapStatus.indicators.map(({ label, description }) => ({ label, value: description }));
        container.append(characterRows(indicators));
    }
    const effects = state.conditions.filter(({ label }) => label !== state.foodGrade);
    if (!effects.length) return;
    const list = document.createElement("ul");
    list.className = "character-effects";
    list.setAttribute("aria-label", "Active effects");
    for (const { label, priority } of effects) {
        const item = document.createElement("li");
        item.textContent = label;
        item.classList.toggle("alert", priority > 0);
        list.append(item);
    }
    container.append(list);
}

function renderBirthAttributes(rows) {
    const table = document.createElement("table");
    table.className = "birth-attributes";
    const header = table.createTHead().insertRow();
    for (const [label, description] of [
        ["", "Stat"], ["Self", "Base stat"], ["RB", "Race bonus"],
        ["CB", "Class bonus"], ["EB", "Equipment bonus"], ["Best", "Best"],
    ]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        cell.setAttribute("aria-label", description);
        cell.title = description;
        header.append(cell);
    }
    const body = table.createTBody();
    const bonus = (value) => value < 0 ? String(value) : `+${value}`;
    for (const { label, breakdown } of rows) {
        const row = body.insertRow();
        const name = document.createElement("th");
        name.scope = "row";
        name.textContent = `${label}:`;
        row.append(name);
        const { base, raceBonus, classBonus, equipmentBonus, best } = breakdown;
        for (const value of [base, bonus(raceBonus), bonus(classBonus), bonus(equipmentBonus), best]) {
            row.insertCell().textContent = value;
        }
    }
    characterAttributes.replaceChildren(table);
}

function renderCharacter() {
    const sheet = context.character;
    const reviewing = mode === "birth-review";
    if (!sheet || (!reviewing && !world)) return;
    characterName.textContent = sheet.name;
    characterNameEdit.firstElementChild.textContent = sheet.name || "Change name";
    characterNameEdit.setAttribute("aria-label", sheet.name ? `Change name for ${sheet.name}` : "Change name");
    characterClass.textContent = `${sheet.race} ${sheet.className} · ${sheet.title} · Level ${sheet.level}`;

    const rowsFor = (section) => sheet.rows.filter((row) => row.section === section);
    const vitals = [
        { label: "HP", value: `${sheet.hp}/${sheet.maxHp}` },
        ...(reviewing || sheet.magic ? [{ label: "SP", value: `${sheet.sp}/${sheet.maxSp}` }] : []),
    ];
    if (reviewing) renderBirthAttributes(rowsFor(0));
    else characterAttributes.replaceChildren(characterRows(rowsFor(0)));

    const progress = new Map(rowsFor(2).map(({ label, value }) => [label, value]));
    const combat = rowsFor(3);
    const experience = progress.get("Cur Exp");
    const nextLevel = progress.get("Adv Exp");
    const hasNextLevel = /^\d+$/.test(nextLevel ?? "");
    const background = rowsFor(1);
    const turnCounters = ["Game", "Standard", "Resting"];
    characterSummary.replaceChildren(characterRows([
        ...vitals,
        ...combat.filter(({ label }) => label === "Armor"),
        { label: "Gold", value: progress.get("Gold") },
        ...(reviewing ? [] : [{
            label: hasNextLevel ? "Cur Exp / Adv Exp" : "Cur Exp",
            value: hasNextLevel ? `${experience} / ${nextLevel}` : experience,
        }]),
    ]));
    if (!reviewing) renderConditions(characterConditions);

    characterCombat.replaceChildren();
    const meleeHit = combat.findIndex(({ label }) => label === "To-hit");
    const attackRows = combat.map((row, index) => !reviewing && row.label === "To-hit" ?
        { ...row, label: index === meleeHit ? "Melee to-hit" : "Ranged to-hit" } : row);
    appendCharacterGroup(characterCombat, "Combat", attackRows.filter(({ label }) => label !== "Armor"));
    appendCharacterGroup(characterCombat, "Skills", rowsFor(4));

    characterDefenses.replaceChildren();
    for (const [group, title] of [["resistances", "Resistances"],
        ["abilities", "Abilities"], ["hindrances", "Hindrances"]]) {
        appendCharacterGroup(characterDefenses, title, sheet.defenses.filter((row) => row.group === group));
    }

    characterProgressLabel.textContent = reviewing ? "Background, progress & history" : "Progress & history";
    characterProgress.replaceChildren(characterRows([
        ...(reviewing ? [{ label: "Cur Exp", value: experience }] : []),
        { label: "Max Exp", value: progress.get("Max Exp") },
        ...(reviewing ? [{ label: "Adv Exp", value: nextLevel }] : []),
        { label: "Max Depth", value: progress.get("Max Depth") },
        { label: "Burden", value: progress.get("Burden") },
        ...(progress.has("Overweight") ? [{ label: "Overweight", value: progress.get("Overweight") }] : []),
    ]));
    appendCharacterGroup(characterProgress, "Turns used:",
        background.filter(({ label }) => turnCounters.includes(label)));
    appendCharacterGroup(characterProgress, "Recall points", rowsFor(5));
    appendCharacterGroup(characterProgress, "Background", background.filter(({ label }) => !turnCounters.includes(label)));
    if (sheet.history) {
        if (reviewing) {
            const heading = document.createElement("h3");
            heading.textContent = "History";
            characterProgress.append(heading);
        }
        const history = document.createElement("p");
        history.className = "character-history";
        history.textContent = sheet.history;
        characterProgress.append(history);
    }
}

function focusCharacter() {
    for (const detail of characterScreen.querySelectorAll(".character-detail")) {
        detail.open = mode === "birth-review" && detail.id !== "character-defenses-section";
    }
    characterScreen.scrollTop = 0;
    characterScreen.focus({ preventScroll: true });
}

function isTextEntry(state) {
    return state === "name" || state === "text";
}

function isShopStockChoice(state) {
    return Boolean(state?.choice && state.store && !state.store.home && !state.store.inspectOnly);
}

function isChoosing() {
    return openPanel ? openPanel !== "character" :
        (!!menu?.choice && !isShopStockChoice(menu)) || promptModes.has(mode) || inspectingChoice;
}

function isTargeting() {
    return mode === "aim" || mode === "target";
}

function isDirectionPrompt() {
    return mode === "direction" || mode === "run-direction";
}

function isOutcomeScreen() {
    return mode === "menu" && !!context.outcome;
}

function isResultsScreen() {
    return mode === "results-list" || mode === "results-file";
}

function closeInputPanel(closeKeyboard = true) {
    const selection = context.listSelection;
    if (selection?.reading) {
        selection.reading = false;
        updateDetailsScreen();
        selection.detailsButton.focus({ preventScroll: true });
        return true;
    }
    if (!mapLists.hidden) {
        setMapListsOpen(false);
        openMapLists.focus({ preventScroll: true });
        return true;
    }
    if (!mapCellActions.hidden) {
        dismissMapActions();
        return true;
    }
    if (["tiles", "touch-settings", "commands"].includes(openPanel) && panelTrigger === openMenu) {
        showPanel("menu", panelTrigger);
        return true;
    }
    if (openPanel) {
        const trigger = panelTrigger;
        showPanel();
        trigger?.focus({ preventScroll: true });
        return true;
    }
    if (!closeKeyboard || !keyboardOpen) return false;
    toggleKeyboard();
    return true;
}

function showPanel(panel, trigger) {
    pickerExpanded = false;
    openPanel = panel;
    panelTrigger = trigger;
    if (panel) {
        if (panel === "character") renderCharacter();
        else renderActionsPanel();
    }
    updateView();
    updateControls();
    if (panel === "character") focusCharacter();
    else if (panel) actionsScreen.querySelector("button:enabled")?.focus({ preventScroll: true });
}

function updateControls() {
    const disabled = request === undefined || saving || deletingSave || stopped || applyingUpdate;
    const choosing = isChoosing();
    const outcome = isOutcomeScreen();
    const resultChild = isResultsScreen() || menu?.title === "Create spoilers";
    const liveCharacter = mode === "character" && playingGame;
    const editableName = liveCharacter && context.nameMaxBytes !== undefined;
    const editingName = !characterNameEditor.hidden;
    const canOpenKeyboard = unavailableScreen.hidden && !isTextEntry(mode) && !modesWithoutKeyboard.has(mode) && !openPanel &&
        !menu?.birth && !menu?.noKeyboard && !outcome && !resultChild;
    const showKeyboard = keyboardOpen && canOpenKeyboard && !exploring;
    const stopVisible = running || !stopAction.hidden;
    const showTargetControls = mode === "target" && !showKeyboard && !openPanel && !stopVisible;

    characterName.hidden = editableName || !context.character?.name;
    characterNameEdit.hidden = !editableName || editingName;
    characterNameEdit.disabled = characterNameFields.disabled = disabled;
    characterDump.hidden = !liveCharacter;
    renderAppUpdate();
    updateMenuControls(disabled, choosing);
    const showPad = updateDirectionPad(disabled, choosing, stopVisible, showKeyboard);
    updateMapControls(disabled, showKeyboard, stopVisible);
    const editingHistory = updateBirthControls(disabled);
    updateTerminalControls({ disabled: disabled || editingHistory || editingName, outcome,
        resultChild, stopVisible, showPad, showTargetControls });
    updateTargetControls(disabled, showTargetControls, showKeyboard);
    updatePromptControls(disabled, stopVisible);
    updateKeyboardControls(disabled, canOpenKeyboard, showKeyboard, stopVisible);
    updatePickerOverflow();
}

function updateMenuControls(disabled, choosing) {
    pickerToggle.disabled = disabled || !choosing;
    monsterSort.disabled = disabled;
    monsterSort.setAttribute("aria-pressed", String(!!context.sortByExp));

    terminalKeys.classList.toggle("options-controls", Boolean(menu?.options));
    setActions(actionsScreen, !!openPanel && openPanel !== "character",
        disabled || (openPanel === "tiles" && actionsScreen.contains(loadingTiles ?? null)));
    setActions(menuActions, !!menu?.actions.length && !openPanel, disabled);
    activeList.rows.disabled = activeList.sections.disabled = disabled;
}

function updateDirectionPad(disabled, choosing, stopVisible, showKeyboard) {
    const command = mode === "command" && unavailableScreen.hidden;
    const selectable = isTargeting() || isDirectionPrompt();
    views.target.viewport.classList.toggle("selectable", selectable);
    const usingPad = !openPanel && (command || selectable || mode === "locate");
    const showPad = !choosing && !(command && showKeyboard) &&
        (usingPad || (playingGame && main.classList.contains("in-world")));
    setActions(directionPad, showPad, disabled || !usingPad || stopVisible);
    directionPad.classList.toggle("run-direction", mode === "run-direction");
    directionPad.classList.toggle("running-mode", command && runMode);
    directionPad.setAttribute("aria-label", mode === "locate" ? "Scroll map sectors" : command && runMode ? "Direction pad: Run" :
        mode === "aim" && context.selecting ? "Adjust target selection" : "Direction pad");
    const targets = mapDirectionAction?.targets;
    const here = (mode === "direction" && context.center) || targets?.some(({ direction }) => direction === 5);
    for (const button of directionButtons) {
        if (button !== directionCenter) button.disabled = !!targets &&
            !targets.some(({ direction }) => mapDirections[direction].key === button.dataset.key);
    }
    directionCenter.disabled = (!command || !!mapDirectionAction) && !here;
    centerDot.hidden = !!here;
    centerCaption.hidden = !here;
    directionCenter.setAttribute("aria-label", here ? "Choose your cell" : command ? "Stand still" : "Center");
    return showPad;
}

function updateMapControls(disabled, showKeyboard, stopVisible) {
    const command = mode === "command" && unavailableScreen.hidden;
    const mapCommandsAvailable = command && !openPanel && !stopVisible;
    const showPlayActions = mapCommandsAvailable && !showKeyboard;
    const inspectingCell = showPlayActions && !!context.mapCell?.actions;
    const focusStop = exploring && document.activeElement === exploreAction;
    vitals.disabled = disabled || !(command || context.character);
    stopAction.hidden = !stopVisible;
    setActions(playKeys, showPlayActions || stopVisible, disabled && !stopVisible);
    playKeys.classList.toggle("stopping", stopVisible);
    setActions(quickActionKeys, showPlayActions || exploring, disabled || exploring);
    movementMode.hidden = !(showPlayActions || runningFromPad || exploring);
    walkMode.disabled = runModeButton.disabled = exploring || (stopVisible ? stopAction.disabled : disabled);
    if (focusStop) stopAction.focus({ preventScroll: true });
    walkMode.setAttribute("aria-pressed", String(!runMode));
    runModeButton.setAttribute("aria-pressed", String(runMode));
    openMenu.disabled = disabled || !mapCommandsAvailable;
    openMapLists.disabled = openMenu.disabled || !context.worldView || !!mapDirectionAction;
    if (openMapLists.hidden || openMapLists.disabled) setMapListsOpen(false);
    mapLists.disabled = openMapLists.disabled;
    heroActions.disabled = !context.worldView;
    heroActions.setAttribute("aria-expanded", String(inspectingCell));
    repeatAction.disabled = !repeatName;
    setActions(mapCellActions, inspectingCell, disabled);
    mapCellActions.classList.toggle("choosing-direction", !!mapDirectionAction);
    mapActionButtons.hidden = !!mapDirectionAction || !mapActionButtons.childElementCount;
    mapActionDirection.hidden = !mapDirectionAction;
    mapActionDirection.textContent = mapDirectionAction ? `${mapDirectionAction.label} · Choose a direction.` : "";
}

function targetActionLabel() {
    if (mode === "target" && !context.attack) return "Select target";
    if (context.verb === "Use") return "Use Item On";
    if (context.verb === "Throw") return "Throw To";
    return `${context.verb} On`;
}

function getConfirmAction(closesScreen) {
    if (!unavailableScreen.hidden) return ["Escape", "Back"];
    if (context.browseKey) return [context.browseKey, "Browse"];
    if (context.resultsList?.action) return [context.resultsList.action.key, context.resultsList.action.label];
    switch (mode) {
        case "overview": return context.overview?.hasRegion ? ["Enter", "Regional map"] : ["Escape", "Back"];
        case "birth-review": return ["Enter", "Start game"];
        case "retire": return ["@", "Retire character and quit"];
        case "confirm": return ["y", "Yes"];
        case "history": return ["y", "Keep history"];
        case "birth-stats":
        case "birth-roll": return ["Enter", "Accept"];
        case "target": return ["t", targetActionLabel()];
        case "aim": return ["5", targetActionLabel()];
        case "quantity": {
            const trade = context.trade;
            if (!trade) return ["Enter", "Done"];
            const label = trade.amount && trade.price >= 0 ? `${trade.verb} · ${trade.price} au` : trade.verb;
            return ["Enter", label];
        }
        case "option-number":
        case "rest": return ["Enter", "Done"];
        case "save-slots": return ["Enter", "Continue"];
        case "menu": return ["Enter", menu?.birth ? "Continue" : "Select"];
        default: return closesScreen ? ["Escape", "Back"] : ["Enter", "Continue"];
    }
}

function getCancelLabel() {
    if (mode === "confirm") return context.castWarning ? "Cancel" : "No";
    if (openPanel) return "Back";
    if (isTargeting() || isDirectionPrompt() ||
        ["quantity", "option-number", "rest", "retire"].includes(mode)) return "Cancel";
    return mode === "command" ? "Esc" : "Back";
}

function updateTerminalControls({ disabled, outcome, resultChild, stopVisible, showPad, showTargetControls }) {
    const unavailable = !unavailableScreen.hidden;
    const saveSlots = mode === "save-slots";
    const showFooter = mode !== undefined && !isTextEntry(mode) && !stopVisible && !outcome &&
        (mode !== "command" || !!openPanel || unavailable);
    setActions(terminalKeys, showFooter, disabled);
    setActions(outcomeActions, outcome && !stopVisible, disabled);
    terminalKeys.classList.toggle("single-row-controls", (playingGame || saveSlots) && !showPad);
    terminalKeys.classList.toggle("results-controls", mode === "victory" || resultChild || mode === "retire");

    const aiming = mode === "aim";
    const closesScreen = ["details", "character", "overview", "locate", "help"].includes(mode) || unavailable;
    const selectedRow = menu?.rows.find((row) => row.index === menuCursor && row.enabled);
    const [key, label] = getConfirmAction(closesScreen);
    const directMenu = playingGame && mode === "menu" && !!menu;
    terminalKeys.classList.toggle("aim-controls", aiming);
    updateKeyButton(confirmKey, label, key);
    const noAimTarget = aiming && !context.current;
    confirmKey.hidden = !unavailable && (!!openPanel || !!menu?.options ||
        (resultChild && !context.resultsList?.action) || isDirectionPrompt() || mode === "key" || (menu?.choice && !menu.birth) || directMenu || showTargetControls ||
        noAimTarget || (saveSlots && !menu?.rows.length));
    confirmKey.disabled = !unavailable && (mode === "direction" || noAimTarget || context.trade?.amount === 0 ||
        (mode === "target" && !context.canSelect) || (!!menu && !selectedRow));

    updateKeyButton(cancelKey, getCancelLabel(), mode === "confirm" ? "n" : "Escape");
    cancelKey.hidden = (closesScreen && !context.browseKey && !context.overview?.hasRegion) || mode === "victory";
}

function updateBirthControls(disabled) {
    const rolling = mode === "birth-roll";
    const stats = mode === "birth-stats" || rolling;
    const history = mode === "history";
    const reviewing = mode === "birth-review";
    const editingHistory = stats && !birthHistoryEditor.hidden;
    terminalKeys.classList.toggle("birth-choice-controls", !!menu?.birth);
    terminalKeys.classList.toggle("birth-stat-controls", stats);
    terminalKeys.classList.toggle("birth-confirmation-controls", history || reviewing);
    editHistory.hidden = !history;
    birthStartOver.hidden = !reviewing;
    birthStatRows.disabled = resetStats.disabled = birthNameFields.disabled = disabled || editingHistory;
    setActions(birthRollActions, rolling, disabled || editingHistory);
    birthHistoryEdit.disabled = disabled || editingHistory;
    setActions(birthHistoryEditor, editingHistory, disabled);
    birthHistoryPreview.hidden = editingHistory;
    birthHistoryEdit.setAttribute("aria-expanded", String(editingHistory));
    previousRoll.disabled = !context.birthStats?.roll?.previous;
    return editingHistory;
}

function updateTargetControls(disabled, showTargetControls, showKeyboard) {
    const aiming = mode === "aim";
    const selecting = mode === "target";
    const attackTargeting = selecting && context.attack;
    setActions(targetActions, showTargetControls, disabled);
    if (selecting) {
        updateKeyButton(confirmTarget, targetActionLabel());
        confirmTarget.disabled = !context.canSelect;
    }
    nearest.hidden = !aiming || !!openPanel || showKeyboard;
    nearest.disabled = !context.nearest;
    if (aiming) nearest.setAttribute("aria-label",
        `${context.verb === "Use" ? "Use on" : context.verb + " at"} nearest target`);
    previousTarget.hidden = nextTarget.hidden = !selecting || context.freeAim || context.targetCount < 2;
    targetMode.hidden = attackTargeting;
    targetTypes.hidden = !attackTargeting;
    if (attackTargeting) {
        targetMonster.setAttribute("aria-pressed", String(!context.freeAim));
        targetLocation.setAttribute("aria-pressed", String(context.freeAim));
        targetMonster.disabled = !context.targetCount;
    } else {
        updateKeyButton(targetMode, context.freeAim ? "Interesting places" : "Free selection",
            context.freeAim ? "m" : "o");
        targetMode.disabled = selecting && context.freeAim && !context.targetCount;
    }
    targetInspect.hidden = !selecting || !showTargetControls;
    targetInspect.disabled = disabled || !context.canInspect;
}

function updatePromptControls(disabled, stopVisible) {
    nameFields.disabled = textFields.disabled = disabled;
    setActions(quantity, mode === "quantity" && (!context.trade || context.trade.maximum > 1), disabled);
    setActions(optionDigits, mode === "option-number", disabled);
    setActions(rest, mode === "rest" && !stopVisible, disabled);
}

function updateKeyboardControls(disabled, canOpenKeyboard, showKeyboard, stopVisible) {
    setActions(keyboard, showKeyboard && !stopVisible, disabled);
    setActions(keyboardUtilities, mode === "command" && showKeyboard && !stopVisible, disabled);
    keyboardToggle.hidden = !canOpenKeyboard ||
        (mode === "aim" && !showKeyboard && (context.worldView || views.target.crop));
    mapKeyboardToggle.disabled = disabled || mode !== "command" || !canOpenKeyboard || stopVisible;
    for (const toggle of [keyboardToggle, mapKeyboardToggle]) {
        toggle.setAttribute("aria-expanded", String(showKeyboard));
        toggle.setAttribute("aria-label", showKeyboard ? "Hide keyboard" : "Show keyboard");
    }
}

function renderAppUpdate() {
    updateApp.hidden = playingGame || mode !== "splash";
    updateApp.disabled = checkingUpdate || applyingUpdate || request === undefined ||
        saving || deletingSave || !messagePause.hidden;
    if (checkingUpdate) {
        updateApp.textContent = "Checking…";
    } else if (applyingUpdate) {
        updateApp.textContent = updateProgress ? `Downloading… ${updateProgress}%` : "Downloading…";
    } else {
        updateApp.textContent = availableUpdate ? `Update to ${availableUpdate.release}` : "Check for updates";
    }
}

updateApp.addEventListener("click", async () => {
    if (updateApp.hidden || updateApp.disabled) return;
    updateStatus.textContent = "";
    if (!availableUpdate) {
        checkingUpdate = true;
        renderAppUpdate();
        try {
            availableUpdate = await checkOfflineUpdate();
            if (!availableUpdate) updateStatus.textContent = "You’re up to date.";
        } catch {
            updateStatus.textContent = "Could not check for updates. Check your connection and try again.";
        } finally {
            checkingUpdate = false;
            renderAppUpdate();
        }
        return;
    }
    applyingUpdate = true;
    updateProgress = 0;
    updateControls();
    try {
        await applyOfflineUpdate(availableUpdate, (percent) => {
            updateProgress = percent;
            renderAppUpdate();
        });
        window.location.reload();
    } catch (error) {
        updateStatus.textContent = error.message;
        applyingUpdate = false;
        updateControls();
    }
});

function showDeleteSaveStatus(message, failed = false) {
    deleteSaveStatus.textContent = message;
    deleteSaveStatus.classList.toggle("error", failed);
    deleteSaveStatus.hidden = false;
}

function openDeleteSave(button, code) {
    if (mode !== "save-slots" || request === undefined || deleteSaveDialog.open) return;
    const row = menu?.rows.find((row) => row.index === code && row.enabled);
    if (!row) return;
    deleteTarget = { request, code };
    deleteSaveLabel.textContent = saveSlotLabel(row);
    button.focus({ preventScroll: true });
    deleteSaveDialog.showModal();
}

deleteSaveDialog.addEventListener("submit", (event) => {
    if (event.submitter !== confirmDeleteSave) return;
    event.preventDefault();
    const target = deleteTarget;
    deleteSaveDialog.close();
    if (!target || mode !== "save-slots" || target.request !== request ||
        !sendInput({ type: "delete-save", code: target.code })) return;
    deletingSave = true;
    deleteSaveStatus.hidden = true;
    updateControls();
});

deleteSaveDialog.addEventListener("close", () => {
    if (!deleteSaveDialog.open) deleteTarget = undefined;
});

function setActions(group, visible, disabled) {
    group.hidden = !visible;
    group.disabled = disabled || !visible;
}

function terminalLine(row, end) {
    const frame = views.terminal.frame;
    return frame ? String.fromCodePoint(...frame.codepoints.subarray(
        row * frame.width, row * frame.width + (end ?? frame.width))).trim() : "";
}

function showMessagePause(data) {
    discoveryArrow.hidden = true;
    if (messagePause.hidden) messagePauseTrigger = document.activeElement;
    if (messageDialog.open) messageDialog.close();
    mainView.inert = false;
    if (menu?.store && data.menu?.id === menu.id) {
        const store = data.menu.store;
        if (!store.home) activeList.summary.textContent = `Gold Remaining: ${store.gold} au`;
    }
    if (data.context.pausedMessages?.length) {
        pausedMessage.replaceChildren(...data.context.pausedMessages.map(journalEntry));
    } else {
        pausedMessage.textContent = terminalLine(0).replace(/\s*-more-\s*$/, "");
    }
    if (data.world) renderMonsterHealth(data.world.monsterHealth);
    messagePause.hidden = false;
    pausedMessage.scrollTop = 0;
    for (const element of pausedControls) element.inert = true;
    continueMessage.disabled = false;
    continueMessage.focus({ preventScroll: true });
}

function closeMessagePause() {
    if (messagePause.hidden) return;
    messagePause.hidden = true;
    for (const element of pausedControls) element.inert = false;
    const trigger = messagePauseTrigger;
    messagePauseTrigger = undefined;
    return trigger;
}

function acknowledgeMessage(code) {
    if (request === undefined || continueMessage.disabled) return;
    worker.postMessage({ type: "key", code, request });
    request = undefined;
    continueMessage.disabled = true;
}

continueMessage.addEventListener("click", () => acknowledgeMessage(keyCode("Enter")));

function updatePrompt() {
    if (!messagePause.hidden) return;
    let text = context.mapCell?.description || context.prompt || (menu?.options ? undefined : menu?.prompt);
    if (mapDirectionAction) text = `${mapDirectionAction.label} · Choose a direction.`;
    if (mode === "aim") {
        if (request === undefined) text = "";
        else {
            const prepared = context.prepared;
            const action = prepared ? `${prepared.name}${prepared.mana >= 0 ? ` · Mana ${prepared.mana}` : ""}` : context.verb;
            const target = context.current ?
                `${context.selecting ? "Select target: " : ""}${context.targetDescription}` :
                preferences.fastAim ? "Choose a direction or tap a monster." : "Choose a direction or select a target.";
            text = `${action}\n${target}`;
        }
    }
    if (mode === "direction" || mode === "run-direction") text = "Choose a direction.";
    if (running || (mode === "run-direction" && request === undefined)) text = "";
    if (mode === "save-slots") text = menu?.rows.length ? "Choose a save or start a new game." : "";
    if (mode === "target") {
        text = terminalLine(0);
        if (!context.attack) {
            const label = context.freeAim ? "Free selection" : "Interesting places";
            text = text ? `${label}\n${text}` : label;
        }
    }
    if (mode === "details" || isTextEntry(mode) || openPanel || isChoosing()) text = "";
    if (mode === "rest" && !stopAction.hidden) pickerHeading.textContent = "Resting…";
    inputPrompt.hidden = !hud.hidden || !text;
    if (inputPrompt.textContent !== (text || "")) inputPrompt.textContent = text || "";
    const saveNotice = !saveStatus.hidden && !saveStatus.classList.contains("error");
    const showResult = context.actionMessages?.length && !openPanel &&
        (context.newMessages || (!activeList.screen.hidden && (menu?.store || menu?.pickup)));
    const showJournal = !hud.hidden || showResult || mainView.classList.contains("shop-view");
    const hasMessages = updateJournal();
    journal.hidden = !!context.list || !showJournal || saveNotice ||
        (menu?.title === "Screen dump" && !hasMessages);
    if (journal.hidden && messageDialog.open && messageRecallInput === undefined) messageDialog.close();
}

function formatMessage({ text, count }) {
    return count > 1 ? `${text} (×${count})` : text;
}

function journalEntry({ text, count, color }) {
    const row = document.createElement("span");
    row.className = "journal-entry";
    const label = document.createElement("span");
    label.className = "journal-text";
    label.textContent = text;
    if (color) label.style.color = color;
    row.append(label);
    if (count > 1) {
        const repeat = document.createElement("span");
        repeat.className = "journal-repeat";
        repeat.textContent = `×${count}`;
        row.append(repeat);
    }
    return row;
}

function showEarlierMessages(count) {
    earlierMessages.hidden = !count;
    earlierMessages.textContent = count ? `↑ ${count}` : "";
    earlierMessages.setAttribute("aria-label", count ? `${count} earlier ${count === 1 ? "message" : "messages"}` : "");
}

function renderJournal() {
    if (journalPrompt || !journalEntries?.length) {
        showEarlierMessages(0);
        if (latestMessage.childElementCount || latestMessage.textContent !== journalPrompt) {
            latestMessage.textContent = journalPrompt;
        }
        return;
    }
    const lines = Number(getComputedStyle(journal).getPropertyValue("--journal-lines"));
    let first = Math.max(0, journalEntries.length - lines);
    latestMessage.replaceChildren(...journalEntries.slice(first).map(journalEntry));
    showEarlierMessages(first);
    while (latestMessage.childElementCount > 1 && latestMessage.scrollHeight > latestMessage.clientHeight) {
        latestMessage.firstElementChild.remove();
        showEarlierMessages(++first);
    }
}

function updateJournal() {
    const prompt = exploreResting ? "Resting…" : hud.hidden ? "" : inputPrompt.textContent;
    const entries = !prompt && context.actionMessages?.length ? context.actionMessages : undefined;
    if (prompt !== journalPrompt || entries !== journalEntries) {
        journalPrompt = prompt;
        journalEntries = entries;
        journal.classList.toggle("prompt", !!prompt);
        renderJournal();
    }
    return !!prompt || !!entries?.length;
}

new ResizeObserver(renderJournal).observe(journal);

function updateView(state = world, region = views.target.crop) {
    const previous = activeView;
    const previousSpeed = world?.speed;
    world = state;
    if (!world?.mapStatus?.discoveries?.cells.size) exploreCamera.reset();
    const choosing = isChoosing();
    activeList = choosing ? pickerList : pageList;
    main.classList.toggle("choosing", choosing);
    main.classList.toggle("picker-expanded", choosing && pickerExpanded);
    mainView.inert = hud.inert = choosing;
    const statMethod = !!menu?.birth && menu.choice;
    mainView.hidden = statMethod;
    statMethodCharacter.hidden = !statMethod;
    birthPreview.hidden = !menu?.birth || statMethod;
    if (menu?.birth) renderBirthCard(menu.birth, statMethod);
    picker.hidden = !choosing;
    knowledgeSearchToggle.hidden = choosing || !!openPanel || menu?.title !== "Knowledge";
    knowledgeSearch.hidden = knowledgeSearchToggle.hidden || !menu?.search;
    knowledgeSearchToggle.setAttribute("aria-expanded", String(!knowledgeSearch.hidden));
    knowledgeSearchToggle.setAttribute("aria-label", knowledgeSearch.hidden ? "Search Knowledge" : "Close search");
    if (choosing) {
        unavailableScreen.hidden = true;
        controls.setAttribute("role", statMethod ? "region" : "dialog");
        if (statMethod) controls.removeAttribute("aria-modal");
        else controls.setAttribute("aria-modal", "true");
        controls.setAttribute("aria-labelledby", "picker-heading");
        renderPicker();
        updatePrompt();
        if (world) renderWorld(world, previousSpeed);
        draw();
        return;
    }
    pickerList.state = undefined;
    controls.removeAttribute("role");
    controls.removeAttribute("aria-modal");
    controls.removeAttribute("aria-labelledby");
    views.target.crop = region;
    activeView = context.list || (world && context.worldView) ? views.map :
        (isTargeting() || isDirectionPrompt() || mode === "locate") && region ? views.target : views.terminal;
    views.target.viewport.setAttribute("aria-label", mode === "locate" ? "Map sector" : "Targeting map");

    const { fullScreen, inGamePanel, intro, character, outcome } = updateScreenContents();
    const showViewport = !fullScreen && !openPanel && !menu;
    const overview = mode === "overview" && context.overview && context.overviewFrame;
    unavailableScreen.hidden = mode === undefined || !showViewport || activeView !== views.terminal || overview;
    for (const view of Object.values(views))
        view.viewport.hidden = view !== activeView || !showViewport || (view === views.terminal && !overview);

    if (previous !== activeView && activeView === views.terminal) {
        activeView.viewport.scrollTo(0, 0);
    }
    const showWorld = mode !== "locate" && !context.list && activeView !== views.terminal && !activeView.viewport.hidden;
    main.classList.toggle("in-play", playingGame);
    main.classList.toggle("in-world", showWorld);
    main.classList.toggle("in-game-panel", inGamePanel);
    main.classList.toggle("intro", intro);
    mainView.classList.toggle("shop-view", !!menu?.store && !menu.store.home && !menu.store.inspectOnly);
    hud.hidden = !showWorld || !world;
    mapStatus.hidden = hud.hidden;
    if (hud.hidden) monsterHealth.hidden = true;
    viewTitle.textContent = getViewTitle({ character, outcome });
    zoom.hidden = activeView.viewport.hidden;
    for (const control of [openMenu, openMapLists, mapKeyboardToggle]) {
        control.hidden = zoom.hidden || !!context.list || mode === "locate";
    }
    if (previous !== activeView) {
        if (activeView === views.target) {
            activeView.zoom = views.map.zoom;
        }
        centerPending = true;
    }
    renderMenu(menu);
    if (openPanel) pageList.screen.hidden = true;
    updatePrompt();
    draw();
    if (world) renderWorld(world, previousSpeed);
}

function updateScreenContents() {
    const splash = mode === "splash";
    const birthStats = !!context.birthStats;
    const reviewing = mode === "birth-review";
    const character = (mode === "character" || reviewing || openPanel === "character") && !!context.character;
    const victory = mode === "victory";
    const outcome = isOutcomeScreen();
    const results = isResultsScreen();
    const intro = splash && !openPanel;

    splashScreen.hidden = !intro;
    if (splash) angbandVersion.textContent = context.version;
    characterScreen.hidden = !character;
    characterScreen.classList.toggle("birth-review", reviewing);
    victoryScreen.hidden = !victory;
    outcomeSummary.hidden = !outcome;
    resultsList.hidden = mode !== "results-list";
    resultsFile.hidden = mode !== "results-file";

    updateDetailsScreen();
    helpScreen.hidden = mode !== "help";
    regionalMap.hidden = mode !== "overview" || !context.overview?.places;
    if (!regionalMap.hidden && regionPlaces.rendered !== context.overview) {
        renderRegionalMap(context.overview);
        regionPlaces.rendered = context.overview;
    }
    const textEntry = isTextEntry(mode);
    const writingText = mode === "text";
    if (mode !== "character") characterNameEditor.hidden = true;
    main.classList.toggle("text-entry", writingText);
    main.classList.toggle("inscribing", writingText && !!context.inscription);
    birthStatsScreen.hidden = !birthStats || !!openPanel;
    nameScreen.hidden = mode !== "name";
    textScreen.hidden = !writingText;

    const fullScreen = textEntry || !detailsScreen.hidden || character || splash ||
        birthStats || victory || results || !helpScreen.hidden || !regionalMap.hidden;
    const inGamePanel = !!openPanel || character || mode === "history" || !!menu?.options ||
        mode === "option-number" || outcome || victory || results || !!menu?.title || mode === "retire";
    return { fullScreen, inGamePanel, intro, character, outcome };
}

function renderRegionalMap({ places, exits }) {
    const directions = { 1: ["ArrowUp", "North"], 3: ["ArrowLeft", "West"],
        5: ["ArrowRight", "East"], 7: ["ArrowDown", "South"] };
    regionPlayer.hidden = !world?.place || places.some((place) => place.playerHere);
    regionPlayer.textContent = regionPlayer.hidden ? "" : `Your location · ${world.place}`;
    regionPlaces.replaceChildren(...places.map(({ index, name, level, down, playerHere, east, south }) => {
        const [key, direction] = directions[index] ?? [];
        const destination = exits.includes(key);
        const label = level ? `Level ${level}` : "Town";
        const node = destination ? makeKey(key, name, [direction, name, label, down, playerHere && "You are here"]
            .filter(Boolean).join(", ")) : document.createElement("div");
        node.textContent = name;
        node.style.gridArea = `${1 + Math.floor(index / 3)} / ${1 + index % 3}`;
        node.classList.toggle("east-link", east);
        node.classList.toggle("south-link", south);
        if (index === 4) node.classList.add("region-center");
        if (playerHere) node.setAttribute("aria-current", "location");
        for (const text of [label, down && `↳ ${down}`, playerHere && "You are here"]) {
            if (!text) continue;
            const detail = document.createElement("small");
            detail.textContent = text;
            node.append(detail);
        }
        return node;
    }));
}

function renderHelpFile(page) {
    const source = context.help?.[page];
    const commands = page === "commands";
    const content = document.createDocumentFragment();
    for (const paragraph of (source?.trim() || "Help unavailable.").split(/\n\s*\n/)) {
        const lines = paragraph.split(/\r?\n/).map(line => line.trim());
        if (lines.length === 2 && /^(=+|-+)$/.test(lines[1])) {
            const heading = document.createElement(lines[1][0] === "=" ? "h3" : "h4");
            heading.textContent = lines[0];
            content.append(heading);
            if (commands && heading.tagName === "H3") {
                const hint = document.createElement("p");
                hint.textContent = "On the map, tap the HP panel to open Character.";
                content.append(hint);
            }
            continue;
        }
        const definitions = lines.map(line => line.match(/^(\S{1,3}) {2,}(.+?)(?: {2,}(\S{1,3}) {2,}(.+))?$/));
        if (definitions.every(Boolean)) {
            const list = document.createElement("dl");
            for (const [, first, firstText, second, secondText] of definitions) {
                for (const [key, description] of [[first, firstText], [second, secondText]]) {
                    if (!key || description === "-" || (commands && key === "C")) continue;
                    const row = document.createElement("div");
                    const term = document.createElement("dt");
                    const definition = document.createElement("dd");
                    term.textContent = key;
                    definition.textContent = description;
                    row.append(term, definition);
                    list.append(row);
                }
            }
            content.append(list);
        } else {
            const text = document.createElement("p");
            text.textContent = lines.join(" ");
            content.append(text);
        }
    }
    helpContent.replaceChildren(content);
}

function showHelpPage(page) {
    const previous = helpPage;
    helpPage = page;
    helpIndex.hidden = !!page;
    helpContent.hidden = !page;
    if (page) renderHelpFile(page);
    else helpContent.replaceChildren();
    helpScreen.scrollTop = 0;
    const previousButton = !page && helpButtons.find(button => button.dataset.helpPage === previous);
    (previousButton || helpScreen).focus({ preventScroll: true });
}

function backFromHelp() {
    if (helpPage) showHelpPage();
    else sendInput({ type: "key", code: keyCode("Escape") });
}

for (const button of helpButtons)
    button.addEventListener("click", () => showHelpPage(button.dataset.helpPage));

function selectListEntry(selection) {
    context.listSelection?.mapButton?.removeAttribute("aria-current");
    context.listSelection = selection;
    selection.mapButton?.setAttribute("aria-current", "true");
    centerPending = true;
    draw();
}

function openListDetails(selection) {
    selectListEntry(selection);
    selection.reading = true;
    if (selection.detail === undefined)
        worker.postMessage({ type: "list-details", row: selection.index, request });
    updateDetailsScreen();
    listDetailsScreen.scrollTop = 0;
    listDetailsScreen.focus({ preventScroll: true });
}

function updateDetailsScreen() {
    const { detail, list, listSelection, prompt, sortByExp } = context;
    const reading = !!listSelection?.reading;
    detailsScreen.hidden = !!list || detail === undefined;
    if (!detailsScreen.hidden) renderDescription(detailsScreen, detail);
    listDetailsScreen.hidden = !reading;
    visibleListScreen.hidden = !list || reading;
    monsterSort.hidden = visibleListScreen.hidden || sortByExp === undefined;
    inspectionPanel.hidden = visibleListScreen.hidden && listDetailsScreen.hidden;
    if (!inspectionPanel.hidden) inspectionTitle.textContent = reading ? listSelection.title : prompt;
    if (reading) renderDescription(listDetailsScreen, listSelection.detail ?? "Loading…");
    if (visibleListScreen.hidden || renderedList === list) return;
    renderedList = list;
    const tiles = graphicsModes.get(context.graphicsMode);
    const colors = textColors(context.palette);
    visibleListScreen.replaceChildren(...list.map(({ text, location, symbol, symbolAttr, color, cell }, index) => {
        if (location === undefined) {
            const heading = document.createElement("p");
            heading.className = "visible-list-heading";
            heading.textContent = text;
            if (color) heading.style.color = color;
            return heading;
        }
        const row = document.createElement("div");
        row.className = "visible-list-row";
        const entry = document.createElement(cell ? "button" : "div");
        entry.className = "visible-list-entry";
        const title = cell ? `${text} · ${location}` : text;
        const detailsButton = document.createElement("button");
        detailsButton.type = "button";
        detailsButton.className = "visible-list-details";
        detailsButton.textContent = "Details";
        detailsButton.setAttribute("aria-label", `Details: ${title}`);
        const selection = { cell, title, index, mapButton: cell ? entry : undefined, detailsButton };
        if (cell) {
            entry.type = "button";
            entry.setAttribute("aria-label", `Show on map: ${title}`);
            entry.addEventListener("click", () => {
                if (request !== undefined && context.list === list) selectListEntry(selection);
            });
        }
        detailsButton.addEventListener("click", () => {
            if (request !== undefined && context.list === list) openListDetails(selection);
        });
        const glyph = document.createElement("span");
        glyph.className = "visible-list-symbol";
        glyph.setAttribute("aria-hidden", "true");
        const tile = tiles?.atlas && tileAt(tiles, symbolAttr, symbol);
        if (tile) {
            styleTerminalTile(glyph, tiles, tile);
        } else {
            glyph.textContent = String.fromCodePoint(symbol);
            glyph.style.color = colors[symbolAttr % colors.length];
        }
        const name = document.createElement("span");
        name.className = "visible-list-name";
        name.textContent = text;
        if (color) name.style.color = color;
        const distance = document.createElement("span");
        distance.className = "visible-list-location";
        distance.textContent = location;
        entry.append(glyph, name, distance);
        row.append(entry, detailsButton);
        return row;
    }));
    visibleListScreen.scrollTop = 0;
}

function renderPicker() {
    const trade = context.trade;
    const tradeTitle = trade && `${trade.verb} ${trade.item}?${trade.usable ? "" : " (Can't use!)"}`;
    const title = panelTitles[openPanel] || tradeTitle || menu?.birth?.title || menu?.selectionTitle || menu?.title || menu?.prompt ||
        context.prompt?.trim() || (mode === "quantity" ? terminalLine(0) : "") ||
        (menu ? "Choices" : screenTitles.get(mode));
    const resizable = !!menu || !!openPanel || inspectingChoice;
    picker.classList.toggle("resizable", resizable);
    if (menu?.card) pickerHeading.setAttribute("aria-describedby", "knowledge-card-text");
    else if (menu?.birth) pickerHeading.setAttribute("aria-describedby", "birth-choice");
    else pickerHeading.removeAttribute("aria-describedby");
    pickerHeading.textContent = context.castWarning ? `${context.castWarning}\n${title}` : title;
    pickerToggle.setAttribute("aria-controls", openPanel ? "actions-screen" :
        inspectingChoice ? "picker-description" : "picker-list");
    if (resizable) {
        pickerToggle.setAttribute("aria-expanded", String(pickerExpanded));
        const action = pickerExpanded ? "Fit to contents" : "Expand to full screen";
        pickerToggle.setAttribute("aria-label", `${title} ${action}`);
    }
    const methodDetail = menu?.birth && menu.rows.find(row => row.index === menu.cursor)?.detail;
    renderMenu(openPanel ? undefined : menu, inspectingChoice ? context.detail : methodDetail);
    tradeDetails.hidden = !trade?.description?.codepoints.length;
    renderDescription(tradeDetails.lastElementChild, trade?.description ?? "");
    tradeQuantityLabel.hidden = !trade || trade.maximum <= 1;
    tradeQuantityLabel.textContent = tradeQuantityLabel.hidden ? "" : context.prompt;
    tradeSummary.hidden = !trade || (trade.amount > 0 && trade.price < 0);
    if (!tradeSummary.hidden) {
        if (trade.shortfall) tradeSummary.textContent = `Need ${trade.shortfall} more au.`;
        else if (!trade.maximum) tradeSummary.textContent = "You cannot carry that many items.";
        else if (!trade.amount) tradeSummary.textContent = `Enter a quantity from 1 to ${trade.maximum}.`;
        else {
            const balanceLabel = trade.verb === "Buy" ? "Gold Remaining after purchase" :
                trade.verb === "Sell" ? "Gold Remaining after sale" : "Gold Remaining";
            const balance = trade.gold + (trade.verb === "Buy" ? -trade.price : trade.price);
            tradeSummary.textContent = `${balanceLabel}: ${balance} au`;
        }
    }
    editValue.hidden = (trade && trade.maximum <= 1) || context.value === undefined;
    if (context.value !== undefined) {
        const value = mode === "rest" ? restLabels.get(context.value.trim()) ?? context.value :
            mode === "quantity" && context.value === "*" ? "All" : context.value;
        const chars = [...value];
        const caret = document.createElement("span");
        caret.className = context.initial && chars.length ? "selection" : "caret";
        caret.setAttribute("aria-hidden", "true");
        if (value !== context.value) {
            editValue.textContent = value;
        } else if (context.initial && chars.length) {
            caret.textContent = value;
            caret.removeAttribute("aria-hidden");
            editValue.replaceChildren(caret);
        } else {
            editValue.replaceChildren(chars.slice(0, context.cursor).join(""), caret,
                chars.slice(context.cursor).join(""));
        }
    }
}

function getViewTitle({ character, outcome }) {
    if (!unavailableScreen.hidden) return "Command unavailable";
    const panelTitle = panelTitles[openPanel];
    if (panelTitle !== undefined) return panelTitle;
    if (mode === "save-slots") return "Save slots";

    const activeSection = menu?.sections?.find((section) => section.active);
    const menuTitle = menu?.birth?.title ?? menu?.options ?? menu?.selectionTitle ??
        menu?.store?.name ?? menu?.title ?? activeSection?.label;
    if (menuTitle !== undefined && menuTitle !== null) return menuTitle;
    if (menu && !outcome) return "Choices";
    if (mode === "details" && context.prompt) return context.prompt;
    if (mode === "text" && context.inscription) {
        return context.inscription.scope === "item" ? "Inscribe" : "Auto-inscribe";
    }
    if (mode === "victory") return "Victory";
    if (outcome) return outcomeTitles[context.outcome.kind];

    const resultTitle = context.resultsList?.title ?? context.resultsFile?.title;
    if (resultTitle !== undefined && resultTitle !== null) return resultTitle;
    if (mode === "overview" && context.overview?.place) return "Regional map · " + context.overview.place;
    if (mode === "splash") return "FAangband";
    if (mode === "birth-review") return "Review character";
    if (character) return "Character";

    const title = screenTitles.get(mode);
    if (title !== undefined) return title;
    return activeView.title;
}

function stop(message, failed) {
    stopped = true;
    if (deleteSaveDialog.open) deleteSaveDialog.close();
    playingGame = inspectingChoice = false;
    request = mode = undefined;
    if (messageDialog.open) messageDialog.close();
    world = menu = undefined;
    context = {};
    mapDirectionAction = undefined;
    openPanel = panelTrigger = characterTrigger = undefined;
    clearPendingInput();
    closeMessagePause();
    clearResultFile();
    keyboardOpen = false;
    updateControls();
    updateView(undefined, undefined);
    status.textContent = message;
    launch.classList.toggle("error", failed);
    launch.hidden = false;
    retry.textContent = failed ? "Try again" : "Save slots";
    retry.hidden = false;
    worker.terminate();
}

function handleWorkerMessage({ data }) {
    switch (data.type) {
        case "explore-rest":
            if (exploring && pendingInput === data.request) {
                exploreResting = data.resting;
                updateJournal();
            }
            break;
        case "frame": {
            const view = views[data.surface];
            view.frame = data;
            if (view === activeView || view === views.terminal) draw();
            break;
        }
        case "waiting": {
            if (data.mode === "message-recall") {
                clearPendingInput();
                closeMessagePause();
                request = data.request;
                openMessageRecall(data.request);
                break;
            }
            if (data.mode === "more") {
                clearTimeout(stopTimer);
                request = data.request;
                launch.hidden = true;
                main.classList.remove("starting");
                showMessagePause(data);
                break;
            }
            const pauseTrigger = closeMessagePause();
            const restoreSaveFocus = deletingSave && data.mode === "save-slots";
            const restorePlayFocus = document.activeElement === stopAction ||
                ((running || mode === "run-direction") && document.activeElement === document.body);
            const playFocus = exploring ? exploreAction :
                runningFromPad ? (runMode ? runModeButton : walkMode) : heroActions;
            clearPendingInput();
            const wasChoosing = isChoosing();
            const returningToStock = data.menu?.store && !data.menu.choice &&
                (context.trade || isShopStockChoice(menu));
            if (data.context.trade) {
                data.context.trade.description ??= context.trade?.description;
            } else {
                tradeDetails.open = false;
            }
            inspectingChoice = data.mode === "details" && data.context.detail !== undefined && !data.context.list &&
                (wasChoosing || isShopStockChoice(menu) || !!menu?.store?.itemActions);
            const closingKnowledgeSearch = menu?.search && data.menu?.title === "Knowledge" && !data.menu.search;
            const changed = !!menu?.search !== !!data.menu?.search || data.mode !== mode || data.menu?.choice !== menu?.choice ||
                data.menu?.birth?.title !== menu?.birth?.title ||
                data.menu?.title !== menu?.title || !!data.context.outcome !== !!context.outcome;
            if (changed && menu?.birth && !menu.choice) {
                birthScroll.set(menu.id, {
                    cursor: menuCursor, race: menu.birth.race,
                    list: pageList.screen.scrollTop, details: birthPreview.scrollTop,
                });
            }
            if (data.mode === "save-slots") birthScroll.clear();
            const changedPicker = data.menu?.choice &&
                (data.menu.selectionTitle !== menu?.selectionTitle ||
                    data.menu.prompt !== menu?.prompt || data.context.prompt !== context.prompt);
            const finishingNameEdit = !characterNameEditor.hidden;
            characterNameEditor.hidden = true;
            if (mode === "results-file") clearResultFile();
            if (changed) {
                const stayingOnMap = activeView === views.map &&
                    (data.context.worldView || data.menu?.choice || promptModes.has(data.mode));
                if (!stayingOnMap) centerPending = true;
                if (mode === "save-slots") {
                    deleteSaveStatus.hidden = true;
                }
                keyboardOpen = data.mode === "key";
                openPanel = panelTrigger = undefined;
            }
            if (changed) {
                views.terminal.fit = data.mode === "overview";
                views.terminal.fitKey = undefined;
                views.target.fit = data.mode === "locate";
                views.target.fitKey = undefined;
            }
            mode = data.mode;
            if (changed && keyboardOpen) {
                keyboardLayer = 0;
                shifted = false;
                controlKey = false;
                renderKeyboard();
            }
            playingGame = data.playing;
            request = data.request;
            context = data.context;
            if (mode === "overview") context.overviewFrame = views.terminal.frame;
            if (mode === "save-slots" || data.menu?.birth?.title === "Choose race") {
                birthNameSource = undefined;
            }
            mapDirectionAction = undefined;
            if (mode === "name") {
                nameValue.value = context.value;
                nameValue.setCustomValidity("");
                namePrompt.textContent = context.prompt;
            } else if (mode === "text") {
                renderTextEntry();
            }
            if (context.mapCell?.actions) renderMapActions();
            if (closingKnowledgeSearch) {
                knowledgeSearch.value = "";
                knowledgeLimits.clear();
                knowledgeScroll = 0;
            }
            menu = data.menu;
            if (changed || changedPicker) pickerExpanded = false;
            deletingSave = false;
            launch.hidden = true;
            main.classList.remove("starting");
            updateView(mode === "command" ? data.world ?? null : data.world ?? world, data.region ?? null);
            if (context.birthStats) renderBirthStats(context.birthStats, changed);
            if (context.outcome) renderOutcome(context.outcome);
            if (context.resultsList) renderResultsList(context.resultsList);
            if (context.resultsFile) renderResultFile(context.resultsFile);
            if (mode === "command" && world) renderQuickActions(world);
            if (mode === "character" || mode === "birth-review") renderCharacter();
            if (changed && isTextEntry(mode)) {
                views.terminal.viewport.scrollTo(0, 0);
            }
            updateControls();
            if (restoreSaveFocus) focusSelectedSave();
            if (isTextEntry(mode) && matchMedia("(pointer: fine)").matches) {
                const field = mode === "name" ? nameValue : activeTextField();
                field.focus({ preventScroll: true });
                if (!context.multiline) field.select();
            }
            if (pauseTrigger && document.activeElement === document.body) {
                pauseTrigger.focus({ preventScroll: true });
            }
            if (returningToStock) {
                pageList.rows.querySelector('[aria-current="true"]')?.focus({ preventScroll: true });
            }
            if (changed && isChoosing() && !menu) {
                pickerHeading.focus({ preventScroll: true });
            }
            if (changed && mode === "victory") victoryScreen.focus({ preventScroll: true });
            if (changed && mode === "results-list") resultsList.focus({ preventScroll: true });
            if (changed && mode === "results-file") resultsFile.focus({ preventScroll: true });
            if (changed && mode === "help") showHelpPage();
            if (changed && menu?.birth && !menu.choice) {
                const saved = birthScroll.get(menu.id);
                const selected = pageList.rows.querySelector('[aria-current="true"]');
                selected?.focus({ preventScroll: true });
                if (saved && saved.cursor === menuCursor && saved.race === menu.birth.race) {
                    pageList.screen.scrollTop = saved.list;
                    birthPreview.scrollTop = saved.details;
                    lastMenuScrollSize = menuScrollSize(pageList.screen);
                } else {
                    birthPreview.scrollTop = 0;
                    selected?.scrollIntoView({ block: "nearest" });
                }
            } else if (menu?.search) {
                const selected = pageList.rows.querySelector('[aria-current="true"]');
                (menu.cursor < 0 ? knowledgeSearch : selected)?.focus({ preventScroll: true });
                pageList.scrollArea.scrollTop = knowledgeScroll;
            } else if (closingKnowledgeSearch) {
                knowledgeSearchToggle.focus({ preventScroll: true });
            } else if (changed && menu?.card) {
                pickerHeading.focus({ preventScroll: true });
            } else if ((changed || changedPicker) && mode === "menu" &&
                (context.outcome || menu?.title || menu?.choice || (wasChoosing && menu))) {
                const selected = activeList.rows.querySelector('[aria-current="true"]') ??
                    outcomeActions.querySelector('[aria-current="true"]:not([disabled])');
                (selected ?? activeList.rows).focus({ preventScroll: true });
                if (selected && activeList.rows.contains(selected) && menuCursor > 0) {
                    selected.scrollIntoView({ block: "nearest" });
                }
            }
            if (mode === "character" && finishingNameEdit) characterNameEdit.focus({ preventScroll: true });
            else if (changed && !isChoosing() && !characterScreen.hidden) focusCharacter();
            if (changed && !visibleListScreen.hidden) visibleListScreen.focus({ preventScroll: true });
            if (mode === "command" && characterTrigger) {
                characterTrigger.focus({ preventScroll: true });
                characterTrigger = undefined;
            }
            if (changed && (mode === "direction" || mode === "run-direction"))
                activeView.viewport.focus({ preventScroll: true });
            if (mode === "command" && restorePlayFocus) playFocus.focus({ preventScroll: true });
            else if (mode === "command" && wasChoosing) activeView.viewport.focus({ preventScroll: true });
            if (!mapCellActions.hidden) {
                mapActionButtons.scrollTop = 0;
                mapCellActions.querySelector("button:enabled")?.focus({ preventScroll: true });
            }
            if (mode === "command" && world && !graphicsRestored) {
                graphicsRestored = true;
                if (preferences.tiles !== views.map.frame?.graphicsMode) {
                    void loadTiles(preferences.tiles).then(() => {
                        if (mode === "command" && request !== undefined)
                            sendInput({ type: "set-tiles", code: preferences.tiles });
                    }).catch(console.error);
                }
            }
            break;
        }
        case "list-details": {
            const selection = context.listSelection;
            if (data.request === request && selection && data.row === selection.index) {
                selection.detail = data.detail ?? "Details unavailable.";
                if (selection.reading) updateDetailsScreen();
            }
            break;
        }
        case "file-download":
            downloadFile(data);
            break;
        case "saving":
            clearTimeout(saveNoticeTimer);
            clearPendingInput();
            saving = true;
            updateControls();
            if (!data.automatic) {
                saveStatus.textContent = data.outcome ? "Saving outcome…" : "Saving game…";
                saveStatus.classList.remove("error");
                saveStatus.hidden = false;
            } else if (!saveStatus.classList.contains("error")) {
                saveStatus.hidden = true;
            }
            updatePrompt();
            break;
        case "saved":
            clearTimeout(saveNoticeTimer);
            saving = false;
            if (data.ok && !data.outcome && data.slot &&
                (preferences.lastSave !== data.slot || preferencesWriteFailed)) {
                preferences.lastSave = data.slot;
                savePreferences();
            }
            if (data.outcome) outcomeSaveFailed = !data.ok;
            updateControls();
            if (data.ok) {
                saveStatus.textContent = data.outcome || data.automatic ? "" : "Game saved.";
            } else {
                saveStatus.textContent = data.outcome ?
                    "Outcome not saved. An earlier save may still be playable." : "Could not save the game.";
            }
            saveStatus.classList.toggle("error", !data.ok);
            saveStatus.hidden = !saveStatus.textContent;
            updatePrompt();
            if (data.ok && !data.outcome && !data.automatic) saveNoticeTimer = setTimeout(() => {
                saveStatus.hidden = true;
                updatePrompt();
            }, 2000);
            break;
        case "message-recall":
            if (!messageDialog.open || data.recall !== messageRecallRequest) break;
            recalledMessages = (data.entries ?? (world?.lastMessage ? [world.lastMessage] : []))
                .filter(({ text }) => text.trim() && !/^=+$/.test(text.trim()));
            messageSearchToggle.disabled = !recalledMessages.length;
            renderMessageRecall();
            break;
        case "restarting":
            clearPendingInput();
            runMode = false;
            graphicsRestored = false;
            closeMessagePause();
            playingGame = inspectingChoice = false;
            request = mode = world = menu = undefined;
            if (messageDialog.open) messageDialog.close();
            context = {};
            mapDirectionAction = undefined;
            openPanel = panelTrigger = characterTrigger = undefined;
            keyboardOpen = false;
            if (!outcomeSaveFailed) saveStatus.hidden = true;
            outcomeSaveFailed = false;
            clearResultFile();
            main.classList.add("starting");
            launch.hidden = false;
            status.textContent = "Starting FAangband…";
            updateView(null, null);
            updateControls();
            break;
        case "save-deleted":
            showDeleteSaveStatus(`Deleted ${data.slot}.`);
            break;
        case "save-delete-error":
            if (data.request !== undefined) {
                deletingSave = false;
                request = data.request;
                updateControls();
                if (mode === "save-slots") focusSelectedSave();
            }
            showDeleteSaveStatus(data.message, true);
            break;
        case "exit":
            stop(data.code === 0 ? "FAangband has closed." :
                data.message || `FAangband exited with code ${data.code}.`, data.code !== 0);
            break;
        case "error":
            stop(data.message, true);
            break;
    }
}

function keyCode(key) {
    return specialKeys.get(key) ?? ([...key].length === 1 ? key.codePointAt(0) : 0);
}

function clearPendingInput() {
    clearTimeout(stopTimer);
    pendingInput = undefined;
    running = false;
    runningFromPad = false;
    exploring = false;
    exploreResting = false;
    stopAction.hidden = true;
    stopAction.disabled = false;
}

function sendInput(input) {
    if (request === undefined || saving || deletingSave || stopped || applyingUpdate || !messagePause.hidden) return false;
    if (context.trade && input.type === "key") {
        if (input.code === keyCode("Enter") && !context.trade.amount) return false;
        if (context.trade.maximum <= 1 && ![keyCode("Enter"), keyCode("Escape")].includes(input.code)) return false;
    }
    if (context.birthStats) {
        if (input.type === "key" && input.code === keyCode("Enter")) {
            return submitName(birthNameValue, context.birthStats.nameMaxBytes);
        }
        if (input.type === "key" && input.code === keyCode("*")) input = { type: "random-name" };
        if (input.type === "random-name") randomBirthNamePending = true;
        if (input.type === "submit-name" || (input.type === "key" && input.code === keyCode("Escape"))) {
            birthNameValue.blur();
        }
    }
    setMapListsOpen(false);
    if (!saveStatus.classList.contains("error")) saveStatus.hidden = true;
    const movingToCell = input.type === "map-cell" && !input.openMenu && !context.mapCell?.actions &&
        input.x === context.mapCell?.x && input.y === context.mapCell?.y;
    runningFromPad = input.type === "run-direction";
    exploring = mode === "command" && input.type === "key" && input.code === keyCode("p") &&
        !!world?.quickActions?.canExplore;
    discoveryArrow.hidden = true;
    if (exploring) exploreCamera.reset();
    running = runningFromPad || exploring ||
        (movingToCell && world && Math.max(Math.abs(input.x - world.x), Math.abs(input.y - world.y)) > 1) ||
        (mode === "run-direction" && (input.type === "aim-cell" ||
            (input.type === "key" && input.code !== keyCode("Escape"))));
    if (context.mapCell) {
        context = { ...context, mapCell: undefined };
        mapDirectionAction = undefined;
        draw();
    }
    worker.postMessage({ ...input, request });
    if (input.type !== "set-tiles") context.actionMessages = undefined;
    if ((running || mode === "command" || !hud.hidden || mode === "rest" ||
        (mode === "menu" && !menu?.store && !menu?.birth && !context.outcome && !menu?.title)) &&
        ["key", "menu-row", "aim-cell", "target-cell", "map-cell", "map-action", "run-direction",
            "open-character"].includes(input.type)) {
        pendingInput = request;
        if (!running) {
            stopTimer = setTimeout(() => {
                stopAction.hidden = false;
                updateControls();
                updatePrompt();
            }, 150);
        }
    }
    request = undefined;
    if (mode === "text") textFields.disabled = true;
    renderAppUpdate();
    if (mode === "aim" || exploring) draw();
    if (running || !mapCellActions.hidden) updateControls();
    updatePrompt();
    return true;
}

nameValue.addEventListener("input", () => nameValue.setCustomValidity(""));
birthNameValue.addEventListener("input", () => birthNameValue.setCustomValidity(""));
birthNameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (context.birthStats) submitName(birthNameValue, context.birthStats.nameMaxBytes);
});
nameScreen.addEventListener("submit", (event) => {
    event.preventDefault();
    if (mode !== "name" || request === undefined) return;
    submitName(nameValue, context.nameMaxBytes);
});

function submitName(field, maxBytes) {
    const value = field.value;
    const error = /[\p{Cc}\p{Cs}]/u.test(value) ? "The name contains unsupported characters." :
        new TextEncoder().encode(value).length > maxBytes ? "The name is too long." : "";
    if (error) {
        field.setCustomValidity(error);
        field.reportValidity();
        return false;
    }
    return sendInput({ type: "submit-name", value });
}

function editCharacterName(open) {
    if (open) {
        if (characterNameEdit.hidden || characterNameEdit.disabled || !messagePause.hidden) return;
        characterNameValue.value = context.value;
        characterNameValue.setCustomValidity("");
    }
    characterNameEditor.hidden = !open;
    updateControls();
    (open ? characterNameValue : characterNameEdit).focus({ preventScroll: true });
}

characterNameEdit.addEventListener("click", () => editCharacterName(true));
characterNameValue.addEventListener("input", () => characterNameValue.setCustomValidity(""));
document.querySelector("#character-name-cancel").addEventListener("click", () => editCharacterName(false));
characterNameEditor.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!characterNameValue.value.trim()) {
        characterNameValue.setCustomValidity("Enter a character name.");
        characterNameValue.reportValidity();
        return;
    }
    if (submitName(characterNameValue, context.nameMaxBytes)) {
        characterNameValue.blur();
        updateControls();
    }
});

function activeTextField() {
    return context.multiline ? textHistoryValue : textValue;
}

const inscriptionEncoder = new TextEncoder();
let acceptedInscription;
let inscriptionSelection;
let composingInscription = false;

function rememberInscriptionSelection() {
    inscriptionSelection = [textValue.selectionStart, textValue.selectionEnd, textValue.selectionDirection];
}

function rejectsInscription(size) {
    return size > context.textMaxBytes && size >= inscriptionEncoder.encode(acceptedInscription).length;
}

function acceptInscriptionEdit() {
    const size = inscriptionEncoder.encode(textValue.value).length;
    if (rejectsInscription(size)) {
        textValue.value = acceptedInscription;
        textValue.setSelectionRange(...inscriptionSelection);
    } else {
        acceptedInscription = textValue.value;
        confirmText.disabled = size > context.textMaxBytes;
        rememberInscriptionSelection();
    }
}

function renderTextEntry() {
    const { multiline, promptCell, prompt, value, inscription } = context;
    const field = activeTextField();
    textIntro.hidden = !context.textTitle && !inscription;
    textTitle.textContent = context.textTitle ?? "";
    textTitle.hidden = !context.textTitle;
    textValue.hidden = multiline;
    textHistoryValue.hidden = !multiline;
    textPrompt.htmlFor = field.id;
    textPrompt.textContent = prompt?.trim() || (promptCell && terminalLine(promptCell.y, promptCell.x)) || "Text entry";
    field.value = value;
    field.setCustomValidity("");
    inscriptionHelp.hidden = !inscription;
    confirmText.disabled = false;
    composingInscription = false;
    if (inscription) {
        acceptedInscription = field.value;
        rememberInscriptionSelection();
        confirmText.disabled = inscriptionEncoder.encode(field.value).length > context.textMaxBytes;
        renderInscriptionHelp(inscriptionHelp, inscription, (key) => {
            const entry = extraCommands.find(([original]) => original === key);
            return entry ? commandKey(entry, inscription.roguelike) : key;
        });
        textIntro.scrollTop = 0;
    }
}

textValue.addEventListener("beforeinput", (event) => {
    if (!context.inscription || composingInscription) return;
    rememberInscriptionSelection();
    if (!event.cancelable || !["insertText", "insertFromPaste"].includes(event.inputType) || event.data == null) return;
    const [start, end] = inscriptionSelection;
    const value = textValue.value.slice(0, start) + event.data + textValue.value.slice(end);
    if (rejectsInscription(inscriptionEncoder.encode(value).length)) {
        event.preventDefault();
    }
});
textValue.addEventListener("compositionstart", () => {
    if (!context.inscription) return;
    rememberInscriptionSelection();
    composingInscription = true;
});
textValue.addEventListener("compositionend", () => {
    if (!composingInscription) return;
    composingInscription = false;
    acceptInscriptionEdit();
});
textValue.addEventListener("input", () => {
    textValue.setCustomValidity("");
    if (context.inscription && !composingInscription) acceptInscriptionEdit();
});
textHistoryValue.addEventListener("input", () => textHistoryValue.setCustomValidity(""));
textScreen.addEventListener("submit", (event) => {
    event.preventDefault();
    if (mode !== "text" || request === undefined) return;
    const field = activeTextField();
    const value = field.value;
    const unsupported = context.multiline ? /(?!\n)[\p{Cc}\p{Cs}]/u : /[\p{Cc}\p{Cs}]/u;
    const overLimit = new TextEncoder().encode(value).length > context.textMaxBytes;
    if (context.inscription && overLimit) return;
    const error = unsupported.test(value) ? "The text contains unsupported characters." :
        overLimit ? "The text is too long." : "";
    if (error) {
        field.setCustomValidity(error);
        field.reportValidity();
        return;
    }
    sendInput({ type: "submit-text", value });
});

function editBirthHistory(open) {
    if (open) {
        birthHistoryValue.value = context.birthStats.history;
        birthHistoryValue.setCustomValidity("");
    }
    birthHistoryEditor.hidden = !open;
    updateControls();
    if (open) {
        birthHistoryValue.focus({ preventScroll: true });
        birthHistoryEditor.scrollIntoView({ block: "nearest" });
    } else {
        birthHistoryEdit.focus();
    }
}

birthHistoryEdit.addEventListener("click", () => editBirthHistory(true));
birthHistoryValue.addEventListener("input", () => birthHistoryValue.setCustomValidity(""));
document.querySelector("#birth-history-cancel").addEventListener("click", () => editBirthHistory(false));
document.querySelector("#birth-history-done").addEventListener("click", () => {
    const { history, historyMaxBytes } = context.birthStats;
    const value = birthHistoryValue.value;
    if (value === history) {
        editBirthHistory(false);
        return;
    }
    const error = /(?!\n)[\p{Cc}\p{Cs}]/u.test(value) ? "The history contains unsupported characters." :
        new TextEncoder().encode(value).length > historyMaxBytes ? "The history is too long." : "";
    if (error) {
        birthHistoryValue.setCustomValidity(error);
        birthHistoryValue.reportValidity();
        return;
    }
    editBirthHistory(false);
    sendInput({ type: "submit-history", value });
});

const visualViewport = window.visualViewport;
if (visualViewport) {
    const rootStyle = document.documentElement.style;
    const updateVisibleViewport = () => {
        rootStyle.setProperty("--visible-viewport-height", `${visualViewport.height}px`);
        rootStyle.setProperty("--visible-viewport-top", `${visualViewport.offsetTop}px`);
    };
    visualViewport.addEventListener("resize", () => {
        updateVisibleViewport();
        if (document.activeElement === birthHistoryValue) {
            birthHistoryEditor.scrollIntoView({ block: "nearest" });
        }
    });
    visualViewport.addEventListener("scroll", updateVisibleViewport);
    updateVisibleViewport();
}

let buttonPress;
const inputButton = "button[data-key], button[data-input]";
main.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    const button = event.target.closest(inputButton);
    buttonPress = button ? { button, request } : undefined;
});

main.addEventListener("pointercancel", () => { buttonPress = undefined; });

main.addEventListener("click", (event) => {
    const button = event.target.closest(inputButton);
    if (!button || button.matches(":disabled, [aria-disabled=true]") || (event.detail !== 0 &&
        (buttonPress?.button !== button || buttonPress.request !== request))) return;

    if (mode === "help" && button === confirmKey) {
        backFromHelp();
        return;
    }
    if ((button === cancelKey || (button === confirmKey && context.listSelection?.reading)) &&
        closeInputPanel(false)) return;
    if (button === confirmKey && menu) {
        sendInput({ type: "menu-row", code: menuCursor });
        return;
    }
    const key = button.dataset.key;
    if (mapDirectionAction && directionPad.contains(button)) {
        chooseMapDirection(mapDirections.findIndex((direction) => direction?.key === key));
        return;
    }
    if (runMode && mode === "command" && button !== directionCenter && directionPad.contains(button)) {
        const direction = mapDirections.findIndex((entry) => entry?.key === key);
        sendInput({ type: "run-direction", code: direction });
        return;
    }
    const controlled = controlKey && keyboard.contains(button) && /^[a-z]$/i.test(key);
    const input = button.dataset.input ?
        { type: button.dataset.input, code: Number(button.dataset.value) } :
        { type: "key", code: controlled ? key.charCodeAt(0) & 31 : keyCode(key) };
    if (input.type === "delete-save") {
        openDeleteSave(button, input.code);
        return;
    }
    if (input.type === "set-tiles") {
        void chooseTiles(input, button);
        return;
    }
    if (input.type === "map-action") {
        const action = context.mapCell?.actions?.find(({ code }) => code === input.code);
        if (!action || request === undefined) return;
        if (action.targets?.length > 1) {
            mapDirectionAction = action;
            updateControls();
            recenterView();
            directionPad.querySelector("button:enabled")?.focus({ preventScroll: true });
        } else {
            sendMapAction(action, action.targets?.[0]);
        }
        return;
    }
    if (input.type === "menu-row" && menu?.birth) {
        if (input.code !== menuCursor) sendInput({ type: "menu-preview", code: input.code });
        return;
    }
    const selectingStock = menu?.store && !menu.store.inspectOnly && (!menu.choice || isShopStockChoice(menu));
    if (input.type === "menu-row" && selectingStock) {
        if (request === undefined) return;
        menuCursor = input.code;
        for (const row of activeList.rows.querySelectorAll('[data-input="menu-row"]')) {
            if (row === button) row.setAttribute("aria-current", "true");
            else row.removeAttribute("aria-current");
        }
    }
    if (menu?.search && input.type === "menu-row") knowledgeScroll = pageList.scrollArea.scrollTop;
    if (input.type === "store-action") input.row = menuCursor;
    if (!sendInput(input)) return;
    if (openPanel) showPanel();
    if (controlled || (keyboard.contains(button) && shifted && /^[A-Z]$/.test(key) && keyboardLayer === 0)) {
        controlKey = false;
        shifted = false;
        renderKeyboard();
    }
});

function makeButton(label, announcement = label) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-label", announcement);
    return button;
}

function makeKey(key, label = key, announcement = label) {
    const button = makeButton(label, announcement);
    button.dataset.key = key;
    return button;
}

function makeInput(type, code, label) {
    const button = makeButton(label);
    button.dataset.input = type;
    button.dataset.value = code;
    return button;
}

function renderMapActions() {
    const { actions, here } = context.mapCell;
    const buttons = [];
    const footer = [closeMapCellActions];
    for (const { code, label, key, targets } of [...actions].sort((a, b) => a.code - b.code)) {
        const direction = targets?.length === 1 ? mapDirections[targets[0].direction] : undefined;
        const button = makeInput("map-action", code, direction?.arrow ? `${label} ${direction.arrow}` : label);
        if (direction) button.setAttribute("aria-label", `${label}, ${direction.name}`);
        if (key) setKeyHint(button, keyFromCode(key));
        if (here && key === keyCode(restCommand[0])) footer.push(button);
        else buttons.push(button);
    }
    mapCellActions.setAttribute("aria-label", here ? "Actions" : "Cell actions");
    mapActionButtons.replaceChildren(...buttons);
    mapActionFooter.replaceChildren(...footer);
    if (here && actions.some((action) => action.targets)) centerPending = true;
}

function sendMapAction(action, target) {
    sendInput({ type: "map-action", code: action.code, x: target?.x, y: target?.y });
}

function chooseMapDirection(direction) {
    const target = mapDirectionAction.targets.find((cell) => cell.direction === direction);
    if (target) sendMapAction(mapDirectionAction, target);
}

function dismissMapActions() {
    const code = mapDirectionAction?.code;
    const returnFocus = mapDirectionAction ? mapActionButtons.querySelector(`[data-value="${code}"]`) :
        context.mapCell?.here ? heroActions : views.map.viewport;
    if (mapDirectionAction) mapDirectionAction = undefined;
    else context = { ...context, mapCell: undefined };
    updateControls();
    updatePrompt();
    draw();
    returnFocus?.focus({ preventScroll: true });
}

closeMapCellActions.addEventListener("click", dismissMapActions);

document.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || mapLists.hidden || mapLists.contains(event.target) ||
        openMapLists.contains(event.target)) return;
    setMapListsOpen(false);
    if (views.map.viewport.contains(event.target)) {
        openMapLists.focus({ preventScroll: true });
        event.preventDefault();
        event.stopPropagation();
    }
}, { capture: true });

main.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || mapCellActions.hidden || mapCellActions.contains(event.target) ||
        heroActions.contains(event.target)) return;
    const onMap = views.map.viewport.contains(event.target);
    if (mapDirectionAction && (onMap || directionPad.contains(event.target))) return;
    mapDirectionAction = undefined;
    dismissMapActions();
    if (onMap) {
        event.preventDefault();
        event.stopPropagation();
    }
}, { capture: true });

function keyBadge(label) {
    const badge = document.createElement("kbd");
    badge.textContent = label;
    return badge;
}

function keyFromCode(code) {
    if (code === 9) return "Tab";
    if (code === 13) return "Enter";
    if (code === 27) return "Escape";
    return code > 0 && code < 27 ? `Ctrl+${String.fromCharCode(code + 64)}` : String.fromCodePoint(code);
}

function setKeyHint(button, key = button.dataset.key, caption) {
    const label = keyNames.get(key) ?? key;
    const text = caption || label;
    let badge = button.querySelector(".key-hint");
    if (!badge) {
        badge = keyBadge(text);
        badge.className = "key-hint";
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
    } else if (badge.textContent !== text) {
        badge.textContent = text;
    }
    button.setAttribute("aria-description", `Shortcut: ${label}`);
}

function updateKeyButton(button, label, key = button.dataset.key) {
    const text = button.firstChild;
    if (text.data !== label) text.data = label;
    if (button.dataset.key !== key) {
        button.dataset.key = key;
        setKeyHint(button);
    }
}

function setMapListsOpen(open) {
    if (mapLists.hidden === !open) return;
    mapLists.hidden = !open;
    openMapLists.setAttribute("aria-expanded", String(open));
    draw();
}

openMapLists.addEventListener("click", () => {
    const open = mapLists.hidden;
    if (open && !mapCellActions.hidden) dismissMapActions();
    setMapListsOpen(open);
    if (open) mapLists.querySelector("button:enabled")?.focus({ preventScroll: true });
});

mapLists.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !mapLists.contains(event.relatedTarget) && event.relatedTarget !== openMapLists)
        setMapListsOpen(false);
});

mapLists.replaceChildren(...visibleListCommands.map(([key, announcement, , label]) => {
    const button = makeKey(key, label, announcement);
    setKeyHint(button);
    return button;
}));

for (const button of document.querySelectorAll(
    "#play-keys [data-key], #target-actions [data-key], #terminal-keys [data-key], " +
    "#birth-roll-actions [data-key], #name-fields [data-key], #text-fields [data-key], #reset-stats"
)) setKeyHint(button);
for (const button of directionButtons) {
    const direction = mapDirections.findIndex((entry) => entry?.key === button.dataset.key);
    setKeyHint(button, String(direction));
}
for (const [button, key] of [[closeMapCellActions, "Escape"], [stopAction, "Escape"],
    [monsterSort, "x"],
    [messageDialog.querySelector("form button"), "Escape"],
    [continueMessage, "Enter"], [document.querySelector("#confirm-name"), "Enter"]]) setKeyHint(button, key);

function commandKey([key, , alternative], roguelike) {
    return roguelike && alternative ? alternative : key;
}

function renderQuickActions({ roguelike, quickActions }) {
    const { spell, launcher, canExplore = false } = quickActions;
    if (primaryActions.contains(useAction) !== canExplore) {
        if (canExplore) {
            heroActions.after(useAction);
            combatAction.before(repeatAction);
        } else {
            primaryActions.after(useAction);
            combatAction.after(repeatAction);
        }
    }
    exploreAction.hidden = !canExplore;
    const spellAction = spell === "look" ? undefined : spellCommands[spell];
    const combat = spell === "cast" && spellAction ? spellAction :
        launcher ? fireCommand : spellAction ?? throwCommand;
    combatAction.dataset.key = commandKey(combat, roguelike);
    combatAction.setAttribute("aria-label", combat[1]);
    const label = combatAction.firstChild;
    if (label.data !== combat[3]) label.data = combat[3];
    useAction.dataset.key = commandKey(useCommand, roguelike);
    repeatAction.dataset.key = commandKey(repeatCommand, roguelike);
    setKeyHint(combatAction);
    setKeyHint(useAction);
    repeatName = quickActions.repeat;
    repeatAction.setAttribute("aria-label", repeatName ? `Repeat ${repeatName}` : "No command to repeat");
    setKeyHint(repeatAction, repeatAction.dataset.key, repeatName);
}

function renderActionsPanel() {
    actionsScreen.setAttribute("aria-label", panelTitles[openPanel]);
    actionsScreen.scrollTop = 0;
    const currentGraphics = views.map.frame?.graphicsMode ?? 0;
    if (openPanel === "touch-settings") {
        actionsScreen.replaceChildren(...[
            ["leftHanded", "Direction pad on the left", "Keep movement controls beside your left thumb."],
            ["fastAim", "Fast targeting", "Tap a monster to use the prepared spell or item immediately. Turn off to preview and confirm."],
            ["tapToMove", "Tap map to move", "Turn off to inspect cells with a tap and move with the direction pad."],
        ].map(([key, label, detail]) => {
            const button = makeButton(`${label}. ${detail}`);
            const text = document.createElement("span");
            const hint = document.createElement("small");
            text.textContent = label;
            hint.textContent = detail;
            text.append(hint);
            button.replaceChildren(text);
            button.setAttribute("aria-pressed", String(preferences[key]));
            button.onclick = () => {
                preferences[key] = !preferences[key];
                savePreferences();
                applyPreferences();
                button.setAttribute("aria-pressed", String(preferences[key]));
                updateControls();
                recenterView();
            };
            return button;
        }));
        return;
    }
    if (openPanel === "tiles") {
        const rows = [...graphicsModes].map(([id, { label }]) => {
            const button = makeInput("set-tiles", id, label);
            if (id === currentGraphics) button.setAttribute("aria-current", "true");
            return button;
        });
        tilesStatus.textContent = "";
        actionsScreen.replaceChildren(...rows, tilesStatus);
        return;
    }
    let commands;
    if (openPanel === "menu") {
        commands = gameMenu;
    } else if (openPanel === "commands") {
        commands = [...extraCommands];
        if (world?.quickActions?.canReshape) commands.push(["!", "Change shape"]);
        if (world?.quickActions?.canExplore) commands.push(["p", "Start exploring"]);
        if (world?.quickActions?.canSteal) commands.push(stealCommand);
        commands.push(["Enter", "All FAangband commands"]);
    }
    if (!commands) return;
    const rows = commands.map((entry) => {
        const key = commandKey(entry, world?.roguelike);
        const label = entry[1];
        const button = makeKey(key, label);
        button.prepend(keyBadge(keyNames.get(key) ?? key));
        button.setAttribute("aria-description", `Shortcut: ${keyNames.get(key) ?? key}`);
        return button;
    });
    if (openPanel === "menu") {
        tilesMenu.textContent = `Tiles: ${graphicsModes.get(currentGraphics).label}`;
        const commands = makeButton("Commands");
        commands.onclick = () => showPanel("commands", openMenu);
        const settings = makeButton("Touch settings");
        settings.onclick = () => showPanel("touch-settings", openMenu);
        rows.unshift(commands, tilesMenu, settings);
    }
    if (openPanel === "commands") {
        const grouped = [];
        for (const [title, keys] of [
            ["Explore", ["p", ".", "R", "l", "[", "]", "<", ">", "M", "/"]],
            ["Fight", ["m", "f", "v", "h", "*", "s"]],
            ["Items", ["U", "r", "q", "u", "a", "z", "E", "A", "F", "g", "d", "K"]],
            ["Interact", ["+", "T", "D", "o", "c"]],
            ["Other commands", ["S", "!", "$", "G", "b", "n", ":", "Enter"]],
        ]) {
            const heading = document.createElement("h3");
            heading.textContent = title;
            grouped.push(heading, ...rows.filter((_, index) => keys.includes(commands[index][0])));
        }
        actionsScreen.replaceChildren(...grouped);
    } else actionsScreen.replaceChildren(...rows);
}

async function chooseTiles(input, button) {
    if (input.code === views.map.frame?.graphicsMode) {
        showPanel();
        return;
    }
    const selectionRequest = request;
    const stillChoosing = () => openPanel === "tiles" && actionsScreen.contains(button);
    loadingTiles = button;
    tilesStatus.textContent = "Loading tiles…";
    updateControls();
    try {
        await loadTiles(input.code);
        if (stillChoosing()) {
            tilesStatus.textContent = "";
            if (request === selectionRequest && sendInput(input)) {
                preferences.tiles = input.code;
                savePreferences();
                showPanel();
            }
        }
    } catch (error) {
        console.error(error);
        if (stillChoosing()) tilesStatus.textContent = "Could not load tiles. Try again.";
    } finally {
        if (loadingTiles === button) loadingTiles = undefined;
        updateControls();
    }
}

function birthModifierRows(rows) {
    return characterRows(rows.map(({ label, value }) => ({
        label, value: value < 0 ? `−${-value}` : `+${value}`,
    })));
}

function renderBirthCard(birth, statMethod) {
    const { race, className, stats, skills, abilities, hitDie, hometown, thrallStart, difficulty, infravision } = birth;
    const container = statMethod ? statMethodCharacter : birthPreview;
    const title = [race, className].filter(Boolean).join(" ");
    const start = thrallStart || hometown;
    if (birthCard.parentElement === container && birthChoice.textContent === title && birthCard.dataset.start === start) return;
    birthCard.dataset.start = start;
    container.append(birthCard);
    birthChoice.textContent = title;
    birthDescription.textContent = birthDescriptions.get(className || race) ?? "";
    birthRaceDescription.textContent = statMethod ? birthDescriptions.get(race) ?? "" : "";
    birthRaceDescription.hidden = !birthRaceDescription.textContent;

    const adjustments = birthModifierRows(stats);
    adjustments.setAttribute("aria-label", className ? "Combined race and class stat adjustments" : "Race stat adjustments");
    stats.forEach(({ value }, i) => {
        if (value) adjustments.children[i].classList.add(value > 0 ? "positive" : "negative");
    });
    birthAdjustments.replaceChildren(adjustments);
    const vitals = [{ label: "Hit die", value: hitDie }];
    if (thrallStart) vitals.push({ label: "Starting place", value: thrallStart }, { label: "Home town", value: "None" });
    else if (hometown) vitals.push({ label: "Home town", value: hometown }, { label: "Difficulty", value: difficulty });
    if (infravision >= 0) vitals.push({ label: "Infravision", value: `${infravision} ft` });
    birthVitals.replaceChildren(characterRows(vitals));
    birthAbilities.hidden = !abilities.length;
    birthAbilities.querySelector("h3").textContent = className ? "Class abilities" : "Race abilities";
    birthAbilities.querySelector("p").textContent = abilities.join(" · ");
    birthSkills.replaceChildren(birthModifierRows(skills));
    container.scrollTop = 0;
}

function renderBirthStats(stats, changed) {
    const { roll } = stats;
    if (birthNameSource !== stats.name || randomBirthNamePending) {
        birthNameValue.value = stats.name;
        birthNameValue.setCustomValidity("");
        birthNameSource = stats.name;
        randomBirthNamePending = false;
    }
    const focused = document.activeElement;
    const focusedRow = !changed && birthStatRows.contains(focused) ? focused.closest("button") : null;
    birthStatsScreen.classList.toggle("rolled-stats", !!roll);
    birthIdentity.textContent = `${stats.race} / ${stats.className}`;
    birthPoints.textContent = roll ? `HP ${roll.hp} · SP ${roll.mana}` : `Points left: ${stats.remaining}`;
    resetStats.hidden = !!roll;
    if (birthHistoryPreview.textContent !== stats.history) birthHistoryPreview.textContent = stats.history;
    birthStatRows.replaceChildren(...stats.rows.map((stat, index) => {
        const row = document.createElement("div");
        row.className = "birth-stat";
        row.classList.toggle("current", index === stats.cursor);
        const label = document.createElement("div");
        label.textContent = stat.label;
        const value = document.createElement("div");
        value.className = "birth-stat-value";
        value.textContent = stat.value;
        const base = document.createElement("small");
        base.textContent = `Base ${stat.base}`;
        value.append(base);
        if (roll) {
            row.append(label, value);
            return row;
        }
        const cost = document.createElement("small");
        cost.textContent = stat.cost ? `Next: ${stat.cost} pt` : "Max base";
        label.append(cost);
        const decrease = makeInput("sell-stat", index, "−");
        decrease.setAttribute("aria-label", `Decrease ${stat.label}`);
        decrease.disabled = !stat.canDecrease;
        const increase = makeInput("buy-stat", index, "+");
        increase.setAttribute("aria-label", `Increase ${stat.label}`);
        increase.disabled = !stat.canIncrease;
        row.append(label, decrease, value, increase);
        return row;
    }));
    if (changed) birthStatsScreen.scrollTop = 0;
    if (focusedRow) {
        const row = birthStatRows.children[Number(focusedRow.dataset.value)];
        const button = row?.querySelector(`[data-input="${focusedRow.dataset.input}"]:enabled`);
        (button ?? row?.querySelector("button:enabled"))?.focus({ preventScroll: true });
    }
}

function saveSlotLabel(row) {
    return row.name.replace(/^Use /, "");
}

function focusSelectedSave() {
    const selected = activeList.rows.querySelector('[aria-current="true"]') ??
        menuActions.querySelector('button[data-input="new-game"]');
    (selected ?? activeList.rows).focus({ preventScroll: true });
}

function knowledgeResults(rows, query) {
    const words = query.split(/\s+/);
    const groups = new Map();
    const sections = [];
    let count = 0;
    for (const row of rows) {
        if (row.sectionOnly) sections[row.section] = row;
        if (!row.enabled) continue;
        const section = sections[row.section];
        const group = section.group ?? section.name;
        const name = row.name.toLowerCase();
        const detail = row.detail?.toLowerCase() ?? "";
        const path = `${name} ${section.name.toLowerCase()} › ${detail}`;
        let rank;
        if (name === query) rank = 0;
        else if (detail === query) rank = 1;
        else if (name.startsWith(query)) rank = 2;
        else if (name.includes(query)) rank = 3;
        else if (words.every(word => path.includes(word))) rank = 4;
        else continue;
        if (!groups.has(group)) groups.set(group, [[], [], [], [], []]);
        groups.get(group)[rank].push(row);
        count++;
    }

    const visible = [];
    for (const [group, ranked] of groups) {
        const limit = knowledgeLimits.get(group) ?? (groups.size > 1 ? 5 : knowledgePageSize);
        let remaining = limit;
        for (const matches of ranked) {
            const shown = Math.min(remaining, matches.length);
            for (let i = 0; i < shown; i++) {
                const row = matches[i];
                const section = sections[row.section];
                visible.push({ ...row, group,
                    detail: section.group && !row.sectionOnly ? section.name : row.detail });
            }
            if (shown < matches.length) {
                visible.push({ group, moreFrom: limit, nextIndex: matches[shown].index });
                break;
            }
            remaining -= shown;
        }
    }
    return { visible, count };
}

function menuScrollSize(scrollArea) {
    return { scrollArea, width: scrollArea.clientWidth, height: scrollArea.clientHeight };
}

function scrollMenuRowIntoView(row, scrollArea) {
    const bounds = row.getBoundingClientRect();
    const screen = scrollArea.getBoundingClientRect();
    if (bounds.top < screen.top) scrollArea.scrollTop += bounds.top - screen.top;
    else if (bounds.bottom > screen.bottom) scrollArea.scrollTop += bounds.bottom - screen.bottom;
}

function renderMenu(state, description = state?.description ?? "") {
    const { screen: menuScreen, description: menuDescription, rows: menuRows,
        sections: menuSections, summary: menuSummary, items: menuItems, empty: menuEmpty } = activeList;
    menuScreen.hidden = !state;
    menuDescription.hidden = !description;
    renderDescription(menuDescription, description);
    menuScreen.classList.toggle("options-menu", Boolean(state?.options));
    optionSaveStatus.hidden = !state?.options || !state.actions.length;
    const saveMessage = state?.defaultsSaved ? "Saved as defaults." : "";
    if (optionSaveStatus.textContent !== saveMessage) optionSaveStatus.textContent = saveMessage;
    menuScreen.classList.toggle("birth-menu", Boolean(state?.birth));
    const outcome = !!context.outcome;
    const saveSlots = mode === "save-slots";
    menuActions.classList.toggle("birth-actions", Boolean(state?.birth));
    menuActions.classList.toggle("save-slot-actions", saveSlots);
    if (!state) {
        activeList.state = undefined;
        menuCursor = undefined;
        if (activeList === pageList) outcomeActions.replaceChildren();
        return;
    }
    if (state === activeList.state) return;
    const previous = activeList.state;
    activeList.state = state;
    const active = state.sections?.find((section) => section.active)?.id;
    const previousActive = previous?.sections?.find((section) => section.active)?.id;
    const differentList = !previous || state.id !== previous.id || active !== previousActive ||
        (!state.store && state.selectionTitle !== previous.selectionTitle) || state.title !== previous.title ||
        state.options !== previous.options || state.prompt !== previous.prompt;
    const previousScroll = activeList.scrollArea.scrollTop;
    const showGold = state.store && !state.store.home;
    menuSections.hidden = (state.sections?.length ?? 0) <= 1;
    const scrollItems = showGold || !menuSections.hidden;
    menuScreen.classList.toggle("scroll-menu-items", scrollItems);
    const scrollArea = scrollItems ? menuItems : menuScreen;
    activeList.scrollArea = scrollArea;
    menuCursor = state.cursor;
    const query = state.search ? knowledgeSearch.value.trim().toLowerCase() : "";
    const results = query ? knowledgeResults(state.rows, query) : undefined;
    const rows = results?.visible ?? (state.search ? state.rows.filter(row => row.sectionOnly) : state.rows);
    const raceSummary = !state.choice && state.birth?.className && state.birth.race;
    const summary = state.burden || raceSummary || (showGold ? `Gold Remaining: ${state.store.gold} au` : "");
    menuSummary.textContent = results?.count ?
        `${results.count} ${results.count === 1 ? "match" : "matches"}` : summary;
    menuSummary.hidden = !menuSummary.textContent;
    menuSections.replaceChildren(...(state.sections ?? []).map((section) => {
        const button = makeInput("menu-section", section.id, section.label);
        button.disabled = section.active;
        button.setAttribute("aria-pressed", String(section.active));
        return button;
    }));
    menuEmpty.hidden = rows.length > 0;
    menuEmpty.textContent = saveSlots ? "No saved games." : query ? "No matches." : "No items.";
    const focused = document.activeElement?.closest("button[data-input]");
    const focusedCode = focused && (menuRows.contains(focused) || outcomeActions.contains(focused)) ?
        focused.dataset.value : undefined;
    let current;
    const endings = [];
    const choices = [];
    if (state.card) {
        const body = document.createElement("div");
        body.className = "detail-text";
        body.id = "knowledge-card-text";
        renderDescription(body, state.card);
        choices.push(body);
    }
    let group, groupRows;
    for (const row of rows) {
        if (row.moreFrom !== undefined) {
            const more = document.createElement("button");
            more.type = "button";
            more.textContent = "Show more";
            more.setAttribute("aria-label", `Show more in ${row.group}`);
            more.addEventListener("click", () => {
                knowledgeLimits.set(row.group, row.moreFrom + knowledgePageSize);
                pageList.state = undefined;
                renderMenu(state);
                menuRows.querySelector(`button[data-value="${row.nextIndex}"]`)?.focus();
            });
            choices.push(more);
            continue;
        }
        const label = saveSlots ? saveSlotLabel(row) : row.name;
        const button = makeInput("menu-row", row.index, label);
        button.disabled = !row.enabled;
        if (row.checked !== undefined) {
            button.setAttribute("aria-pressed", String(row.checked));
            button.classList.toggle("read-only", !row.enabled);
        }
        if (row.index === menuCursor && !button.disabled) {
            current = button;
            button.setAttribute("aria-current", "true");
            if (state.birth) button.setAttribute("aria-describedby", state.choice ? "picker-description" : "birth-description");
        }
        const description = document.createElement("span");
        description.textContent = label;
        if (row.color) description.style.color = row.color;
        if (row.spellInfo !== undefined) button.classList.add("spell-choice");
        if (row.detail && !state.birth) {
            const detail = document.createElement("small");
            detail.textContent = row.detail;
            if (row.spellInfo) {
                const info = document.createElement("span");
                info.style.color = row.color;
                info.textContent = row.spellInfo;
                detail.append(" ", info);
            }
            description.append(detail);
        }
        const price = document.createElement("span");
        price.className = "price";
        price.classList.toggle("unaffordable", !!row.unaffordable);
        price.textContent = row.price;
        const ending = outcome && ["n", "q"].some((key) => row.key === keyCode(key));
        const rowKey = row.key ? keyFromCode(row.key) : "";
        if (state.birth || ending) {
            button.replaceChildren(description);
            if (rowKey) setKeyHint(button, rowKey);
        } else {
            button.replaceChildren(keyBadge(rowKey), description, price);
            if (rowKey) button.setAttribute("aria-description", `Shortcut: ${rowKey}`);
        }
        button.setAttribute("aria-label",
            [label, query && row.group !== label ? row.group : "", state.birth ? "" : row.detail, row.spellInfo,
                row.checked === undefined ? row.price : "",
                row.unaffordable ? "You do not have enough gold for this item." : ""]
                .filter(Boolean).join(", "));
        if (row.visual) {
            const { graphics, attr, symbol, color } = row.visual;
            const glyph = document.createElement("span");
            glyph.className = "visible-list-symbol";
            glyph.setAttribute("aria-hidden", "true");
            const tiles = graphicsModes.get(graphics);
            const tile = tiles?.atlas && tileAt(tiles, attr, symbol);
            if (tile) styleTerminalTile(glyph, tiles, tile);
            else {
                glyph.textContent = String.fromCodePoint(symbol);
                glyph.style.color = color;
            }
            button.firstElementChild.replaceWith(glyph);
        }
        if (group !== row.group) {
            group = row.group;
            groupRows = undefined;
            if (!query && row.collapsible) {
                const section = document.createElement("details");
                const title = document.createElement("summary");
                title.textContent = group;
                section.className = "knowledge-stores";
                section.open = !differentList && !!menuRows.querySelector("details[open]");
                section.append(title);
                groupRows = section;
                choices.push(section);
            } else if (group) {
                const heading = document.createElement("h3");
                heading.textContent = group;
                choices.push(heading);
            }
        }
        if (groupRows) {
            groupRows.append(button);
            if (button === current) groupRows.open = true;
            continue;
        }
        if (saveSlots && row.enabled) {
            const controls = document.createElement("div");
            controls.className = "save-slot-row";
            const remove = makeInput("delete-save", row.index, `Delete save: ${label}`);
            remove.className = "delete-save";
            remove.setAttribute("aria-haspopup", "dialog");
            remove.replaceChildren(deleteSaveIcon.content.cloneNode(true));
            controls.append(button, remove);
            choices.push(controls);
        } else {
            (ending ? endings : choices).push(button);
        }
    }
    menuRows.replaceChildren(...choices);
    outcomeActions.replaceChildren(...endings);
    const focusedAction = menuActions.contains(document.activeElement) ?
        document.activeElement.dataset.key ?? document.activeElement.dataset.input : undefined;
    menuActions.replaceChildren(...state.actions.map((action) => {
        if (saveSlots && action.key === 0) return makeInput("new-game", 0, action.label);
        const button = state.store ? makeInput("store-action", action.key, action.label) :
            makeKey(String.fromCharCode(action.key), action.label);
        const key = keyFromCode(action.key);
        setKeyHint(button, key);
        if (state.store && !state.store.home && !state.store.itemActions && (key === "p" || key === "l" || key === "x")) {
            button.title = `${key} — ${key === "p" ? "Purchase" : "Examine"} which item?`;
            button.setAttribute("aria-description", button.title);
        }
        if (state.store?.itemActions && (key === "p" || key === "o")) {
            button.disabled = !!state.rows[menuCursor]?.unaffordable;
        }
        return button;
    }));
    if (focusedAction && !differentList) {
        [...menuActions.children].find((button) => (button.dataset.key ?? button.dataset.input) === focusedAction)
            ?.focus({ preventScroll: true });
    }
    scrollArea.scrollTop = differentList ? 0 : previousScroll;
    if (current && menuRows.contains(current) && !differentList && state.cursor !== previous.cursor) {
        scrollMenuRowIntoView(current, scrollArea);
    }
    if (focusedCode && !differentList && !focused?.isConnected) {
        const button = focused.dataset.input === "menu-row" && state.cursor !== previous.cursor ? current :
            [...menuRows.querySelectorAll("button[data-input]"), ...endings].find((row) =>
                row.dataset.value === focusedCode && row.dataset.input === focused.dataset.input);
        if (button?.matches(":enabled")) button.focus({ preventScroll: true });
    }
}

function showKeys(panel, keys) {
    panel.replaceChildren(...keys.map((row) => {
        const line = document.createElement("div");
        line.className = "keyboard-row";
        line.append(...row);
        return line;
    }));
}

function renderKeyboard() {
    const onMap = mode === "command";
    const layers = [
        ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
        ["1234567890", "-=,.;:<>/?", "!@#$%&*()"],
        ["[]{}\\", "|`'\"", "+_~^"],
    ];
    const rows = layers[keyboardLayer].map((line) =>
        [...line].map((key) => makeKey(keyboardLayer === 0 && shifted ? key.toUpperCase() : key)));
    const nextLayer = (keyboardLayer + 1) % layers.length;
    const switchLayer = makeButton(["ABC", "123", "#+="][nextLayer],
        ["Letters", "Numbers", "More symbols"][nextLayer]);
    switchLayer.onclick = () => {
        keyboardLayer = nextLayer;
        renderKeyboard().focus({ preventScroll: true });
    };
    const shift = makeButton("⇧", "Uppercase for next letter");
    shift.setAttribute("aria-pressed", String(shifted));
    shift.onclick = () => {
        shifted = !shifted;
        renderKeyboard();
        keyboard.querySelector("[aria-pressed]").focus({ preventScroll: true });
    };
    if (keyboardLayer === 0) rows.at(-1).unshift(shift);
    const tab = makeKey("Tab", "Tab");
    if (onMap && keyboardLayer === 0) rows[1].unshift(tab);
    if (!onMap || keyboardLayer === 1) rows.at(-1).push(makeKey("Backspace", "⌫", "Delete character"));
    const space = makeKey(" ", "Space");
    space.className = "space-key";
    const utility = [switchLayer];
    if (!onMap) utility.push(space, tab);
    if (mode === "key" || onMap) {
        const control = makeButton("Ctrl", "Control for next letter");
        control.setAttribute("aria-pressed", String(controlKey));
        control.onclick = () => {
            controlKey = !controlKey;
            control.setAttribute("aria-pressed", String(controlKey));
        };
        utility.push(control);
    }
    if (onMap) {
        keyboardUtilities.replaceChildren(...utility, space);
    } else {
        rows.push(utility);
    }
    showKeys(keyboard, rows);
    keyboard.lastElementChild.classList.toggle("keyboard-utility-row", !onMap);
    return switchLayer;
}

const digits = () => [
    [..."12345"].map((key) => makeKey(key)),
    [..."67890"].map((key) => makeKey(key)),
];
showKeys(quantity, [
    ...digits(),
    [makeKey("*", "All"), makeKey("Backspace", "⌫", "Delete digit")],
]);
showKeys(optionDigits, [
    ...digits(),
    [makeKey("ArrowLeft", "←", "Move text cursor left"), makeKey("ArrowRight", "→", "Move text cursor right"),
        makeKey("Backspace", "⌫", "Delete digit")],
]);
const [lowDigits, highDigits] = digits();
showKeys(rest, [
    Array.from(restLabels, ([key, label]) => makeKey(key, label)),
    lowDigits,
    [...highDigits, makeKey("Backspace", "⌫", "Delete digit")],
]);
for (const button of [...quantity.querySelectorAll('[data-key="*"]'), ...rest.firstElementChild.children]) {
    setKeyHint(button);
}

function toggleKeyboard() {
    keyboardOpen = !keyboardOpen;
    if (keyboardOpen) {
        keyboardLayer = 0;
        shifted = false;
        controlKey = false;
        renderKeyboard();
    }
    updateControls();
    centerPending = true;
    draw();
    if (mode === "command") {
        (keyboardOpen ? keyboard.querySelector("button") : mapKeyboardToggle)?.focus({ preventScroll: true });
    } else if (mode === "target" || mode === "aim" || mode === "direction") {
        (keyboardOpen ? keyboard.querySelector("button") : keyboardToggle)?.focus({ preventScroll: true });
    }
}

keyboardToggle.addEventListener("click", toggleKeyboard);
mapKeyboardToggle.addEventListener("click", toggleKeyboard);

heroActions.addEventListener("click", () => {
    if (!mapCellActions.hidden) {
        mapDirectionAction = undefined;
        dismissMapActions();
        return;
    }
    if (mode === "command" && context.worldView && world) {
        sendInput({ type: "map-cell", x: world.x, y: world.y, openMenu: true });
    }
});
openMenu.addEventListener("click", () => {
    if (mode === "command" && request !== undefined) showPanel("menu", openMenu);
});
vitals.addEventListener("click", () => {
    if (mode === "command") {
        if (sendInput({ type: "open-character" })) characterTrigger = vitals;
    } else if (request !== undefined && context.character) {
        showPanel("character", vitals);
    }
});

function updatePickerOverflow() {
    if (picker.hidden) return;
    const list = openPanel ? actionsScreen : pickerList.scrollArea;
    const description = pickerList.description;
    const listOverflow = list.scrollHeight - list.clientHeight;
    const descriptionOverflow = description.scrollHeight - description.clientHeight;
    const moreRows = listOverflow - Math.max(0, list.scrollTop) > 1;
    const moreText = descriptionOverflow - Math.max(0, description.scrollTop) > 1;
    const showToggle = picker.classList.contains("resizable") &&
        (pickerExpanded || listOverflow > 1 || descriptionOverflow > 1);
    if (!showToggle && document.activeElement === pickerToggle) pickerHeading.focus({ preventScroll: true });
    pickerToggle.hidden = !showToggle;
    pickerListShadow.hidden = !moreRows;
    pickerDescriptionShadow.hidden = !moreText;
}

const menuResize = new ResizeObserver((entries) => {
    const { rows, scrollArea } = activeList;
    if (entries.some(({ target }) => target === scrollArea)) {
        const previous = lastMenuScrollSize;
        const size = menuScrollSize(scrollArea);
        lastMenuScrollSize = size;
        const focused = document.activeElement;
        if (previous?.scrollArea === scrollArea && size.width && size.height &&
            (size.width < previous.width || size.height < previous.height) &&
            rows.contains(focused) && focused.matches('[aria-current="true"]')) {
            scrollMenuRowIntoView(focused, scrollArea);
        }
    }
    updatePickerOverflow();
});
for (const area of [pageList.screen, pageList.items, actionsScreen,
    pickerList.screen, pickerList.items, pickerList.rows, pickerList.description]) {
    menuResize.observe(area);
}
picker.addEventListener("scroll", updatePickerOverflow, { capture: true, passive: true });

pickerToggle.addEventListener("click", () => {
    if (pickerToggle.hidden || pickerToggle.disabled) return;
    pickerExpanded = !pickerExpanded;
    updateView();
    updateControls();
});

function renderMessageRecall() {
    const query = messageSearch.value.trim();
    const pattern = query ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu") : null;
    const items = [];
    for (const entry of recalledMessages) {
        const line = formatMessage(entry);
        const matches = pattern ? [...line.matchAll(pattern)] : [];
        if (pattern && !matches.length) continue;
        const item = document.createElement("li");
        if (entry.color) item.style.color = entry.color;
        let end = 0;
        for (const match of matches) {
            const highlighted = document.createElement("mark");
            highlighted.textContent = match[0];
            item.append(line.slice(end, match.index), highlighted);
            end = match.index + match[0].length;
        }
        item.append(line.slice(end));
        items.push(item);
    }
    messages.replaceChildren(...items);
    messageSearchStatus.hidden = !pattern && items.length > 0;
    messageSearchStatus.textContent = pattern ?
        `${items.length} ${items.length === 1 ? "match" : "matches"}` : "No messages.";
    messages.scrollTop = messages.scrollHeight;
    updateMessageFade();
}

function updateMessageFade() {
    messages.classList.toggle("scrolled", messages.scrollTop > 1);
}

function setMessageSearchOpen(open) {
    messageSearch.hidden = !open;
    messageSearchToggle.setAttribute("aria-expanded", String(open));
    messageSearchToggle.setAttribute("aria-label", open ? "Close search" : "Find messages");
    if (!open) messageSearch.value = "";
}

messages.addEventListener("scroll", updateMessageFade, { passive: true });
knowledgeSearchToggle.addEventListener("click", () => {
    const opening = !menu?.search;
    if (!sendInput({ type: "key", code: keyCode(opening ? "/" : "Escape") })) return;
    if (opening) {
        knowledgeSearch.value = "";
        knowledgeScroll = 0;
        knowledgeSearch.hidden = false;
        knowledgeSearch.focus({ preventScroll: true });
    }
});
knowledgeSearch.addEventListener("input", () => {
    if (!menu?.search) return;
    knowledgeLimits.clear();
    knowledgeScroll = 0;
    pageList.state = undefined;
    renderMenu(menu);
});
messageSearchToggle.addEventListener("click", () => {
    const opening = messageSearch.hidden;
    const wasFiltered = Boolean(messageSearch.value.trim());
    setMessageSearchOpen(opening);
    if (wasFiltered) renderMessageRecall();
    (opening ? messageSearch : messageSearchToggle).focus({ preventScroll: true });
});
messageSearch.addEventListener("input", renderMessageRecall);
messageSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        messages.focus({ preventScroll: true });
    }
});
function openMessageRecall(inputRequest) {
    messageRecallInput = inputRequest;
    if (messageDialog.open) return;
    setMessageSearchOpen(false);
    messageSearchToggle.disabled = true;
    messageSearchStatus.textContent = "Loading messages…";
    messageSearchStatus.hidden = false;
    messages.replaceChildren();
    messageDialog.showModal();
    messages.focus({ preventScroll: true });
    worker.postMessage({ type: "message-recall", recall: ++messageRecallRequest });
}

journal.addEventListener("click", () => openMessageRecall());
messageDialog.addEventListener("close", () => {
    recalledMessages = [];
    messages.replaceChildren();
    const inputRequest = messageRecallInput;
    messageRecallInput = undefined;
    if (inputRequest !== undefined && inputRequest === request)
        sendInput({ type: "key", code: keyCode("Escape") });
});
function interruptAction(button) {
    if (pendingInput === undefined || button.disabled) return;
    worker.postMessage({ type: "interrupt", request: pendingInput });
    button.disabled = true;
}

stopAction.addEventListener("click", () => interruptAction(stopAction));
movementMode.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || movementMode.hidden || button.disabled || !messagePause.hidden ||
        (request === undefined && !runningFromPad)) return;
    runMode = button === runModeButton;
    if (!runMode && runningFromPad) interruptAction(stopAction);
    updateControls();
});

for (const view of [views.map, views.target]) {
    let tap;
    let holdTimer;

    function cancelTap() {
        clearTimeout(holdTimer);
        tap = undefined;
    }

    function selectCell({ x, y, request: pressedRequest, pointerType }, openMenu = false) {
        const type = view === views.map ? mode === "command" ? "map-cell" :
            mode === "aim" || mode === "run-direction" ? "aim-cell" : undefined :
            mode === "target" ? "target-cell" :
            mode === "aim" || mode === "direction" || mode === "run-direction" ? "aim-cell" : undefined;
        const source = view === views.map ? view.frame : views.terminal.frame;
        if (request === undefined || pressedRequest !== request || activeView !== view ||
            !type || !view.grid || !view.gridElement.contains(document.elementFromPoint(x, y)) ||
            view.rendered !== source || (view !== views.map && !sameRegion(view.region, view.crop))) return;
        const { x: left, y: top, columns, rows } = view.grid;
        const grid = view.gridElement.getBoundingClientRect();
        const column = Math.floor((x - grid.left) * columns / grid.width);
        const row = Math.floor((y - grid.top) * rows / grid.height);
        if (column < 0 || column >= columns || row < 0 || row >= rows) return;
        const cellX = left + column;
        const cellY = top + row;
        if (view === views.map && !containsCell(view.region, { x: cellX, y: cellY })) return;
        if (mapDirectionAction && view === views.map) {
            const target = mapDirectionAction.targets.find((cell) => cell.x === cellX && cell.y === cellY);
            if (!openMenu && target) sendMapAction(mapDirectionAction, target);
            return;
        }
        sendInput({ type, x: cellX, y: cellY, openMenu, fast: mode === "aim" && preferences.fastAim,
            mouse: pointerType === "mouse", inspect: pointerType !== "mouse" && !preferences.tapToMove });
    }

    view.viewport.addEventListener("pointerdown", (event) => {
        cancelTap();
        if (!event.isPrimary || event.button !== 0) return;
        tap = { request, x: event.clientX, y: event.clientY, pointer: event.pointerId,
            pointerType: event.pointerType };
        if (view === views.map && mode === "command" && !mapDirectionAction && event.pointerType === "touch" &&
            view.gridElement?.contains(event.target)) {
            holdTimer = setTimeout(() => {
                const held = tap;
                cancelTap();
                if (held) selectCell(held, true);
            }, 425);
        }
    });
    view.viewport.addEventListener("pointermove", (event) => {
        if (tap?.pointer === event.pointerId &&
            Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 8) cancelTap();
    });
    view.viewport.addEventListener("pointerup", () => clearTimeout(holdTimer));
    view.viewport.addEventListener("pointercancel", cancelTap);
    view.viewport.addEventListener("click", (event) => {
        if (!tap || event.detail === 0) return;
        const pressed = tap;
        cancelTap();
        selectCell({ ...pressed, x: event.clientX, y: event.clientY });
    });
    if (view === views.map) {
        view.viewport.addEventListener("contextmenu", (event) => {
            if (!view.gridElement?.contains(event.target)) return;
            event.preventDefault();
            cancelTap();
            if (mode === "command" && event.button === 2 && event.pointerType !== "touch")
                selectCell({ x: event.clientX, y: event.clientY, request }, true);
        });
        view.viewport.addEventListener("scroll", cancelTap);
        document.addEventListener("touchstart", (event) => {
            if (event.touches.length > 1) cancelTap();
        }, { capture: true, passive: true });
    }
}

document.addEventListener("contextmenu", (event) => {
    if (event.pointerType === "touch" && !event.target.matches('input[type="text"], textarea'))
        event.preventDefault();
});

zoomOut.addEventListener("click", () => changeZoom(-1));
zoomIn.addEventListener("click", () => changeZoom(1));

function touchDistance(first, second) {
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

const mapViewport = views.map.viewport;
const zoomStepRatio = 1.18;
const touchOptions = { capture: true, passive: false };
let multiTouch = false;
let zoomDistance;
let zoomViewport;

function mapGestureViewport() {
    return mode === "overview" ? views.terminal.viewport : mapViewport;
}

document.addEventListener("touchstart", (event) => {
    if (event.touches.length < 2) return;
    const [first, second] = event.touches;
    if (!multiTouch) {
        const viewport = mapGestureViewport();
        if (viewport.hidden || !viewport.contains(first.target) || !viewport.contains(second.target)) return;
        zoomViewport = viewport;
    }
    if (event.cancelable) event.preventDefault();
    zoomDistance = !multiTouch && event.touches.length === 2 ? touchDistance(first, second) : undefined;
    multiTouch = true;
}, touchOptions);

document.addEventListener("touchmove", (event) => {
    if (!multiTouch) return;
    if (event.cancelable) event.preventDefault();
    if (zoomDistance === undefined || event.touches.length !== 2) return;
    const [first, second] = event.touches;
    if (zoomViewport !== mapGestureViewport() || zoomViewport.hidden ||
        ![first, second].every(({ clientX, clientY }) =>
            zoomViewport.contains(document.elementFromPoint(clientX, clientY)))) {
        zoomDistance = undefined;
        return;
    }
    const distance = touchDistance(first, second);
    if (distance === 0) return;
    if (zoomDistance > 0) {
        const steps = Math.trunc(Math.log(distance / zoomDistance) / Math.log(zoomStepRatio));
        if (steps === 0) return;
        if (mode === "overview") {
            zoomDistance = steps > 0 && sendInput({ type: "key", code: keyCode("Escape") }) ?
                undefined : distance;
            return;
        }
        const beyondMinimum = zoomIndex(views.map) + steps < 0;
        changeZoom(steps);
        if (beyondMinimum && mode === "command" && !keyboardOpen &&
            sendInput({ type: "key", code: keyCode("M") })) {
            zoomDistance = undefined;
            return;
        }
    }
    zoomDistance = distance;
}, touchOptions);

function endTouches(event) {
    if (!multiTouch) return;
    if (event.cancelable) event.preventDefault();
    zoomDistance = undefined;
    zoomViewport = undefined;
    multiTouch = event.touches.length > 0;
}

document.addEventListener("touchend", endTouches, touchOptions);
document.addEventListener("touchcancel", endTouches, touchOptions);
for (const type of ["gesturestart", "gesturechange"]) {
    document.addEventListener(type, (event) => {
        const viewport = mapGestureViewport();
        if (!viewport.hidden && viewport.contains(event.target)) event.preventDefault();
    });
}

const viewResize = new ResizeObserver((entries) => {
    if (activeView.viewport.hidden || !entries.some(({ target }) => target === activeView.viewport)) return;
    if (activeView === views.map && picker.hidden && inspectionPanel.hidden) draw();
    else recenterView();
});
for (const { viewport } of Object.values(views)) viewResize.observe(viewport);
views.map.viewport.addEventListener("scroll", draw, { passive: true });

function requestBackgroundSave() {
    if (!worker || stopped || backgroundSaveRequested) return;
    backgroundSaveRequested = true;
    worker.postMessage({ type: "background-save" });
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) requestBackgroundSave();
    else backgroundSaveRequested = false;
});
window.addEventListener("pagehide", requestBackgroundSave);
window.addEventListener("pageshow", () => {
    if (!document.hidden) backgroundSaveRequested = false;
});

document.addEventListener("keydown", (event) => {
    if (deleteSaveDialog.open || messageDialog.open) return;
    if (menu?.search || event.target === knowledgeSearch) {
        if (event.isComposing) return;
        if (event.key === "Escape") {
            event.preventDefault();
            if (!event.repeat) sendInput({ type: "key", code: keyCode("Escape") });
        } else if (event.key === "ArrowDown" || (event.key === "ArrowUp" && event.target !== knowledgeSearch) ||
            (event.key === "Enter" && event.target === knowledgeSearch)) {
            event.preventDefault();
            const buttons = [...pageList.rows.querySelectorAll("button:enabled")].filter(button => button.getClientRects().length);
            const step = event.key === "ArrowUp" ? -1 : 1;
            const next = buttons.indexOf(document.activeElement) + step;
            (next < 0 ? knowledgeSearch : buttons[Math.min(next, buttons.length - 1)])?.focus();
        }
        return;
    }
    if (!messagePause.hidden) {
        if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        const code = keyCode(event.key);
        if (code && event.key !== "Tab") {
            event.preventDefault();
            if (!event.repeat) acknowledgeMessage(code);
        }
        return;
    }
    if (mode === undefined || saving || deletingSave || event.isComposing || event.altKey) return;
    if (!characterNameEditor.hidden) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (request !== undefined && !event.repeat) editCharacterName(false);
        }
        return;
    }
    if (!birthHistoryEditor.hidden) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (!event.repeat) editBirthHistory(false);
        }
        return;
    }
    if (context.birthStats && event.target === birthNameValue) {
        if (event.key === "Escape") {
            event.preventDefault();
            birthNameValue.blur();
        }
        return;
    }
    if (isTextEntry(mode)) {
        if (event.key === "Escape" || (mode === "name" && event.key === "*" && !event.ctrlKey && !event.metaKey)) {
            event.preventDefault();
            if (!event.repeat) sendInput({ type: "key", code: keyCode(event.key) });
        }
        return;
    }
    if (mode === "help") {
        const key = event.key.toLowerCase();
        if (event.ctrlKey || event.metaKey || !["escape", "?", "a", "b"].includes(key)) return;
        event.preventDefault();
        if (event.repeat) return;
        if (key === "a" || key === "b") showHelpPage(key === "a" ? "commands" : "symbols");
        else backFromHelp();
        return;
    }
    if (!unavailableScreen.hidden) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (!event.repeat) sendInput({ type: "key", code: keyCode("Escape") });
        }
        return;
    }
    if (event.key === "Escape" && pendingInput !== undefined && (running || !stopAction.hidden)) {
        interruptAction(stopAction);
        event.preventDefault();
        return;
    }
    if (event.key === "Escape" && closeInputPanel(mode !== "key")) {
        event.preventDefault();
        return;
    }
    const listSelection = context.listSelection;
    if (listSelection && request !== undefined && event.key === "r" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!event.repeat && !closeInputPanel(false)) openListDetails(listSelection);
        return;
    }
    if (openPanel || listSelection?.reading) return;
    if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (mode === "key" && event.ctrlKey && !event.metaKey && /^[a-z]$/.test(key)) {
            event.preventDefault();
            if (!event.repeat) sendInput({ type: "key", code: key.charCodeAt(0) & 31 });
            return;
        }
        let shortcut;
        if (key === "s") shortcut = "Save";
        else if (!event.metaKey) {
            if (key === "a") shortcut = "Ctrl+A";
            else if (key === "x") shortcut = "SaveAndQuit";
            else if (key === "p") shortcut = "Ctrl+P";
            else if (world?.roguelike && key === "v") shortcut = "Ctrl+V";
            else if (world?.roguelike && key === "t") shortcut = "CtrlT";
        }
        if (mode === "command" && request !== undefined && !event.shiftKey && shortcut) {
            event.preventDefault();
            if (!event.repeat) sendInput({ type: "key", code: keyCode(shortcut) });
        }
        return;
    }
    if (event.key === "Enter" && menu?.birth &&
        activeList.rows.contains(event.target) && event.target.closest('[aria-current="true"]')) {
        event.preventDefault();
        if (!event.repeat) sendInput({ type: "menu-row", code: menuCursor });
        return;
    }
    if ((event.key === "Enter" || event.key === " ") &&
        event.target instanceof Element && event.target.closest("button, a, summary")) return;
    if (!mapLists.hidden && ["ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const buttons = [...mapLists.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement);
        const step = event.key === "ArrowDown" ? 1 : -1;
        buttons[(index + step + buttons.length) % buttons.length].focus({ preventScroll: true });
        return;
    }
    if (mapDirectionAction && event.key !== "Tab") {
        event.preventDefault();
        if (!event.repeat) {
            const direction = mapDirections.findIndex((entry, index) => entry && (entry.key === event.key ||
                String(index) === event.key || (world?.roguelike && entry.roguelike === event.key)));
            chooseMapDirection(direction);
        }
        return;
    }
    if ((mode === "results-list" || mode === "results-file") && event.key !== "Escape" &&
        event.key !== context.resultsList?.action?.key) return;
    if (mode === "birth-review" && !["Enter", "Escape", "s", "S"].includes(event.key)) return;
    if (mode === "character" && event.key === "c" && !characterNameEdit.hidden) {
        event.preventDefault();
        if (!event.repeat) editCharacterName(true);
        return;
    }
    if (mode === "character" && characterScreen.contains(event.target) &&
        [" ", "ArrowUp", "ArrowDown"].includes(event.key)) return;

    if (event.key === "Tab") return;
    if (menu?.card && event.target === pickerHeading && event.key === "Enter") {
        event.preventDefault();
        return;
    }
    if (menu && event.key === "Enter") {
        event.preventDefault();
        if (menu.rows.some((row) => row.index === menuCursor && row.enabled)) {
            sendInput({ type: "menu-row", code: menuCursor });
        } else if (mode === "save-slots" && !menu.rows.length) {
            menuActions.querySelector('button[data-input="new-game"]')?.click();
        }
        return;
    }
    if (mode === "details" && context.detail !== undefined &&
        !["Escape", "Enter", "[", "]"].includes(event.key) &&
        event.key !== context.browseKey &&
        !(context.sortByExp !== undefined && event.key === "x")) return;
    const code = keyCode(event.key);
    if (code) {
        event.preventDefault();
        if (!event.repeat || (mode === "command" && event.key.startsWith("Arrow")) ||
            (mode === "option-number" && event.key === "Backspace")) {
            sendInput({ type: "key", code });
        }
    }
});

async function start() {
    retry.hidden = true;
    launch.classList.remove("error");
    if (!navigator.serviceWorker?.controller) {
        progress.removeAttribute("value");
        progress.hidden = false;
        status.textContent = "Downloading FAangband for offline play…";
    }

    try {
        const ready = await prepareOffline((percent) => {
            progress.value = Math.max(progress.value, percent);
        });
        if (!ready) {
            window.location.reload();
            return;
        }
    } catch (error) {
        console.error(error);
        status.textContent = error.message;
        launch.classList.add("error");
        progress.hidden = true;
        retry.hidden = false;
        return;
    }

    progress.hidden = true;
    status.textContent = "Starting FAangband…";
    try {
        const workerURL = new URL("./engine-worker.js", import.meta.url);
        if (preferences.lastSave) workerURL.searchParams.set("slot", preferences.lastSave);
        worker = new Worker(workerURL, { type: "module" });
        worker.addEventListener("message", handleWorkerMessage);
        worker.addEventListener("error", (event) => {
            console.error(event.message);
            stop("Could not start FAangband.", true);
        });
    } catch (error) {
        console.error(error);
        status.textContent = "Could not start FAangband.";
        launch.classList.add("error");
        retry.hidden = false;
    }
}

retry.addEventListener("click", () => {
    if (stopped) window.location.reload();
    else void start();
});
start();
