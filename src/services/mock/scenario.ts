/**
 * Development-only fault injection for exercising UI states against the mock backend.
 * Set VITE_MOCK_SCENARIO in .env.local, or in the browser console (dev builds only):
 *   mwaMock.setScenario('full')
 */
export type MockScenario = 'none' | 'full' | 'network' | 'duplicate' | 'upload-fail'

const SCENARIOS: MockScenario[] = ['none', 'full', 'network', 'duplicate', 'upload-fail']

let scenario: MockScenario = SCENARIOS.includes(import.meta.env.VITE_MOCK_SCENARIO as MockScenario)
  ? (import.meta.env.VITE_MOCK_SCENARIO as MockScenario)
  : 'none'

export const getScenario = () => scenario

if (import.meta.env.DEV && typeof window !== 'undefined') {
  Object.assign(window, {
    mwaMock: {
      scenarios: SCENARIOS,
      setScenario(next: MockScenario) {
        scenario = next
        return `Mock scenario: ${next}`
      },
    },
  })
}

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 450

export function delay(ms = LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
