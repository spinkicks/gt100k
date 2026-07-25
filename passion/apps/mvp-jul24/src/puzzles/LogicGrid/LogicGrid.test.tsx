import { render, fireEvent } from '@testing-library/react'
import LogicGrid from './LogicGrid'
import { SPORTS_PUZZLE, key } from './logic'

test('marking the solution calls onSolved', () => {
  const onSolved = vi.fn()
  render(<LogicGrid seed={0} onSolved={onSolved} onExit={() => {}} />)

  const category = SPORTS_PUZZLE.categories[0]!
  for (const entity of SPORTS_PUZZLE.entities) {
    const solutionValue = SPORTS_PUZZLE.solution[entity]![category.name]!
    for (const value of category.values) {
      const cell = document.querySelector(`[data-cell="${key(entity, category.name, value)}"]`)!
      if (value === solutionValue) {
        // unknown -> yes
        fireEvent.click(cell)
      } else {
        // unknown -> yes -> no
        fireEvent.click(cell)
        fireEvent.click(cell)
      }
    }
  }

  expect(onSolved).toHaveBeenCalled()
})

test('exit button calls onExit', () => {
  const onExit = vi.fn()
  render(<LogicGrid seed={0} onSolved={() => {}} onExit={onExit} />)
  fireEvent.click(document.querySelector('.lg-exit')!)
  expect(onExit).toHaveBeenCalled()
})
