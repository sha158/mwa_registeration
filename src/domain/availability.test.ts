import { describe, expect, it } from 'vitest'
import { deriveAvailability } from './availability'

const open = { registrationOpen: true, maximumTeams: 15 }

describe('deriveAvailability', () => {
  it('reports open, limited and full states', () => {
    expect(deriveAvailability(open, 8).state).toBe('open')
    expect(deriveAvailability(open, 12).state).toBe('limited')
    expect(deriveAvailability(open, 15)).toMatchObject({ state: 'full', slotsRemaining: 0 })
  })

  it('treats manual closure separately from full', () => {
    expect(deriveAvailability({ ...open, registrationOpen: false }, 3).state).toBe('closed')
  })
})
