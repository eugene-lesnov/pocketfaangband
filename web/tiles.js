export const graphicsModes = new Map([
    [0, { label: "ASCII" }],
    [1, { label: "Original Tiles", file: "original-tiles.png", size: 8 }],
    [2, { label: "Adam Bolt's tiles", file: "adam-bolt.png", size: 16 }],
    [3, { label: "David Gervais' tiles", file: "gervais.png", size: 32 }],
]);

export async function loadTiles(id) {
    const tiles = graphicsModes.get(id);
    if (!tiles.file || tiles.atlas) return;
    const atlas = new Image();
    atlas.src = new URL(tiles.file, import.meta.url).href;
    await atlas.decode();
    tiles.atlas = atlas;
}

export function tileAt({ atlas, size }, attr, codepoint) {
    if (!(attr & codepoint & 0x80)) return;
    const x = (codepoint & 0x7f) * size;
    const y = (attr & 0x7f) * size;
    if (x < atlas.naturalWidth && y < atlas.naturalHeight) return { x, y };
}

function terrainTile(tiles, frame, index) {
    const attr = frame.terrainAttributes[index];
    const codepoint = frame.terrainCodepoints[index];
    if (attr === frame.attributes[index] && codepoint === frame.codepoints[index]) return;
    return tileAt(tiles, attr, codepoint);
}

function backgroundPosition({ atlas, size }, tile) {
    return `${tile.x / (atlas.naturalWidth - size) * 100}% ${tile.y / (atlas.naturalHeight - size) * 100}%`;
}

export function styleTerminalTile(span, tiles, tile, frame, index) {
    const { atlas, size } = tiles;
    const terrain = frame && terrainTile(tiles, frame, index);
    const image = `url("${atlas.src}")`;
    span.classList.add("term-tile");
    span.style.backgroundImage = terrain ? `${image}, ${image}` : image;
    span.style.backgroundSize = `${atlas.naturalWidth / size * 100}% ${atlas.naturalHeight / size * 100}%`;
    const position = backgroundPosition(tiles, tile);
    span.style.backgroundPosition = terrain ? `${position}, ${backgroundPosition(tiles, terrain)}` : position;
}

function drawTile(context, { atlas, size }, tile, x, y) {
    context.drawImage(atlas, tile.x, tile.y, size, size, x, y, size, size);
}

export function renderTileMap(canvas, tiles, frame, grid, colors) {
    const { size } = tiles;
    const { x, y, columns, rows } = grid;
    const width = columns * size;
    const height = rows * size;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    canvas.style.setProperty("--columns", columns);
    canvas.style.setProperty("--rows", rows);

    const context = canvas.getContext("2d");
    const style = getComputedStyle(canvas);
    const cursorColor = style.getPropertyValue("--game-yellow");
    const discoveryColor = style.getPropertyValue("--game-light-blue");
    const cursorWidth = size / 16;
    context.clearRect(0, 0, width, height);
    context.font = `${size * 0.75}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = cursorWidth;
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const index = (y + row) * frame.width + x + column;
            const left = column * size;
            const top = row * size;
            const codepoint = frame.codepoints[index];
            const attr = frame.attributes[index];
            if (codepoint !== 32 && codepoint !== 0) {
                const terrain = terrainTile(tiles, frame, index);
                if (terrain) drawTile(context, tiles, terrain, left, top);
                const tile = tileAt(tiles, attr, codepoint);
                if (tile) {
                    drawTile(context, tiles, tile, left, top);
                } else {
                    context.fillStyle = colors[attr % colors.length];
                    context.fillText(String.fromCodePoint(codepoint), left + size / 2, top + size / 2);
                }
            }
            if (frame.highlighted?.has(index)) {
                context.fillStyle = cursorColor;
                context.globalAlpha = 0.3;
                context.fillRect(left, top, size, size);
                context.globalAlpha = 1;
            }
            if (index === frame.cursor || frame.discoveries?.has(index)) {
                context.strokeStyle = index === frame.cursor ? cursorColor : discoveryColor;
                context.strokeRect(left + cursorWidth / 2, top + cursorWidth / 2, size - cursorWidth, size - cursorWidth);
            }
        }
    }
}
