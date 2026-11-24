#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd -- "$(dirname -- "$0")" && pwd)
output_dir=${2:-"$project_dir/dist"}
[[ $output_dir = /* ]] || output_dir="$PWD/$output_dir"
source "$project_dir/engine/versions.sh"
faangband_patch_date=2026-11-24

pocketfaangband_version=${3:-dev}
if [[ -z ${3:-} && -f "$project_dir/VERSION" ]]; then
    pocketfaangband_version=$(<"$project_dir/VERSION")
fi
if [[ $pocketfaangband_version != dev && ! $pocketfaangband_version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$ ]]; then
    printf 'Invalid PocketFAangband version: %s\n' "$pocketfaangband_version" >&2
    exit 1
fi

if [[ -L $output_dir ]] || [[ -e $output_dir && ( ! -d $output_dir || -n $(ls -A -- "$output_dir") ) ]]; then
    printf 'Choose an empty build output directory: %s\n' "$output_dir" >&2
    exit 1
fi

if ! command -v emcc >/dev/null || [[ $(emcc -dumpversion) != "$emscripten_version" ]]; then
    printf 'Activate Emscripten %s before building PocketFAangband.\n' "$emscripten_version" >&2
    exit 1
fi
emscripten_dir=$(em-config EMSCRIPTEN_ROOT)

build_dir=$(mktemp -d)
trap 'rm -rf -- "$build_dir"' EXIT
source_dir="$build_dir/pocketfaangband-source"
mkdir -p "$source_dir"/{faangband,deploy,engine,web,emscripten}
cp "$project_dir"/{build.sh,serve.py,COPYING,ATTRIBUTION.md} "$source_dir/"
cp "$project_dir"/deploy/release.py "$source_dir/deploy/"
cp "$project_dir"/engine/{faangband-web.patch,main-web.c,versions.sh} "$source_dir/engine/"
cp "$project_dir"/web/{index.html,licenses.html,manifest.webmanifest,icon.svg,icon-192.png,icon-512.png,style.css,theme.js,terminal.js,inscriptions.js,frame-renderer.js,explore-camera.js,tiles.js,offline.js,engine-worker.js,sw.js} "$source_dir/web/"
printf '%s\n' "$pocketfaangband_version" > "$source_dir/VERSION"

if [[ -z ${1:-} && -f "$project_dir/faangband/docs/copying.rst" ]]; then
    cp -R "$project_dir/faangband/." "$source_dir/faangband/"
else
    faangband_repo=${1:-"$project_dir/.cache/faangband.git"}
    if [[ -z ${1:-} ]]; then
        mkdir -p -- "$faangband_repo"
        (
            flock --exclusive 9
            pin_ref="refs/pins/$faangband_revision"
            if [[ ! -f "$faangband_repo/HEAD" ]]; then
                git init --quiet --bare "$faangband_repo"
            fi
            if ! git --git-dir="$faangband_repo" show-ref --verify --quiet "$pin_ref"; then
                git --git-dir="$faangband_repo" fetch --no-tags --depth=1 \
                    https://github.com/NickMcConnell/FAangband.git "$faangband_revision:$pin_ref"
            fi
        ) 9<"$faangband_repo"
    fi
    git -C "$faangband_repo" archive "$faangband_revision" -- \
        ':(glob)src/*.c' ':(glob)src/*.h' src/Makefile.src src/Makefile.inc ':!src/main-*.c' ':!src/snd-sdl.c' \
        ':(glob)lib/gamedata/*.txt' ':(glob)lib/customize/*.prf' \
        ':(glob)lib/ghost/bone.*' ':(glob)lib/screens/*.txt' ':(glob)lib/help/*.txt' lib/tiles/list.txt \
        ':(glob)lib/tiles/'{old,adam-bolt,gervais}'/*.prf' \
        lib/tiles/{old/8x8,adam-bolt/16x16,gervais/32x32}.png docs/{copying,command,option,playing}.rst \
        | tar -xf - -C "$source_dir/faangband"

    (
        cd -- "$source_dir/faangband"
        patch="$source_dir/engine/faangband-web.patch"
        git apply "$patch"
        notice="Modified by PocketFAangband on $faangband_patch_date for the mobile port, based on PocketAngband."
        git apply --numstat "$patch" | while IFS=$'\t' read -r added removed path; do
            case "$path" in
                src/Makefile.inc) printf '# %s\n\n' "$notice" > "$path.noticed" ;;
                src/*) printf '/* %s */\n\n' "$notice" > "$path.noticed" ;;
                docs/*) printf '.. %s\n\n' "$notice" > "$path.noticed" ;;
                lib/help/*) printf '\n%s\n' "$notice" >> "$path"; continue ;;
            esac
            cat "$path" >> "$path.noticed"
            mv -- "$path.noticed" "$path"
        done
    )
fi

tar -C "$emscripten_dir" --exclude=__pycache__ --exclude=test --exclude=tests -cf - \
    LICENSE AUTHORS src system/include system/lib/{libc,compiler-rt,pthread,dlmalloc.c} \
    tools/{file_packager.py,system_libs.py} | tar -xf - -C "$source_dir/emscripten"

cd -- "$build_dir"
tar --format=gnu --sort=name --mtime=@0 --numeric-owner --owner=0 --group=0 \
    --mode='u+rw,go+r,go-w,a+X' -cf - pocketfaangband-source | gzip -n > source.tar.gz

mkdir site
cp "$source_dir"/web/* site/
sed -i "s/__POCKETFAANGBAND_VERSION__/$pocketfaangband_version/" site/{index,licenses}.html
cp "$source_dir/COPYING" site/gpl-2.0.txt
cp "$source_dir/emscripten/LICENSE" site/emscripten-license.txt
cp "$source_dir/emscripten/AUTHORS" site/emscripten-authors.txt
cp "$source_dir/emscripten/system/lib/libc/musl/COPYRIGHT" site/musl-copyright.txt
cp "$source_dir/emscripten/system/lib/compiler-rt/LICENSE.TXT" site/compiler-rt-license.txt

cd -- "$source_dir/faangband"
cp "$source_dir/engine/main-web.c" src/main-web.c
cp docs/copying.rst "$build_dir/site/faangband-copying.txt"
sed -i '/^name:4:/,$d' lib/tiles/list.txt
mv lib/tiles/old/8x8.png "$build_dir/site/original-tiles.png"
mv lib/tiles/adam-bolt/16x16.png "$build_dir/site/adam-bolt.png"
mv lib/tiles/gervais/32x32.png "$build_dir/site/gervais.png"

object_list=$(make -s --no-print-directory -f src/Makefile.src -f - pocketfaangband_objects <<'MAKE'
pocketfaangband_objects:
	@printf '%s\n' '$(filter-out borg/%,$(ANGFILES) $(ZFILES))'
MAKE
)
read -r -a objects <<< "$object_list"
sources=("${objects[@]/%.o/.c}")
sources=("${sources[@]/#/src/}")

emcc -O2 -Isrc -DBUILD_ID="$faangband_version" \
    -DPRIVATE_USER_PATH='"/pocketfaangband-profile"' -DUSE_PRIVATE_PATHS \
    -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=worker -sEXIT_RUNTIME=1 \
    -sASYNCIFY -sASYNCIFY_STACK_SIZE=65536 -sALLOW_MEMORY_GROWTH \
    -sINVOKE_RUN=0 -sEXPORTED_RUNTIME_METHODS=FS,IDBFS,callMain -lidbfs.js \
    -sEMIT_EMSCRIPTEN_LICENSE=1 --preload-file lib@/lib \
    "${sources[@]}" src/main.c src/main-web.c -o faangband.js

cp faangband.js faangband.wasm faangband.data "$build_dir/site/"
python3 "$source_dir/deploy/release.py" pack "$build_dir/site" "$build_dir/source.tar.gz" "$output_dir" "$pocketfaangband_version"
