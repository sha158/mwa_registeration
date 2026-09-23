import { describe, expect, it } from 'vitest'
import { ageOn, checkAge, eligibleBirthRange, parseIsoDate } from './age'

describe('age', () => {
  it('rejects impossible dates', () => {
    expect(parseIsoDate('2001-02-30')).toBeNull()
    expect(parseIsoDate('14/08/2001')).toBeNull()
  })

  it('counts completed years on the reference date', () => {
    expect(ageOn('2007-11-15', '2026-11-15')).toBe(19)
    expect(ageOn('2007-11-16', '2026-11-15')).toBe(18)
    expect(ageOn('2000-02-29', '2026-02-28')).toBe(25)
  })

  it('applies the 19–26 bounds inclusively', () => {
    expect(checkAge('2007-11-15', '2026-11-15')).toEqual({ status: 'eligible', age: 19 })
    expect(checkAge('2007-11-16', '2026-11-15').status).toBe('too-young')
    expect(checkAge('1999-11-16', '2026-11-15')).toEqual({ status: 'eligible', age: 26 })
    expect(checkAge('1999-11-15', '2026-11-15').status).toBe('too-old')
  })

  it('derives an inclusive eligible birth range', () => {
    expect(eligibleBirthRange('2026-11-15')).toEqual({ earliest: '1999-11-16', latest: '2007-11-15' })
  })
})
