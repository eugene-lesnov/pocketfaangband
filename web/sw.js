const assets = __ASSETS__;
const version = "__VERSION__";
const scope = new URL(self.registration.scope);
const cachePrefix = `pocketfaangband:${encodeURIComponent(scope.href)}:`;
const cacheName = cachePrefix + version;
const legacyWorker = self.location.href === new URL("sw.js", scope).href;
const installedPackageUrl = new URL("installed-package.json", scope);

async function cacheAsset(cache, path, installation) {
    const key = new URL(path, scope);
    const cached = await cache.match(key, { ignoreVary: true });
    if (cached) {
        if (installation) return installation.reportProgress(assets[path].size);
        return cached;
    }

    const url = new URL(`packages/${version}/${path}`, scope);
    const response = await fetch(url, {
        cache: "reload",
        mode: "same-origin",
        redirect: "error",
        signal: installation?.signal,
    });
    if (response.status !== 200 || !response.body) {
        throw new Error(`Could not download ${path} (HTTP ${response.status}).`);
    }

    const bytes = new Uint8Array(assets[path].size);
    const reader = response.body.getReader();
    let offset = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (offset + value.byteLength > bytes.byteLength) {
                throw new Error(`Unexpected size for ${path}.`);
            }
            bytes.set(value, offset);
            offset += value.byteLength;
            if (installation) await installation.reportProgress(value.byteLength);
        }
    } catch (error) {
        void reader.cancel().catch(() => {});
        throw error;
    } finally {
        reader.releaseLock();
    }

    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));
    if (offset !== bytes.byteLength || hash !== assets[path].hash) {
        throw new Error(`The downloaded copy of ${path} does not match this version.`);
    }

    const headers = new Headers(response.headers);
    headers.delete("Content-Encoding");
    headers.set("Content-Length", String(bytes.byteLength));
    const asset = new Response(bytes, { headers });
    if (installation) return cache.put(key, asset);
    await cache.put(key, asset.clone());
    return asset;
}

async function downloadPackage() {
    const cache = await caches.open(cacheName);
    const paths = Object.keys(assets);
    const total = paths.reduce((sum, path) => sum + assets[path].size, 0);
    const abort = new AbortController();
    let timeout;
    let loaded = 0;
    let percent = 0;

    function resetTimeout() {
        clearTimeout(timeout);
        timeout = setTimeout(() => abort.abort(), 60_000);
    }

    async function reportProgress(bytes) {
        resetTimeout();
        loaded += bytes;
        const next = Math.min(99, Math.floor(100 * loaded / total));
        if (next <= percent) return;
        percent = next;
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
            if (client.url.startsWith(scope.href)) {
                client.postMessage({ type: "pocketfaangband-download", percent: next });
            }
        }
    }

    resetTimeout();
    try {
        const installation = { signal: abort.signal, reportProgress };
        await Promise.all(paths.map((path) => cacheAsset(cache, path, installation)));
    } catch (error) {
        abort.abort();
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        if (legacyWorker && self.registration.active && await caches.match(installedPackageUrl)) {
            throw new Error("Switch to a versioned worker to update PocketFAangband.");
        }
        await downloadPackage();
    })());
});

self.addEventListener("message", (event) => {
    const { source, ports: [reply] } = event;
    if (event.data?.type !== "pocketfaangband-apply-update" || !reply || !source?.url?.startsWith(scope.href)) return;
    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        if (windows.some((client) => client.id !== source.id && client.url.startsWith(scope.href))) {
            reply.postMessage("other-windows");
        } else if (windows.some((client) => client.id === source.id)) {
            await self.skipWaiting();
        }
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        if (legacyWorker) {
            const cache = await caches.open(cacheName);
            await cache.put(installedPackageUrl, Response.json({ version }));
        }
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names
            .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
            .map((name) => caches.delete(name)));
    })());
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET" || !request.url.startsWith(scope.href)) return;
    const path = new URL(request.url).pathname.slice(scope.pathname.length) || "index.html";
    if (path === "installed-package.json") {
        event.respondWith(Response.json({ version }));
        return;
    }
    if (!Object.hasOwn(assets, path)) return;
    event.respondWith(caches.open(cacheName).then((cache) => cacheAsset(cache, path)));
});
