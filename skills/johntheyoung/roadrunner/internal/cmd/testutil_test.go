package cmd

import (
	"io"
	"os"
	"testing"
)

func captureOutput(t *testing.T, fn func()) (string, string) {
	t.Helper()

	origOut := os.Stdout
	origErr := os.Stderr

	outR, outW, err := os.Pipe()
	if err != nil {
		t.Fatalf("pipe stdout: %v", err)
	}
	errR, errW, err := os.Pipe()
	if err != nil {
		t.Fatalf("pipe stderr: %v", err)
	}

	os.Stdout = outW
	os.Stderr = errW

	fn()

	_ = outW.Close()
	_ = errW.Close()
	os.Stdout = origOut
	os.Stderr = origErr

	outBytes, _ := io.ReadAll(outR)
	errBytes, _ := io.ReadAll(errR)
	_ = outR.Close()
	_ = errR.Close()

	return string(outBytes), string(errBytes)
}

func withArgs(t *testing.T, args []string, fn func()) {
	t.Helper()

	orig := os.Args
	os.Args = args
	t.Cleanup(func() { os.Args = orig })

	fn()
}

func withStdin(t *testing.T, input string, fn func()) {
	t.Helper()

	orig := os.Stdin
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatalf("pipe stdin: %v", err)
	}
	os.Stdin = r

	if input != "" {
		_, _ = io.WriteString(w, input)
	}
	_ = w.Close()

	fn()

	_ = r.Close()
	os.Stdin = orig
}
