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


class CmdClimateStatusTests(unittest.TestCase):
    def test_climate_status_prints_readable_output(self):
        data = {
            "climate_state": {
                "is_climate_on": False,
                "inside_temp": 20,
                "outside_temp": 10,
                "driver_temp_setting": 21,
                "passenger_temp_setting": 21,
            }
        }
        vehicle = DummyVehicle(data=data)

        args = mock.Mock()
        args.car = None
        args.action = "status"
        args.no_wake = True
        args.json = False

        with mock.patch.object(tesla, "get_tesla"), \
             mock.patch.object(tesla, "get_vehicle", return_value=vehicle), \
             mock.patch.object(tesla, "require_email", return_value="test@example.com"), \
             mock.patch.object(tesla, "_ensure_online_or_exit"):
            buf = io.StringIO()
            with redirect_stdout(buf):
                tesla.cmd_climate(args)

        out = buf.getvalue()
        self.assertIn("🚗 Test Car", out)
        self.assertIn("Climate: Off", out)
        self.assertIn("Inside:", out)
        self.assertIn("Outside:", out)
        self.assertIn("Setpoint:", out)

    def test_climate_status_json_is_json_only(self):
        data = {"climate_state": {"is_climate_on": True, "inside_temp": 20}}
        vehicle = DummyVehicle(data=data)

        args = mock.Mock()
        args.car = None
        args.action = "status"
        args.no_wake = False
        args.json = True

        with mock.patch.object(tesla, "get_tesla"), \
             mock.patch.object(tesla, "get_vehicle", return_value=vehicle), \
             mock.patch.object(tesla, "require_email", return_value="test@example.com"), \
             mock.patch.object(tesla, "_ensure_online_or_exit"):
            buf = io.StringIO()
            with redirect_stdout(buf):
                tesla.cmd_climate(args)

        out = buf.getvalue().strip()
        # Should be valid JSON (starts with '{') with no extra human text.
        self.assertTrue(out.startswith("{"))
        self.assertIn('"inside_temp_c"', out)


if __name__ == "__main__":
    unittest.main()
