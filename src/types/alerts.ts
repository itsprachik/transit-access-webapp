export interface AlertData {
  severity: 'error' | 'warning' | 'info' | 'success';
  text: string;
  color: string;
  type: string;
}

export interface AlertBannerProps {
  alertData: AlertData[];
  openStates: Record<number, boolean>;
  onClose: (index: number) => void;
}

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

export interface OpenStates {
  [key: number]: boolean;
}