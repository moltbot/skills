package ui

import "testing"

func TestTruncate(t *testing.T) {
	cases := []struct {
		name   string
		in     string
		maxLen int
		want   string
	}{
		{name: "no-truncate", in: "hello", maxLen: 10, want: "hello"},
		{name: "truncate", in: "hello world", maxLen: 8, want: "hello..."},
		{name: "small-max", in: "hello", maxLen: 3, want: "hel"},
		{name: "newline", in: "hello\nworld", maxLen: 20, want: "hello world"},
		{name: "trim-space", in: "  hello  ", maxLen: 20, want: "hello"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Truncate(tc.in, tc.maxLen)
			if got != tc.want {
				t.Fatalf("Truncate(%q, %d) = %q, want %q", tc.in, tc.maxLen, got, tc.want)
			}
		})
	}
}
