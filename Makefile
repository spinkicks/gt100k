.PHONY: gate gate-contracts gate-go gate-policy gate-terraform gate-integration

gate: gate-contracts gate-go gate-policy gate-terraform

gate-contracts:
	buf lint proto
	./proto/breaking_test.sh
	./proto/breaking_against_main.sh
	./proto/generated_freshness_test.sh
	buf generate proto
	git diff --exit-code proto/gen

gate-go:
	go vet ./...
	go build ./...
	go test ./...

gate-policy:
	opa test policies/ -v

gate-terraform:
	./infra/terraform/modules_contract_test.sh
	./infra/terraform/dev_environment_contract_test.sh
	./infra/terraform/validate_all_test.sh
	./infra/terraform/validate_all.sh

gate-integration:
	go test -tags=integration ./...
