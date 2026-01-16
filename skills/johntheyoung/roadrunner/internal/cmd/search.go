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

// SearchCmd performs a global search.
type SearchCmd struct {
	Query             string `arg:"" help:"Search query (literal word match)"`
	MessagesCursor    string `help:"Cursor for message results pagination" name:"messages-cursor"`
	MessagesDirection string `help:"Pagination direction for message results: before|after" name:"messages-direction" enum:"before,after," default:""`
	MessagesLimit     int    `help:"Max messages per page when paging (1-20)" name:"messages-limit" default:"0"`
}

// Run executes the search command.
func (c *SearchCmd) Run(ctx context.Context, flags *RootFlags) error {
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

	if c.MessagesLimit < 0 || c.MessagesLimit > 20 {
		return errfmt.UsageError("invalid --messages-limit %d (expected 1-20)", c.MessagesLimit)
	}

	resp, err := client.Search(ctx, beeperapi.SearchParams{
		Query:             c.Query,
		MessagesCursor:    c.MessagesCursor,
		MessagesDirection: c.MessagesDirection,
		MessagesLimit:     c.MessagesLimit,
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
		for _, chat := range resp.Chats {
			u.Out().Printf("chat\t%s\t%s\t%s", chat.ID, chat.Title, chat.Type)
		}
		for _, chat := range resp.InGroups {
			u.Out().Printf("group\t%s\t%s\t%s", chat.ID, chat.Title, chat.Type)
		}
		for _, msg := range resp.Messages.Items {
			u.Out().Printf("message\t%s\t%s\t%s", msg.ID, msg.ChatID, ui.Truncate(msg.Text, 50))
		}
		return nil
	}

	// Human-readable output
	hasResults := len(resp.Chats) > 0 || len(resp.InGroups) > 0 || len(resp.Messages.Items) > 0

	if !hasResults {
		u.Out().Warn("No results found")
		u.Out().Dim("Note: Search uses literal word match, not semantic search.")
		return nil
	}

	// Chats
	if len(resp.Chats) > 0 {
		u.Out().Printf("Chats (%d):", len(resp.Chats))
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		for _, chat := range resp.Chats {
			title := chat.Title
			if chat.DisplayName != "" {
				title = chat.DisplayName
			}
			title = ui.Truncate(title, 35)
			_, _ = w.Write([]byte(fmt.Sprintf("  %s\t%s\t%s\n", title, chat.Type, chat.ID)))
		}
		w.Flush()
		u.Out().Println("")
	}

	// In groups (participant matches)
	if len(resp.InGroups) > 0 {
		u.Out().Printf("In Groups (%d):", len(resp.InGroups))
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		for _, chat := range resp.InGroups {
			title := chat.Title
			if chat.DisplayName != "" {
				title = chat.DisplayName
			}
			title = ui.Truncate(title, 35)
			_, _ = w.Write([]byte(fmt.Sprintf("  %s\t%s\t%s\n", title, chat.Type, chat.ID)))
		}
		w.Flush()
		u.Out().Println("")
	}

	// Messages
	if len(resp.Messages.Items) > 0 {
		u.Out().Printf("Messages (%d):", len(resp.Messages.Items))
		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		for _, msg := range resp.Messages.Items {
			ts := ""
			if msg.Timestamp != "" {
				if t, err := time.Parse(time.RFC3339, msg.Timestamp); err == nil {
					ts = t.Format("Jan 2")
				}
			}
			text := ui.Truncate(msg.Text, 40)
			_, _ = w.Write([]byte(fmt.Sprintf("  [%s]\t%s:\t%s\n", ts, msg.SenderName, text)))
		}
		w.Flush()

		if resp.Messages.HasMore {
			if resp.Messages.OldestCursor != "" {
				u.Out().Dim(fmt.Sprintf("\nMore message results available. Use --messages-cursor=%q --messages-direction=before.", resp.Messages.OldestCursor))
			} else {
				u.Out().Dim("\nMore message results available. Use 'rr messages search' for pagination.")
			}
		}
	}

	return nil
}
