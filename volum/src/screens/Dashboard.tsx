import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KpiCard from '../components/KpiCard';
import DeviceListItem, { COLS } from '../components/DeviceListItem';
import AlertCardItem from '../components/AlertCardItem';
import DevicesScreen, { Device } from './DevicesScreen';
import BagsScreen, { BagSlot, buildInitialBags } from './BagsScreen';
import {
  kpis,
  devices as initialDevices,
  alerts as initialAlerts,
} from '../mock/data';
import { colors, shadow, typography } from '../theme';

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
  const [deviceList, setDeviceList] = useState<Device[]>(initialDevices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    initialDevices[0]?.id ?? 'VOLUM-001'
  );

  // Detecta automaticamente os nomes exatos de status usados no mock/data.ts
  const { healthyStatus, warningStatus } = useMemo(() => {
    const normalDev: any = initialDevices.find((d: any) => {
      const s = String(d.status ?? '').toLowerCase();
      const lvl = parseFloat(String(d.level ?? 100));
      return s !== 'offline' && (!Number.isFinite(lvl) || lvl > 25);
    });
    const warnDev: any = initialDevices.find((d: any) => {
      const s = String(d.status ?? '').toLowerCase();
      const lvl = parseFloat(String(d.level ?? 100));
      return s !== 'offline' && Number.isFinite(lvl) && lvl <= 25;
    });

    const healthy = normalDev?.status ?? initialDevices[0]?.status;
    const warning = warnDev?.status ?? healthy;
    return { healthyStatus: healthy, warningStatus: warning };
  }, []);

  const [bagsByDevice, setBagsByDevice] = useState<Record<string, BagSlot[]>>(
    () => {
      const map: Record<string, BagSlot[]> = {};
      initialDevices.forEach((dev) => {
        map[dev.id] = buildInitialBags(dev);
      });
      return map;
    }
  );
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [alertThreshold, setAlertThreshold] = useState<number>(15);

  const handleUpdateBags = (
    deviceId: string,
    updater: (prev: BagSlot[]) => BagSlot[]
  ) => {
    setBagsByDevice((prev) => {
      const targetDevice =
        deviceList.find((d) => d.id === deviceId) || initialDevices[0];
      const current = prev[deviceId] || buildInitialBags(targetDevice);
      const updated = updater(current);

      const recoveredIds = updated
        .filter((b) => b.status !== 'low' && b.status !== 'empty')
        .map((b) => `bag-alert-${deviceId}-${b.id}`);

      if (recoveredIds.length > 0) {
        setDismissed((dPrev) =>
          dPrev.filter((id) => !recoveredIds.includes(id))
        );
      }

      return { ...prev, [deviceId]: updated };
    });
  };

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setBagsByDevice((prev) => {
        const nextMap: Record<string, BagSlot[]> = {};
        for (const devId of Object.keys(prev)) {
          nextMap[devId] = prev[devId].map((bag) => {
            if (bag.status !== 'active' && bag.status !== 'low') return bag;
            if (bag.remainingSeconds <= 1) {
              return { ...bag, remainingSeconds: 0, level: 0, status: 'empty' };
            }
            const nextSec = bag.remainingSeconds - 1;
            const totalSec = Math.max(1, bag.durationMinutes * 60);
            const nextLevel = Math.max(1, Math.round((nextSec / totalSec) * 100));
            const nextStatus = nextLevel <= alertThreshold ? 'low' : 'active';

            return {
              ...bag,
              remainingSeconds: nextSec,
              level: nextLevel,
              status: nextStatus,
            };
          });
        }
        return nextMap;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, alertThreshold]);

  // Sincroniza barras, fluxo e status usando os mesmos padrões de tipo do mock/data.ts
  const syncedDevices: Device[] = useMemo(() => {
    return deviceList.map((dev: any) => {
      const rawStatus = String(dev.status ?? '').toLowerCase();
      if (rawStatus === 'offline') return dev;

      const devBags = bagsByDevice[dev.id];
      if (!devBags || devBags.length === 0) return dev;

      const activeBag =
        devBags.find((b) => b.status === 'active' || b.status === 'low') ||
        devBags.find((b) => b.isMain) ||
        devBags[0];

      const hasCriticalOrLow = devBags.some(
        (b) => b.status === 'low' || b.status === 'empty'
      );

      const flowVal = Math.round(
        activeBag.volumeMl / Math.max(0.05, activeBag.durationMinutes / 60)
      );

      const updated: any = {
        ...dev,
        status: hasCriticalOrLow
          ? warningStatus ?? dev.status
          : healthyStatus ?? dev.status,
      };

      if ('level' in dev) {
        updated.level =
          typeof dev.level === 'string'
            ? `${activeBag.level}%`
            : activeBag.level;
      }
      if ('bagLevel' in dev) {
        updated.bagLevel =
          typeof dev.bagLevel === 'string'
            ? `${activeBag.level}%`
            : activeBag.level;
      }
      if ('solution' in dev) updated.solution = activeBag.substance;
      if ('bag' in dev) updated.bag = activeBag.substance;
      if ('fluid' in dev) updated.fluid = activeBag.substance;
      if ('flow' in dev) {
        updated.flow =
          typeof dev.flow === 'number' ? flowVal : `${flowVal} ml/h`;
      }
      if ('flowRate' in dev) updated.flowRate = flowVal;

      return updated as Device;
    });
  }, [deviceList, bagsByDevice, healthyStatus, warningStatus]);

  // Gera alertas automáticos com todos os campos esperados pelo AlertCardItem
  const liveBagAlerts = useMemo(() => {
    const template: any = initialAlerts[0] || {};
    const generated: any[] = [];

    syncedDevices.forEach((dev: any) => {
      if (String(dev.status ?? '').toLowerCase() === 'offline') return;
      const devBags = bagsByDevice[dev.id] || [];

      devBags.forEach((bag) => {
        if (bag.status === 'low' || bag.status === 'empty') {
          const isEmpty = bag.status === 'empty';
          const title = isEmpty
            ? 'Bolsa finalizada (0%)'
            : `Nível de bolsa baixo (${bag.level}%)`;
          const msg = `${dev.patient} (${dev.bed}) • ${bag.slotLabel}: ${bag.substance}`;

          generated.push({
            ...template,
            id: `bag-alert-${dev.id}-${bag.id}`,
            title,
            message: msg,
            description: msg,
            subtitle: msg,
            detail: msg,
            device: dev.id,
            deviceId: dev.id,
            patient: dev.patient,
            bed: dev.bed,
            time: 'Agora mesmo',
            severity: isEmpty ? 'critical' : 'warning',
            tone: isEmpty ? 'danger' : 'warning',
          });
        }
      });
    });

    return generated;
  }, [syncedDevices, bagsByDevice]);

  const activeAlerts = useMemo(() => {
    const bagDeviceIds = new Set(liveBagAlerts.map((a) => a.device));
    const filteredInitial = initialAlerts.filter(
      (a: any) => !bagDeviceIds.has(a.device ?? a.deviceId)
    );
    return [...liveBagAlerts, ...filteredInitial].filter(
      (a) => !dismissed.includes(a.id)
    );
  }, [liveBagAlerts, dismissed]);

  const criticalCount = activeAlerts.filter(
    (a) => a.severity === 'critical'
  ).length;

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return syncedDevices;
    return syncedDevices.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.patient.toLowerCase().includes(q) ||
        d.bed.toLowerCase().includes(q)
    );
  }, [search, syncedDevices]);

  const handleAddDevice = (newDevice: Device) => {
    setDeviceList((prev) => [newDevice, ...prev]);
    setBagsByDevice((prev) => ({
      ...prev,
      [newDevice.id]: buildInitialBags(newDevice),
    }));
  };

  const totalActiveBags = useMemo(() => {
    let count = 0;
    syncedDevices.forEach((dev: any) => {
      if (String(dev.status ?? '').toLowerCase() === 'offline') return;
      const list = bagsByDevice[dev.id] || [];
      count += list.filter((b) => b.level > 0).length;
    });
    return count;
  }, [syncedDevices, bagsByDevice]);

  const kpiList = kpis.map((k) => {
    if (k.id === 'alerts') {
      return {
        ...k,
        value: String(activeAlerts.length).padStart(2, '0'),
        hint:
          criticalCount > 0
            ? `${criticalCount} requer atenção`
            : 'Nenhum crítico',
      };
    }
    if (k.id === 'devices') {
      const added = deviceList.length - initialDevices.length;
      const currentNum = Number(k.value);
      return {
        ...k,
        value: !Number.isNaN(currentNum)
          ? String(currentNum + added).padStart(2, '0')
          : k.value,
      };
    }
    if (k.id === 'bags') {
      return {
        ...k,
        value: String(totalActiveBags).padStart(2, '0'),
      };
    }
    return k;
  });

  const dismiss = (id: string) => setDismissed((prev) => [...prev, id]);

  const openDeviceBags = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setMenu('bags');
  };

  return (
    <View style={styles.root}>
      <Sidebar active={menu} onSelect={setMenu} alertCount={activeAlerts.length} />

      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        <Header search={search} onChangeSearch={setSearch} />

        {menu === 'devices' ? (
          <DevicesScreen
            devices={syncedDevices}
            onAddDevice={handleAddDevice}
            searchQuery={search}
            onSelectDevice={(device) => openDeviceBags(device.id)}
          />
        ) : menu === 'bags' ? (
          <BagsScreen
            devices={syncedDevices}
            selectedDeviceId={selectedDeviceId}
            onSelectDeviceId={setSelectedDeviceId}
            bagsByDevice={bagsByDevice}
            onUpdateBags={handleUpdateBags}
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning((r) => !r)}
            alertThreshold={alertThreshold}
            onChangeAlertThreshold={setAlertThreshold}
          />
        ) : (
          <>
            <Text style={styles.date}>{formatToday()}</Text>
            <Text style={styles.title}>Visão geral</Text>
            <Text style={styles.subtitle}>
              Acompanhe a operação dos seus dispositivos em tempo real.
            </Text>

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
              <View
                style={[styles.panel, isWide ? { flex: 2 } : { width: '100%' }]}
              >
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Dispositivos em operação</Text>
                  <Text style={styles.panelSub}>
                    {filteredDevices.length} exibidos
                  </Text>
                </View>

                <View style={styles.tableHead}>
                  <Text style={[styles.th, { flex: COLS.device }]}>
                    Dispositivo / Paciente
                  </Text>
                  <Text style={[styles.th, { flex: COLS.level }]}>
                    Nível da bolsa
                  </Text>
                  <Text style={[styles.th, { flex: COLS.flow }]}>Fluxo</Text>
                  <Text style={[styles.th, { flex: COLS.status }]}>Status</Text>
                </View>

                {filteredDevices.length === 0 ? (
                  <Text style={styles.empty}>Nenhum dispositivo encontrado.</Text>
                ) : (
                  filteredDevices.map((d) => (
                    <Pressable key={d.id} onPress={() => openDeviceBags(d.id)}>
                      <DeviceListItem device={d} />
                    </Pressable>
                  ))
                )}
              </View>

              <View
                style={[styles.panel, isWide ? { flex: 1 } : { width: '100%' }]}
              >
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Alertas recentes</Text>
                  <Text style={styles.panelSub}>{activeAlerts.length} ativos</Text>
                </View>

                {activeAlerts.length === 0 ? (
                  <View style={styles.emptyAlerts}>
                    <Feather
                      name="check-circle"
                      size={28}
                      color={colors.primary}
                    />
                    <Text style={styles.emptyAlertsText}>
                      Nenhum alerta pendente
                    </Text>
                  </View>
                ) : (
                  activeAlerts.map((a) => (
                    <AlertCardItem key={a.id} alert={a} onDismiss={dismiss} />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  main: { flex: 1, backgroundColor: colors.bg },
  mainContent: { padding: 32, paddingBottom: 48 },
  date: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
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

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },

  grid: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  panel: { backgroundColor: colors.card, borderRadius: 12, padding: 20, ...shadow },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    color: colors.muted,
    fontWeight: '600',
  },

  tableHead: {
    flexDirection: 'row',
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
  empty: { textAlign: 'center', color: colors.muted, paddingVertical: 32 },

  emptyAlerts: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyAlertsText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
});