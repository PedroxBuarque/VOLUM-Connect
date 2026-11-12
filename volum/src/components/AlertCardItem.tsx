import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import type { AlertItem, AlertSeverity } from '../mock/data';

const SEVERITY: Record<AlertSeverity, { color: string; bg: string; icon: string }> = {
  critical: { color: colors.danger, bg: colors.dangerSoft, icon: 'alert-octagon' },
  warning: { color: colors.warning, bg: colors.warningSoft, icon: 'alert-triangle' },
  offline: { color: colors.dustyBlue, bg: colors.graySoft, icon: 'wifi-off' },
};

type Props = {
  alert: AlertItem;
  onDismiss: (id: string) => void;
};

export default function AlertCardItem({ alert, onDismiss }: Props) {
  const s = SEVERITY[alert.severity];

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
        <Feather name={s.icon as any} size={18} color={s.color} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {alert.detail}
        </Text>
        <View style={styles.timeRow}>
          <Feather name="clock" size={11} color={colors.muted} />
          <Text style={styles.time}>{alert.time}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Marcar alerta como visto"
        onPress={() => onDismiss(alert.id)}
        style={({ hovered, pressed }: any) => [
          styles.check,
          (hovered || pressed) && styles.checkActive,
        ]}
      >
        <Feather name="check" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontFamily: typography.heading, fontSize: 14, fontWeight: '700', color: colors.navy },
  detail: { fontFamily: typography.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  time: { fontFamily: typography.body, fontSize: 11, color: colors.muted, fontWeight: '600' },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
