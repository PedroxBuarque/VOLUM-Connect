import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { devices as mockDevices } from '../mock/data';
import { colors, typography, shadow } from '../theme';

export type Device = (typeof mockDevices)[number];

export interface BagSlot {
  id: string;
  slotLabel: string;
  isMain: boolean;
  substance: string;
  volumeMl: number;
  level: number;
  durationMinutes: number;
  remainingSeconds: number;
  status: 'active' | 'queued' | 'low' | 'empty';
}

export function buildInitialBags(device: any): BagSlot[] {
  const parsedLevel = parseFloat(String(device?.level ?? device?.bagLevel ?? 78));
  const mainLevel = Number.isFinite(parsedLevel)
    ? Math.max(0, Math.min(100, Math.round(parsedLevel)))
    : 78;
  const mainSolution =
    device?.solution ?? device?.bag ?? device?.fluid ?? 'Soro fisiológico 500 ml';
  const isOffline = String(device?.status ?? '').toLowerCase() === 'offline';
  const mainDuration = 120;

  return [
    {
      id: 'main',
      slotLabel: 'Bolsa Principal (Reservatório)',
      isMain: true,
      substance: String(mainSolution),
      volumeMl: 1000,
      level: isOffline ? 0 : mainLevel,
      durationMinutes: mainDuration,
      remainingSeconds: isOffline
        ? 0
        : Math.round((mainLevel / 100) * mainDuration * 60),
      status:
        isOffline || mainLevel === 0
          ? 'empty'
          : mainLevel <= 20
          ? 'low'
          : 'active',
    },
    {
      id: 'sub-1',
      slotLabel: 'Bolsa Menor 01',
      isMain: false,
      substance: 'Dipirona Sódica 100 ml',
      volumeMl: 100,
      level: 100,
      durationMinutes: 45,
      remainingSeconds: 45 * 60,
      status: 'queued',
    },
    {
      id: 'sub-2',
      slotLabel: 'Bolsa Menor 02',
      isMain: false,
      substance: 'Cloreto de Potássio 250 ml',
      volumeMl: 250,
      level: 65,
      durationMinutes: 60,
      remainingSeconds: 39 * 60,
      status: 'queued',
    },
  ];
}

type Props = {
  devices?: Device[];
  selectedDeviceId?: string;
  onSelectDeviceId?: (id: string) => void;
  bagsByDevice: Record<string, BagSlot[]>;
  onUpdateBags: (deviceId: string, updater: (prev: BagSlot[]) => BagSlot[]) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  alertThreshold: number;
  onChangeAlertThreshold: (next: number) => void;
};

