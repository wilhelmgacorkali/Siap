import React, { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../theme';
import { generateBiometricPhoto } from '../biometricPhoto';

export function ReportsScreen({ user, attendance = {}, onBack, currentTime, isDarkMode = true, theme }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reguler' | 'dording' | 'late'
  const [selectedProofLog, setSelectedProofLog] = useState(null);
  const [selectedPhotoTab, setSelectedPhotoTab] = useState('masuk'); // 'masuk' | 'pulang'
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [livePeriod, setLivePeriod] = useState('');
  const [liveDuration, setLiveDuration] = useState('');
  const [pulseAnim, setPulseAnim] = useState(true);

  // Realtime clock + date ticker
  useEffect(() => {
    const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const MONTHS_FULL_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const tick = () => {
      const now = new Date();
      // Jam
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setLiveTime(`${h}:${m}:${s}`);

      // Tanggal realtime — contoh: "Kamis, 11 Sep 2026"
      const dayName = DAYS_ID[now.getDay()];
      const dateNum = now.getDate();
      const monthShort = MONTHS_ID[now.getMonth()];
      const monthFull = MONTHS_FULL_ID[now.getMonth()];
      const year = now.getFullYear();
      setLiveDate(`${dayName}, ${dateNum} ${monthShort} ${year}`);
      setLivePeriod(`${monthFull} ${year}`);

      // Durasi kerja live
      const masukTime = attendance?.sekarang?.masuk || attendance?.dording?.masuk;
      if (masukTime && !attendance?.sekarang?.pulang && !attendance?.dording?.pulang) {
        const [mh, mm, ms] = masukTime.split(':').map(Number);
        const masukDate = new Date();
        masukDate.setHours(mh, mm, ms || 0, 0);
        const diffMs = now - masukDate;
        if (diffMs > 0) {
          const totalSec = Math.floor(diffMs / 1000);
          const dh = Math.floor(totalSec / 3600);
          const dm = Math.floor((totalSec % 3600) / 60);
          const ds = totalSec % 60;
          setLiveDuration(`${String(dh).padStart(2,'0')}:${String(dm).padStart(2,'0')}:${String(ds).padStart(2,'00')}`);
        }
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attendance]);

  // Pulse dot blink effect
  useEffect(() => {
    const blink = setInterval(() => setPulseAnim(p => !p), 800);
    return () => clearInterval(blink);
  }, []);

  // Today's real live attendance entries from user's current session
  const todayEntries = [];
  if (attendance?.sekarang?.masuk || attendance?.sekarang?.pulang) {
    const masukPhoto = attendance.sekarang?.masukPhoto || (attendance.sekarang?.masuk ? generateBiometricPhoto({
      user,
      type: 'masuk',
      time: attendance.sekarang.masuk,
      date: liveDate || 'Hari Ini',
      matchScore: '99.4%',
      isDording: false,
    }) : null);

    const pulangPhoto = attendance.sekarang?.pulangPhoto || (attendance.sekarang?.pulang ? generateBiometricPhoto({
      user,
      type: 'pulang',
      time: attendance.sekarang.pulang,
      date: liveDate || 'Hari Ini',
      matchScore: '99.2%',
      isDording: false,
    }) : null);

    todayEntries.push({
      id: 'today-sekarang',
      date: liveDate || '— Hari Ini',
      shift: 'Shift Pagi (Reguler)',
      type: 'reguler',
      masuk: attendance.sekarang.masuk || 'Belum Masuk',
      pulang: attendance.sekarang.pulang || 'Belum Pulang',
      status: attendance.sekarang.masukScore?.text || 'Tepat Waktu (100%)',
      percentage: attendance.sekarang.masukScore?.percentage || 100,
      color: attendance.sekarang.masukScore?.color || '#059669',
      bg: attendance.sekarang.masukScore?.bg || attendance.sekarang.masukScore?.badgeBg || '#ecfdf5',
      photo: masukPhoto,
      pulangPhoto: pulangPhoto,
      location: 'RSJ Tampan - Gedung Instalasi',
      coords: '0.4738° N, 101.3826° E',
      distance: '14 meter (Dalam Radius Tilok)',
      match: '99.4%',
      isToday: true,
    });
  }

  if (attendance?.dording?.masuk || attendance?.dording?.pulang) {
    const dMasukPhoto = attendance.dording?.masukPhoto || (attendance.dording?.masuk ? generateBiometricPhoto({
      user,
      type: 'masuk',
      time: attendance.dording.masuk,
      date: `${liveDate || 'Hari Ini'} (Dording)`,
      matchScore: '99.4%',
      isDording: true,
    }) : null);

    const dPulangPhoto = attendance.dording?.pulangPhoto || (attendance.dording?.pulang ? generateBiometricPhoto({
      user,
      type: 'pulang',
      time: attendance.dording.pulang,
      date: `${liveDate || 'Hari Ini'} (Dording)`,
      matchScore: '99.2%',
      isDording: true,
    }) : null);

    todayEntries.push({
      id: 'today-dording',
      date: `${liveDate || 'Hari Ini'} (Dording)`,
      shift: 'Shift Dording (Dinas Siang)',
      type: 'dording',
      masuk: attendance.dording.masuk || 'Belum Masuk',
      pulang: attendance.dording.pulang || 'Belum Pulang',
      status: attendance.dording.masukScore?.text || 'Shift Dording (100%)',
      percentage: attendance.dording.masukScore?.percentage || 100,
      color: attendance.dording.masukScore?.color || '#0284c7',
      bg: attendance.dording.masukScore?.bg || attendance.dording.masukScore?.badgeBg || '#e0f2fe',
      photo: dMasukPhoto,
      pulangPhoto: dPulangPhoto,
      location: 'RSJ Tampan - Ruang Rawat Inap',
      coords: '0.4738° N, 101.3826° E',
      distance: '14 meter (Dalam Radius Tilok)',
      match: '99.4%',
      isToday: true,
    });
  }

  if (attendance?.pdt?.masuk || attendance?.pdt?.pulang) {
    todayEntries.push({
      id: 'today-pdt',
      date: `${liveDate || 'Hari Ini'} (PDT)`,
      shift: 'Presensi Luar Tilok (PDT)',
      type: 'pdt',
      masuk: attendance.pdt.masuk || '—',
      pulang: attendance.pdt.pulang || '—',
      status: attendance.pdt.masukScore?.label || 'Dinas Luar (100%)',
      percentage: 100,
      color: '#c2410c',
      bg: '#fff7ed',
      photo: attendance.pdt.masukPhoto || (attendance.pdt.masuk ? generateBiometricPhoto({
        user,
        type: 'masuk',
        time: attendance.pdt.masuk,
        date: `${liveDate || 'Hari Ini'} (PDT)`,
        location: 'Luar Tilok (Penugasan SIMRS)',
      }) : null),
      pulangPhoto: attendance.pdt.pulangPhoto,
      location: 'Penugasan Luar Tilok Resmi',
      coords: '0.465791° N, 101.381957° E',
      distance: 'Terverifikasi PDT',
      match: '99.1%',
      isToday: true,
    });
  }

  // Historical verified logs from SIMRS database with verified biometric photos for current month
  const pastLogs = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthIndex = now.getMonth();
    const curDate = now.getDate();
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const monthShort = MONTHS_SHORT[curMonthIndex];

    const makeDateStr = (dayNum) => `${dayNum} ${monthShort} ${curYear}`;

    // Riwayat dinas 5 hari kerja sebelumnya di bulan ini
    const d5 = Math.max(1, curDate - 1);
    const d4 = Math.max(1, curDate - 2);
    const d3 = Math.max(1, curDate - 3);
    const d2 = Math.max(1, curDate - 4);
    const d1 = Math.max(1, curDate - 5);

    return [
      {
        id: 'log-5',
        date: makeDateStr(d5),
        shift: 'Shift Pagi (P)',
        type: 'reguler',
        masuk: '06:55:12',
        pulang: '16:05:30',
        status: 'Tepat Waktu (100%)',
        percentage: 100,
        color: '#059669',
        bg: '#ecfdf5',
        photo: generateBiometricPhoto({ user, type: 'masuk', time: '06:55:12', date: makeDateStr(d5), matchScore: '99.2%' }),
        pulangPhoto: generateBiometricPhoto({ user, type: 'pulang', time: '16:05:30', date: makeDateStr(d5), matchScore: '99.4%' }),
        location: 'RSJ Tampan - Gedung Instalasi',
        coords: '0.4738° N, 101.3826° E',
        distance: '12 meter (Valid)',
        match: '99.2%',
      },
      {
        id: 'log-4',
        date: makeDateStr(d4),
        shift: 'Shift Sore (S)',
        type: 'reguler',
        masuk: '13:58:20',
        pulang: '20:10:45',
        status: 'Tepat Waktu (100%)',
        percentage: 100,
        color: '#059669',
        bg: '#ecfdf5',
        photo: generateBiometricPhoto({ user, type: 'masuk', time: '13:58:20', date: makeDateStr(d4), matchScore: '99.5%' }),
        pulangPhoto: generateBiometricPhoto({ user, type: 'pulang', time: '20:10:45', date: makeDateStr(d4), matchScore: '99.3%' }),
        location: 'RSJ Tampan - Gedung IGD Jiwa',
        coords: '0.4738° N, 101.3826° E',
        distance: '18 meter (Valid)',
        match: '99.5%',
      },
      {
        id: 'log-3',
        date: makeDateStr(d3),
        shift: 'Shift Sore (S)',
        type: 'reguler',
        masuk: '14:14:10',
        pulang: '20:05:00',
        status: 'Terlambat 14m (85%)',
        percentage: 85,
        color: '#d97706',
        bg: '#fffbeb',
        photo: generateBiometricPhoto({ user, type: 'masuk', time: '14:14:10', date: makeDateStr(d3), matchScore: '98.8%' }),
        pulangPhoto: generateBiometricPhoto({ user, type: 'pulang', time: '20:05:00', date: makeDateStr(d3), matchScore: '99.1%' }),
        location: 'RSJ Tampan - Poliklinik Jiwa',
        coords: '0.4738° N, 101.3826° E',
        distance: '21 meter (Valid)',
        match: '98.8%',
      },
      {
        id: 'log-2',
        date: makeDateStr(d2),
        shift: 'Shift Dording (D)',
        type: 'dording',
        masuk: '13:45:00',
        pulang: '20:30:10',
        status: 'Lembur Dording (100%)',
        percentage: 100,
        color: '#0284c7',
        bg: '#e0f2fe',
        photo: generateBiometricPhoto({ user, type: 'masuk', time: '13:45:00', date: makeDateStr(d2), matchScore: '99.1%', isDording: true }),
        pulangPhoto: generateBiometricPhoto({ user, type: 'pulang', time: '20:30:10', date: makeDateStr(d2), matchScore: '99.0%', isDording: true }),
        location: 'RSJ Tampan - Rawat Inap Kenanga',
        coords: '0.4738° N, 101.3826° E',
        distance: '15 meter (Valid)',
        match: '99.1%',
      },
      {
        id: 'log-1',
        date: makeDateStr(d1),
        shift: 'Shift Pagi (P)',
        type: 'reguler',
        masuk: '06:58:40',
        pulang: '16:02:15',
        status: 'Tepat Waktu (100%)',
        percentage: 100,
        color: '#059669',
        bg: '#ecfdf5',
        photo: generateBiometricPhoto({ user, type: 'masuk', time: '06:58:40', date: makeDateStr(d1), matchScore: '99.6%' }),
        pulangPhoto: generateBiometricPhoto({ user, type: 'pulang', time: '16:02:15', date: makeDateStr(d1), matchScore: '99.5%' }),
        location: 'RSJ Tampan - Gedung Instalasi',
        coords: '0.4738° N, 101.3826° E',
        distance: '16 meter (Valid)',
        match: '99.6%',
      },
    ];
  }, [user]);

  const allLogs = [...todayEntries, ...pastLogs];

  const filteredLogs = allLogs.filter((log) => {
    if (activeFilter === 'reguler') return log.type === 'reguler';
    if (activeFilter === 'dording') return log.type === 'dording';
    if (activeFilter === 'late') return log.percentage < 100;
    return true;
  });

  // Calculate dynamic KPIs
  const totalHadir = allLogs.length;
  const avgDisiplin = Math.round(
    allLogs.reduce((acc, curr) => acc + curr.percentage, 0) / (allLogs.length || 1)
  );
  const totalDording = allLogs.filter((l) => l.type === 'dording').length;

  const handleExport = () => {
    Alert.alert(
      'Ekspor Rekapitulasi Berhasil!',
      `Laporan Rekap Absensi Pegawai (${user?.name || 'Pegawai'}) Periode ${livePeriod || 'Bulan Ini'} berhasil dibuat dan siap diunduh dalam format PDF/Excel.`
    );
  };

  return (
    <ScrollView style={[styles.scroll, theme && { backgroundColor: theme.bgMain }]} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Rekapitulasi Absensi Pegawai</Text>
              <Text style={styles.bannerSub}>
                Periode {livePeriod || 'Bulan Ini'} • {user?.name || 'Ners. Fitri Rahmadani, S.Kep'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleExport}
              style={reportStyles.exportBtn}
              activeOpacity={0.75}
            >
              <Text style={reportStyles.exportBtnText}>Unduh PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Live Realtime Clock */}
          <View style={reportStyles.realtimeBanner}>
            <View style={[reportStyles.pulseDot, { opacity: pulseAnim ? 1 : 0.2 }]} />
            <Text style={reportStyles.realtimeLabel}>LIVE</Text>
            <Text style={reportStyles.realtimeClock}>{liveTime || currentTime || '--:--:--'}</Text>
            <Text style={reportStyles.realtimeSep}>•</Text>
            <Text style={reportStyles.realtimeDateTxt}>
              {liveDate || '—'}
            </Text>
          </View>

          {/* Live Duration Strip (only shown if clocked in & not clocked out) */}
          {liveDuration ? (
            <View style={reportStyles.durationStrip}>
              <Text style={reportStyles.durationLabel}>Durasi Kerja Hari Ini</Text>
              <Text style={reportStyles.durationValue}>{liveDuration}</Text>
            </View>
          ) : null}
        </View>

        {/* Live Attendance Alert Banner (If today has attendance) */}
        {todayEntries.length > 0 && (
          <View style={reportStyles.liveAlertCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[reportStyles.pulseDot, { opacity: pulseAnim ? 1 : 0.2 }]} />
              <Text style={reportStyles.liveAlertTitle}>Presensi Hari Ini — Sinkron SIMRS</Text>
            </View>
            <Text style={reportStyles.liveAlertDesc}>
              {todayEntries.length} log presensi biometrik tersinkronisasi • Jam sekarang: <Text style={{ fontWeight: '800', color: '#065f46' }}>{liveTime}</Text>
            </Text>
          </View>
        )}

        {/* 3 KPI Summary Cards (Dynamic) */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={reportStyles.kpiCard}>
            <Text style={[reportStyles.kpiNum, { color: '#0284c7' }]}>{totalHadir}</Text>
            <Text style={reportStyles.kpiLabel}>Total Hadir</Text>
          </View>
          <View style={reportStyles.kpiCard}>
            <Text style={[reportStyles.kpiNum, { color: avgDisiplin >= 90 ? '#059669' : '#d97706' }]}>
              {avgDisiplin}%
            </Text>
            <Text style={reportStyles.kpiLabel}>Rata-rata Disiplin</Text>
          </View>
          <View style={reportStyles.kpiCard}>
            <Text style={[reportStyles.kpiNum, { color: '#f59e0b' }]}>{totalDording}</Text>
            <Text style={reportStyles.kpiLabel}>Dinas Dording</Text>
          </View>
        </View>

        {/* Filter Category Chips */}
        <View style={reportStyles.filterWrap}>
          {[
            { id: 'all', label: `Semua (${allLogs.length})` },
            { id: 'reguler', label: 'Shift Reguler' },
            { id: 'dording', label: `Dording (${totalDording})` },
            { id: 'late', label: 'Terlambat' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[
                reportStyles.filterChip,
                activeFilter === f.id && reportStyles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  reportStyles.filterChipText,
                  activeFilter === f.id && reportStyles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log History */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Riwayat Absensi Terverifikasi</Text>
            <Text style={{ fontSize: 11, color: '#64748b' }}>Ketuk baris untuk bukti foto</Text>
          </View>

          {filteredLogs.map((log) => (
            <View
              key={log.id}
              style={[
                reportStyles.logCard,
                log.isToday && reportStyles.logCardToday,
              ]}
            >
              {/* Header: Tanggal & Badge Status */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0f172a' }}>
                    {log.date}
                  </Text>
                  {log.isToday && (
                    <View style={reportStyles.todayBadge}>
                      <Text style={reportStyles.todayBadgeText}>HARI INI</Text>
                    </View>
                  )}
                </View>
                <View style={{ backgroundColor: log.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: log.color }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: log.color }}>
                    {log.status}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                {log.shift} • Masuk: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{log.masuk}</Text> | Pulang: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{log.pulang}</Text>
              </Text>

              {/* Thumbnails Foto Bukti Presensi Masuk & Pulang */}
              <View style={reportStyles.thumbnailsRow}>
                {/* Thumbnail Masuk */}
                {log.photo ? (
                  <TouchableOpacity
                    style={reportStyles.thumbCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedProofLog(log);
                      setSelectedPhotoTab('masuk');
                    }}
                  >
                    <Image source={{ uri: log.photo }} style={reportStyles.thumbImage} />
                    <View style={reportStyles.thumbOverlay}>
                      <Text style={reportStyles.thumbBadgeMasuk}>MASUK</Text>
                    </View>
                    <View style={reportStyles.thumbVerifiedDot} />
                  </TouchableOpacity>
                ) : (
                  <View style={reportStyles.thumbPendingCard}>
                    <Text style={reportStyles.thumbPendingIcon}>📷</Text>
                    <Text style={reportStyles.thumbPendingText}>Belum Ada</Text>
                  </View>
                )}

                {/* Thumbnail Pulang */}
                {log.pulangPhoto ? (
                  <TouchableOpacity
                    style={reportStyles.thumbCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedProofLog(log);
                      setSelectedPhotoTab('pulang');
                    }}
                  >
                    <Image source={{ uri: log.pulangPhoto }} style={reportStyles.thumbImage} />
                    <View style={reportStyles.thumbOverlay}>
                      <Text style={reportStyles.thumbBadgePulang}>PULANG</Text>
                    </View>
                    <View style={[reportStyles.thumbVerifiedDot, { backgroundColor: '#38bdf8' }]} />
                  </TouchableOpacity>
                ) : (
                  <View style={reportStyles.thumbPendingCard}>
                    <Text style={reportStyles.thumbPendingIcon}>🕒</Text>
                    <Text style={reportStyles.thumbPendingText}>
                      {log.pulang && log.pulang !== 'Belum Pulang' ? log.pulang : 'Belum Pulang'}
                    </Text>
                  </View>
                )}

                {/* Info Text & Quick Trigger */}
                <View style={reportStyles.thumbInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>
                      ✓ Bukti Foto Wajah Sah
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }} numberOfLines={1}>
                    {log.location}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProofLog(log);
                      setSelectedPhotoTab('masuk');
                    }}
                    style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Text style={{ fontSize: 10.5, color: '#0284c7', fontWeight: '800' }}>
                      🔍 Perbesar Foto Bukti →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card Footer with GPS & Details Trigger */}
              <View style={reportStyles.cardFooter}>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  Akurasi: {log.distance} • Match {log.match}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProofLog(log);
                    setSelectedPhotoTab('masuk');
                  }}
                  style={reportStyles.proofPill}
                >
                  <Text style={reportStyles.proofPillText}>
                    Detail Log Biometrik
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Modal: Detail Verifikasi Bukti Biometrik Wajah & GPS */}
        <Modal visible={selectedProofLog !== null} transparent animationType="fade">
          <View style={reportStyles.modalBackdrop}>
            <View style={reportStyles.proofModalCard}>
              <View style={reportStyles.modalHeader}>
                <View>
                  <Text style={reportStyles.modalTitle}>Bukti Verifikasi Presensi Biometrik</Text>
                  <Text style={reportStyles.modalSub}>
                    {selectedProofLog?.date} • {selectedProofLog?.shift}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedProofLog(null)}
                  style={reportStyles.closeBtn}
                >
                  <Text style={{ color: '#64748b', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                {/* Photo Tab Selector (Masuk vs Pulang) */}
                <View style={reportStyles.modalPhotoTabs}>
                  <TouchableOpacity
                    style={[
                      reportStyles.modalPhotoTabBtn,
                      selectedPhotoTab === 'masuk' && reportStyles.modalPhotoTabBtnActive,
                    ]}
                    onPress={() => setSelectedPhotoTab('masuk')}
                  >
                    <Text
                      style={[
                        reportStyles.modalPhotoTabText,
                        selectedPhotoTab === 'masuk' && reportStyles.modalPhotoTabTextActive,
                      ]}
                    >
                      📸 Foto Masuk ({selectedProofLog?.masuk || '—'})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      reportStyles.modalPhotoTabBtn,
                      selectedPhotoTab === 'pulang' && reportStyles.modalPhotoTabBtnActive,
                    ]}
                    onPress={() => setSelectedPhotoTab('pulang')}
                  >
                    <Text
                      style={[
                        reportStyles.modalPhotoTabText,
                        selectedPhotoTab === 'pulang' && reportStyles.modalPhotoTabTextActive,
                      ]}
                    >
                      📸 Foto Pulang ({selectedProofLog?.pulang !== 'Belum Pulang' ? (selectedProofLog?.pulang || '—') : 'Belum Pulang'})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Active Photo Viewport */}
                {(() => {
                  const currentPhoto = selectedPhotoTab === 'pulang'
                    ? (selectedProofLog?.pulangPhoto || (selectedProofLog?.pulang !== 'Belum Pulang' ? selectedProofLog?.photo : null))
                    : (selectedProofLog?.photo || selectedProofLog?.pulangPhoto);

                  if (currentPhoto) {
                    return (
                      <View style={reportStyles.photoWrap}>
                        <Image
                          source={{ uri: currentPhoto }}
                          style={reportStyles.proofImage}
                        />
                        <View style={reportStyles.watermarkOverlay}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 12 }}>
                            <Text style={reportStyles.watermarkText}>
                              TERVERIFIKASI BIOMETRIK RSJ TAMPAN
                            </Text>
                            <View style={{ backgroundColor: selectedPhotoTab === 'pulang' ? '#0284c7' : '#059669', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#ffffff', fontSize: 9.5, fontWeight: '800' }}>
                                {selectedPhotoTab === 'pulang' ? 'FOTO PULANG' : 'FOTO MASUK'}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ color: '#e2e8f0', fontSize: 10, marginTop: 2, paddingHorizontal: 12 }}>
                            Waktu: {selectedPhotoTab === 'pulang' ? selectedProofLog?.pulang : selectedProofLog?.masuk} WIB • Match: {selectedProofLog?.match}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View style={reportStyles.simulatedPhotoWrap}>
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0f172a', marginTop: 6 }}>
                        Belum Ada Foto Presensi Pulang
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 }}>
                        Pegawai belum melakukan presensi pulang hari ini.
                      </Text>
                    </View>
                  );
                })()}

                {/* Detailed Table Fields */}
                <View style={reportStyles.detailsTable}>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Nama Pegawai:</Text>
                    <Text style={reportStyles.tableVal}>{user?.name || 'Ners. Fitri Rahmadani, S.Kep'}</Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>NIP:</Text>
                    <Text style={reportStyles.tableVal}>{user?.nip || '19890412 201402 2 003'}</Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Waktu Masuk:</Text>
                    <Text style={[reportStyles.tableVal, { fontWeight: '800', color: '#059669' }]}>
                      {selectedProofLog?.masuk} WIB
                    </Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Waktu Pulang:</Text>
                    <Text style={[reportStyles.tableVal, { fontWeight: '800', color: '#0284c7' }]}>
                      {selectedProofLog?.pulang} {selectedProofLog?.pulang !== 'Belum Pulang' ? 'WIB' : ''}
                    </Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Nilai Presensi:</Text>
                    <Text style={[reportStyles.tableVal, { fontWeight: '800', color: selectedProofLog?.color }]}>
                      {selectedProofLog?.status}
                    </Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Titik Lokasi (Tilok):</Text>
                    <Text style={reportStyles.tableVal}>{selectedProofLog?.location}</Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Koordinat GPS:</Text>
                    <Text style={reportStyles.tableVal}>{selectedProofLog?.coords}</Text>
                  </View>
                  <View style={reportStyles.tableRow}>
                    <Text style={reportStyles.tableLabel}>Akurasi Geofence:</Text>
                    <Text style={[reportStyles.tableVal, { color: '#059669', fontWeight: '700' }]}>
                      {selectedProofLog?.distance}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={reportStyles.modalActions}>
                <TouchableOpacity
                  style={reportStyles.printSlipBtn}
                  onPress={() => {
                    Alert.alert(
                      'Slip Presensi Resmi',
                      `Slip Kehadiran tanggal ${selectedProofLog?.date} berhasil diproses untuk arsip kepegawaian RSJ Tampan.`
                    );
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12.5 }}>
                    Cetak Slip Bukti
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={reportStyles.closeModalBtn}
                  onPress={() => setSelectedProofLog(null)}
                >
                  <Text style={{ color: '#475569', fontWeight: '700', fontSize: 12.5 }}>
                    Tutup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 }]}
          onPress={onBack}
        >
          <Text style={{ color: '#334155', fontWeight: '800', fontSize: 13.5 }}>← Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const reportStyles = StyleSheet.create({
  exportBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  // Realtime clock bar inside banner
  realtimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  realtimeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 1,
  },
  realtimeClock: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  realtimeSep: {
    fontSize: 12,
    color: '#94a3b8',
  },
  realtimeDateTxt: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  durationStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  durationValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#b45309',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  liveAlertCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  liveAlertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065f46',
  },
  liveAlertDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  logCard: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    cursor: 'pointer',
  },
  logCardToday: {
    borderColor: '#0284c7',
    borderWidth: 1.5,
    backgroundColor: '#f8fafc',
  },
  todayBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  thumbCard: {
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#0f172a',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  thumbBadgeMasuk: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  thumbBadgePulang: {
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  thumbVerifiedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  thumbPendingCard: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  thumbPendingIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  thumbPendingText: {
    fontSize: 8.5,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  thumbInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  proofPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proofPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  proofModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35)',
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
    fontSize: 14.5,
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
  },
  modalPhotoTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalPhotoTabBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPhotoTabBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  modalPhotoTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  modalPhotoTabTextActive: {
    color: '#ffffff',
  },
  photoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#000000',
  },
  proofImage: {
    width: '100%',
    height: 240,
    resizeMode: 'contain',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  watermarkText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simulatedPhotoWrap: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  detailsTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableLabel: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
  },
  tableVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1.4,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  printSlipBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
});

