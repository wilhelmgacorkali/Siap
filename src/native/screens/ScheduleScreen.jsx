import React, { useState, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DARK_THEME, LIGHT_THEME } from '../theme';
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronRight,
} from '../components/Icons';

const SHIFT_TYPES = {
  P: {
    code: 'P',
    label: 'Shift Pagi',
    time: '07:00 – 16:00 WIB',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#10b981',
    desc: 'Pelayanan operasional reguler rawat inap & poliklinik.',
  },
  S: {
    code: 'S',
    label: 'Shift Sore',
    time: '13:00 – 21:00 WIB',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#38bdf8',
    desc: 'Pelayanan sore & visite lanjutan pasien bangsal.',
  },
  M: {
    code: 'M',
    label: 'Shift Malam',
    time: '20:30 – 07:30 WIB',
    color: '#7c3aed',
    bg: '#f3e8ff',
    border: '#a855f7',
    desc: 'Jaga malam darurat, pengawasan bangsal jiwa & IGD.',
  },
  D: {
    code: 'D',
    label: 'Shift Dording (Dinas Sambung)',
    time: '13:00 – 21:00 WIB',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#f59e0b',
    desc: 'Penugasan dinas sambung/tambahan shift ke-2.',
  },
  C: {
    code: 'C',
    label: 'Cuti Resmi / Izin',
    time: 'Bebas Tugas',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#94a3b8',
    desc: 'Hak cuti tahunan / izin dinas terencana.',
  },
  L: {
    code: 'L',
    label: 'Libur / Off Dinas',
    time: 'Off Kerja',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1',
    desc: 'Hari libur pasca dinas malam atau akhir pekan.',
  },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function ScheduleScreen({
  user,
  onBack,
  currentTime,
  isDarkMode = true,
  theme: propTheme,
}) {
  const theme = propTheme || (isDarkMode ? DARK_THEME : LIGHT_THEME);
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const currentMonthNum = now.getMonth();
  const currentDateNum = now.getDate();
  const daysInMonth = new Date(currentYearNum, currentMonthNum + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYearNum, currentMonthNum, 1).getDay();

  // Selected date state — defaults to today
  const [selectedDay, setSelectedDay] = useState(currentDateNum);

  // Generate deterministic schedule for this user
  const jadwalDinas = useMemo(() => {
    const s = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(currentYearNum, currentMonthNum, d);
      const dow = dt.getDay();
      if (dow === 0 || dow === 6) s[d] = 'L';
      else if (d === 6) s[d] = 'C';
      else if (d === 19) s[d] = 'S';
      else s[d] = 'P';
    }
    return s;
  }, [currentYearNum, currentMonthNum, daysInMonth]);

  const jadwalDording = useMemo(() => {
    const d = {};
    for (let day = 1; day <= daysInMonth; day++) {
      if (day === 3 || day === 12 || day === 17 || day === 26) {
        d[day] = 'D';
      } else {
        d[day] = '-';
      }
    }
    return d;
  }, [daysInMonth]);

  // Statistics
  const shiftCounts = useMemo(() => {
    let pagi = 0, sore = 0, dording = 0, cuti = 0, libur = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = jadwalDinas[d];
      if (s === 'P') pagi++;
      if (s === 'S') sore++;
      if (s === 'C') cuti++;
      if (s === 'L') libur++;
      if (jadwalDording[d] === 'D') dording++;
    }
    return { pagi, sore, dording, cuti, libur };
  }, [jadwalDinas, jadwalDording, daysInMonth]);

  // Selected day details
  const selDateObj = new Date(currentYearNum, currentMonthNum, selectedDay);
  const selDayName = DAY_FULL_ID[selDateObj.getDay()];
  const selShiftCode = jadwalDinas[selectedDay] || 'P';
  const selDordingCode = jadwalDording[selectedDay] || '-';
  const selShift = SHIFT_TYPES[selShiftCode] || SHIFT_TYPES.P;
  const selHasDording = selDordingCode === 'D';

  return (
    <View style={[styles.root, { backgroundColor: theme.bgMain }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. HEADER HALAMAN JADWAL                                         */}
        {/* ================================================================= */}
        <View style={[styles.headerCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={[styles.backBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
            >
              <IconArrowLeft size={16} color={theme.textMain} />
              <Text style={[styles.backBtnText, { color: theme.textMain }]}>Beranda</Text>
            </TouchableOpacity>

            <View style={[styles.badgeUnit, { backgroundColor: theme.pillBg }]}>
              <Text style={[styles.badgeUnitText, { color: theme.accent }]}>
                {user?.unit || 'Instalasi Rawat Inap'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.screenTitle, { color: theme.textMain }]}>
              Jadwal Dinas & Dording
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSub }]}>
              Roster penugasan resmi untuk <Text style={{ fontWeight: '800', color: theme.textMain }}>{user?.name || 'Ners. Fitri Rahmadani, S.Kep'}</Text>
            </Text>
          </View>

          {/* Month Selector */}
          <View style={[styles.monthBanner, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconCalendar size={18} color={theme.accent} />
              <Text style={[styles.monthText, { color: theme.textMain }]}>
                {MONTHS_FULL_ID[currentMonthNum]} {currentYearNum}
              </Text>
            </View>
            <View style={[styles.statusActiveTag, { backgroundColor: '#ecfdf5' }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>Bulan Berjalan</Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. STATISTIK PENUGASAN BULAN INI                                 */}
        {/* ================================================================= */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiChip, { backgroundColor: theme.cardSolid, borderColor: '#10b981' }]}>
            <Text style={[styles.kpiNum, { color: '#059669' }]}>{shiftCounts.pagi}</Text>
            <Text style={[styles.kpiLbl, { color: theme.textSub }]}>Pagi (P)</Text>
          </View>
          <View style={[styles.kpiChip, { backgroundColor: theme.cardSolid, borderColor: '#0284c7' }]}>
            <Text style={[styles.kpiNum, { color: '#0284c7' }]}>{shiftCounts.sore}</Text>
            <Text style={[styles.kpiLbl, { color: theme.textSub }]}>Sore (S)</Text>
          </View>
          <View style={[styles.kpiChip, { backgroundColor: theme.cardSolid, borderColor: '#f59e0b' }]}>
            <Text style={[styles.kpiNum, { color: '#d97706' }]}>{shiftCounts.dording}</Text>
            <Text style={[styles.kpiLbl, { color: theme.textSub }]}>Dording (D)</Text>
          </View>
          <View style={[styles.kpiChip, { backgroundColor: theme.cardSolid, borderColor: '#64748b' }]}>
            <Text style={[styles.kpiNum, { color: '#64748b' }]}>{shiftCounts.libur}</Text>
            <Text style={[styles.kpiLbl, { color: theme.textSub }]}>Libur (L)</Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 3. KALENDER 7 KOLOM INTERAKTIF                                   */}
        {/* ================================================================= */}
        <View style={[styles.calendarCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.calCardHeader}>
            <View>
              <Text style={[styles.calCardTitle, { color: theme.textMain }]}>Kalender Roster Bulanan</Text>
              <Text style={[styles.calCardSub, { color: theme.textMuted }]}>
                Ketuk tanggal untuk melihat rincian jam dinas di bawah
              </Text>
            </View>
          </View>

          {/* Header Nama Hari (Min - Sab) */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map((d, idx) => (
              <View key={`dh-${idx}`} style={styles.dayNameCell}>
                <Text style={[styles.dayNameText, { color: idx === 0 || idx === 6 ? '#ef4444' : theme.textMuted }]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid Tanggal Kalender */}
          <View style={styles.daysGrid}>
            {/* Empty padding for first day */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <View key={`pad-${i}`} style={styles.emptyDayCell} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const shiftCode = jadwalDinas[dayNum] || 'P';
              const dordingCode = jadwalDording[dayNum] || '-';
              const hasDording = dordingCode === 'D';
              const isToday = dayNum === currentDateNum;
              const isSelected = dayNum === selectedDay;
              const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDay(dayNum)}
                  style={[
                    styles.dayTile,
                    {
                      backgroundColor: shiftInfo.bg,
                      borderColor: isSelected
                        ? theme.accent
                        : isToday
                        ? '#0284c7'
                        : shiftInfo.border,
                      borderWidth: isSelected ? 2.5 : isToday ? 2 : 1,
                    },
                    isSelected && { transform: [{ scale: 1.04 }] },
                  ]}
                >
                  <View style={styles.dayTileTopRow}>
                    <Text
                      style={[
                        styles.dayNumText,
                        { color: isSelected || isToday ? theme.accent : '#0f172a', fontWeight: isSelected || isToday ? '900' : '700' },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasDording && (
                      <View style={styles.dordingBadge}>
                        <Text style={styles.dordingBadgeText}>D</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.shiftLetterText, { color: shiftInfo.color }]}>
                    {shiftCode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legenda Keterangan Shift */}
          <View style={[styles.legendBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
            <Text style={[styles.legendTitle, { color: theme.textMain }]}>Keterangan Simbol:</Text>
            <View style={styles.legendGrid}>
              {Object.values(SHIFT_TYPES).map((s) => (
                <View key={s.code} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: s.color }]}>
                    <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900' }}>{s.code}</Text>
                  </View>
                  <Text style={[styles.legendItemText, { color: theme.textSub }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 4. KARTU DETAIL SHIFT TANGGAL TERPILIH (LIVE INLINE DISPLAY)      */}
        {/* ================================================================= */}
        <View style={[styles.detailCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
          <View style={styles.detailCardHeader}>
            <View>
              <Text style={[styles.detailDateText, { color: theme.textMain }]}>
                {selDayName}, {selectedDay} {MONTHS_FULL_ID[currentMonthNum]} {currentYearNum}
              </Text>
              <Text style={[styles.detailDateSub, { color: theme.textMuted }]}>
                {selectedDay === currentDateNum ? '📌 Tanggal Hari Ini' : 'Rincian Penugasan Dinas'}
              </Text>
            </View>

            <View style={[styles.shiftCodePill, { backgroundColor: selShift.color }]}>
              <Text style={styles.shiftCodePillText}>Kode: {selShift.code}</Text>
            </View>
          </View>

          {/* Rincian Shift Utama */}
          <View style={[styles.shiftDetailBox, { backgroundColor: selShift.bg, borderColor: selShift.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconClock size={20} color={selShift.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.shiftDetailTitle, { color: '#0f172a' }]}>{selShift.label}</Text>
                <Text style={styles.shiftDetailTime}>Jam Kerja: {selShift.time}</Text>
              </View>
            </View>
            <Text style={styles.shiftDetailDesc}>{selShift.desc}</Text>
          </View>

          {/* Rincian Dording */}
          <View
            style={[
              styles.dordingDetailBox,
              {
                backgroundColor: selHasDording ? '#fef3c7' : theme.pillBg,
                borderColor: selHasDording ? '#f59e0b' : theme.borderSubtle,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  styles.dordingStatusCircle,
                  { backgroundColor: selHasDording ? '#d97706' : '#94a3b8' },
                ]}
              >
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>
                  {selHasDording ? 'D' : '—'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.dordingTitle,
                    { color: selHasDording ? '#92400e' : theme.textMain },
                  ]}
                >
                  {selHasDording ? 'Dinas Sambung (Dording Aktif)' : 'Bebas Tugas Dinas Sambung'}
                </Text>
                <Text
                  style={[
                    styles.dordingSub,
                    { color: selHasDording ? '#b45309' : theme.textSub },
                  ]}
                >
                  {selHasDording
                    ? 'Waktu Tugas: 13:00 – 21:00 WIB (Shift ke-2)'
                    : 'Tidak ada jadwal penugasan dinas sambung untuk tanggal ini.'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  badgeUnit: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeUnitText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  screenTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  monthBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusActiveTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // KPI Chips
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  kpiChip: {
    flex: 1,
    minWidth: 70,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLbl: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  // Calendar
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  calCardHeader: {
    marginBottom: 12,
  },
  calCardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  calCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 54,
  },
  dayTile: {
    width: `${100 / 7}%`,
    height: 54,
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayTileTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNumText: {
    fontSize: 12,
  },
  dordingBadge: {
    backgroundColor: '#d97706',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dordingBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  shiftLetterText: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },

  // Legend
  legendBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItemText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Detail Card
  detailCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailDateText: {
    fontSize: 15,
    fontWeight: '900',
  },
  detailDateSub: {
    fontSize: 12,
    marginTop: 1,
  },
  shiftCodePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftCodePillText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  shiftDetailBox: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    gap: 6,
  },
  shiftDetailTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  shiftDetailTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  shiftDetailDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 17,
  },
  dordingDetailBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  dordingStatusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dordingTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  dordingSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