function formatSeconds(totalSec: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSec) ? totalSec : 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function BagsScreen({
  devices = mockDevices,
  selectedDeviceId,
  onSelectDeviceId,
  bagsByDevice,
  onUpdateBags,
  isRunning,
  onToggleRunning,
  alertThreshold,
  onChangeAlertThreshold,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;

  const [internalDeviceId, setInternalDeviceId] = useState(
    selectedDeviceId || devices[0]?.id || 'VOLUM-001'
  );
  const activeId = selectedDeviceId ?? internalDeviceId;

  const currentDevice = useMemo(
    () => devices.find((d) => d.id === activeId) || devices[0],
    [devices, activeId]
  );

  const [selectedBagId, setSelectedBagId] = useState<string>('main');
  const [hoursInput, setHoursInput] = useState<string>('2');
  const [minutesInput, setMinutesInput] = useState<string>('00');
  const [justApplied, setJustApplied] = useState<boolean>(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSubstance, setNewSubstance] = useState('');
  const [newVolume, setNewVolume] = useState('250');
  const [newDuration, setNewDuration] = useState('60');

  const bags: BagSlot[] = useMemo(() => {
    if (!currentDevice) return [];
    return bagsByDevice[currentDevice.id] || buildInitialBags(currentDevice);
  }, [bagsByDevice, currentDevice]);

  const mainBag = bags.find((b) => b.isMain) || bags[0];
  const minorBags = bags.filter((b) => !b.isMain);
  const selectedBag = bags.find((b) => b.id === selectedBagId) || mainBag;

  const updateCurrentBags = (updater: (prev: BagSlot[]) => BagSlot[]) => {
    if (!currentDevice) return;
    onUpdateBags(currentDevice.id, updater);
  };

  useEffect(() => {
    if (!selectedBag) return;
    const h = Math.floor(selectedBag.durationMinutes / 60);
    const m = selectedBag.durationMinutes % 60;
    setHoursInput(String(h));
    setMinutesInput(String(m).padStart(2, '0'));
    setJustApplied(false);
  }, [selectedBag?.id, selectedBag?.durationMinutes]);

  const bagAlerts = bags.filter(
    (b) => b.status === 'low' || b.status === 'empty'
  );

  const handleSelectDevice = (id: string) => {
    setInternalDeviceId(id);
    onSelectDeviceId?.(id);
    setSelectedBagId('main');
  };

  const draftMinutes = useMemo(() => {
    const h = Math.max(0, parseInt(hoursInput || '0', 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(minutesInput || '0', 10) || 0));
    return Math.max(1, h * 60 + m);
  }, [hoursInput, minutesInput]);

  const hasPendingTime = Boolean(
    selectedBag && draftMinutes !== selectedBag.durationMinutes
  );

  const handleApplyTimer = () => {
    if (!selectedBag) return;
    const safeMinutes = draftMinutes;

    updateCurrentBags((list) =>
      list.map((b) => {
        if (b.id !== selectedBag.id) return b;
        const restoredLevel = b.level === 0 ? 100 : b.level;
        const nextStatus =
          b.status === 'empty'
            ? b.isMain
              ? 'active'
              : 'queued'
            : restoredLevel <= alertThreshold &&
              (b.status === 'active' || b.status === 'low')
            ? 'low'
            : b.status === 'low' && restoredLevel > alertThreshold
            ? 'active'
            : b.status;

        return {
          ...b,
          level: restoredLevel,
          durationMinutes: safeMinutes,
          remainingSeconds: safeMinutes * 60,
          status: nextStatus,
        };
      })
    );

    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleSetBagActive = (bagId: string) => {
    updateCurrentBags((list) =>
      list.map((b) => {
        if (b.id === bagId) {
          return {
            ...b,
            status: b.level <= alertThreshold ? 'low' : 'active',
          };
        }
        if (b.status === 'active') {
          return { ...b, status: 'queued' };
        }
        return b;
      })
    );
    setSelectedBagId(bagId);
    if (!isRunning) onToggleRunning();
  };

  const handleRefillBag = (bagId: string) => {
    updateCurrentBags((list) =>
      list.map((b) =>
        b.id === bagId
          ? {
              ...b,
              level: 100,
              remainingSeconds: b.durationMinutes * 60,
              status: b.isMain ? 'active' : 'queued',
            }
          : b
      )
    );
  };

  const handleAddMinorBag = () => {
    if (minorBags.length >= 5 || !newSubstance.trim()) return;
    const nextIndex = minorBags.length + 1;
    const dur = Math.max(1, parseInt(newDuration || '60', 10) || 60);
    const vol = Math.max(10, parseInt(newVolume || '250', 10) || 250);

    const created: BagSlot = {
      id: `sub-${Date.now()}`,
      slotLabel: `Bolsa Menor ${String(nextIndex).padStart(2, '0')}`,
      isMain: false,
      substance: newSubstance.trim(),
      volumeMl: vol,
      level: 100,
      durationMinutes: dur,
      remainingSeconds: dur * 60,
      status: 'queued',
    };

    updateCurrentBags((list) => [...list, created]);
    setSelectedBagId(created.id);
    setNewSubstance('');
    setAddModalVisible(false);
  };

  const handleDeleteMinorBag = (bagId: string) => {
    updateCurrentBags((list) => {
      const remaining = list.filter((b) => b.id !== bagId);
      let minorCounter = 0;
      return remaining.map((b) => {
        if (b.isMain) return b;
        minorCounter += 1;
        return {
          ...b,
          slotLabel: `Bolsa Menor ${String(minorCounter).padStart(2, '0')}`,
        };
      });
    });

    if (selectedBagId === bagId) {
      setSelectedBagId('main');
    }
  };

  const getStatusMeta = (status: BagSlot['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Em descida',
          bg: colors.primarySoft || '#E0F2FE',
          color: colors.primary || '#0284C7',
          bar: colors.primary || '#0284C7',
        };
      case 'low':
        return {
          label: 'Acabando',
          bg: colors.warningSoft || '#FEF3C7',
          color: colors.warning || '#D97706',
          bar: colors.warning || '#D97706',
        };
      case 'empty':
        return {
          label: 'Finalizada',
          bg: colors.dangerSoft || '#FEE2E2',
          color: colors.danger || '#DC2626',
          bar: colors.danger || '#DC2626',
        };
      case 'queued':
      default:
        return {
          label: 'Em espera',
          bg: '#F1F5F9',
          color: colors.muted || '#64748B',
          bar: (colors as any).dustyBlue || '#94A3B8',
        };
    }
  };

  const calculatedFlow = selectedBag
    ? Math.round(selectedBag.volumeMl / Math.max(0.05, draftMinutes / 60))
    : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.pageHeader}>
        <Text style={styles.dateText}>Controle de Infusão • Arduino VOLUM</Text>
        <Text style={styles.pageTitle}>Bolsas e Tempo de Descida</Text>
        <Text style={styles.pageSubtitle}>
          Gerencie a bolsa principal, até 5 bolsas menores e o tempo programado de gotejamento.
        </Text>
      </View>

      <View style={styles.deviceSelectorBar}>
        {devices.map((dev) => {
          const selected = dev.id === activeId;
          return (
            <Pressable
              key={dev.id}
              onPress={() => handleSelectDevice(dev.id)}
              style={[
                styles.deviceChip,
                selected && styles.deviceChipActive,
              ]}
            >
              <Text
                style={[
                  styles.deviceChipCode,
                  selected && styles.deviceChipTextActive,
                ]}
              >
                {dev.id}
              </Text>
              <Text
                style={[
                  styles.deviceChipPatient,
                  selected && styles.deviceChipTextActive,
                ]}
              >
                {dev.bed} • {dev.patient}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {bagAlerts.length > 0 && (
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerLeft}>
            <View style={styles.alertIconCircle}>
              <Feather name="bell" size={18} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertBannerTitle}>
                Atenção médica necessária ({bagAlerts.length}{' '}
                {bagAlerts.length === 1 ? 'bolsa' : 'bolsas'})
              </Text>
              <Text style={styles.alertBannerDesc}>
                {bagAlerts
                  .map(
                    (b) =>
                      `${b.slotLabel} (${b.substance}) — ${
                        b.status === 'empty' ? 'ACABOU (0%)' : `acabando (${b.level}%)`
                      }`
                  )
                  .join('  •  ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.grid, !isWide && { flexDirection: 'column' }]}>
        <View style={[styles.panel, isWide ? { flex: 1.7 } : { width: '100%' }]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>
                Suporte {currentDevice?.id} — {currentDevice?.patient}
              </Text>
              <Text style={styles.panelSub}>
                1 bolsa principal + {minorBags.length} de 5 bolsas menores conectadas
              </Text>
            </View>

            {minorBags.length < 5 && (
              <Pressable
                onPress={() => setAddModalVisible(true)}
                style={styles.addMinorBtn}
              >
                <Feather name="plus" size={15} color={colors.white} />
                <Text style={styles.addMinorBtnText}>Adicionar bolsa menor</Text>
              </Pressable>
            )}
          </View>

          {mainBag && (
            <Pressable
              onPress={() => setSelectedBagId(mainBag.id)}
              style={[
                styles.mainBagCard,
                selectedBag?.id === mainBag.id && styles.bagCardSelected,
              ]}
            >
              <View style={styles.bagTopRow}>
                <View style={styles.bagTitleGroup}>
                  <View style={styles.mainBagIcon}>
                    <Feather name="droplet" size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.mainBagLabel}>{mainBag.slotLabel}</Text>
                    <Text style={styles.mainBagSubstance}>
                      {mainBag.substance} ({mainBag.volumeMl} ml)
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getStatusMeta(mainBag.status).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: getStatusMeta(mainBag.status).color },
                    ]}
                  >
                    {getStatusMeta(mainBag.status).label}
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${mainBag.level}%`,
                        backgroundColor: getStatusMeta(mainBag.status).bar,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.percentText}>{mainBag.level}%</Text>
              </View>

              <View style={styles.bagFooterRow}>
                <Text style={styles.timerHint}>
                  Tempo restante: {formatSeconds(mainBag.remainingSeconds)}
                </Text>
                <Pressable
                  onPress={() => handleRefillBag(mainBag.id)}
                  style={styles.refillLink}
                >
                  <Feather name="refresh-cw" size={13} color={colors.primary} />
                  <Text style={styles.refillLinkText}>Repor bolsa (100%)</Text>
                </Pressable>
              </View>
            </Pressable>
          )}

          <Text style={styles.minorSectionTitle}>
            Bolsas Menores ({minorBags.length}/5)
          </Text>

          {minorBags.length === 0 ? (
            <Text style={styles.emptyMinorText}>
              Nenhuma bolsa menor conectada. Clique em "Adicionar bolsa menor" acima.
            </Text>
          ) : (
            <View style={styles.minorGrid}>
              {minorBags.map((bag) => {
                const meta = getStatusMeta(bag.status);
                const isSelected = selectedBag?.id === bag.id;

                return (
                  <Pressable
                    key={bag.id}
                    onPress={() => setSelectedBagId(bag.id)}
                    style={[
                      styles.minorCard,
                      isSelected && styles.bagCardSelected,
                    ]}
                  >
                    <View style={styles.minorCardHeader}>
                      <Text style={styles.minorSlot}>{bag.slotLabel}</Text>
                      <View style={styles.minorHeaderRight}>
                        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.badgeText, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleDeleteMinorBag(bag.id);
                          }}
                          style={styles.deleteBtn}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={14} color={colors.danger} />
                        </Pressable>
                      </View>
                    </View>

                    <Text style={styles.minorSubstance} numberOfLines={1}>
                      {bag.substance} • {bag.volumeMl} ml
                    </Text>

                    <View style={styles.progressRow}>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            { width: `${bag.level}%`, backgroundColor: meta.bar },
                          ]}
                        />
                      </View>
                      <Text style={styles.percentText}>{bag.level}%</Text>
                    </View>

                    <View style={styles.minorActions}>
                      <Text style={styles.minorTimer}>
                        {formatSeconds(bag.remainingSeconds)}
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {bag.status !== 'active' && bag.level > 0 && (
                          <Pressable
                            onPress={() => handleSetBagActive(bag.id)}
                            style={styles.smallActionBtn}
                          >
                            <Text style={styles.smallActionText}>Liberar</Text>
                          </Pressable>
                        )}
                        {(bag.status === 'empty' || bag.status === 'low') && (
                          <Pressable
                            onPress={() => handleRefillBag(bag.id)}
                            style={[
                              styles.smallActionBtn,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.smallActionText,
                                { color: colors.white },
                              ]}
                            >
                              Repor
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.panel, isWide ? { flex: 1 } : { width: '100%' }]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Tempo de Descida</Text>
              <Text style={styles.panelSub}>
                Configurando: {selectedBag?.slotLabel}
              </Text>
            </View>
            <Feather name="clock" size={20} color={colors.primary} />
          </View>

          <View style={styles.clockBox}>
            <Text style={styles.clockCaption}>TEMPO RESTANTE PROGRAMADO</Text>
            <Text style={styles.clockDigits}>
              {formatSeconds(selectedBag?.remainingSeconds ?? 0)}
            </Text>
            <Text style={styles.clockFlow}>
              Vazão calculada: {calculatedFlow} ml/h
            </Text>
          </View>

          <Text style={styles.controlLabel}>Duração rápida da descida</Text>
          <View style={styles.presetRow}>
            {[
              { label: '30 min', h: '0', m: '30', total: 30 },
              { label: '1 hora', h: '1', m: '00', total: 60 },
              { label: '2 horas', h: '2', m: '00', total: 120 },
              { label: '4 horas', h: '4', m: '00', total: 240 },
            ].map((p) => {
              const isPresetSelected = draftMinutes === p.total;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => {
                    setHoursInput(p.h);
                    setMinutesInput(p.m);
                    setJustApplied(false);
                  }}
                  style={[
                    styles.presetBtn,
                    isPresetSelected && styles.presetBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      isPresetSelected && styles.presetBtnTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.controlLabel}>
            Tempo personalizado (Horas : Minutos)
          </Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeField}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={hoursInput}
                onChangeText={(val) => {
                  setHoursInput(val);
                  setJustApplied(false);
                }}
                maxLength={2}
              />
              <Text style={styles.timeUnit}>horas</Text>
            </View>
            <Text style={styles.timeColon}>:</Text>
            <View style={styles.timeField}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                value={minutesInput}
                onChangeText={(val) => {
                  setMinutesInput(val);
                  setJustApplied(false);
                }}
                maxLength={2}
              />
              <Text style={styles.timeUnit}>min</Text>
            </View>

            <Pressable
              onPress={handleApplyTimer}
              style={[
                styles.applyTimeBtn,
                hasPendingTime && styles.applyTimeBtnPending,
              ]}
            >
              <Text
                style={[
                  styles.applyTimeBtnText,
                  hasPendingTime && styles.applyTimeBtnTextPending,
                ]}
              >
                {justApplied ? 'Aplicado ✓' : 'Aplicar'}
              </Text>
            </Pressable>
          </View>

          {hasPendingTime && (
            <Text style={styles.pendingHint}>
              Clique em "Aplicar" para confirmar o novo tempo no cronômetro.
            </Text>
          )}

          <View style={styles.thresholdBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.thresholdTitle}>Aviso automático ao médico</Text>
              <Text style={styles.thresholdDesc}>
                Dispara alerta sonoro e visual ao atingir {alertThreshold}% da bolsa.
              </Text>
            </View>
            <View style={styles.thresholdControls}>
              <Pressable
                onPress={() => onChangeAlertThreshold(Math.max(5, alertThreshold - 5))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </Pressable>
              <Text style={styles.thresholdValue}>{alertThreshold}%</Text>
              <Pressable
                onPress={() => onChangeAlertThreshold(Math.min(40, alertThreshold + 5))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={onToggleRunning}
            style={[
              styles.commandBtn,
              !isRunning && { backgroundColor: colors.navy },
            ]}
          >
            <Feather
              name={isRunning ? 'pause-circle' : 'play-circle'}
              size={18}
              color={colors.white}
            />
            <Text style={styles.commandBtnText}>
              {isRunning
                ? 'Pausar gotejamento no Arduino'
                : 'Iniciar / Retomar descida'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadow]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conectar bolsa menor</Text>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Feather name="x" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Medicação / Fluido</Text>
            <TextInput
              style={styles.input}
              value={newSubstance}
              onChangeText={setNewSubstance}
              placeholder="Ex: Ondansetrona 100 ml"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Volume da bolsa (ml)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newVolume}
              onChangeText={setNewVolume}
              placeholder="Ex: 250"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Tempo de descida (minutos)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newDuration}
              onChangeText={setNewDuration}
              placeholder="Ex: 60"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleAddMinorBag} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Adicionar bolsa</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, gap: 20 },
  pageHeader: { gap: 4 },
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
  deviceSelectorBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deviceChip: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  deviceChipCode: {
    fontFamily: typography.heading,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  deviceChipPatient: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  deviceChipTextActive: {
    color: colors.white,
  },
  alertBanner: {
    backgroundColor: colors.dangerSoft || '#FEE2E2',
    borderWidth: 1,
    borderColor: colors.danger || '#DC2626',
    borderRadius: 12,
    padding: 14,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBannerTitle: {
    fontFamily: typography.heading,
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger || '#DC2626',
  },
  alertBannerDesc: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
    marginTop: 2,
  },
  grid: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
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
    marginBottom: 16,
  },
  panelTitle: {
    fontFamily: typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  panelSub: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 2,
  },
  addMinorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addMinorBtnText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  mainBagCard: {
    backgroundColor: colors.primarySoft || '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  bagCardSelected: {
    borderColor: colors.primary,
  },
  bagTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bagTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainBagIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBagLabel: {
    fontFamily: typography.heading,
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  mainBagSubstance: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  percentText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    width: 38,
    textAlign: 'right',
  },
  bagFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerHint: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
  },
  refillLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refillLinkText: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  minorSectionTitle: {
    fontFamily: typography.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 18,
    marginBottom: 10,
  },
  emptyMinorText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  minorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  minorCard: {
    width: '48.8%',
    minWidth: 230,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  minorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  minorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.dangerSoft || '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minorSlot: {
    fontFamily: typography.heading,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  minorSubstance: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  minorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  minorTimer: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.primarySoft || '#E0F2FE',
  },
  smallActionText: {
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  clockBox: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  clockCaption: {
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '700',
    color: (colors as any).dustyBlue || '#94A3B8',
    letterSpacing: 1.2,
  },
  clockDigits: {
    fontFamily: typography.heading,
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },
  clockFlow: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: (colors as any).onlineIndicator || '#34D399',
  },
  controlLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primarySoft || '#E0F2FE',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  presetBtnText: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  presetBtnTextSelected: {
    color: colors.navy,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  timeInput: {
    width: 32,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  timeUnit: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  timeColon: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  applyTimeBtn: {
    flex: 1,
    backgroundColor: colors.primarySoft || '#E0F2FE',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyTimeBtnPending: {
    backgroundColor: colors.primary,
  },
  applyTimeBtnText: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  applyTimeBtnTextPending: {
    color: colors.white,
  },
  pendingHint: {
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 14,
  },
  thresholdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft || '#E0F2FE',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  thresholdTitle: {
    fontFamily: typography.heading,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  thresholdDesc: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  thresholdValue: {
    fontFamily: typography.heading,
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    width: 36,
    textAlign: 'center',
  },
  commandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
  },
  commandBtnText: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
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
    maxWidth: 420,
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
    backgroundColor: colors.primarySoft || '#E0F2FE',
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