import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputClasses = `
      block w-full px-4 py-2 text-gray-900 bg-white border rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
      transition-colors duration-200
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
      ${icon ? 'pl-10' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input