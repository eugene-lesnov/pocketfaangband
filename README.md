# PocketFAangband

PocketFAangband brings First Age Angband, a single-player roguelike set in Tolkien’s First Age, to iPhone and Android. Buy supplies in your home town, follow the paths through the forests of Beleriand, and venture into the Pits of Angband. Morgoth waits on the hundredth level.

The game runs in your browser. Play in portrait with touch controls and choose between classic ASCII and graphical tiles. After the first download, you can play offline.

## Play on GitHub Pages

1. Open the game on your phone and let the first download finish. [Play PocketFAangband](https://eugene-lesnov.github.io/pocketfaangband/)
2. Create a character or choose a saved one. To launch the game from your home screen, use the browser menu or the share sheet.
3. When you’re ready to stop, choose **Menu → Save and quit**. Your character stays in that browser. Clearing the site’s data also clears your saves.

## Run a release locally

Download `pocketfaangband-web.zip` from [GitHub Releases](https://github.com/eugene-lesnov/pocketfaangband/releases). From the download directory, unpack it into a fresh `dist/` folder and start a local server with Python 3.

```sh
python3 -m zipfile -e pocketfaangband-web.zip dist
python3 -m http.server 8768 --bind 127.0.0.1 --directory dist
```

[Open PocketFAangband locally](http://127.0.0.1:8768/).

## Build and run locally

On Linux, install Git, Bash, GNU Make, GNU tar, `flock` (util-linux) and Python 3.11 or newer, then activate Emscripten 4.0.7. [Emscripten setup instructions](https://emscripten.org/docs/tools_reference/emsdk.html#how-do-i-install-a-specific-version)

```sh
git clone https://github.com/eugene-lesnov/pocketfaangband.git
cd pocketfaangband
bash build.sh
python3 serve.py
```

The first build downloads the pinned FAangband revision into `.cache/faangband.git`. Later builds reuse it offline. If you already have that revision locally, you can pass its repository path to `bash build.sh /path/to/FAangband`. The release source archive includes the engine sources. Build into an empty or absent `dist/` folder.

[Sources and licenses](ATTRIBUTION.md) 
