package platform

import "time"

// Clock supplies time to deterministic core logic.
type Clock interface {
	Now() time.Time
}

// IDGenerator supplies opaque identifiers to deterministic core logic.
type IDGenerator interface {
	Next() string
}
