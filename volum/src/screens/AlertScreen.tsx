
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import AlertCardItem from '../components/AlertCardItem';
import type { AlertItem } from '../mock/data';
import { colors, shadow, typography } from '../theme';

type Props = {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
};

export default function AlertsScreen({ alerts, onDismiss }: Props) {
  const critical = alerts.filter(
    (alert) => alert.severity === 'critical'
  ).length;

  const warning = alerts.filter(
    (alert) => alert.severity === 'warning'
  ).length;

  const offline = alerts.filter(
    (alert) => alert.severity === 'offline'
  ).length;

  return (
    <View>
      <Text style={styles.title}>Central de alertas</Text>
      <Text style={styles.subtitle}>
        Acompanhe e gerencie as ocorrências dos dispositivos em tempo real.
      </Text>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Feather name="alert-octagon" size={20} color={colors.danger} />
          <Text style={styles.number}>{critical}</Text>
          <Text style={styles.label}>Críticos</Text>
        </View>

        <View style={styles.summaryCard}>
          <Feather name="alert-triangle" size={20} color={colors.warning} />
          <Text style={styles.number}>{warning}</Text>
          <Text style={styles.label}>Atenção</Text>
        </View>

        <View style={styles.summaryCard}>
          <Feather name="wifi-off" size={20} color={colors.dustyBlue} />
          <Text style={styles.number}>{offline}</Text>
          <Text style={styles.label}>Desconectados</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Alertas ativos</Text>
            <Text style={styles.panelSubtitle}>
              {alerts.length} ocorrências pendentes
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>EM MONITORAMENTO</Text>
          </View>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <Feather
              name="check-circle"
              size={36}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>
              Nenhum alerta pendente
            </Text>
            <Text style={styles.emptyText}>
              Todos os dispositivos estão sem ocorrências pendentes.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <AlertCardItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.heading,
    fontSize: 30,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginTop: 4,
    marginBottom: 24,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 22,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    ...shadow,
  },
  number: {
    fontFamily: typography.heading,
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 10,
  },
  label: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    ...shadow,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  panelTitle: {
    fontFamily: typography.heading,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
  },
  panelSubtitle: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activeText: {
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 42,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
