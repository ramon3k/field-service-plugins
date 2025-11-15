import React, { useState, useEffect } from 'react';

interface TimeClockReportProps {
  timeFilter?: string;
}

interface TimeEntry {
  technicianId: string;
  technicianName: string;
  totalHours: number;
  sessionCount: number;
  ticketCount: number;
}

interface TicketTimeEntry {
  ticketId: string;
  ticketTitle: string;
  totalHours: number;
  technicianCount: number;
  sessionCount: number;
  technicians: {
    technicianName: string;
    hours: number;
  }[];
}

const TimeClockReport: React.FC<TimeClockReportProps> = ({ timeFilter = 'all' }) => {
  const [reportData, setReportData] = useState<TimeEntry[]>([]);
  const [ticketData, setTicketData] = useState<TicketTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    if (isExpanded) {
      fetchReportData();
      fetchTicketData();
    }
  }, [timeFilter, isExpanded]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/plugins/time-clock/report?timeFilter=${timeFilter}`);
      if (!response.ok) throw new Error('Failed to fetch time clock report');
      
      const data = await response.json();
      setReportData(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketData = async () => {
    try {
      const response = await fetch(`${API_BASE}/plugins/time-clock/ticket-report?timeFilter=${timeFilter}`);
      if (!response.ok) throw new Error('Failed to fetch ticket time report');
      
      const data = await response.json();
      setTicketData(data.tickets || []);
    } catch (err) {
      console.error('Failed to load ticket report:', err);
    }
  };

  const exportTechnicianCSV = () => {
    const headers = ['Technician', 'Total Hours', 'Sessions', 'Tickets', 'Avg Hours/Ticket'];
    const rows = reportData.map(entry => [
      entry.technicianName,
      entry.totalHours.toFixed(2),
      entry.sessionCount.toString(),
      entry.ticketCount.toString(),
      entry.ticketCount > 0 ? (entry.totalHours / entry.ticketCount).toFixed(2) : '0'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csv, `technician-time-report-${timeFilter}.csv`);
  };

  const exportTicketCSV = () => {
    const headers = ['Ticket ID', 'Ticket Title', 'Total Hours', 'Technicians', 'Sessions'];
    const rows = ticketData.map(ticket => [
      ticket.ticketId,
      `"${ticket.ticketTitle.replace(/"/g, '""')}"`, // Escape quotes in title
      ticket.totalHours.toFixed(2),
      ticket.technicianCount.toString(),
      ticket.sessionCount.toString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadCSV(csv, `ticket-time-report-${timeFilter}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = reportData.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalSessions = reportData.reduce((sum, entry) => sum + entry.sessionCount, 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Expandable Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: isExpanded ? '16px' : '0',
          transition: 'all 0.2s'
        }}
      >
        <h2 style={{ 
          margin: 0, 
          color: '#333', 
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⏱️ Time Clock Report
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isExpanded && (
            <>
              <span style={{ fontSize: '14px', color: '#555' }}>
                {reportData.length} Technicians • {formatHours(totalHours)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportTechnicianCSV();
                }}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📥 Export CSV
              </button>
            </>
          )}
          <span style={{ fontSize: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {loading ? (
            <div style={{ 
              background: 'white', 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px', 
              padding: '40px',
              textAlign: 'center',
              color: '#555'
            }}>
              Loading time clock data...
            </div>
          ) : error ? (
            <div style={{ 
              background: '#fee', 
              border: '1px solid #fcc', 
              borderRadius: '8px', 
              padding: '20px',
              color: '#c33'
            }}>
              Error: {error}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
                    📊 Total Hours
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3388ff' }}>
                    {formatHours(totalHours)}
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
                    👥 Active Technicians
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#88cc88' }}>
                    {reportData.length}
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
                    🔄 Total Sessions
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff8800' }}>
                    {totalSessions}
                  </div>
                </div>
              </div>

              {/* Technician Details Table */}
              <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Technician Time Summary</h3>
        {reportData.length === 0 ? (
          <p style={{ color: '#777', textAlign: 'center', padding: '20px' }}>
            No time clock data for selected period
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555', fontWeight: '600' }}>Technician</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Total Hours</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Sessions</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Tickets</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Avg Hours/Ticket</th>
              </tr>
            </thead>
            <tbody>
              {reportData
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((entry, index) => (
                  <tr 
                    key={entry.technicianId}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: index % 2 === 0 ? 'white' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '500', color: '#333' }}>
                      {entry.technicianName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#3388ff', fontWeight: '600' }}>
                      {formatHours(entry.totalHours)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#333' }}>
                      {entry.sessionCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#333' }}>
                      {entry.ticketCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#777' }}>
                      {entry.ticketCount > 0 ? formatHours(entry.totalHours / entry.ticketCount) : 'N/A'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Time Summary */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflowX: 'auto',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Time Summary by Ticket</h3>
          <button
            onClick={exportTicketCSV}
            disabled={ticketData.length === 0}
            style={{
              padding: '8px 16px',
              background: ticketData.length > 0 ? '#10b981' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: ticketData.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Export Tickets CSV
          </button>
        </div>
        {ticketData.length === 0 ? (
          <p style={{ color: '#777', textAlign: 'center', padding: '20px' }}>
            No ticket data for selected period
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555', fontWeight: '600' }}>Ticket ID</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#555', fontWeight: '600' }}>Ticket Title</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Total Hours</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Technicians</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#555', fontWeight: '600' }}>Sessions</th>
              </tr>
            </thead>
            <tbody>
              {ticketData
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((ticket, index) => (
                  <tr 
                    key={ticket.ticketId}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: index % 2 === 0 ? 'white' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '500', color: '#333' }}>
                      {ticket.ticketId}
                    </td>
                    <td style={{ padding: '12px', color: '#333' }}>
                      {ticket.ticketTitle}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#3388ff', fontWeight: '600' }}>
                      {formatHours(ticket.totalHours)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#333' }}>
                      {ticket.technicianCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#333' }}>
                      {ticket.sessionCount}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TimeClockReport;
