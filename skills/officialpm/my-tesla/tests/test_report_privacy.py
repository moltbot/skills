import unittest
import sys
from pathlib import Path

# Allow importing scripts/tesla.py as a module
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import tesla  # noqa: E402


class ReportPrivacyTests(unittest.TestCase):
    def test_report_string_does_not_leak_location_fields(self):
        vehicle = {"display_name": "Test Car", "state": "online"}
        data = {
            "charge_state": {"battery_level": 50, "battery_range": 123.4},
            "climate_state": {"inside_temp": 20, "outside_temp": 10, "is_climate_on": False},
            "vehicle_state": {"locked": True, "sentry_mode": False},
            # Raw vehicle_data can include precise coords; report output must not echo them.
            "drive_state": {"latitude": 37.123456, "longitude": -122.987654},
        }

        out = tesla._report(vehicle, data)

        # No location fields or raw coordinate strings should appear.
        self.assertNotIn("drive_state", out)
        self.assertNotIn("latitude", out)
        self.assertNotIn("longitude", out)
        self.assertNotIn("37.123", out)
        self.assertNotIn("-122.987", out)


if __name__ == "__main__":
    unittest.main()
