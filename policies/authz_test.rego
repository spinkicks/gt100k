package gt100k.authz_test

import rego.v1

policy_version := "opa-bundle/2026-07-20a"

staff_guide := {"ref": "actor_pseudo_guide_01", "class": "STAFF", "role": "guide"}

active_onboarding_consent := {
	"purpose": "onboarding.schedule",
	"jurisdiction": "US-CA",
	"active": true,
}

active_research_consent := {
	"purpose": "research.trial",
	"jurisdiction": "US-CA",
	"active": true,
}

allow_input := {
	"actor": staff_guide,
	"purpose": "onboarding.schedule",
	"subject_ref": "learner_synth_001",
	"jurisdiction": "US-CA",
	"at": "2026-07-20T14:03:11Z",
	"policy_version": policy_version,
	"consents": [active_onboarding_consent],
}

test_authorization_rules_match_golden if {
	data.gt100k.authz.authorization_rules == [{
		"role": "guide",
		"purpose": "onboarding.schedule",
		"jurisdictions": ["US-CA"],
	}]
}

test_g_auth_decision_table if {
	cases := [
		{"name": "allow", "input": allow_input, "allow": true, "reason": "allow"},
		{"name": "no consent", "input": object.union(allow_input, {"consents": []}), "allow": false, "reason": "no_active_consent"},
		{"name": "withdrawn", "input": object.union(allow_input, {"consents": []}), "allow": false, "reason": "no_active_consent"},
		{"name": "expired", "input": object.union(allow_input, {"consents": []}), "allow": false, "reason": "no_active_consent"},
		{"name": "jurisdiction mismatch", "input": object.union(allow_input, {"jurisdiction": "US-NY"}), "allow": false, "reason": "jurisdiction_mismatch"},
		{
			"name": "unknown purpose",
			"input": object.union(allow_input, {
				"purpose": "research.trial",
				"consents": [active_research_consent],
			}),
			"allow": false,
			"reason": "deny_by_default",
		},
	]

	every case in cases {
		decision := data.gt100k.authz.decision with input as case.input
		decision == {
			"allow": case.allow,
			"reason": case.reason,
			"policy_version": policy_version,
		}
	}
}

test_empty_policy_denies_by_default if {
	decision := data.gt100k.authz.decision with input as allow_input
		with data.gt100k.authz.authorization_rules as []

	decision == {
		"allow": false,
		"reason": "deny_by_default",
		"policy_version": policy_version,
	}
}

test_model_and_system_authority_are_denied if {
	every actor_class in {"MODEL", "SYSTEM"} {
		deny := data.gt100k.authz.deny_authority_forgery with input as {"authorized_human": {"class": actor_class}}
		deny == {"authority_forgery"}
	}
}

test_human_authority_is_not_denied if {
	deny := data.gt100k.authz.deny_authority_forgery with input as {"authorized_human": {"class": "STAFF"}}
	count(deny) == 0
}
