import { render, fireEvent } from '@testing-library/react'
import Nonogram from './Nonogram'

test('solving the puzzle calls onSolved', () => {
  const onSolved = vi.fn()
  render(<Nonogram seed={0} onSolved={onSolved} onExit={() => {}} />)
  // click every cell that should be filled (data-fill="1")
  for (const el of Array.from(document.querySelectorAll('[data-fill="1"]'))) fireEvent.click(el)
  expect(onSolved).toHaveBeenCalled()
})

test('exit button calls onExit', () => {
  const onExit = vi.fn()
  render(<Nonogram seed={1} onSolved={() => {}} onExit={onExit} />)
  fireEvent.click(document.querySelector('.ng-exit')!)
  expect(onExit).toHaveBeenCalled()
})
