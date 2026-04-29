import { useEffect, useRef } from 'react'

export interface CornerGradientProps {
  /** Four hex colors: top-left, top-right, bottom-left, bottom-right. */
  colors: [string, string, string, string]
  className?: string
  style?: React.CSSProperties
}

const RENDER_SIZE = 256

function parseHex(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const toLin = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const toSrgb = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

export default function CornerGradient({ colors, className, style }: CornerGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tlHex, trHex, blHex, brHex] = colors

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const lTL = parseHex(tlHex).map(toLin)
    const lTR = parseHex(trHex).map(toLin)
    const lBL = parseHex(blHex).map(toLin)
    const lBR = parseHex(brHex).map(toLin)

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
          d[i + c] = toSrgb((1 - ev) * top + ev * bot)
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
