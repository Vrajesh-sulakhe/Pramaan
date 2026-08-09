import React from 'react';
import './AuditViewer.css';

export interface AuditEvent {
  id: string;
  ts: Date;
  t: string;
  payload: string;
}

interface AuditViewerProps {
  audit: AuditEvent[];
}

export const AuditViewer: React.FC<AuditViewerProps> = ({ audit }) => {
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-audit-viewer">
      <div className="glass-filter"></div>
      <div className="glass-overlay"></div>
      <div className="glass-specular"></div>
      <div className="glass-content">
        <h3 className="audit-title">Audit Trail</h3>
        
        <div className="audit-timeline">
          {audit.map((event, i) => (
            <div 
              key={event.id}
              className="audit-entry" 
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="entry-dot"></div>
              {i !== audit.length - 1 && <div className="entry-line"></div>}
              <div className="entry-content">
                <span className="entry-time">{formatTime(event.ts)}</span>
                <span className="entry-type">{event.t}</span>
                <span className="entry-detail">{event.payload}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
