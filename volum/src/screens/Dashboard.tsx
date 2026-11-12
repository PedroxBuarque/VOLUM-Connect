import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KpiCard from '../components/KpiCard';
import DeviceListItem, { COLS } from '../components/DeviceListItem';
import AlertCardItem from '../components/AlertCardItem';
import { kpis, devices, alerts as initialAlerts } from '../mock/data';
import { colors, shadow } from '../theme';

function formatToday() {
  const s = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;

  const [menu, setMenu] = useState('overview');
  const [search, setSearch] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activeAlerts = useMemo(
    () => initialAlerts.filter((a) => !dismissed.includes(a.id)),
    [dismissed]
  );
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.patient.toLowerCase().includes(q) ||
        d.bed.toLowerCase().includes(q)
    );
  }, [search]);

  // O KPI de alertas acompanha os alertas dispensados na tela
  const kpiList = kpis.map((k) =>
    k.id === 'alerts'
      ? {
          ...k,
          value: String(activeAlerts.length).padStart(2, '0'),
          hint: criticalCount > 0 ? `${criticalCount} requer atenção` : 'Nenhum crítico',
        }
      : k
  );

  const dismiss = (id: string) => setDismissed((prev) => [...prev, id]);

  return (
    <View style={styles.root}>
      <Sidebar active={menu} onSelect={setMenu} alertCount={activeAlerts.length} />

      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        <Header search={search} onChangeSearch={setSearch} />

        <Text style={styles.date}>{formatToday()}</Text>
        <Text style={styles.title}>Visão geral</Text>
        <Text style={styles.subtitle}>Acompanhe a operação dos seus dispositivos em tempo real.</Text>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {kpiList.map((k) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={k.value}
              hint={k.hint}
              icon={k.icon}
              tone={k.tone}
            />
          ))}
        </View>

        {/* Grid principal */}
        <View style={[styles.grid, !isWide && { flexDirection: 'column' }]}>
          <View style={[styles.panel, isWide ? { flex: 2 } : { width: '100%' }]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Dispositivos em operação</Text>
              <Text style={styles.panelSub}>{filteredDevices.length} exibidos</Text>
            </View>

            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: COLS.device }]}>Dispositivo / Paciente</Text>
              <Text style={[styles.th, { flex: COLS.level }]}>Nível da bolsa</Text>
              <Text style={[styles.th, { flex: COLS.flow }]}>Fluxo</Text>
              <Text style={[styles.th, { flex: COLS.status }]}>Status</Text>
            </View>

            {filteredDevices.length === 0 ? (
              <Text style={styles.empty}>Nenhum dispositivo encontrado.</Text>
            ) : (
              filteredDevices.map((d) => <DeviceListItem key={d.id} device={d} />)
            )}
          </View>

          <View style={[styles.panel, isWide ? { flex: 1 } : { width: '100%' }]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Alertas recentes</Text>
              <Text style={styles.panelSub}>{activeAlerts.length} ativos</Text>
            </View>

            {activeAlerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <Feather name="check-circle" size={28} color={colors.success} />
                <Text style={styles.emptyAlertsText}>Nenhum alerta pendente</Text>
              </View>
            ) : (
              activeAlerts.map((a) => (
                <AlertCardItem key={a.id} alert={a} onDismiss={dismiss} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  main: { flex: 1 },
  mainContent: { padding: 32, paddingBottom: 48 },
  date: { fontSize: 13, color: '#0F766E', fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 24 },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },

  grid: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  panel: { backgroundColor: colors.card, borderRadius: 12, padding: 20, ...shadow },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  panelSub: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  tableHead: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { textAlign: 'center', color: colors.muted, paddingVertical: 32 },

  emptyAlerts: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyAlertsText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
});
