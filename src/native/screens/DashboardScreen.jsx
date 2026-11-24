import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import { DARK_THEME, LIGHT_THEME } from '../theme';
import { RSJ_LOGO_URI } from '../assets';
import {
  IconClock,
  IconCheckCircle,
  IconBriefcase,
  IconLayers,
  IconHistory,
  IconChevronRight,
  IconMapPin,
  IconSun,
  IconMoon,
  IconMenu,
} from '../components/Icons';

const SHIFT_TYPES = {
  P: { code: 'P', label: 'Shift Pagi', time: '07:00 - 16:00', color: '#059669', bg: '#ecfdf5', textOnBadge: '#ffffff', desc: 'Masuk: 07:00 - 08:00 | Pulang: 14:00 - 16:00' },
  S: { code: 'S', label: 'Shift Sore', time: '13:00 - 21:00', color: '#0284c7', bg: '#e0f2fe', textOnBadge: '#ffffff', desc: 'Presensi Masuk s/d 14:00 | Pulang: 20:00 - 21:00' },
  M: { code: 'M', label: 'Shift Malam', time: '20:30 - 07:30', color: '#7c3aed', bg: '#f3e8ff', textOnBadge: '#ffffff', desc: 'Jaga Malam Rawat Inap RSJ Tampan' },
  D: { code: 'D', label: 'Shift Dording', time: '13:00 - 21:00', color: '#d97706', bg: '#fef3c7', textOnBadge: '#ffffff', desc: 'Dinas Sambung Berkelanjutan (Shift 2)' },
  DM: { code: 'DM', label: 'Dording Malam', time: '19:30 - 08:00', color: '#ea580c', bg: '#ffedd5', textOnBadge: '#ffffff', desc: 'Dinas Sambung Malam Perawatan' },
  C: { code: 'C', label: 'Cuti Resmi', time: 'Cuti Tahunan / Sakit', color: '#475569', bg: '#f1f5f9', textOnBadge: '#ffffff', desc: 'Izin Cuti Terdaftar di SIMRS' },
  L: { code: 'L', label: 'Libur / Off', time: 'Bebas Tugas', color: '#94a3b8', bg: '#f8fafc', textOnBadge: '#ffffff', desc: 'Hari Bebas Dinas Roster' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Menghasilkan Jadwal Dinas otomatis
 */
const generateMonthlyJadwalDinas = (year, monthIndex, totalDays) => {
  const schedule = {};
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      schedule[d] = 'L';
    } else {
      if (d === 6) schedule[d] = 'C';
      else if (d === 19) schedule[d] = 'S';
      else schedule[d] = 'P';
    }
  }
  return schedule;
};

/**
 * Menghasilkan Jadwal Dording (Dinas Tambahan)
 */
const generateMonthlyJadwalDording = (year, monthIndex, totalDays) => {
  const schedule = {};
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      schedule[d] = '-';
    } else {
      if (d === 3 || d === 10 || d === 16 || d === 20 || d === 24 || d === 27) {
        schedule[d] = 'D';
      } else {
        schedule[d] = '-';
      }
    }
  }
  return schedule;
};

