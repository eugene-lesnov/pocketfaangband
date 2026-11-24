import { graphicsModes, renderTileMap, styleTerminalTile, tileAt } from "./tiles.js";

export function textColors(palette) {
    const colors = [];
    for (let offset = 0; offset < palette.length; offset += 4) {
        colors.push(`rgb(${palette[offset + 1]} ${palette[offset + 2]} ${palette[offset + 3]})`);
    }
    return colors;
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
                span.style.color = colors[attr];
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
    const colors = textColors(palette);
    const grid = { x, y, columns, rows };
    const graphics = graphicsModes.get(frame.graphicsMode);
    const tiles = graphics?.atlas && frame.terrainAttributes ? graphics : undefined;
    if (canvas) {
        canvas.hidden = !tiles;
        pre.hidden = !!tiles;
        if (tiles) {
            renderTileMap(canvas, tiles, frame, grid, colors);
            return { grid, gridElement: canvas };
        }
    }
    renderText(pre, frame, grid, colors, tiles);
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
                if (start !== cursor && !discovery) {
                    while (end < rowEnd && attributes[end] === attr && end !== cursor &&
                        !discoveries?.has(end) &&
                        (highlighted?.has(end) ?? false) === marked &&
                        !(tiles && tileAt(tiles, attr, codepoints[end]))) end++;
                }
                span.textContent = String.fromCodePoint(...codepoints.subarray(start, end));
                span.style.color = colors[attr % colors.length];
                switch (Math.floor(attr / backgroundStride)) {
                    case 1:
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
