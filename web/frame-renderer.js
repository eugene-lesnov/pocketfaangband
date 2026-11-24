import { graphicsModes, renderTileMap, styleTerminalTile, tileAt } from "./tiles.js";

const gameColorNames = new Map([
    [0x000000, "dark"], [0xffffff, "white"], [0x808080, "slate"], [0xff8000, "orange"],
    [0xc00000, "red"], [0x008040, "green"], [0x0040ff, "blue"], [0x804000, "umber"],
    [0x606060, "light-dark"], [0xc0c0c0, "light-slate"], [0xff00ff, "light-purple"],
    [0xffff00, "yellow"], [0xff4040, "light-red"], [0x00ff00, "light-green"],
    [0x00ffff, "light-blue"], [0xc08040, "light-umber"], [0x900090, "purple"],
    [0x9020ff, "violet"], [0x00a0a0, "teal"], [0x6c6c30, "mud"], [0xffff90, "light-yellow"],
    [0xff00a0, "magenta"], [0x20ffdc, "light-teal"], [0xb8a8ff, "light-violet"],
    [0xff8080, "light-pink"], [0xb4b400, "mustard"], [0xa0c0d0, "blue-slate"],
    [0x00b0ff, "deep-light-blue"], [0x282828, "shade"], [0x004020, "dark-green"],
]);

function gameColor(hex) {
    if (!hex || !hex.startsWith("#")) return hex;
    const name = gameColorNames.get(parseInt(hex.slice(1), 16));
    return name ? `var(--game-${name})` : hex;
}

function readableInk(color) {
    if (!color || !color.startsWith("var(--game-")) return color;
    if (color === "var(--game-white)") return "var(--text)";
    if (["var(--game-dark)", "var(--game-light-dark)", "var(--game-shade)"].includes(color)) return "var(--muted)";
    return `color-mix(in srgb, ${color} 70%, var(--text))`;
}

export function gameTextColor(hex) {
    return readableInk(gameColor(hex));
}

export function textColors(palette, canvasStyle) {
    const colors = [];
    for (let offset = 0; offset < palette.length; offset += 4) {
        const red = palette[offset + 1], green = palette[offset + 2], blue = palette[offset + 3];
        const name = gameColorNames.get((red << 16) | (green << 8) | blue);
        if (!name) colors.push(`rgb(${red} ${green} ${blue})`);
        else if (canvasStyle) colors.push(canvasStyle.getPropertyValue(`--game-${name}`));
        else colors.push(`var(--game-${name})`);
    }
    return colors;
}

export function styleGlyph(element, ink) {
    const color = gameColor(ink);
    if (color === "var(--game-white)") element.classList.add("white-glyph");
    else element.style.color = color;
}

function whiteGlyphClass(codepoint) {
    switch (codepoint) {
        case 0: case 32: return "";
        case 46: case 183: return "floor-glyph";
        case 35: return "wall-glyph";
        default: return "white-glyph";
    }
}

export function renderDescription(element, description) {
    if (element.renderedDescription === description) return;
    element.renderedDescription = description;
    if (typeof description === "string") {
        element.textContent = description;
    } else {
        const { codepoints, attributes, graphicsMode, palette } = description;
        const colors = textColors(palette);
        const tiles = graphicsModes.get(graphicsMode);
        const fragment = document.createDocumentFragment();
        for (let start = 0; start < codepoints.length;) {
            const attr = attributes[start];
            const span = document.createElement("span");
            let end = start + 1;
            if (attr & 0x80) {
                const tile = tiles?.atlas && tileAt(tiles, attr, codepoints[start]);
                if (tile) styleTerminalTile(span, tiles, tile);
                span.setAttribute("aria-hidden", "true");
            } else {
                while (end < codepoints.length && attributes[end] === attr && end - start < 4096) end++;
                span.textContent = String.fromCodePoint(...codepoints.subarray(start, end));
                span.style.color = readableInk(colors[attr]);
            }
            fragment.append(span);
            start = end;
        }
        element.replaceChildren(fragment);
    }
    element.scrollTop = 0;
}

export function renderFrame({ pre, canvas }, frame, region = {}) {
    const { width, height, palette } = frame;
    const { x = 0, y = 0, width: columns = width, height: rows = height } = region;
    const grid = { x, y, columns, rows };
    const graphics = graphicsModes.get(frame.graphicsMode);
    const tiles = graphics?.atlas && frame.terrainAttributes ? graphics : undefined;
    if (canvas) {
        canvas.hidden = !tiles;
        pre.hidden = !!tiles;
        if (tiles) {
            renderTileMap(canvas, tiles, frame, grid, textColors(palette, getComputedStyle(canvas)));
            return { grid, gridElement: canvas };
        }
    }
    renderText(pre, frame, grid, textColors(palette), tiles);
    return { grid, gridElement: pre };
}

function renderText(pre, frame, grid, colors, tiles) {
    const { width, codepoints, attributes, backgroundStride, shade, cursor, highlighted, discoveries } = frame;
    const { x, y, columns, rows } = grid;
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < rows; row++) {
        const line = document.createElement("div");
        line.className = "term-line";
        const rowStart = (row + y) * width + x;
        const rowEnd = rowStart + columns;
        for (let start = rowStart; start < rowEnd;) {
            const attr = attributes[start];
            const span = document.createElement("span");
            const marked = highlighted?.has(start) ?? false;
            const discovery = discoveries?.has(start);
            const tile = tiles && tileAt(tiles, attr, codepoints[start]);
            let end = start + 1;
            if (tile) {
                styleTerminalTile(span, tiles, tile, frame, start);
            } else {
                const color = colors[attr % colors.length];
                const background = Math.floor(attr / backgroundStride);
                const white = !background && color === "var(--game-white)";
                const glyphClass = white && whiteGlyphClass(codepoints[start]);
                if (start !== cursor && !discovery) {
                    while (end < rowEnd && attributes[end] === attr && end !== cursor &&
                        !discoveries?.has(end) &&
                        (highlighted?.has(end) ?? false) === marked &&
                        (!white || whiteGlyphClass(codepoints[end]) === glyphClass) &&
                        !(tiles && tileAt(tiles, attr, codepoints[end]))) end++;
                }
                span.textContent = String.fromCodePoint(...codepoints.subarray(start, end));
                if (glyphClass) span.classList.add(glyphClass);
                else span.style.color = color;
                switch (background) {
                    case 1:
                        if (color === "var(--game-white)") {
                            span.style.color = "color-mix(in srgb, var(--wall) 80%, var(--text))";
                        }
                        span.style.backgroundColor = span.style.color;
                        break;
                    case 2:
                        span.style.backgroundColor = colors[shade];
                        break;
                }
            }
            if (start === cursor) span.classList.add("cursor");
            if (marked) span.classList.add("highlighted-cell");
            if (discovery) span.classList.add("explore-discovery");
            line.append(span);
            start = end;
        }
        fragment.append(line);
    }
    pre.replaceChildren(fragment);
}
