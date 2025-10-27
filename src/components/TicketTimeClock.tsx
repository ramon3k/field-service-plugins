import React, { useState, useEffect } from 'react';
import './TicketTimeClock.css';

interface TimeClockEntry {
  entryId: string;
  technicianId: string;
  technicianName: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  ticketId?: string;
  hoursElapsed?: string;
}

interface TimeClockStatus {
  isClockedIn: boolean;
  currentEntry?: TimeClockEntry;
  lastEntry?: TimeClockEntry;
}

interface TicketTimeSummary {
  technicianId: string;
  technicianName: string;
  sessionCount: number;
  totalHours: number;
  isCurrentlyClocked: boolean;
}

interface TicketTimeClockProps {
  ticketId: string;
  technicianId?: string;
  technicianName?: string;
  onTimeUpdate?: (hours: number) => void;
}

const TicketTimeClock: React.FC<TicketTimeClockProps> = ({ 
  ticketId, 
  technicianId: propTechnicianId, 
  technicianName: propTechnicianName,
  onTimeUpdate 
}) => {
  const [status, setStatus] = useState<TimeClockStatus | null>(null);
  const [summary, setSummary] = useState<TicketTimeSummary[]>([]);
  const [technicianId, setTechnicianId] = useState(propTechnicianId || '');
  const [technicianName, setTechnicianName] = useState(propTechnicianName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  useEffect(() => {
    // Try to get current user info from localStorage
    const sqlUserStr = localStorage.getItem('sqlUser');
    if (sqlUserStr && !propTechnicianId) {
      try {
        const sqlUser = JSON.parse(sqlUserStr);
        setTechnicianId(sqlUser.id || sqlUser.username);
        setTechnicianName(sqlUser.fullName || sqlUser.username);
      } catch (e) {
        console.warn('Failed to parse sqlUser');
      }
    }
  }, [propTechnicianId]);

  useEffect(() => {
    if (technicianId && ticketId) {
      fetchStatus();
      fetchTicketSummary();
    }
  }, [technicianId, ticketId]);

  const fetchStatus = async () => {
    if (!technicianId || !ticketId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/plugins/time-clock/status/${technicianId}?ticketId=${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      
      if (data.currentEntry && onTimeUpdate) {
        onTimeUpdate(parseFloat(data.currentEntry.hoursElapsed || '0'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketSummary = async () => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`${API_BASE}/plugins/time-clock/ticket-summary/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket summary');
      const data = await response.json();
      setSummary(data.summary || []);
    } catch (err) {
      console.warn('Failed to fetch ticket summary:', err);
      // Don't set error state for summary - it's not critical
    }
  };

  const handleClockIn = async () => {
    if (!technicianId || !technicianName || !ticketId) {
      setError('Missing required information');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/plugins/time-clock/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          technicianId, 
          technicianName,
          ticketId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock in');
      }

      await fetchStatus();
      await fetchTicketSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!technicianId || !ticketId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/plugins/time-clock/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          technicianId,
          ticketId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock out');
      }

      const result = await response.json();
      if (onTimeUpdate && result.entry) {
        onTimeUpdate(result.entry.totalHours);
      }

      await fetchStatus();
      await fetchTicketSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (hours: string | number) => {
    const h = typeof hours === 'string' ? parseFloat(hours) : hours;
    const wholeHours = Math.floor(h);
    const minutes = Math.round((h - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  if (loading && !status) {
    return <div className="ticket-time-clock-loading">Loading time clock...</div>;
  }

  return (
    <div className="ticket-time-clock">
      <div className="time-clock-header">
        <h3>⏱️ Time Tracking</h3>
        <span className="ticket-badge">Ticket: {ticketId}</span>
      </div>

      {error && (
        <div className="time-clock-error">{error}</div>
      )}

      {status && (
        <div className="time-clock-status">
          <div className={`status-indicator ${status.isClockedIn ? 'active' : 'inactive'}`}>
            {status.isClockedIn ? '🟢 Clocked In' : '⚪ Not Clocked In'}
          </div>

          {status.currentEntry && (
            <div className="current-session">
              <h4>Current Session</h4>
              <div className="session-details">
                <div className="detail-row">
                  <span className="label">Technician:</span>
                  <span className="value">{status.currentEntry.technicianName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Clock In:</span>
                  <span className="value">{formatTime(status.currentEntry.clockInTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Time Elapsed:</span>
                  <span className="value highlight">{formatDuration(status.currentEntry.hoursElapsed || '0')}</span>
                </div>
              </div>
            </div>
          )}

          {status.lastEntry && !status.isClockedIn && (
            <div className="last-session">
              <h4>Last Session</h4>
              <div className="session-details">
                <div className="detail-row">
                  <span className="label">Clock In:</span>
                  <span className="value">{formatTime(status.lastEntry.clockInTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Clock Out:</span>
                  <span className="value">{status.lastEntry.clockOutTime ? formatTime(status.lastEntry.clockOutTime) : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Hours:</span>
                  <span className="value highlight">{status.lastEntry.totalHours ? formatDuration(status.lastEntry.totalHours) : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="time-clock-actions">
        {status?.isClockedIn ? (
          <button 
            className="clock-out-button"
            onClick={handleClockOut}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Clock Out'}
          </button>
        ) : (
          <button 
            className="clock-in-button"
            onClick={handleClockIn}
            disabled={loading || !technicianId}
          >
            {loading ? 'Processing...' : 'Clock In to Ticket'}
          </button>
        )}
      </div>

      {summary.length > 0 && (
        <div className="ticket-time-summary">
          <h4>📊 Ticket Time Summary</h4>
          <div className="summary-list">
            {summary.map((item) => (
              <div key={item.technicianId} className="summary-item">
                <div className="summary-name">
                  {item.technicianName}
                  {item.isCurrentlyClocked && <span className="active-badge">🟢 Active</span>}
                </div>
                <div className="summary-stats">
                  <span className="summary-hours">{formatDuration(item.totalHours)}</span>
                  <span className="summary-sessions">({item.sessionCount} session{item.sessionCount !== 1 ? 's' : ''})</span>
                </div>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <strong>Total Time on Ticket:</strong>{' '}
            <span className="total-hours">
              {formatDuration(summary.reduce((sum, item) => sum + item.totalHours, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTimeClock;
