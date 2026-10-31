export interface AlertData {
  severity: 'error' | 'warning' | 'info' | 'success';
  text: string;
  color: string;
  type: string;
}


export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

export interface OpenStates {
  [key: number]: boolean;
}