import { describe, it, expect, vi } from 'vitest'
import { StrictMode } from 'react'
import { renderHook, act } from '@testing-library/react'
import { useDragAndDrop } from '../../hooks/useDragAndDrop'
import type { Item } from '../../types'

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
        clientX: 150,
        clientY: 250,
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
        clientX: 150,
        clientY: 250,
        grabX: 10,
        grabY: 5,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 300 }))
    })

    expect(result.current.drag).not.toBeNull()
    expect(result.current.drag!.x).toBe(200)
    expect(result.current.drag!.y).toBe(300)
    // Grab offsets and identity are preserved across moves.
    expect(result.current.drag!.itemId).toBe('item-1')
    expect(result.current.drag!.grabX).toBe(10)
  })

  it('clears drag state on pointerup', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        clientX: 150,
        clientY: 250,
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
        clientX: 150,
        clientY: 250,
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

  it('invokes onDrop exactly once per pointerup under StrictMode (MAINT-005)', () => {
    // StrictMode double-invokes state updaters in development; a side effect
    // inside the setDrag updater would fire onDrop twice per release.
    const quadrant = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
        width: 200,
        height: 200,
      }),
    } as HTMLDivElement
    const refs = {
      quadrantRefs: { current: [quadrant, null, null, null] } as React.RefObject<(HTMLDivElement | null)[]>,
      canvasRefs: { current: [null, null, null, null] } as React.RefObject<(HTMLDivElement | null)[]>,
    }
    const onDrop = vi.fn()
    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }), { wrapper: StrictMode })

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        clientX: 100,
        clientY: 100,
        grabX: 0,
        grabY: 0,
        width: 120,
        height: 30,
      })
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }))
    })

    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(result.current.drag).toBeNull()
  })

  it('cleans up event listeners when drag ends', () => {
    const refs = makeRefs()
    const onDrop = vi.fn()
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { result } = renderHook(() => useDragAndDrop({ ...refs, onDrop }))

    act(() => {
      result.current.handleDragStart(0, mockItem, {
        clientX: 150,
        clientY: 250,
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
