import argparse
import errno
import os
import re
import select
import signal
import subprocess
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


SCRIPT = Path(__file__).resolve()
PROJECT_DIR = SCRIPT.parent
HOST = "127.0.0.1"
PORT = 8768
URL = f"http://{HOST}:{PORT}/"


def is_pocketfaangband_server(pid):
    process = Path("/proc") / str(pid)
    if process.stat().st_uid != os.getuid():
        return False

    executable = (process / "exe").readlink()
    if not executable.name.startswith("python"):
        return False

    args = os.fsdecode((process / "cmdline").read_bytes()).split("\0")[1:-1]
    cwd = (process / "cwd").readlink()
    if args and not args[0].startswith("-") and (cwd / args[0]).resolve() == SCRIPT:
        return True

    legacy_command = ["-m", "http.server", str(PORT), "--bind", HOST, "--directory"]
    if not args or args[:-1] != legacy_command:
        return False

    directory = (cwd / args[-1]).resolve()
    return directory.parent == PROJECT_DIR and (
        directory.name == "dist" or directory.name.startswith("dist-")
    )


def find_listener():
    try:
        listeners = subprocess.run(
            ["ss", "-H", "-O", "-4", "-ltnpe", "src", f"{HOST}:{PORT}"],
            check=True,
            capture_output=True,
            text=True,
            errors="replace",
            timeout=3,
        ).stdout.splitlines()
    except FileNotFoundError:
        raise RuntimeError("Restarting the local server requires ss (iproute2).") from None
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Timed out finding the listener on {URL} with ss.") from None
    except subprocess.CalledProcessError:
        raise RuntimeError(f"Could not find the listener on {URL} with ss.") from None

    if not listeners:
        return None
    if len(listeners) != 1:
        raise RuntimeError(f"Multiple sockets are listening on {URL}.")

    owners = re.findall(r",pid=(\d+),fd=(\d+)\)", listeners[0])
    inode = re.search(r"\bino:(\d+)\b", listeners[0])
    if len(owners) != 1 or inode is None:
        raise RuntimeError(f"{URL} is already in use. Could not identify a single listener.")
    pid, fd = map(int, owners[0])
    return pid, fd, inode[1]


def stop_previous_server():
    if not hasattr(os, "pidfd_open") or not hasattr(signal, "pidfd_send_signal"):
        raise RuntimeError(f"Stop the server using {URL} and try again.")

    listener = find_listener()
    if listener is None:
        return

    pid, fd, inode = listener
    try:
        process = os.pidfd_open(pid)
    except ProcessLookupError:
        return
    try:
        if not is_pocketfaangband_server(pid):
            raise RuntimeError(f"{URL} is already in use by another process (PID {pid}).")
        if os.readlink(f"/proc/{pid}/fd/{fd}") != f"socket:[{inode}]":
            raise RuntimeError(f"The listener on {URL} changed. Try again.")
        signal.pidfd_send_signal(process, signal.SIGTERM)
        poller = select.poll()
        poller.register(process, select.POLLIN)
        if not poller.poll(5000):
            raise RuntimeError(f"The previous PocketFAangband server (PID {pid}) did not stop.")
        print(f"Stopped the previous PocketFAangband server (PID {pid}).", flush=True)
    except (FileNotFoundError, ProcessLookupError):
        pass
    finally:
        os.close(process)


def main():
    parser = argparse.ArgumentParser(description="Serve a local PocketFAangband build.")
    parser.add_argument(
        "directory", nargs="?", type=Path, default=PROJECT_DIR / "dist",
        help="build output directory (default: dist)",
    )
    directory = parser.parse_args().directory.resolve()
    if not all((directory / name).is_file() for name in ("index.html", "sw.js", "faangband.wasm")):
        parser.exit(1, f"No PocketFAangband build found in {directory}.\n")

    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    try:
        try:
            server = ThreadingHTTPServer((HOST, PORT), handler)
        except OSError as error:
            if error.errno != errno.EADDRINUSE:
                raise
            stop_previous_server()
            server = ThreadingHTTPServer((HOST, PORT), handler)
    except OSError as error:
        if error.errno == errno.EADDRINUSE:
            parser.exit(1, f"{URL} is already in use.\n")
        parser.exit(1, f"Could not open {URL} ({error}).\n")
    except RuntimeError as error:
        parser.exit(1, f"{error}\n")

    with server:
        print(f"Serving PocketFAangband from {directory} at {URL}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
