package beeperapi

import "github.com/beeper/desktop-api-go/shared"

func displayNameForChat(chatType string, title string, participants []shared.User) string {
	if chatType != "single" {
		return ""
	}

	for _, p := range participants {
		if p.IsSelf {
			continue
		}
		if p.FullName != "" {
			return p.FullName
		}
		if p.Username != "" {
			return p.Username
		}
		if p.ID != "" {
			return p.ID
		}
	}

	return ""
}
