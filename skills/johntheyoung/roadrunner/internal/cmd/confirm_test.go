package cmd

import (
	"errors"
	"testing"

	"github.com/johntheyoung/roadrunner/internal/errfmt"
)

func TestConfirmDestructiveNonTTY(t *testing.T) {
	withStdin(t, "", func() {
		err := confirmDestructive(&RootFlags{}, "archive chat")
		if err == nil {
			t.Fatal("confirmDestructive expected error")
		}
		var exitErr *errfmt.ExitError
		if !errors.As(err, &exitErr) {
			t.Fatalf("confirmDestructive error = %T, want *errfmt.ExitError", err)
		}
		if exitErr.Code != errfmt.ExitUsageError {
			t.Fatalf("confirmDestructive code = %d, want %d", exitErr.Code, errfmt.ExitUsageError)
		}
	})
}
