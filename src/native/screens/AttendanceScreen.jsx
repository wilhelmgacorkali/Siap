import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
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
  IconShield,
  IconBriefcase,
} from '../components/Icons';

// Titik Pusat Koordinat Tilok Resmi RS Jiwa Tampan Pekanbaru
const TILOK_LAT = 0.465791;
const TILOK_LONG = 101.381957;
const TILOK_RADIUS_DEFAULT = 200; // Meter

export default function AttendanceScreen({
  user,
  currentTime,
  attendance = {},
  allAttendance = {},
  attendanceType = 'masuk',
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

  // Realtime clock lokal
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

  // Tanggal Hari Ini
  const now = new Date();
  const dayNameId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
  const monthNameId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ][now.getMonth()];
  const dateFormatted = `${dayNameId}, ${now.getDate()} ${monthNameId} ${now.getFullYear()}`;

  // Geolocation & Radius State (Default simulasi sah di area RSJ)
  const [userDistance, setUserDistance] = useState(59); // Meter (di dalam tilok)
  const [userCoords, setUserCoords] = useState({ latitude: 0.465812, longitude: 101.381989 });
  const [tilokRadius, setTilokRadius] = useState(TILOK_RADIUS_DEFAULT);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showDeveloperPanel, setShowDeveloperPanel] = useState(false);

  const isWithinTilok = userDistance !== null && userDistance <= tilokRadius;

  // Status Presensi Hari Ini
  const hasMasuk = Boolean(attendance?.masuk);
  const hasPulang = Boolean(attendance?.pulang);

  // Jam Pulang Minimal yang Sah (misal 14:00 WIB untuk shift pagi)
  const currentHour = now.getHours();
  const isPulangAllowed = currentHour >= 14;

  // Penentuan Aksi Tombol Cerdas Tunggal
  let smartActionState = 'masuk'; // 'masuk' | 'pulang' | 'pulang_disabled' | 'selesai'
  if (!hasMasuk) {
    smartActionState = 'masuk';
  } else if (!hasPulang) {
    smartActionState = isPulangAllowed ? 'pulang' : 'pulang_disabled';
  } else {
    smartActionState = 'selesai';
  }

  const handleSmartButtonClick = () => {
    if (!isWithinTilok) {
      Alert.alert(
        'Di Luar Radius Tilok',
        `Posisi Anda saat ini berjarak ${Math.round(userDistance)} m dari RS Jiwa Tampan (Maksimal ${tilokRadius} m). Silakan gunakan menu Presensi Luar Tilok (PDT) jika sedang bertugas dinas luar.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Menu PDT', onPress: () => onNavigateToPdt && onNavigateToPdt() },
        ]
      );
      return;
    }

    if (smartActionState === 'masuk') {
      if (onOpenModal) onOpenModal('masuk');
    } else if (smartActionState === 'pulang') {
      if (onOpenModal) onOpenModal('pulang');
    } else if (smartActionState === 'pulang_disabled') {
      Alert.alert(
        'Belum Waktu Absen Pulang',
        'Absen pulang shift reguler baru dapat dilakukan mulai pukul 14:00 WIB.'
      );
    } else if (smartActionState === 'selesai') {
      Alert.alert(
        'Presensi Selesai',
        'Anda telah menyelesaikan absensi masuk dan pulang untuk dinas reguler hari ini.'
      );
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
        {/* 1. HEADER SEDERHANA: JUDUL & TOMBOL KEMBALI                       */}
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
            <Text style={[styles.screenTitle, { color: '#0284c7' }]}>Presensi Reguler</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textMuted }]}>Shift 1 / Reguler RS</Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. KARTU STATUS HARI INI (SATU BADGE LOKASI, JAM LIVE BESAR)      */}
        {/* ================================================================= */}
        <View style={[styles.statusHeroCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          {/* Baris Atas: Shift & Status Lokasi Tunggal */}
          <View style={styles.heroTopRow}>
            <View style={styles.shiftPill}>
              <Text style={styles.shiftPillText}>Shift Pagi · 07:00–16:00</Text>
            </View>

            {/* SATU BADGE LOKASI RINGKAS (TIDAK BERULANG) */}
            <View
              style={[
                styles.locationBadge,
                {
                  backgroundColor: isWithinTilok ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  borderColor: isWithinTilok ? '#16a34a' : '#ef4444',
                },
              ]}
            >
              <View
                style={[
                  styles.locationDot,
                  { backgroundColor: isWithinTilok ? '#16a34a' : '#ef4444' },
                ]}
              />
              <Text
                style={[
                  styles.locationBadgeText,
                  { color: isWithinTilok ? '#16a34a' : '#ef4444' },
                ]}
              >
                {isWithinTilok ? `Dalam Area RSJ · ${userDistance} m (Sah)` : `Luar Tilok · ${userDistance >= 1000 ? (userDistance/1000).toFixed(1) + ' km' : userDistance + ' m'}`}
              </Text>
            </View>
          </View>

          {/* Jam Digital Live Besar */}
          <View style={styles.clockCenterBox}>
            <Text style={[styles.bigClockText, { color: theme.textMain }]}>{clockToDisplay}</Text>
            <Text style={[styles.dateSubText, { color: theme.textSub }]}>{dateFormatted}</Text>
          </View>

          {/* =============================================================== */}
          {/* 3. SATU TOMBOL BESAR SESUAI KONDISI (SMART ACTION BUTTON)       */}
          {/* =============================================================== */}
          <View style={{ marginTop: 16 }}>
            {smartActionState === 'masuk' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSmartButtonClick}
                style={[
                  styles.smartMainBtn,
                  {
                    backgroundColor: isWithinTilok ? '#0284c7' : '#94a3b8',
                  },
                ]}
              >
                <Text style={styles.smartMainBtnText}>Absen Masuk (Reguler)</Text>
                <Text style={styles.smartMainBtnSub}>Verifikasi wajah & tilok RSJ Tampan</Text>
              </TouchableOpacity>
            )}

            {smartActionState === 'pulang' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSmartButtonClick}
                style={[
                  styles.smartMainBtn,
                  {
                    backgroundColor: isWithinTilok ? '#059669' : '#94a3b8',
                  },
                ]}
              >
                <Text style={styles.smartMainBtnText}>Absen Pulang</Text>
                <Text style={styles.smartMainBtnSub}>Selesaikan tugas dinas hari ini</Text>
              </TouchableOpacity>
            )}

            {smartActionState === 'pulang_disabled' && (
              <View style={[styles.smartMainBtn, { backgroundColor: theme.pillBg, borderWidth: 1, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.smartMainBtnText, { color: theme.textMuted }]}>Absen Pulang</Text>
                <Text style={[styles.smartMainBtnSub, { color: '#f59e0b', fontWeight: '700' }]}>
                  ⏳ Aktif pukul 14:00 WIB
                </Text>
              </View>
            )}

            {smartActionState === 'selesai' && (
              <View style={[styles.smartMainBtn, { backgroundColor: 'rgba(22, 163, 74, 0.12)', borderWidth: 1, borderColor: '#16a34a' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <IconCheckCircle size={22} color="#16a34a" />
                  <Text style={[styles.smartMainBtnText, { color: '#16a34a' }]}>
                    Presensi Hari Ini Selesai
                  </Text>
                </View>
                <Text style={[styles.smartMainBtnSub, { color: '#047857' }]}>
                  Terima kasih atas pelayanan Anda di RS Jiwa Tampan
                </Text>
              </View>
            )}

            {/* Peringatan jika di luar tilok */}
            {!isWithinTilok && (
              <View style={styles.outsideWarningBox}>
                <IconAlertCircle size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.outsideWarningTitle}>
                    Anda berjarak {userDistance >= 1000 ? (userDistance/1000).toFixed(1) + ' km' : userDistance + ' m'} dari RSJ
                  </Text>
                  <Text style={styles.outsideWarningDesc}>
                    Presensi reguler hanya sah di dalam area tilok. Jika sedang dinas luar, silakan gunakan menu PDT.
                  </Text>
                </View>
                {onNavigateToPdt && (
                  <TouchableOpacity
                    onPress={onNavigateToPdt}
                    style={styles.pdtSwitchBtn}
                  >
                    <Text style={styles.pdtSwitchBtnText}>Gunakan PDT</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ================================================================= */}
        {/* 4. RINGKASAN HARI INI: DUA BARIS SEDERHANA                        */}
        {/* ================================================================= */}
        <View style={[styles.summaryCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.summaryTitle, { color: theme.textMain }]}>Ringkasan Presensi Hari Ini</Text>

          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.summaryIconDot, { backgroundColor: hasMasuk ? '#16a34a' : '#cbd5e1' }]} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSub }]}>Presensi Masuk</Text>
                <Text style={[styles.summaryValue, { color: hasMasuk ? theme.textMain : theme.textMuted }]}>
                  {hasMasuk ? `${attendance.masuk} WIB` : 'Belum absen'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPillBadge, { backgroundColor: hasMasuk ? '#ecfdf5' : theme.pillBg }]}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: hasMasuk ? '#059669' : theme.textMuted }}>
                {hasMasuk ? 'Tepat Waktu' : 'Menunggu'}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.summaryIconDot, { backgroundColor: hasPulang ? '#16a34a' : '#cbd5e1' }]} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSub }]}>Presensi Pulang</Text>
                <Text style={[styles.summaryValue, { color: hasPulang ? theme.textMain : theme.textMuted }]}>
                  {hasPulang ? `${attendance.pulang} WIB` : 'Belum absen'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPillBadge, { backgroundColor: hasPulang ? '#ecfdf5' : theme.pillBg }]}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: hasPulang ? '#059669' : theme.textMuted }}>
                {hasPulang ? 'Selesai' : 'Belum Waktunya'}
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 5. PETA KECIL COMPACT (~160px) DENGAN TOGGLE FULLSCREEN           */}
        {/* ================================================================= */}
        <View style={[styles.mapContainerCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.mapHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconMapPin size={18} color="#0284c7" />
              <Text style={[styles.mapTitle, { color: theme.textMain }]}>Area Geofence RSJ Tampan</Text>
            </View>

            <TouchableOpacity
              onPress={() => setMapExpanded(!mapExpanded)}
              style={[styles.mapExpandBtn, { backgroundColor: theme.pillBg }]}
            >
              <Text style={[styles.mapExpandBtnText, { color: theme.accent }]}>
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
        {/* 6. PANEL PENGUJIAN DEVELOPER (COLLAPSIBLE - RAPI DARI PEGAWAI)    */}
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
                Panel Pengujian / Developer (Simulasi)
              </Text>
            </View>
            <IconChevronDown size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {showDeveloperPanel && (
            <View style={styles.devPanelContent}>
              <Text style={[styles.devPanelHelp, { color: theme.textMuted }]}>
                Uji skenario presensi tanpa mengubah data produksi:
              </Text>
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
                    <Text style={[styles.devActionText, { color: theme.textMain }]}>Reset Status Hari Ini</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Face Recognition Modal Biometrik */}
        <FaceRecognitionModal
          visible={modalVisible}
          type={smartActionState === 'pulang' ? 'pulang' : 'masuk'}
          currentTime={clockToDisplay}
          isDording={false}
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

  // Hero Status Card
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
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftPillText: {
    color: '#0284c7',
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
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  smartMainBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
    marginTop: 3,
  },

  outsideWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  outsideWarningTitle: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '800',
  },
  outsideWarningDesc: {
    color: '#b91c1c',
    fontSize: 11.5,
    marginTop: 2,
  },
  pdtSwitchBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pdtSwitchBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Summary
  summaryCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
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
  devPanelHelp: {
    fontSize: 11.5,
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
