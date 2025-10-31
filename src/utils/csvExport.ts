// Utility functions for CSV export functionality

export function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const str = String(value)
  
  // If the value contains comma, newline, or double quote, wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""')
    return `"${escaped}"`
  }
  
  return str
}

export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Create header row
  const headers = columns.map(col => col.label)
  const headerRow = headers.map(formatCSVValue).join(',')
  
  // Create data rows
  const dataRows = data.map(item => {
    const row = columns.map(col => {
      const value = item[col.key]
      return formatCSVValue(value)
    })
    return row.join(',')
  })
  
  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n')
  
  // Create and trigger download
  downloadCSV(csvContent, filename)
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Format date for CSV export
export function formatDateForCSV(date: string | Date): string {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)
  
  return d.toLocaleString()
}

// Format priority with emoji
export function formatPriorityForCSV(priority: string): string {
  switch (priority) {
    case 'Critical': return '🔴 Critical'
    case 'High': return '🟠 High'
    case 'Normal': return '🟡 Normal'
    case 'Low': return '🔵 Low'
    default: return priority
  }
}

// Format status with emoji
export function formatStatusForCSV(status: string): string {
  switch (status) {
    case 'Open': return '🆕 Open'
    case 'In Progress': return '⚡ In Progress'
    case 'Complete': return '✅ Complete'
    case 'Closed': return '🔒 Closed'
    case 'On Hold': return '⏸️ On Hold'
    default: return status
  }
}