interface Props<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: (v: T) => string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div className="seg">
      {options.map((v) => (
        <button
          key={v}
          className={`seg-btn ${value === v ? 'on' : ''}`}
          onClick={() => onChange(v)}
        >
          {label ? label(v) : v}
        </button>
      ))}
    </div>
  );
}
