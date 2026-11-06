"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { passwordLabel?: string };

export default function PasswordInput({ passwordLabel = "password", id, className = "", disabled, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const action = `${visible ? "Hide" : "Show"} ${passwordLabel}`;
  return (
    <div className="relative">
      <input {...props} id={inputId} disabled={disabled} type={visible ? "text" : "password"} className={`${className} pr-12`} />
      <button type="button" disabled={disabled} aria-label={action} title={action} aria-pressed={visible} aria-controls={inputId}
        onClick={() => setVisible(value => !value)}
        className="absolute inset-y-0 right-0 mt-2 flex w-11 items-center justify-center rounded-r-xl text-gray-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          {visible ? <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 9 7 9 7a19 19 0 0 1-3 3.8M6.5 6.5A21 21 0 0 0 3 12s4 7 9 7a9 9 0 0 0 4-1" /> : <><path strokeLinecap="round" strokeLinejoin="round" d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="3" /></>}
        </svg>
      </button>
    </div>
  );
}
