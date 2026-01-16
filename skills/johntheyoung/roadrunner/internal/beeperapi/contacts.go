package beeperapi

import (
	"context"

	beeperdesktopapi "github.com/beeper/desktop-api-go"
)

// Contact represents a contact search result.
type Contact struct {
	ID            string `json:"id"`
	FullName      string `json:"full_name,omitempty"`
	Username      string `json:"username,omitempty"`
	Email         string `json:"email,omitempty"`
	PhoneNumber   string `json:"phone_number,omitempty"`
	CannotMessage bool   `json:"cannot_message,omitempty"`
	ImgURL        string `json:"img_url,omitempty"`
}

// SearchContacts finds contacts on a specific account.
func (s *AccountsService) SearchContacts(ctx context.Context, accountID string, query string) ([]Contact, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	resp, err := s.client.SDK.Accounts.Contacts.Search(ctx, accountID, beeperdesktopapi.AccountContactSearchParams{
		Query: query,
	})
	if err != nil {
		return nil, err
	}

	contacts := make([]Contact, 0, len(resp.Items))
	for _, c := range resp.Items {
		contacts = append(contacts, Contact{
			ID:            c.ID,
			FullName:      c.FullName,
			Username:      c.Username,
			Email:         c.Email,
			PhoneNumber:   c.PhoneNumber,
			CannotMessage: c.CannotMessage,
			ImgURL:        c.ImgURL,
		})
	}

	return contacts, nil
}
