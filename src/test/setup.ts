import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount anything rendered by @testing-library/react between tests so
// component tests don't leak DOM nodes or state into the next test.
afterEach(() => {
  cleanup()
})
