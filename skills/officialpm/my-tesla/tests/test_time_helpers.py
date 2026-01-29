import unittest

from scripts.tesla import _fmt_minutes_hhmm, _parse_hhmm


class TestTimeHelpers(unittest.TestCase):
    def test_fmt_minutes_hhmm_basic(self):
        self.assertEqual(_fmt_minutes_hhmm(0), "00:00")
        self.assertEqual(_fmt_minutes_hhmm(1), "00:01")
        self.assertEqual(_fmt_minutes_hhmm(60), "01:00")
        self.assertEqual(_fmt_minutes_hhmm(23 * 60 + 59), "23:59")

    def test_fmt_minutes_hhmm_wraps_24h(self):
        # Tesla sometimes uses minutes-from-midnight; be defensive.
        self.assertEqual(_fmt_minutes_hhmm(24 * 60), "00:00")
        self.assertEqual(_fmt_minutes_hhmm(25 * 60 + 5), "01:05")

    def test_fmt_minutes_hhmm_invalid(self):
        self.assertIsNone(_fmt_minutes_hhmm(-1))
        self.assertIsNone(_fmt_minutes_hhmm(""))
        self.assertIsNone(_fmt_minutes_hhmm(None))

    def test_parse_hhmm(self):
        self.assertEqual(_parse_hhmm("00:00"), 0)
        self.assertEqual(_parse_hhmm("01:05"), 65)
        self.assertEqual(_parse_hhmm("23:59"), 23 * 60 + 59)

    def test_parse_hhmm_strips(self):
        self.assertEqual(_parse_hhmm(" 07:30 "), 7 * 60 + 30)

    def test_parse_hhmm_invalid(self):
        for bad in [
            None,
            "",
            " ",
            "7:30",  # must be zero-padded? actually current parser allows; but still has ':' so ok
        ]:
            if bad == "7:30":
                # Current implementation allows single-digit hours; keep behavior.
                self.assertEqual(_parse_hhmm(bad), 7 * 60 + 30)
            else:
                with self.assertRaises(ValueError):
                    _parse_hhmm(bad)

        for bad in ["24:00", "00:60", "-1:00", "ab:cd", "123"]:
            with self.assertRaises(Exception):
                _parse_hhmm(bad)


if __name__ == "__main__":
    unittest.main()
