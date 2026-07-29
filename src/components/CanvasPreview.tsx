import { useEffect, useRef } from 'react'
import { quadrantColors } from '../colors'
import { cornerGradientPixels } from '../logic/cornerGradient'
import { previewPills } from '../logic/canvasPreview'
import type { Framework } from '../types'

export interface CanvasPreviewProps {
  framework: Framework
  /** Sizes the square. The frame around it belongs to the component. */
  className?: string
}

// Bitmap resolution, independent of display size: at the ~44px the sidebar
// shows this at, 128 still has pixels to spare on a 3x screen.
const RENDER_SIZE = 128

const CROSS_FILL = 'rgba(255, 255, 255, 0.35)'
const CROSS_WIDTH = 4
// Near-opaque rather than the card's own 0.85/0.10: the bitmap is downscaled to
// roughly a third of this, and that filtering thins out anything translucent
// (the small-size optical adjustment DSGN-002 ran into with the icon's lines).
const PILL_FILL = 'rgba(255, 255, 255, 0.9)'
const PILL_RADIUS = 2

/**
 * A square illustration of a framework's canvas: its four quadrant colors
 * blended corner to corner, the quadrant lines, and one pill per item where
 * that item sits. Decorative — every caller shows the framework's name too.
 */
export default function CanvasPreview({ framework, className = '' }: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const colors = quadrantColors(framework.quadrants)
  const pills = previewPills(framework.quadrants)

  // Deliberately no dependency array: the bitmap is a pure projection of the
  // framework, so repainting on every render is what keeps it from ever showing
  // a stale canvas. Nothing here is memoized (architecture.md) and 128² pixels
  // costs far less than the staleness would.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Full strength, unlike the canvas itself, which mutes this same blend
    // behind live content: at thumbnail size a muted gradient leaves every
    // framework looking alike, and telling them apart is the point.
    const image = ctx.createImageData(RENDER_SIZE, RENDER_SIZE)
    image.data.set(cornerGradientPixels(colors, RENDER_SIZE))
    ctx.putImageData(image, 0, 0)

    const center = RENDER_SIZE / 2
    const crossOffset = center - CROSS_WIDTH / 2
    ctx.fillStyle = CROSS_FILL
    ctx.fillRect(0, crossOffset, RENDER_SIZE, CROSS_WIDTH)
    ctx.fillRect(crossOffset, 0, CROSS_WIDTH, RENDER_SIZE)

    ctx.fillStyle = PILL_FILL
    for (const pill of pills) {
      ctx.beginPath()
      ctx.roundRect(
        pill.x * RENDER_SIZE,
        pill.y * RENDER_SIZE,
        pill.width * RENDER_SIZE,
        pill.height * RENDER_SIZE,
        PILL_RADIUS,
      )
      ctx.fill()
    }
  })

  return (
    // The frame keeps a pale corner of the gradient from bleeding into the
    // surface behind it, which is the one part of this that follows the theme.
    <span className={`block overflow-hidden rounded-md border border-black/8 dark:border-white/10 ${className}`.trim()}>
      <canvas
        ref={canvasRef}
        width={RENDER_SIZE}
        height={RENDER_SIZE}
        aria-hidden="true"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </span>
  )
}
