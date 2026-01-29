import unittest
import sys
from pathlib import Path

# Allow importing scripts/tesla.py as a module
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import tesla  # noqa: E402


class FormattingTests(unittest.TestCase):
    def test_c_to_f(self):
        self.assertAlmostEqual(tesla._c_to_f(0), 32)
        self.assertAlmostEqual(tesla._c_to_f(20), 68)

    def test_fmt_temp_pair(self):
        self.assertIsNone(tesla._fmt_temp_pair(None))
        self.assertEqual(tesla._fmt_temp_pair(20), "20°C (68°F)")

    def test_short_status_contains_expected_bits(self):
        vehicle = {"display_name": "Test Car"}
        data = {
            "charge_state": {
                "battery_level": 55,
                "battery_range": 123.4,
                "charging_state": "Stopped",
            },
            "climate_state": {"inside_temp": 20, "is_climate_on": False},
            "vehicle_state": {"locked": True},
        }

        out = tesla._short_status(vehicle, data)
        self.assertIn("🚗 Test Car", out)
        self.assertIn("Locked", out)
        self.assertIn("55%", out)
        self.assertIn("123 mi", out)
        self.assertIn("⚡ Stopped", out)
        self.assertIn("68°F", out)
        self.assertIn("Off", out)

    def test_fmt_minutes_hhmm(self):
        self.assertEqual(tesla._fmt_minutes_hhmm(0), "00:00")
        self.assertEqual(tesla._fmt_minutes_hhmm(60), "01:00")
        self.assertEqual(tesla._fmt_minutes_hhmm(23 * 60 + 59), "23:59")
        self.assertIsNone(tesla._fmt_minutes_hhmm(-1))
        self.assertIsNone(tesla._fmt_minutes_hhmm("nope"))

    def test_parse_hhmm(self):
        self.assertEqual(tesla._parse_hhmm("00:00"), 0)
        self.assertEqual(tesla._parse_hhmm("01:30"), 90)
        self.assertEqual(tesla._parse_hhmm("23:59"), 23 * 60 + 59)
        with self.assertRaises(ValueError):
            tesla._parse_hhmm("24:00")
        with self.assertRaises(ValueError):
            tesla._parse_hhmm("12:60")
        with self.assertRaises(ValueError):
            tesla._parse_hhmm("1230")

    def test_report_is_one_screen(self):
        vehicle = {"display_name": "Test Car", "state": "online"}
        data = {
            "charge_state": {
                "battery_level": 80,
                "battery_range": 250.2,
                "charging_state": "Charging",
                "charge_limit_soc": 90,
                "time_to_full_charge": 1.5,
                "charge_rate": 30,
                "scheduled_charging_start_time": 120,
                "scheduled_charging_pending": True,
            },
            "climate_state": {"inside_temp": 21, "outside_temp": 10, "is_climate_on": True},
            "vehicle_state": {"locked": False, "odometer": 12345.6},
        }

        out = tesla._report(vehicle, data)
        # Basic structure
        self.assertTrue(out.startswith("🚗 Test Car"))
        self.assertIn("State: online", out)
        self.assertIn("Locked: No", out)
        self.assertIn("Battery: 80% (250 mi)", out)
        self.assertIn("Charging: Charging", out)
        self.assertIn("Scheduled charging:", out)
        self.assertIn("02:00", out)
        self.assertIn("Inside:", out)
        self.assertIn("Outside:", out)
        self.assertIn("Odometer: 12346 mi", out)

    def test_round_coord(self):
        self.assertEqual(tesla._round_coord(37.123456, 2), 37.12)
        self.assertEqual(tesla._round_coord("-122.123456", 2), -122.12)
        self.assertIsNone(tesla._round_coord("nope", 2))


if __name__ == "__main__":
    unittest.main()
