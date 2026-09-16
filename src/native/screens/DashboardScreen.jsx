import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../theme';

const SHIFT_TYPES = {
  P: { code: 'P', label: 'Shift Pagi', time: '07:00 - 16:00', color: '#10b981', bg: '#ecfdf5', icon: '🟢', desc: 'Masuk: 07:00 - 08:00 | Pulang: 14:00 - 16:00' },
  S: { code: 'S', label: 'Shift Sore', time: '13:00 - 21:00', color: '#0284c7', bg: '#e0f2fe', icon: '🔵', desc: 'Presensi Masuk s/d 14:00' },
  M: { code: 'M', label: 'Shift Malam', time: '20:30 - 07:30', color: '#8b5cf6', bg: '#f3e8ff', icon: '🟣', desc: 'Jaga Malam Rawat Inap' },
  D: { code: 'D', label: 'Shift Dording', time: '13:00 - 21:00', color: '#f59e0b', bg: '#fef3c7', icon: '🟠', desc: 'Dinas Sambung Berkelanjutan' },
  L: { code: 'L', label: 'Libur / Off', time: 'Bebas Tugas', color: '#94a3b8', bg: '#f1f5f9', icon: '⚪', desc: 'Hari Bebas Dinas' },
};

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_FULL_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function DashboardScreen({ user, currentTime, attendance = {}, dordingAttendance = {}, onNavigate }) {
  const isMasuk = !!attendance?.masuk;
  const isPulang = !!attendance?.pulang;

  // Dynamic realtime date (updates every second via currentTime prop re-render)
  const _now = new Date();
  const realtimeDate = DAY_FULL_ID[_now.getDay()] + ', ' + _now.getDate() + ' ' + MONTHS_FULL_ID[_now.getMonth()] + ' ' + _now.getFullYear();

  // Roster dinamis sesuai bulan & tahun saat ini
  const _rNow = new Date();
  const _rYear = _rNow.getFullYear();
  const _rMonth = _rNow.getMonth(); // 0-indexed
  const daysInMonth = new Date(_rYear, _rMonth + 1, 0).getDate(); // jumlah hari bulan ini

  const [roster, setRoster] = useState(() => {
    const initial = {};
    for (let day = 1; day <= daysInMonth; day++) {
      if (day % 7 === 0) initial[day] = 'L';
      else if (day % 4 === 0) initial[day] = 'M';
      else if (day % 3 === 0) initial[day] = 'D';
      else if (day % 2 === 0) initial[day] = 'S';
      else initial[day] = 'P';
    }
    return initial;
  });

  const [fullCalendarVisible, setFullCalendarVisible] = useState(false);
  const [selectedDayView, setSelectedDayView] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const getDayName = (day) => {
    const now = new Date();
    return DAY_NAMES[new Date(now.getFullYear(), now.getMonth(), day).getDay()];
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        {/* Toast Notification */}
        {toastMessage && (
          <View style={localStyles.toast}>
            <Text style={localStyles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Welcome Banner */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeSmall}>Selamat Datang,</Text>
          <Text style={styles.welcomeName}>{user.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role}</Text>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.date}>🗓️ {realtimeDate}</Text>
            <Text style={styles.clock}>{currentTime || '14:00:00'} WIB</Text>
          </View>
        </View>

        {/* Daily Attendance Status Summary Card */}
        <View style={styles.todayStatusCard}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Status Kehadiran Hari Ini
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: isPulang ? '#047857' : isMasuk ? '#0284c7' : '#d97706', marginTop: 2 }}>
              {isPulang
                ? '✅ Shift 1 Selesai'
                : isMasuk
                ? '⏳ Shift 1 Sedang Bertugas'
                : '⚠️ Shift 1 Belum Absen Masuk'}
              {dordingAttendance?.masuk ? (dordingAttendance?.pulang ? ' • 🟨 Dording Selesai' : ' • 🟨 Dording Aktif') : ''}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 10.5, color: '#475569' }}>
                🟦 Shift 1: <Text style={{ fontWeight: '700' }}>{attendance?.masuk || '--:--'}</Text> s/d <Text style={{ fontWeight: '700' }}>{attendance?.pulang || '--:--'}</Text>
              </Text>
              <Text style={{ fontSize: 10.5, color: '#b45309' }}>
                🟨 Dording (Shift 2): <Text style={{ fontWeight: '700' }}>{dordingAttendance?.masuk || '--:--'}</Text> s/d <Text style={{ fontWeight: '700' }}>{dordingAttendance?.pulang || '--:--'}</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: isPulang ? '#f1f5f9' : '#0284c7',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              alignSelf: 'center',
            }}
            onPress={() => onNavigate('presensi', 'sekarang')}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: isPulang ? '#475569' : '#ffffff' }}>
              {isPulang ? 'Lihat Detail' : isMasuk ? 'Absen Pulang ➔' : 'Absen Shift 1 ➔'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Cards Grid */}
        <View style={styles.cards}>
          <ActionCard
            color="#0284c7"
            icon="🟦"
            title="Presensi (Shift 1)"
            desc="Absen untuk shift pertama (Pagi / Sore / Malam) sesuai urutan langkah 1 & 3."
            badge={attendance?.masuk ? 'Masuk: ' + attendance.masuk : 'Tombol Biru'}
            onPress={() => onNavigate('presensi', 'sekarang')}
          />
          <ActionCard
            color="#d97706"
            icon="🟨"
            title="Presensi Dording (Shift 2)"
            desc="Absen untuk shift kedua (Dording) sesuai urutan langkah 2 & 4."
            badge={dordingAttendance?.masuk ? 'Dording: ' + dordingAttendance.masuk : 'Tombol Kuning'}
            onPress={() => onNavigate('presensi', 'dording')}
          />
          <ActionCard
            color="#e11d48"
            icon="📊"
            title="Rekap Absensi"
            desc="Pantau riwayat presensi harian, persentase kedisiplinan & log shift."
            badge="Statistik 100%"
            onPress={() => onNavigate('rekap')}
          />
          <ActionCard
            color="#334155"
            icon="🚗"
            title="Presensi Luar Tilok (PDT)"
            desc="Pengajuan presensi dinas luar, rujukan pasien, atau tugas eksternal."
            badge="Dinas Luar"
            onPress={() => onNavigate('pdt')}
          />
        </View>

        {/* Shift Roster Calendar Preview (Interactive & Clickable) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.sectionTitle}>🗓️ Jadwal Roster Shift ({MONTHS_FULL_ID[new Date().getMonth()].slice(0,3)} {new Date().getFullYear()})</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: -6, marginBottom: 8 }}>
                🔒 Jadwal Resmi Terkunci • Ketuk tanggal untuk melihat rincian dinas
              </Text>
            </View>
            <TouchableOpacity
              style={localStyles.fullViewButton}
              activeOpacity={0.7}
              onPress={() => setFullCalendarVisible(true)}
            >
              <Text style={localStyles.fullViewText}>📅 Lihat Penuh ↗</Text>
            </TouchableOpacity>
          </View>

          {/* Shift Code Legend */}
          <View style={localStyles.legendRow}>
            {Object.values(SHIFT_TYPES).map((s) => (
              <View key={s.code} style={localStyles.legendItem}>
                <View style={[localStyles.legendDot, { backgroundColor: s.color }]} />
                <Text style={localStyles.legendText}>{s.code} = {s.label.split(' ')[0]}</Text>
              </View>
            ))}
          </View>

          {/* Horizontal Scrollable Day Cards (All 30 Days) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const isToday = day === new Date().getDate();
              const shiftCode = roster[day] || 'P';
              const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
              const dayName = getDayName(day);

              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDayView(day)}
                  style={[
                    styles.day,
                    isToday && styles.today,
                    localStyles.dayClickable,
                  ]}
                >
                  <Text style={{ fontSize: 9.5, color: '#64748b', fontWeight: '600' }}>
                    {dayName}
                  </Text>
                  <Text style={[styles.dayNumber, isToday && { color: '#0284c7' }]}>
                    {day}
                  </Text>
                  <View style={[styles.shift, { backgroundColor: shiftInfo.color }]}>
                    <Text style={styles.shiftText}>{shiftCode}</Text>
                  </View>
                  {isToday ? (
                    <Text style={{ fontSize: 7.5, fontWeight: '800', color: '#0284c7', marginTop: 3 }}>
                      HARI INI
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 3 }}>
                      Ganti ✎
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Modal: Lihat Penuh Kalender Roster Sebulan (1 - 30 Sep 2026) */}
        <Modal visible={fullCalendarVisible} transparent animationType="fade">
          <View style={localStyles.modalBackdrop}>
            <View style={localStyles.calendarCard}>
              {/* Header */}
              <View style={localStyles.modalHeader}>
                <View>
                  <Text style={localStyles.modalTitle}>🗓️ Roster Shift Sebulan Penuh</Text>
                  <Text style={localStyles.modalSub}>
                    September 2026 • 🔒 Mode Lihat Jadwal (Terkunci oleh Admin SIMRS)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setFullCalendarVisible(false)}
                  style={localStyles.closeBtn}
                >
                  <Text style={{ color: '#64748b', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Roster Legend in Modal */}
              <View style={localStyles.modalLegendRow}>
                {Object.values(SHIFT_TYPES).map((s) => (
                  <View key={s.code} style={localStyles.legendItem}>
                    <View style={[localStyles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={localStyles.legendText}>{s.code}: {s.label} ({s.time})</Text>
                  </View>
                ))}
              </View>

              {/* 30-Day Grid (View Only) */}
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={localStyles.calendarGrid}>
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
                    const isToday = day === 6;
                    const shiftCode = roster[day] || 'P';
                    const shiftInfo = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                    const dayName = getDayName(day);

                    return (
                      <TouchableOpacity
                        key={day}
                        activeOpacity={0.75}
                        onPress={() => setSelectedDayView(day)}
                        style={[
                          localStyles.gridCell,
                          isToday && localStyles.gridCellToday,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '700' }}>{dayName}</Text>
                          {isToday && (
                            <View style={localStyles.todayPill}>
                              <Text style={{ color: '#ffffff', fontSize: 7.5, fontWeight: '800' }}>HARI INI</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: isToday ? '#0284c7' : '#0f172a', marginVertical: 2 }}>
                          {day}
                        </Text>
                        <View style={[localStyles.shiftBadge, { backgroundColor: shiftInfo.bg, borderColor: shiftInfo.color }]}>
                          <Text style={[localStyles.shiftBadgeText, { color: shiftInfo.color }]}>
                            {shiftInfo.icon} {shiftCode} - {shiftInfo.label}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                          {shiftInfo.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={localStyles.modalFooter}>
                <TouchableOpacity
                  style={localStyles.primaryCloseBtn}
                  onPress={() => setFullCalendarVisible(false)}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                    Tutup Kalender Roster ✓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Rincian Jadwal Shift Tanggal Terpilih (View-Only / Tidak Bisa Diubah) */}
        <Modal visible={selectedDayView !== null} transparent animationType="fade">
          <View style={localStyles.modalBackdrop}>
            <View style={localStyles.editCard}>
              <View style={localStyles.modalHeader}>
                <View>
                  <Text style={localStyles.modalTitle}>📋 Rincian Jadwal Dinas</Text>
                  <Text style={localStyles.modalSub}>
                    Tanggal {selectedDayView} September 2026 ({selectedDayView ? getDayName(selectedDayView) : ''})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDayView(null)}
                  style={localStyles.closeBtn}
                >
                  <Text style={{ color: '#64748b', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Shift Information Card */}
              {selectedDayView && (() => {
                const shiftCode = roster[selectedDayView] || 'P';
                const s = SHIFT_TYPES[shiftCode] || SHIFT_TYPES.P;
                return (
                  <View style={{ marginVertical: 14 }}>
                    <View
                      style={[
                        localStyles.shiftOptionRow,
                        { borderColor: s.color, backgroundColor: s.bg, padding: 14 },
                      ]}
                    >
                      <View style={[localStyles.shiftOptionBadge, { backgroundColor: s.color, width: 42, height: 42 }]}>
                        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18 }}>{s.code}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                          {s.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: '700' }}>
                          ⏰ Jam Dinas: {s.time}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {s.desc}
                        </Text>
                      </View>
                    </View>

                    {/* Notice bahwa jadwal tidak dapat diubah oleh pegawai */}
                    <View
                      style={{
                        backgroundColor: '#f1f5f9',
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 14,
                        borderLeftWidth: 4,
                        borderLeftColor: '#0284c7',
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#0f172a' }}>
                        🔒 Status Jadwal: Terkunci SIMRS
                      </Text>
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 16 }}>
                        Pegawai hanya memiliki hak akses untuk melihat jadwal. Perubahan atau penyesuaian shift dinas hanya dapat dilakukan oleh Kepala Ruangan / Admin SIMRS RSJ Tampan.
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <TouchableOpacity
                style={localStyles.primaryCloseBtn}
                onPress={() => setSelectedDayView(null)}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                  Tutup Informasi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

function ActionCard({ color, icon, title, desc, badge, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: color }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardDesc}>{desc}</Text>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
            {badge}
          </Text>
        </View>
      </View>
      <Text style={styles.cardArrow}>➔</Text>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  fullViewButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fullViewText: {
    fontSize: 11.5,
    color: '#0284c7',
    fontWeight: '800',
  },
  dayClickable: {
    cursor: 'pointer',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  toast: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
    } : {}),
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
  },
  modalLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '31%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
    cursor: 'pointer',
  },
  gridCellToday: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
  },
  todayPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  shiftBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  shiftBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  modalFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  primaryCloseBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shiftOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 10,
    cursor: 'pointer',
  },
  shiftOptionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
});