import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../theme';
import { RSJ_LOGO_URI } from '../assets';

export default function Drawer({ open, activeScreen, user, onClose, onNavigate, onLogout }) {
  const slideAnim = useRef(new Animated.Value(-290)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -290,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [open, slideAnim]);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Drawer Container */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
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
              }}
            >
              <Image
                source={{ uri: RSJ_LOGO_URI }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={styles.drawerLogo}>SIAP RSJ Tampan</Text>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700' }}>
                Provinsi Riau - Mobile System
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.drawerCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* User Profile Card */}
        <View style={styles.drawerUser}>
          <Text style={styles.drawerName}>{user?.name || 'Pegawai RS'}</Text>
          <Text style={styles.drawerRole}>{user?.role || 'Tenaga Medis'}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>
            NIP: {user?.nip || '19890412 201402 2 003'}
          </Text>
        </View>

        {/* Navigation Items */}
        <View style={{ flex: 1 }}>
          <NavItem
            icon="📊"
            label="Beranda"
            active={activeScreen === 'dashboard'}
            onPress={() => {
              onNavigate('dashboard');
              onClose();
            }}
          />
          <NavItem
            icon="📍"
            label="Presensi Sekarang"
            active={activeScreen === 'presensi_sekarang'}
            onPress={() => {
              onNavigate('presensi', 'sekarang');
              onClose();
            }}
          />
          <NavItem
            icon="⏱️"
            label="Presensi Dording"
            active={activeScreen === 'presensi_dording'}
            onPress={() => {
              onNavigate('presensi', 'dording');
              onClose();
            }}
          />
          <NavItem
            icon="📈"
            label="Rekap Absensi"
            active={activeScreen === 'rekap'}
            onPress={() => {
              onNavigate('rekap');
              onClose();
            }}
          />
          <NavItem
            icon="🚗"
            label="Presensi Luar Tilok (PDT)"
            active={activeScreen === 'pdt'}
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

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
    >
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );
}