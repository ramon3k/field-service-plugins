// src/components/DatePicker.tsx
import React, { useState, useRef, useEffect } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

export default function DatePicker({ value, onChange, placeholder, label, required, disabled = false }: Props) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date.toISOString().split('T')[0])
      setSelectedTime(date.toTimeString().slice(0, 5))
    } else {
      setSelectedDate('')
      setSelectedTime('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    updateDateTime(newDate, selectedTime)
  }

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime)
    updateDateTime(selectedDate, newTime)
  }

  const updateDateTime = (date: string, time: string) => {
    if (date && time) {
      const datetime = new Date(`${date}T${time}`)
      onChange(datetime.toISOString())
    } else if (date) {
      const datetime = new Date(`${date}T00:00`)
      onChange(datetime.toISOString())
    } else {
      onChange('')
    }
  }

  const formatDisplayValue = () => {
    if (value) {
      const date = new Date(value)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
    return ''
  }

  const clearValue = () => {
    setSelectedDate('')
    setSelectedTime('')
    onChange('')
  }

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '500',
          color: '#374151'
        }}>
          {label} {required && '*'}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={formatDisplayValue()}
          onClick={() => !disabled && setShowCalendar(true)}
          readOnly
          disabled={disabled}
          placeholder={placeholder || 'Click to select date and time'}
          style={{
            width: '100%',
            padding: '0.75rem',
            paddingRight: value ? '3rem' : '2.5rem',
            paddingLeft: '2.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            color: disabled ? '#a0aec0' : '#374151',
            fontWeight: '500'
          }}
        />
        
        {/* Calendar Icon */}
        <div style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#4a5568',
          fontSize: '1rem',
          pointerEvents: 'none'
        }}>
          📅
        </div>
        
        {value && !disabled && (
          <button
            type="button"
            onClick={clearValue}
            title="Clear date"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ef4444',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem',
              borderRadius: '50%',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        )}
      </div>

      {showCalendar && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 2000,
          padding: '1.5rem',
          marginTop: '4px'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              📅 Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              🕐 Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={clearValue}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}