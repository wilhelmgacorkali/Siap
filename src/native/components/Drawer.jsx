import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../theme';
import { RSJ_LOGO_URI } from '../assets';

export default function Drawer({ open, activeScreen, user, onClose, onNavigate, onLogout, isDarkMode = true, theme }) {
  const slideAnim = useRef(new Animated.Value(-290)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -290,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [open, slideAnim]);

  const activeTheme = theme || (isDarkMode ? DARK_THEME : LIGHT_THEME);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <TouchableOpacity
          style={[styles.drawerBackdrop, { backgroundColor: activeTheme.overlay }]}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Drawer Container */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.drawer,
          {
            backgroundColor: activeTheme.drawerBg,
            borderRightColor: activeTheme.border,
          },
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Drawer Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: activeTheme.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 4,
                borderWidth: 1,
                borderColor: activeTheme.borderSubtle,
              }}
            >
              <Image
                source={{ uri: RSJ_LOGO_URI }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={[styles.drawerLogo, { color: activeTheme.drawerText }]}>SIAP RSJ Tampan</Text>
              <Text style={{ color: activeTheme.drawerTextSub, fontSize: 10, fontWeight: '700' }}>
                Provinsi Riau - Mobile System
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.drawerCloseBtn, { backgroundColor: activeTheme.drawerCloseBg }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: activeTheme.drawerText, fontSize: 14, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* User Profile Card */}
        <View
          style={[
            styles.drawerUser,
            {
              backgroundColor: activeTheme.drawerUserBg,
              borderColor: activeTheme.borderSubtle,
            },
          ]}
        >
          <Text style={[styles.drawerName, { color: activeTheme.drawerText }]}>
            {user?.name || 'Pegawai RS'}
          </Text>
          <Text style={[styles.drawerRole, { color: activeTheme.accent }]}>
            {user?.role || 'Tenaga Medis'}
          </Text>
          <Text style={{ color: activeTheme.drawerTextSub, fontSize: 10, marginTop: 4 }}>
            NIP: {user?.nip || '19890412 201402 2 003'}
          </Text>
        </View>

        {/* Navigation Items */}
        <View style={{ flex: 1 }}>
          <NavItem
            icon="📊"
            label="Beranda"
            active={activeScreen === 'dashboard'}
            theme={activeTheme}
            onPress={() => {
              onNavigate('dashboard');
              onClose();
            }}
          />
          <NavItem
            icon="📍"
            label="Presensi Sekarang"
            active={activeScreen === 'presensi_sekarang'}
            theme={activeTheme}
            onPress={() => {
              onNavigate('presensi', 'sekarang');
              onClose();
            }}
          />
          <NavItem
            icon="⏱️"
            label="Presensi Dording"
            active={activeScreen === 'presensi_dording'}
            theme={activeTheme}
            onPress={() => {
              onNavigate('presensi', 'dording');
              onClose();
            }}
          />
          <NavItem
            icon="📈"
            label="Rekap Absensi"
            active={activeScreen === 'rekap'}
            theme={activeTheme}
            onPress={() => {
              onNavigate('rekap');
              onClose();
            }}
          />
          <NavItem
            icon="🚗"
            label="Presensi Luar Tilok (PDT)"
            active={activeScreen === 'pdt'}
            theme={activeTheme}
            onPress={() => {
              onNavigate('pdt');
              onClose();
            }}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logout}
          onPress={() => {
            onLogout();
            onClose();
          }}
        >
          <Text style={styles.logoutText}>🚪 Keluar dari Akun</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

function NavItem({ icon, label, active, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active
          ? styles.navItemActive
          : { backgroundColor: 'transparent' },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navText,
          {
            color: active
              ? '#ffffff'
              : theme?.drawerText || '#0f172a',
          },
        ]}
      >
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );
}