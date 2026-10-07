"""Run the bounded security-critical mutation suite in disposable copies."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MUTATIONS = [
    ("publisher collateral guard", "contracts/margin.py", "if coverage_cap <= 0 or value < coverage_cap:", "if coverage_cap <= 0:", 1),
    ("challenge bond guard", "contracts/margin.py", "if int(gl.message.value) < required_bond:", "if False:", 1),
    ("appeal bond guard", "contracts/margin.py", "if int(gl.message.value) < MIN_CHALLENGE_BOND:\n            raise gl.vm.UserError(\"appeal bond is required\")", "if False:\n            raise gl.vm.UserError(\"appeal bond is required\")", 1),
    ("active exposure ceiling", "contracts/margin_consumer.py", "if coverage <= 0 or active + int(gl.message.value) > coverage:", "if coverage <= 0:", 1),
    ("artifact digest equality", "contracts/margin.py", 'elif hashlib.sha256(body.encode("utf-8")).hexdigest() != str(expected.get("expected_sha256", "")).lower():', "elif False:", 1),
    ("citation presence verification", "contracts/margin.py", "and not citation_present", "and False", 1),
    ("material observation agreement", "contracts/margin.py", "if expected_material_observations is not None and material_observations != expected_material_observations:", "if False:", 2),
    ("protected execute eligibility", "contracts/margin_consumer.py", "if not self.is_claim_supported(record.claim_key):", "if False:", 1),
    ("protected refund eligibility", "contracts/margin_consumer.py", "if not negative_terminal and datetime.now(timezone.utc) < self._expiry(record.expiry):", "if False:", 1),
    ("execute exposure decrement", "contracts/margin_consumer.py", "self.active_exposure_by_claim[record.claim_key] = u256(current - int(record.amount))", "self.active_exposure_by_claim[record.claim_key] = u256(current)", 1),
    ("beneficiary withdrawal zeroing", "contracts/margin_consumer.py", "record.beneficiary_credit = u256(0)", "record.beneficiary_credit = record.beneficiary_credit", 1),
    ("creator withdrawal zeroing", "contracts/margin_consumer.py", "record.creator_credit = u256(0)", "record.creator_credit = record.creator_credit", 1),
]

def run_pytest(cwd: Path) -> int:
    if os.name != "nt":
        return subprocess.run([sys.executable, "-m", "pytest", "tests/direct", "-q"], cwd=cwd).returncode
    drive = cwd.drive[0].lower()
    wsl_cwd = f"/mnt/{drive}{str(cwd)[2:].replace(chr(92), '/')}"
    return subprocess.run(["wsl.exe", "bash", "-lc", f"cd '{wsl_cwd}' && python3 -m pytest tests/direct -q"], cwd=ROOT).returncode

def main() -> int:
    killed = 0
    for name, relative, needle, replacement, occurrence in MUTATIONS:
        with tempfile.TemporaryDirectory(prefix="margin-mutation-") as raw:
            temp = Path(raw)
            shutil.copytree(ROOT / "contracts", temp / "contracts")
            shutil.copytree(ROOT / "tests", temp / "tests")
            source_path = temp / relative
            source = source_path.read_text(encoding="utf-8")
            locations = [index for index in range(len(source)) if source.startswith(needle, index)]
            if len(locations) < occurrence:
                print(f"MUTATION ERROR {name}: expected occurrence {occurrence}, found {len(locations)}")
                return 1
            start = locations[occurrence - 1]
            mutated = source[:start] + replacement + source[start + len(needle):]
            source_path.write_text(mutated, encoding="utf-8")
            if run_pytest(temp) != 0:
                killed += 1
                print(f"KILLED {name}")
            else:
                print(f"SURVIVED {name}")
    print(f"Security-critical mutations: {killed}/{len(MUTATIONS)} killed")
    return 0 if killed == len(MUTATIONS) else 1

if __name__ == "__main__":
    raise SystemExit(main())
