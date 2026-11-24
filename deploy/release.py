import argparse
import base64
import hashlib
import json
import re
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


RELEASE_FILES = ("pocketfaangband-web.zip", "pocketfaangband-source.tar.gz", "SHA256SUMS")
BOOTSTRAP_FILES = ("index.html", "manifest.webmanifest", "sw.js")
HEX = "[0-9a-f]{64}"
ASSET_NAME = r"[a-z0-9][a-z0-9.-]*"
PACKAGE_PATH = re.compile(rf"packages/({HEX})/({ASSET_NAME})")
ASSET_PATH = re.compile(ASSET_NAME)
WORKER_PATH = re.compile(rf"sw-({HEX})\.js")
MAX_SITE_SIZE = 900 * 1024 * 1024


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def file_hash(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def asset_record(data):
    return {"size": len(data), "hash": base64.b64encode(hashlib.sha256(data).digest()).decode("ascii")}


def write_file(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as stream:
        stream.write(data)


def write_zip(folder, archive):
    with ZipFile(archive, "x", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in sorted(folder.rglob("*")):
            if path.is_file():
                member = ZipInfo(path.relative_to(folder).as_posix())
                member.external_attr = 0o100644 << 16
                bundle.writestr(member, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)


def pack(site, source, output, release_name):
    source_hash = file_hash(source)
    template = (site / "sw.js").read_text(encoding="utf-8")
    licenses = site / "licenses.html"
    licenses_html = licenses.read_text(encoding="utf-8")
    if licenses_html.count("__SOURCE_ARCHIVE__") != 1:
        raise ValueError("Expected one source archive link in licenses.html.")
    licenses.write_text(licenses_html.replace("__SOURCE_ARCHIVE__", source_hash + ".tar.gz"), encoding="utf-8")
    assets = {path.name: asset_record(path.read_bytes()) for path in sorted(site.iterdir()) if path.name != "sw.js"}
    inventory = json.dumps(assets, indent=4)
    version = sha256((template + inventory).encode("utf-8"))
    (site / "sw.js").write_text(template.replace("__ASSETS__", inventory).replace("__VERSION__", version), encoding="utf-8")

    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix=".pocketfaangband-", dir=output.parent) as temporary:
        staging = Path(temporary)
        web = staging / "web"
        package = web / "packages" / version
        package.mkdir(parents=True)
        for path in sorted(site.iterdir()):
            shutil.copyfile(path, web / path.name)
            if path.name != "sw.js":
                shutil.copyfile(path, package / path.name)
        shutil.copyfile(site / "sw.js", web / f"sw-{version}.js")
        update = {"version": version, "release": release_name}
        write_file(web / "update.json", (json.dumps(update) + "\n").encode("utf-8"))

        write_zip(web, staging / RELEASE_FILES[0])
        release = web / "release"
        release.mkdir()
        (staging / RELEASE_FILES[0]).rename(release / RELEASE_FILES[0])
        shutil.copyfile(source, release / RELEASE_FILES[1])
        (release / RELEASE_FILES[2]).write_text("".join(
            f"{file_hash(release / name)}  {name}\n" for name in RELEASE_FILES[:2]), encoding="ascii")

        archive = web / "sources" / f"{source_hash}.tar.gz"
        archive.parent.mkdir()
        shutil.copyfile(source, archive)
        output.mkdir(exist_ok=True)
        if output.is_symlink() or any(output.iterdir()):
            raise ValueError(f"Build output must be an empty directory: {output}")
        web.replace(output)
    print(f"Package {version}: {sum(asset['size'] for asset in assets.values()):,} bytes")
    print(f"GitHub Release assets: {output / 'release'}")


def read_release(download):
    sums = (download / RELEASE_FILES[2]).read_text(encoding="ascii").splitlines()
    expected = [f"{file_hash(download / name)}  {name}" for name in RELEASE_FILES[:2]]
    if sums != expected:
        raise ValueError(f"Checksums do not match in {download}.")
    return download / RELEASE_FILES[0], expected[1].split()[0]


def unpack_release(download, site, current):
    archive, source_hash = read_release(download)
    version = None
    package_assets = {}
    root_assets = {}
    worker = None
    versioned_worker = None
    update = None
    with ZipFile(archive) as bundle:
        if len(set(bundle.namelist())) != len(bundle.infolist()):
            raise ValueError(f"Duplicate entries in {archive}.")
        for member in bundle.infolist():
            name = member.filename
            package = PACKAGE_PATH.fullmatch(name)
            if not (package or ASSET_PATH.fullmatch(name)):
                raise ValueError(f"Unexpected entry in {archive}: {name}")
            data = bundle.read(member)
            if package:
                if version is not None and package[1] != version:
                    raise ValueError(f"Multiple game packages in {archive}.")
                version = package[1]
                package_assets[package[2]] = asset_record(data)
                if name.endswith("/licenses.html"):
                    if f"sources/{source_hash}.tar.gz".encode("ascii") not in data:
                        raise ValueError(f"Source archive does not match the game package in {archive}.")
                target = site / name
                if target.exists():
                    if target.read_bytes() != data:
                        raise ValueError(f"Immutable package file changed: {name}")
                else:
                    write_file(target, data)
            else:
                if name == "sw.js":
                    worker = data.decode("utf-8")
                elif WORKER_PATH.fullmatch(name):
                    if versioned_worker is not None:
                        raise ValueError(f"Multiple versioned workers in {archive}.")
                    versioned_worker = name, data
                    target = site / name
                    if target.exists():
                        if target.read_bytes() != data:
                            raise ValueError(f"Immutable worker file changed: {name}")
                    else:
                        write_file(target, data)
                    continue
                elif name == "update.json":
                    update = json.loads(data)
                    if not isinstance(update, dict):
                        raise ValueError(f"Invalid update metadata in {archive}.")
                else:
                    root_assets[name] = asset_record(data)
                if current:
                    write_file(site / name, data)

    if not worker or version is None or "licenses.html" not in package_assets or not all(
        name in root_assets for name in BOOTSTRAP_FILES if name != "sw.js"
    ):
        raise ValueError(f"Missing game package or bootstrap files in {archive}.")
    inventory = re.match(r'const assets = (\{.*?\});\nconst version = "([0-9a-f]{64})";', worker, re.DOTALL)
    if not inventory or inventory[2] != version or json.loads(inventory[1]) != package_assets or package_assets != root_assets:
        raise ValueError(f"Service worker inventory, bootstrap and game package disagree in {archive}.")
    if versioned_worker is not None or update is not None:
        if (
            versioned_worker != (f"sw-{version}.js", worker.encode("utf-8"))
            or update is None or update.get("version") != version
            or not isinstance(update.get("release"), str) or not update["release"]
        ):
            raise ValueError(f"Versioned worker and update metadata disagree in {archive}.")
    target = site / "sources" / f"{source_hash}.tar.gz"
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        with (download / RELEASE_FILES[1]).open("rb") as source, target.open("xb") as destination:
            shutil.copyfileobj(source, destination)
    return version


def pages(output, selected, retained):
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix=".pocketfaangband-", dir=output.parent) as temporary:
        site = Path(temporary) / "site"
        version = unpack_release(selected, site, current=True)
        for download in retained:
            unpack_release(download, site, current=False)
        if sum(path.stat().st_size for path in site.rglob("*") if path.is_file()) > MAX_SITE_SIZE:
            raise ValueError("The site exceeds the release size budget. Review retained releases before deploying.")
        if output.exists() or output.is_symlink():
            raise ValueError(f"Pages output already exists: {output}")
        site.rename(output)
    print(f"Ready to publish {version} from {output}")


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    builder = commands.add_parser("pack")
    for name in ("site", "source", "output"):
        builder.add_argument(name, type=Path)
    builder.add_argument("release_name")
    publisher = commands.add_parser("pages")
    publisher.add_argument("output", type=Path)
    publisher.add_argument("selected", type=Path)
    publisher.add_argument("retained", nargs="*", type=Path)
    args = parser.parse_args()
    if args.command == "pack":
        pack(args.site, args.source, args.output, args.release_name)
    else:
        pages(args.output, args.selected, args.retained)


if __name__ == "__main__":
    main()
