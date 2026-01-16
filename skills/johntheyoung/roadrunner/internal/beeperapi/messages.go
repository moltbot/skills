package beeperapi

import (
	"context"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go"
)

// MessagesService handles message operations.
type MessagesService struct {
	client *Client
}

// MessageListParams configures message list queries.
type MessageListParams struct {
	Cursor    string
	Direction string // before|after
}

// MessageSearchParams configures message search queries.
type MessageSearchParams struct {
	Query              string
	AccountIDs         []string
	ChatIDs            []string
	ChatType           string // group|single
	Sender             string // me|others|<user-id>
	MediaTypes         []string
	DateAfter          *time.Time
	DateBefore         *time.Time
	IncludeMuted       *bool
	ExcludeLowPriority *bool
	Cursor             string
	Direction          string // before|after
	Limit              int
}

// MessageListResult is the list response with pagination info.
type MessageListResult struct {
	Items      []MessageItem `json:"items"`
	HasMore    bool          `json:"has_more"`
	NextCursor string        `json:"next_cursor,omitempty"`
}

// MessageSearchResult is the search response with pagination info.
type MessageSearchResult struct {
	Items        []MessageItem `json:"items"`
	HasMore      bool          `json:"has_more"`
	OldestCursor string        `json:"oldest_cursor,omitempty"`
	NewestCursor string        `json:"newest_cursor,omitempty"`
}

// MessageItem represents a message in list/search output.
type MessageItem struct {
	ID         string   `json:"id"`
	ChatID     string   `json:"chat_id"`
	SenderID   string   `json:"sender_id,omitempty"`
	SenderName string   `json:"sender_name,omitempty"`
	Text       string   `json:"text,omitempty"`
	Timestamp  string   `json:"timestamp,omitempty"`
	SortKey    string   `json:"sort_key,omitempty"`
	HasMedia   bool     `json:"has_media,omitempty"`
	Reactions  []string `json:"reactions,omitempty"`
}

// List retrieves messages for a chat with cursor-based pagination.
func (s *MessagesService) List(ctx context.Context, chatID string, params MessageListParams) (MessageListResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.MessageListParams{}
	if params.Cursor != "" {
		sdkParams.Cursor = beeperdesktopapi.String(params.Cursor)
	}
	switch params.Direction {
	case "before":
		sdkParams.Direction = beeperdesktopapi.MessageListParamsDirectionBefore
	case "after":
		sdkParams.Direction = beeperdesktopapi.MessageListParamsDirectionAfter
	}

	page, err := s.client.SDK.Messages.List(ctx, chatID, sdkParams)
	if err != nil {
		return MessageListResult{}, err
	}

	result := MessageListResult{
		Items:   make([]MessageItem, 0, len(page.Items)),
		HasMore: page.HasMore,
	}

	for _, msg := range page.Items {
		item := MessageItem{
			ID:       msg.ID,
			ChatID:   msg.ChatID,
			SenderID: msg.SenderID,
			Text:     msg.Text,
			SortKey:  msg.SortKey,
			HasMedia: len(msg.Attachments) > 0,
		}
		if msg.SenderName != "" {
			item.SenderName = msg.SenderName
		} else {
			item.SenderName = msg.SenderID
		}
		if !msg.Timestamp.IsZero() {
			item.Timestamp = msg.Timestamp.Format(time.RFC3339)
		}
		if len(msg.Reactions) > 0 {
			item.Reactions = make([]string, 0, len(msg.Reactions))
			for _, r := range msg.Reactions {
				item.Reactions = append(item.Reactions, r.ReactionKey)
			}
		}
		result.Items = append(result.Items, item)
	}

	if result.HasMore && len(result.Items) > 0 {
		last := result.Items[len(result.Items)-1]
		if last.SortKey != "" {
			result.NextCursor = last.SortKey
		}
	}

	return result, nil
}

// SendParams configures message send requests.
type SendParams struct {
	Text             string
	ReplyToMessageID string
}

// SendResult is the response from sending a message.
type SendResult struct {
	ChatID           string `json:"chat_id"`
	PendingMessageID string `json:"pending_message_id"`
}

// Send sends a text message to a chat.
func (s *MessagesService) Send(ctx context.Context, chatID string, params SendParams) (SendResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.MessageSendParams{}
	if params.Text != "" {
		sdkParams.Text = beeperdesktopapi.String(params.Text)
	}
	if params.ReplyToMessageID != "" {
		sdkParams.ReplyToMessageID = beeperdesktopapi.String(params.ReplyToMessageID)
	}

	resp, err := s.client.SDK.Messages.Send(ctx, chatID, sdkParams)
	if err != nil {
		return SendResult{}, err
	}

	return SendResult{
		ChatID:           resp.ChatID,
		PendingMessageID: resp.PendingMessageID,
	}, nil
}

// Search retrieves messages matching a query.
func (s *MessagesService) Search(ctx context.Context, params MessageSearchParams) (MessageSearchResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.MessageSearchParams{}
	if params.Query != "" {
		sdkParams.Query = beeperdesktopapi.String(params.Query)
	}
	if len(params.AccountIDs) > 0 {
		sdkParams.AccountIDs = params.AccountIDs
	}
	if len(params.ChatIDs) > 0 {
		sdkParams.ChatIDs = params.ChatIDs
	}
	switch params.ChatType {
	case "group":
		sdkParams.ChatType = beeperdesktopapi.MessageSearchParamsChatTypeGroup
	case "single":
		sdkParams.ChatType = beeperdesktopapi.MessageSearchParamsChatTypeSingle
	}
	if params.Sender != "" {
		sdkParams.Sender = beeperdesktopapi.MessageSearchParamsSender(params.Sender)
	}
	if len(params.MediaTypes) > 0 {
		sdkParams.MediaTypes = params.MediaTypes
	}
	if params.DateAfter != nil {
		sdkParams.DateAfter = beeperdesktopapi.Time(*params.DateAfter)
	}
	if params.DateBefore != nil {
		sdkParams.DateBefore = beeperdesktopapi.Time(*params.DateBefore)
	}
	if params.IncludeMuted != nil {
		sdkParams.IncludeMuted = beeperdesktopapi.Bool(*params.IncludeMuted)
	}
	if params.ExcludeLowPriority != nil {
		sdkParams.ExcludeLowPriority = beeperdesktopapi.Bool(*params.ExcludeLowPriority)
	}
	if params.Cursor != "" {
		sdkParams.Cursor = beeperdesktopapi.String(params.Cursor)
	}
	switch params.Direction {
	case "before":
		sdkParams.Direction = beeperdesktopapi.MessageSearchParamsDirectionBefore
	case "after":
		sdkParams.Direction = beeperdesktopapi.MessageSearchParamsDirectionAfter
	}
	if params.Limit > 0 {
		sdkParams.Limit = beeperdesktopapi.Int(int64(params.Limit))
	}

	page, err := s.client.SDK.Messages.Search(ctx, sdkParams)
	if err != nil {
		return MessageSearchResult{}, err
	}

	result := MessageSearchResult{
		Items:        make([]MessageItem, 0, len(page.Items)),
		HasMore:      page.HasMore,
		OldestCursor: page.OldestCursor,
		NewestCursor: page.NewestCursor,
	}

	for _, msg := range page.Items {
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
		result.Items = append(result.Items, item)
	}

	return result, nil
}
