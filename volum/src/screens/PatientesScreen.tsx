import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Device } from './DevicesScreen';
import { colors, shadow, typography } from '../theme';

type Props = {
  devices: Device[];
  searchQuery: string;
  onSelectDevice: (device: Device) => void;
};

export default function PatientsScreen({
  devices,
  searchQuery,
  onSelectDevice,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Organiza os pacientes a partir dos dispositivos cadastrados
  const patients = useMemo(() => {
    const uniquePatients = new Map<string, Device>();

    devices.forEach((device) => {
      if (!uniquePatients.has(device.patient)) {
        uniquePatients.set(device.patient, device);
      }
    });

    const list = Array.from(uniquePatients.values());
    const query = searchQuery.trim().toLowerCase();

    if (!query) return list;

    return list.filter((patient) =>
      [
        patient.patient,
        patient.bed,
        patient.id,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [devices, searchQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pacientes</Text>

      <Text style={styles.subtitle}>
        Gerencie e acompanhe todos os pacientes monitorados.
      </Text>

      {/* Indicadores */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Feather name="users" size={22} color={colors.primary} />
          <Text style={styles.summaryValue}>
            {patients.length.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Pacientes cadastrados</Text>
        </View>

        <View style={styles.summaryCard}>
          <Feather name="activity" size={22} color={colors.primary} />
          <Text style={styles.summaryValue}>
            {patients.filter((p) => p.status !== 'offline').length
              .toString()
              .padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Em monitoramento</Text>
        </View>
      </View>

      {/* Lista de pacientes */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Lista de pacientes</Text>
          <Text style={styles.panelCount}>
            {patients.length} encontrados
          </Text>
        </View>

        {/* Cabeçalho da tabela */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>PACIENTE</Text>
          {isWide && (
            <Text style={[styles.headerText, { flex: 1 }]}>LEITO</Text>
          )}
          <Text style={[styles.headerText, { flex: 1.5 }]}>
            DISPOSITIVO
          </Text>
          <Text style={[styles.headerText, { flex: 1 }]}>STATUS</Text>
        </View>

        {patients.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum paciente encontrado.
          </Text>
        ) : (
          patients.map((patient) => {
            const online = patient.status === 'online';
            const attention = patient.status === 'attention';

            return (
              <Pressable
                key={patient.patient}
                onPress={() => onSelectDevice(patient)}
                style={({ hovered }: any) => [
                  styles.patientRow,
                  hovered && styles.rowHover,
                ]}
              >
                <View style={styles.patientInfo}>
                  <View style={styles.avatar}>
                    <Feather
                      name="user"
                      size={19}
                      color={colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>
                      {patient.patient}
                    </Text>
                    <Text style={styles.patientBed}>
                      {patient.bed}
                    </Text>
                  </View>
                </View>

                {isWide && (
                  <Text style={styles.cell}>
                    {patient.bed}
                  </Text>
                )}

                <Text style={styles.deviceCell}>
                  {patient.id}
                </Text>

                <View style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.status,
                      online
                        ? styles.statusOnline
                        : attention
                        ? styles.statusAttention
                        : styles.statusOffline,
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        online
                          ? styles.dotOnline
                          : attention
                          ? styles.dotAttention
                          : styles.dotOffline,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        online
                          ? styles.textOnline
                          : attention
                          ? styles.textAttention
                          : styles.textOffline,
                      ]}
                    >
                      {online
                        ? 'Online'
                        : attention
                        ? 'Atenção'
                        : 'Offline'}
                    </Text>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.footer}>
        Selecione um paciente para visualizar o dispositivo associado.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 30,
    fontWeight: '800',
    color: colors.navy,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginTop: -12,
    marginBottom: 8,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    gap: 8,
    ...shadow,
  },
  summaryValue: {
    fontFamily: typography.heading,
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
  },
  summaryLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
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
    marginBottom: 18,
  },
  panelTitle: {
    fontFamily: typography.heading,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
  },
  panelCount: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  headerText: {
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowHover: {
    backgroundColor: colors.primarySoft,
  },
  patientInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  patientBed: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  cell: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.navy,
  },
  deviceCell: {
    flex: 1.5,
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
  status: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOnline: {
    backgroundColor: '#E6F5EC',
  },
  statusAttention: {
    backgroundColor: '#FFF2D9',
  },
  statusOffline: {
    backgroundColor: '#FCE8E8',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOnline: {
    backgroundColor: '#269B5A',
  },
  dotAttention: {
    backgroundColor: '#D99A25',
  },
  dotOffline: {
    backgroundColor: '#D9534F',
  },
  statusText: {
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '700',
  },
  textOnline: {
    color: '#269B5A',
  },
  textAttention: {
    color: '#B47A16',
  },
  textOffline: {
    color: '#D9534F',
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    paddingVertical: 32,
  },
  footer: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.muted,
  },
});