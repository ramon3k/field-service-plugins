// src/components/TimezoneSelector.tsx
import React from 'react'

interface Props {
  value: string
  onChange: (timezone: string) => void
  className?: string
  required?: boolean
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
  { value: 'America/Vancouver', label: 'Pacific Time - Vancouver' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Central European Time - Berlin' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time - Melbourne' },
  { value: 'Australia/Perth', label: 'Australian Western Time' }
]

export default function TimezoneSelector({ value, onChange, className = '', required = false }: Props) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={required}
    >
      <option value="">— Select Timezone —</option>
      {timezones.map(tz => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </select>
  )
}