export const kpis = [
  { id: 'devices', label: 'Dispositivos ativos', value: 18, hint: '2 em manutenção', icon: 'cpu', tone: 'primary' },
  { id: 'patients', label: 'Pacientes monitorados', value: 24, hint: '6 alas', icon: 'users', tone: 'primary' },
  { id: 'bags', label: 'Bolsas em uso', value: 67, hint: 'de 108 canais', icon: 'droplet', tone: 'warning' },
  { id: 'alerts', label: 'Alertas ativos', value: 5, hint: '2 críticos', icon: 'bell', tone: 'danger' },
];

export const devices = [
  { id: 'VOLUM-001', patient: 'Maria Souza', bed: 'Leito 01', bag: 'Soro fisiológico 500 ml', level: 82, flow: 42, status: 'online' },
  { id: 'VOLUM-002', patient: 'João Pereira', bed: 'Leito 02', bag: 'Concentrado de hemácias', level: 64, flow: 60, status: 'online' },
  { id: 'VOLUM-003', patient: 'Ana Beatriz Lima', bed: 'Leito 03', bag: 'Ringer lactato 1000 ml', level: 41, flow: 85, status: 'attention' },
  { id: 'VOLUM-004', patient: 'Carlos Henrique', bed: 'Leito 04', bag: 'Plasma fresco', level: 93, flow: 30, status: 'online' },
  { id: 'VOLUM-005', patient: 'Fernanda Alves', bed: 'Leito 05', bag: 'Antibiótico 100 ml', level: 12, flow: 25, status: 'attention' },
  { id: 'VOLUM-006', patient: 'Roberto Nascimento', bed: 'Leito 06', bag: 'Soro glicosado 500 ml', level: 57, flow: 48, status: 'online' },
  { id: 'VOLUM-007', patient: 'Luciana Medeiros', bed: 'Leito 07', bag: 'Concentrado de plaquetas', level: 33, flow: 70, status: 'attention' },
  { id: 'VOLUM-008', patient: 'Paulo Ricardo', bed: 'Leito 08', bag: 'Soro fisiológico 250 ml', level: 76, flow: 38, status: 'online' },
];

export const volume24h = [
  { label: '00h', value: 420 },
  { label: '02h', value: 380 },
  { label: '04h', value: 310 },
  { label: '06h', value: 520 },
  { label: '08h', value: 780 },
  { label: '10h', value: 910 },
  { label: '12h', value: 860 },
  { label: '14h', value: 940 },
  { label: '16h', value: 720 },
  { label: '18h', value: 650 },
  { label: '20h', value: 540 },
  { label: '22h', value: 460 },
];

export const alerts = [
  { id: 'a1', title: 'Nível de bolsa baixo', detail: 'VOLUM-005 · Fernanda Alves · 12% restante', time: 'há 2 min', severity: 'critical' },
  { id: 'a2', title: 'Fluxo acima do prescrito', detail: 'VOLUM-003 · Ana Beatriz Lima · 85 ml/h', time: 'há 8 min', severity: 'warning' },
  { id: 'a3', title: 'Bolsa de plaquetas abaixo de 35%', detail: 'VOLUM-007 · Luciana Medeiros', time: 'há 15 min', severity: 'warning' },
  { id: 'a4', title: 'Gotejamento interrompido', detail: 'VOLUM-012 · Leito 12 · verificar equipo', time: 'há 22 min', severity: 'critical' },
  { id: 'a5', title: 'Bateria do dispositivo em 20%', detail: 'VOLUM-009 · Leito 09', time: 'há 41 min', severity: 'warning' },
];
