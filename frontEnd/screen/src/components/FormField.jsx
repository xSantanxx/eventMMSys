function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`
          rounded-lg border bg-surface px-3 py-2 text-sm text-text
          placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          ${error ? 'border-error' : 'border-border'}
        `}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

export default FormField;
