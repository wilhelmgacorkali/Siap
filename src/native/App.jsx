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
import { PdtScreen, ReportsScreen } from './screens/ReportsScreen';
import Drawer from './components/Drawer';
import { styles } from './theme';
import { RSJ_LOGO_URI } from './assets';

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('dashboard');
  const [mode, setMode] = useState('sekarang');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [attendanceType, setAttendanceType] = useState('masuk');
  const [attendance, setAttendance] = useState({
    sekarang: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
    dording: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
  });

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
    setScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('dashboard');
    setAttendance({
      sekarang: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
      dording: { masuk: null, pulang: null, masukScore: null, pulangScore: null },
    });
    setDrawerOpen(false);
  };

  const submitAttendance = (data) => {
    const time = typeof data === 'object' ? data.time : data || currentTime;
    const score = typeof data === 'object' ? data.score : null;
    const photo = typeof data === 'object' ? data.photo : null;
    const modeKey = mode === 'dording' ? 'dording' : 'sekarang';

    setAttendance((prev) => ({
      ...prev,
      [modeKey]: {
        ...prev[modeKey],
        [attendanceType]: time,
        [`${attendanceType}Score`]: score,
        [`${attendanceType}Photo`]: photo,
      },
    }));
    setModalVisible(false);
    const modeTitle = mode === 'dording' ? 'DORDING' : 'REGULER';
    Alert.alert(
      'Presensi Berhasil! ✓',
      `Face Recognition Absen ${attendanceType.toUpperCase()} (${modeTitle}) berhasil diverifikasi di Area RSJ Tampan pada ${time} WIB.`
    );
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const getScreenTitle = () => {
    if (screen === 'presensi') {
      return mode === 'dording' ? 'Presensi Dording' : 'Presensi Sekarang';
    }
    if (screen === 'rekap') return 'Rekap Absensi';
    if (screen === 'pdt') return 'Presensi Luar Tilok';
    return 'SIAP RSJ Tampan';
  };

  const activeNavKey =
    screen === 'presensi'
      ? mode === 'dording'
        ? 'presensi_dording'
        : 'presensi_sekarang'
      : screen;

  return (
    <SafeAreaView style={styles.appBackground}>
      <View style={styles.appContainer}>
        <StatusBar barStyle="dark-content" />

        {/* Global App Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.7}
              onPress={() => setDrawerOpen(true)}
            >
              <Text style={styles.menuText}>☰ Menu</Text>
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
            <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
          </View>

          <TouchableOpacity
            style={styles.notification}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi penting saat ini.')}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1, position: 'relative' }}>
          {screen === 'dashboard' && (
            <DashboardScreen
              user={user}
              currentTime={currentTime}
              attendance={attendance.sekarang}
              dordingAttendance={attendance.dording}
              onNavigate={navigate}
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
              onOpenModal={(type) => {
                setAttendanceType(type);
                setModalVisible(true);
              }}
              onCloseModal={() => setModalVisible(false)}
              onSubmit={submitAttendance}
              onSwitchMode={(newMode) => navigate('presensi', newMode)}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'rekap' && (
            <ReportsScreen
              user={user}
              attendance={attendance}
              currentTime={currentTime}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'pdt' && (
            <PdtScreen
              onBack={() => setScreen('dashboard')}
              onDone={() => setScreen('dashboard')}
            />
          )}
        </View>

        {/* Sliding Navigation Drawer */}
        <Drawer
          open={drawerOpen}
          activeScreen={activeNavKey}
          user={user}
          onClose={() => setDrawerOpen(false)}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      </View>
    </SafeAreaView>
  );
}