/**
 * Debounced input component for search and filter fields
 * Reduces API calls by delaying updates until user stops typing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { INPUT_DEBOUNCE_DELAY } from '@/constants';

interface DebouncedInputProps {
  /** Current value */
  value: string;
  /** Callback when debounced value changes */
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds */
  delay?: number;
  /** Input placeholder text */
  placeholder?: string;
  /** Input type */
  type?: string;
  /** Additional className */
  className?: string;
  /** Input name attribute */
  name?: string;
}

/**
 * Input with debouncing to reduce unnecessary updates
 * @example
 * <DebouncedInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Rechercher..."
 *   delay={400}
 * />
 */
export function DebouncedInput({
  value: initialValue,
  onChange,
  delay = INPUT_DEBOUNCE_DELAY,
  placeholder = "",
  type = "text",
  className = "",
  name,
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue);

  // Update local value when prop changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value !== initialValue) {
        onChange(value);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, onChange, initialValue]);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      name={name}
    />
  );
}
