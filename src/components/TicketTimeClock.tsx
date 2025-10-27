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
        body: JSON.stringify({ technicianId })
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
    </div>
  );
};

export default TicketTimeClock;
