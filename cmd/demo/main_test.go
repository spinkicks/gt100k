package main

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"strings"
	"testing"
)

func TestRunCompletesSyntheticFoundationWalkthrough(t *testing.T) {
	var output bytes.Buffer

	if err := run(context.Background(), &output); err != nil {
		t.Fatalf("run() error = %v", err)
	}

	text := output.String()
	wantStages := []string{
		"synthetic-only foundation spine demo",
		"provision: learner_synth_001 -> actor_pseudo_child_01",
		"consent: guardian grant and child assent recorded",
		"authorize: embedded OPA allowed onboarding.schedule",
		"command: consequential human decision and traceable event committed",
		"delivery: outbox relayed and event projected exactly once",
		"override: two distinct human approvers preserved the target",
		"appeal: independent reviewer preserved the target",
		"deletion: consent withdrawn, Temporal workflow Completed, audit preserved",
		"complete: all state stayed in memory; no cloud resources created",
	}
	position := 0
	for _, stage := range wantStages {
		next := strings.Index(text[position:], stage)
		if next < 0 {
			t.Fatalf("output missing ordered stage %q:\n%s", stage, text)
		}
		position += next + len(stage)
	}
}

func TestRunDoesNotLeakTemporalDebugLogs(t *testing.T) {
	if os.Getenv("GT100K_DEMO_HELPER") == "1" {
		if err := run(context.Background(), os.Stdout); err != nil {
			t.Fatal(err)
		}
		return
	}

	command := exec.Command(os.Args[0], "-test.run=^TestRunDoesNotLeakTemporalDebugLogs$")
	command.Env = append(os.Environ(), "GT100K_DEMO_HELPER=1")
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("demo helper error = %v:\n%s", err, output)
	}
	if strings.Contains(string(output), "DEBUG handleActivityResult") {
		t.Fatalf("demo leaked Temporal debug logs:\n%s", output)
	}
}
