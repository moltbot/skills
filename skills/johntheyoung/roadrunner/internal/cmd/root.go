package cmd

import (
	"context"
	"errors"
	"os"
	"runtime/debug"

	"github.com/alecthomas/kong"

	"github.com/johntheyoung/roadrunner/internal/errfmt"
	"github.com/johntheyoung/roadrunner/internal/outfmt"
	"github.com/johntheyoung/roadrunner/internal/ui"
)

// Build info set at build time via ldflags.
var (
	Version = "dev"
	Commit  = ""
	Date    = ""
)

func init() {
	// If Version wasn't set by ldflags (goreleaser), try to get it from
	// Go module info embedded by "go install". This ensures users who
	// install via "go install ...@latest" see the correct version.
	if Version == "dev" {
		if info, ok := debug.ReadBuildInfo(); ok && info.Main.Version != "" {
			Version = info.Main.Version
		}
	}
}

// RootFlags contains global flags available to all commands.
type RootFlags struct {
	Color   string           `help:"Color output: auto|always|never" default:"auto" env:"BEEPER_COLOR"`
	JSON    bool             `help:"Output JSON to stdout (best for scripting)" env:"BEEPER_JSON"`
	Plain   bool             `help:"Output stable TSV to stdout (no colors)" env:"BEEPER_PLAIN"`
	Verbose bool             `help:"Enable debug logging" short:"v"`
	NoInput bool             `help:"Never prompt; fail instead (useful for CI)" env:"BEEPER_NO_INPUT"`
	Force   bool             `help:"Skip confirmations for destructive commands" short:"f"`
	Timeout int              `help:"Timeout for API calls in seconds (0=none)" default:"30" env:"BEEPER_TIMEOUT"`
	BaseURL string           `help:"API base URL" default:"http://localhost:23373" env:"BEEPER_URL"`
	Version kong.VersionFlag `help:"Show version and exit"`
}

// CLI is the root command structure.
type CLI struct {
	RootFlags

	Auth       AuthCmd       `cmd:"" help:"Manage authentication"`
	Accounts   AccountsCmd   `cmd:"" help:"Manage messaging accounts"`
	Contacts   ContactsCmd   `cmd:"" help:"Search contacts"`
	Chats      ChatsCmd      `cmd:"" help:"Manage chats"`
	Messages   MessagesCmd   `cmd:"" help:"Manage messages"`
	Reminders  RemindersCmd  `cmd:"" help:"Manage chat reminders"`
	Search     SearchCmd     `cmd:"" help:"Global search across chats and messages"`
	Focus      FocusCmd      `cmd:"" help:"Focus Beeper Desktop app"`
	Doctor     DoctorCmd     `cmd:"" help:"Diagnose configuration and connectivity"`
	Version    VersionCmd    `cmd:"" help:"Show version information"`
	Completion CompletionCmd `cmd:"" help:"Generate shell completions"`
}

// Execute runs the CLI and returns an exit code.
func Execute() int {
	cli := &CLI{}

	// Check for expanded help mode
	helpCompact := os.Getenv("BEEPER_HELP") != "full"

	// Pre-parse to get flags for UI setup
	parser, err := kong.New(cli,
		kong.Name("rr"),
		kong.Description("CLI for Beeper Desktop. Beep beep!"),
		kong.UsageOnError(),
		kong.Vars{"version": VersionString()},
		kong.ConfigureHelp(kong.HelpOptions{Compact: helpCompact}),
	)
	if err != nil {
		_, _ = os.Stderr.WriteString("error: " + err.Error() + "\n")
		return errfmt.ExitFailure
	}

	kongCtx, err := parser.Parse(os.Args[1:])
	if err != nil {
		// Handle parse errors with our custom exit codes
		// Kong's FatalIfErrorf calls os.Exit directly, bypassing our handling
		_, _ = os.Stderr.WriteString("error: " + err.Error() + "\n")
		_, _ = os.Stderr.WriteString("Run with --help to see available commands and flags\n")
		return errfmt.ExitUsageError
	}

	// Validate flag combinations
	mode, err := outfmt.FromFlags(cli.JSON, cli.Plain)
	if err != nil {
		_, _ = os.Stderr.WriteString("error: " + errfmt.Format(err) + "\n")
		return errfmt.ExitUsageError
	}

	// Create UI (respects --color and NO_COLOR)
	// Disable colors for JSON/Plain output
	colorMode := cli.Color
	if cli.JSON || cli.Plain {
		colorMode = "never"
	}

	u, err := ui.New(ui.Options{
		Stdout: os.Stdout,
		Stderr: os.Stderr,
		Color:  colorMode,
	})
	if err != nil {
		_, _ = os.Stderr.WriteString("error: " + errfmt.Format(err) + "\n")
		return errfmt.ExitUsageError
	}

	// Build context with UI and output mode
	ctx := context.Background()
	ctx = ui.WithUI(ctx, u)
	ctx = outfmt.WithMode(ctx, mode)

	// Bind context and flags for command execution
	kongCtx.BindTo(ctx, (*context.Context)(nil))
	kongCtx.Bind(&cli.RootFlags)

	// Run the command
	if err := kongCtx.Run(); err != nil {
		// Check for ExitError with specific code
		var exitErr *errfmt.ExitError
		if errors.As(err, &exitErr) {
			if exitErr.Err != nil {
				u.Err().Error("error: " + errfmt.Format(exitErr.Err))
			}
			return exitErr.Code
		}

		// Default error handling
		u.Err().Error("error: " + errfmt.Format(err))
		return errfmt.ExitFailure
	}

	return errfmt.ExitSuccess
}
