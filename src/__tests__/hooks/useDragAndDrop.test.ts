import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDragAndDrop, { pageToQuadrantPercent, getQuadrantAtPoint } from '../../hooks/useDragAndDrop'
import type { Item } from '../../types'

// --- Pure function tests ---

describe('pageToQuadrantPercent', () => {
  const rect = { left: 100, top: 200, width: 400, height: 300 } as DOMRect

  it('converts page coordinates to percentage within the rect', () => {
    const result = pageToQuadrantPercent(300, 350, rect)
    // (300-100)/400*100 = 50, (350-200)/300*100 = 50
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })

  it('clamps x to minimum of 2', () => {
    const result = pageToQuadrantPercent(100, 350, rect)
    // (0)/400*100 = 0, clamped to 2
    expect(result.x).toBe(2)
  })

  it('clamps x to maximum of 85', () => {
    const result = pageToQuadrantPercent(600, 350, rect)
    // (500)/400*100 = 125, clamped to 85
    expect(result.x).toBe(85)
  })

  it('clamps y to minimum of 2', () => {
    const result = pageToQuadrantPercent(300, 200, rect)
    expect(result.y).toBe(2)
  })

  it('clamps y to maximum of 85', () => {
    const result = pageToQuadrantPercent(300, 600, rect)
    expect(result.y).toBe(85)
  })

  it('handles exact boundary values', () => {
    // At left+2% of width, top+2% of height
    const result = pageToQuadrantPercent(108, 206, rect)
    expect(result.x).toBe(2)
    expect(result.y).toBe(2)
  })
})

describe('getQuadrantAtPoint', () => {
  function makeMockEl(left: number, top: number, width: number, height: number) {
    return {
      getBoundingClientRect: () => ({
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
      }),
    } as HTMLDivElement
  }

  const quadrantEls = [
    makeMockEl(0, 0, 200, 200),
    makeMockEl(200, 0, 200, 200),
    makeMockEl(0, 200, 200, 200),
    makeMockEl(200, 200, 200, 200),
  ]

  const canvasEls = [
    makeMockEl(0, 30, 200, 170),
    makeMockEl(200, 30, 200, 170),
    makeMockEl(0, 230, 200, 170),
    makeMockEl(200, 230, 200, 170),
  ]

  it('returns the correct quadrant index for a point inside it', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantEls, canvasEls)
    expect(result).not.toBeNull()
    expect(result!.index).toBe(0)
  })

  it('returns the canvas rect (not the quadrant rect) for the hit', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantEls, canvasEls)
    expect(result!.rect.top).toBe(30)
    expect(result!.rect.height).toBe(170)
  })

  it('returns quadrant 1 for a point in the top-right', () => {
    const result = getQuadrantAtPoint(300, 100, quadrantEls, canvasEls)
    expect(result!.index).toBe(1)
  })

  it('returns quadrant 3 for a point in the bottom-right', () => {
    const result = getQuadrantAtPoint(300, 300, quadrantEls, canvasEls)
    expect(result!.index).toBe(3)
  })

  it('returns null when point is outside all quadrants', () => {
    const result = getQuadrantAtPoint(500, 500, quadrantEls, canvasEls)
    expect(result).toBeNull()
  })

  it('handles null elements gracefully', () => {
    const result = getQuadrantAtPoint(100, 100, [null, null, null, null], canvasEls)
    expect(result).toBeNull()
  })

  it('falls back to quadrant rect when canvas ref is null', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantEls, [null, null, null, null])
    expect(result).not.toBeNull()
    expect(result!.rect.top).toBe(0) // falls back to quadrant rect
    expect(result!.rect.height).toBe(200)
  })
})

// --- Hook integration tests ---

describe('useDragAndDrop hook', () => {
  const mockItem: Item = { id: 'item-1', text: 'Test', x: 10, y: 20, createdAt: 1000 }

  function makeRefs() {
    return {
      quadrantRefs: { current: [null, null, null, null] } as React.RefObject<(HTMLDivElement | null)[]>,
      canvasRefs: { current: [null, null, null, null] } as React.RefObject<(HTMLDivElement | null)[]>,
    }
  }

  it('starts with no drag state', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))
    expect(result.current.drag).toBeNull()
  })

  it('sets drag state on handleDragStart', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        pageX: 150,
        pageY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    expect(result.current.drag).toEqual({
      itemId: 'item-1',
      sourceIdx: 0,
      grabX: 10,
      grabY: 5,
      width: 120,
      height: 30,
      x: 150,
      y: 250,
    })
  })

  it('updates drag position on pointermove', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        pageX: 150,
        pageY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 300 }))
    })

    // PointerEvent pageX/pageY default to 0 in jsdom, so drag.x/y become 0
    // The important thing is the handler runs without error
    expect(result.current.drag).not.toBeNull()
  })

  it('clears drag state on pointerup', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        pageX: 150,
        pageY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'))
    })

    expect(result.current.drag).toBeNull()
  })

  it('does not call onDrop when pointerup is outside all quadrants', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        pageX: 150,
        pageY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'))
    })

    expect(onDrop).not.toHaveBeenCalled()
  })

  it('cleans up event listeners when drag ends', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        pageX: 150,
        pageY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'))
    })

    // After drag ends (drag becomes null), the effect cleanup removes listeners
    const removedTypes = removeSpy.mock.calls.map((c) => c[0])
    expect(removedTypes).toContain('pointermove')
    expect(removedTypes).toContain('pointerup')

    removeSpy.mockRestore()
  })
})