export default function DashboardScreen({
  user,
  currentTime,
  attendance = {},
  dordingAttendance = {},
  onNavigate,
  isDarkMode = true,
  onToggleDarkMode,
  onOpenDrawer,
}) {
  const [localIsDarkMode, setLocalIsDarkMode] = useState(isDarkMode);
  const activeDarkMode = onToggleDarkMode ? isDarkMode : localIsDarkMode;
  const toggleDarkMode = onToggleDarkMode || (() => setLocalIsDarkMode(!localIsDarkMode));
  const theme = activeDarkMode ? DARK_THEME : LIGHT_THEME;

  const scrollRef = useRef(null);

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
  const hourNow = now.getHours();

  // Sapaan kontekstual waktu
  const getGreeting = () => {
    if (hourNow >= 4 && hourNow < 11) return 'Selamat Pagi';
    if (hourNow >= 11 && hourNow < 15) return 'Selamat Siang';
    if (hourNow >= 15 && hourNow < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const firstName = user?.name ? user.name.split(',')[0].replace(/^(Ners\.|Ns\.|dr\.|Hj\.)\s*/i, '').trim() : 'Pegawai';
  const currentDayName = DAY_FULL_ID[now.getDay()];
  const currentDateNum = now.getDate();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearNum = now.getFullYear();
  const currentMonthName = MONTHS_FULL_ID[now.getMonth()];
  const daysInMonth = new Date(currentYearNum, now.getMonth() + 1, 0).getDate();

  const jadwalDinas = useMemo(() => {
    return generateMonthlyJadwalDinas(currentYearNum, now.getMonth(), daysInMonth);
  }, [currentYearNum, now.getMonth(), daysInMonth]);

  const jadwalDording = useMemo(() => {
    return generateMonthlyJadwalDording(currentYearNum, now.getMonth(), daysInMonth);
  }, [currentYearNum, now.getMonth(), daysInMonth]);

  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Status presensi hari ini
  const hasMasuk = Boolean(attendance?.masuk);
  const hasPulang = Boolean(attendance?.pulang);

  let presensiStatusText = 'Belum Absen Masuk';
  if (hasMasuk && hasPulang) {
    presensiStatusText = `Masuk ${attendance.masuk} • Pulang ${attendance.pulang}`;
  } else if (hasMasuk) {
    presensiStatusText = `Masuk ${attendance.masuk} • Siap Pulang`;
  }

  // Shift hari ini
  const todayShiftCode = jadwalDinas[currentDateNum] || 'P';
  const todayDordingCode = jadwalDording[currentDateNum] || '-';
  const todayShift = SHIFT_TYPES[todayShiftCode] || SHIFT_TYPES.P;
  const todayHasDording = todayDordingCode === 'D';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. HEADER PERSONAL MODERN & CLEAN (SATU HEADER UTAMA)            */}
        {/* ================================================================= */}
        <View style={dashStyles.headerCard}>
          <View style={dashStyles.headerTop}>
            <View style={dashStyles.userProfileRow}>
              {/* Avatar dengan foto / logo */}
              <View style={[dashStyles.avatarContainer, { borderColor: theme.accent, backgroundColor: theme.pillBg }]}>
                <Image
                  source={{ uri: RSJ_LOGO_URI }}
                  style={{ width: 36, height: 36, resizeMode: 'contain' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[dashStyles.greetingText, { color: theme.textMuted }]}>
                  {getGreeting()}, {firstName} 👋
                </Text>
                <Text style={[dashStyles.userNameText, { color: theme.textMain }]} numberOfLines={1}>
                  {user?.name || 'Ners. Fitri Rahmadani, S.Kep'}
                </Text>
                <Text style={[dashStyles.rolePillText, { color: theme.accent }]}>
                  {user?.badge || 'Ners Rawat Inap'} • RSJ Tampan
                </Text>
              </View>
            </View>

            {/* Quick action: Theme toggle & Drawer menu */}
            <View style={dashStyles.quickActionsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={toggleDarkMode}
                style={[dashStyles.iconCircleBtn, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
                accessibilityLabel="Ganti Mode Gelap/Terang"
              >
                {activeDarkMode ? <IconSun size={18} color="#f59e0b" /> : <IconMoon size={18} color="#0284c7" />}
              </TouchableOpacity>
              {onOpenDrawer && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onOpenDrawer}
                  style={[dashStyles.iconCircleBtn, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
                  accessibilityLabel="Buka Menu"
                >
                  <IconMenu size={18} color={theme.textMain} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Jam Realtime & Tanggal Lengkap */}
          <View style={[dashStyles.liveClockBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconClock size={20} color={theme.accent} />
              <Text style={[dashStyles.bigClockText, { color: theme.textMain }]}>
                {clockToDisplay} <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>WIB</Text>
              </Text>
            </View>
            <Text style={[dashStyles.dateSubText, { color: theme.textSub }]}>
              {currentDayName}, {currentDateNum} {currentMonthName} {currentYearNum}
            </Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. HERO CARD: PRESENSI SEKARANG + RINGKASAN SHIFT HARI INI        */}
        {/* ================================================================= */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[dashStyles.heroPresensiCard, { backgroundColor: theme.accent }]}
          onPress={() => onNavigate('presensi', 'sekarang')}
        >
          {/* Background decor */}
          <View style={dashStyles.heroDecorCircle} />

          <View style={dashStyles.heroTopRow}>
            <View style={dashStyles.heroIconWrap}>
              <IconMapPin size={22} color="#ffffff" />
            </View>
            <View style={[dashStyles.heroStatusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.22)' }]}>
              <View style={[dashStyles.statusDot, { backgroundColor: hasMasuk ? '#34d399' : '#fde047' }]} />
              <Text style={dashStyles.heroStatusBadgeText}>
                {hasMasuk ? (hasPulang ? 'Selesai Dinas' : 'Masuk Tercatat') : 'Siap Presensi'}
              </Text>
            </View>
          </View>

          <View style={dashStyles.heroBody}>
            <Text style={dashStyles.heroTitle}>Presensi Sekarang</Text>
            {/* Ringkasan shift hari ini */}
            <View style={dashStyles.heroTodayShiftPill}>
              <Text style={dashStyles.heroTodayShiftLabel}>
                Hari Ini: <Text style={{ fontWeight: '900' }}>{todayShift.label}</Text> ({todayShift.time})
                {todayHasDording ? ' • Dording (+)' : ''}
              </Text>
            </View>
          </View>

          <View style={dashStyles.heroFooter}>
            <View style={dashStyles.heroStatusPill}>
              <Text style={dashStyles.heroStatusPillText}>{presensiStatusText}</Text>
            </View>
            <View style={dashStyles.heroActionArrow}>
              <IconChevronRight size={18} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* ================================================================= */}
        {/* 3. MENU LAYANAN PEGAWAI: GRID BERSIH (IKON ATAS, JUDUL BAWAH)     */}
        {/* ================================================================= */}
        <View style={dashStyles.menuSectionHeader}>
          <Text style={[dashStyles.sectionTitleText, { color: theme.textMain }]}>Menu Layanan</Text>
        </View>

        <View style={dashStyles.gridMenuContainer}>
          {/* Item 1: Rekap Absensi */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[dashStyles.gridCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
            onPress={() => onNavigate('rekap')}
          >
            <View style={[dashStyles.gridIconCircle, { backgroundColor: '#fee2e2' }]}>
              <IconHistory size={22} color="#dc2626" />
            </View>
            <Text style={[dashStyles.gridTitle, { color: theme.textMain }]}>Rekap Absensi</Text>
          </TouchableOpacity>

          {/* Item 2: Presensi Luar Tilok (PDT) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[dashStyles.gridCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
            onPress={() => onNavigate('pdt')}
          >
            <View style={[dashStyles.gridIconCircle, { backgroundColor: '#f1f5f9' }]}>
              <IconBriefcase size={22} color="#334155" />
            </View>
            <Text style={[dashStyles.gridTitle, { color: theme.textMain }]}>Presensi PDT</Text>
          </TouchableOpacity>

          {/* Item 3: Presensi Dording (Shift 2) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[dashStyles.gridCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
            onPress={() => onNavigate('dording')}
          >
            <View style={[dashStyles.gridIconCircle, { backgroundColor: '#fef3c7' }]}>
              <IconLayers size={22} color="#d97706" />
            </View>
            <Text style={[dashStyles.gridTitle, { color: theme.textMain }]}>Presensi Dording</Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* 4. KALENDER JADWAL PROPORSI TERBAIK: SEL PERSEGI & KODE JELAS     */}
        {/* ================================================================= */}
        <View style={[dashStyles.calendarCardUnified, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={dashStyles.calendarHeaderRow}>
            <View>
              <Text style={[dashStyles.calendarMainTitle, { color: theme.textMain }]}>
                Jadwal Dinas & Dording
              </Text>
              <Text style={[dashStyles.calendarSubTitle, { color: theme.textMuted }]}>
                {currentMonthName} {currentYearNum} • Ketuk tanggal untuk rincian shift
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onNavigate && onNavigate('jadwal')}
              style={[dashStyles.statusTag, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 }]}
            >
              <Text style={[dashStyles.statusTagText, { color: theme.accent }]}>Jadwal Lengkap →</Text>
            </TouchableOpacity>
          </View>

          {/* Hari dalam seminggu header */}
          <View style={dashStyles.weekDaysRow}>
            {DAY_NAMES.map((d, idx) => (
              <View key={`day-hdr-${idx}`} style={dashStyles.weekDayCell}>
                <Text style={[dashStyles.weekDayText, { color: idx === 0 || idx === 6 ? '#ef4444' : theme.textMuted }]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid Tanggal Kalender (Proporsi Kotak Presisi ~52-56px tinggi) */}
          <View style={dashStyles.daysGridUnified}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const shiftCode = jadwalDinas[dayNum] || 'P';
              const dordingCode = jadwalDording[dayNum] || '-';
              const hasDording = dordingCode === 'D';
              const isToday = dayNum === currentDateNum;
              const isSelected = selectedDayDetail === dayNum;
              const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;

              return (
                <TouchableOpacity
                  key={`day-cal-${dayNum}`}
                  activeOpacity={0.75}
                  style={[
                    dashStyles.dayTileUnified,
                    { backgroundColor: shiftInfo.bg },
                    isToday && { borderColor: theme.accent, borderWidth: 2 },
                    isSelected && { borderColor: '#d97706', borderWidth: 2.5, transform: [{ scale: 1.05 }] },
                    hasDording && dashStyles.dayTileDordingRing,
                  ]}
                  onPress={() => setSelectedDayDetail(selectedDayDetail === dayNum ? null : dayNum)}
                >
                  {/* Tanggal kecil di pojok kiri atas */}
                  <Text style={[dashStyles.dayCornerNumber, (isToday || isSelected) && { color: isSelected ? '#b45309' : theme.accent, fontWeight: '900' }]}>
                    {dayNum}
                  </Text>

                  {/* Huruf Shift Besar dan Jelas di Tengah */}
                  <Text style={[dashStyles.shiftCenterLetter, { color: shiftInfo.color }]}>
                    {shiftCode}
                  </Text>

                  {/* Badge 'D' Jelas untuk Dording di pojok kanan atas */}
                  {hasDording && (
                    <View style={dashStyles.dordingBadgeMini}>
                      <Text style={dashStyles.dordingBadgeText}>D</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rincian Shift Tanggal Terpilih (Langsung Tampak & Reaktif) */}
          {selectedDayDetail && (() => {
            const selDate = new Date(currentYearNum, now.getMonth(), selectedDayDetail);
            const shiftCode = jadwalDinas[selectedDayDetail] || 'P';
            const dordingCode = jadwalDording[selectedDayDetail] || '-';
            const hasDording = dordingCode === 'D';
            const shift = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;

            return (
              <View style={[dashStyles.inlineDetailCard, { backgroundColor: shift.bg, borderColor: shift.color }]}>
                <View style={dashStyles.inlineDetailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dashStyles.inlineDetailDate, { color: '#0f172a' }]}>
                      {DAY_FULL_ID[selDate.getDay()]}, {selectedDayDetail} {currentMonthName} {currentYearNum}
                    </Text>
                    <Text style={dashStyles.inlineDetailShiftName}>
                      {shift.label} ({shift.time})
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDayDetail(null)}
                    style={dashStyles.inlineDetailCloseBtn}
                  >
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={dashStyles.inlineDetailDesc}>{shift.desc}</Text>

                {hasDording && (
                  <View style={dashStyles.inlineDordingBadgeRow}>
                    <View style={dashStyles.inlineDordingDot} />
                    <Text style={dashStyles.inlineDordingText}>
                      Penugasan Dording Aktif: 13:00 – 21:00 WIB (Shift ke-2)
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Legenda Keterangan Shift */}
          <View style={[dashStyles.legendBoxUnified, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
            <Text style={[dashStyles.legendTitleText, { color: theme.textMain }]}>Keterangan Shift:</Text>
            <View style={dashStyles.legendWrap}>
              <View style={dashStyles.legendItemRow}>
                <View style={[dashStyles.legendChipColor, { backgroundColor: '#059669' }]}>
                  <Text style={dashStyles.legendChipLetter}>P</Text>
                </View>
                <Text style={[dashStyles.legendItemText, { color: theme.textSub }]}>Pagi (07:00–16:00)</Text>
              </View>
              <View style={dashStyles.legendItemRow}>
                <View style={[dashStyles.legendChipColor, { backgroundColor: '#0284c7' }]}>
                  <Text style={dashStyles.legendChipLetter}>S</Text>
                </View>
                <Text style={[dashStyles.legendItemText, { color: theme.textSub }]}>Sore (13:00–21:00)</Text>
              </View>
              <View style={dashStyles.legendItemRow}>
                <View style={[dashStyles.legendChipColor, { backgroundColor: '#475569' }]}>
                  <Text style={dashStyles.legendChipLetter}>C</Text>
                </View>
                <Text style={[dashStyles.legendItemText, { color: theme.textSub }]}>Cuti</Text>
              </View>
              <View style={dashStyles.legendItemRow}>
                <View style={[dashStyles.legendChipColor, { backgroundColor: '#94a3b8' }]}>
                  <Text style={dashStyles.legendChipLetter}>L</Text>
                </View>
                <Text style={[dashStyles.legendItemText, { color: theme.textSub }]}>Libur</Text>
              </View>
              <View style={dashStyles.legendItemRow}>
                <View style={[dashStyles.legendChipColor, { backgroundColor: '#d97706' }]}>
                  <Text style={dashStyles.legendChipLetter}>D</Text>
                </View>
                <Text style={[dashStyles.legendItemText, { color: theme.textSub }]}>Dording (Dinas Tambahan)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={dashStyles.footerWrap}>
          <Text style={[dashStyles.footerText, { color: theme.textMuted }]}>
            © 2026 SIAP • RS Jiwa Tampan Provinsi Riau
          </Text>
        </View>

        {/* ================================================================= */}
        {/* 5. MODAL DETAIL TANGGAL KALENDER                                  */}
        {/* ================================================================= */}
        <Modal
          visible={selectedDayDetail !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDayDetail(null)}
        >
          <View style={[dashStyles.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View style={[dashStyles.modalContent, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              <View style={dashStyles.modalHeaderRow}>
                <View>
                  <Text style={[dashStyles.modalTitle, { color: theme.textMain }]}>Detail Jadwal Kerja</Text>
                  {selectedDayDetail && (() => {
                    const selDate = new Date(currentYearNum, now.getMonth(), selectedDayDetail);
                    return (
                      <Text style={[dashStyles.modalSubtitle, { color: theme.textSub }]}>
                        {DAY_FULL_ID[selDate.getDay()]}, {selectedDayDetail} {currentMonthName} {currentYearNum}
                      </Text>
                    );
                  })()}
                </View>
                <TouchableOpacity
                  style={[dashStyles.modalCloseCircle, { backgroundColor: theme.pillBg }]}
                  onPress={() => setSelectedDayDetail(null)}
                >
                  <Text style={{ color: theme.textMain, fontSize: 14, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedDayDetail && (() => {
                const shiftCode = jadwalDinas[selectedDayDetail] || 'P';
                const dordingCode = jadwalDording[selectedDayDetail] || '-';
                const hasDording = dordingCode === 'D';
                const shift = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;

                return (
                  <View style={{ marginVertical: 14, gap: 12 }}>
                    {/* Shift Reguler Card */}
                    <View style={[dashStyles.detailShiftCard, { backgroundColor: shift.bg, borderColor: shift.color }]}>
                      <View style={[dashStyles.detailShiftBadge, { backgroundColor: shift.color }]}>
                        <Text style={dashStyles.detailShiftBadgeText}>{shift.code}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[dashStyles.detailShiftLabel, { color: '#0f172a' }]}>{shift.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 2 }}>
                          Jam Kerja: {shift.time}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          {shift.desc}
                        </Text>
                      </View>
                    </View>

                    {/* Dording Status Card */}
                    <View style={[dashStyles.detailShiftCard, { backgroundColor: hasDording ? '#fef3c7' : '#f8fafc', borderColor: hasDording ? '#d97706' : '#cbd5e1' }]}>
                      <View style={[dashStyles.detailShiftBadge, { backgroundColor: hasDording ? '#d97706' : '#64748b' }]}>
                        <Text style={dashStyles.detailShiftBadgeText}>{hasDording ? 'D' : '-'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[dashStyles.detailShiftLabel, { color: '#0f172a' }]}>
                          {hasDording ? 'Penugasan Dording (Shift 2)' : 'Bebas Dinas Sambung'}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 2 }}>
                          {hasDording ? 'Waktu: 13:00 - 21:00 WIB' : 'Tidak ada jadwal shift sambung hari ini.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              <TouchableOpacity
                style={[dashStyles.modalCloseBtnAction, { backgroundColor: theme.accent }]}
                onPress={() => setSelectedDayDetail(null)}
              >
                <Text style={dashStyles.modalCloseBtnText}>Tutup Informasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const dashStyles = StyleSheet.create({
  // ─── Header Personal ───
  headerCard: {
    marginBottom: 16,
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 16.5,
    fontWeight: '800',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Live Clock Box ───
  liveClockBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  bigClockText: {
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  dateSubText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // ─── Hero Card: Presensi Sekarang ───
  heroPresensiCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
        }
      : { elevation: 6 }),
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroStatusBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroBody: {
    marginVertical: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroTodayShiftPill: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroTodayShiftLabel: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroStatusPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroActionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Menu Grid Bersih ───
  menuSectionHeader: {
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  gridMenuContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }
      : { elevation: 2 }),
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ─── Kalender Terpadu Proporsional ───
  calendarCardUnified: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }
      : { elevation: 2 }),
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calendarMainTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  calendarSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 6,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  daysGridUnified: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  dayTileUnified: {
    width: '13.3%',
    height: 52, // Tinggi tetap ideal ~52px
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayTileDordingRing: {
    borderWidth: 1.5,
    borderColor: '#d97706',
  },
  dayCornerNumber: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  shiftCenterLetter: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  dordingBadgeMini: {
    position: 'absolute',
    top: 2,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dordingBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
  },
  legendBoxUnified: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendTitleText: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendChipColor: {
    width: 18,
    height: 18,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendChipLetter: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  legendItemText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // ─── Inline Shift Detail ───
  inlineDetailCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    gap: 6,
  },
  inlineDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineDetailDate: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  inlineDetailShiftName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  inlineDetailCloseBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  inlineDetailDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  inlineDordingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inlineDordingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#d97706',
  },
  inlineDordingText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400e',
  },

  // ─── Footer ───
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }
      : { elevation: 6 }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
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
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailShiftCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailShiftBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailShiftBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  detailShiftLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalCloseBtnAction: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
