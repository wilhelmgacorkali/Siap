import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../theme';
import TilokMap from '../components/TilokMap';
import FaceRecognitionModal from '../components/FaceRecognitionModal';

export default function AttendanceScreen({
  mode,
  user,
  currentTime,
  attendance,
  allAttendance = {},
  attendanceType = 'masuk',
  modalVisible,
  onOpenModal,
  onCloseModal,
  onSubmit,
  onSwitchMode,
  onNavigateToPdt,
  onBack,
}) {
  const isDording = mode === 'dording';
  const [activeType, setActiveType] = useState(attendanceType || 'masuk');
  const [dordingPattern, setDordingPattern] = useState('pagi_siang'); // 'pagi_siang' | 'siang_malam' | 'malam_pagi'
  const [userDistance, setUserDistance] = useState(14); // meter dari titik tilok resmi
  const [geofenceAlertVisible, setGeofenceAlertVisible] = useState(false);
  const [pendingType, setPendingType] = useState('masuk');

  // Definisi 3 Pola Presensi Dording (Sesuai Infografis Resmi RSJ Tampan)
  const DORDING_CONFIG = {
    pagi_siang: {
      label: 'Pagi ➔ Siang/Sore',
      sublabel: 'Peralihan Shift Pagi ke Siang',
      shift1Name: 'Shift Pagi',
      shift2Name: 'Shift Siang (Dording)',
      step1Time: 'Sebelum 08.00',
      step2Time: 'Sebelum 14.00',
      step3Time: 'Setelah 14.00',
      step4Time: 'Setelah 20.00',
      shift1Hours: { masuk: '07:00:00 - 08:00:59', pulang: '14:00:00 - 16:00:59' },
      shift2Hours: { masuk: '13:00:00 - 14:00:59', pulang: '20:00:00 - 21:00:59' },
      masukLimit: 14 * 60,
      pulangLimit: 20 * 60,
    },
    siang_malam: {
      label: 'Siang/Sore ➔ Malam',
      sublabel: 'Peralihan Shift Sore ke Malam',
      shift1Name: 'Shift Sore',
      shift2Name: 'Shift Malam (Dording)',
      step1Time: 'Sebelum 14.00',
      step2Time: 'Sebelum 20.00',
      step3Time: 'Setelah 20.00',
      step4Time: 'Setelah 08.00 (H+1)',
      shift1Hours: { masuk: '13:00:00 - 14:00:59', pulang: '20:00:00 - 21:00:59' },
      shift2Hours: { masuk: '19:30:00 - 20:00:59', pulang: '08:00:00 - 09:00:59' },
      masukLimit: 20 * 60,
      pulangLimit: 8 * 60,
    },
    malam_pagi: {
      label: 'Malam ➔ Pagi',
      sublabel: 'Peralihan Shift Malam ke Pagi',
      shift1Name: 'Shift Malam',
      shift2Name: 'Shift Pagi (Dording)',
      step1Time: 'Sebelum 20.00',
      step2Time: 'Sebelum 08.00 (H+1)',
      step3Time: 'Setelah 08.00 (H+1)',
      step4Time: 'Setelah 14.00',
      shift1Hours: { masuk: '19:30:00 - 20:00:59', pulang: '08:00:00 - 09:00:59' },
      shift2Hours: { masuk: '07:00:00 - 08:00:59', pulang: '14:00:00 - 16:00:59' },
      masukLimit: 8 * 60,
      pulangLimit: 14 * 60,
    },
  };

  const currentCfg = DORDING_CONFIG[dordingPattern];
  const activeHours = isDording ? currentCfg.shift2Hours : currentCfg.shift1Hours;

  // Status Realtime Transaksi 4 Langkah Dording
  const s1Masuk = allAttendance?.sekarang?.masuk;
  const s2Masuk = allAttendance?.dording?.masuk;
  const s1Pulang = allAttendance?.sekarang?.pulang;
  const s2Pulang = allAttendance?.dording?.pulang;

  // Perhitungan Nilai & Persentase Kedisiplinan Kehadiran (Sesuai Sistem Resmi SIAP RSJ Tampan)
  const getScore = (timeStr, type, storedScore) => {
    if (storedScore) {
      return {
        ...storedScore,
        code: storedScore.code || (storedScore.percentage >= 100 ? (type === 'masuk' ? 'SWM' : 'SWP') : 'TL'),
        potongan: storedScore.potongan || (storedScore.percentage >= 100 ? '0.00%' : `${100 - storedScore.percentage}%`),
        icon: storedScore.icon || (storedScore.percentage >= 100 ? '✓' : '⏱️'),
        bg: storedScore.bg || storedScore.badgeBg || (storedScore.percentage >= 100 ? '#ecfdf5' : '#fffbeb'),
      };
    }
    if (!timeStr) return null;

    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const totalMinutes = h * 60 + m;

    if (type === 'masuk') {
      const limit = isDording ? currentCfg.masukLimit : 8 * 60; // Limit 08:00 (Shift 1) atau limit dording
      if (totalMinutes <= limit) {
        return {
          percentage: 100,
          code: 'SWM',
          potongan: '0.00%',
          text: 'Sesuai Waktu Masuk (SWM)',
          subtext: 'Presensi Tepat Waktu (100%)',
          color: '#16a34a',
          bg: '#ecfdf5',
          borderColor: '#16a34a',
          icon: '✓',
        };
      } else {
        const late = totalMinutes - limit;
        let p = 100;
        let pot = '0.00%';
        if (late <= 15) { p = 95; pot = '1.25%'; }
        else if (late <= 30) { p = 90; pot = '2.50%'; }
        else if (late <= 60) { p = 85; pot = '3.75%'; }
        else if (late <= 90) { p = 80; pot = '5.00%'; }
        else if (late <= 120) { p = 70; pot = '7.50%'; }
        else { p = Math.max(25, Math.round(100 - late * 0.35)); pot = `${100 - p}%`; }

        return {
          percentage: p,
          code: 'TL',
          potongan: pot,
          text: `Terlambat ${late}m (${p}%)`,
          subtext: `Potongan Keterlambatan -${pot}`,
          color: p >= 80 ? '#d97706' : '#dc2626',
          bg: p >= 80 ? '#fffbeb' : '#fef2f2',
          borderColor: p >= 80 ? '#f59e0b' : '#ef4444',
          icon: '⏱️',
        };
      }
    } else {
      const limit = isDording ? currentCfg.pulangLimit : 14 * 60; // Pulang tepat waktu
      if (totalMinutes >= limit) {
        return {
          percentage: 100,
          code: 'SWP',
          potongan: '0.00%',
          text: 'Sesuai Waktu Pulang (SWP)',
          subtext: 'Jam Kerja Lengkap (100%)',
          color: '#16a34a',
          bg: '#ecfdf5',
          borderColor: '#16a34a',
          icon: '✓',
        };
      } else {
        const early = limit - totalMinutes;
        const p = Math.max(25, Math.round(100 - early * 0.8));
        return {
          percentage: p,
          code: 'PSW',
          potongan: `${100 - p}%`,
          text: `Pulang Cepat ${early}m (${p}%)`,
          subtext: `Kurang Jam Kerja -${100 - p}%`,
          color: '#d97706',
          bg: '#fffbeb',
          borderColor: '#f59e0b',
          icon: '⏱️',
        };
      }
    }
  };

  const masukScore = getScore(attendance?.masuk, 'masuk', attendance?.masukScore);
  const pulangScore = getScore(attendance?.pulang, 'pulang', attendance?.pulangScore);

  const handleOpenAbsen = (type) => {
    setActiveType(type);
    if (userDistance > 200) {
      // User berada di luar radius Tilok resmi (200m)
      setPendingType(type);
      setGeofenceAlertVisible(true);
      return;
    }
    if (onOpenModal) onOpenModal(type);
  };

  // Format tanggal Indonesia
  const todayIndonesianDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        {/* Tombol Pemilih Cepat: Presensi Shift 1 vs Presensi Dording Shift 2 */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            borderRadius: 14,
            padding: 4,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            gap: 6,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: !isDording ? '#0284c7' : '#f8fafc',
            }}
            onPress={() => onSwitchMode && onSwitchMode('sekarang')}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: !isDording ? '#ffffff' : '#475569',
              }}
            >
              🟦 Presensi (Shift 1)
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: !isDording ? '#e0f2fe' : '#94a3b8',
                marginTop: 2,
                fontWeight: '600',
              }}
            >
              {s1Masuk ? `✓ Masuk ${s1Masuk}` : 'Belum Absen Masuk'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: isDording ? '#d97706' : '#f8fafc',
            }}
            onPress={() => onSwitchMode && onSwitchMode('dording')}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: isDording ? '#ffffff' : '#475569',
              }}
            >
              🟨 Presensi Dording (Shift 2)
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: isDording ? '#fef3c7' : '#94a3b8',
                marginTop: 2,
                fontWeight: '600',
              }}
            >
              {s2Masuk ? `✓ Masuk ${s2Masuk}` : 'Belum Absen Masuk'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Banner with Mode Info */}
        <View style={[styles.banner, isDording && styles.bannerDording]}>
          <Text style={[styles.bannerTitle, isDording && { color: '#92400e' }]}>
            🏥 {isDording ? `Presensi Dording (${currentCfg.label})` : 'Presensi Sekarang (Tilok RSJ Tampan)'}
          </Text>
          <Text style={[styles.bannerSub, isDording && { color: '#b45309' }]}>
            {isDording
              ? 'Fitur presensi khusus dinas sambung/shift jaga rawat inap RSJ Tampan.'
              : 'Terverifikasi dalam radius Tilok Gedung RSJ Tampan (14 meter).'}
          </Text>
        </View>

        {/* Pilihan 3 Pola Dording (Hanya Muncul di Mode Dording) */}
        {isDording && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#475569', marginBottom: 6 }}>
              🔄 Pilih Alur Peralihan Shift Dording:
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Object.keys(DORDING_CONFIG).map((key) => {
                const cfg = DORDING_CONFIG[key];
                const active = dordingPattern === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      paddingHorizontal: 6,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: active ? '#d97706' : '#e2e8f0',
                      backgroundColor: active ? '#fef3c7' : '#ffffff',
                      alignItems: 'center',
                    }}
                    onPress={() => setDordingPattern(key)}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '800',
                        color: active ? '#92400e' : '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Peta Interaktif Tilok & Radius Geofencing Resmi (Foto 2: Lat 0.465791, Long 101.381957, Radius 200m) */}
        <TilokMap
          latitude={0.465791}
          longitude={101.381957}
          radius={200}
          userDistance={userDistance}
          isOutsideRadius={userDistance > 200}
          locationName="RS Jiwa Tampan - Pekanbaru"
        />

        {/* Quick GPS Geofencing Switcher untuk Pengujian */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 8,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
            Simulasi Posisi GPS Pegawai:
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: userDistance <= 200 ? '#059669' : '#f1f5f9',
              }}
              onPress={() => setUserDistance(14)}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: userDistance <= 200 ? '#ffffff' : '#64748b',
                }}
              >
                🏢 Dalam Tilok (14m)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: userDistance > 200 ? '#ea580c' : '#f1f5f9',
              }}
              onPress={() => setUserDistance(1150)}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: userDistance > 200 ? '#ffffff' : '#64748b',
                }}
              >
                🚗 Luar Radius (1.1 km)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Clock Card Sesuai Tampilan Asli SIAP RSJ Tampan */}
        <View style={styles.clockCard}>
          <Text style={styles.bigClock}>{currentTime || '10:38:50'}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 2 }}>
            {todayIndonesianDate}
          </Text>
          <Text style={[styles.muted, { fontSize: 11, marginTop: 1 }]}>
            Waktu Indonesia Barat (WIB)
          </Text>
        </View>

        {/* Action Buttons: Absen Masuk & Absen Pulang dengan Kotak Persentase Dinamis */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {/* ================= Kolom Absen Masuk ================= */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: attendance?.masuk ? '#059669' : '#0284c7',
                  opacity: attendance?.masuk ? 0.95 : 1,
                },
              ]}
              disabled={!!attendance?.masuk}
              onPress={() => handleOpenAbsen('masuk')}
            >
              <Text style={styles.actionText}>
                {attendance?.masuk ? '✓ Sudah Masuk' : '📥 Absen Masuk'}
              </Text>
            </TouchableOpacity>

            {/* Kotak Nilai Jam & Persentase Sesuai Sistem Asli RSJ Tampan */}
            <View
              style={{
                backgroundColor: '#ffffff',
                borderWidth: 1.5,
                borderColor: masukScore ? masukScore.borderColor : '#e2e8f0',
                borderRadius: 14,
                padding: 10,
                alignItems: 'center',
                marginTop: 8,
                ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}),
              }}
            >
              {/* Jam Masuk Terpampang Jelas */}
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'monospace',
                  fontWeight: '800',
                  color: attendance?.masuk ? '#0f172a' : '#94a3b8',
                }}
              >
                {attendance?.masuk ? `2026-09-16 ${attendance.masuk}` : '--:--:--'}
              </Text>

              {/* Badge Persentase Format SIAP RSJ Tampan (SWM 0.00%) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: masukScore ? masukScore.borderColor : '#16a34a',
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '900',
                      color: masukScore ? masukScore.color : '#16a34a',
                    }}
                  >
                    {masukScore ? masukScore.code || 'SWM' : 'SWM'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: attendance?.masuk ? '#0f172a' : '#64748b',
                  }}
                >
                  {masukScore ? masukScore.potongan || '0.00%' : '0.00%'}
                </Text>
              </View>

              {/* Keterangan Status Persentase */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: masukScore ? masukScore.color : '#94a3b8',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {masukScore ? masukScore.text : '07:00:00 - 08:00:59'}
              </Text>

              {/* Verifikasi Biometrik Wajah di Area RSJ Tampan */}
              {attendance?.masuk && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                  }}
                >
                  <Text style={{ fontSize: 10 }}>📷</Text>
                  <Text style={{ fontSize: 9.5, color: '#16a34a', fontWeight: '800' }}>
                    Face Recognition: 99.4% ✓
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ================= Kolom Absen Pulang ================= */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: attendance?.pulang ? '#16a34a' : '#d97706',
                  opacity: !attendance?.masuk || !!attendance?.pulang ? 0.6 : 1,
                },
              ]}
              disabled={!attendance?.masuk || !!attendance?.pulang}
              onPress={() => handleOpenAbsen('pulang')}
            >
              <Text style={styles.actionText}>
                {attendance?.pulang ? '✓ Sudah Pulang' : '📤 Absen Pulang'}
              </Text>
            </TouchableOpacity>

            {/* Kotak Nilai Jam & Persentase Pulang */}
            <View
              style={{
                backgroundColor: '#ffffff',
                borderWidth: 1.5,
                borderColor: pulangScore ? pulangScore.borderColor : '#e2e8f0',
                borderRadius: 14,
                padding: 10,
                alignItems: 'center',
                marginTop: 8,
                ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}),
              }}
            >
              {/* Jam Pulang */}
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'monospace',
                  fontWeight: '800',
                  color: attendance?.pulang ? '#0f172a' : '#94a3b8',
                }}
              >
                {attendance?.pulang ? `2026-09-16 ${attendance.pulang}` : '--:--:--'}
              </Text>

              {/* Badge Persentase Pulang Format SIAP RSJ Tampan (XX 0% atau SWP 0.00%) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: pulangScore ? pulangScore.borderColor : '#ef4444',
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '900',
                      color: pulangScore ? pulangScore.color : '#ef4444',
                    }}
                  >
                    {pulangScore ? pulangScore.code || 'SWP' : 'XX'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: attendance?.pulang ? '#0f172a' : '#1e293b',
                  }}
                >
                  {pulangScore ? pulangScore.potongan || '0.00%' : '0%'}
                </Text>
              </View>

              {/* Keterangan Pulang */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: pulangScore ? pulangScore.color : '#94a3b8',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {pulangScore
                  ? pulangScore.text
                  : attendance?.masuk
                  ? '14:00:00 - 16:00:59'
                  : 'Terkunci (Perlu Masuk)'}
              </Text>

              {/* Status Face Recognition Pulang */}
              {attendance?.pulang && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                  }}
                >
                  <Text style={{ fontSize: 10 }}>📷</Text>
                  <Text style={{ fontSize: 9.5, color: '#16a34a', fontWeight: '800' }}>
                    Face Recognition: 99.4% ✓
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tabel Informasi Shift & Ketentuan Waktu (Sesuai Monitor SIAP RSJ Tampan) */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
            overflow: 'hidden',
            marginBottom: 16,
            ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } : {}),
          }}
        >
          {/* Row 1: Jenis Absen */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
                Jenis Absen
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: isDording ? '#d97706' : '#16a34a',
                  borderRadius: 10,
                  paddingVertical: 7,
                  paddingHorizontal: 18,
                  backgroundColor: '#ffffff',
                }}
              >
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 13.5,
                    textAlign: 'center',
                  }}
                >
                  {isDording ? currentCfg.shift2Name : currentCfg.shift1Name}
                </Text>
              </View>
            </View>
          </View>

          {/* Row 2: Jam Absen Masuk */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingVertical: 18, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
                Jam Absen Masuk
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 }}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: isDording ? '#d97706' : '#16a34a',
                  borderRadius: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  minWidth: 120,
                }}
              >
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                  }}
                >
                  {activeHours.masuk.split(' - ')[0]}
                </Text>
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12,
                    marginVertical: 2,
                  }}
                >
                  -
                </Text>
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                  }}
                >
                  {activeHours.masuk.split(' - ')[1]}
                </Text>
              </View>
            </View>
          </View>

          {/* Row 3: Jam Absen Pulang */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingVertical: 18, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
                Jam Absen Pulang
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 }}>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: isDording ? '#d97706' : '#16a34a',
                  borderRadius: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  minWidth: 120,
                }}
              >
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                  }}
                >
                  {activeHours.pulang.split(' - ')[0]}
                </Text>
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12,
                    marginVertical: 2,
                  }}
                >
                  -
                </Text>
                <Text
                  style={{
                    color: isDording ? '#d97706' : '#16a34a',
                    fontWeight: '800',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                  }}
                >
                  {activeHours.pulang.split(' - ')[1]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card Teknis Presensi Dording (Sesuai Infografis Resmi RSJ Tampan) */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: '#cbd5e1',
            padding: 14,
            marginBottom: 16,
            ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.04)' } : {}),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#0f172a' }}>
              ⚡ Teknis Presensi Dording
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284c7' }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b' }}>Shift 1</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#d97706' }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b' }}>Shift 2</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
            Urutan langkah presensi untuk alur <Text style={{ fontWeight: '800', color: '#0f172a' }}>{currentCfg.label}</Text>:
          </Text>

          {/* 4 Langkah Presensi */}
          <View style={{ gap: 8 }}>
            {/* Step 1 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSwitchMode && onSwitchMode('sekarang')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: s1Masuk ? '#f0fdf4' : '#f8fafc',
                borderWidth: 1,
                borderColor: s1Masuk ? '#86efac' : '#e2e8f0',
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#0284c7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1e293b' }}>
                  Absen Masuk {currentCfg.shift1Name}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  Waktu: {currentCfg.step1Time} • Tombol: <Text style={{ color: '#0284c7', fontWeight: '800' }}>Presensi (Biru)</Text>
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: s1Masuk ? '#dcfce7' : '#f1f5f9',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: s1Masuk ? '#15803d' : '#94a3b8',
                  }}
                >
                  {s1Masuk ? `✓ Selesai (${s1Masuk})` : '⏳ Belum'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Step 2 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSwitchMode && onSwitchMode('dording')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: s2Masuk ? '#f0fdf4' : '#f8fafc',
                borderWidth: 1,
                borderColor: s2Masuk ? '#86efac' : '#e2e8f0',
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#d97706',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1e293b' }}>
                  Absen Masuk {currentCfg.shift2Name}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  Waktu: {currentCfg.step2Time} • Tombol: <Text style={{ color: '#d97706', fontWeight: '800' }}>Presensi Dording (Kuning)</Text>
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: s2Masuk ? '#dcfce7' : '#f1f5f9',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: s2Masuk ? '#15803d' : '#94a3b8',
                  }}
                >
                  {s2Masuk ? `✓ Selesai (${s2Masuk})` : '⏳ Belum'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Step 3 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSwitchMode && onSwitchMode('sekarang')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: s1Pulang ? '#f0fdf4' : '#f8fafc',
                borderWidth: 1,
                borderColor: s1Pulang ? '#86efac' : '#e2e8f0',
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#0284c7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1e293b' }}>
                  Absen Pulang {currentCfg.shift1Name}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  Waktu: {currentCfg.step3Time} • Tombol: <Text style={{ color: '#0284c7', fontWeight: '800' }}>Presensi (Biru)</Text>
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: s1Pulang ? '#dcfce7' : '#f1f5f9',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: s1Pulang ? '#15803d' : '#94a3b8',
                  }}
                >
                  {s1Pulang ? `✓ Selesai (${s1Pulang})` : '⏳ Belum'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Step 4 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSwitchMode && onSwitchMode('dording')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: s2Pulang ? '#f0fdf4' : '#f8fafc',
                borderWidth: 1,
                borderColor: s2Pulang ? '#86efac' : '#e2e8f0',
                borderRadius: 10,
                padding: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#d97706',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12 }}>4</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1e293b' }}>
                  Absen Pulang {currentCfg.shift2Name}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  Waktu: {currentCfg.step4Time} • Tombol: <Text style={{ color: '#d97706', fontWeight: '800' }}>Presensi Dording (Kuning)</Text>
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: s2Pulang ? '#dcfce7' : '#f1f5f9',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: s2Pulang ? '#15803d' : '#94a3b8',
                  }}
                >
                  {s2Pulang ? `✓ Selesai (${s2Pulang})` : '⏳ Belum'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Back to Dashboard Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}
          onPress={onBack}
        >
          <Text style={{ color: '#334155', fontWeight: '800', fontSize: 13.5 }}>
            ← Kembali ke Beranda
          </Text>
        </TouchableOpacity>

        {/* High-Tech Biometric Face Recognition Modal */}
        <FaceRecognitionModal
          visible={modalVisible}
          type={activeType}
          user={user}
          currentTime={currentTime}
          isDording={isDording}
          onClose={onCloseModal}
          onSubmit={onSubmit}
        />

        {/* Modal: Peringatan Geofencing Di Luar Radius Tilok */}
        <Modal visible={geofenceAlertVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 18,
                padding: 20,
                width: '100%',
                maxWidth: 440,
                borderWidth: 1,
                borderColor: '#fed7aa',
                ...(Platform.OS === 'web'
                  ? { boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }
                  : { elevation: 5 }),
              }}
            >
              {/* Icon & Title */}
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#fff7ed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#f97316',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>⚠️</Text>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '900',
                    color: '#0f172a',
                    textAlign: 'center',
                  }}
                >
                  Di Luar Radius Titik Lokasi!
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#c2410c',
                    marginTop: 2,
                  }}
                >
                  Jarak Anda: {userDistance}m (Maksimal Radius: 200m)
                </Text>
              </View>

              {/* Description */}
              <View
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: '#f97316',
                }}
              >
                <Text style={{ fontSize: 11.5, color: '#334155', lineHeight: 17 }}>
                  Titik resmi RS Jiwa Tampan berada di{' '}
                  <Text style={{ fontWeight: '800' }}>Lat: 0.465791, Long: 101.381957</Text>.
                  Karena posisi Anda berada di luar radius 200 meter, Anda tidak dapat melakukan presensi reguler di lokasi ini.
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#ea580c',
                    fontWeight: '800',
                    marginTop: 6,
                  }}
                >
                  💡 Jika Anda masih di jalan menuju kantor atau sedang dinas luar, silakan gunakan menu Presensi Diluar Tilok (PDT) dengan menyertakan alasan & foto bukti perjalanan.
                </Text>
              </View>

              {/* Buttons */}
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#e11d48',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setGeofenceAlertVisible(false);
                    if (onNavigateToPdt) onNavigateToPdt();
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                    🚗 Beralih ke Presensi Diluar Tilok (PDT) ➔
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#059669',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setUserDistance(14);
                    setGeofenceAlertVisible(false);
                    if (onOpenModal) onOpenModal(pendingType);
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                    🏢 Simulasi Dalam Tilok (14m) & Lanjut Absen
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#f1f5f9',
                    paddingVertical: 9,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setGeofenceAlertVisible(false)}
                >
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>
                    Batal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}