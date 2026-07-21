package platform

import (
	"testing"
	"time"
)

type fixedClock struct {
	now time.Time
}

func (c fixedClock) Now() time.Time {
	return c.now
}

type sequenceIDs struct {
	ids  []string
	next int
}

func (g *sequenceIDs) Next() string {
	id := g.ids[g.next]
	g.next++
	return id
}

func TestInjectedDependenciesAdmitDeterministicFakes(t *testing.T) {
	wantTime := time.Date(2026, time.July, 20, 14, 3, 11, 0, time.UTC)
	var clock Clock = fixedClock{now: wantTime}
	if got := clock.Now(); !got.Equal(wantTime) {
		t.Fatalf("Clock.Now() = %s, want %s", got, wantTime)
	}

	var ids IDGenerator = &sequenceIDs{ids: []string{"cid_0001", "cid_0002"}}
	if got := ids.Next(); got != "cid_0001" {
		t.Fatalf("first IDGenerator.Next() = %q, want %q", got, "cid_0001")
	}
	if got := ids.Next(); got != "cid_0002" {
		t.Fatalf("second IDGenerator.Next() = %q, want %q", got, "cid_0002")
	}
}
