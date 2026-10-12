import React, { useState, useEffect } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '../theme';

const SHIFT_TYPES = {
  P: { code: 'P', label: 'Shift Pagi', time: '07:00 - 16:00', color: '#16a34a', bg: '#ecfdf5', desc: 'Masuk: 07:00 - 08:00 | Pulang: 14:00 - 16:00' },
  S: { code: 'S', label: 'Shift Sore', time: '13:00 - 21:00', color: '#0284c7', bg: '#e0f2fe', desc: 'Presensi Masuk s/d 14:00 | Pulang: 20:00 - 21:00' },
  M: { code: 'M', label: 'Shift Malam', time: '20:30 - 07:30', color: '#7c3aed', bg: '#f3e8ff', desc: 'Jaga Malam Rawat Inap RSJ Tampan' },
  D: { code: 'D', label: 'Shift Dording', time: '13:00 - 21:00', color: '#d97706', bg: '#fef3c7', desc: 'Dinas Sambung Berkelanjutan (Shift 2)' },
  DM: { code: 'DM', label: 'Dording Malam', time: '19:30 - 08:00', color: '#ea580c', bg: '#ffedd5', desc: 'Dinas Sambung Malam Perawatan' },
  C: { code: 'C', label: 'Cuti Resmi', time: 'Cuti Tahunan / Sakit', color: '#343a40', bg: '#f1f5f9', desc: 'Izin Cuti Terdaftar di SIMRS' },
  L: { code: 'L', label: 'Libur / Off', time: 'Bebas Tugas', color: '#6c757d', bg: '#f8fafc', desc: 'Hari Bebas Dinas Roster' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_FULL_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Roster matching Screenshot 1 (Bulan 10 / 2026)
const DEFAULT_JADWAL_DINAS = {
  1: 'C', 2: 'C', 3: 'L', 4: 'L', 5: 'P', 6: 'P', 7: 'P', 8: 'L', 9: 'L',
  10: 'P', 11: 'P', 12: 'P', 13: 'P', 14: 'P', 15: 'P', 16: 'P', 17: 'L', 18: 'L',
  19: 'P', 20: 'P', 21: 'P', 22: 'P', 23: 'P', 24: 'L', 25: 'L', 26: 'P', 27: 'P',
  28: 'P', 29: 'P', 30: 'P', 31: 'L'
};

// Dording Roster matching Screenshot 2 (Bulan 10 / 2026: mostly '-' with occasional D)
const DEFAULT_JADWAL_DORDING = {
  1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-', 7: '-', 8: '-', 9: '-',
  10: 'D', 11: '-', 12: '-', 13: '-', 14: '-', 15: '-', 16: 'D', 17: '-', 18: '-',
  19: '-', 20: '-', 21: '-', 22: 'D', 23: '-', 24: '-', 25: '-', 26: '-', 27: '-',
  28: 'D', 29: '-', 30: '-', 31: '-'
};

export default function DashboardScreen({
  user,
  currentTime,
  attendance = {},
  dordingAttendance = {},
  onNavigate,
  isDarkMode = true,
  onToggleDarkMode,
}) {
  const [localIsDarkMode, setLocalIsDarkMode] = useState(isDarkMode);
  const activeDarkMode = onToggleDarkMode ? isDarkMode : localIsDarkMode;
  const toggleDarkMode = onToggleDarkMode || (() => setLocalIsDarkMode(!localIsDarkMode));
  const theme = activeDarkMode ? DARK_THEME : LIGHT_THEME;

  // Realtime clock & date
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
  const currentDayName = DAY_FULL_ID[now.getDay()];
  const currentDateNum = now.getDate();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearNum = now.getFullYear();
  const currentMonthName = MONTHS_FULL_ID[now.getMonth()];

  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [selectedCalendarType, setSelectedCalendarType] = useState('dinas'); // 'dinas' | 'dording'

  const handleOpenDayDetail = (dayNum, type) => {
    setSelectedCalendarType(type);
    setSelectedDayDetail(dayNum);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. TOP HEADER & BREADCRUMB (Matching Screenshot 3)                */}
        {/* ================================================================= */}
        <View style={styles.topHeaderRow}>
          <View>
            <Text style={[styles.mainHeading, { color: theme.textMain }]}>Beranda</Text>
            <View style={styles.breadcrumbRow}>
              <Text style={[styles.breadcrumbHome, { color: theme.breadcrumbHome }]}>Home</Text>
              <Text style={[styles.breadcrumbSlash, { color: theme.textMuted }]}> / </Text>
              <Text style={[styles.breadcrumbActive, { color: theme.textSub }]}>Beranda</Text>
            </View>
          </View>

          {/* Quick Theme Switcher (Dark / Light) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleDarkMode}
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: theme.pillBg,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{activeDarkMode ? '🌙' : '☀️'}</Text>
            <Text style={[styles.themeToggleText, { color: theme.textMain }]}>
              {activeDarkMode ? 'Tema Gelap' : 'Tema Terang'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* 2. WELCOME GREETING & LIVE DIGITAL CLOCK (Matching Screenshot 3)   */}
        {/* ================================================================= */}
        <View
          style={[
            styles.welcomeBanner,
            {
              backgroundColor: theme.cardSolid,
              borderColor: theme.border,
            },
            Platform.OS === 'web' && {
              boxShadow: `0 4px 20px ${theme.shadow}`,
            },
          ]}
        >
          <View style={styles.welcomeLeft}>
            <Text style={[styles.welcomeGreeting, { color: theme.textSub }]}>Welcome!,</Text>
            <Text style={[styles.welcomeUserName, { color: theme.textMain }]}>
              {user?.name || 'YANTINI MANIK'} , {user?.badge || 'AMR'}
            </Text>
            <View style={styles.clockRow}>
              <Text style={[styles.liveTimestamp, { color: theme.textSub }]}>
                {currentDayName}, {currentDateNum} {currentMonthName} {currentYearNum} - {clockToDisplay} WIB
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 3. 4 MAIN ACTION CARDS (Matching Screenshot 3)                    */}
        {/* ================================================================= */}
        <View style={styles.actionCardsContainer}>
          {/* Card 1: Presensi Sekarang (Biru) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCard, { backgroundColor: '#0284c7' }]}
            onPress={() => onNavigate('presensi', 'sekarang')}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardTitleRow}>
                <Text style={styles.actionCardIconWhite}>🔏</Text>
                <Text style={styles.actionCardTitleWhite}>Presensi Sekarang</Text>
              </View>
              <Text style={styles.actionCardSubtitleWhite}>
                Lakukan absensi masuk dan pulang Anda hari ini.
              </Text>
              <View style={styles.actionCardBadge}>
                <Text style={styles.actionCardBadgeText}>
                  {attendance?.masuk ? `✓ Masuk: ${attendance.masuk}` : 'Shift 1 / Reguler RS'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Rekap Absensi (Merah) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCard, { backgroundColor: '#dc2626' }]}
            onPress={() => onNavigate('rekap')}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardTitleRow}>
                <Text style={styles.actionCardIconWhite}>📊</Text>
                <Text style={styles.actionCardTitleWhite}>Rekap Absensi</Text>
              </View>
              <Text style={styles.actionCardSubtitleWhite}>
                Lihat riwayat absensi Anda.
              </Text>
              <View style={styles.actionCardBadge}>
                <Text style={styles.actionCardBadgeText}>Laporan Kehadiran & Log</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 3: Presensi Diluar Tilok (PDT) (Dark Slate) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCard, { backgroundColor: '#334155' }]}
            onPress={() => onNavigate('pdt')}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardTitleRow}>
                <Text style={styles.actionCardIconWhite}>🔏</Text>
                <Text style={styles.actionCardTitleWhite}>Presensi Diluar Tilok (PDT)</Text>
              </View>
              <Text style={styles.actionCardSubtitleWhite}>
                Gunakan fitur ini untuk melakukan presensi di luar lokasi tilok.
              </Text>
              <View style={styles.actionCardBadge}>
                <Text style={styles.actionCardBadgeText}>Dinas Luar & Diklat RS</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 4: Presensi Dording (Kuning / Amber Gold) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionCard, { backgroundColor: '#f59e0b' }]}
            onPress={() => onNavigate('presensi', 'dording')}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardTitleRow}>
                <Text style={styles.actionCardIconDark}>🔏</Text>
                <Text style={styles.actionCardTitleDark}>Presensi Dording</Text>
              </View>
              <Text style={styles.actionCardSubtitleDark}>
                Gunakan fitur ini untuk melakukan presensi dording.
              </Text>
              <View style={styles.actionCardBadgeDark}>
                <Text style={styles.actionCardBadgeTextDark}>
                  {dordingAttendance?.masuk ? `✓ Masuk: ${dordingAttendance.masuk}` : 'Dinas Sambung (Shift 2)'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* 4. CARD JADWAL DINAS (Matching Screenshot 1)                      */}
        {/* ================================================================= */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: theme.cardSolid,
              borderColor: theme.border,
            },
            Platform.OS === 'web' && {
              boxShadow: `0 4px 16px ${theme.shadow}`,
            },
          ]}
        >
          {/* Card Header (Light Green / Sage in Light Theme, Deep Teal in Dark) */}
          <View
            style={[
              styles.calendarCardHeader,
              {
                backgroundColor: theme.jadwalDinasHeaderBg,
                borderBottomColor: theme.borderSubtle,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text
              style={[
                styles.calendarCardTitle,
                { color: theme.jadwalDinasHeaderText },
              ]}
            >
              Jadwal Dinas
            </Text>
          </View>

          {/* Card Body */}
          <View style={styles.calendarCardBody}>
            {/* Filter Badges (Tahun 2026, Bulan 10) */}
            <View style={styles.filterBadgesRow}>
              <View style={styles.greenFilterBadge}>
                <Text style={styles.greenFilterBadgeText}>Tahun {currentYearNum}</Text>
              </View>
              <View style={styles.greenFilterBadge}>
                <Text style={styles.greenFilterBadgeText}>Bulan {currentMonthNum}</Text>
              </View>
            </View>

            {/* Grid 1 to 31 Days matching Screenshot 1 */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const shiftCode = DEFAULT_JADWAL_DINAS[dayNum] || 'P';
                const isToday = dayNum === currentDateNum;
                const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;

                // Color of badge tile matching original website
                let badgeBgColor = '#16a34a'; // Green for P
                if (shiftCode === 'C') badgeBgColor = '#343a40'; // Dark Slate for Cuti
                if (shiftCode === 'L') badgeBgColor = '#6c757d'; // Gray for Libur
                if (shiftCode === 'S') badgeBgColor = '#0284c7'; // Blue for Sore
                if (shiftCode === 'M') badgeBgColor = '#7c3aed'; // Purple for Malam
                if (shiftCode === 'D') badgeBgColor = '#d97706'; // Amber for Dording

                return (
                  <TouchableOpacity
                    key={`dinas-${dayNum}`}
                    activeOpacity={0.8}
                    style={[
                      styles.dayTile,
                      { backgroundColor: badgeBgColor },
                      isToday && styles.todayTileHighlight,
                    ]}
                    onPress={() => handleOpenDayDetail(dayNum, 'dinas')}
                  >
                    <Text style={styles.dayTileNumber}>{dayNum}</Text>
                    <Text style={styles.dayTileShiftCode}>{shiftCode}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Shift Legend */}
            <View
              style={[
                styles.legendContainer,
                {
                  backgroundColor: theme.pillBg,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.legendTitle, { color: theme.textMain }]}>Keterangan Kode Shift:</Text>
              <View style={styles.legendItemsRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
                  <Text style={[styles.legendText, { color: theme.textSub }]}>P = Pagi (07:00-16:00)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#343a40' }]} />
                  <Text style={[styles.legendText, { color: theme.textSub }]}>C = Cuti</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#6c757d' }]} />
                  <Text style={[styles.legendText, { color: theme.textSub }]}>L = Libur</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0284c7' }]} />
                  <Text style={[styles.legendText, { color: theme.textSub }]}>S = Sore (13:00-21:00)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 5. CARD JADWAL DORDING (Matching Screenshot 2)                     */}
        {/* ================================================================= */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: theme.cardSolid,
              borderColor: theme.border,
            },
            Platform.OS === 'web' && {
              boxShadow: `0 4px 16px ${theme.shadow}`,
            },
          ]}
        >
          {/* Card Header (Light Coral/Pink in Light Theme, Deep Rose in Dark) */}
          <View
            style={[
              styles.calendarCardHeader,
              {
                backgroundColor: theme.jadwalDordingHeaderBg,
                borderBottomColor: theme.borderSubtle,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>🚩</Text>
            <Text
              style={[
                styles.calendarCardTitle,
                { color: theme.jadwalDordingHeaderText },
              ]}
            >
              Jadwal Dording (Dinas Tambahan)
            </Text>
          </View>

          {/* Card Body */}
          <View style={styles.calendarCardBody}>
            {/* Filter Badges (Tahun 2026, Bulan 10) */}
            <View style={styles.filterBadgesRow}>
              <View style={styles.greenFilterBadge}>
                <Text style={styles.greenFilterBadgeText}>Tahun {currentYearNum}</Text>
              </View>
              <View style={styles.greenFilterBadge}>
                <Text style={styles.greenFilterBadgeText}>Bulan {currentMonthNum}</Text>
              </View>
            </View>

            {/* Grid 1 to 31 Days matching Screenshot 2 */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const dordingCode = DEFAULT_JADWAL_DORDING[dayNum] || '-';
                const isDordingAssigned = dordingCode !== '-';
                const isToday = dayNum === currentDateNum;

                // Color matching original website (Dark slate #343a40 for '-', Amber for 'D')
                const badgeBgColor = isDordingAssigned ? '#f59e0b' : '#343a40';

                return (
                  <TouchableOpacity
                    key={`dording-${dayNum}`}
                    activeOpacity={0.8}
                    style={[
                      styles.dayTile,
                      { backgroundColor: badgeBgColor },
                      isToday && styles.todayTileHighlight,
                    ]}
                    onPress={() => handleOpenDayDetail(dayNum, 'dording')}
                  >
                    <Text
                      style={[
                        styles.dayTileNumber,
                        isDordingAssigned && { color: '#0f172a' },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    <Text
                      style={[
                        styles.dayTileShiftCode,
                        isDordingAssigned && { color: '#0f172a' },
                      ]}
                    >
                      {dordingCode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>
                * Tanda (-) menunjukkan hari bebas tugas dinas tambahan / shift sambung.
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 6. FOOTER (Matching Screenshot 2)                                 */}
        {/* ================================================================= */}
        <View style={[styles.footerContainer, { borderTopColor: theme.footerBorder }]}>
          <Text style={[styles.footerText, { color: theme.footerText }]}>
            Copyright © 2025{' '}
            <Text style={{ fontWeight: '800', color: theme.accent }}>
              SIAP - Sistem Absensi Pegawai
            </Text>
            . All rights reserved.
          </Text>
          <View style={styles.footerLinkRow}>
            <Text style={[styles.footerSubText, { color: theme.textMuted }]}>
              🌐 siap.rsjiwatampan.com
            </Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 7. INTERACTIVE MODAL: DETAIL JADWAL TANGGAL                       */}
        {/* ================================================================= */}
        <Modal
          visible={selectedDayDetail !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDayDetail(null)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.cardSolid,
                  borderColor: theme.border,
                },
                Platform.OS === 'web' && {
                  boxShadow: `0 20px 45px ${theme.shadow}`,
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                    Detail {selectedCalendarType === 'dording' ? 'Jadwal Dording' : 'Jadwal Dinas'}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSub }]}>
                    Tanggal {selectedDayDetail} {currentMonthName} {currentYearNum}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: theme.pillBg }]}
                  onPress={() => setSelectedDayDetail(null)}
                >
                  <Text style={{ color: theme.textMain, fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedDayDetail && (() => {
                if (selectedCalendarType === 'dinas') {
                  const shiftCode = DEFAULT_JADWAL_DINAS[selectedDayDetail] || 'P';
                  const shift = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                  return (
                    <View style={{ marginVertical: 16, gap: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={[styles.modalShiftBigBadge, { backgroundColor: shift.color }]}>
                          <Text style={styles.modalShiftBigCode}>{shift.code}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalShiftLabel, { color: theme.textMain }]}>
                            {shift.label}
                          </Text>
                          <Text style={[styles.modalShiftTime, { color: theme.textSub }]}>
                            Jam Kerja: {shift.time}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.modalInfoBox,
                          { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Text style={[styles.modalInfoText, { color: theme.textMain }]}>
                          {shift.desc}
                        </Text>
                      </View>
                    </View>
                  );
                } else {
                  const dordingCode = DEFAULT_JADWAL_DORDING[selectedDayDetail] || '-';
                  const isAssigned = dordingCode !== '-';
                  return (
                    <View style={{ marginVertical: 16, gap: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View
                          style={[
                            styles.modalShiftBigBadge,
                            { backgroundColor: isAssigned ? '#f59e0b' : '#343a40' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalShiftBigCode,
                              isAssigned && { color: '#0f172a' },
                            ]}
                          >
                            {dordingCode}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalShiftLabel, { color: theme.textMain }]}>
                            {isAssigned ? 'Dinas Dording (Tambahan)' : 'Bebas Dording'}
                          </Text>
                          <Text style={[styles.modalShiftTime, { color: theme.textSub }]}>
                            {isAssigned ? 'Shift Sambung: 13:00 - 21:00 WIB' : 'Tidak ada jadwal dording'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.modalInfoBox,
                          { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Text style={[styles.modalInfoText, { color: theme.textMain }]}>
                          {isAssigned
                            ? 'Pegawai dijadwalkan dinas sambung (dording) pada instalasi rawat inap RS Jiwa Tampan.'
                            : 'Pegawai tidak memiliki penugasan shift tambahan untuk tanggal ini.'}
                        </Text>
                      </View>
                    </View>
                  );
                }
              })()}

              <TouchableOpacity
                style={styles.modalActionCloseBtn}
                onPress={() => setSelectedDayDetail(null)}
              >
                <Text style={styles.modalActionCloseBtnText}>Tutup Informasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  breadcrumbHome: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  breadcrumbSlash: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  breadcrumbActive: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  welcomeBanner: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  welcomeLeft: {
    gap: 3,
  },
  welcomeGreeting: {
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeUserName: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  clockRow: {
    marginTop: 4,
  },
  liveTimestamp: {
    fontSize: 12,
    fontWeight: '600',
  },

  actionCardsContainer: {
    gap: 12,
    marginBottom: 22,
  },
  actionCard: {
    borderRadius: 16,
    padding: 16,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }
      : { elevation: 3 }),
  },
  actionCardContent: {
    gap: 4,
  },
  actionCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCardIconWhite: {
    fontSize: 18,
  },
  actionCardTitleWhite: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  actionCardSubtitleWhite: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    lineHeight: 16,
  },
  actionCardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  actionCardBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },

  actionCardIconDark: {
    fontSize: 18,
  },
  actionCardTitleDark: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  actionCardSubtitleDark: {
    color: '#1e293b',
    fontSize: 12,
    lineHeight: 16,
  },
  actionCardBadgeDark: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  actionCardBadgeTextDark: {
    color: '#0f172a',
    fontSize: 10.5,
    fontWeight: '800',
  },

  calendarCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 22,
  },
  calendarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  calendarCardTitle: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  calendarCardBody: {
    padding: 16,
  },

  filterBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  greenFilterBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  greenFilterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  dayTile: {
    width: 44,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  todayTileHighlight: {
    borderWidth: 2,
    borderColor: '#38bdf8',
    transform: [{ scale: 1.05 }],
  },
  dayTileNumber: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 15,
  },
  dayTileShiftCode: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },

  legendContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  legendItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },

  footerContainer: {
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  footerLinkRow: {
    marginTop: 2,
  },
  footerSubText: {
    fontSize: 11,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShiftBigBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShiftBigCode: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  modalShiftLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalShiftTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalInfoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalInfoText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  modalActionCloseBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalActionCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});