import React, { useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SHIFT_TYPES = {
  P: { code: 'P', label: 'Shift Pagi', time: '07:00 - 16:00', color: '#10b981', bg: '#ecfdf5', icon: '', desc: 'Masuk: 07:00 - 08:00 | Pulang: 14:00 - 16:00' },
  S: { code: 'S', label: 'Shift Sore', time: '13:00 - 21:00', color: '#0284c7', bg: '#e0f2fe', icon: '', desc: 'Presensi Masuk s/d 14:00' },
  M: { code: 'M', label: 'Shift Malam', time: '20:30 - 07:30', color: '#8b5cf6', bg: '#f3e8ff', icon: '', desc: 'Jaga Malam Rawat Inap' },
  D: { code: 'D', label: 'Shift Dording', time: '13:00 - 21:00', color: '#f59e0b', bg: '#fef3c7', icon: '', desc: 'Dinas Sambung Berkelanjutan' },
  DM: { code: 'DM', label: 'Dording Malam', time: '19:30 - 08:00', color: '#ea580c', bg: '#ffedd5', icon: '', desc: 'Dinas Sambung Malam' },
  L: { code: 'L', label: 'Libur / Off', time: 'Bebas Tugas', color: '#94a3b8', bg: '#f1f5f9', icon: '', desc: 'Hari Bebas Dinas' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_FULL_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const DARK_THEME = {
  bgMain: '#090d16',
  bgHero: '#0f172a',
  heroGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%)',
  textMain: '#ffffff',
  textSub: '#94a3b8',
  accent: '#38bdf8',
  cardBg: 'rgba(30, 41, 59, 0.7)',
  cardSolid: 'rgba(30, 41, 59, 0.5)',
  border: 'rgba(255, 255, 255, 0.15)',
  pillBg: 'rgba(255,255,255,0.08)',
  cellBg: 'rgba(15, 23, 42, 0.6)',
  overlay: 'rgba(2, 6, 23, 0.8)',
  shadow: 'rgba(0,0,0,0.5)',
};

const LIGHT_THEME = {
  bgMain: '#f1f5f9',
  bgHero: '#ffffff',
  heroGradient: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 50%, #bae6fd 100%)',
  textMain: '#0f172a',
  textSub: '#64748b',
  accent: '#0284c7',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  cardSolid: '#ffffff',
  border: 'rgba(0, 0, 0, 0.08)',
  pillBg: '#e2e8f0',
  cellBg: '#f8fafc',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0,0,0,0.08)',
};

export default function DashboardScreen({ user, currentTime, attendance = {}, dordingAttendance = {}, onNavigate }) {
  const isMasuk = !!attendance?.masuk;
  const isPulang = !!attendance?.pulang;
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const _now = new Date();
  const realtimeDate = DAY_FULL_ID[_now.getDay()] + ', ' + _now.getDate() + ' ' + MONTHS_FULL_ID[_now.getMonth()] + ' ' + _now.getFullYear();

  const _rNow = new Date();
  const _rYear = _rNow.getFullYear();
  const _rMonth = _rNow.getMonth();
  const daysInMonth = new Date(_rYear, _rMonth + 1, 0).getDate();

  const [roster, setRoster] = useState(() => {
    const initial = {};
    for (let day = 1; day <= daysInMonth; day++) {
      if (day % 7 === 0) initial[day] = 'L';
      else if (day % 5 === 0) initial[day] = 'DM';
      else if (day % 4 === 0) initial[day] = 'M';
      else if (day % 3 === 0) initial[day] = 'D';
      else if (day % 2 === 0) initial[day] = 'S';
      else initial[day] = 'P';
    }
    return initial;
  });

  const [fullCalendarVisible, setFullCalendarVisible] = useState(false);
  const [selectedDayView, setSelectedDayView] = useState(null);

  const getDayName = (day) => {
    const now = new Date();
    return DAY_NAMES[new Date(now.getFullYear(), now.getMonth(), day).getDay()];
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Header */}
        <View style={s.heroHeader}>
          <View style={[s.heroHeaderBgBase, { backgroundColor: theme.bgHero }, Platform.OS === 'web' && { backgroundImage: theme.heroGradient }]} />
          <View style={s.headerTop}>
            <View>
              <Text style={[s.greetingText, { color: theme.accent }]}>Halo, Semangat Pagi!</Text>
              <Text style={[s.userNameText, { color: theme.textMain }]}>{user.name}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleBadgeText}>{user.role}</Text>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end', gap: 12 }}>
              {/* Toggle Dark/Light */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDarkMode(!isDarkMode)}
                style={[s.themeToggle, { backgroundColor: theme.pillBg, borderColor: theme.border }]}
              >
                <View style={[s.themeToggleTrack, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
                  <View style={[s.themeToggleThumb, isDarkMode ? s.thumbRight : s.thumbLeft, { backgroundColor: isDarkMode ? '#38bdf8' : '#f59e0b' }]} />
                </View>
                <Text style={[s.themeToggleLabel, { color: theme.textMain }]}>{isDarkMode ? 'Gelap' : 'Terang'}</Text>
              </TouchableOpacity>

              <View style={[s.avatarContainer, { backgroundColor: theme.pillBg, borderColor: theme.border }]}>
                <View style={s.avatarGlow} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.textMain, zIndex: 2 }}>{user.name.charAt(0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={s.contentBody}>
          
          {/* Status Card */}
          <View style={[s.glassCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, Platform.OS === 'web' && { backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px -10px ' + theme.shadow }]}>
            <View style={s.glassCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={s.pulseIndicator} />
                <Text style={[s.cardTitle, { color: theme.textMain }]}>Status Kehadiran</Text>
              </View>
              <View style={[s.timePill, { backgroundColor: theme.pillBg, borderColor: theme.border }]}>
                <Text style={[s.timePillText, { color: theme.textMain }]}>WIB {currentTime || '14:00'}</Text>
              </View>
            </View>

            <View style={[s.dividerGlass, { backgroundColor: theme.border }]} />

            <View style={s.statusContentRow}>
              <View>
                <Text style={[s.statusLabel, { color: theme.textSub }]}>Hari Ini, {realtimeDate}</Text>
                <Text style={[s.statusValue, { color: isPulang ? '#34d399' : isMasuk ? '#38bdf8' : '#fbbf24' }]}>
                  {isPulang ? 'Tuntas' : isMasuk ? 'Sedang Dinas' : 'Belum Absen'}
                </Text>
                <Text style={[s.shiftDetails, { color: theme.textSub }]}>
                  Shift 1: <Text style={{ color: theme.textMain }}>{attendance?.masuk || '--:--'} - {attendance?.pulang || '--:--'}</Text>
                </Text>
              </View>
              
              <TouchableOpacity
                activeOpacity={0.8}
                style={[s.primaryActionBtn, isPulang && { backgroundColor: theme.pillBg }]}
                onPress={() => onNavigate('presensi', 'sekarang')}
              >
                <Text style={[s.primaryActionBtnText, isPulang && { color: theme.textSub }]}>
                  {isPulang ? 'Lihat Detail' : isMasuk ? 'Pulang >' : 'Absen Masuk >'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigasi Cepat */}
          <Text style={[s.sectionHeading, { color: theme.textMain }]}>Navigasi Cepat</Text>
          <View style={s.menuGrid}>
            <MenuButton title="Presensi Masuk" subtitle="Shift 1 / Utama" color="#3b82f6" theme={theme} onPress={() => onNavigate('presensi', 'sekarang')} />
            <MenuButton title="Dinas Dording" subtitle="Shift 2 / Sambung" color="#f59e0b" theme={theme} onPress={() => onNavigate('presensi', 'dording')} />
            <MenuButton title="Riwayat Absen" subtitle="Laporan Kehadiran" color="#10b981" theme={theme} onPress={() => onNavigate('rekap')} />
            <MenuButton title="Dinas Luar" subtitle="Tugas PDT" color="#8b5cf6" theme={theme} onPress={() => onNavigate('pdt')} />
          </View>

          {/* Roster */}
          <View style={[s.darkCard, { backgroundColor: theme.cardSolid, borderColor: theme.border, marginBottom: 40 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={[s.cardTitle, { color: theme.textMain }]}>Jadwal Roster</Text>
                <Text style={[s.subText, { color: theme.textSub }]}>Bulan {MONTHS_FULL_ID[new Date().getMonth()]}</Text>
              </View>
              <TouchableOpacity onPress={() => setFullCalendarVisible(true)} style={s.linkBadge}>
                <Text style={s.linkBadgeText}>Kalender Penuh</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                const isToday = day === new Date().getDate();
                const shiftCode = roster[day] || 'P';
                const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                const dayName = getDayName(day);
                return (
                  <TouchableOpacity
                    key={day}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDayView(day)}
                    style={[s.rosterDayItem, { backgroundColor: theme.cellBg, borderColor: isToday ? '#38bdf8' : theme.border }, isToday && s.rosterDayItemToday]}
                  >
                    <Text style={{ fontSize: 11, color: isToday ? '#38bdf8' : theme.textSub, fontWeight: '600' }}>{dayName}</Text>
                    <Text style={[s.rosterDayNumber, { color: isToday ? '#ffffff' : theme.textMain }]}>{day}</Text>
                    <View style={[s.rosterShiftPill, { backgroundColor: shiftInfo.color }]}>
                      <Text style={s.rosterShiftText}>{shiftCode}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Modal: Full Calendar */}
        <Modal visible={fullCalendarVisible} transparent animationType="fade">
          <View style={[s.modalOverlay, { backgroundColor: theme.overlay }, Platform.OS === 'web' && { backdropFilter: 'blur(8px)' }]}>
            <View style={[s.modalContentGlass, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={[s.modalTitleMain, { color: theme.textMain }]}>Roster Shift</Text>
                  <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>Bulan Ini</Text>
                </View>
                <TouchableOpacity onPress={() => setFullCalendarVisible(false)} style={[s.modalCloseBtn, { backgroundColor: theme.pillBg }]}>
                  <Text style={{ color: theme.textMain, fontSize: 18, fontWeight: 'bold' }}>X</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <View style={s.calendarGrid}>
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
                    const isToday = day === new Date().getDate();
                    const shiftCode = roster[day] || 'P';
                    const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[s.gridCell, { backgroundColor: theme.cellBg, borderColor: theme.border }, isToday && s.gridCellToday]}
                        onPress={() => setSelectedDayView(day)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 10, color: isToday ? '#38bdf8' : theme.textSub, fontWeight: '700' }}>{getDayName(day)}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: isToday ? (isDarkMode ? '#fff' : '#0284c7') : theme.textMain, marginVertical: 4 }}>{day}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: shiftInfo.color }}>{shiftCode}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: Day Detail */}
        <Modal visible={selectedDayView !== null} transparent animationType="fade">
          <View style={[s.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View style={[s.modalDetailGlass, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitleMain, { color: theme.textMain }]}>Detail {selectedDayView} {MONTHS_FULL_ID[new Date().getMonth()].slice(0,3)}</Text>
              </View>
              {selectedDayView && (() => {
                const shiftCode = roster[selectedDayView] || 'P';
                const si = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                return (
                  <View style={{ marginVertical: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[s.bigShiftBadge, { backgroundColor: si.color }]}>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{si.code}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textMain }}>{si.label}</Text>
                        <Text style={{ fontSize: 13, color: theme.textSub, marginTop: 4 }}>Waktu: {si.time}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: theme.pillBg, padding: 14, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 12, color: theme.textMain, lineHeight: 18 }}>{si.desc}</Text>
                    </View>
                  </View>
                );
              })()}
              <TouchableOpacity style={s.modalPrimaryBtn} onPress={() => setSelectedDayView(null)}>
                <Text style={s.modalPrimaryBtnText}>Tutup Detail</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

function MenuButton({ title, subtitle, color, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[s.menuItemWide, { backgroundColor: theme.cardBg, borderColor: theme.border, borderLeftColor: color, borderLeftWidth: 4 }, Platform.OS === 'web' && { boxShadow: '0 4px 12px ' + theme.shadow }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={[s.menuItemTitleWide, { color: theme.textMain }]}>{title}</Text>
      <Text style={[s.menuItemSubWide, { color: theme.textSub }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  heroHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 70,
    position: 'relative',
    overflow: 'hidden',
  },
  heroHeaderBgBase: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: '800',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeToggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  themeToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  thumbLeft: {
    alignSelf: 'flex-start',
  },
  thumbRight: {
    alignSelf: 'flex-end',
  },
  themeToggleLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  avatarGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: '#38bdf8',
    opacity: 0.2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 20px 5px rgba(56, 189, 248, 0.4)',
    } : {}),
  },
  contentBody: {
    paddingHorizontal: 20,
    marginTop: -45,
    zIndex: 10,
  },
  glassCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    marginBottom: 28,
    ...(Platform.OS !== 'web' ? { elevation: 8 } : {}),
  },
  glassCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34d399',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 10px 2px rgba(52, 211, 153, 0.6)',
    } : {}),
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  dividerGlass: {
    height: 1,
    marginVertical: 18,
  },
  statusContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  shiftDetails: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  primaryActionBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 16px rgba(14, 165, 233, 0.3)',
    } : {}),
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  menuItemWide: {
    width: '48%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    ...(Platform.OS !== 'web' ? { elevation: 2 } : {}),
  },
  menuItemTitleWide: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  menuItemSubWide: {
    fontSize: 10,
    fontWeight: '600',
  },
  darkCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  linkBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  linkBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  rosterDayItem: {
    width: 60,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rosterDayItemToday: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  rosterDayNumber: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  rosterShiftPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rosterShiftText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentGlass: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(16px)',
    } : {}),
  },
  modalDetailGlass: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitleMain: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCell: {
    width: '29%',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  gridCellToday: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  bigShiftBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    } : {}),
  },
  modalPrimaryBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
});