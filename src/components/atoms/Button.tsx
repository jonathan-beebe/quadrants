import { forwardRef } from 'react'

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  icon: 'btn-icon text-text-secondary',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
  size?: 'default' | 'sm'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className = '', ...props }, ref) => {
    const classes = [variantClasses[variant], size === 'sm' ? 'btn-sm' : '', className].filter(Boolean).join(' ')

    return <button ref={ref} className={classes} {...props} />
  },
)

Button.displayName = 'Button'
export default Button
