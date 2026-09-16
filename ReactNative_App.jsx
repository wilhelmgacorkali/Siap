/**
 * SIAP (Sistem Informasi & Absensi Pegawai) - RSJ Tampan
 * Native Mobile Application for iOS & Android
 * Built with React Native & Expo
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  Alert,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function App() {
  // State
  const [user, setUser] = useState(null); // null = Login screen
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard', 'presensi', 'rekap', 'pdt'
  const [presensiMode, setPresensiMode] = useState('sekarang'); // 'sekarang' | 'dording'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState('masuk');
  const [todayAttendance, setTodayAttendance] = useState({ masuk: null, pulang: null });

  // Sidebar slide animation
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sidebar toggle animation handler
  const toggleSidebar = (open) => {
    setIsSidebarOpen(open);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: open ? 0 : -width * 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: open ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = (role = 'Administrator', name = 'ADMIN SIMRS') => {
    setUser({
      name: name,
      role: role,
      nip: '19890412 201403 2 004',
      unit: 'Instalasi Rawat Inap & SIMRS',
    });
    setCurrentScreen('dashboard');
  };

  const handleAttendanceSubmit = () => {
    const time = new Date().toTimeString().split(' ')[0];
    if (attendanceType === 'masuk') {
      setTodayAttendance((prev) => ({ ...prev, masuk: time }));
      Alert.alert('Presensi Berhasil', `Absen Masuk tercatat pada ${time}`);
    } else {
      setTodayAttendance((prev) => ({ ...prev, pulang: time }));
      Alert.alert('Presensi Berhasil', `Absen Pulang tercatat pada ${time}`);
    }
    setCameraModalVisible(false);
  };

  // -------------------------------------------------------------
  // SCREEN: LOGIN (Transparent Glassmorphic & RSJ Tampan Branding)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCardTransparent}>
          {/* RSJ Tampan Official Logo Header */}
          <View style={styles.rsjLogoRow}>
            <View style={styles.rsjLeafBadge}>
              <Text style={{ fontSize: 24 }}>🍃</Text>
            </View>
            <View>
              <Text style={styles.rsjTitleMain}>RSJ TAMPAN</Text>
              <Text style={styles.rsjTitleSub}>PROVINSI RIAU</Text>
            </View>
          </View>
          <Text style={styles.rsjTaglineText}>Melayani dengan Sepenuh Hati & Profesional</Text>

          <Text style={styles.loginTitleText}>Login Kepegawaian</Text>

          {/* Email / NIP Input */}
          <View style={styles.inputWrapRsui}>
            <Text style={styles.inputIconText}>✉️</Text>
            <TextInput
              style={styles.inputRsuiField}
              placeholder="Email / NIP / Username"
              placeholderTextColor="#94a3b8"
              defaultValue="ADMIN SIMRS"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapRsui}>
            <Text style={styles.inputIconText}>🔒</Text>
            <TextInput
              style={styles.inputRsuiField}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              defaultValue="password"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassRow}
            onPress={() => Alert.alert('Lupa Password', 'Silakan hubungi Unit SIMRS RSJ Tampan untuk reset kata sandi.')}
          >
            <Text style={styles.forgotPassText}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Solid Blue MASUK Button */}
          <TouchableOpacity
            style={styles.btnMasukRsui}
            onPress={() => handleLogin('Administrator', 'ADMIN SIMRS')}
          >
            <Text style={styles.btnMasukText}>MASUK</Text>
          </TouchableOpacity>

          {/* Bottom Links */}
          <View style={styles.bottomLinksContainer}>
            <Text style={styles.bottomLinkText}>
              Belum memiliki akun? <Text style={{ color: '#0284c7', fontWeight: 'bold' }}>daftar di sini</Text>
            </Text>
            <TouchableOpacity
              style={styles.btnOrangeHelp}
              onPress={() => Alert.alert('Helpdesk SIMRS', 'Ext 104 / 0812-7000-RSJ')}
            >
              <Text style={styles.btnOrangeHelpText}>Butuh Bantuan? Klik Disini</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Login Quick Switcher */}
          <View style={styles.demoLoginRow}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleLogin('Administrator', 'ADMIN SIMRS')}
            >
              <Text style={styles.demoPillTitle}>Admin SIMRS</Text>
              <Text style={styles.demoPillSub}>Administrator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleLogin('Perawat Shift', 'Ners. Siti Aminah, S.Kep')}
            >
              <Text style={styles.demoPillTitle}>Ners. Siti</Text>
              <Text style={styles.demoPillSub}>Perawat Shift</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // SCREEN: MAIN APPLICATION WITH SLIDING SIDEBAR
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => toggleSidebar(true)}>
          <Text style={styles.menuBtnText}>☰ Menu</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏥 SIAP RSJ Tampan</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <Text>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {currentScreen === 'dashboard' && (
          <View style={styles.dashboardContainer}>
            {/* Welcome Banner */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeSubtitle}>Welcome!,</Text>
              <Text style={styles.welcomeName}>{user.name}</Text>
              <View style={styles.roleBadgeContainer}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.dateText}>Kamis, 3 September 2026</Text>
                <Text style={styles.clockBadge}>{currentTime || '10:38:50'}</Text>
              </View>
            </View>

            {/* 4 Main Action Cards as Requested */}
            <View style={styles.cardsGrid}>
              {/* 1. Presensi Sekarang */}
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#0284c7' }]}
                onPress={() => {
                  setPresensiMode('sekarang');
                  setCurrentScreen('presensi');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>📍 Presensi Sekarang</Text>
                  <Text style={styles.cardDesc}>Lakukan absensi masuk & pulang hari ini.</Text>
                </View>
                <Text style={styles.cardArrow}>👉</Text>
              </TouchableOpacity>

              {/* 2. Rekap Absensi */}
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#e11d48' }]}
                onPress={() => setCurrentScreen('rekap')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>📊 Rekap Absensi</Text>
                  <Text style={styles.cardDesc}>Lihat riwayat dan rekapan absensi kehadiran.</Text>
                </View>
                <Text style={styles.cardArrow}>📅</Text>
              </TouchableOpacity>

              {/* 3. Presensi Diluar Tilok (PDT) */}
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#334155' }]}
                onPress={() => setCurrentScreen('pdt')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>🚗 Presensi Diluar Tilok (PDT)</Text>
                  <Text style={styles.cardDesc}>Gunakan fitur ini untuk presensi di luar tilok.</Text>
                </View>
                <Text style={styles.cardArrow}>📝</Text>
              </TouchableOpacity>

              {/* 4. Presensi Dording */}
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#eab308' }]}
                onPress={() => {
                  setPresensiMode('dording');
                  setCurrentScreen('presensi');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#422006' }]}>⏱️ Presensi Dording</Text>
                  <Text style={[styles.cardDesc, { color: '#713f12' }]}>Presensi Dinas Shift Berkelanjutan.</Text>
                </View>
                <Text style={styles.cardArrow}>⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Shift Calendar */}
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleHeader}>🗓️ Jadwal Dinas Pegawai (Sep 2026)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((d) => (
                  <View key={d} style={[styles.dayPill, d === 3 && styles.dayPillToday]}>
                    <Text style={styles.dayNum}>{d}</Text>
                    <View
                      style={[
                        styles.shiftCodeBadge,
                        { backgroundColor: d % 3 === 0 ? '#f59e0b' : d % 2 === 0 ? '#0284c7' : '#10b981' },
                      ]}
                    >
                      <Text style={styles.shiftCodeText}>{d % 3 === 0 ? 'D' : d % 2 === 0 ? 'S' : 'P'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* PRESENSI SCREEN */}
        {currentScreen === 'presensi' && (
          <View style={styles.presensiContainer}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerTitle}>
                🏥 {presensiMode === 'dording' ? 'Presensi Dording (Shift Berkelanjutan)' : 'Presensi Sekarang (Tilok RSJ)'}
              </Text>
              <Text style={styles.infoBannerSub}>Dalam Radius Tilok RSJ Tampan (14 meter)</Text>
            </View>

            {/* Map Mockup */}
            <View style={styles.mapMock}>
              <Text style={{ fontSize: 24 }}>🗺️</Text>
              <Text style={styles.mapMockText}>Peta Geofencing RSJ Tampan</Text>
              <Text style={styles.geofenceTag}>✓ Radius Tilok Aktif (14 m)</Text>
            </View>

            {/* Live Clock Card */}
            <View style={styles.clockCard}>
              <Text style={styles.clockBigDigits}>{currentTime || '10:38:50'}</Text>
              <Text style={styles.clockDateText}>3 September 2026</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnActionRow}>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#10b981' }]}
                onPress={() => {
                  setAttendanceType('masuk');
                  setCameraModalVisible(true);
                }}
              >
                <Text style={styles.btnActionText}>
                  {todayAttendance.masuk ? `Masuk: ${todayAttendance.masuk}` : '📥 Absen Masuk'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#f59e0b' }]}
                onPress={() => {
                  setAttendanceType('pulang');
                  setCameraModalVisible(true);
                }}
              >
                <Text style={styles.btnActionText}>
                  {todayAttendance.pulang ? `Pulang: ${todayAttendance.pulang}` : '📤 Absen Pulang'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shift Details */}
            <View style={styles.shiftDetailCard}>
              <Text style={styles.shiftDetailTitle}>Detail Shift</Text>
              <Text style={styles.shiftDetailRow}>Jenis: Perawat - Shift Sore</Text>
              <Text style={styles.shiftDetailRow}>Jam Masuk: 13:00:00 - 14:00:59</Text>
              <Text style={styles.shiftDetailRow}>Jam Pulang: 20:00:00 - 22:00:59</Text>
            </View>
          </View>
        )}

        {/* REKAP SCREEN */}
        {currentScreen === 'rekap' && (
          <View style={styles.presensiContainer}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerTitle}>📊 Rekapitulasi Absensi</Text>
              <Text style={styles.infoBannerSub}>Statistik Kehadiran Bulan September 2026</Text>
            </View>
            <View style={styles.shiftDetailCard}>
              <Text style={styles.shiftDetailRow}>Total Kehadiran: 24 Hari</Text>
              <Text style={styles.shiftDetailRow}>Tingkat Kedisiplinan: 100%</Text>
              <Text style={styles.shiftDetailRow}>Presensi Luar Tilok (PDT): 1 Kali</Text>
            </View>
          </View>
        )}

        {/* PDT SCREEN */}
        {currentScreen === 'pdt' && (
          <View style={styles.presensiContainer}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerTitle}>🚗 Formulir Presensi Luar Tilok (PDT)</Text>
              <Text style={styles.infoBannerSub}>Pengajuan Dinas Luar / Kegiatan Eksternal</Text>
            </View>
            <View style={styles.shiftDetailCard}>
              <Text style={styles.inputLabel}>Lokasi Tugas</Text>
              <TextInput style={styles.input} placeholder="Dinas Kesehatan Prov. Riau" />
              <TouchableOpacity
                style={[styles.btnPrimary, { marginTop: 12 }]}
                onPress={() => {
                  Alert.alert('Sukses', 'Pengajuan PDT terkirim!');
                  setCurrentScreen('dashboard');
                }}
              >
                <Text style={styles.btnPrimaryText}>Kirim Pengajuan PDT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* SLIDING SIDEBAR DRAWER OVERLAY */}
      {isSidebarOpen && (
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => toggleSidebar(false)}
        />
      )}

      {/* SLIDING SIDEBAR DRAWER */}
      <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: sidebarAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerLogo}>🏥 SIAP RSJ Tampan</Text>
          <TouchableOpacity onPress={() => toggleSidebar(false)}>
            <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerUserCard}>
          <Text style={styles.drawerUserName}>{user.name}</Text>
          <Text style={styles.drawerUserRole}>{user.role}</Text>
        </View>

        <View style={styles.drawerNav}>
          <TouchableOpacity
            style={styles.drawerNavItem}
            onPress={() => {
              setCurrentScreen('dashboard');
              toggleSidebar(false);
            }}
          >
            <Text style={styles.drawerNavText}>📊 Beranda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerNavItem}
            onPress={() => {
              setPresensiMode('sekarang');
              setCurrentScreen('presensi');
              toggleSidebar(false);
            }}
          >
            <Text style={styles.drawerNavText}>📍 Presensi Sekarang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerNavItem}
            onPress={() => {
              setPresensiMode('dording');
              setCurrentScreen('presensi');
              toggleSidebar(false);
            }}
          >
            <Text style={styles.drawerNavText}>⏱️ Presensi Dording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerNavItem}
            onPress={() => {
              setCurrentScreen('rekap');
              toggleSidebar(false);
            }}
          >
            <Text style={styles.drawerNavText}>📈 Rekap Absensi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerNavItem}
            onPress={() => {
              setCurrentScreen('pdt');
              toggleSidebar(false);
            }}
          >
            <Text style={styles.drawerNavText}>🚗 Presensi Luar Tilok (PDT)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.drawerLogoutBtn}
          onPress={() => {
            setUser(null);
            toggleSidebar(false);
          }}
        >
          <Text style={styles.drawerLogoutText}>🚪 Sign Out / Keluar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* CAMERA VERIFICATION MODAL */}
      <Modal visible={cameraModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verifikasi Wajah & Lokasi</Text>
            <View style={styles.modalCameraBox}>
              <Text style={{ fontSize: 40 }}>👤</Text>
              <Text style={styles.modalCameraText}>Kamera Biometrik & Geotag</Text>
              <Text style={styles.modalStamp}>📍 RSJ Tampan (0.4682°N, 101.4026°E)</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.btnAction, { flex: 1, backgroundColor: '#64748b' }]}
                onPress={() => setCameraModalVisible(false)}
              >
                <Text style={styles.btnActionText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, { flex: 2, backgroundColor: '#0284c7' }]}
                onPress={handleAttendanceSubmit}
              >
                <Text style={styles.btnActionText}>📸 Ambil Foto & Kirim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f1f5f9' },
  loginContainer: { flex: 1, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, alignItems: 'center' },
  logoBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  loginAppTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  loginSubtitle: { fontSize: 13, fontWeight: '700', color: '#0284c7', marginTop: 2 },
  loginHospital: { fontSize: 11, color: '#64748b', marginBottom: 18 },
  inputGroup: { width: '100%', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 },
  input: { width: '100%', height: 44, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  btnPrimary: { width: '100%', height: 46, backgroundColor: '#0284c7', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  demoLoginRow: { flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' },
  demoPill: { flex: 1, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  demoPillTitle: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
  demoPillSub: { fontSize: 9.5, color: '#64748b' },

  headerBar: { height: 56, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  menuBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  menuBtnText: { fontWeight: '700', color: '#0f172a', fontSize: 13 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  notifBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },

  mainScroll: { flex: 1 },
  dashboardContainer: { padding: 16 },
  welcomeBanner: { backgroundColor: '#0284c7', borderRadius: 20, padding: 18, marginBottom: 16 },
  welcomeSubtitle: { color: '#e0f2fe', fontSize: 12, fontWeight: '600' },
  welcomeName: { color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 2 },
  roleBadgeContainer: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginVertical: 4 },
  roleBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 },
  dateText: { color: '#fff', fontSize: 11.5, fontWeight: '600' },
  clockBadge: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },

  cardsGrid: { gap: 12 },
  actionCard: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5 },
  cardArrow: { fontSize: 20, marginLeft: 10 },

  scheduleCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 16 },
  scheduleHeader: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  dayPill: { width: 40, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginRight: 6 },
  dayPillToday: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  dayNum: { fontSize: 11, fontWeight: '700', color: '#475569' },
  shiftCodeBadge: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  shiftCodeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  presensiContainer: { padding: 16 },
  infoBanner: { backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#f43f5e', padding: 12, borderRadius: 8, marginBottom: 14 },
  infoBannerTitle: { color: '#9f1239', fontWeight: '800', fontSize: 13 },
  infoBannerSub: { color: '#be123c', fontSize: 11, marginTop: 2 },
  mapMock: { height: 160, backgroundColor: '#e2e8f0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  mapMockText: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 4 },
  geofenceTag: { backgroundColor: '#ecfdf5', color: '#047857', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 10.5, fontWeight: '700', marginTop: 6 },
  clockCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', marginBottom: 14 },
  clockBigDigits: { fontSize: 28, fontWeight: '800', color: '#0f172a', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  clockDateText: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  btnActionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btnAction: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnActionText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  shiftDetailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  shiftDetailTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  shiftDetailRow: { fontSize: 12, color: '#475569', marginVertical: 3 },

  drawerBackdrop: { position: 'absolute', top: 0, left: 0, width: width, height: height, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 },
  drawerContainer: { position: 'absolute', top: 0, left: 0, width: width * 0.8, height: height, backgroundColor: '#0f172a', zIndex: 100, padding: 20 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 20 },
  drawerLogo: { color: '#fff', fontSize: 16, fontWeight: '800' },
  drawerUserCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 12, marginBottom: 20 },
  drawerUserName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  drawerUserRole: { color: '#38bdf8', fontSize: 11, marginTop: 2 },
  drawerNav: { flex: 1 },
  drawerNavItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  drawerNavText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  drawerLogoutBtn: { backgroundColor: 'rgba(239,68,68,0.2)', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
  drawerLogoutText: { color: '#f87171', fontWeight: '700', fontSize: 13 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 320, backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  modalCameraBox: { height: 180, backgroundColor: '#0f172a', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalCameraText: { color: '#fff', fontSize: 12, marginTop: 6 },
  modalStamp: { color: '#38bdf8', fontSize: 10, marginTop: 4 },
});
