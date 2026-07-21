package identityconsent

import "github.com/gt100k/platform/pkg/spine"

var (
	_ spine.ConsentRepository       = (*memoryConsentRepository)(nil)
	_ spine.AssentRepository        = (*memoryAssentRepository)(nil)
	_ spine.IdentityRepository      = (*memoryIdentityRepository)(nil)
	_ spine.EnrollmentHandoffSource = (*memoryEnrollmentSource)(nil)
	_ spine.AuditLog                = (*memoryAuditLog)(nil)
	_ spine.DeletionStarter         = (*recordingDeletionStarter)(nil)
	_ spine.Authorizer              = (*compiledAuthorizer)(nil)
)
