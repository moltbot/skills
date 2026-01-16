package beeperapi

import (
	"context"

	beeperdesktopapi "github.com/beeper/desktop-api-go"
)

// AccountsService handles account operations.
type AccountsService struct {
	client *Client
}

// Account represents a messaging account (simplified view).
type Account struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
	Network     string `json:"network"`
}

// List retrieves all accounts.
func (s *AccountsService) List(ctx context.Context) ([]Account, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	resp, err := s.client.SDK.Accounts.List(ctx)
	if err != nil {
		return nil, err
	}

	if resp == nil {
		return nil, nil
	}

	accounts := make([]Account, 0, len(*resp))
	for _, a := range *resp {
		displayName := a.User.FullName
		if displayName == "" {
			displayName = a.User.Username
		}
		accounts = append(accounts, Account{
			ID:          a.AccountID,
			DisplayName: displayName,
			//nolint:staticcheck // Network is deprecated in SDK but still returned by API for display.
			Network: a.Network,
		})
	}

	return accounts, nil
}

// ListRaw retrieves accounts and returns the raw SDK response.
func (s *AccountsService) ListRaw(ctx context.Context) (*[]beeperdesktopapi.Account, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	return s.client.SDK.Accounts.List(ctx)
}
