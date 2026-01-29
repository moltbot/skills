import unittest
import sys
from pathlib import Path

# Allow importing scripts/tesla.py as a module
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import tesla  # noqa: E402


class ReportJsonTests(unittest.TestCase):
    def test_report_json_is_sanitized(self):
        vehicle = {"display_name": "Test Car", "state": "online"}
        data = {
            "charge_state": {
                "battery_level": 80,
                "battery_range": 250.2,
                "charging_state": "Charging",
                "charge_limit_soc": 90,
                "time_to_full_charge": 1.5,
                "charge_rate": 30,
                "charge_port_door_open": True,
                "conn_charge_cable": "SAE",
                "scheduled_charging_mode": "Start",
                "scheduled_charging_pending": True,
                "scheduled_charging_start_time": 60,  # 01:00
            },
            "climate_state": {"inside_temp": 21, "outside_temp": 10, "is_climate_on": True},
            "vehicle_state": {"locked": False, "sentry_mode": True, "odometer": 12345.6},
            # This is intentionally present in raw vehicle_data, but should not show up in report JSON.
            "drive_state": {"latitude": 37.1234, "longitude": -122.5678},
        }

        out = tesla._report_json(vehicle, data)
        self.assertIn("vehicle", out)
        self.assertEqual(out["vehicle"]["display_name"], "Test Car")

        # Must not include raw drive_state/location
        self.assertNotIn("drive_state", out)
        self.assertNotIn("location", out)
        self.assertNotIn("latitude", str(out))
        self.assertNotIn("longitude", str(out))

        # Expected useful bits
        self.assertEqual(out["battery"]["level_percent"], 80)
        self.assertEqual(out["charging"]["charging_state"], "Charging")
        self.assertEqual(out["charging"]["charge_port_door_open"], True)
        self.assertEqual(out["charging"]["conn_charge_cable"], "SAE")
        self.assertEqual(out["scheduled_charging"]["start_time_hhmm"], "01:00")
        self.assertEqual(out["security"]["locked"], False)


if __name__ == "__main__":
    unittest.main()
