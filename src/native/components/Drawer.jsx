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
      {open && (
        <TouchableOpacity
          style={[styles.drawerBackdrop, { backgroundColor: activeTheme.overlay }]}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

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
        <View style={[styles.drawerHeader, { borderBottomColor: activeTheme.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
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
              <Text style={{ color: activeTheme.drawerTextSub, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }}>
                Provinsi Riau
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.drawerCloseBtn, { backgroundColor: activeTheme.drawerCloseBg }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: activeTheme.drawerText, fontSize: 14, fontWeight: '800' }}>X</Text>
          </TouchableOpacity>
        </View>

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

        <View style={{ flex: 1 }}>
          <NavItem label="Beranda" active={activeScreen === 'dashboard'} theme={activeTheme}
            onPress={() => { onNavigate('dashboard'); onClose(); }} />
          <NavItem label="Presensi Reguler" active={activeScreen === 'presensi'} theme={activeTheme}
            onPress={() => { onNavigate('presensi'); onClose(); }} />
          <NavItem label="Presensi Dording" active={activeScreen === 'dording'} theme={activeTheme}
            onPress={() => { onNavigate('dording'); onClose(); }} />
          <NavItem label="Presensi Luar Tilok (PDT)" active={activeScreen === 'pdt'} theme={activeTheme}
            onPress={() => { onNavigate('pdt'); onClose(); }} />
          <NavItem label="Jadwal Dinas" active={activeScreen === 'jadwal'} theme={activeTheme}
            onPress={() => { onNavigate('jadwal'); onClose(); }} />
          <NavItem label="Rekap Absensi" active={activeScreen === 'rekap'} theme={activeTheme}
            onPress={() => { onNavigate('rekap'); onClose(); }} />
          {(user?.roleType === 'super_admin' || user?.roleType === 'admin_umum' || user?.roleType === 'ka_instalasi' || activeScreen === 'admin') && (
            <NavItem label="👑 Panel Admin & Kendali" active={activeScreen === 'admin'} theme={activeTheme} isAdmin={true}
              onPress={() => { onNavigate('admin'); onClose(); }} />
          )}
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={() => { onLogout(); onClose(); }}
        >
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

function NavItem({ label, active, theme, onPress, isAdmin = false }) {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active ? styles.navItemActive : { backgroundColor: 'transparent' },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navText,
          {
            color: active ? '#ffffff' : isAdmin ? (theme?.accent || '#4fc3f7') : theme?.drawerText || '#1a2332',
            fontWeight: active || isAdmin ? '800' : '700',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
