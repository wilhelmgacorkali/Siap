import React, { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DARK_THEME, LIGHT_THEME } from '../theme';
import TilokMap from '../components/TilokMap';
import FaceRecognitionModal from '../components/FaceRecognitionModal';
import {
  IconArrowLeft,
  IconClock,
  IconMapPin,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronDown,
  IconSliders,
  IconLayers,
} from '../components/Icons';

// Titik Tilok RSJ Tampan
const TILOK_LAT = 0.465791;
const TILOK_LONG = 101.381957;
const TILOK_RADIUS_DEFAULT = 200;

const DORDING_PATTERNS = [
  { id: 'pagi_siang', label: 'Pagi → Siang', desc: 'Dinas Reguler Pagi (07:00-14:00) dilanjut Shift Siang (14:00-21:00)' },
  { id: 'siang_malam', label: 'Siang → Malam', desc: 'Dinas Sore (14:00-21:00) dilanjut Jaga Malam (21:00-07:00)' },
  { id: 'malam_pagi', label: 'Malam → Pagi', desc: 'Jaga Malam dilanjut Sambung Pagi' },
];

export default function DordingScreen({
  user,
  currentTime,
  attendance = {},
  allAttendance = {},
  modalVisible,
  onOpenModal,
  onCloseModal,
  onSubmit,
  onResetAttendance,
  onNavigateToPdt,
  onBack,
  isDarkMode = true,
  theme: propTheme,
}) {
  const theme = propTheme || (isDarkMode ? DARK_THEME : LIGHT_THEME);

  // Realtime clock
  const [liveClock, setLiveClock] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setLiveClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const clockToDisplay = currentTime || liveClock;

  const now = new Date();
  const dayNameId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
  const monthNameId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ][now.getMonth()];
  const dateFormatted = `${dayNameId}, ${now.getDate()} ${monthNameId} ${now.getFullYear()}`;

  // Geolocation & Radius (Default di dalam RSJ: 59 meter)
  const [userDistance, setUserDistance] = useState(59);
  const [tilokRadius, setTilokRadius] = useState(TILOK_RADIUS_DEFAULT);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState('pagi_siang');
  const [showDeveloperPanel, setShowDeveloperPanel] = useState(false);

  const isWithinTilok = userDistance !== null && userDistance <= tilokRadius;

  // Data presensi reguler (Shift 1) dan dording (Shift 2)
  const regulerAttendance = allAttendance?.sekarang || {};
  const dordingAttendance = allAttendance?.dording || attendance || {};

  const step1_masukPagi = Boolean(regulerAttendance?.masuk);
  const step2_pulangPagi = Boolean(regulerAttendance?.pulang);
  const step3_masukDording = Boolean(dordingAttendance?.masuk);
  const step4_pulangDording = Boolean(dordingAttendance?.pulang);

  // Penentuan langkah aktif stepper (1, 2, 3, 4, atau 5/selesai)
  let activeStep = 1;
  if (!step1_masukPagi) activeStep = 1;
  else if (!step2_pulangPagi) activeStep = 2;
  else if (!step3_masukDording) activeStep = 3;
  else if (!step4_pulangDording) activeStep = 4;
  else activeStep = 5;

  const handleDordingButtonClick = () => {
    if (!isWithinTilok) {
      Alert.alert(
        'Di Luar Radius Tilok',
        `Posisi Anda berjarak ${Math.round(userDistance)} m dari RS Jiwa Tampan. Silakan gunakan menu PDT bila sedang bertugas dinas luar.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka PDT', onPress: () => onNavigateToPdt && onNavigateToPdt() },
        ]
      );
      return;
    }

    if (activeStep === 1) {
      Alert.alert(
        'Langkah 1: Presensi Reguler',
        'Sebelum dinas sambung, selesaikan terlebih dahulu absensi masuk shift reguler.',
        [
          { text: 'Absen Reguler Sekarang', onPress: () => onOpenModal && onOpenModal('masuk') },
        ]
      );
    } else if (activeStep === 2) {
      Alert.alert(
        'Langkah 2: Selesaikan Shift 1',
        'Lakukan absen pulang shift pertama sebelum memulai dinas sambung kedua.',
        [
          { text: 'Absen Pulang Shift 1', onPress: () => onOpenModal && onOpenModal('pulang') },
        ]
      );
    } else if (activeStep === 3) {
      if (onOpenModal) onOpenModal('masuk');
    } else if (activeStep === 4) {
      if (onOpenModal) onOpenModal('pulang');
    } else {
      Alert.alert('Dinas Selesai', 'Seluruh rangkaian penugasan dording hari ini telah tuntas.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgMain }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. HEADER SEDERHANA: JUDUL ORANYE & TOMBOL KEMBALI                */}
        {/* ================================================================= */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
          >
            <IconArrowLeft size={18} color={theme.textMain} />
            <Text style={[styles.backButtonText, { color: theme.textMain }]}>Beranda</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.screenTitle, { color: '#d97706' }]}>Presensi Dording</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textMuted }]}>
              Dinas Sambung (Shift 2)
            </Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. PROGRESS STEPPER 4 LANGKAH DI BAGIAN ATAS                      */}
        {/* ================================================================= */}
        <View style={[styles.stepperCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.stepperHeaderTitle, { color: theme.textMain }]}>
            Alur Penugasan Dinas Sambung
          </Text>

          <View style={styles.stepperRow}>
            {/* Step 1: Masuk Shift 1 */}
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepCircle,
                  step1_masukPagi
                    ? { backgroundColor: '#16a34a' }
                    : activeStep === 1
                    ? { backgroundColor: '#d97706', borderColor: '#f59e0b', borderWidth: 2 }
                    : { backgroundColor: theme.pillBg },
                ]}
              >
                <Text style={styles.stepNumText}>{step1_masukPagi ? '✓' : '1'}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: activeStep === 1 ? '#d97706' : theme.textMain }]}>
                Masuk Shift 1
              </Text>
              <Text style={[styles.stepTime, { color: theme.textMuted }]}>
                {regulerAttendance?.masuk || '07:00'}
              </Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: step1_masukPagi ? '#16a34a' : theme.borderSubtle }]} />

            {/* Step 2: Pulang Shift 1 */}
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepCircle,
                  step2_pulangPagi
                    ? { backgroundColor: '#16a34a' }
                    : activeStep === 2
                    ? { backgroundColor: '#d97706', borderColor: '#f59e0b', borderWidth: 2 }
                    : { backgroundColor: theme.pillBg },
                ]}
              >
                <Text style={styles.stepNumText}>{step2_pulangPagi ? '✓' : '2'}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: activeStep === 2 ? '#d97706' : theme.textMain }]}>
                Pulang Shift 1
              </Text>
              <Text style={[styles.stepTime, { color: theme.textMuted }]}>
                {regulerAttendance?.pulang || '14:00'}
              </Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: step2_pulangPagi ? '#16a34a' : theme.borderSubtle }]} />

            {/* Step 3: Masuk Dording (Shift 2) */}
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepCircle,
                  step3_masukDording
                    ? { backgroundColor: '#16a34a' }
                    : activeStep === 3
                    ? { backgroundColor: '#d97706', borderColor: '#f59e0b', borderWidth: 2 }
                    : { backgroundColor: theme.pillBg },
                ]}
              >
                <Text style={styles.stepNumText}>{step3_masukDording ? '✓' : '3'}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: activeStep === 3 ? '#d97706' : theme.textMain, fontWeight: activeStep === 3 ? '800' : '600' }]}>
                Masuk Dording
              </Text>
              <Text style={[styles.stepTime, { color: theme.textMuted }]}>
                {dordingAttendance?.masuk || '14:00'}
              </Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: step3_masukDording ? '#16a34a' : theme.borderSubtle }]} />

            {/* Step 4: Pulang Dording */}
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.stepCircle,
                  step4_pulangDording
                    ? { backgroundColor: '#16a34a' }
                    : activeStep === 4
                    ? { backgroundColor: '#d97706', borderColor: '#f59e0b', borderWidth: 2 }
                    : { backgroundColor: theme.pillBg },
                ]}
              >
                <Text style={styles.stepNumText}>{step4_pulangDording ? '✓' : '4'}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: activeStep === 4 ? '#d97706' : theme.textMain }]}>
                Pulang Sambung
              </Text>
              <Text style={[styles.stepTime, { color: theme.textMuted }]}>
                {dordingAttendance?.pulang || '21:00'}
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 3. SEGMENTED CONTROL POLA DORDING RINGKAS                         */}
        {/* ================================================================= */}
        <View style={[styles.patternCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.patternLabel, { color: theme.textSub }]}>Pola Rotasi Dording:</Text>
          <View style={styles.segmentedRow}>
            {DORDING_PATTERNS.map((p) => {
              const isSel = selectedPattern === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPattern(p.id)}
                  style={[
                    styles.segmentedBtn,
                    isSel
                      ? { backgroundColor: '#d97706' }
                      : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentedBtnText,
                      { color: isSel ? '#ffffff' : theme.textSub, fontWeight: isSel ? '800' : '600' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.patternDescText, { color: theme.textMuted }]}>
            {DORDING_PATTERNS.find((p) => p.id === selectedPattern)?.desc}
          </Text>
        </View>

        {/* ================================================================= */}
        {/* 4. KARTU STATUS UTAMA & SATU TOMBOL CERDAS ORANYE                 */}
        {/* ================================================================= */}
        <View style={[styles.statusHeroCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.shiftPill}>
              <Text style={styles.shiftPillText}>Dinas Sambung (Shift 2)</Text>
            </View>

            <View
              style={[
                styles.locationBadge,
                {
                  backgroundColor: isWithinTilok ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isWithinTilok ? '#16a34a' : '#ef4444',
                },
              ]}
            >
              <View style={[styles.locationDot, { backgroundColor: isWithinTilok ? '#16a34a' : '#ef4444' }]} />
              <Text style={[styles.locationBadgeText, { color: isWithinTilok ? '#16a34a' : '#ef4444' }]}>
                {isWithinTilok ? `Area RSJ · ${userDistance} m (Sah)` : `Luar Tilok · ${userDistance} m`}
              </Text>
            </View>
          </View>

          <View style={styles.clockCenterBox}>
            <Text style={[styles.bigClockText, { color: theme.textMain }]}>{clockToDisplay}</Text>
            <Text style={[styles.dateSubText, { color: theme.textSub }]}>{dateFormatted}</Text>
          </View>

          {/* SATU TOMBOL AKSI CERDAS KHUSUS DORDING */}
          <View style={{ marginTop: 14 }}>
            {activeStep <= 2 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDordingButtonClick}
                style={[styles.smartMainBtn, { backgroundColor: '#0284c7' }]}
              >
                <Text style={styles.smartMainBtnText}>
                  {activeStep === 1 ? 'Selesaikan Absen Masuk Shift 1 Dulu' : 'Selesaikan Absen Pulang Shift 1 Dulu'}
                </Text>
                <Text style={styles.smartMainBtnSub}>
                  Dinas sambung dimulai setelah shift pertama lengkap
                </Text>
              </TouchableOpacity>
            )}

            {activeStep === 3 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDordingButtonClick}
                style={[styles.smartMainBtn, { backgroundColor: isWithinTilok ? '#d97706' : '#94a3b8' }]}
              >
                <Text style={styles.smartMainBtnText}>Absen Masuk Dinas Sambung (Shift 2)</Text>
                <Text style={styles.smartMainBtnSub}>Mulai jam tugas shift sambung kedua</Text>
              </TouchableOpacity>
            )}

            {activeStep === 4 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDordingButtonClick}
                style={[styles.smartMainBtn, { backgroundColor: isWithinTilok ? '#059669' : '#94a3b8' }]}
              >
                <Text style={styles.smartMainBtnText}>Absen Pulang Dinas Sambung</Text>
                <Text style={styles.smartMainBtnSub}>Selesaikan seluruh tugas sambung hari ini</Text>
              </TouchableOpacity>
            )}

            {activeStep === 5 && (
              <View style={[styles.smartMainBtn, { backgroundColor: 'rgba(22, 163, 74, 0.12)', borderColor: '#16a34a', borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <IconCheckCircle size={22} color="#16a34a" />
                  <Text style={[styles.smartMainBtnText, { color: '#16a34a' }]}>
                    Dinas Sambung Tuntas
                  </Text>
                </View>
                <Text style={[styles.smartMainBtnSub, { color: '#047857' }]}>
                  Presensi Shift 1 & Shift 2 telah tervalidasi lengkap di SIMRS
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ================================================================= */}
        {/* 5. PETA KECIL COMPACT (~160px)                                    */}
        {/* ================================================================= */}
        <View style={[styles.mapContainerCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.mapHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconMapPin size={18} color="#d97706" />
              <Text style={[styles.mapTitle, { color: theme.textMain }]}>Area Geofence Dording RSJ Tampan</Text>
            </View>

            <TouchableOpacity
              onPress={() => setMapExpanded(!mapExpanded)}
              style={[styles.mapExpandBtn, { backgroundColor: theme.pillBg }]}
            >
              <Text style={[styles.mapExpandBtnText, { color: '#d97706' }]}>
                {mapExpanded ? 'Kecilkan' : 'Perbesar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.mapWrapper, { height: mapExpanded ? 320 : 160 }]}>
            <TilokMap
              latitude={TILOK_LAT}
              longitude={TILOK_LONG}
              radius={tilokRadius}
              userDistance={userDistance}
              isOutsideRadius={!isWithinTilok}
              height={mapExpanded ? 320 : 160}
              cleanMode={true}
            />
          </View>
        </View>

        {/* ================================================================= */}
        {/* 6. PANEL PENGUJIAN DEVELOPER (COLLAPSIBLE)                        */}
        {/* ================================================================= */}
        <View style={[styles.devPanelCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDeveloperPanel(!showDeveloperPanel)}
            style={styles.devPanelHeader}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconSliders size={16} color={theme.textMuted} />
              <Text style={[styles.devPanelTitle, { color: theme.textMuted }]}>
                Panel Pengujian / Developer (Simulasi Dording)
              </Text>
            </View>
            <IconChevronDown size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {showDeveloperPanel && (
            <View style={styles.devPanelContent}>
              <View style={styles.devBtnRow}>
                <TouchableOpacity
                  onPress={() => setUserDistance(59)}
                  style={[styles.devActionBtn, { backgroundColor: 'rgba(22, 163, 74, 0.12)', borderColor: '#16a34a' }]}
                >
                  <Text style={[styles.devActionText, { color: '#16a34a' }]}>Simulasi Dalam Tilok (59m)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUserDistance(1200)}
                  style={[styles.devActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }]}
                >
                  <Text style={[styles.devActionText, { color: '#ef4444' }]}>Simulasi Luar Tilok (1.2km)</Text>
                </TouchableOpacity>

                {onResetAttendance && (
                  <TouchableOpacity
                    onPress={onResetAttendance}
                    style={[styles.devActionBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                  >
                    <Text style={[styles.devActionText, { color: theme.textMain }]}>Reset Status Dording</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Face Recognition Modal Biometrik */}
        <FaceRecognitionModal
          visible={modalVisible}
          type={activeStep === 4 ? 'pulang' : 'masuk'}
          currentTime={clockToDisplay}
          isDording={true}
          onClose={onCloseModal}
          onSubmit={onSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },

  // Stepper
  stepperCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  stepperHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    width: 68,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  stepTime: {
    fontSize: 10,
    marginTop: 2,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -22,
  },

  // Segmented Pattern
  patternCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  patternLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentedBtnText: {
    fontSize: 12,
  },
  patternDescText: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },

  // Hero
  statusHeroCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftPillText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '800',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clockCenterBox: {
    alignItems: 'center',
    marginVertical: 18,
  },
  bigClockText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  dateSubText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  // Smart Button
  smartMainBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartMainBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  smartMainBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
    marginTop: 3,
    textAlign: 'center',
  },

  // Map
  mapContainerCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  mapExpandBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mapExpandBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  mapWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Dev Panel
  devPanelCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  devPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  devPanelTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  devPanelContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    gap: 8,
  },
  devBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  devActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  devActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