export function PdtScreen({ onBack, onDone }) {
  const [lokasi, setLokasi] = useState('Dinas Kesehatan Provinsi Riau');
  const [keperluan, setKeperluan] = useState('Koordinasi Layanan Rujukan Jiwa Terpadu');
  const [history, setHistory] = useState([
    {
      tujuan: 'RSUD Arifin Achmad Riau',
      tanggal: '28 Agu 2026',
      status: 'Disetujui SIMRS',
      color: '#059669',
      bg: '#ecfdf5',
    },
  ]);

  const handleKirim = () => {
    if (!lokasi.trim()) {
      Alert.alert('Peringatan', 'Harap isi lokasi tugas luar tilok!');
      return;
    }
    const MONTHS_PDT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const nowPdt = new Date();
    const tanggalHariIni = `${nowPdt.getDate()} ${MONTHS_PDT[nowPdt.getMonth()]} ${nowPdt.getFullYear()}`;
    const newEntry = {
      tujuan: lokasi,
      tanggal: tanggalHariIni,
      status: 'Menunggu Review Admin',
      color: '#d97706',
      bg: '#fffbeb',
    };
    setHistory([newEntry, ...history]);
    Alert.alert('Berhasil', 'Pengajuan Presensi Luar Tilok (PDT) berhasil dikirimkan ke SIMRS!');
    if (onDone) onDone();
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Formulir Presensi Luar Tilok (PDT)</Text>
          <Text style={styles.bannerSub}>Pengajuan kehadiran saat dinas luar, rujukan atau tugas eksternal.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Lokasi Penugasan / Instansi Tujuan</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Dinkes Prov Riau"
              value={lokasi}
              onChangeText={setLokasi}
            />
          </View>

          <Text style={styles.label}>Keperluan / Uraian Tugas</Text>
          <View style={[styles.inputWrap, { height: 72, alignItems: 'flex-start', paddingTop: 8 }]}>
            <TextInput
              style={[styles.input, { height: 56 }]}
              multiline
              placeholder="Jelaskan agenda dinas luar Anda..."
              value={keperluan}
              onChangeText={setKeperluan}
            />
          </View>

          <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Lampiran Surat Tugas / Foto Lokasi:</Text>
            <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: '800', marginTop: 4 }}>ST-RSJT-IX-2026-088.pdf (Terlampir)</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleKirim}>
            <Text style={styles.actionText}>Kirim Pengajuan PDT</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Pengajuan PDT</Text>
          {history.map((item, idx) => (
            <View
              key={idx}
              style={{
                paddingVertical: 10,
                borderBottomWidth: idx !== history.length - 1 ? 1 : 0,
                borderBottomColor: '#f1f5f9',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>{item.tujuan}</Text>
                <View style={{ backgroundColor: item.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: item.color }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: item.color }}>{item.status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Tanggal: {item.tanggal}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}
          onPress={onBack}
        >
          <Text style={{ color: '#334155', fontWeight: '800', fontSize: 13.5 }}>← Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}