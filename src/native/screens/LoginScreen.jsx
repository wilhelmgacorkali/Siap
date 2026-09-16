import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../theme';
import { RSJ_BUILDING_IMAGE, RSJ_LOGO_URI } from '../assets';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('Ners. Fitri Rahmadani, S.Kep');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const demoAccounts = [
    {
      name: 'Ners. Fitri Rahmadani, S.Kep',
      role: 'Perawat Pelaksana - Shift Sore',
      badge: 'Ners Rawat Inap',
      nip: '19890412 201402 2 003',
    },
    {
      name: 'dr. Hendra Saputra, Sp.KJ',
      role: 'Dokter Spesialis Jiwa - Jaga IGD',
      badge: 'Dokter Jaga',
      nip: '19780516 200501 1 004',
    },
    {
      name: 'Ahmad Fauzan, S.Kom',
      role: 'Superadmin SIMRS & Kepegawaian',
      badge: 'Admin SIMRS',
      nip: '19920101 201801 1 001',
    },
  ];

  const handleQuickLogin = (account) => {
    setUsername(account.name);
    onLogin(account);
  };

  const handleManualLogin = () => {
    onLogin({
      name: username || 'Ners. Fitri Rahmadani, S.Kep',
      role: 'Perawat Pelaksana - Shift Sore',
      badge: 'Ners Rawat Inap',
      nip: '19890412 201402 2 003',
    });
  };

  return (
    <SafeAreaView style={styles.appBackground}>
      <View style={styles.appContainer}>
        <StatusBar barStyle="light-content" />

        {/* Background Image (Gedung RSJ Tampan dengan efek Blur) */}
        <ImageBackground
          source={RSJ_BUILDING_IMAGE}
          blurRadius={Platform.OS === 'web' ? 8 : 10}
          style={styles.loginBackground}
          resizeMode="cover"
        >
          {/* Lapisan Gradient Tint Gelap & Transparan */}
          <View style={styles.loginBgOverlay} />

          {/* Logo RSJ Tampan Watermark Besar di Belakang Fitur Login */}
          <Image
            source={{ uri: RSJ_LOGO_URI }}
            style={styles.watermarkLogo}
            resizeMode="contain"
          />

          {/* Kartu Fitur Login dengan Efek Glassmorphism (Frosted Glass) */}
          <View style={styles.loginCardGlass}>
            {/* Header Logo Resmi RSJ Tampan */}
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Image
                  source={{ uri: RSJ_LOGO_URI }}
                  style={styles.logoImg}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoTitle}>RS JIWA TAMPAN</Text>
                <Text style={styles.logoSub}>PEMERINTAH PROVINSI RIAU</Text>
              </View>
            </View>

            <Text style={styles.tagline}>
              Sistem Informasi &amp; Absensi Pegawai (SIAP){'\n'}
              Melayani dengan Sepenuh Hati &amp; Profesional
            </Text>

            <Text style={styles.loginTitle}>Masuk Kepegawaian</Text>

            {/* Input NIP / Nama */}
            <Text style={styles.label}>NIP / Nama Pegawai</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan NIP atau Nama"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Input Password */}
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Kata sandi"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Tombol Masuk */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleManualLogin}
            >
              <Text style={styles.loginButtonText}>MASUK KE APLIKASI ➔</Text>
            </TouchableOpacity>

            {/* Tombol Akses Demo Cepat */}
            <View style={styles.quickLoginSection}>
              <Text style={styles.quickLoginTitle}>⚡ Pilih Akun Demo Cepat:</Text>
              {demoAccounts.map((account, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickLoginBtn}
                  activeOpacity={0.7}
                  onPress={() => handleQuickLogin(account)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a' }}>
                      {account.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#0284c7', fontWeight: '700' }}>
                      {account.role}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: '#e0f2fe',
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#0369a1' }}>
                      Pilih ➔
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}