import React, { useState, useEffect } from 'react';
import './TimeClock.css';

interface TimeClockEntry {
  EntryID: string;
  TechnicianID: string;
  TechnicianName: string;
  ClockInTime: string;
  ClockOutTime: string | null;
  TotalHours: number | null;
  Status: string;
}

interface TimeClockStatus {
  isClockedIn: boolean;
  currentEntry?: TimeClockEntry;
  lastEntry?: TimeClockEntry;
}

const TimeClock: React.FC = () => {
  const [status, setStatus] = useState<TimeClockStatus | null>(null);
  const [technicianId, setTechnicianId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  // Load technician ID from localStorage or user context
  useEffect(() => {
    const savedTechId = localStorage.getItem('technicianId');
    const savedTechName = localStorage.getItem('technicianName');
    if (savedTechId) {
      setTechnicianId(savedTechId);
      setTechnicianName(savedTechName || '');
      fetchStatus(savedTechId);
    }
  }, []);

  const fetchStatus = async (techId: string) => {
    if (!techId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/plugins/time-clock/status/${techId}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!technicianId || !technicianName) {
      setError('Please enter your ID and name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/plugins/time-clock/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, technicianName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock in');
      }

      // Save technician info
      localStorage.setItem('technicianId', technicianId);
      localStorage.setItem('technicianName', technicianName);

      // Refresh status
      await fetchStatus(technicianId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!technicianId) return;

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

      // Refresh status
      await fetchStatus(technicianId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getCurrentDuration = () => {
    if (!status?.currentEntry?.ClockInTime) return '0h 0m';
    const start = new Date(status.currentEntry.ClockInTime).getTime();
    const now = Date.now();
    const hours = (now - start) / (1000 * 60 * 60);
    return formatDuration(hours);
  };

  return (
    <div className="time-clock-widget">
      <div className="time-clock-header">
        <h2>⏰ Time Clock</h2>
      </div>

      {error && (
        <div className="time-clock-error">
          ⚠️ {error}
        </div>
      )}

      {!status && (
        <div className="time-clock-setup">
          <input
            type="text"
            placeholder="Technician ID"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleClockIn} disabled={loading}>
            {loading ? 'Loading...' : 'Clock In'}
          </button>
        </div>
      )}

      {status && (
        <>
          <div className="time-clock-status">
            {status.isClockedIn ? (
              <div className="clocked-in">
                <div className="status-badge active">✅ Clocked In</div>
                <div className="current-session">
                  <p><strong>{status.currentEntry?.TechnicianName}</strong></p>
                  <p>Started: {formatTime(status.currentEntry!.ClockInTime)}</p>
                  <p className="duration">Duration: {getCurrentDuration()}</p>
                </div>
                <button 
                  className="clock-out-btn" 
                  onClick={handleClockOut}
                  disabled={loading}
                >
                  {loading ? 'Clocking Out...' : '🔴 Clock Out'}
                </button>
              </div>
            ) : (
              <div className="clocked-out">
                <div className="status-badge inactive">⏸️ Clocked Out</div>
                {status.lastEntry && (
                  <div className="last-session">
                    <p><strong>Last Session</strong></p>
                    <p>In: {formatTime(status.lastEntry.ClockInTime)}</p>
                    {status.lastEntry.ClockOutTime && (
                      <>
                        <p>Out: {formatTime(status.lastEntry.ClockOutTime)}</p>
                        {status.lastEntry.TotalHours && (
                          <p className="duration">
                            Total: {formatDuration(status.lastEntry.TotalHours)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                <button 
                  className="clock-in-btn" 
                  onClick={handleClockIn}
                  disabled={loading}
                >
                  {loading ? 'Clocking In...' : '🟢 Clock In'}
                </button>
              </div>
            )}
          </div>

          <button 
            className="refresh-btn"
            onClick={() => fetchStatus(technicianId)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </>
      )}
    </div>
  );
};

export default TimeClock;
