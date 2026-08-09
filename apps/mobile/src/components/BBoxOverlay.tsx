import React from 'react';
import './BBoxOverlay.css';
import { CaptureType } from '../context/SessionContext';

export interface BBoxField {
  id: string;
  value: string;
  bbox: [number, number, number, number]; // [left, top, width, height] in percentages
  low_conf: boolean;
}

interface BBoxOverlayProps {
  captureType: CaptureType | null;
  captureData: string | null;
  fields: BBoxField[];
  onConfirmField?: (id: string) => void;
}

export const BBoxOverlay: React.FC<BBoxOverlayProps> = ({ captureType, captureData, fields, onConfirmField }) => {
  const isImage = captureType === 'image' || captureType === 'camera' || captureType === 'file';
  
  return (
    <div className="glass-read-screen">
      <div className="glass-filter"></div>
      <div className="glass-overlay"></div>
      <div className="glass-specular"></div>
      <div className="glass-content document-container" style={{ paddingBottom: isImage ? '120%' : 'auto', minHeight: isImage ? 0 : 200 }}>
        {isImage ? (
          <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800&h=1000" alt="Document" className="document-image" style={{ filter: 'grayscale(0.5)' }} />
        ) : (
          <div style={{ padding: 24, fontSize: 16, lineHeight: 1.6, color: 'var(--glass-text)', opacity: 0.9 }}>
            {captureData || "No text provided"}
          </div>
        )}
        
        {/* OCR Bounding Boxes (Only really relevant for images, but keeping for compatibility) */}
        {isImage && fields.map(field => (
          <div 
            key={field.id}
            className={`ocr-box ${field.low_conf ? 'low-confidence' : 'high-confidence'}`}
            style={{
              left: `${field.bbox[0]}%`,
              top: `${field.bbox[1]}%`,
              width: `${field.bbox[2]}%`,
              height: `${field.bbox[3]}%`
            }}
          >
            {field.low_conf && (
              <div 
                className="tap-to-confirm"
                onClick={() => onConfirmField && onConfirmField(field.id)}
              >
                <span>Tap to confirm: {field.value}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
