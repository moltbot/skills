package beeperapi

import (
	"context"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go"
)

// ChatsService handles chat operations.
type ChatsService struct {
	client *Client
}

// ChatListParams configures chat list queries.
type ChatListParams struct {
	AccountIDs []string
	Cursor     string
	Direction  string // before|after
}

// ChatListResult is the list response with pagination info.
type ChatListResult struct {
	Items        []ChatListItem `json:"items"`
	HasMore      bool           `json:"has_more"`
	OldestCursor string         `json:"oldest_cursor,omitempty"`
	NewestCursor string         `json:"newest_cursor,omitempty"`
}

// ChatListItem represents a chat in list output.
type ChatListItem struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	DisplayName  string `json:"display_name,omitempty"`
	AccountID    string `json:"account_id"`
	LastActivity string `json:"last_activity,omitempty"`
	Preview      string `json:"preview,omitempty"`
}

// ChatSearchParams configures chat search queries.
type ChatSearchParams struct {
	Query              string
	AccountIDs         []string
	Inbox              string // primary|low-priority|archive
	UnreadOnly         bool
	IncludeMuted       *bool
	LastActivityAfter  *time.Time
	LastActivityBefore *time.Time
	Type               string // direct|group|any
	Scope              string // titles|participants
	Limit              int
	Cursor             string
	Direction          string // before|after
}

// ChatSearchResult is the search response with pagination info.
type ChatSearchResult struct {
	Items        []ChatSearchItem `json:"items"`
	HasMore      bool             `json:"has_more"`
	OldestCursor string           `json:"oldest_cursor,omitempty"`
	NewestCursor string           `json:"newest_cursor,omitempty"`
}

// ChatSearchItem represents a chat in search output.
type ChatSearchItem struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	DisplayName string `json:"display_name,omitempty"`
	Type        string `json:"type"`
	Network     string `json:"network"`
	UnreadCount int64  `json:"unread_count"`
	IsArchived  bool   `json:"is_archived"`
	IsMuted     bool   `json:"is_muted"`
}

// ChatDetail represents a chat detail response.
type ChatDetail struct {
	ID                     string `json:"id"`
	Title                  string `json:"title"`
	DisplayName            string `json:"display_name,omitempty"`
	AccountID              string `json:"account_id"`
	Network                string `json:"network"`
	Type                   string `json:"type"`
	UnreadCount            int64  `json:"unread_count"`
	IsArchived             bool   `json:"is_archived"`
	IsMuted                bool   `json:"is_muted"`
	IsPinned               bool   `json:"is_pinned"`
	LastActivity           string `json:"last_activity,omitempty"`
	LastReadMessageSortKey string `json:"last_read_message_sort_key,omitempty"`
	LocalChatID            string `json:"local_chat_id,omitempty"`
	Preview                string `json:"preview,omitempty"`
	ParticipantsTotal      int64  `json:"participants_total"`
	ParticipantsReturned   int    `json:"participants_returned"`
	ParticipantsHasMore    bool   `json:"participants_has_more"`
}

// ChatCreateParams configures chat creation.
type ChatCreateParams struct {
	AccountID      string
	ParticipantIDs []string
	Type           string // single|group
	Title          string
	MessageText    string
}

// ChatCreateResult is the response from creating a chat.
type ChatCreateResult struct {
	ChatID string `json:"chat_id"`
}

// List retrieves chats with cursor-based pagination.
func (s *ChatsService) List(ctx context.Context, params ChatListParams) (ChatListResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.ChatListParams{}
	if len(params.AccountIDs) > 0 {
		sdkParams.AccountIDs = params.AccountIDs
	}
	if params.Cursor != "" {
		sdkParams.Cursor = beeperdesktopapi.String(params.Cursor)
	}
	switch params.Direction {
	case "before":
		sdkParams.Direction = beeperdesktopapi.ChatListParamsDirectionBefore
	case "after":
		sdkParams.Direction = beeperdesktopapi.ChatListParamsDirectionAfter
	}

	page, err := s.client.SDK.Chats.List(ctx, sdkParams)
	if err != nil {
		return ChatListResult{}, err
	}

	result := ChatListResult{
		Items:        make([]ChatListItem, 0, len(page.Items)),
		HasMore:      page.HasMore,
		OldestCursor: page.OldestCursor,
		NewestCursor: page.NewestCursor,
	}

	for _, chat := range page.Items {
		item := ChatListItem{
			ID:        chat.ID,
			Title:     chat.Title,
			AccountID: chat.AccountID,
		}
		item.DisplayName = displayNameForChat(string(chat.Type), chat.Title, chat.Participants.Items)
		if !chat.LastActivity.IsZero() {
			item.LastActivity = chat.LastActivity.Format(time.RFC3339)
		}
		if chat.JSON.Preview.Valid() {
			item.Preview = chat.Preview.Text
		}
		result.Items = append(result.Items, item)
	}

	return result, nil
}

