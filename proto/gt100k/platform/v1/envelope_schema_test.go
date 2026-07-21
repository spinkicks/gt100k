package platformv1

import (
	"os"
	"regexp"
	"strconv"
	"strings"
	"testing"
)

type protoField struct {
	typeName string
	name     string
	tag      int
	repeated bool
}

func TestEnvelopeFileMetadata(t *testing.T) {
	source := readEnvelopeProto(t)

	for _, declaration := range []string{
		`package gt100k.platform.v1;`,
		`import "google/protobuf/timestamp.proto";`,
		`option go_package = "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1;platformv1";`,
	} {
		if !strings.Contains(source, declaration) {
			t.Errorf("envelope.proto missing %q", declaration)
		}
	}
}

func TestActorClassValues(t *testing.T) {
	source := readEnvelopeProto(t)
	want := map[string]int{
		"ACTOR_CLASS_UNSPECIFIED": 0,
		"HUMAN":                   1,
		"GUARDIAN":                2,
		"CHILD":                   3,
		"STAFF":                   4,
		"MODEL":                   5,
		"SYSTEM":                  6,
	}

	if got := parseEnum(t, source, "ActorClass"); !equalEnum(got, want) {
		t.Fatalf("ActorClass values = %v, want %v", got, want)
	}
}

func TestActorRefFields(t *testing.T) {
	source := readEnvelopeProto(t)
	want := []protoField{
		{typeName: "string", name: "ref", tag: 1},
		{typeName: "ActorClass", name: "class", tag: 2},
		{typeName: "string", name: "role", tag: 3},
	}

	assertFields(t, parseMessage(t, source, "ActorRef"), want)
}

func TestEnvelopeFields(t *testing.T) {
	source := readEnvelopeProto(t)
	want := []protoField{
		{typeName: "string", name: "contract_id", tag: 1},
		{typeName: "string", name: "schema_version", tag: 2},
		{typeName: "string", name: "tenant_id", tag: 3},
		{typeName: "ActorRef", name: "actor_ref", tag: 4},
		{typeName: "google.protobuf.Timestamp", name: "occurred_at", tag: 5},
		{typeName: "google.protobuf.Timestamp", name: "recorded_at", tag: 6},
		{typeName: "string", name: "correlation_id", tag: 7},
		{typeName: "string", name: "causation_id", tag: 8},
		{typeName: "string", name: "consent_purpose", tag: 9},
		{typeName: "string", name: "policy_version", tag: 10},
		{typeName: "string", name: "model_version", tag: 11},
		{typeName: "string", name: "evidence_refs", tag: 12, repeated: true},
	}

	assertFields(t, parseMessage(t, source, "Envelope"), want)
}

func TestEqualEnumRejectsMissingZeroValue(t *testing.T) {
	got := map[string]int{"EXTRA": 0, "HUMAN": 1}
	want := map[string]int{"ACTOR_CLASS_UNSPECIFIED": 0, "HUMAN": 1}

	if equalEnum(got, want) {
		t.Fatal("equalEnum accepted a missing zero-valued enum member")
	}
}

func readEnvelopeProto(t *testing.T) string {
	t.Helper()

	source, err := os.ReadFile("envelope.proto")
	if err != nil {
		t.Fatalf("read envelope.proto: %v", err)
	}
	return string(source)
}

func parseEnum(t *testing.T, source, name string) map[string]int {
	t.Helper()
	body := declarationBody(t, source, "enum", name)
	valuePattern := regexp.MustCompile(`(?m)^\s*([A-Z][A-Z0-9_]*)\s*=\s*(\d+)\s*;`)
	values := make(map[string]int)
	for _, match := range valuePattern.FindAllStringSubmatch(body, -1) {
		value, err := strconv.Atoi(match[2])
		if err != nil {
			t.Fatalf("parse %s.%s value: %v", name, match[1], err)
		}
		values[match[1]] = value
	}
	return values
}

func parseMessage(t *testing.T, source, name string) []protoField {
	t.Helper()
	body := declarationBody(t, source, "message", name)
	fieldPattern := regexp.MustCompile(`(?m)^\s*(repeated\s+)?([A-Za-z][A-Za-z0-9_.]*)\s+([a-z][a-z0-9_]*)\s*=\s*(\d+)\s*;`)
	matches := fieldPattern.FindAllStringSubmatch(body, -1)
	fields := make([]protoField, 0, len(matches))
	for _, match := range matches {
		tag, err := strconv.Atoi(match[4])
		if err != nil {
			t.Fatalf("parse %s.%s tag: %v", name, match[3], err)
		}
		fields = append(fields, protoField{
			typeName: match[2],
			name:     match[3],
			tag:      tag,
			repeated: match[1] != "",
		})
	}
	return fields
}

func declarationBody(t *testing.T, source, kind, name string) string {
	t.Helper()
	pattern := regexp.MustCompile(`(?s)\b` + regexp.QuoteMeta(kind) + `\s+` + regexp.QuoteMeta(name) + `\s*\{(.*?)\}`)
	match := pattern.FindStringSubmatch(source)
	if match == nil {
		t.Fatalf("%s %s not found", kind, name)
	}
	return match[1]
}

func assertFields(t *testing.T, got, want []protoField) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("fields = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("field %d = %+v, want %+v", i, got[i], want[i])
		}
	}
}

func equalEnum(got, want map[string]int) bool {
	if len(got) != len(want) {
		return false
	}
	for name, value := range want {
		gotValue, ok := got[name]
		if !ok || gotValue != value {
			return false
		}
	}
	return true
}
