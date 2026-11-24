import React, { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DARK_THEME, LIGHT_THEME } from '../theme';
import { RSJ_LOGO_URI } from '../assets';
import TilokMap from '../components/TilokMap';
import {
  IconArrowLeft,
  IconCalendar,
  IconCheckCircle,
  IconChevronDown,
  IconClock,
  IconDownload,
  IconEdit,
  IconFileText,
  IconFilter,
  IconMapPin,
  IconMenu,
  IconMoreVertical,
  IconPlus,
  IconRefreshCw,
  IconSearch,
  IconSettings,
  IconShield,
  IconSliders,
  IconTrash,
  IconUsers,
  IconX,
} from '../components/Icons';

// =============================================================================
// INITIAL DATA CONSTANTS
// =============================================================================

const INITIAL_PDT_SUBMISSIONS = [
  {
    id: 'PDT-001',
    nama: 'Ners. Siti Aminah, S.Kep',
    nip: '19910512 201503 2 004',
    unit: 'Instalasi Rawat Inap',
    tanggal: '17 Nov 2026',
    jam: '07:35:10 WIB',
    lokasi: 'Dinas Kesehatan Prov. Riau (Jl. Cut Nyak Dien)',
    jarak: '4.8 km dari RSJ Tampan',
    alasan: 'Pelatihan Pelayanan Kesehatan Jiwa Terpadu Tingkat Provinsi',
    suratTugas: 'ST/DINKES-RIAU/XI/2026/089',
    status: 'Pending',
  },
  {
    id: 'PDT-002',
    nama: 'dr. Ahmad Fauzi, Sp.KJ',
    nip: '19790820 200604 1 008',
    unit: 'Instalasi Gawat Darurat (IGD)',
    tanggal: '16 Nov 2026',
    jam: '08:02:15 WIB',
    lokasi: 'Kemenkes RI Jakarta',
    jarak: '945 km dari RSJ Tampan',
    alasan: 'Rapat Koordinasi Nasional Standar Pelayanan Rumah Sakit Jiwa',
    suratTugas: 'ST/DIR-RSJT/XI/2026/042',
    status: 'Disetujui',
  },
  {
    id: 'PDT-003',
    nama: 'Rudi Hermawan, A.Md.Kep',
    nip: '19940214 201902 1 005',
    unit: 'Instalasi NAPZA',
    tanggal: '17 Nov 2026',
    jam: '07:50:40 WIB',
    lokasi: 'Puskesmas Simpang Baru (Tampan, Pekanbaru)',
    jarak: '1.8 km dari RSJ Tampan',
    alasan: 'Pendampingan Program Rehabilitasi Berbasis Masyarakat',
    suratTugas: 'ST/NAPZA-RSJT/XI/2026/019',
    status: 'Pending',
  },
];

const INITIAL_PEGAWAI = [
  {
    id: 1,
    name: 'Ners. Fitri Rahmadani, S.Kep',
    nip: '19890412 201402 2 003',
    role: 'Perawat Pelaksana - Shift Sore',
    roleType: 'pegawai',
    unit: 'Instalasi Rawat Inap',
    badge: 'Ners Rawat Inap',
    status: 'Aktif',
  },
  {
    id: 2,
    name: 'Ns. Bambang Irawan, S.Kep',
    nip: '19820315 200801 1 002',
    role: 'Kepala Instalasi / Katim',
    roleType: 'kainstalasi',
    unit: 'Instalasi Rawat Inap',
    badge: 'Ka. Instalasi',
    status: 'Aktif',
  },
  {
    id: 3,
    name: 'Hj. Erlina Sari, S.Sos',
    nip: '19850620 201001 2 005',
    role: 'Admin Umum (Kepegawaian)',
    roleType: 'admin_umum',
    unit: 'Subbag Kepegawaian & Tata Usaha',
    badge: 'Admin Umum',
    status: 'Aktif',
  },
  {
    id: 4,
    name: 'Ahmad Fauzan, S.Kom',
    nip: '19920101 201801 1 001',
    role: 'Super Admin (SIMRS & IT)',
    roleType: 'superadmin',
    unit: 'Instalasi SIMRS & Teknologi Informasi',
    badge: 'Super Admin',
    status: 'Aktif',
  },
  {
    id: 5,
    name: 'dr. Hendra Saputra, Sp.KJ',
    nip: '19780516 200501 1 004',
    role: 'Dokter Spesialis Jiwa - Jaga IGD',
    roleType: 'pegawai',
    unit: 'Instalasi Gawat Darurat (IGD)',
    badge: 'Dokter Jaga',
    status: 'Aktif',
  },
  {
    id: 6,
    name: 'dr. Maya Anggraini, Sp.KJ',
    nip: '19841125 200902 2 003',
    role: 'Dokter Spesialis Jiwa Konsultan',
    roleType: 'pegawai',
    unit: 'Poliklinik Rawat Jalan',
    badge: 'Dokter Spesialis',
    status: 'Aktif',
  },
];

