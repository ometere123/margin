from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "contracts" / "margin.py").read_text()
SIGNER_SOURCE = (ROOT / "signer" / "src" / "main.ts").read_text()
SIGNER_HEADERS = (ROOT / "vercel.json").read_text()
SHARED_SOURCE = (ROOT / "shared" / "protocol.ts").read_text()
CONSUMER_SOURCE = (ROOT / "contracts" / "margin_consumer.py").read_text()

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

    def test_production_signer_uses_release_configuration(self):
        self.assertIn("import.meta.env.VITE_MARGIN_CONTRACT_ADDRESS", SIGNER_SOURCE)
        self.assertNotIn("localStorage.getItem('marginContract')", SIGNER_SOURCE)
        self.assertNotIn("localStorage.setItem('marginContract'", SIGNER_SOURCE)
        self.assertNotIn("params.get('contract')", SIGNER_SOURCE)
        self.assertIn("MARGIN_CONTRACT_ADDRESS", SHARED_SOURCE)

    def test_signer_headers_keep_static_wallet_surface_hardened(self):
        self.assertIn("Content-Security-Policy", SIGNER_HEADERS)
        self.assertIn("frame-ancestors 'none'", SIGNER_HEADERS)
        self.assertIn("connect-src 'self' https://studio.genlayer.com", SIGNER_HEADERS)
        self.assertIn("X-Content-Type-Options", SIGNER_HEADERS)
        self.assertIn("Referrer-Policy", SIGNER_HEADERS)
        self.assertIn("Permissions-Policy", SIGNER_HEADERS)
        self.assertNotIn("unsafe-eval", SIGNER_HEADERS)

    def test_evidence_manifest_is_validator_bound(self):
        self.assertIn("source_manifest_digest", SOURCE)
        self.assertIn('candidate.get("source_manifest") == independent.get("source_manifest")', SOURCE)
        self.assertIn('candidate.get("contradicting_source_indexes") == independent.get("contradicting_source_indexes")', SOURCE)
        self.assertIn("source manifest unchanged; no new revision", SOURCE)

    def test_assured_claim_has_domain_proof_and_bond_lifecycle(self):
        self.assertIn("register_assured_claim", SOURCE)
        self.assertIn("@gl.public.write.payable", SOURCE)
        self.assertIn("/.well-known/margin.json", SOURCE)
        self.assertIn("challenge_assured_claim", SOURCE)
        self.assertIn("appeal_assured_claim", SOURCE)
        self.assertIn("settle_assured_claim", SOURCE)
        self.assertIn("withdraw_assured_credit", SOURCE)

    def test_consumer_reads_finalized_state_from_contract(self):
        self.assertIn("get_assured_claim", CONSUMER_SOURCE)
        self.assertIn("margin = MarginInterface(margin_address)", CONSUMER_SOURCE)
        self.assertNotIn("MarginInterface(Address(margin_address))", CONSUMER_SOURCE)
        self.assertIn('receipt.get("state") != "SETTLED"', CONSUMER_SOURCE)
        self.assertIn('receipt.get("final_status") != "SUPPORTED"', CONSUMER_SOURCE)

if __name__ == '__main__':
    unittest.main()
