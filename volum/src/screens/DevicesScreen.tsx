import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DeviceListItem, { COLS } from '../components/DeviceListItem';
import { devices as mockDevices } from '../mock/data';
import { colors, typography, shadow } from '../theme';

export type Device = (typeof mockDevices)[number];

type Props = {
  devices?: Device[];
  onAddDevice?: (device: Device) => void;
  searchQuery?: string;
  onSelectDevice?: (device: Device) => void;
};

function isDeviceOffline(d: any): boolean {
  const raw = String(d.status ?? d.state ?? d.tone ?? '').toLowerCase();
  return (
    raw.includes('off') ||
    raw.includes('desc') ||
    raw === 'gray' ||
    raw === 'inactive' ||
    d.flow === '—' ||
    d.flow === null
  );
}

export default function DevicesScreen({
  devices = mockDevices,
  onAddDevice,
  searchQuery = '',
  onSelectDevice,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newCode, setNewCode] = useState(
    `VOLUM-${String(devices.length + 1).padStart(3, '0')}`
  );
  const [newBed, setNewBed] = useState('');
  const [newPatient, setNewPatient] = useState('');
  const [newSolution, setNewSolution] = useState('Soro fisiológico 500 ml');

  const filteredDevices = devices.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      item.patient.toLowerCase().includes(q) ||
      item.bed.toLowerCase().includes(q)
    );
  });

  const onlineCount = devices.filter((d) => !isDeviceOffline(d)).length;

  const openModal = () => {
    setNewCode(`VOLUM-${String(devices.length + 1).padStart(3, '0')}`);
    setModalVisible(true);
  };

  const handleAddDevice = () => {
    if (!newCode.trim()) return;

    const hasPatient = Boolean(newPatient.trim());
    const onlineTemplate: any =
      devices.find((d) => !isDeviceOffline(d)) || devices[0];
    const offlineTemplate: any =
      devices.find((d) => isDeviceOffline(d)) || devices[0];
    const template = hasPatient ? onlineTemplate : offlineTemplate;

    const created: any = {
      ...template,
      id: newCode.trim().toUpperCase(),
      bed: newBed.trim() || 'Disponível',
      patient: newPatient.trim() || 'Sem paciente',
    };

    if ('level' in template) created.level = hasPatient ? 100 : 0;
    if ('bagLevel' in template) created.bagLevel = hasPatient ? 100 : 0;
    if ('solution' in template) {
      created.solution = newSolution.trim() || 'Soro fisiológico 500 ml';
    }
    if ('bag' in template) {
      created.bag = newSolution.trim() || 'Soro fisiológico 500 ml';
    }
    if ('fluid' in template) {
      created.fluid = newSolution.trim() || 'Soro fisiológico 500 ml';
    }
    if ('flow' in template) {
      created.flow = hasPatient
        ? typeof template.flow === 'string'
          ? '40 ml/h'
          : 40
        : typeof template.flow === 'string'
        ? '—'
        : null;
    }

    onAddDevice?.(created as Device);

    setNewBed('');
    setNewPatient('');
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Cabeçalho da Página */}
      <View style={styles.pageHeader}>
        <Text style={styles.dateText}>Quinta-Feira, 12 De Novembro</Text>
        <Text style={styles.pageTitle}>Dispositivos</Text>
        <Text style={styles.pageSubtitle}>
          Gerencie e monitore todos os equipamentos VOLUM.
        </Text>
      </View>

      {/* Card Principal da Tabela */}
      <View style={styles.card}>
        {/* Topo do Card */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Todos os dispositivos</Text>
            <Text style={styles.cardSubtitle}>
              {devices.length} cadastrados • {onlineCount} conectados agora
            </Text>
          </View>

          <Pressable
            onPress={openModal}
            style={({ pressed }) => [
              styles.addButton,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="plus" size={16} color={colors.white} />
            <Text style={styles.addButtonText}>Novo dispositivo</Text>
          </Pressable>
        </View>

        {/* Cabeçalho das Colunas (mesmas proporções COLS da Visão Geral) */}
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: COLS.device }]}>
            Dispositivo / Paciente
          </Text>
          <Text style={[styles.th, { flex: COLS.level }]}>Nível da bolsa</Text>
          <Text style={[styles.th, { flex: COLS.flow }]}>Fluxo</Text>
          <Text style={[styles.th, { flex: COLS.status }]}>Status</Text>
          <View style={styles.actionSpacer} />
        </View>

        {/* Linhas renderizadas com o mesmo componente DeviceListItem */}
        {filteredDevices.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum dispositivo encontrado.</Text>
        ) : (
          filteredDevices.map((device) => (
            <Pressable
              key={device.id}
              onPress={() => onSelectDevice?.(device)}
              style={({ hovered }: any) => [
                styles.rowWrapper,
                hovered && styles.rowHover,
              ]}
            >
              <View style={{ flex: 1 }}>
                <DeviceListItem device={device} />
              </View>
              <View style={styles.actionCell}>
                <Feather
                  name="more-horizontal"
                  size={18}
                  color={colors.muted}
                />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Modal: + Novo dispositivo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadow]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar novo dispositivo</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>
              Identificador do Módulo (Arduino)
            </Text>
            <TextInput
              style={styles.input}
              value={newCode}
              onChangeText={setNewCode}
              placeholder="Ex: VOLUM-009"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Leito / Setor</Text>
            <TextInput
              style={styles.input}
              value={newBed}
              onChangeText={setNewBed}
              placeholder="Ex: Leito 04"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Paciente (opcional)</Text>
            <TextInput
              style={styles.input}
              value={newPatient}
              onChangeText={setNewPatient}
              placeholder="Nome do paciente"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Bolsa / Medicação inicial</Text>
            <TextInput
              style={styles.input}
              value={newSolution}
              onChangeText={setNewSolution}
              placeholder="Ex: Soro fisiológico 500 ml"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleAddDevice} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Salvar dispositivo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 24,
  },
  pageHeader: {
    gap: 4,
  },
  dateText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  pageTitle: {
    fontFamily: typography.heading,
    fontSize: 30,
    fontWeight: '800',
    color: colors.navy,
  },
  pageSubtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    ...shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  cardSubtitle: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addButtonText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionSpacer: {
    width: 36,
  },
  emptyText: {
    fontFamily: typography.body,
    textAlign: 'center',
    color: colors.muted,
    paddingVertical: 32,
  },
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  rowHover: {
    backgroundColor: colors.primarySoft,
  },
  actionCell: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 37, 69, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  inputLabel: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  cancelBtnText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  confirmBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});