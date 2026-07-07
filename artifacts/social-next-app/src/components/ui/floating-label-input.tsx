"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  error?: string | null;
}

export function FloatingLabelInput({
  label,
  icon,
  right,
  error,
  className,
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasText, setHasText] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasText(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasText(!!e.target.value);
    onBlur?.(e);
  };

  const isFloating = isFocused || hasText;

  return (
    <div className="w-full mb-2">
      <div className="relative mt-3">
        <div
          className={cn(
            "flex items-center min-h-[56px] rounded-[16px] border-[1.5px] transition-colors bg-card",
            error
              ? "border-red-300"
              : isFocused
              ? "border-primary"
              : "border-slate-200",
            className
          )}
        >
          {icon && (
            <div className={cn(
              "pl-4 transition-colors",
              isFocused ? "text-primary" : error ? "text-red-600" : "text-slate-500"
            )}>
              {icon}
            </div>
          )}

          <div className="flex-1 relative pt-2">
            <input
              id={id}
              ref={inputRef}
              className={cn(
                "w-full bg-transparent border-none outline-none px-4 pb-2.5 text-[16px] font-medium transition-colors autofill:bg-transparent",
                isFocused || hasText ? "text-foreground" : "text-slate-900",
                icon && "pl-3"
              )}
              value={value}
              onChange={(e) => {
                setHasText(!!e.target.value);
                onChange?.(e);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
          </div>

          {right && <div className="pr-4">{right}</div>}
        </div>

        <label
          htmlFor={id}
          className={cn(
            "absolute transition-all duration-150 pointer-events-none px-1 bg-background select-none",
            isFloating
              ? "text-[12px] -top-2 font-semibold"
              : "text-[16px] top-4 font-medium",
            icon && !isFloating ? "left-11" : "left-4",
            error
              ? "text-red-600"
              : isFocused
              ? "text-primary"
              : "text-slate-400"
          )}
        >
          {label}
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-red-600">
           <span className="material-symbols-outlined !text-[14px]">error</span>
           <span className="text-[12px] font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
