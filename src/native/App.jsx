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
import Drawer from './components/Drawer';
import { styles, DARK_THEME, LIGHT_THEME } from './theme';
import { RSJ_LOGO_URI } from './assets';

import storageService from './storage';

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('dashboard');
  const [mode, setMode] = useState('sekarang');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState('masuk');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const [attendance, setAttendance] = useState({
    sekarang: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
    dording: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
    pdt: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
  });

  // Load persisted user, attendance, and theme from AsyncStorage on startup
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedUser = await storageService.getUser();
        if (savedUser) {
          setUser(savedUser);
        }

        const savedAttendance = await storageService.getAttendance();
        if (savedAttendance) {
          setAttendance((prev) => ({
            sekarang: savedAttendance.sekarang || prev.sekarang,
            dording: savedAttendance.dording || prev.dording,
            pdt: savedAttendance.pdt || prev.pdt,
          }));
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

  const navigate = (nextScreen, nextMode = mode) => {
    setScreen(nextScreen);
    setMode(nextMode);
    setDrawerOpen(false);
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
    const resetAttendance = {
      sekarang: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
      dording: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
      pdt: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
    };
    setAttendance(resetAttendance);
    await storageService.saveAttendance(resetAttendance);
    setDrawerOpen(false);
  };

  const submitAttendance = (data) => {
    const time = typeof data === 'object' ? data.time : data || currentTime;
    const score = typeof data === 'object' ? data.score : null;
    const photo = typeof data === 'object' ? data.photo : null;
    const modeKey = mode === 'dording' ? 'dording' : 'sekarang';

    setAttendance((prev) => {
      const nextAttendance = {
        ...prev,
        [modeKey]: {
          ...prev[modeKey],
          [attendanceType]: time,
          [`${attendanceType}Score`]: score,
          [`${attendanceType}Photo`]: photo,
        },
      };
      storageService.saveAttendance(nextAttendance);
      return nextAttendance;
    });
    setModalVisible(false);
    const modeTitle = mode === 'dording' ? 'DORDING' : 'REGULER';
    Alert.alert(
      'Presensi Berhasil! ✓',
      `Face Recognition Absen ${attendanceType.toUpperCase()} (${modeTitle}) berhasil diverifikasi di Area RSJ Tampan pada ${time} WIB.`
    );
  };

  const handleUpdatePdtAttendance = (type, time, scoreData) => {
    setAttendance((prev) => {
      const nextAttendance = {
        ...prev,
        pdt: {
          ...prev.pdt,
          [type]: time,
          [`${type}Score`]: scoreData,
        },
      };
      storageService.saveAttendance(nextAttendance);
      return nextAttendance;
    });
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextVal = !prev;
      storageService.saveDarkMode(nextVal);
      return nextVal;
    });
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const getScreenTitle = () => {
    if (screen === 'presensi') {
      return mode === 'dording' ? 'Presensi Dording' : 'Presensi Sekarang';
    }
    if (screen === 'rekap') return 'Rekap Absensi';
    if (screen === 'pdt') return 'Pegawai Presensi PDT';
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
              <Text style={[styles.menuText, { color: theme.textMain }]}>☰ Menu</Text>
            </TouchableOpacity>

            {/* Back Button if not on dashboard */}
            {screen !== 'dashboard' && (
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => setScreen('dashboard')}
              >
                <Text style={styles.backText}>← Beranda</Text>
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
              style={[styles.notification, { backgroundColor: theme.pillBg, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={handleToggleDarkMode}
              accessibilityLabel="Ganti Tema Gelap / Terang"
              title="Ganti Tema Gelap / Terang"
            >
              <Text style={{ fontSize: 16 }}>{isDarkMode ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.notification, { backgroundColor: theme.pillBg, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi penting saat ini.')}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
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
              onBack={() => setScreen('dashboard')}
            />
          )}
        </View>

        {/* Sliding Navigation Drawer */}
        <Drawer
          open={drawerOpen}
          activeScreen={activeNavKey}
          user={user}
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