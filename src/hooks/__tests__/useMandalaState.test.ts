import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMandalaState } from '@/hooks/useMandalaState'

/* ------------------------------------------------------------------ */
/* useMandalaState                                                     */
/* ------------------------------------------------------------------ */
describe('useMandalaState', () => {
  /* ---- 1. Initial state ---- */
  it('starts with nothing active, nothing visited, vimutti hidden, no active connection', () => {
    const { result } = renderHook(() => useMandalaState())

    expect(result.current.activePanel).toBeNull()
    expect(result.current.visitedPanels.size).toBe(0)
    expect(result.current.vimuttiRevealed).toBe(false)
    expect(result.current.activeConnection).toBeNull()
  })

  /* ---- 2. activatePanel sets active and marks visited ---- */
  it('activatePanel sets activePanel and adds to visitedPanels', () => {
    const { result } = renderHook(() => useMandalaState())

    act(() => {
      result.current.activatePanel(3)
    })

    expect(result.current.activePanel).toBe(3)
    expect(result.current.visitedPanels.has(3)).toBe(true)
    expect(result.current.visitedPanels.size).toBe(1)
  })

  /* ---- 3. deactivatePanel clears active but preserves visited ---- */
  it('deactivatePanel clears activePanel but preserves visitedPanels', () => {
    const { result } = renderHook(() => useMandalaState())

    act(() => {
      result.current.activatePanel(5)
    })

    act(() => {
      result.current.deactivatePanel()
    })

    expect(result.current.activePanel).toBeNull()
    expect(result.current.visitedPanels.has(5)).toBe(true)
    expect(result.current.visitedPanels.size).toBe(1)
  })

  /* ---- 4. Visiting all 8 panels reveals vimutti ---- */
  it('reveals vimutti when all 8 panels have been visited', () => {
    const { result } = renderHook(() => useMandalaState())

    act(() => {
      for (let i = 0; i < 8; i++) {
        result.current.activatePanel(i)
      }
    })

    expect(result.current.visitedPanels.size).toBe(8)
    expect(result.current.vimuttiRevealed).toBe(true)
  })

  /* ---- 5. Vimutti is NOT revealed with only 7 visited ---- */
  it('does NOT reveal vimutti with only 7 panels visited', () => {
    const { result } = renderHook(() => useMandalaState())

    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.activatePanel(i)
      }
    })

    expect(result.current.visitedPanels.size).toBe(7)
    expect(result.current.vimuttiRevealed).toBe(false)
  })

  /* ---- 6. activateConnection and deactivateConnection ---- */
  it('activateConnection sets activeConnection and deactivateConnection clears it', () => {
    const { result } = renderHook(() => useMandalaState())

    act(() => {
      result.current.activateConnection(2)
    })

    expect(result.current.activeConnection).toBe(2)

    act(() => {
      result.current.deactivateConnection()
    })

    expect(result.current.activeConnection).toBeNull()
  })

  /* ---- 7. Vimutti stays revealed once triggered ---- */
  it('vimutti stays revealed once triggered — does not hide on deactivatePanel', () => {
    const { result } = renderHook(() => useMandalaState())

    // Visit all 8 panels
    act(() => {
      for (let i = 0; i < 8; i++) {
        result.current.activatePanel(i)
      }
    })

    expect(result.current.vimuttiRevealed).toBe(true)

    // Deactivate the current panel
    act(() => {
      result.current.deactivatePanel()
    })

    // Vimutti should still be revealed
    expect(result.current.vimuttiRevealed).toBe(true)
    expect(result.current.activePanel).toBeNull()
  })
})
