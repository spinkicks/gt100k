package gt100k.override_test

import rego.v1

staff_guide := {"ref": "actor_pseudo_guide_01", "class": "STAFF"}

staff_guide_2 := {"ref": "actor_pseudo_guide_02", "class": "STAFF"}

governed_override_classes := {
	"admissions",
	"public_exposure",
	"safeguarding",
	"credential_revocation",
}

valid_override_input := {
	"override_class": "admissions",
	"approvers": [staff_guide, staff_guide_2],
}

test_g_ovr_accepts_two_distinct_human_approvers if {
	data.gt100k.override.governed_override_classes == governed_override_classes

	every override_class in governed_override_classes {
		deny := data.gt100k.override.deny with input as object.union(
			valid_override_input,
			{"override_class": override_class},
		)
		count(deny) == 0
	}
}

test_g_ovr_denies_model_and_system_approvers if {
	every actor_class in {"MODEL", "SYSTEM"} {
		forged_approver := {"ref": "actor_pseudo_nonhuman_01", "class": actor_class}
		deny := data.gt100k.override.deny with input as object.union(
			valid_override_input,
			{"approvers": [staff_guide, forged_approver]},
		)
		deny == {"authority_forgery"}
	}
}

test_g_ovr_denies_fewer_than_two_distinct_approvers if {
	approver_sets := [
		[staff_guide],
		[staff_guide, staff_guide],
	]

	every approvers in approver_sets {
		deny := data.gt100k.override.deny with input as object.union(
			valid_override_input,
			{"approvers": approvers},
		)
		deny == {"four_eyes_required"}
	}
}

test_g_ovr_non_governed_class_does_not_require_four_eyes if {
	deny := data.gt100k.override.deny with input as {
		"override_class": "operational_correction",
		"approvers": [staff_guide],
	}
	count(deny) == 0
}
