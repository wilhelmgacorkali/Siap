import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { IconHome, IconCalendar, IconHistory, IconUser, IconShield } from './Icons';

export default function BottomNav({ activeScreen, onNavigate, user, theme }) {
  const isAdminUser = user?.roleType === 'super_admin' || user?.roleType === 'admin_umum' || user?.roleType === 'ka_instalasi';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: (color) => <IconHome size={22} color={color} />,
      onPress: () => onNavigate('dashboard'),
    },
    {
      id: 'jadwal',
      label: 'Jadwal',
      icon: (color) => <IconCalendar size={22} color={color} />,
      onPress: () => onNavigate('dashboard', 'jadwal'), // Scroll atau navigasi ke bagian jadwal
    },
    {
      id: 'rekap',
      label: 'Riwayat',
      icon: (color) => <IconHistory size={22} color={color} />,
      onPress: () => onNavigate('rekap'),
    },
    ...(isAdminUser
      ? [
          {
            id: 'admin',
            label: 'Admin',
            icon: (color) => <IconShield size={22} color={color} />,
            onPress: () => onNavigate('admin'),
          },
        ]
      : [
          {
            id: 'profile',
            label: 'Profil',
            icon: (color) => <IconUser size={22} color={color} />,
            onPress: () => onNavigate('dashboard', 'profile'),
          },
        ]),
  ];

  return (
    <View
      style={[
        navStyles.container,
        {
          backgroundColor: theme?.cardSolid || '#ffffff',
          borderTopColor: theme?.borderSubtle || '#e2e8f0',
        },
      ]}
    >
      {navItems.map((item) => {
        const isActive = activeScreen === item.id;
        const activeColor = theme?.accent || '#0284c7';
        const inactiveColor = theme?.textMuted || '#94a3b8';
        const color = isActive ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={item.onPress}
            style={navStyles.tabItem}
          >
            <View style={[navStyles.iconWrap, isActive && { backgroundColor: theme?.pillBg || '#f0f9ff' }]}>
              {item.icon(color)}
            </View>
            <Text
              style={[
                navStyles.tabLabel,
                {
                  color,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {item.label}
            </Text>
            {isActive && <View style={[navStyles.activeDot, { backgroundColor: activeColor }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 14 : 6,
    paddingTop: 6,
    zIndex: 50,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
        }
      : { elevation: 8 }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  iconWrap: {
    width: 38,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 3,
    borderRadius: 2,
  },
});
