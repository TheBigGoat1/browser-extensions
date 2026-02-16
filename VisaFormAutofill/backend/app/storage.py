"""
Atomic read/write for JSON files under data/.
All paths are relative to DATA_ROOT (env or default ./data).
"""

import json
import os
import tempfile
from pathlib import Path
from typing import Any, Optional

DATA_ROOT = Path(os.environ.get("VISA_DATA_ROOT", "data"))


def _path(*parts: str) -> Path:
    return DATA_ROOT.joinpath(*parts)


def read_json(*path_parts: str) -> Optional[dict[str, Any]]:
    p = _path(*path_parts)
    if not p.is_file():
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(data: dict[str, Any], *path_parts: str) -> None:
    p = _path(*path_parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=p.parent, prefix=".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, p)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def list_ids(subdir: str, suffix: str = ".json") -> list[str]:
    """List entity IDs from filenames (e.g. app_001.json -> app_001)."""
    d = _path(subdir)
    if not d.is_dir():
        return []
    out = []
    for f in d.iterdir():
        if f.suffix == suffix and f.name.startswith(("app_", "user_", "doc_", "audit_")):
            out.append(f.stem)
    return sorted(out)
