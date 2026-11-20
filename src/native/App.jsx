import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import PdtScreen from './screens/PdtScreen';
import AdminScreen from './screens/AdminScreen';
import Drawer from './components/Drawer';
import { styles, DARK_THEME, LIGHT_THEME } from './theme';
import { RSJ_LOGO_URI } from './assets';

import storageService from './storage';
import { generateBiometricPhoto } from './biometricPhoto';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isAdminUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    return p === '/admin' || p.startsWith('/admin') || h === '#admin' || h.startsWith('#/admin') || h.startsWith('#admin');
  }
  return false;
};

const DEFAULT_SUPER_ADMIN = {
  id: 1,
  name: 'dr. H. Haznelli, MARS',
  nip: '19680315 199703 1 002',
  role: 'Direktur / Super Admin SIMRS',
  roleType: 'super_admin',
  unit: 'Direksi & Manajemen',
  badge: 'Super Admin',
  status: 'Aktif',
};

const createEmptyAttendance = (dateStr = getTodayDateString()) => ({
  date: dateStr,
  sekarang: { masuk: null, pulang: null, masukScore: null, pulangScore: null, date: dateStr },
  dording: { masuk: null, pulang: null, masukScore: null, pulangScore: null, date: dateStr },
  pdt: { masuk: null, pulang: null, masukScore: null, pulangScore: null, date: dateStr },
});

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState(() => (isAdminUrl() ? 'admin' : 'dashboard'));
  const [mode, setMode] = useState('sekarang');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState('masuk');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const [attendance, setAttendance] = useState(() => createEmptyAttendance());

  // Load persisted user, attendance, and theme from AsyncStorage on startup
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedUser = await storageService.getUser();
        if (savedUser) {
          setUser(savedUser);
        }

        const savedAttendance = await storageService.getAttendance();
        const todayStr = getTodayDateString();

        if (savedAttendance) {
          // Jika data absensi tersimpan memiliki tanggal dan tanggalnya cocok dengan hari ini
          if (savedAttendance.date === todayStr) {
            const sekarangData = { ...(savedAttendance.sekarang || createEmptyAttendance(todayStr).sekarang) };
            const dordingData = { ...(savedAttendance.dording || createEmptyAttendance(todayStr).dording) };
            const pdtData = { ...(savedAttendance.pdt || createEmptyAttendance(todayStr).pdt) };

            // Backfill foto presensi jika sebelumnya belum terekam
            if (sekarangData.masuk && !sekarangData.masukPhoto) {
              sekarangData.masukPhoto = generateBiometricPhoto({
                user: savedUser,
                type: 'masuk',
                time: sekarangData.masuk,
                isDording: false,
              });
            }
            if (sekarangData.pulang && !sekarangData.pulangPhoto) {
              sekarangData.pulangPhoto = generateBiometricPhoto({
                user: savedUser,
                type: 'pulang',
                time: sekarangData.pulang,
                isDording: false,
              });
            }
            if (dordingData.masuk && !dordingData.masukPhoto) {
              dordingData.masukPhoto = generateBiometricPhoto({
                user: savedUser,
                type: 'masuk',
                time: dordingData.masuk,
                isDording: true,
              });
            }
            if (dordingData.pulang && !dordingData.pulangPhoto) {
              dordingData.pulangPhoto = generateBiometricPhoto({
                user: savedUser,
                type: 'pulang',
                time: dordingData.pulang,
                isDording: true,
              });
            }

            const updatedAttendance = {
              date: todayStr,
              sekarang: sekarangData,
              dording: dordingData,
              pdt: pdtData,
            };
            setAttendance(updatedAttendance);
            await storageService.saveAttendance(updatedAttendance);
          } else {
            // Jika tanggalnya sudah berganti hari (misal kemarin atau tgl 16),
            // otomatis reset agar tombol absensi hari ini aktif kembali!
            const freshAttendance = createEmptyAttendance(todayStr);
            setAttendance(freshAttendance);
            await storageService.saveAttendance(freshAttendance);
          }
        } else {
          const freshAttendance = createEmptyAttendance(todayStr);
          setAttendance(freshAttendance);
          await storageService.saveAttendance(freshAttendance);
        }

        const savedDarkMode = await storageService.getDarkMode();
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode);
        }
      } catch (err) {
        console.warn('Gagal memuat data dari AsyncStorage:', err);
      }
    };

    loadPersistedData();
  }, []);

  // Periksa otomatis pergantian hari tengah malam
  useEffect(() => {
    const checkMidnightReset = () => {
      const todayStr = getTodayDateString();
      setAttendance((prev) => {
        if (prev?.date && prev.date !== todayStr) {
          const fresh = createEmptyAttendance(todayStr);
          storageService.saveAttendance(fresh);
          return fresh;
        }
        return prev;
      });
    };
    const midnightInterval = setInterval(checkMidnightReset, 10000);
    return () => clearInterval(midnightInterval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle URL navigation for web (/admin & browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncUrlScreen = () => {
      if (isAdminUrl()) {
        setScreen('admin');
      } else {
        setScreen((prev) => (prev === 'admin' ? 'dashboard' : prev));
      }
    };

    syncUrlScreen();
    window.addEventListener('popstate', syncUrlScreen);
    window.addEventListener('hashchange', syncUrlScreen);
    return () => {
      window.removeEventListener('popstate', syncUrlScreen);
      window.removeEventListener('hashchange', syncUrlScreen);
    };
  }, []);

  const navigate = (nextScreen, nextMode = mode) => {
    setScreen(nextScreen);
    setMode(nextMode);
    setDrawerOpen(false);

    if (typeof window !== 'undefined' && window.history) {
      if (nextScreen === 'admin') {
        try {
          if (window.location.pathname !== '/admin') {
            window.history.pushState(null, '', '/admin');
          }
        } catch (e) {
          window.location.hash = '/admin';
        }
      } else if (screen === 'admin' || window.location.pathname === '/admin' || (window.location.hash || '').includes('admin')) {
        try {
          if (window.location.pathname !== '/') {
            window.history.pushState(null, '', '/');
          }
        } catch (e) {
          window.location.hash = '';
        }
      }
    }
  };

  const handleLogin = (account) => {
    setUser(account);
    storageService.saveUser(account);
    setScreen('dashboard');
  };

  const handleLogout = async () => {
    await storageService.removeUser();
    setUser(null);
    setScreen('dashboard');
    const resetAttendance = createEmptyAttendance();
    setAttendance(resetAttendance);
    await storageService.saveAttendance(resetAttendance);
    setDrawerOpen(false);
  };

  const submitAttendance = (data) => {
    const time = typeof data === 'object' ? data.time : data || currentTime;
    const score = typeof data === 'object' ? data.score : null;
    let photo = typeof data === 'object' ? data.photo : null;
    const targetType = (typeof data === 'object' && data.type) ? data.type : attendanceType;
    const modeKey = mode === 'dording' ? 'dording' : 'sekarang';
    const todayStr = getTodayDateString();

    if (!photo) {
      photo = generateBiometricPhoto({
        user,
        type: targetType,
        time,
        isDording: mode === 'dording',
      });
    }

    setAttendance((prev) => {
      const nextAttendance = {
        ...prev,
        date: todayStr,
        [modeKey]: {
          ...prev[modeKey],
          date: todayStr,
          [targetType]: time,
          [`${targetType}Date`]: todayStr,
          [`${targetType}Score`]: score,
          [`${targetType}Photo`]: photo,
        },
      };
      storageService.saveAttendance(nextAttendance);
      return nextAttendance;
    });
    setModalVisible(false);
    const modeTitle = mode === 'dording' ? 'DORDING' : 'REGULER';
    Alert.alert(
      'Presensi Berhasil!',
      `Face Recognition Absen ${targetType.toUpperCase()} (${modeTitle}) berhasil diverifikasi di Area RSJ Tampan pada ${time} WIB.`
    );
  };

  const handleUpdatePdtAttendance = (type, time, scoreData, photo) => {
    const todayStr = getTodayDateString();
    setAttendance((prev) => {
      const nextAttendance = {
        ...prev,
        date: todayStr,
        pdt: {
          ...prev.pdt,
          date: todayStr,
          [type]: time,
          [`${type}Date`]: todayStr,
          [`${type}Score`]: scoreData,
          [`${type}Photo`]: photo,
        },
        // Ketentuan RSJ Tampan: Jika Masuk via PDT, tercatat juga di Presensi Biasa
        // sehingga saat pulang kerja, pegawai cukup melakukan Absen Pulang biasa!
        sekarang: {
          ...prev.sekarang,
          date: todayStr,
          masuk: prev.sekarang?.masuk || time,
          masukDate: prev.sekarang?.masukDate || todayStr,
          masukScore: prev.sekarang?.masukScore || scoreData,
          masukPhoto: prev.sekarang?.masukPhoto || photo,
          isPdtMasuk: true,
        },
      };
      storageService.saveAttendance(nextAttendance);
      return nextAttendance;
    });
  };

  const handleResetTodayAttendance = async () => {
    const todayStr = getTodayDateString();
    const freshAttendance = createEmptyAttendance(todayStr);
    setAttendance(freshAttendance);
    await storageService.saveAttendance(freshAttendance);
    Alert.alert(
      'Presensi Direset!',
      'Status presensi hari ini telah direset. Tombol Absen Masuk & Pulang kini aktif kembali.'
    );
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextVal = !prev;
      storageService.saveDarkMode(nextVal);
      return nextVal;
    });
  };

  const handleSwitchUser = async (targetUser) => {
    setUser(targetUser);
    await storageService.saveUser(targetUser);
    Alert.alert(
      'Beralih Akun Berhasil',
      `Sekarang Anda aktif sebagai ${targetUser.name} (${targetUser.role || targetUser.roleType || 'Pegawai'}).`
    );
  };

  const effectiveUser = user || (screen === 'admin' ? DEFAULT_SUPER_ADMIN : null);

  if (!effectiveUser && screen !== 'admin') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const getScreenTitle = () => {
    if (screen === 'presensi') {
      return mode === 'dording' ? 'Presensi Dording' : 'Presensi Sekarang';
    }
    if (screen === 'rekap') return 'Rekap Absensi';
    if (screen === 'pdt') return 'Pegawai Presensi PDT';
    if (screen === 'admin') return 'Dashboard Admin';
    return 'SIAP RSJ Tampan';
  };

  const activeNavKey =
    screen === 'presensi'
      ? mode === 'dording'
        ? 'presensi_dording'
        : 'presensi_sekarang'
      : screen;

  return (
    <SafeAreaView style={[styles.appBackground, { backgroundColor: theme.bgMain }]}>
      <View style={[styles.appContainer, { backgroundColor: theme.bgMain }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* Global App Header */}
        <View style={[styles.header, { backgroundColor: theme.bgHero, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.menuButton, { backgroundColor: theme.pillBg, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => setDrawerOpen(true)}
            >
              <Text style={[styles.menuText, { color: theme.textMain }]}>Menu</Text>
            </TouchableOpacity>

            {/* Back Button if not on dashboard */}
            {screen !== 'dashboard' && (
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => navigate('dashboard')}
              >
                <Text style={styles.backText}>
                  {screen === 'admin' ? '← Portal Pegawai (/)' : '← Beranda'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {screen === 'dashboard' && (
              <Image
                source={{ uri: RSJ_LOGO_URI }}
                style={{ width: 22, height: 22, resizeMode: 'contain' }}
              />
            )}
            <Text style={[styles.headerTitle, { color: theme.textMain }]}>{getScreenTitle()}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.notification,
                { width: 'auto', paddingHorizontal: 10, backgroundColor: theme.pillBg, borderColor: theme.border },
              ]}
              activeOpacity={0.7}
              onPress={handleToggleDarkMode}
              accessibilityLabel="Ganti Tema Gelap / Terang"
              title="Ganti Tema Gelap / Terang"
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMain }}>
                {isDarkMode ? 'Gelap' : 'Terang'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.notification, { backgroundColor: theme.pillBg, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi penting saat ini.')}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textSub }}>Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1, position: 'relative', backgroundColor: theme.bgMain }}>
          {screen === 'dashboard' && (
            <DashboardScreen
              user={user}
              currentTime={currentTime}
              attendance={attendance.sekarang}
              dordingAttendance={attendance.dording}
              onNavigate={navigate}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}

          {screen === 'presensi' && (
            <AttendanceScreen
              mode={mode}
              user={user}
              currentTime={currentTime}
              attendance={mode === 'dording' ? attendance.dording : attendance.sekarang}
              allAttendance={attendance}
              modalVisible={modalVisible}
              attendanceType={attendanceType}
              isDarkMode={isDarkMode}
              theme={theme}
              onOpenModal={(type) => {
                setAttendanceType(type);
                setModalVisible(true);
              }}
              onCloseModal={() => setModalVisible(false)}
              onSubmit={submitAttendance}
              onResetAttendance={handleResetTodayAttendance}
              onSwitchMode={(newMode) => navigate('presensi', newMode)}
              onNavigateToPdt={() => setScreen('pdt')}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'rekap' && (
            <ReportsScreen
              user={user}
              attendance={attendance}
              currentTime={currentTime}
              isDarkMode={isDarkMode}
              theme={theme}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'pdt' && (
            <PdtScreen
              user={user}
              currentTime={currentTime}
              attendance={attendance}
              isDarkMode={isDarkMode}
              theme={theme}
              onUpdatePdtAttendance={handleUpdatePdtAttendance}
              onNavigate={navigate}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'admin' && (
            <AdminScreen
              user={effectiveUser}
              currentTime={currentTime}
              attendance={attendance}
              onSwitchUser={handleSwitchUser}
              onNavigate={navigate}
              onBack={() => navigate('dashboard')}
              isDarkMode={isDarkMode}
              theme={theme}
            />
          )}
        </View>

        {/* Sliding Navigation Drawer */}
        <Drawer
          open={drawerOpen}
          activeScreen={activeNavKey}
          user={effectiveUser}
          isDarkMode={isDarkMode}
          theme={theme}
          onClose={() => setDrawerOpen(false)}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      </View>
    </SafeAreaView>
  );
}