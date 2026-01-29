import io
import unittest
from contextlib import redirect_stdout
from unittest import mock

# Import the tesla script as a module
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import tesla  # noqa: E402


class DummyVehicle:
    def __init__(self, display_name="Test Car", state="online", data=None):
        self._display_name = display_name
        self._state = state
        self._data = data or {}

    def __getitem__(self, k):
        if k == "display_name":
            return self._display_name
        if k == "state":
            return self._state
        raise KeyError(k)

    def get(self, k, default=None):
        if k == "display_name":
            return self._display_name
        if k == "state":
            return self._state
        return default

    def get_vehicle_data(self):
        return self._data


class CmdStatusSummaryTests(unittest.TestCase):
    def test_status_summary_prints_summary_and_details(self):
        data = {
            "charge_state": {"battery_level": 55, "battery_range": 123.4, "charging_state": "Stopped"},
            "climate_state": {"inside_temp": 20, "is_climate_on": False},
            "vehicle_state": {"locked": True},
        }
        vehicle = DummyVehicle(data=data)

        args = mock.Mock()
        args.car = None
        args.no_wake = False
        args.summary = True
        args.json = False

        # Patch networky bits.
        with mock.patch.object(tesla, "get_tesla"), \
             mock.patch.object(tesla, "get_vehicle", return_value=vehicle), \
             mock.patch.object(tesla, "require_email", return_value="test@example.com"), \
             mock.patch.object(tesla, "_ensure_online_or_exit"):
            buf = io.StringIO()
            with redirect_stdout(buf):
                tesla.cmd_status(args)

        out = buf.getvalue()
        # Summary line
        self.assertIn("🚗 Test Car", out)
        self.assertIn("🔋 55%", out)
        # Detailed section should still appear
        self.assertIn("Battery: 55% (123 mi)", out)


if __name__ == "__main__":
    unittest.main()
