import { useEffect, useRef } from 'react'
import { cornerGradientPixels } from '../logic/cornerGradient'

export interface CornerGradientProps {
  /** Four hex colors: top-left, top-right, bottom-left, bottom-right. */
  colors: [string, string, string, string]
  className?: string
  style?: React.CSSProperties
}

const RENDER_SIZE = 256

export default function CornerGradient({ colors, className, style }: CornerGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tlHex, trHex, blHex, brHex] = colors

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = ctx.createImageData(RENDER_SIZE, RENDER_SIZE)
    image.data.set(cornerGradientPixels([tlHex, trHex, blHex, brHex], RENDER_SIZE))
    ctx.putImageData(image, 0, 0)
  }, [tlHex, trHex, blHex, brHex])

  return (
    <canvas
      ref={canvasRef}
      width={RENDER_SIZE}
      height={RENDER_SIZE}
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
    />
  )
}
