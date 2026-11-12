export type DeviceStatus = 'online' | 'attention' | 'offline';
export type AlertSeverity = 'critical' | 'warning' | 'offline';
export type KpiTone = 'primary' | 'warning' | 'danger';

export type Kpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: KpiTone;
};

export type Device = {
  id: string;
  bed: string;
  patient: string;
  bag: string;
  level: number; // 0-100
  flow: number; // ml/h
  status: DeviceStatus;
};

export type AlertItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity: AlertSeverity;
};

export const kpis: Kpi[] = [
  { id: 'devices', label: 'Dispositivos ativos', value: '18', hint: 'de 20 dispositivos', icon: 'cpu', tone: 'primary' },
  { id: 'patients', label: 'Pacientes monitorados', value: '16', hint: '2 novos hoje', icon: 'users', tone: 'primary' },
  { id: 'bags', label: 'Bolsas em uso', value: '16', hint: '4 disponíveis', icon: 'droplet', tone: 'warning' },
  { id: 'alerts', label: 'Alertas ativos', value: '03', hint: '1 requer atenção', icon: 'bell', tone: 'danger' },
];

export const devices: Device[] = [
  { id: 'VOLUM-001', bed: 'Leito 12', patient: 'Ana Oliveira', bag: 'Soro fisiológico 500 ml', level: 82, flow: 42, status: 'online' },
  { id: 'VOLUM-002', bed: 'Leito 07', patient: 'Carlos Mendes', bag: 'Concentrado de hemácias', level: 18, flow: 55, status: 'attention' },
  { id: 'VOLUM-003', bed: 'Leito 03', patient: 'Mariana Costa', bag: 'Ringer lactato 1000 ml', level: 64, flow: 60, status: 'online' },
  { id: 'VOLUM-004', bed: 'Leito 09', patient: 'Roberto Lima', bag: 'Plasma fresco', level: 40, flow: 0, status: 'offline' },
  { id: 'VOLUM-005', bed: 'Leito 15', patient: 'Juliana Rocha', bag: 'Soro glicosado 500 ml', level: 91, flow: 30, status: 'online' },
  { id: 'VOLUM-006', bed: 'Leito 05', patient: 'Pedro Almeida', bag: 'Antibiótico 100 ml', level: 47, flow: 12, status: 'attention' },
  { id: 'VOLUM-007', bed: 'Leito 02', patient: 'Fernanda Souza', bag: 'Concentrado de plaquetas', level: 73, flow: 48, status: 'online' },
  { id: 'VOLUM-008', bed: 'Leito 18', patient: 'Marcos Vinícius', bag: 'Soro fisiológico 250 ml', level: 58, flow: 36, status: 'online' },
];

export const alerts: AlertItem[] = [
  { id: 'a1', title: 'Nível de bolsa baixo', detail: 'VOLUM-002 • Carlos Mendes', time: 'Há 4 min', severity: 'critical' },
  { id: 'a2', title: 'Fluxo abaixo do esperado', detail: 'VOLUM-006 • Pedro Almeida', time: 'Há 11 min', severity: 'warning' },
  { id: 'a3', title: 'Dispositivo desconectado', detail: 'VOLUM-004 • Roberto Lima', time: 'Há 26 min', severity: 'offline' },
];
