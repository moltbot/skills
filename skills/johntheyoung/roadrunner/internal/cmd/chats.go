package cmd

import (
	"context"
	"fmt"
	"os"
	"text/tabwriter"
	"time"

	"github.com/johntheyoung/roadrunner/internal/beeperapi"
	"github.com/johntheyoung/roadrunner/internal/config"
	"github.com/johntheyoung/roadrunner/internal/errfmt"
	"github.com/johntheyoung/roadrunner/internal/outfmt"
	"github.com/johntheyoung/roadrunner/internal/ui"
)

// ChatsCmd is the parent command for chat subcommands.
type ChatsCmd struct {
	List    ChatsListCmd    `cmd:"" help:"List chats"`
	Search  ChatsSearchCmd  `cmd:"" help:"Search chats"`
	Get     ChatsGetCmd     `cmd:"" help:"Get chat details"`
	Archive ChatsArchiveCmd `cmd:"" help:"Archive or unarchive a chat"`
}

// ChatsListCmd lists chats.
type ChatsListCmd struct {
	AccountIDs []string `help:"Filter by account IDs" name:"account-ids"`
	Cursor     string   `help:"Pagination cursor"`
	Direction  string   `help:"Pagination direction: before|after" enum:"before,after," default:""`
}

// Run executes the chats list command.
func (c *ChatsListCmd) Run(ctx context.Context, flags *RootFlags) error {
	u := ui.FromContext(ctx)

	token, _, err := config.GetToken()
	if err != nil {
		return err
	}

	timeout := time.Duration(flags.Timeout) * time.Second
	client, err := beeperapi.NewClient(token, flags.BaseURL, timeout)
	if err != nil {
		return err
	}

	resp, err := client.Chats().List(ctx, beeperapi.ChatListParams{
		AccountIDs: c.AccountIDs,
		Cursor:     c.Cursor,
		Direction:  c.Direction,
	})
	if err != nil {
		return err
	}

	// JSON output
	if outfmt.IsJSON(ctx) {
		return outfmt.WriteJSON(os.Stdout, resp)
	}

	// Plain output (TSV)
	if outfmt.IsPlain(ctx) {
		for _, item := range resp.Items {
			u.Out().Printf("%s\t%s\t%s", item.ID, item.Title, item.AccountID)
		}
		return nil
	}

	// Human-readable output
	if len(resp.Items) == 0 {
		u.Out().Warn("No chats found")
		return nil
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	u.Out().Printf("Chats (%d):\n", len(resp.Items))
	for _, item := range resp.Items {
		title := item.Title
		if item.DisplayName != "" {
			title = item.DisplayName
		}
		title = ui.Truncate(title, 40)
		_, _ = w.Write([]byte(fmt.Sprintf("  %s\t%s\n", title, item.ID)))
	}
	w.Flush()

	if resp.HasMore && resp.OldestCursor != "" {
		u.Out().Dim(fmt.Sprintf("\nMore chats available. Use --cursor=%q --direction=before", resp.OldestCursor))
	}

	return nil
}

// ChatsSearchCmd searches for chats.
type ChatsSearchCmd struct {
	Query      string `arg:"" optional:"" help:"Search query"`
	Inbox      string `help:"Filter by inbox: primary|low-priority|archive" enum:"primary,low-priority,archive," default:""`
	UnreadOnly bool   `help:"Only show unread chats" name:"unread-only"`
	Type       string `help:"Filter by type: direct|group|any" enum:"direct,group,any," default:""`
	Scope      string `help:"Search scope: titles|participants" enum:"titles,participants," default:""`
	Limit      int    `help:"Max results (1-200)" default:"50"`
	Cursor     string `help:"Pagination cursor"`
	Direction  string `help:"Pagination direction: before|after" enum:"before,after," default:""`
}

// Run executes the chats search command.
func (c *ChatsSearchCmd) Run(ctx context.Context, flags *RootFlags) error {
	u := ui.FromContext(ctx)

	if c.Limit < 1 || c.Limit > 200 {
		return errfmt.UsageError("invalid --limit %d (expected 1-200)", c.Limit)
	}

	token, _, err := config.GetToken()
	if err != nil {
		return err
	}

	timeout := time.Duration(flags.Timeout) * time.Second
	client, err := beeperapi.NewClient(token, flags.BaseURL, timeout)
	if err != nil {
		return err
	}

	resp, err := client.Chats().Search(ctx, beeperapi.ChatSearchParams{
		Query:      c.Query,
		Inbox:      c.Inbox,
		UnreadOnly: c.UnreadOnly,
		Type:       c.Type,
		Scope:      c.Scope,
		Limit:      c.Limit,
		Cursor:     c.Cursor,
		Direction:  c.Direction,
	})
	if err != nil {
		return err
	}

	// JSON output
	if outfmt.IsJSON(ctx) {
		return outfmt.WriteJSON(os.Stdout, resp)
	}

	// Plain output (TSV)
	if outfmt.IsPlain(ctx) {
		for _, item := range resp.Items {
			u.Out().Printf("%s\t%s\t%s\t%d", item.ID, item.Title, item.Type, item.UnreadCount)
		}
		return nil
	}

	// Human-readable output
	if len(resp.Items) == 0 {
		u.Out().Warn("No chats found")
		return nil
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	u.Out().Printf("Found %d chats:\n", len(resp.Items))
	for _, item := range resp.Items {
		title := item.Title
		if item.DisplayName != "" {
			title = item.DisplayName
		}
		title = ui.Truncate(title, 35)
		unread := ""
		if item.UnreadCount > 0 {
			unread = fmt.Sprintf("(%d)", item.UnreadCount)
		}
		_, _ = w.Write([]byte(fmt.Sprintf("  %s\t%s\t%s\t%s\n", title, item.Type, unread, item.ID)))
	}
	w.Flush()

	if resp.HasMore && resp.OldestCursor != "" {
		u.Out().Dim(fmt.Sprintf("\nMore chats available. Use --cursor=%q --direction=before", resp.OldestCursor))
	}

	return nil
}

// ChatsGetCmd gets a single chat.
type ChatsGetCmd struct {
	ChatID string `arg:"" name:"chatID" help:"Chat ID to retrieve"`
}

// Run executes the chats get command.
func (c *ChatsGetCmd) Run(ctx context.Context, flags *RootFlags) error {
	u := ui.FromContext(ctx)

	token, _, err := config.GetToken()
	if err != nil {
		return err
	}

	timeout := time.Duration(flags.Timeout) * time.Second
	client, err := beeperapi.NewClient(token, flags.BaseURL, timeout)
	if err != nil {
		return err
	}

	chat, err := client.Chats().Get(ctx, c.ChatID)
	if err != nil {
		return err
	}

	// JSON output
	if outfmt.IsJSON(ctx) {
		return outfmt.WriteJSON(os.Stdout, chat)
	}

	// Plain output
	if outfmt.IsPlain(ctx) {
		u.Out().Printf("%s\t%s\t%s", chat.ID, chat.Title, chat.AccountID)
		return nil
	}

	// Human-readable output
	displayTitle := chat.Title
	if chat.DisplayName != "" {
		displayTitle = chat.DisplayName
	}
	u.Out().Printf("Chat: %s", displayTitle)
	if chat.DisplayName != "" && chat.DisplayName != chat.Title {
		u.Out().Printf("Title:  %s", chat.Title)
	}
	u.Out().Printf("ID:      %s", chat.ID)
	u.Out().Printf("Account: %s", chat.AccountID)
	u.Out().Printf("Type:    %s", chat.Type)
	u.Out().Printf("Network: %s", chat.Network)
	if chat.UnreadCount > 0 {
		u.Out().Printf("Unread:  %d", chat.UnreadCount)
	}
	if chat.LastActivity != "" {
		u.Out().Printf("Last:    %s", chat.LastActivity)
	}

	return nil
}

// ChatsArchiveCmd archives or unarchives a chat.
type ChatsArchiveCmd struct {
	ChatID    string `arg:"" name:"chatID" help:"Chat ID to archive/unarchive"`
	Unarchive bool   `help:"Unarchive instead of archive" name:"unarchive"`
}

// Run executes the chats archive command.
func (c *ChatsArchiveCmd) Run(ctx context.Context, flags *RootFlags) error {
	u := ui.FromContext(ctx)

	token, _, err := config.GetToken()
	if err != nil {
		return err
	}

	timeout := time.Duration(flags.Timeout) * time.Second
	client, err := beeperapi.NewClient(token, flags.BaseURL, timeout)
	if err != nil {
		return err
	}

	archived := !c.Unarchive
	action := "archive chat " + c.ChatID
	if c.Unarchive {
		action = "unarchive chat " + c.ChatID
	}
	if err := confirmDestructive(flags, action); err != nil {
		return err
	}
	if err := client.Chats().Archive(ctx, c.ChatID, archived); err != nil {
		return err
	}

	// JSON output
	if outfmt.IsJSON(ctx) {
		result := map[string]any{
			"chat_id":  c.ChatID,
			"archived": archived,
		}
		return outfmt.WriteJSON(os.Stdout, result)
	}

	// Plain output
	if outfmt.IsPlain(ctx) {
		action := "archived"
		if c.Unarchive {
			action = "unarchived"
		}
		u.Out().Printf("%s\t%s", c.ChatID, action)
		return nil
	}

	// Human-readable output
	if c.Unarchive {
		u.Out().Success("Chat unarchived")
	} else {
		u.Out().Success("Chat archived")
	}

	return nil
}
