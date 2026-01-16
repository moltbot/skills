package beeperapi

import (
	"context"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go"
)

// SearchParams configures global search behavior.
type SearchParams struct {
	Query             string
	MessagesCursor    string
	MessagesDirection string // before|after
	MessagesLimit     int
}

// SearchResult is the response from global search.
type SearchResult struct {
	Chats    []SearchChat   `json:"chats"`
	InGroups []SearchChat   `json:"in_groups"`
	Messages SearchMessages `json:"messages"`
}

// SearchChat represents a chat in search results.
type SearchChat struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	DisplayName string `json:"display_name,omitempty"`
	Type        string `json:"type"`
	Network     string `json:"network"`
	AccountID   string `json:"account_id"`
	UnreadCount int64  `json:"unread_count"`
}

// SearchMessages represents message results from global search.
type SearchMessages struct {
	Items        []MessageItem `json:"items"`
	HasMore      bool          `json:"has_more"`
	OldestCursor string        `json:"oldest_cursor,omitempty"`
	NewestCursor string        `json:"newest_cursor,omitempty"`
}

// Search performs a global search across chats and messages.
// If message pagination params are provided, it uses /v1/messages/search
// for the message results while still using /v1/search for chats/groups.
func (c *Client) Search(ctx context.Context, params SearchParams) (SearchResult, error) {
	ctx, cancel := c.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.SearchParams{
		Query: params.Query,
	}

	resp, err := c.SDK.Search(ctx, sdkParams)
	if err != nil {
		return SearchResult{}, err
	}

	result := SearchResult{
		Chats:    make([]SearchChat, 0, len(resp.Results.Chats)),
		InGroups: make([]SearchChat, 0, len(resp.Results.InGroups)),
		Messages: SearchMessages{
			Items:        make([]MessageItem, 0, len(resp.Results.Messages.Items)),
			HasMore:      resp.Results.Messages.HasMore,
			OldestCursor: resp.Results.Messages.OldestCursor,
			NewestCursor: resp.Results.Messages.NewestCursor,
		},
	}

	// Map chats
	for _, chat := range resp.Results.Chats {
		displayName := displayNameForChat(string(chat.Type), chat.Title, chat.Participants.Items)
		result.Chats = append(result.Chats, SearchChat{
			ID:          chat.ID,
			Title:       chat.Title,
			DisplayName: displayName,
			Type:        string(chat.Type),
			//nolint:staticcheck // Network is deprecated in SDK but still returned by API for display.
			Network:     chat.Network,
			AccountID:   chat.AccountID,
			UnreadCount: chat.UnreadCount,
		})
	}

	// Map in_groups
	for _, chat := range resp.Results.InGroups {
		displayName := displayNameForChat(string(chat.Type), chat.Title, chat.Participants.Items)
		result.InGroups = append(result.InGroups, SearchChat{
			ID:          chat.ID,
			Title:       chat.Title,
			DisplayName: displayName,
			Type:        string(chat.Type),
			//nolint:staticcheck // Network is deprecated in SDK but still returned by API for display.
			Network:     chat.Network,
			AccountID:   chat.AccountID,
			UnreadCount: chat.UnreadCount,
		})
	}

	// Map messages
	for _, msg := range resp.Results.Messages.Items {
		item := MessageItem{
			ID:       msg.ID,
			ChatID:   msg.ChatID,
			SenderID: msg.SenderID,
			Text:     msg.Text,
		}
		if msg.SenderName != "" {
			item.SenderName = msg.SenderName
		} else {
			item.SenderName = msg.SenderID
		}
		if !msg.Timestamp.IsZero() {
			item.Timestamp = msg.Timestamp.Format(time.RFC3339)
		}
		result.Messages.Items = append(result.Messages.Items, item)
	}

	useMessagePaging := params.MessagesCursor != "" || params.MessagesDirection != "" || params.MessagesLimit > 0
	if useMessagePaging {
		limit := params.MessagesLimit
		if limit <= 0 {
			limit = 20
		}
		msgs, err := c.Messages().Search(ctx, MessageSearchParams{
			Query:     params.Query,
			Cursor:    params.MessagesCursor,
			Direction: params.MessagesDirection,
			Limit:     limit,
		})
		if err != nil {
			return SearchResult{}, err
		}
		result.Messages = SearchMessages(msgs)
	}

	return result, nil
}
