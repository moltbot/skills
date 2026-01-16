package cmd

import (
	"context"
	"errors"
	"testing"

	"github.com/johntheyoung/roadrunner/internal/errfmt"
)

func TestMessagesSearchInvalidMediaType(t *testing.T) {
	cmd := MessagesSearchCmd{
		MediaTypes: []string{"gif"},
	}
	err := cmd.Run(context.Background(), &RootFlags{})
	if err == nil {
		t.Fatal("expected error")
	}
	var exitErr *errfmt.ExitError
	if !errors.As(err, &exitErr) {
		t.Fatalf("error = %T, want *errfmt.ExitError", err)
	}
	if exitErr.Code != errfmt.ExitUsageError {
		t.Fatalf("exit code = %d, want %d", exitErr.Code, errfmt.ExitUsageError)
	}
}

func TestMessagesSearchInvalidDateAfter(t *testing.T) {
	cmd := MessagesSearchCmd{
		DateAfter: "not-a-time",
	}
	err := cmd.Run(context.Background(), &RootFlags{})
	if err == nil {
		t.Fatal("expected error")
	}
	var exitErr *errfmt.ExitError
	if !errors.As(err, &exitErr) {
		t.Fatalf("error = %T, want *errfmt.ExitError", err)
	}
	if exitErr.Code != errfmt.ExitUsageError {
		t.Fatalf("exit code = %d, want %d", exitErr.Code, errfmt.ExitUsageError)
	}
}
