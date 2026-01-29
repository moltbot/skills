import unittest
import sys
from pathlib import Path

# Allow importing scripts/tesla.py as a module
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import tesla  # noqa: E402


class VehicleSelectTests(unittest.TestCase):
    def setUp(self):
        self.vehicles = [
            {"display_name": "My Model 3"},
            {"display_name": "Road Trip"},
            {"display_name": "Model Y"},
        ]

    def test_select_vehicle_default_first(self):
        v = tesla._select_vehicle(self.vehicles, None)
        self.assertEqual(v["display_name"], "My Model 3")

    def test_select_vehicle_exact_case_insensitive(self):
        v = tesla._select_vehicle(self.vehicles, "model y")
        self.assertEqual(v["display_name"], "Model Y")

    def test_select_vehicle_partial_substring(self):
        v = tesla._select_vehicle(self.vehicles, "road")
        self.assertEqual(v["display_name"], "Road Trip")

    def test_select_vehicle_index_1_based(self):
        v = tesla._select_vehicle(self.vehicles, "2")
        self.assertEqual(v["display_name"], "Road Trip")

    def test_select_vehicle_ambiguous_returns_none(self):
        vehicles = [
            {"display_name": "Alpha"},
            {"display_name": "Alphanumeric"},
        ]
        self.assertIsNone(tesla._select_vehicle(vehicles, "alp"))

    def test_get_vehicle_ambiguous_error_is_helpful(self):
        class FakeTesla:
            def vehicle_list(self_inner):
                return [
                    {"display_name": "Alpha"},
                    {"display_name": "Alphanumeric"},
                    {"display_name": "Beta"},
                ]

        # Force ambiguity and assert we mention that it's ambiguous + show index hint.
        stderr = sys.stderr
        try:
            from io import StringIO

            buf = StringIO()
            sys.stderr = buf
            with self.assertRaises(SystemExit) as ctx:
                tesla.get_vehicle(FakeTesla(), name="alp")
            self.assertEqual(ctx.exception.code, 1)
            out = buf.getvalue()
            self.assertIn("ambiguous", out.lower())
            self.assertIn("--car <N>", out)
            self.assertIn("Matches:", out)
        finally:
            sys.stderr = stderr


if __name__ == "__main__":
    unittest.main()
