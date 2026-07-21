package platformv1

import (
	"os"
	"strconv"
	"strings"
	"testing"
)

const platformGoPackage = `option go_package = "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1;platformv1";`

type messageSchema struct {
	name   string
	fields []protoField
}

type enumSchema struct {
	name   string
	values map[string]int
}

type contractSchema struct {
	file     string
	imports  []string
	messages []messageSchema
	enums    []enumSchema
}

func TestFoundationContractFileMetadata(t *testing.T) {
	for _, schema := range foundationContractSchemas() {
		t.Run(schema.file, func(t *testing.T) {
			source := readProto(t, schema.file)
			declarations := []string{
				`syntax = "proto3";`,
				`package gt100k.platform.v1;`,
				platformGoPackage,
			}
			for _, imported := range schema.imports {
				declarations = append(declarations, `import "`+imported+`";`)
			}
			for _, declaration := range declarations {
				if !strings.Contains(source, declaration) {
					t.Errorf("%s missing %q", schema.file, declaration)
				}
			}
		})
	}
}

func TestFoundationContractMessages(t *testing.T) {
	for _, schema := range foundationContractSchemas() {
		for _, message := range schema.messages {
			t.Run(message.name, func(t *testing.T) {
				source := readProto(t, schema.file)
				assertFields(t, parseMessage(t, source, message.name), message.fields)
			})
		}
	}
}

func TestFoundationContractEnums(t *testing.T) {
	for _, schema := range foundationContractSchemas() {
		for _, enum := range schema.enums {
			t.Run(enum.name, func(t *testing.T) {
				source := readProto(t, schema.file)
				if got := parseEnum(t, source, enum.name); !equalEnum(got, enum.values) {
					t.Fatalf("%s values = %v, want %v", enum.name, got, enum.values)
				}
			})
		}
	}
}

func readProto(t *testing.T, name string) string {
	t.Helper()

	source, err := os.ReadFile(name)
	if err != nil {
		t.Fatalf("read %s: %v", name, err)
	}
	return string(source)
}

func foundationContractSchemas() []contractSchema {
	return []contractSchema{
		{
			file:    "learner_event.proto",
			imports: []string{"gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{
				{name: "EventContext", fields: fields("string session_ref=1, string cohort_ref=2, string project_ref=3")},
				{name: "LearnerEvent", fields: fields("Envelope header=1, string event_type=2, string learner_ref=3, string source=4, EventContext context=5, string payload_schema=6, repeated string evidence_refs=7")},
			},
		},
		{
			file:    "consent.proto",
			imports: []string{"google/protobuf/timestamp.proto", "gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{
				{name: "WithdrawalState", fields: fields("bool withdrawn=1, google.protobuf.Timestamp withdrawn_at=2")},
				{name: "ConsentGrant", fields: fields("Envelope header=1, string subject_ref=2, bool guardian_authority=3, string purpose=4, repeated string data_categories=5, repeated string processors=6, string jurisdiction=7, google.protobuf.Timestamp effective_at=8, google.protobuf.Timestamp expiry_at=9, string collection_method=10, string document_hash=11, WithdrawalState withdrawal_state=12")},
			},
		},
		{
			file:     "assent.proto",
			imports:  []string{"google/protobuf/timestamp.proto", "gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{{name: "AssentRecord", fields: fields("Envelope header=1, string child_ref=2, string age_band=3, string notice_version=4, repeated string choices_shown=5, AssentResponse response=6, ActorRef facilitator=7, google.protobuf.Timestamp recorded_at=8, google.protobuf.Timestamp renewal_at=9, bool honorable=10")}},
			enums: []enumSchema{{name: "AssentResponse", values: map[string]int{
				"ASSENT_RESPONSE_UNSPECIFIED": 0,
				"ASSENT":                      1,
				"REFUSAL":                     2,
				"DISSENT":                     3,
			}}},
		},
		{
			file:     "decision.proto",
			imports:  []string{"google/protobuf/timestamp.proto", "gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{{name: "DecisionRecord", fields: fields("Envelope header=1, string decision_type=2, string subject_ref=3, repeated string candidates=4, string outcome=5, repeated string reason_codes=6, repeated string evidence_snapshot=7, double uncertainty=8, string policy_version=9, string model_version=10, ActorRef authorized_human=11, google.protobuf.Timestamp effective_at=12, bool consequential=13")}},
		},
		{
			file:     "override.proto",
			imports:  []string{"google/protobuf/timestamp.proto", "gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{{name: "OverrideRecord", fields: fields("Envelope header=1, string target_decision=2, string override_class=3, string prior_outcome=4, string new_outcome=5, string authorized_role=6, string rationale=7, repeated string evidence_refs=8, repeated ActorRef approvers=9, google.protobuf.Timestamp review_at=10")}},
		},
		{
			file:    "appeal.proto",
			imports: []string{"google/protobuf/timestamp.proto", "gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{
				{name: "Deadlines", fields: fields("google.protobuf.Timestamp respond_by=1")},
				{name: "Appeal", fields: fields("Envelope header=1, string appellant_role=2, string target_decision=3, string grounds=4, repeated string submitted_evidence_refs=5, string requested_remedy=6, AppealStatus status=7, ActorRef independent_reviewer=8, Deadlines deadlines=9, string resolution=10")},
			},
			enums: []enumSchema{{name: "AppealStatus", values: map[string]int{
				"APPEAL_STATUS_UNSPECIFIED": 0,
				"FILED":                     1,
				"UNDER_REVIEW":              2,
				"RESOLVED":                  3,
				"REOPENED":                  4,
				"LATE":                      5,
			}}},
		},
		{
			file:     "audit.proto",
			imports:  []string{"gt100k/platform/v1/envelope.proto"},
			messages: []messageSchema{{name: "AuditEntry", fields: fields("string entry_id=1, Envelope header=2, ActorRef actor_ref=3, string action=4, bool policy_allow=5, string policy_reason=6, string policy_version=7, string outcome=8")}},
		},
		{
			file:     "enrollment.proto",
			messages: []messageSchema{{name: "EligibleLearner", fields: fields("string learner_ref=1, string accommodation_profile_ref=2, string eligibility_evidence_ref=3, Track track=4")}},
			enums: []enumSchema{{name: "Track", values: map[string]int{
				"TRACK_UNSPECIFIED": 0,
				"TRACK_A":           1,
				"TRACK_B":           2,
			}}},
		},
	}
}

func fields(spec string) []protoField {
	items := strings.Split(spec, ",")
	parsed := make([]protoField, 0, len(items))
	for _, item := range items {
		parts := strings.Fields(strings.TrimSpace(item))
		repeated := len(parts) == 3 && parts[0] == "repeated"
		if repeated {
			parts = parts[1:]
		}
		if len(parts) != 2 {
			panic("invalid schema field: " + item)
		}
		nameAndTag := strings.SplitN(parts[1], "=", 2)
		if len(nameAndTag) != 2 {
			panic("invalid schema field name and tag: " + item)
		}
		tag, err := strconv.Atoi(nameAndTag[1])
		if err != nil {
			panic("invalid schema field tag: " + item)
		}
		parsed = append(parsed, protoField{typeName: parts[0], name: nameAndTag[0], tag: tag, repeated: repeated})
	}
	return parsed
}
