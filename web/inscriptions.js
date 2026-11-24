const itemActions = {
    scroll: ["r", "reading", "Press 1 to select this scroll for Read."],
    potion: ["q", "quaffing", "Press 1 to select this potion for Quaff."],
    staff: ["u", "spending a charge", "Press 1 when choosing a staff to use."],
    wand: ["a", "spending a charge", "Press 1 when choosing a wand to aim."],
    rod: ["z", "zapping", "Press 1 when choosing a rod to zap."],
    food: ["E", "eating", "Press 1 when choosing food to eat."],
    mushroom: ["E", "eating", "Press 1 to select this mushroom for Eat."],
};

function itemHints(item, keyFor) {
    const rows = [];
    const use = "!" + keyFor("U");
    let title = "For this item";
    let example = "=g3 !d";

    const action = itemActions[item.type];
    if (action) {
        title = "For this " + item.type;
        const [original, verb, shortcut] = action;
        const key = keyFor(original);
        const guard = "!" + key + use;
        if (item.type === "rod") rows.push(["!!", "Notify when a rod in this stack recharges."]);
        rows.push([guard, "Ask before " + verb + ", including with Use."], ["@" + key + "1", shortcut]);
        example = item.type === "rod" ? "!! " + guard + " !d" : guard + " =g3 !d";
    } else if (["shot", "arrow", "bolt"].includes(item.type)) {
        title = "For this ammunition";
        const fire = keyFor("f");
        const slot = "@" + fire + "0";
        rows.push([slot, "Prefer quiver slot 0 for Fire."]);
        if (item.type === "shot") rows.push(["@v0", "Prefer slot 0 for Throw. The first slot tag takes priority."]);
        rows.push(["!" + fire + use, "Ask before firing with Fire or Use. Fire at nearest target skips this check."]);
        example = slot + " =g !d";
    } else if (item.wearable) {
        title = "For this equipment";
        if (item.activation) rows.push(["!!", "Notify when the activation recharges."],
            ["!A" + use, "Ask before activating, including with Use."]);
        if (item.throwing) rows.push(["@v0", "Prefer quiver slot 0 for Throw."]);
        if (item.type === "digger") rows.push(["^>", "Ask before going downstairs while this tool is equipped."]);
        rows.push([item.roguelike ? "!T!t" : "!t", "Ask before taking this item off or replacing it."],
            ["@w1", "Press 1 when choosing an item to wear or wield."]);
        if (item.fuel) rows.push(["!F", "Ask before using this lantern to refuel another."]);
        example = rows[0][0] + " !d";
    } else if (item.readable) {
        title = "For this book";
        const browse = "@" + keyFor("b") + "1";
        rows.push(["@m1", "Press 1 to select this book for Cast."],
            ["@G1", "Press 1 to select it for Study."], [browse, "Press 1 to select it for Browse."]);
        example = "@m1 @G1 " + browse;
    } else if (item.type === "flask") {
        title = "For this flask";
        rows.push(["@F1", "Press 1 when choosing fuel for your light."],
            ["!F", "Ask before using this oil as fuel."],
            ["@v0", "Prefer quiver slot 0 for Throw."], ["!v", "Ask before throwing this flask."]);
        example = "@F1 !F !d";
    } else if (item.type === "chest") {
        title = "For this chest";
        rows.push(["open later", "Leave yourself a note on this chest."]);
        example = "open later !g !k";
    }
    return { title, rows, example };
}

function textElement(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
}

function hintSection(title, rows) {
    const section = document.createElement("section");
    const list = document.createElement("dl");
    for (const [code, meaning] of rows) {
        const term = document.createElement("dt");
        term.append(textElement("code", code));
        list.append(term, textElement("dd", meaning));
    }
    section.append(textElement("h3", title), list);
    return section;
}

export function renderInscriptionHelp(panel, item, keyFor) {
    panel.replaceChildren();
    if (item.scope === "rune") {
        panel.append(textElement("p", "Adds this text to inscriptions on items with this rune. Include a space if you want a separator."));
        return;
    }
    if (item.scope === "kind") {
        panel.append(textElement("p", "Applies to uninscribed items of this kind when you carry them."));
    }
    const { title, rows, example } = itemHints(item, keyFor);
    if (rows.length) panel.append(hintSection(title, rows));

    const limit = item.type === "chest" ? "Limit automatic pickup. Chests are counted separately." :
        "Pick up enough to carry 3 matching items. Change 3 to your limit.";
    const pickup = hintSection("Pickup and protection", [
        ["=g3", limit], ["!d", "Ask before dropping this item. Drop All skips this check."],
    ]);
    if (item.pickupAlways) pickup.append(textElement("p", "Always pickup items is on and overrides pickup inscriptions."));

    const sample = document.createElement("section");
    sample.className = "inscription-example";
    sample.append(textElement("h3", "Example inscription"), textElement("code", example),
        textElement("p", "You can combine codes and your own notes in one line."));

    const other = [
        ["=g", "Automatically pick up this item."], ["!g", "Skip automatic pickup."],
        ["!k", "Keep this item visible when similar items are ignored."],
        ["@1", "Press 1 when a command asks for an item. Choose any digit from 0 to 9."],
        ["!*", "Ask before most actions that use this item."],
    ];
    if (item.equipped) other.push(["^*", "Ask before commands while this item is equipped."]);
    const more = hintSection("Other inscriptions", other);
    if (item.scope === "item") {
        more.append(textElement("p", "To mark future items of the same kind, use Auto-inscribe in Knowledge."));
    }
    panel.append(pickup, sample, more);
}
