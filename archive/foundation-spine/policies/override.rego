package gt100k.override

import rego.v1

governed_override_classes := {
	"admissions",
	"public_exposure",
	"safeguarding",
	"credential_revocation",
}

deny contains "authority_forgery" if {
	some approver in object.get(input, "approvers", [])
	approver.class in {"MODEL", "SYSTEM"}
}

deny contains "four_eyes_required" if {
	object.get(input, "override_class", "") in governed_override_classes

	distinct_approver_refs := {ref |
		some approver in object.get(input, "approvers", [])
		ref := object.get(approver, "ref", "")
		ref != ""
	}
	count(distinct_approver_refs) < 2
}
