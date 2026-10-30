import { ChevronDown } from 'lucide-react';

export default function Select({ value, onChange, children, className = '', ...rest }) {
  return (
    <div className={`select ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} {...rest}>{children}</select>
      <ChevronDown size={16} />
    </div>
  );
}
