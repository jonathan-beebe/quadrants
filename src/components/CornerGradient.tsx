import { useEffect, useRef } from 'react'
import { hexToRgb, srgbToLinear, linearToSrgb } from '../colors'

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

    const lTL = hexToRgb(tlHex).map(srgbToLinear)
    const lTR = hexToRgb(trHex).map(srgbToLinear)
    const lBL = hexToRgb(blHex).map(srgbToLinear)
    const lBR = hexToRgb(brHex).map(srgbToLinear)

    const N = RENDER_SIZE
    const img = ctx.createImageData(N, N)
    const d = img.data

    // Smoothstep biases blending toward the center, so each corner holds
    // its pure color further out before transitioning.
    const ease = (t: number) => t * t * (3 - 2 * t)

    for (let y = 0; y < N; y++) {
      const ev = ease(y / (N - 1))
      for (let x = 0; x < N; x++) {
        const eu = ease(x / (N - 1))
        const i = (y * N + x) * 4
        for (let c = 0; c < 3; c++) {
          const top = (1 - eu) * lTL[c] + eu * lTR[c]
          const bot = (1 - eu) * lBL[c] + eu * lBR[c]
          d[i + c] = linearToSrgb((1 - ev) * top + ev * bot)
        }
        d[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
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
