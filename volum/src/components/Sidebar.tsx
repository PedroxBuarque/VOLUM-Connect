import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadow, typography } from '../theme';

export const MENU_ITEMS = [
  { key: 'overview', label: 'Visão geral', icon: 'home' },
  { key: 'devices', label: 'Dispositivos', icon: 'cpu' },
  { key: 'patients', label: 'Pacientes', icon: 'users' },
  { key: 'bags', label: 'Bolsas', icon: 'droplet' },
  { key: 'alerts', label: 'Alertas', icon: 'bell' },
  { key: 'settings', label: 'Configurações', icon: 'settings' },
] as const;

type Props = {
  active: string;
  onSelect: (key: string) => void;
  alertCount?: number;
};

export default function Sidebar({ active, onSelect, alertCount = 0 }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.logoBox}>
          {/* Salve a logo em: <raiz do projeto>/assets/images/logo-volum.jpeg */}
          <Image
            source={require('../../assets/images/logo-volum.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => {
            const isActive = item.key === active;
            const showBadge = item.key === 'alerts' && alertCount > 0;
            return (
              <Pressable
                key={item.key}
                onPress={() => onSelect(item.key)}
                style={({ hovered }: any) => [
                  styles.item,
                  isActive && styles.itemActive,
                  hovered && !isActive && styles.itemHover,
                ]}
              >
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={isActive ? colors.primary : colors.muted}
                />
                <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
                  {item.label}
                </Text>
                {showBadge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{alertCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Central conectada</Text>
        <Text style={styles.statusText}>Broker MQTT operando normalmente</Text>
        <View style={styles.onlineRow}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>SISTEMA ONLINE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    justifyContent: 'space-between',
    ...shadow,
  },
  // Preservar dimensões e transformação da logo conforme solicitado.
  logoBox: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.18 }],
  },
  menu: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  itemHover: { backgroundColor: colors.primarySoft },
  itemText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  itemTextActive: { color: colors.primary, fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  statusCard: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  statusTitle: {
    color: colors.white,
    fontFamily: typography.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    color: colors.dustyBlue,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onlineIndicator },
  onlineText: {
    color: colors.onlineIndicator,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
