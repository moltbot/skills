package beeperapi

import (
	"testing"

	"github.com/beeper/desktop-api-go/shared"
)

func TestDisplayNameForChat(t *testing.T) {
	cases := []struct {
		name         string
		chatType     string
		participants []shared.User
		want         string
	}{
		{
			name:     "group-chat",
			chatType: "group",
			participants: []shared.User{
				{ID: "@me", IsSelf: true},
				{ID: "@other", FullName: "Other"},
			},
			want: "",
		},
		{
			name:     "single-fullname",
			chatType: "single",
			participants: []shared.User{
				{ID: "@me", IsSelf: true},
				{ID: "@other", FullName: "Jamie Young"},
			},
			want: "Jamie Young",
		},
		{
			name:     "single-username",
			chatType: "single",
			participants: []shared.User{
				{ID: "@me", IsSelf: true},
				{ID: "@other", Username: "jamie"},
			},
			want: "jamie",
		},
		{
			name:     "single-id-fallback",
			chatType: "single",
			participants: []shared.User{
				{ID: "@me", IsSelf: true},
				{ID: "@other"},
			},
			want: "@other",
		},
		{
			name:     "single-self-only",
			chatType: "single",
			participants: []shared.User{
				{ID: "@me", IsSelf: true},
			},
			want: "",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := displayNameForChat(tc.chatType, "", tc.participants)
			if got != tc.want {
				t.Fatalf("displayNameForChat() = %q, want %q", got, tc.want)
			}
		})
	}
}
