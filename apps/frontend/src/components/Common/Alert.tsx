'use client';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertProps {
  type: AlertType;
  message: string;
  title?: string;
  onClose?: () => void;
}

export function Alert({ type, message, title, onClose }: AlertProps) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      role="alert"
      className={`border p-4 rounded-lg ${colors[type]} mb-4 flex items-start justify-between animate-[slide-in_0.22s_ease-out] shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold">{icons[type]}</span>
        <div>
          {title && <h4 className="font-semibold">{title}</h4>}
          <p>{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
