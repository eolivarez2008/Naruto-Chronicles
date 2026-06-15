import type { ChangeEvent } from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function InputField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-white/60 text-sm font-medium">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 backdrop-blur-sm focus:outline-none focus:border-[rgba(255,102,0,0.5)] focus:ring-1 focus:ring-[rgba(255,102,0,0.3)] transition-all"
      />
    </div>
  );
}
