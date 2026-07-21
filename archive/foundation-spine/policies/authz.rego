package gt100k.authz

import rego.v1

policy_version := "opa-bundle/2026-07-20a"

authorization_rules := [{
	"role": "guide",
	"purpose": "onboarding.schedule",
	"jurisdictions": ["US-CA"],
}]

matching_purpose_consents contains consent if {
	some consent in object.get(input, "consents", [])
	consent.active == true
	consent.purpose == input.purpose
}

has_matching_jurisdiction if {
	some consent in matching_purpose_consents
	consent.jurisdiction == input.jurisdiction
}

has_matching_rule if {
	some rule in authorization_rules
	rule.role == input.actor.role
	rule.purpose == input.purpose
	input.jurisdiction in rule.jurisdictions
}

reason := "no_active_consent" if {
	count(matching_purpose_consents) == 0
} else := "jurisdiction_mismatch" if {
	not has_matching_jurisdiction
} else := "deny_by_default" if {
	not has_matching_rule
} else := "allow"

default allow := false

allow if reason == "allow"

decision := {
	"allow": allow,
	"reason": reason,
	"policy_version": policy_version,
}

deny_authority_forgery contains "authority_forgery" if {
	authorized_human := object.get(input, "authorized_human", {})
	authorized_human.class in {"MODEL", "SYSTEM"}
}
