function rect(left, top, right, bottom) {
    return { left, top, right, bottom };
}

function overlaps(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function visible(cell, screen, controls) {
    return cell.left >= screen.left && cell.right <= screen.right &&
        cell.top >= screen.top && cell.bottom <= screen.bottom && !controls.some(box => overlaps(cell, box));
}

function nearestOffset(cells, screen, controls, limits = rect(-Infinity, -Infinity, Infinity, Infinity)) {
    const left = Math.max(limits.left, ...cells.map(cell => screen.left - cell.left));
    const right = Math.min(limits.right, ...cells.map(cell => screen.right - cell.right));
    const top = Math.max(limits.top, ...cells.map(cell => screen.top - cell.top));
    const bottom = Math.min(limits.bottom, ...cells.map(cell => screen.bottom - cell.bottom));
    if (left > right || top > bottom) return;

    const xs = new Set([Math.max(left, Math.min(0, right))]);
    const ys = new Set([Math.max(top, Math.min(0, bottom))]);
    const collisions = [];
    for (const cell of cells) {
        for (const box of controls) {
            const hit = rect(box.left - cell.right, box.top - cell.bottom,
                box.right - cell.left, box.bottom - cell.top);
            if (hit.right <= left || hit.left >= right || hit.bottom <= top || hit.top >= bottom) continue;
            collisions.push(hit);
            if (hit.left >= left) xs.add(hit.left);
            if (hit.right <= right) xs.add(hit.right);
            if (hit.top >= top) ys.add(hit.top);
            if (hit.bottom <= bottom) ys.add(hit.bottom);
        }
    }
    const byDistance = (a, b) => Math.abs(a) - Math.abs(b);
    const vertical = [...ys].sort(byDistance);
    let best;
    for (const x of [...xs].sort(byDistance)) {
        if (best && x * x >= best.distance) break;
        const spans = collisions.filter(hit => x > hit.left && x < hit.right);
        const y = vertical.find(y => !spans.some(hit => y > hit.top && y < hit.bottom));
        if (y === undefined) continue;
        const distance = x * x + y * y;
        if (!best || distance < best.distance) best = { x, y, distance };
    }
    return best;
}

function placeArrow(button, target, screen, controls, protectedCells) {
    button.hidden = false;
    const width = button.offsetWidth, height = button.offsetHeight;
    const x = (target.left + target.right) / 2, y = (target.top + target.bottom) / 2;
    const start = rect(x - width / 2, y - height / 2, x + width / 2, y + height / 2);
    const { left, top, right, bottom } = screen;
    const edges = [
        ["left", rect(left, top, left + width, bottom)],
        ["right", rect(right - width, top, right, bottom)],
        ["top", rect(left, top, right, top + height)],
        ["bottom", rect(left, bottom - height, right, bottom)],
    ];
    let best;
    for (const obstacles of [[...controls, ...protectedCells], controls]) {
        for (const [edge, bounds] of edges) {
            const offset = nearestOffset([start], bounds, obstacles);
            if (offset && (!best || offset.distance < best.distance)) best = { ...offset, edge };
        }
        if (best) break;
    }
    if (!best) {
        button.hidden = true;
        return;
    }
    button.style.left = `${start.left + best.x}px`;
    button.style.top = `${start.top + best.y}px`;
    button.dataset.edge = best.edge;
    button.querySelector("svg").style.transform = `rotate(${Math.atan2(-best.y, -best.x)}rad)`;
}

export class ExploreCamera {
    constructor(button, controls, draw) {
        this.button = button;
        this.controls = controls;
        this.reset();
        button.addEventListener("click", () => {
            if (button.hidden) return;
            this.reveal = this.target;
            this.first = this.target + 1;
            draw();
        });
    }

    reset() {
        this.framed = false;
        this.first = 0;
        this.reveal = undefined;
        this.button.hidden = true;
    }

    update(view, discoveries) {
        const { viewport, gridElement, grid } = view;
        const origin = viewport.getBoundingClientRect();
        const surface = gridElement.getBoundingClientRect();
        const width = surface.width / grid.columns, height = surface.height / grid.rows;
        const screen = rect(0, 0, viewport.clientWidth, viewport.clientHeight);
        const boxes = this.controls.filter(control => !control.hidden).map(control => {
            const box = control.getBoundingClientRect();
            return rect(Math.floor(box.left - origin.left), Math.floor(box.top - origin.top),
                Math.ceil(box.right - origin.left), Math.ceil(box.bottom - origin.top));
        }).filter(box => box.right > box.left && box.bottom > box.top && overlaps(box, screen));
        const cellRect = (x, y) => {
            const left = surface.left - origin.left + x * width, top = surface.top - origin.top + y * height;
            return rect(Math.floor(left), Math.floor(top), Math.ceil(left + width), Math.ceil(top + height));
        };
        const hero = cellRect(view.frame.player.x, view.frame.player.y);
        const marks = [...discoveries].map(index => cellRect(index % grid.columns, Math.floor(index / grid.columns)));
        const cells = [hero, ...marks];
        let focus = this.framed ? [] : cells;
        if (marks[this.reveal]) focus = [marks[this.reveal]];
        this.framed = true;
        this.reveal = undefined;
        if (focus.some(cell => !visible(cell, screen, boxes))) {
            const marginX = Math.ceil(width), marginY = Math.ceil(height);
            const padded = rect(marginX, marginY, screen.right - marginX, screen.bottom - marginY);
            const beforeX = viewport.scrollLeft, beforeY = viewport.scrollTop;
            const limits = rect(beforeX + screen.right - viewport.scrollWidth,
                beforeY + screen.bottom - viewport.scrollHeight, beforeX, beforeY);
            const offset = nearestOffset(focus, padded, boxes, limits) ?? nearestOffset(focus, screen, boxes, limits) ??
                nearestOffset([hero], screen, boxes, limits);
            if (offset && (offset.x || offset.y)) {
                viewport.scrollBy(-offset.x, -offset.y);
                const dx = beforeX - viewport.scrollLeft, dy = beforeY - viewport.scrollTop;
                for (const cell of cells) {
                    cell.left += dx;
                    cell.right += dx;
                    cell.top += dy;
                    cell.bottom += dy;
                }
            }
        }
        for (let i = 0; i < marks.length; i++) {
            const index = (this.first + i) % marks.length;
            if (visible(marks[index], screen, boxes)) continue;
            placeArrow(this.button, marks[index], screen, boxes, cells.filter(cell => visible(cell, screen, boxes)));
            this.target = index;
            return;
        }
        this.button.hidden = true;
    }
}
