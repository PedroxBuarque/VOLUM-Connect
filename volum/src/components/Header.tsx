import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadow, typography } from '../theme';

type Props = {
  search: string;
  onChangeSearch: (text: string) => void;
  unit?: string;
  unitSub?: string;
  initials?: string;
};

export default function Header({
  search,
  onChangeSearch,
  unit = 'Hospital Central',
  unitSub = 'Unidade principal',
  initials = 'HC',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={onChangeSearch}
          placeholder="Buscar paciente ou dispositivo..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { outlineStyle: 'none' } as any]}
        />
      </View>

      <View style={styles.right}>
        <View style={styles.unitInfo}>
          <Text style={styles.unitName}>{unit}</Text>
          <Text style={styles.unitSub}>{unitSub}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 28,
  },
  searchBox: {
    flex: 1,
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 46,
    ...shadow,
  },
  input: { flex: 1, fontFamily: typography.body, fontSize: 14, color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unitInfo: { alignItems: 'flex-end' },
  unitName: {
    fontFamily: typography.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  unitSub: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
