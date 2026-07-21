package gt100k.appeal_test

import rego.v1

valid_appeal_input := {
	"independent_reviewer": {"ref": "actor_pseudo_guide_02"},
	"authorized_human_ref": "actor_pseudo_guide_01",
}

test_g_apl_accepts_independent_reviewer if {
	deny := data.gt100k.appeal.deny with input as valid_appeal_input
	count(deny) == 0
}

test_g_apl_denies_reviewer_conflict if {
	conflicting_input := object.union(valid_appeal_input, {"independent_reviewer": {"ref": "actor_pseudo_guide_01"}})

	deny := data.gt100k.appeal.deny with input as conflicting_input
	deny == {"reviewer_conflict"}
}
