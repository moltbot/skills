package cmd

import (
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/johntheyoung/roadrunner/internal/errfmt"
)

func TestExecute_UnknownFlag(t *testing.T) {
	withArgs(t, []string{"rr", "--definitely-nope"}, func() {
		var code int
		_, errText := captureOutput(t, func() {
			code = Execute()
		})
		if code != errfmt.ExitUsageError {
			t.Fatalf("exit code = %d, want %d", code, errfmt.ExitUsageError)
		}
		if !strings.Contains(errText, "unknown flag") {
			t.Fatalf("expected unknown flag error, got %q", errText)
		}
	})
}

func TestExecute_JSONPlainConflict(t *testing.T) {
	withArgs(t, []string{"rr", "--json", "--plain", "version"}, func() {
		var code int
		_, errText := captureOutput(t, func() {
			code = Execute()
		})
		if code != errfmt.ExitUsageError {
			t.Fatalf("exit code = %d, want %d", code, errfmt.ExitUsageError)
		}
		if !strings.Contains(errText, "cannot use both --json and --plain") {
			t.Fatalf("expected flag conflict error, got %q", errText)
		}
	})
}

func TestExecute_Help(t *testing.T) {
	if os.Getenv("RR_HELPER") == "1" {
		os.Args = []string{"rr", "--help"}
		os.Exit(Execute())
		return
	}

	cmd := exec.Command(os.Args[0], "-test.run=TestExecute_Help")
	cmd.Env = append(os.Environ(), "RR_HELPER=1")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("helper failed: %v\n%s", err, string(out))
	}
	if !strings.Contains(string(out), "Beeper Desktop") && !strings.Contains(string(out), "Usage:") {
		t.Fatalf("expected help output, got %q", string(out))
	}
}