// Search retrieves chats matching a query.
func (s *ChatsService) Search(ctx context.Context, params ChatSearchParams) (ChatSearchResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.ChatSearchParams{}
	if params.Query != "" {
		sdkParams.Query = beeperdesktopapi.String(params.Query)
	}
	if len(params.AccountIDs) > 0 {
		sdkParams.AccountIDs = params.AccountIDs
	}
	if params.UnreadOnly {
		sdkParams.UnreadOnly = beeperdesktopapi.Bool(true)
	}
	if params.IncludeMuted != nil {
		sdkParams.IncludeMuted = beeperdesktopapi.Bool(*params.IncludeMuted)
	}
	if params.LastActivityAfter != nil {
		sdkParams.LastActivityAfter = beeperdesktopapi.Time(*params.LastActivityAfter)
	}
	if params.LastActivityBefore != nil {
		sdkParams.LastActivityBefore = beeperdesktopapi.Time(*params.LastActivityBefore)
	}
	if params.Limit > 0 {
		sdkParams.Limit = beeperdesktopapi.Int(int64(params.Limit))
	}
	if params.Cursor != "" {
		sdkParams.Cursor = beeperdesktopapi.String(params.Cursor)
	}
	switch params.Direction {
	case "before":
		sdkParams.Direction = beeperdesktopapi.ChatSearchParamsDirectionBefore
	case "after":
		sdkParams.Direction = beeperdesktopapi.ChatSearchParamsDirectionAfter
	}
	switch params.Inbox {
	case "primary":
		sdkParams.Inbox = beeperdesktopapi.ChatSearchParamsInboxPrimary
	case "low-priority":
		sdkParams.Inbox = beeperdesktopapi.ChatSearchParamsInboxLowPriority
	case "archive":
		sdkParams.Inbox = beeperdesktopapi.ChatSearchParamsInboxArchive
	}
	switch params.Type {
	case "direct":
		sdkParams.Type = beeperdesktopapi.ChatSearchParamsTypeSingle
	case "group":
		sdkParams.Type = beeperdesktopapi.ChatSearchParamsTypeGroup
	case "any":
		sdkParams.Type = beeperdesktopapi.ChatSearchParamsTypeAny
	}
	switch params.Scope {
	case "titles":
		sdkParams.Scope = beeperdesktopapi.ChatSearchParamsScopeTitles
	case "participants":
		sdkParams.Scope = beeperdesktopapi.ChatSearchParamsScopeParticipants
	}

	page, err := s.client.SDK.Chats.Search(ctx, sdkParams)
	if err != nil {
		return ChatSearchResult{}, err
	}

	result := ChatSearchResult{
		Items:        make([]ChatSearchItem, 0, len(page.Items)),
		HasMore:      page.HasMore,
		OldestCursor: page.OldestCursor,
		NewestCursor: page.NewestCursor,
	}

	for _, chat := range page.Items {
		displayName := displayNameForChat(string(chat.Type), chat.Title, chat.Participants.Items)
		result.Items = append(result.Items, ChatSearchItem{
			ID:          chat.ID,
			Title:       chat.Title,
			DisplayName: displayName,
			Type:        string(chat.Type),
			//nolint:staticcheck // Network is deprecated in SDK but still returned by API for display.
			Network:     chat.Network,
			UnreadCount: chat.UnreadCount,
			IsArchived:  chat.IsArchived,
			IsMuted:     chat.IsMuted,
		})
	}

	return result, nil
}

// Get retrieves details for a single chat by ID.
func (s *ChatsService) Get(ctx context.Context, chatID string) (ChatDetail, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	chat, err := s.client.SDK.Chats.Get(ctx, chatID, beeperdesktopapi.ChatGetParams{})
	if err != nil {
		return ChatDetail{}, err
	}

	detail := ChatDetail{
		ID:        chat.ID,
		Title:     chat.Title,
		AccountID: chat.AccountID,
		//nolint:staticcheck // Network is deprecated in SDK but still returned by API for display.
		Network:                chat.Network,
		Type:                   string(chat.Type),
		UnreadCount:            chat.UnreadCount,
		IsArchived:             chat.IsArchived,
		IsMuted:                chat.IsMuted,
		IsPinned:               chat.IsPinned,
		LastReadMessageSortKey: chat.LastReadMessageSortKey,
		LocalChatID:            chat.LocalChatID,
		ParticipantsTotal:      chat.Participants.Total,
		ParticipantsReturned:   len(chat.Participants.Items),
		ParticipantsHasMore:    chat.Participants.HasMore,
	}
	if !chat.LastActivity.IsZero() {
		detail.LastActivity = chat.LastActivity.Format(time.RFC3339)
	}
	detail.DisplayName = displayNameForChat(string(chat.Type), chat.Title, chat.Participants.Items)

	return detail, nil
}

// Create creates a new chat.
func (s *ChatsService) Create(ctx context.Context, params ChatCreateParams) (ChatCreateResult, error) {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.ChatNewParams{
		AccountID:      params.AccountID,
		ParticipantIDs: params.ParticipantIDs,
	}
	switch params.Type {
	case "single":
		sdkParams.Type = beeperdesktopapi.ChatNewParamsTypeSingle
	case "group":
		sdkParams.Type = beeperdesktopapi.ChatNewParamsTypeGroup
	}
	if params.Title != "" {
		sdkParams.Title = beeperdesktopapi.String(params.Title)
	}
	if params.MessageText != "" {
		sdkParams.MessageText = beeperdesktopapi.String(params.MessageText)
	}

	resp, err := s.client.SDK.Chats.New(ctx, sdkParams)
	if err != nil {
		return ChatCreateResult{}, err
	}

	return ChatCreateResult{ChatID: resp.ChatID}, nil
}

// Archive archives or unarchives a chat.
func (s *ChatsService) Archive(ctx context.Context, chatID string, archived bool) error {
	ctx, cancel := s.client.contextWithTimeout(ctx)
	defer cancel()

	sdkParams := beeperdesktopapi.ChatArchiveParams{
		Archived: beeperdesktopapi.Bool(archived),
	}

	return s.client.SDK.Chats.Archive(ctx, chatID, sdkParams)
}
