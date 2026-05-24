#!/usr/bin/env python3
"""Extract rough visible text from HWP 5 files for source snapshot review.

This is not a full HWP table parser. It is intended to make downloaded official
HWP appendices searchable and checksum-able while structured ingestion uses a
dedicated source parser or Customs OpenAPI.
"""

from __future__ import annotations

import argparse
import re
import sys
import zlib
from pathlib import Path

try:
    import olefile
except ImportError as error:  # pragma: no cover - dependency guard for local ops
    raise SystemExit("Install dependency first: python3 -m pip install olefile") from error


def extract_hwp_text(path: Path) -> str:
    ole = olefile.OleFileIO(str(path))
    header = ole.openstream("FileHeader").read()
    compressed = bool(int.from_bytes(header[36:40], "little") & 1)
    chunks: list[str] = []

    for stream in ole.listdir():
        if stream[0] != "BodyText" or not stream[-1].startswith("Section"):
            continue
        data = ole.openstream(stream).read()
        if compressed:
            data = zlib.decompress(data, -15)
        decoded = data.decode("utf-16le", errors="ignore")
        decoded = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "\n", decoded)
        visible = re.findall(r"[가-힣A-Za-z0-9][가-힣A-Za-z0-9\s·ㆍ()\[\],.:%/+\\-]{1,}", decoded)
        chunks.extend(item.strip() for item in visible if re.search(r"[가-힣]", item))

    return "\n".join(chunks)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    text = extract_hwp_text(args.input)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
