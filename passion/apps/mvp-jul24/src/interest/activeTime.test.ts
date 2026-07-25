import { isActive, tickDelta, IDLE_MS, type TrackerState } from './activeTime'

const base: TrackerState = {
  focusedGadgetId: 'g',
  lastTickAt: 1000,
  lastInputAt: 1000,
  pageVisible: true,
  windowFocused: true,
}

test('active when focused, visible, focused, recent input', () => {
  expect(isActive(base, 2000)).toBe(true)
})

test('inactive with no focused gadget', () => {
  expect(isActive({ ...base, focusedGadgetId: null }, 2000)).toBe(false)
})

test('inactive when tab hidden', () => {
  expect(isActive({ ...base, pageVisible: false }, 2000)).toBe(false)
})

test('inactive when idle beyond IDLE_MS', () => {
  expect(isActive(base, 1000 + IDLE_MS + 1)).toBe(false)
})

test('tickDelta credits elapsed while active', () => {
  expect(tickDelta(base, 3000)).toBe(2000)
})

test('tickDelta zero while inactive', () => {
  expect(tickDelta({ ...base, windowFocused: false }, 3000)).toBe(0)
})
