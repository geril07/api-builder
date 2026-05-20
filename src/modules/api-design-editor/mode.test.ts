import { describe, expect, it } from 'vitest'
import { parseEditorMode, parseFlatTab } from './mode'

describe('editor mode parsing', () => {
  it('defaults missing or invalid mode to canvas', () => {
    expect(parseEditorMode(null)).toBe('canvas')
    expect(parseEditorMode(undefined)).toBe('canvas')
    expect(parseEditorMode('bad')).toBe('canvas')
  })

  it('preserves valid modes', () => {
    expect(parseEditorMode('canvas')).toBe('canvas')
    expect(parseEditorMode('flat')).toBe('flat')
  })
})

describe('flat tab parsing', () => {
  it('defaults missing or invalid tab to resources', () => {
    expect(parseFlatTab(null)).toBe('resources')
    expect(parseFlatTab(undefined)).toBe('resources')
    expect(parseFlatTab('bad')).toBe('resources')
  })

  it('preserves valid tabs', () => {
    expect(parseFlatTab('resources')).toBe('resources')
    expect(parseFlatTab('schemas')).toBe('schemas')
    expect(parseFlatTab('auth-schemes')).toBe('auth-schemes')
  })
})
