from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "contracts" / "margin.py").read_text()

class ContractInvariantTests(unittest.TestCase):
    def test_chain_is_61999(self):
        self.assertRegex(SOURCE, r"EXPECTED_CHAIN_ID\s*=\s*61999")

    def test_independent_validator_reruns_judge(self):
        validator = re.search(r"def validate\(leader_result\).*?decision =", SOURCE, re.S)
        self.assertIsNotNone(validator)
        self.assertIn("independent = judge()", validator.group(0))
        self.assertIn('independent.get("status") == status', validator.group(0))

    def test_no_leader_shape_only_validation(self):
        self.assertIn("gl.vm.run_nondet_unsafe(judge, validate)", SOURCE)

    def test_page_and_claim_keys_are_payload_bound(self):
        self.assertIn('hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()', SOURCE)
        self.assertIn('page_key does not match canonical_url', SOURCE)
        self.assertIn('expected_claim_key = self._expected_claim_key(', SOURCE)
        self.assertIn('claim_key does not match claim payload', SOURCE)

    def test_evidence_is_bounded(self):
        self.assertIn("MAX_EVIDENCE_URLS = 3", SOURCE)
        self.assertIn("MAX_PAGE_CLAIMS = 48", SOURCE)
        self.assertIn("MAX_REVISIONS = 5", SOURCE)
        self.assertIn("MAX_PRIMARY_CHARS = 30000", SOURCE)
        self.assertIn("MAX_ARCHIVE_CHARS = 25000", SOURCE)
        self.assertIn("MAX_EVIDENCE_CHARS = 15000", SOURCE)

    def test_no_private_backend_url(self):
        self.assertNotIn("margin-api", SOURCE.lower())
        self.assertIn("gl.nondet.web", SOURCE)

    def test_repository_does_not_reference_other_chain_id(self):
        for path in ROOT.rglob('*'):
            if not path.is_file() or any(part in {'.git', 'node_modules', '__pycache__'} for part in path.parts):
                continue
            if path.suffix in {'.zip', '.pyc'}:
                continue
            forbidden = '619' + '97'
            self.assertNotIn(forbidden, path.read_text(errors='ignore'), str(path))

if __name__ == '__main__':
    unittest.main()
