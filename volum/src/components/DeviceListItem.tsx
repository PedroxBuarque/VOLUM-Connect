import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { Device, DeviceStatus } from '../mock/data';

// Larguras relativas das colunas (reutilizadas no cabeçalho da tabela)
export const COLS = { device: 1.5, level: 1.6, flow: 0.8, status: 0.9 };

const STATUS: Record<DeviceStatus, { label: string; dot: string; bg: string; fg: string }> = {
  online: { label: 'Online', dot: colors.success, bg: colors.successSoft, fg: '#047857' },
  attention: { label: 'Atenção', dot: colors.warning, bg: colors.warningSoft, fg: '#92400E' },
  offline: { label: 'Offline', dot: colors.gray, bg: colors.graySoft, fg: '#4B5563' },
};

function barColor(device: Device) {
  if (device.status === 'offline') return colors.gray;
  return device.level > 50 ? colors.success : colors.warning;
}

export default function DeviceListItem({ device }: { device: Device }) {
  const s = STATUS[device.status];
  const isOffline = device.status === 'offline';

  return (
    <View style={styles.row}>
      <View style={{ flex: COLS.device }}>
        <Text style={styles.id}>
          {device.id} - {device.bed}
        </Text>
        <Text style={styles.patient} numberOfLines={1}>
          {device.patient}
        </Text>
      </View>

      <View style={{ flex: COLS.level, paddingRight: 16 }}>
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${device.level}%`, backgroundColor: barColor(device) }]}
          />
        </View>
        <Text style={styles.levelText}>
          {device.level}% · {device.bag}
        </Text>
      </View>

      <Text style={[styles.flow, { flex: COLS.flow }, isOffline && { color: colors.gray }]}>
        {isOffline ? '—' : `${device.flow} ml/h`}
      </Text>

      <View style={{ flex: COLS.status, alignItems: 'flex-start' }}>
        <View style={[styles.tag, { backgroundColor: s.bg }]}>
          <View style={[styles.tagDot, { backgroundColor: s.dot }]} />
          <Text style={[styles.tagText, { color: s.fg }]}>{s.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  id: { fontSize: 14, fontWeight: '700', color: colors.text },
  patient: { fontSize: 12, color: colors.muted, marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  levelText: { fontSize: 11, color: colors.muted, marginTop: 6 },
  flow: { fontSize: 14, fontWeight: '600', color: colors.text },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 12, fontWeight: '700' },
});
