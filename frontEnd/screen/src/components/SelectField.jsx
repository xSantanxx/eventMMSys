function SelectField({ label, id, value, onChange, children, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`
          rounded-lg border bg-surface px-3 py-2 text-sm text-text
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          ${error ? 'border-error' : 'border-border'}
        `}
      >
        {children}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

export default SelectField;
