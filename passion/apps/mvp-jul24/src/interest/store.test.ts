import { useInterest } from './store'

beforeEach(() => useInterest.getState().reset())

test('accumulates active ms and counts', () => {
  const s = useInterest.getState()
  s.recordOpen('nonogram')
  s.addActiveMs('nonogram', 1500)
  s.addActiveMs('nonogram', 500)
  s.recordSolve('nonogram')

  const g = useInterest.getState().byGadget['nonogram']
  expect(g!.activeMs).toBe(2000)
  expect(g!.opens).toBe(1)
  expect(g!.solves).toBe(1)
})
