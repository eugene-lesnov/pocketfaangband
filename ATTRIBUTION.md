# Sources and licenses

PocketFAangband is distributed under the GNU General Public License, version 2 only. [COPYING](COPYING)

- The engine and game data come from FAangband 2.0.1. [FAangband source](https://github.com/NickMcConnell/FAangband/tree/c4ee2ce243cf0c7f6ced9004860d4fd08458d1b3)
- PocketFAangband adapts PocketAngband’s browser interface, engine adapter, and build scripts. [PocketAngband source](https://github.com/eugene-lesnov/pocketangband/tree/68da97d)
- FAangband supplies the Original 8×8 tiles and Adam Bolt’s 16×16 tiles. Adam Bolt permits use and redistribution with or without changes. [FAangband license and graphics credits](https://github.com/NickMcConnell/FAangband/blob/c4ee2ce243cf0c7f6ced9004860d4fd08458d1b3/docs/copying.rst)
- David Gervais’ 32×32 tiles are included unchanged. [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
- The WebAssembly build uses Emscripten 4.0.7. The release includes its runtime license notices. [Emscripten SDK](https://github.com/emscripten-core/emscripten/tree/4.0.7)
- PocketZot inspired the mobile controls and offline download flow. [PocketZot source](https://github.com/pocketzot/pocketzot)

To rebuild from the source archive, activate Emscripten 4.0.7 and run `bash build.sh` in the extracted directory. Start the game with `python3 serve.py`.
