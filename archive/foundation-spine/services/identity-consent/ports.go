package identityconsent

import "github.com/gt100k/platform/pkg/spine"

// Service-facing aliases preserve the identity-consent API while making the
// spine package the single owner of cross-service port and policy contracts.
type ConsentRepository = spine.ConsentRepository
type AssentRepository = spine.AssentRepository
type IdentityRepository = spine.IdentityRepository
type AuditLog = spine.AuditLog
type PolicyInput = spine.PolicyInput
type PolicyDecision = spine.PolicyDecision
type EnrollmentHandoffSource = spine.EnrollmentHandoffSource
type DeletionStarter = spine.DeletionStarter
