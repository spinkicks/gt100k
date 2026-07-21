package gt100k.appeal

import rego.v1

deny contains "reviewer_conflict" if {
	reviewer := object.get(input, "independent_reviewer", {})
	reviewer_ref := object.get(reviewer, "ref", "")
	reviewer_ref != ""
	reviewer_ref == object.get(input, "authorized_human_ref", "")
}