const SHIFT_PALETTE = [
  { code: 'P', label: 'Pagi', time: '07:00–16:00', color: '#16a34a', bg: '#ecfdf5', text: '#065f46' },
  { code: 'S', label: 'Sore', time: '13:00–21:00', color: '#0284c7', bg: '#e0f2fe', text: '#0369a1' },
  { code: 'M', label: 'Malam', time: '20:30–07:30', color: '#7c3aed', bg: '#f3e8ff', text: '#6d28d9' },
  { code: 'D', label: 'Dording', time: '13:00–21:00', color: '#d97706', bg: '#fef3c7', text: '#b45309' },
  { code: 'C', label: 'Cuti', time: 'Izin Resmi', color: '#475569', bg: '#f1f5f9', text: '#334155' },
  { code: 'L', label: 'Libur', time: 'Off Dinas', color: '#64748b', bg: '#f8fafc', text: '#475569' },
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function AdminScreen({
  user,
  currentTime,
  attendance,
  onSwitchUser,
  onNavigate,
  onBack,
  isDarkMode = true,
  theme: propTheme,
}) {
  const theme = propTheme || (isDarkMode ? DARK_THEME : LIGHT_THEME);
  
  // Navigation active tab: 'ringkasan_pdt' | 'jadwal' | 'pegawai' | 'pengaturan' | 'log'
  const [activeTab, setActiveTab] = useState('ringkasan_pdt');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ===========================================================================
  // STATE 1: APPROVAL PDT
  // ===========================================================================
  const [pdtList, setPdtList] = useState(INITIAL_PDT_SUBMISSIONS);
  const [pdtFilter, setPdtFilter] = useState('all');

  const pendingPdtCount = useMemo(() => {
    return pdtList.filter((p) => p.status === 'Pending').length;
  }, [pdtList]);

  const filteredPdt = useMemo(() => {
    if (pdtFilter === 'all') return pdtList;
    return pdtList.filter((item) => item.status === pdtFilter);
  }, [pdtList, pdtFilter]);

  const handleApprovePdt = (id) => {
    setPdtList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Disetujui' } : item))
    );
    Alert.alert('PDT Disetujui!', `Pengajuan ${id} berhasil disetujui resmi oleh ${user?.name || 'Admin'}.`);
  };

  const handleRejectPdt = (id) => {
    setPdtList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Ditolak' } : item))
    );
    Alert.alert('PDT Ditolak!', `Pengajuan nomor ${id} telah ditolak.`);
  };

  const handleResetPdt = (id) => {
    setPdtList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Pending' } : item))
    );
  };

  // ===========================================================================
  // STATE 2: ATUR JADWAL DINAS & ROSTER
  // ===========================================================================
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const currentMonthNum = now.getMonth();
  const daysInMonth = new Date(currentYearNum, currentMonthNum + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYearNum, currentMonthNum, 1).getDay();

  const [selectedUnit, setSelectedUnit] = useState('Instalasi Rawat Inap');
  const [selectedPegawaiNip, setSelectedPegawaiNip] = useState('19890412 201402 2 003');
  const [activeBrushShift, setActiveBrushShift] = useState('P');
  const [hasUnsavedSchedule, setHasUnsavedSchedule] = useState(false);

  const [customRoster, setCustomRoster] = useState(() => {
    const s = {};
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(currentYearNum, currentMonthNum, d);
      const dow = dt.getDay();
      if (dow === 0 || dow === 6) s[d] = 'L';
      else if (d === 6) s[d] = 'C';
      else if (d === 19) s[d] = 'S';
      else if (d === 12 || d === 26) s[d] = 'D';
      else s[d] = 'P';
    }
    return s;
  });

  const handlePaintDay = (dayNum) => {
    setCustomRoster((prev) => ({
      ...prev,
      [dayNum]: activeBrushShift,
    }));
    setHasUnsavedSchedule(true);
  };

  const handleAutoFillPattern = () => {
    const s = {};
    const pattern = ['P', 'P', 'S', 'S', 'M', 'L'];
    for (let d = 1; d <= daysInMonth; d++) {
      s[d] = pattern[(d - 1) % pattern.length];
    }
    setCustomRoster(s);
    setHasUnsavedSchedule(true);
    Alert.alert('Pola Diterapkan', 'Jadwal diisi otomatis dengan rotasi Pagi-Pagi-Sore-Sore-Malam-Libur.');
  };

  const handleCopyLastMonth = () => {
    setHasUnsavedSchedule(true);
    Alert.alert('Sukses Disalin', 'Jadwal dinas dari bulan lalu berhasil disalin ke bulan ini.');
  };

  const handleSaveSchedule = () => {
    setHasUnsavedSchedule(false);
    Alert.alert('Jadwal Tersimpan!', `Jadwal dinas unit ${selectedUnit} bulan ${MONTHS_ID[currentMonthNum]} ${currentYearNum} berhasil disimpan resmi ke server.`);
  };

  // Staffing count summary
  const staffingCounts = useMemo(() => {
    const counts = { P: 0, S: 0, M: 0, D: 0, C: 0, L: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const code = customRoster[d] || 'P';
      if (counts[code] !== undefined) counts[code]++;
    }
    return counts;
  }, [customRoster, daysInMonth]);

  // ===========================================================================
  // STATE 3: MASTER PEGAWAI
  // ===========================================================================
  const [pegawaiList, setPegawaiList] = useState(INITIAL_PEGAWAI);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedPegawaiAction, setSelectedPegawaiAction] = useState(null); // for action popover/modal
  const [addPegawaiModal, setAddPegawaiModal] = useState(false);
  const [editPegawaiModal, setEditPegawaiModal] = useState(null);

  // Form states for add/edit
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formRole, setFormRole] = useState('Perawat Pelaksana');
  const [formUnit, setFormUnit] = useState('Instalasi Rawat Inap');
  const [formBadge, setFormBadge] = useState('Staf RSJ');

  const filteredPegawai = useMemo(() => {
    return pegawaiList.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nip.includes(searchQuery);
      const matchUnit = filterUnit === 'all' || p.unit === filterUnit;
      const matchRole = filterRole === 'all' || p.roleType === filterRole;
      return matchSearch && matchUnit && matchRole;
    });
  }, [pegawaiList, searchQuery, filterUnit, filterRole]);

  const handleOpenAddModal = () => {
    setFormNama('');
    setFormNip('');
    setFormRole('Perawat Pelaksana');
    setFormUnit('Instalasi Rawat Inap');
    setFormBadge('Staf RSJ');
    setAddPegawaiModal(true);
  };

  const handleSaveNewPegawai = () => {
    if (!formNama.trim() || !formNip.trim()) {
      Alert.alert('Data Belum Lengkap', 'Nama lengkap dan NIP wajib diisi.');
      return;
    }
    const newPeg = {
      id: Date.now(),
      name: formNama.trim(),
      nip: formNip.trim(),
      role: formRole.trim(),
      roleType: 'pegawai',
      unit: formUnit.trim(),
      badge: formBadge.trim(),
      status: 'Aktif',
    };
    setPegawaiList((prev) => [newPeg, ...prev]);
    setAddPegawaiModal(false);
    Alert.alert('Sukses', `Pegawai ${newPeg.name} berhasil ditambahkan.`);
  };

  const handleOpenEditModal = (peg) => {
    setFormNama(peg.name);
    setFormNip(peg.nip);
    setFormRole(peg.role);
    setFormUnit(peg.unit);
    setFormBadge(peg.badge);
    setEditPegawaiModal(peg);
    setSelectedPegawaiAction(null);
  };

  const handleSaveEditPegawai = () => {
    if (!editPegawaiModal) return;
    setPegawaiList((prev) =>
      prev.map((item) =>
        item.id === editPegawaiModal.id
          ? {
              ...item,
              name: formNama.trim(),
              nip: formNip.trim(),
              role: formRole.trim(),
              unit: formUnit.trim(),
              badge: formBadge.trim(),
            }
          : item
      )
    );
    setEditPegawaiModal(null);
    Alert.alert('Sukses', 'Data pegawai berhasil diperbarui.');
  };

  const handleToggleStatusPegawai = (peg) => {
    setSelectedPegawaiAction(null);
    const newStatus = peg.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    Alert.alert(
      'Ubah Status Pegawai',
      `Apakah Anda yakin ingin mengubah status ${peg.name} menjadi [${newStatus}]?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Ubah',
          onPress: () => {
            setPegawaiList((prev) =>
              prev.map((item) => (item.id === peg.id ? { ...item, status: newStatus } : item))
            );
          },
        },
      ]
    );
  };

  const handleSwitchLogin = (peg) => {
    setSelectedPegawaiAction(null);
    Alert.alert(
      'Masuk Sebagai Akun Ini',
      `Anda akan beralih akun dan bertindak sebagai ${peg.name} (${peg.badge}). Tindakan ini dicatat dalam sistem audit log.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjutkan',
          onPress: () => {
            if (onSwitchUser) onSwitchUser(peg);
          },
        },
      ]
    );
  };

  // ===========================================================================
  // STATE 4: JAM ABSEN & GEOFENCE TILOK
  // ===========================================================================
  const [tilokLat, setTilokLat] = useState('0.465791');
  const [tilokLong, setTilokLong] = useState('101.381957');
  const [tilokRadius, setTilokRadius] = useState('200');
  const [jamPagiMasuk, setJamPagiMasuk] = useState('07:00');
  const [jamPagiPulang, setJamPagiPulang] = useState('16:00');
  const [jamSoreMasuk, setJamSoreMasuk] = useState('13:00');
  const [jamSorePulang, setJamSorePulang] = useState('21:00');
  const [toleransiMenit, setToleransiMenit] = useState('15');
  const [tilokSavedToast, setTilokSavedToast] = useState(false);

  const handleSaveGeofence = () => {
    setTilokSavedToast(true);
    setTimeout(() => setTilokSavedToast(false), 3500);
    Alert.alert('Pengaturan Tersimpan!', 'Koordinat geofencing tilok dan jam kerja berhasil disinkronkan ke seluruh perangkat mobile pegawai.');
  };

  const handleUseMyLocation = () => {
    Alert.alert('Lokasi GPS Didapat', 'Koordinat RSJ Tampan Pekanbaru tervalidasi aktif.');
  };

  // ===========================================================================
  // STATE 5: LOG AUDIT & DEMO TOOLS
  // ===========================================================================
  const [showDemoZone, setShowDemoZone] = useState(false);
  const [logFilterStatus, setLogFilterStatus] = useState('all');

  const attendanceLogs = [
    { id: 1, name: 'Ners. Fitri Rahmadani, S.Kep', nip: '19890412 201402 2 003', unit: 'Rawat Inap', shift: 'Pagi', masuk: '07:02', pulang: '16:05', status: 'Hadir Tepat Waktu', badgeColor: '#16a34a', code: 'SWM 100%' },
    { id: 2, name: 'dr. Hendra Saputra, Sp.KJ', nip: '19780516 200501 1 004', unit: 'IGD Jiwa', shift: 'Pagi', masuk: '07:15', pulang: '16:10', status: 'Hadir Tepat Waktu', badgeColor: '#16a34a', code: 'SWM 100%' },
    { id: 3, name: 'Ners. Siti Aminah, S.Kep', nip: '19910512 201503 2 004', unit: 'Rawat Inap', shift: 'Pagi', masuk: '07:35', pulang: '16:00', status: 'PDT Disetujui', badgeColor: '#0284c7', code: 'PDT Sah' },
    { id: 4, name: 'Rudi Hermawan, A.Md.Kep', nip: '19940214 201902 1 005', unit: 'Instalasi NAPZA', shift: 'Pagi', masuk: '07:22', pulang: '-', status: 'Terlambat 22m', badgeColor: '#d97706', code: 'TL 90%' },
    { id: 5, name: 'dr. Maya Anggraini, Sp.KJ', nip: '19841125 200902 2 003', unit: 'Rawat Jalan', shift: 'Pagi', masuk: '07:08', pulang: '16:12', status: 'Hadir Tepat Waktu', badgeColor: '#16a34a', code: 'SWM 100%' },
    { id: 6, name: 'Ns. Bambang Irawan, S.Kep', nip: '19820315 200801 1 002', unit: 'Rawat Inap', shift: 'Pagi', masuk: '-', pulang: '-', status: 'Belum Absen', badgeColor: '#ef4444', code: 'Alpa / Off' },
  ];

  const filteredLogs = useMemo(() => {
    if (logFilterStatus === 'all') return attendanceLogs;
    if (logFilterStatus === 'hadir') return attendanceLogs.filter((l) => l.status.includes('Hadir'));
    if (logFilterStatus === 'terlambat') return attendanceLogs.filter((l) => l.status.includes('Terlambat'));
    if (logFilterStatus === 'pdt') return attendanceLogs.filter((l) => l.status.includes('PDT'));
    if (logFilterStatus === 'belum') return attendanceLogs.filter((l) => l.status.includes('Belum'));
    return attendanceLogs;
  }, [logFilterStatus]);

  const handleExportLog = (format) => {
    Alert.alert('Ekspor Berhasil', `Laporan absensi tanggal ${now.toLocaleDateString('id-ID')} format ${format} siap diunduh.`);
  };

  const handleResetPresensiDemo = () => {
    Alert.alert(
      'Konfirmasi Reset Presensi',
      'Reset status presensi seluruh pegawai hari ini untuk keperluan demonstrasi pengujian magang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Reset Sekarang',
          style: 'destructive',
          onPress: () => Alert.alert('Sukses', 'Status absensi seluruh akun hari ini berhasil direset ke status awal.'),
        },
      ]
    );
  };

  // Nav Items list
  const navTabs = [
    { id: 'ringkasan_pdt', label: 'Ringkasan & PDT', icon: IconFileText, badge: pendingPdtCount },
    { id: 'jadwal', label: 'Atur Jadwal Dinas', icon: IconCalendar, unsaved: hasUnsavedSchedule },
    { id: 'pegawai', label: 'Master Pegawai', icon: IconUsers, count: pegawaiList.length },
    { id: 'pengaturan', label: 'Jam & Geofence', icon: IconMapPin },
    { id: 'log', label: 'Log Presensi & Demo', icon: IconSliders },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.bgMain }]}>
      {/* ===================================================================== */}
      {/* 1. TOP BAR HEADER: BERSIH & SATU TOMBOL KEMBALI                       */}
      {/* ===================================================================== */}
      <View style={[styles.topBar, { backgroundColor: theme.cardSolid, borderBottomColor: theme.borderSubtle }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.mobileHamburgerBtn}
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            accessibilityLabel="Buka Menu Admin"
          >
            <IconMenu size={22} color={theme.textMain} />
          </TouchableOpacity>

          <View style={styles.brandTitleRow}>
            <View style={styles.brandLogoCircle}>
              <Image source={{ uri: RSJ_LOGO_URI }} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.topBarBrandTitle, { color: theme.textMain }]}>SIAP RSJ Tampan</Text>
                <View style={styles.adminTag}>
                  <Text style={styles.adminTagText}>PANEL ADMIN</Text>
                </View>
              </View>
              <Text style={[styles.breadcrumbText, { color: theme.textMuted }]}>
                Admin / {navTabs.find((t) => t.id === activeTab)?.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <View style={[styles.adminIdentityBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
            <View style={styles.onlineDot} />
            <Text style={[styles.adminNameText, { color: theme.textMain }]} numberOfLines={1}>
              {user?.name || 'Ahmad Fauzan, S.Kom'}
            </Text>
            <Text style={[styles.adminRoleText, { color: theme.accent }]}>
              {user?.badge || 'Super Admin'}
            </Text>
          </View>

          {/* SATU TOMBOL RESMI KEMBALI KE PORTAL PEGAWAI */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={[styles.backToPortalBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
          >
            <IconArrowLeft size={16} color={theme.textMain} />
            <Text style={[styles.backToPortalBtnText, { color: theme.textMain }]}>
              Portal Pegawai
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================================================================== */}
      {/* 2. BODY LAYOUT: SIDEBAR RESPONSIVE + CONTENT AREA                     */}
      {/* ===================================================================== */}
      <View style={styles.mainLayout}>
        {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
        <View
          style={[
            styles.sidebar,
            { backgroundColor: theme.cardSolid, borderRightColor: theme.borderSubtle },
            mobileMenuOpen && styles.sidebarMobileOpen,
          ]}
        >
          <Text style={[styles.sidebarSectionTitle, { color: theme.textMuted }]}>MENU KENDALI</Text>
          <View style={{ gap: 6 }}>
            {navTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  style={[
                    styles.navItem,
                    isActive && { backgroundColor: theme.pillBg, borderColor: theme.accent },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <TabIcon size={18} color={isActive ? theme.accent : theme.textMuted} />
                    <Text
                      style={[
                        styles.navItemText,
                        { color: isActive ? theme.textMain : theme.textSub, fontWeight: isActive ? '800' : '600' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{tab.badge}</Text>
                    </View>
                  )}
                  {tab.unsaved && (
                    <View style={[styles.badgePill, { backgroundColor: '#f59e0b' }]}>
                      <Text style={styles.badgePillText}>Draft</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Text style={[styles.sidebarFooterText, { color: theme.textMuted }]}>
              SIAP SIMRS v2.4{'\n'}RS Jiwa Tampan Prov. Riau
            </Text>
          </View>
        </View>

        {/* CONTENT AREA */}
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ================================================================= */}
          {/* TAB 1: RINGKASAN & APPROVAL PDT                                  */}
          {/* ================================================================= */}
          {activeTab === 'ringkasan_pdt' && (
            <View style={{ gap: 16 }}>
              {/* TOP KPI OVERVIEW CARDS (KHUSUS DI HALAMAN RINGKASAN) */}
              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                    <IconUsers size={20} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Total Pegawai</Text>
                    <Text style={[styles.kpiValue, { color: theme.textMain }]}>{pegawaiList.length} Orang</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                    <IconFileText size={20} color="#f59e0b" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>PDT Menunggu</Text>
                    <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{pendingPdtCount} Berkas</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                    <IconMapPin size={20} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Radius Geofence</Text>
                    <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{tilokRadius} Meter</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
                    <IconClock size={20} color="#7c3aed" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Jam Sistem RS</Text>
                    <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{currentTime || '10:30 WIB'}</Text>
                  </View>
                </View>
              </View>

              {/* PDT LIST CONTAINER */}
              <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textMain }]}>Verifikasi Pengajuan PDT</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                      Wewenang: Admin Kepegawaian & Super Admin SIAP
                    </Text>
                  </View>

                  {/* Filter Pills */}
                  <View style={styles.filterPillsRow}>
                    {['all', 'Pending', 'Disetujui', 'Ditolak'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setPdtFilter(st)}
                        style={[
                          styles.filterPillBtn,
                          pdtFilter === st
                            ? { backgroundColor: theme.accent }
                            : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            { color: pdtFilter === st ? '#ffffff' : theme.textSub },
                          ]}
                        >
                          {st === 'all' ? 'Semua Berkas' : st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ gap: 12, marginTop: 12 }}>
                  {filteredPdt.map((pdt) => {
                    const isPending = pdt.status === 'Pending';
                    const isApproved = pdt.status === 'Disetujui';
                    const isRejected = pdt.status === 'Ditolak';

                    return (
                      <View
                        key={pdt.id}
                        style={[
                          styles.pdtItemCard,
                          {
                            backgroundColor: theme.pillBg,
                            borderColor: isPending ? '#f59e0b' : isApproved ? '#16a34a' : '#ef4444',
                          },
                        ]}
                      >
                        <View style={styles.pdtItemHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.pdtNama, { color: theme.textMain }]}>{pdt.nama}</Text>
                              <View style={[styles.pdtIdTag, { backgroundColor: theme.cardSolid }]}>
                                <Text style={[styles.pdtIdText, { color: theme.textMuted }]}>{pdt.id}</Text>
                              </View>
                            </View>
                            <Text style={[styles.pdtMeta, { color: theme.textSub }]}>
                              NIP: {pdt.nip} • {pdt.unit}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: isPending
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : isApproved
                                  ? 'rgba(22, 163, 74, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color: isPending ? '#d97706' : isApproved ? '#16a34a' : '#dc2626',
                                },
                              ]}
                            >
                              {pdt.status}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.pdtDetailBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                          <Text style={[styles.pdtDetailLine, { color: theme.textMain }]}>
                            📍 <Text style={{ fontWeight: '700' }}>Tujuan:</Text> {pdt.lokasi} ({pdt.jarak})
                          </Text>
                          <Text style={[styles.pdtDetailLine, { color: theme.textMain }]}>
                            📝 <Text style={{ fontWeight: '700' }}>Alasan:</Text> {pdt.alasan}
                          </Text>
                          <Text style={[styles.pdtDetailLine, { color: theme.textMain }]}>
                            📄 <Text style={{ fontWeight: '700' }}>Surat Tugas:</Text> {pdt.suratTugas}
                          </Text>
                          <Text style={[styles.pdtTimeLine, { color: theme.textMuted }]}>
                            ⏱️ Tanggal & Jam Pengajuan: {pdt.tanggal} — {pdt.jam}
                          </Text>
                        </View>

                        {/* Aksi Persetujuan */}
                        <View style={styles.pdtActionRow}>
                          {isPending ? (
                            <>
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => handleApprovePdt(pdt.id)}
                                style={[styles.actionBtnApprove, { backgroundColor: '#16a34a' }]}
                              >
                                <Text style={styles.actionBtnTextWhite}>✓ Setujui Pengajuan</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => handleRejectPdt(pdt.id)}
                                style={[styles.actionBtnReject, { backgroundColor: '#ef4444' }]}
                              >
                                <Text style={styles.actionBtnTextWhite}>✕ Tolak</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => handleResetPdt(pdt.id)}
                              style={[styles.actionBtnReset, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
                            >
                              <Text style={[styles.actionBtnResetText, { color: theme.textSub }]}>
                                ↺ Kembalikan ke Status Menunggu
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* TAB 2: ATUR JADWAL DINAS & ROSTER (7 KOLOM & KUAS SHIFT)          */}
          {/* ================================================================= */}
          {activeTab === 'jadwal' && (
            <View style={{ gap: 16 }}>
              {/* HEADER TOOLBAR */}
              <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textMain }]}>Penetapan Jadwal & Roster Dinas</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                      Pilih unit, pegawai, dan terapkan shift dengan mudah
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {hasUnsavedSchedule && (
                      <View style={[styles.unsavedBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#d97706' }}>⚠️ Perubahan Belum Disimpan</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSaveSchedule}
                      style={[styles.saveScheduleBtn, { backgroundColor: '#16a34a' }]}
                    >
                      <Text style={styles.saveScheduleBtnText}>💾 Simpan Jadwal</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* FILTER UNIT & PEGAWAI */}
                <View style={styles.scheduleFiltersRow}>
                  <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSub }]}>Unit Kerja:</Text>
                    <View style={styles.unitSelectorScroll}>
                      {['Instalasi Rawat Inap', 'IGD Jiwa', 'Instalasi NAPZA', 'Rawat Jalan'].map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          onPress={() => setSelectedUnit(unit)}
                          style={[
                            styles.unitChipBtn,
                            selectedUnit === unit
                              ? { backgroundColor: theme.accent }
                              : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              { color: selectedUnit === unit ? '#ffffff' : theme.textSub },
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSub }]}>Pegawai Ditugaskan:</Text>
                    <View style={styles.pegawaiSelectorRow}>
                      {pegawaiList
                        .filter((p) => p.unit === selectedUnit)
                        .map((p) => (
                          <TouchableOpacity
                            key={p.nip}
                            onPress={() => setSelectedPegawaiNip(p.nip)}
                            style={[
                              styles.pegawaiChipBtn,
                              selectedPegawaiNip === p.nip
                                ? { backgroundColor: '#16a34a', borderColor: '#15803d' }
                                : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pegawaiChipText,
                                { color: selectedPegawaiNip === p.nip ? '#ffffff' : theme.textMain },
                              ]}
                            >
                              {p.name.split(',')[0]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                </View>

                {/* SHIFT PALETTE TOOLBAR (MODE KUAS SHIFT) */}
                <View style={[styles.brushToolbarBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.brushToolbarTitle, { color: theme.textMain }]}>
                      🎨 Kuas Shift Aktif: <Text style={{ color: theme.accent }}>Klik tanggal di bawah untuk menempel shift</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleAutoFillPattern}
                        style={[styles.quickToolBtn, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
                      >
                        <Text style={[styles.quickToolBtnText, { color: theme.textSub }]}>⚡ Pola Otomatis</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleCopyLastMonth}
                        style={[styles.quickToolBtn, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
                      >
                        <Text style={[styles.quickToolBtnText, { color: theme.textSub }]}>📋 Salin Bln Lalu</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.palettePillRow}>
                    {SHIFT_PALETTE.map((sh) => {
                      const isSelected = activeBrushShift === sh.code;
                      return (
                        <TouchableOpacity
                          key={sh.code}
                          activeOpacity={0.8}
                          onPress={() => setActiveBrushShift(sh.code)}
                          style={[
                            styles.palettePillBtn,
                            {
                              backgroundColor: isSelected ? sh.color : theme.cardSolid,
                              borderColor: isSelected ? sh.color : theme.borderSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.palettePillCode,
                              { color: isSelected ? '#ffffff' : sh.color },
                            ]}
                          >
                            [{sh.code}]
                          </Text>
                          <Text
                            style={[
                              styles.palettePillLabel,
                              { color: isSelected ? '#ffffff' : theme.textMain },
                            ]}
                          >
                            {sh.label} ({sh.time})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 7-COLUMN CALENDAR (MIN-SAB) DENGAN UKURAN PROPORSIONAL */}
                <View style={styles.calendarContainer}>
                  {/* Header Nama Hari */}
                  <View style={styles.dayNamesHeaderRow}>
                    {DAY_NAMES_ID.map((dn, idx) => (
                      <View key={dn} style={styles.dayNameCell}>
                        <Text
                          style={[
                            styles.dayNameText,
                            { color: idx === 0 || idx === 6 ? '#ef4444' : theme.textMuted },
                          ]}
                        >
                          {dn}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Grid Cells */}
                  <View style={styles.daysGrid}>
                    {/* Padding cells for first day of month */}
                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                      <View key={`empty-${i}`} style={styles.emptyDayCell} />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                      const code = customRoster[dayNum] || 'P';
                      const isToday = dayNum === now.getDate();
                      const shift = SHIFT_PALETTE.find((s) => s.code === code) || SHIFT_PALETTE[0];
                      const isDording = code === 'D';

                      return (
                        <TouchableOpacity
                          key={`cal-${dayNum}`}
                          activeOpacity={0.7}
                          onPress={() => handlePaintDay(dayNum)}
                          style={[
                            styles.calDayCell,
                            {
                              backgroundColor: shift.bg,
                              borderColor: isToday ? theme.accent : shift.color,
                              borderWidth: isToday ? 2.5 : 1,
                            },
                          ]}
                        >
                          <View style={styles.calDayTopRow}>
                            <Text
                              style={[
                                styles.calDayNumText,
                                { color: isToday ? theme.accent : '#0f172a' },
                              ]}
                            >
                              {dayNum}
                            </Text>
                            {isDording && (
                              <View style={styles.dordingBadgeCircle}>
                                <Text style={styles.dordingBadgeText}>D</Text>
                              </View>
                            )}
                          </View>

                          <View
                            style={[
                              styles.shiftCodeBadge,
                              { backgroundColor: shift.color },
                            ]}
                          >
                            <Text style={styles.shiftCodeBadgeText}>{code}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* STATISTIK DISTRIBUSI PETUGAS */}
                <View style={[styles.staffingSummaryRow, { borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.staffingSummaryTitle, { color: theme.textMuted }]}>
                    Distribusi Shift Bulan Ini:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    {SHIFT_PALETTE.map((sh) => (
                      <View key={sh.code} style={styles.staffingCountChip}>
                        <View style={[styles.staffingDot, { backgroundColor: sh.color }]} />
                        <Text style={[styles.staffingText, { color: theme.textMain }]}>
                          {sh.code}: <Text style={{ fontWeight: '800' }}>{staffingCounts[sh.code] || 0}</Text> hari
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* TAB 3: MASTER DATA PEGAWAI RSJ TAMPAN                             */}
          {/* ================================================================= */}
          {activeTab === 'pegawai' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textMain }]}>Master Data Pegawai RSJ</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                      Total {pegawaiList.length} Pegawai aktif terdaftar dalam sistem
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleOpenAddModal}
                    style={[styles.addPegawaiBtn, { backgroundColor: '#16a34a' }]}
                  >
                    <IconPlus size={16} color="#ffffff" />
                    <Text style={styles.addPegawaiBtnText}>Tambah Pegawai</Text>
                  </TouchableOpacity>
                </View>

                {/* FILTER & SEARCH BAR */}
                <View style={styles.pegawaiToolbarRow}>
                  <View style={[styles.searchBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                    <IconSearch size={18} color={theme.textMuted} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.textMain }]}
                      placeholder="Cari berdasarkan nama atau NIP..."
                      placeholderTextColor={theme.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <IconX size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.filterDropdownRow}>
                    {/* Filter Unit */}
                    <View style={styles.unitFilterChips}>
                      {['all', 'Instalasi Rawat Inap', 'Instalasi Gawat Darurat (IGD)'].map((u) => (
                        <TouchableOpacity
                          key={u}
                          onPress={() => setFilterUnit(u)}
                          style={[
                            styles.filterChip,
                            filterUnit === u
                              ? { backgroundColor: theme.accent }
                              : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              { color: filterUnit === u ? '#ffffff' : theme.textSub },
                            ]}
                          >
                            {u === 'all' ? 'Semua Unit' : u.replace('Instalasi ', '')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* MODERN TABLE DATA PEGAWAI */}
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={[styles.tableHeaderRow, { backgroundColor: theme.pillBg, borderBottomColor: theme.borderSubtle }]}>
                    <Text style={[styles.thText, { flex: 2.5, color: theme.textMuted }]}>PEGAWAI & NIP</Text>
                    <Text style={[styles.thText, { flex: 2, color: theme.textMuted }]}>JABATAN & ROLE</Text>
                    <Text style={[styles.thText, { flex: 2, color: theme.textMuted }]}>UNIT KERJA</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'center', color: theme.textMuted }]}>STATUS</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'center', color: theme.textMuted }]}>AKSI</Text>
                  </View>

                  {/* Table Rows */}
                  {filteredPegawai.map((p) => {
                    const isSuperAdmin = p.roleType === 'superadmin';
                    const isAdminUmum = p.roleType === 'admin_umum';
                    const isKatim = p.roleType === 'kainstalasi';

                    let roleBadgeBg = 'rgba(2, 132, 199, 0.12)';
                    let roleBadgeColor = '#0284c7';
                    if (isSuperAdmin) {
                      roleBadgeBg = 'rgba(124, 58, 237, 0.15)';
                      roleBadgeColor = '#7c3aed';
                    } else if (isAdminUmum) {
                      roleBadgeBg = 'rgba(217, 119, 6, 0.15)';
                      roleBadgeColor = '#d97706';
                    } else if (isKatim) {
                      roleBadgeBg = 'rgba(22, 163, 74, 0.15)';
                      roleBadgeColor = '#16a34a';
                    }

                    return (
                      <View
                        key={p.id}
                        style={[styles.tableRow, { borderBottomColor: theme.borderSubtle }]}
                      >
                        {/* Nama & NIP */}
                        <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.pegawaiAvatarBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                            <Text style={[styles.pegawaiAvatarText, { color: theme.accent }]}>
                              {p.name.charAt(0)}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pegawaiNameText, { color: theme.textMain }]} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={[styles.pegawaiNipText, { color: theme.textSub }]}>
                              NIP. {p.nip}
                            </Text>
                          </View>
                        </View>

                        {/* Jabatan & Role Badge */}
                        <View style={{ flex: 2, justifyContent: 'center' }}>
                          <Text style={[styles.pegawaiRoleDesc, { color: theme.textMain }]} numberOfLines={1}>
                            {p.role}
                          </Text>
                          <View style={[styles.roleBadgePill, { backgroundColor: roleBadgeBg }]}>
                            <Text style={[styles.roleBadgeText, { color: roleBadgeColor }]}>
                              {p.badge}
                            </Text>
                          </View>
                        </View>

                        {/* Unit Kerja */}
                        <View style={{ flex: 2, justifyContent: 'center' }}>
                          <Text style={[styles.pegawaiUnitText, { color: theme.textSub }]}>
                            {p.unit}
                          </Text>
                        </View>

                        {/* Status */}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <View
                            style={[
                              styles.statusIndicatorPill,
                              {
                                backgroundColor:
                                  p.status === 'Aktif'
                                    ? 'rgba(22, 163, 74, 0.12)'
                                    : 'rgba(239, 68, 68, 0.12)',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusIndicatorDot,
                                { backgroundColor: p.status === 'Aktif' ? '#16a34a' : '#ef4444' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusIndicatorText,
                                { color: p.status === 'Aktif' ? '#16a34a' : '#ef4444' },
                              ]}
                            >
                              {p.status}
                            </Text>
                          </View>
                        </View>

                        {/* Aksi Menu ⋮ */}
                        <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center' }}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setSelectedPegawaiAction(p)}
                            style={[styles.actionMoreBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                          >
                            <IconMoreVertical size={18} color={theme.textMain} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ACTION MENU POPOVER MODAL (TITIK TIGA) */}
              <Modal
                visible={selectedPegawaiAction !== null}
                transparent
                animationType="fade"
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setSelectedPegawaiAction(null)}
                  style={styles.modalOverlay}
                >
                  <View style={[styles.actionMenuModalCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                    <View style={styles.actionMenuHeader}>
                      <Text style={[styles.actionMenuTitle, { color: theme.textMain }]}>
                        {selectedPegawaiAction?.name}
                      </Text>
                      <Text style={[styles.actionMenuSub, { color: theme.textMuted }]}>
                        NIP: {selectedPegawaiAction?.nip}
                      </Text>
                    </View>

                    <View style={{ gap: 6, marginVertical: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenEditModal(selectedPegawaiAction)}
                        style={[styles.actionMenuItem, { backgroundColor: theme.pillBg }]}
                      >
                        <IconEdit size={16} color={theme.textMain} />
                        <Text style={[styles.actionMenuItemText, { color: theme.textMain }]}>
                          Edit Profil Pegawai
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleToggleStatusPegawai(selectedPegawaiAction)}
                        style={[styles.actionMenuItem, { backgroundColor: theme.pillBg }]}
                      >
                        <IconTrash size={16} color="#ef4444" />
                        <Text style={[styles.actionMenuItemText, { color: '#ef4444' }]}>
                          {selectedPegawaiAction?.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        </Text>
                      </TouchableOpacity>

                      {/* FITUR KHUSUS SUPER ADMIN: LOGIN SEBAGAI AKUN INI */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSwitchLogin(selectedPegawaiAction)}
                        style={[styles.actionMenuItem, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}
                      >
                        <IconRefreshCw size={16} color="#0284c7" />
                        <Text style={[styles.actionMenuItemText, { color: '#0284c7', fontWeight: '800' }]}>
                          Masuk Sebagai Akun Ini
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedPegawaiAction(null)}
                      style={[styles.actionMenuCancelBtn, { borderColor: theme.borderSubtle }]}
                    >
                      <Text style={[styles.actionMenuCancelText, { color: theme.textMuted }]}>Tutup</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* MODAL TAMBAH / EDIT PEGAWAI */}
              <Modal visible={addPegawaiModal || editPegawaiModal !== null} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={[styles.formModalCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                    <View style={styles.formModalHeader}>
                      <Text style={[styles.formModalTitle, { color: theme.textMain }]}>
                        {editPegawaiModal ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setAddPegawaiModal(false);
                          setEditPegawaiModal(null);
                        }}
                      >
                        <IconX size={20} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 12, marginVertical: 14 }}>
                      <View style={{ gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Nama Lengkap & Gelar:</Text>
                        <TextInput
                          style={[styles.formTextInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          placeholder="Contoh: Ners. Sri Wahyuni, S.Kep"
                          placeholderTextColor={theme.textMuted}
                          value={formNama}
                          onChangeText={setFormNama}
                        />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>NIP Pegawai:</Text>
                        <TextInput
                          style={[styles.formTextInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          placeholder="Contoh: 19940812 201902 2 003"
                          placeholderTextColor={theme.textMuted}
                          value={formNip}
                          onChangeText={setFormNip}
                        />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Jabatan Pegawai:</Text>
                        <TextInput
                          style={[styles.formTextInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          value={formRole}
                          onChangeText={setFormRole}
                        />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Unit Penugasan:</Text>
                        <TextInput
                          style={[styles.formTextInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          value={formUnit}
                          onChangeText={setFormUnit}
                        />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Badge / Label Singkat:</Text>
                        <TextInput
                          style={[styles.formTextInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          value={formBadge}
                          onChangeText={setFormBadge}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={() => {
                          setAddPegawaiModal(false);
                          setEditPegawaiModal(null);
                        }}
                        style={[styles.formCancelBtn, { borderColor: theme.borderSubtle }]}
                      >
                        <Text style={[styles.formCancelBtnText, { color: theme.textSub }]}>Batal</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={editPegawaiModal ? handleSaveEditPegawai : handleSaveNewPegawai}
                        style={[styles.formSubmitBtn, { backgroundColor: '#16a34a' }]}
                      >
                        <Text style={styles.formSubmitBtnText}>
                          {editPegawaiModal ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          )}

          {/* ================================================================= */}
          {/* TAB 4: JAM OPERASIONAL & MASTER TILOK GEOFENCING (2 KOLOM)         */}
          {/* ================================================================= */}
          {activeTab === 'pengaturan' && (
            <View style={{ gap: 16 }}>
              {tilokSavedToast && (
                <View style={styles.toastSuccessBox}>
                  <IconCheckCircle size={18} color="#16a34a" />
                  <Text style={styles.toastSuccessText}>
                    Pengaturan geofence tilok & jam kerja berhasil disimpan dan aktif!
                  </Text>
                </View>
              )}

              <View style={styles.twoColumnGrid}>
                {/* KOLOM KIRI: PETA & GEOFENCE TILOK RSJ TAMPAN */}
                <View style={[styles.cardBox, { flex: 1, backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.textMain }]}>Titik Lokasi (Tilok) Geofence</Text>
                      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                        Zona absensi sah di RS Jiwa Tampan
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleUseMyLocation}
                      style={[styles.gpsActionBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                    >
                      <IconMapPin size={14} color={theme.accent} />
                      <Text style={[styles.gpsActionBtnText, { color: theme.accent }]}>Cek GPS</Text>
                    </TouchableOpacity>
                  </View>

                  {/* INTERACTIVE LEAFLET TILOK MAP PREVIEW */}
                  <View style={styles.tilokMapWrapper}>
                    <TilokMap
                      latitude={parseFloat(tilokLat) || 0.465791}
                      longitude={parseFloat(tilokLong) || 101.381957}
                      radius={parseInt(tilokRadius, 10) || 200}
                      height={260}
                      cleanMode={false}
                    />
                  </View>

                  {/* FORM INPUT KOORDINAT & RADIUS */}
                  <View style={{ gap: 10, marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Latitude Tilok:</Text>
                        <TextInput
                          style={[styles.cleanInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          value={tilokLat}
                          onChangeText={setTilokLat}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Longitude Tilok:</Text>
                        <TextInput
                          style={[styles.cleanInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                          value={tilokLong}
                          onChangeText={setTilokLong}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.inputFieldLabel, { color: theme.textSub }]}>Radius Geofence Sah:</Text>
                        <Text style={[styles.radiusHighlightText, { color: theme.accent }]}>{tilokRadius} Meter</Text>
                      </View>
                      <TextInput
                        style={[styles.cleanInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                        value={tilokRadius}
                        onChangeText={setTilokRadius}
                        keyboardType="numeric"
                      />
                      <Text style={[styles.inputHelpText, { color: theme.textMuted }]}>
                        Pegawai hanya dapat melakukan presensi normal jika berada dalam radius ini.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* KOLOM KANAN: JAM OPERASIONAL SHIFT & TOLERANSI */}
                <View style={[styles.cardBox, { flex: 1, backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.textMain }]}>Jam Kerja & Toleransi Shift</Text>
                      <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                        Jadwal masuk & pulang resmi per shift
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 14 }}>
                    {/* Shift Pagi */}
                    <View style={[styles.shiftConfigCard, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <View style={[styles.shiftIndicatorBar, { backgroundColor: '#16a34a' }]} />
                        <Text style={[styles.shiftConfigTitle, { color: theme.textMain }]}>Shift Pagi (Reguler)</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={[styles.inputSubLabel, { color: theme.textSub }]}>Jam Masuk:</Text>
                          <TextInput
                            style={[styles.cleanInput, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, color: theme.textMain }]}
                            value={jamPagiMasuk}
                            onChangeText={setJamPagiMasuk}
                            placeholder="07:00"
                          />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={[styles.inputSubLabel, { color: theme.textSub }]}>Jam Pulang:</Text>
                          <TextInput
                            style={[styles.cleanInput, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, color: theme.textMain }]}
                            value={jamPagiPulang}
                            onChangeText={setJamPagiPulang}
                            placeholder="16:00"
                          />
                        </View>
                      </View>
                    </View>

                    {/* Shift Sore */}
                    <View style={[styles.shiftConfigCard, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <View style={[styles.shiftIndicatorBar, { backgroundColor: '#0284c7' }]} />
                        <Text style={[styles.shiftConfigTitle, { color: theme.textMain }]}>Shift Sore</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={[styles.inputSubLabel, { color: theme.textSub }]}>Jam Masuk:</Text>
                          <TextInput
                            style={[styles.cleanInput, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, color: theme.textMain }]}
                            value={jamSoreMasuk}
                            onChangeText={setJamSoreMasuk}
                            placeholder="13:00"
                          />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={[styles.inputSubLabel, { color: theme.textSub }]}>Jam Pulang:</Text>
                          <TextInput
                            style={[styles.cleanInput, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, color: theme.textMain }]}
                            value={jamSorePulang}
                            onChangeText={setJamSorePulang}
                            placeholder="21:00"
                          />
                        </View>
                      </View>
                    </View>

                    {/* Toleransi Keterlambatan */}
                    <View style={[styles.shiftConfigCard, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                      <Text style={[styles.shiftConfigTitle, { color: theme.textMain, marginBottom: 6 }]}>
                        Toleransi Keterlambatan Absen
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TextInput
                          style={[styles.cleanInput, { width: 80, backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, color: theme.textMain, textAlign: 'center' }]}
                          value={toleransiMenit}
                          onChangeText={setToleransiMenit}
                          keyboardType="numeric"
                        />
                        <Text style={[styles.inputSubLabel, { color: theme.textSub }]}>
                          Menit (Lewat dari ini dihitung Terlambat Ringan / TL 90%)
                        </Text>
                      </View>
                    </View>

                    {/* TOMBOL SIMPAN PENGATURAN */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSaveGeofence}
                      style={[styles.saveConfigBtn, { backgroundColor: '#16a34a' }]}
                    >
                      <Text style={styles.saveConfigBtnText}>💾 Simpan Pengaturan Sistem</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================================================================= */}
          {/* TAB 5: LOG AUDIT PRESENSI & ZONA DEMO TERPISAH                   */}
          {/* ================================================================= */}
          {activeTab === 'log' && (
            <View style={{ gap: 16 }}>
              {/* 4 SUMMARY CARDS KEHADIRAN HARI INI */}
              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                    <IconCheckCircle size={20} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Hadir Tepat Waktu</Text>
                    <Text style={[styles.kpiValue, { color: '#16a34a' }]}>3 Pegawai</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                    <IconClock size={20} color="#d97706" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Terlambat</Text>
                    <Text style={[styles.kpiValue, { color: '#d97706' }]}>1 Pegawai</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                    <IconFileText size={20} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Presensi Luar (PDT)</Text>
                    <Text style={[styles.kpiValue, { color: '#0284c7' }]}>1 Pegawai</Text>
                  </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                  <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <IconUsers size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Belum Absen</Text>
                    <Text style={[styles.kpiValue, { color: '#ef4444' }]}>1 Pegawai</Text>
                  </View>
                </View>
              </View>

              {/* LOG KEHADIRAN RESMI CONTAINER */}
              <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textMain }]}>Log Audit Kehadiran Pegawai</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                      Rekap data presensi realtime hari ini ({now.toLocaleDateString('id-ID', { dateStyle: 'full' })})
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleExportLog('Excel')}
                      style={[styles.exportBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                    >
                      <IconDownload size={14} color={theme.textMain} />
                      <Text style={[styles.exportBtnText, { color: theme.textMain }]}>Excel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleExportLog('PDF')}
                      style={[styles.exportBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                    >
                      <IconDownload size={14} color={theme.textMain} />
                      <Text style={[styles.exportBtnText, { color: theme.textMain }]}>PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* FILTER STATUS PILLS */}
                <View style={styles.logFiltersRow}>
                  {[
                    { id: 'all', label: 'Semua Log' },
                    { id: 'hadir', label: 'Tepat Waktu' },
                    { id: 'terlambat', label: 'Terlambat' },
                    { id: 'pdt', label: 'PDT' },
                    { id: 'belum', label: 'Belum Absen' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setLogFilterStatus(f.id)}
                      style={[
                        styles.filterChip,
                        logFilterStatus === f.id
                          ? { backgroundColor: theme.accent }
                          : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, borderWidth: 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: logFilterStatus === f.id ? '#ffffff' : theme.textSub },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* TABLE LOG KEHADIRAN */}
                <View style={styles.tableContainer}>
                  <View style={[styles.tableHeaderRow, { backgroundColor: theme.pillBg, borderBottomColor: theme.borderSubtle }]}>
                    <Text style={[styles.thText, { flex: 2.5, color: theme.textMuted }]}>PEGAWAI</Text>
                    <Text style={[styles.thText, { flex: 1.5, color: theme.textMuted }]}>UNIT</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'center', color: theme.textMuted }]}>SHIFT</Text>
                    <Text style={[styles.thText, { flex: 1.2, textAlign: 'center', color: theme.textMuted }]}>MASUK</Text>
                    <Text style={[styles.thText, { flex: 1.2, textAlign: 'center', color: theme.textMuted }]}>PULANG</Text>
                    <Text style={[styles.thText, { flex: 2, textAlign: 'right', color: theme.textMuted }]}>STATUS & KODE</Text>
                  </View>

                  {filteredLogs.map((item) => (
                    <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.borderSubtle }]}>
                      <View style={{ flex: 2.5 }}>
                        <Text style={[styles.logPegawaiName, { color: theme.textMain }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.logPegawaiNip, { color: theme.textMuted }]}>
                          {item.nip}
                        </Text>
                      </View>

                      <View style={{ flex: 1.5 }}>
                        <Text style={[styles.logText, { color: theme.textSub }]}>{item.unit}</Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.logText, { color: theme.textMain, fontWeight: '700' }]}>{item.shift}</Text>
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <Text style={[styles.logTimeText, { color: item.masuk !== '-' ? theme.textMain : theme.textMuted }]}>
                          {item.masuk}
                        </Text>
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <Text style={[styles.logTimeText, { color: item.pulang !== '-' ? theme.textMain : theme.textMuted }]}>
                          {item.pulang}
                        </Text>
                      </View>

                      <View style={{ flex: 2, alignItems: 'flex-end' }}>
                        <View style={[styles.logStatusBadge, { backgroundColor: item.badgeColor + '20' }]}>
                          <Text style={[styles.logStatusText, { color: item.badgeColor }]}>
                            {item.status}
                          </Text>
                        </View>
                        <Text style={[styles.logCodeText, { color: theme.textMuted }]}>
                          {item.code} {item.code.includes('SWM') ? '(Sesuai Waktu Masuk)' : item.code.includes('TL') ? '(Terlambat)' : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* ZONA PENGUJIAN / DEMO DEVELOPER (COLLAPSIBLE - AMAN DARI SALAH KLIK) */}
              <View style={[styles.demoZoneCard, { backgroundColor: theme.cardSolid, borderColor: '#f59e0b' }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDemoZone(!showDemoZone)}
                  style={styles.demoZoneHeader}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconSliders size={18} color="#d97706" />
                    <Text style={[styles.demoZoneTitle, { color: theme.textMain }]}>
                      Zona Pengujian & Simulasi Demo Magang
                    </Text>
                  </View>
                  <IconChevronDown
                    size={18}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>

                {showDemoZone && (
                  <View style={styles.demoZoneContent}>
                    <Text style={[styles.demoZoneDesc, { color: theme.textSub }]}>
                      Fitur di bawah ini khusus digunakan untuk simulasi penilaian sidang/demo.
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleResetPresensiDemo}
                        style={[styles.demoResetBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#ef4444' }]}
                      >
                        <Text style={[styles.demoResetBtnText, { color: '#dc2626' }]}>
                          🔄 Reset Status Absensi Hari Ini
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setPdtList(INITIAL_PDT_SUBMISSIONS);
                          Alert.alert('Sukses', 'Daftar pengajuan PDT dikembalikan ke data default.');
                        }}
                        style={[styles.demoResetBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                      >
                        <Text style={[styles.demoResetBtnText, { color: theme.textMain }]}>
                          📋 Reset Berkas PDT ke Default
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Top Bar
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileHamburgerBtn: {
    padding: 6,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { display: 'none' }),
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  adminTag: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  breadcrumbText: {
    fontSize: 12,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminIdentityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  adminNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  adminRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  backToPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  backToPortalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Main Layout
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    ...(Platform.OS !== 'web' && { display: 'none' }),
  },
  sidebarMobileOpen: {
    display: 'flex',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 99,
    width: 260,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemText: {
    fontSize: 13.5,
  },
  badgePill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '900',
  },
  sidebarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  sidebarFooterText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  // Content Area
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kpiIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },

  // Card Box Containers
  cardBox: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },

  // Filter Pills Row
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // PDT Items
  pdtItemCard: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    gap: 10,
  },
  pdtItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pdtNama: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  pdtIdTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pdtIdText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pdtMeta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  pdtDetailBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  pdtDetailLine: {
    fontSize: 13,
  },
  pdtTimeLine: {
    fontSize: 11.5,
    marginTop: 2,
  },
  pdtActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtnApprove: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnReject: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnTextWhite: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionBtnReset: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnResetText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Schedule Styles
  saveScheduleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveScheduleBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  unsavedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  scheduleFiltersRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  unitSelectorScroll: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  unitChipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pegawaiSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pegawaiChipBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pegawaiChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Brush Toolbar
  brushToolbarBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  brushToolbarTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickToolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickToolBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  palettePillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  palettePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  palettePillCode: {
    fontSize: 13,
    fontWeight: '900',
  },
  palettePillLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // 7-Column Calendar
  calendarContainer: {
    marginTop: 4,
  },
  dayNamesHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 58,
  },
  calDayCell: {
    width: `${100 / 7}%`,
    height: 58,
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  calDayTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calDayNumText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dordingBadgeCircle: {
    backgroundColor: '#d97706',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dordingBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  shiftCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  shiftCodeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  staffingSummaryRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  staffingSummaryTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  staffingCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  staffingText: {
    fontSize: 12,
  },

  // Pegawai Styles
  addPegawaiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPegawaiBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  pegawaiToolbarRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterDropdownRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitFilterChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Table Data
  tableContainer: {
    marginTop: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  pegawaiAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pegawaiAvatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  pegawaiNameText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  pegawaiNipText: {
    fontSize: 12,
    marginTop: 1,
  },
  pegawaiRoleDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  roleBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pegawaiUnitText: {
    fontSize: 12.5,
  },
  statusIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusIndicatorText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  actionMoreBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },

  // Popover / Action Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenuModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  actionMenuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  actionMenuTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionMenuSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionMenuItemText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionMenuCancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionMenuCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Form Modal
  formModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formModalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  inputFieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  formTextInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
  },
  formCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  formCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Two Column Grid (Jam & Geofence)
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  tilokMapWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
  },
  gpsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  gpsActionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  cleanInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
  },
  radiusHighlightText: {
    fontSize: 13,
    fontWeight: '800',
  },
  inputHelpText: {
    fontSize: 11.5,
  },
  shiftConfigCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  shiftIndicatorBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  shiftConfigTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  inputSubLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveConfigBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveConfigBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  toastSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  toastSuccessText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
  },

  // Log Tab
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logFiltersRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  logPegawaiName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  logPegawaiNip: {
    fontSize: 11.5,
  },
  logText: {
    fontSize: 12.5,
  },
  logTimeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  logStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  logCodeText: {
    fontSize: 10.5,
    marginTop: 2,
  },

  // Collapsible Demo Zone
  demoZoneCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  demoZoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  demoZoneTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  demoZoneContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  demoZoneDesc: {
    fontSize: 12,
  },
  demoResetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
