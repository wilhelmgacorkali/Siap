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
import { styles } from '../theme';
import { RSJ_LOGO_URI } from '../assets';

// Data Awal Pengajuan PDT untuk diverifikasi Admin Umum / Super Admin
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
    status: 'Pending', // 'Pending' | 'Disetujui' | 'Ditolak'
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

// Data Awal Master Pegawai RS Jiwa Tampan
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

const SHIFT_OPTIONS = [
  { code: 'P', label: 'Shift Pagi (07:00-16:00)', color: '#16a34a', bg: '#ecfdf5' },
  { code: 'S', label: 'Shift Sore (13:00-21:00)', color: '#0284c7', bg: '#e0f2fe' },
  { code: 'M', label: 'Shift Malam (20:30-07:30)', color: '#7c3aed', bg: '#f3e8ff' },
  { code: 'D', label: 'Shift Dording (13:00-21:00)', color: '#d97706', bg: '#fef3c7' },
  { code: 'C', label: 'Cuti Resmi / Izin', color: '#343a40', bg: '#f1f5f9' },
  { code: 'L', label: 'Libur / Off Dinas', color: '#6c757d', bg: '#f8fafc' },
];

export default function AdminScreen({
  user,
  currentTime,
  attendance,
  onSwitchUser,
  onNavigate,
  onBack,
  isDarkMode = true,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('approval_pdt'); // 'approval_pdt' | 'jadwal' | 'pegawai' | 'pengaturan' | 'log'
  
  // State 1: Data Pengajuan PDT (Bisa di-approve / ditolak)
  const [pdtList, setPdtList] = useState(INITIAL_PDT_SUBMISSIONS);
  const [pdtFilter, setPdtFilter] = useState('all'); // 'all' | 'Pending' | 'Disetujui' | 'Ditolak'

  // State 2: Manajemen Jadwal Dinas (Hak Akses Ka. Instalasi / Katim)
  const [selectedUnit, setSelectedUnit] = useState('Instalasi Rawat Inap');
  const [selectedPegawaiNip, setSelectedPegawaiNip] = useState('19890412 201402 2 003');
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const daysInMonth = new Date(currentYearNum, now.getMonth() + 1, 0).getDate();
  
  // Custom Roster state per hari (bisa diubah klik tanggal)
  const [customRoster, setCustomRoster] = useState(() => {
    const s = {};
    for (let d = 1; d <= 30; d++) {
      const dt = new Date(currentYearNum, now.getMonth(), d);
      const dow = dt.getDay();
      if (dow === 0 || dow === 6) s[d] = 'L';
      else if (d === 6) s[d] = 'C';
      else if (d === 19) s[d] = 'S';
      else s[d] = 'P';
    }
    return s;
  });
  const [editingDay, setEditingDay] = useState(null);

  // State 3: Master Pegawai
  const [pegawaiList, setPegawaiList] = useState(INITIAL_PEGAWAI);
  const [searchQuery, setSearchQuery] = useState('');
  const [addPegawaiModal, setAddPegawaiModal] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newRole, setNewRole] = useState('Perawat Pelaksana');
  const [newUnit, setNewUnit] = useState('Instalasi Rawat Inap');

  // State 4: Pengaturan Jam Absen & Tilok
  const [tilokLat, setTilokLat] = useState('0.465791');
  const [tilokLong, setTilokLong] = useState('101.381957');
  const [tilokRadius, setTilokRadius] = useState('200');
  const [jamPagiMasuk, setJamPagiMasuk] = useState('07:00:00');
  const [jamPagiPulang, setJamPagiPulang] = useState('16:00:00');
  const [jamSoreMasuk, setJamSoreMasuk] = useState('13:00:00');
  const [jamSorePulang, setJamSorePulang] = useState('21:00:00');

  // Filtered PDT
  const filteredPdt = useMemo(() => {
    if (pdtFilter === 'all') return pdtList;
    return pdtList.filter((item) => item.status === pdtFilter);
  }, [pdtList, pdtFilter]);

  // Handler Approval PDT
  const handleApprovePdt = (id) => {
    setPdtList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Disetujui' } : item))
    );
    Alert.alert('PDT Disetujui!', `Pengajuan nomor ${id} telah disetujui resmi oleh ${user?.name || 'Admin'}.`);
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

  // Handler Ganti Shift Tanggal
  const handleSelectShiftCode = (code) => {
    if (editingDay !== null) {
      setCustomRoster((prev) => ({
        ...prev,
        [editingDay]: code,
      }));
      setEditingDay(null);
      Alert.alert('Jadwal Diperbarui!', `Shift tanggal ${editingDay} berhasil diubah menjadi kode [${code}] oleh ${user?.name || 'Ka. Instalasi'}.`);
    }
  };

  // Handler Tambah Pegawai
  const handleTambahPegawai = () => {
    if (!newNama.trim() || !newNip.trim()) {
      Alert.alert('Form Belum Lengkap', 'Mohon isi Nama Lengkap dan NIP Pegawai.');
      return;
    }
    const newPeg = {
      id: Date.now(),
      name: newNama.trim(),
      nip: newNip.trim(),
      role: newRole,
      roleType: 'pegawai',
      unit: newUnit,
      badge: 'Staf RSJ',
      status: 'Aktif',
    };
    setPegawaiList((prev) => [newPeg, ...prev]);
    setAddPegawaiModal(false);
    setNewNama('');
    setNewNip('');
    Alert.alert('Pegawai Ditambahkan!', `Pegawai ${newPeg.name} berhasil terdaftar di SIMRS SIAP RSJ Tampan.`);
  };

  // Handler Switch User
  const handleSwitchLogin = (peg) => {
    if (onSwitchUser) {
      onSwitchUser(peg);
      Alert.alert('Beralih Akun!', `Anda sekarang masuk sebagai ${peg.name} (${peg.role}).`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. TOP HERO HEADER PANEL ADMIN                                     */}
        {/* ================================================================= */}
        <View
          style={{
            backgroundColor: '#0f172a',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: '#334155',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: '#7c3aed', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff' }}>👑 DASHBOARD ADMIN</Text>
                </View>
                <View style={{ backgroundColor: '#0284c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#ffffff' }}>URL: /admin</Text>
                </View>
                <View style={{ backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#ffffff' }}>AKSES PENUH</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#ffffff' }}>
                SIAP RS Jiwa Tampan
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Login Sebagai: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{user?.name || 'Administrator'}</Text> ({user?.role || 'Super Admin'})
              </Text>
            </View>

            <TouchableOpacity
              onPress={onBack}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#60a5fa',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>🌐 ← Ke Presensi Pegawai (/)</Text>
            </TouchableOpacity>
          </View>

          {/* 4 Mini Stat Badges */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <View style={{ flex: 1, minWidth: 70, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>Total Pegawai</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>{pegawaiList.length} Org</Text>
            </View>
            <View style={{ flex: 1, minWidth: 70, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>PDT Pending</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#f59e0b' }}>
                {pdtList.filter((p) => p.status === 'Pending').length} Berkas
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 70, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>Radius Tilok</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#10b981' }}>{tilokRadius}m Sah</Text>
            </View>
            <View style={{ flex: 1, minWidth: 70, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>Jam Sistem</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#38bdf8' }}>{currentTime || '10:30'}</Text>
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. 5 TAB SWITCHER UTAMA                                            */}
        {/* ================================================================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ gap: 6 }}
        >
          <TabButton
            active={activeTab === 'approval_pdt'}
            icon="📋"
            label="Approval PDT"
            badge={pdtList.filter((p) => p.status === 'Pending').length}
            onPress={() => setActiveTab('approval_pdt')}
          />
          <TabButton
            active={activeTab === 'jadwal'}
            icon="📅"
            label="Atur Jadwal Dinas"
            onPress={() => setActiveTab('jadwal')}
          />
          <TabButton
            active={activeTab === 'pegawai'}
            icon="👥"
            label="Master Pegawai"
            onPress={() => setActiveTab('pegawai')}
          />
          <TabButton
            active={activeTab === 'pengaturan'}
            icon="⚙️"
            label="Jam & Geofence"
            onPress={() => setActiveTab('pengaturan')}
          />
          <TabButton
            active={activeTab === 'log'}
            icon="📊"
            label="Log & Reset Demo"
            onPress={() => setActiveTab('log')}
          />
        </ScrollView>

        {/* ================================================================= */}
        {/* TAB 1: APPROVAL PDT (Wewenang Admin Umum & Super Admin)            */}
        {/* ================================================================= */}
        {activeTab === 'approval_pdt' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                  Verifikasi & Persetujuan PDT
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSub }}>
                  Wewenang: Admin Umum (Kepegawaian) & Super Admin
                </Text>
              </View>

              {/* Filter Status */}
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {['all', 'Pending', 'Disetujui', 'Ditolak'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setPdtFilter(st)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: pdtFilter === st ? '#0284c7' : theme.pillBg,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pdtFilter === st ? '#ffffff' : theme.textSub }}>
                      {st === 'all' ? 'Semua' : st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredPdt.map((pdt) => {
              const isPending = pdt.status === 'Pending';
              const isApproved = pdt.status === 'Disetujui';
              const isRejected = pdt.status === 'Ditolak';

              return (
                <View
                  key={pdt.id}
                  style={{
                    backgroundColor: theme.cardSolid,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textMain }}>{pdt.nama}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSub }}>NIP: {pdt.nip} • {pdt.unit}</Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: isPending ? '#fef3c7' : isApproved ? '#ecfdf5' : '#fee2e2',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: isPending ? '#b45309' : isApproved ? '#047857' : '#b91c1c',
                        }}
                      >
                        {pdt.status}
                      </Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: theme.pillBg, padding: 8, borderRadius: 8, gap: 3 }}>
                    <Text style={{ fontSize: 10.5, color: theme.textMain }}>
                      📍 <Text style={{ fontWeight: '700' }}>Tujuan:</Text> {pdt.lokasi} ({pdt.jarak})
                    </Text>
                    <Text style={{ fontSize: 10.5, color: theme.textMain }}>
                      📝 <Text style={{ fontWeight: '700' }}>Alasan:</Text> {pdt.alasan}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: theme.textMain }}>
                      📄 <Text style={{ fontWeight: '700' }}>Surat Tugas:</Text> {pdt.suratTugas}
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.textSub, marginTop: 2 }}>
                      ⏱️ Tanggal & Waktu Pengajuan: {pdt.tanggal} - {pdt.jam}
                    </Text>
                  </View>

                  {/* Tombol Aksi Admin */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {isPending ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleApprovePdt(pdt.id)}
                          style={{
                            flex: 1,
                            backgroundColor: '#059669',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>✅ Setujui (Approve)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRejectPdt(pdt.id)}
                          style={{
                            flex: 1,
                            backgroundColor: '#dc2626',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>❌ Tolak</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleResetPdt(pdt.id)}
                        style={{
                          flex: 1,
                          backgroundColor: theme.pillBg,
                          paddingVertical: 6,
                          borderRadius: 6,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <Text style={{ color: theme.textSub, fontSize: 10, fontWeight: '700' }}>
                          Ubah Status Kembali ke Pending
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ATUR JADWAL DINAS & DORDING (Ka. Instalasi / Katim)        */}
        {/* ================================================================= */}
        {activeTab === 'jadwal' && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                Penetapan Roster Jadwal Dinas & Dording
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSub }}>
                Wewenang: Kepala Instalasi / Katim Ruangan & Super Admin
              </Text>
            </View>

            {/* Pilih Unit Kerja */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 12, borderRadius: 12, gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMain }}>Pilih Unit & Pegawai:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['Instalasi Rawat Inap', 'IGD Jiwa', 'Instalasi NAPZA', 'Rawat Jalan'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setSelectedUnit(unit)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: selectedUnit === unit ? '#0284c7' : theme.pillBg,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: selectedUnit === unit ? '#ffffff' : theme.textSub }}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Daftar Pegawai Unit */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {pegawaiList
                  .filter((p) => p.unit === selectedUnit)
                  .map((p) => (
                    <TouchableOpacity
                      key={p.nip}
                      onPress={() => setSelectedPegawaiNip(p.nip)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: selectedPegawaiNip === p.nip ? '#16a34a' : theme.pillBg,
                        borderWidth: 1,
                        borderColor: selectedPegawaiNip === p.nip ? '#15803d' : theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPegawaiNip === p.nip ? '#ffffff' : theme.textSub }}>
                        {p.name.split(',')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* Grid Kalender Roster Interaktif (Klik tanggal untuk ubah shift) */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 14, borderRadius: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '900', color: theme.textMain }}>
                  Bulan {currentMonthNum} / Tahun {currentYearNum} (Klik Tanggal untuk Ubah Shift)
                </Text>
                <View style={{ backgroundColor: '#10b981', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: '#ffffff', fontSize: 9.5, fontWeight: '800' }}>30 Hari</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' }}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const code = customRoster[dayNum] || 'P';
                  const isToday = dayNum === now.getDate();
                  const shift = SHIFT_OPTIONS.find((s) => s.code === code) || SHIFT_OPTIONS[0];

                  return (
                    <TouchableOpacity
                      key={`roster-${dayNum}`}
                      onPress={() => setEditingDay(dayNum)}
                      activeOpacity={0.7}
                      style={{
                        width: '18%',
                        aspectRatio: 1,
                        backgroundColor: shift.color,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: isToday ? 2.5 : 1,
                        borderColor: isToday ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>{dayNum}</Text>
                      <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>{code}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Shift Legend */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {SHIFT_OPTIONS.map((s) => (
                  <View key={s.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                    <Text style={{ fontSize: 9.5, color: theme.textSub }}>{s.code}={s.label.split(' ')[1]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Modal Ubah Shift Tanggal */}
            <Modal visible={editingDay !== null} transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: theme.cardSolid, borderRadius: 16, padding: 18, width: '100%', maxWidth: 360, gap: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                    Pilih Shift untuk Tanggal {editingDay} {now.toLocaleString('id-ID', { month: 'long' })} {currentYearNum}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textSub }}>
                    Pilih jenis penugasan dinas untuk pegawai terpilih:
                  </Text>

                  <View style={{ gap: 6 }}>
                    {SHIFT_OPTIONS.map((sh) => (
                      <TouchableOpacity
                        key={sh.code}
                        onPress={() => handleSelectShiftCode(sh.code)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          backgroundColor: sh.bg,
                          padding: 10,
                          borderRadius: 8,
                          borderLeftWidth: 4,
                          borderLeftColor: sh.color,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '900', color: sh.color }}>[{sh.code}]</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>{sh.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => setEditingDay(null)}
                    style={{ backgroundColor: theme.pillBg, padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 }}
                  >
                    <Text style={{ color: theme.textSub, fontWeight: '700', fontSize: 11 }}>Batal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MASTER DATA PEGAWAI RSJ TAMPAN                             */}
        {/* ================================================================= */}
        {activeTab === 'pegawai' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                  Master Data Pegawai RSJ
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSub }}>
                  Total: {pegawaiList.length} Pegawai Terdaftar di SIMRS
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setAddPegawaiModal(true)}
                style={{
                  backgroundColor: '#16a34a',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>+ Tambah Pegawai</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={{
                backgroundColor: theme.cardSolid,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <TextInput
                placeholder="Cari Nama Pegawai / NIP..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ color: theme.textMain, fontSize: 12 }}
              />
            </View>

            {/* List Pegawai */}
            {pegawaiList
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.nip.includes(searchQuery)
              )
              .map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: theme.cardSolid,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textMain }}>{p.name}</Text>
                      <Text style={{ fontSize: 10.5, color: '#38bdf8', fontWeight: '700' }}>{p.role}</Text>
                      <Text style={{ fontSize: 9.5, color: theme.textSub }}>NIP: {p.nip} • {p.unit}</Text>
                    </View>

                    <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#059669' }}>{p.status}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={() => handleSwitchLogin(p)}
                      style={{
                        flex: 1,
                        backgroundColor: '#0284c7',
                        paddingVertical: 6,
                        borderRadius: 6,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>
                        🔄 Login Sebagai Akun Ini
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menonaktifkan akun ${p.name}?`, [
                          { text: 'Batal', style: 'cancel' },
                          {
                            text: 'Nonaktifkan',
                            style: 'destructive',
                            onPress: () => setPegawaiList((prev) => prev.filter((item) => item.id !== p.id)),
                          },
                        ]);
                      }}
                      style={{
                        backgroundColor: theme.pillBg,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '700' }}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {/* Modal Tambah Pegawai */}
            <Modal visible={addPegawaiModal} transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: theme.cardSolid, borderRadius: 16, padding: 18, width: '100%', maxWidth: 360, gap: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                    Tambah Pegawai RSJ Baru
                  </Text>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSub }}>Nama Lengkap & Gelar:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                      placeholder="Contoh: Ners. Rahmawati, S.Kep"
                      placeholderTextColor={theme.textMuted}
                      value={newNama}
                      onChangeText={setNewNama}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSub }}>NIP Pegawai:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                      placeholder="Contoh: 19930814 201802 2 001"
                      placeholderTextColor={theme.textMuted}
                      value={newNip}
                      onChangeText={setNewNip}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSub }}>Jabatan / Role:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                      value={newRole}
                      onChangeText={setNewRole}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSub }}>Unit Kerja:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                      value={newUnit}
                      onChangeText={setNewUnit}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={handleTambahPegawai}
                      style={{ flex: 1, backgroundColor: '#16a34a', padding: 10, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Simpan Pegawai</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAddPegawaiModal(false)}
                      style={{ backgroundColor: theme.pillBg, padding: 10, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: theme.textSub, fontWeight: '700', fontSize: 12 }}>Batal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PENGATURAN JAM ABSEN & MASTER TILOK                        */}
        {/* ================================================================= */}
        {activeTab === 'pengaturan' && (
          <View style={{ gap: 14 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                Pengaturan Jam Absen & Geofencing Tilok
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSub }}>
                Wewenang: Super Admin (Konfigurasi Pusat SIAP)
              </Text>
            </View>

            {/* Card Geofencing Tilok RSJ Tampan */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#e11d48' }}>📍 Master Titik Lokasi (Tilok) Geofencing</Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, color: theme.textSub, fontWeight: '700' }}>Latitude Pusat RSJ Tampan:</Text>
                <TextInput
                  style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                  value={tilokLat}
                  onChangeText={setTilokLat}
                />

                <Text style={{ fontSize: 11, color: theme.textSub, fontWeight: '700' }}>Longitude Pusat RSJ Tampan:</Text>
                <TextInput
                  style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                  value={tilokLong}
                  onChangeText={setTilokLong}
                />

                <Text style={{ fontSize: 11, color: theme.textSub, fontWeight: '700' }}>Radius Geofencing Sah (Meter):</Text>
                <TextInput
                  style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 8, borderRadius: 8, fontSize: 12, borderWidth: 1, borderColor: theme.border }}
                  value={tilokRadius}
                  onChangeText={setTilokRadius}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Card Jam Kerja per Shift */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: theme.textMain }}>⏱️ Jam Operasional Shift Presensi</Text>

              {/* Shift Pagi */}
              <View style={{ gap: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.borderSubtle }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#16a34a' }}>Shift Pagi (Reguler)</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: theme.textSub }}>Jam Masuk:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 6, borderRadius: 6, fontSize: 11 }}
                      value={jamPagiMasuk}
                      onChangeText={setJamPagiMasuk}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: theme.textSub }}>Jam Pulang:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 6, borderRadius: 6, fontSize: 11 }}
                      value={jamPagiPulang}
                      onChangeText={setJamPagiPulang}
                    />
                  </View>
                </View>
              </View>

              {/* Shift Sore */}
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#0284c7' }}>Shift Sore</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: theme.textSub }}>Jam Masuk:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 6, borderRadius: 6, fontSize: 11 }}
                      value={jamSoreMasuk}
                      onChangeText={setJamSoreMasuk}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: theme.textSub }}>Jam Pulang:</Text>
                    <TextInput
                      style={{ backgroundColor: theme.pillBg, color: theme.textMain, padding: 6, borderRadius: 6, fontSize: 11 }}
                      value={jamSorePulang}
                      onChangeText={setJamSorePulang}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Pengaturan Disimpan!', 'Konfigurasi Jam Kerja dan Titik Tilok Geofence telah tersimpan di sistem.');
                }}
                style={{
                  backgroundColor: '#059669',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>💾 Simpan Pengaturan Sistem</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 5: LOG AUDIT & RESET DEMO MAGANG                              */}
        {/* ================================================================= */}
        {activeTab === 'log' && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: theme.textMain }}>
                Audit Presensi & Kendali Demo
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSub }}>
                Monitoring Log Kehadiran Realtime & Alat Uji Coba Cepat
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, gap: 10 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: theme.textMain }}>Peralatan Simulasi Demo Magang:</Text>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Reset Data Presensi',
                    'Reset status presensi seluruh akun hari ini agar tombol absensi masuk & pulang dapat diuji kembali dari awal?',
                    [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Reset Sekarang',
                        style: 'destructive',
                        onPress: () => Alert.alert('Sukses', 'Status presensi hari ini berhasil direset!'),
                      },
                    ]
                  );
                }}
                style={{
                  backgroundColor: '#fee2e2',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ef4444',
                }}
              >
                <Text style={{ color: '#b91c1c', fontWeight: '800', fontSize: 11.5 }}>
                  🔄 Reset Status Presensi Hari Ini (Uji Coba Ulang)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPdtList(INITIAL_PDT_SUBMISSIONS);
                  Alert.alert('Sukses', 'Daftar pengajuan PDT dikembalikan ke status awal.');
                }}
                style={{
                  backgroundColor: theme.pillBg,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ color: theme.textMain, fontWeight: '800', fontSize: 11.5 }}>
                  📋 Reset Berkas PDT ke Default
                </Text>
              </TouchableOpacity>
            </View>

            {/* Log Presensi Hari Ini */}
            <View style={{ backgroundColor: theme.cardSolid, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, gap: 8 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: theme.textMain }}>
                Log Kehadiran Pegawai Hari Ini ({now.toLocaleDateString('id-ID', { dateStyle: 'full' })})
              </Text>

              <View style={{ gap: 6 }}>
                {[
                  { name: 'Ners. Fitri Rahmadani', jamMasuk: '07:05:12 WIB', status: 'Hadir Tepat Waktu (SWM 100%)', color: '#16a34a' },
                  { name: 'dr. Hendra Saputra, Sp.KJ', jamMasuk: '07:15:30 WIB', status: 'Hadir Tepat Waktu (SWM 100%)', color: '#16a34a' },
                  { name: 'Ners. Siti Aminah, S.Kep', jamMasuk: '07:35:10 WIB', status: 'PDT Masuk (Dinas Dinkes)', color: '#0284c7' },
                  { name: 'Rudi Hermawan, A.Md.Kep', jamMasuk: '08:20:00 WIB', status: 'Terlambat 20m (TL 90%)', color: '#d97706' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: theme.pillBg,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: theme.textMain }}>{item.name}</Text>
                      <Text style={{ fontSize: 9.5, color: theme.textSub }}>Masuk: {item.jamMasuk}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: item.color }}>{item.status}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ active, icon, label, badge, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: active ? '#0284c7' : '#1e293b',
        borderWidth: 1,
        borderColor: active ? '#38bdf8' : '#334155',
      }}
    >
      <Text style={{ fontSize: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#ffffff' : '#cbd5e1' }}>
        {label}
      </Text>
      {typeof badge === 'number' && badge > 0 && (
        <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10 }}>
          <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900' }}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
