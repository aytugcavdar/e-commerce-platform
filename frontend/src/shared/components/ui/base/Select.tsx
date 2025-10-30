import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      placeholder = 'Seçiniz...',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const selectClasses = `
      block w-full px-4 py-2 text-gray-900 bg-white border rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-100 disabled:cursor-not-allowed
      transition-colors duration-200
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
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
        
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

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

Select.displayName = 'Select'

export default Select