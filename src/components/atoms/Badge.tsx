interface BadgeProps {
  count: number
  label?: string
  'aria-hidden'?: boolean
}

export default function Badge({ count, label, ...props }: BadgeProps) {
  return (
    <span
      className="text-[11px] tabular-nums text-text-tertiary bg-black/6 dark:bg-white/10 px-[7px] py-px rounded-full"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={props['aria-hidden']}>
      {count}
    </span>
  )
}
