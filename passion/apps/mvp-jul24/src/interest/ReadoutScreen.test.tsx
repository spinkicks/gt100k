import { render, fireEvent, screen } from '@testing-library/react'
import { useInterest } from './store'
import { useGame } from '../game/store'
import ReadoutScreen from './ReadoutScreen'

beforeEach(() => {
  useInterest.getState().reset()
  useGame.getState().goToMap()
})

test('renders a bar with the gadget label and rounded minutes', () => {
  useInterest.getState().recordOpen('nonogram')
  useInterest.getState().addActiveMs('nonogram', 90000)

  render(<ReadoutScreen />)

  expect(screen.getByText('Nonogram')).toBeInTheDocument()
  expect(screen.getByText('1.5 min')).toBeInTheDocument()
})

test('shows seconds instead of minutes when under a minute of activity', () => {
  useInterest.getState().recordOpen('logic-grid')
  useInterest.getState().addActiveMs('logic-grid', 45000)

  render(<ReadoutScreen />)

  expect(screen.getByText('45 sec')).toBeInTheDocument()
})

test('sorts bars by active time descending', () => {
  useInterest.getState().addActiveMs('nonogram', 30000)
  useInterest.getState().addActiveMs('logic-grid', 120000)

  render(<ReadoutScreen />)

  const rows = document.querySelectorAll('.readout-screen-bar-row')
  expect(rows[0]!.getAttribute('data-gadget')).toBe('logic-grid')
  expect(rows[1]!.getAttribute('data-gadget')).toBe('nonogram')
})

test('shows a friendly empty state when nothing has been explored', () => {
  render(<ReadoutScreen />)
  expect(screen.getByText(/nothing explored/i)).toBeInTheDocument()
})

test('back to map button returns to the map screen', () => {
  useGame.getState().openCabin('math')
  render(<ReadoutScreen />)
  fireEvent.click(screen.getByRole('button', { name: /back to map/i }))
  expect(useGame.getState().screen).toBe('map')
})
