import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

type Tone = 'primary' | 'warning' | 'danger';

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  icon: string;
  tone?: Tone;
};

const TONES: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primary, bg: colors.primarySoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
};

export default function KpiCard({ label, value, hint, icon, tone = 'primary' }: Props) {
  const t = TONES[tone];
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.iconBox, { backgroundColor: t.bg }]}>
          <Feather name={icon as any} size={18} color={t.fg} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 180,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    ...shadow,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.muted },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: 12 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4 },
});
