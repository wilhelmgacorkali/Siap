import React, { useEffect, useRef, useState } from 'react';
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
import TilokMap from '../components/TilokMap';
import {
  IconArrowLeft,
  IconClock,
  IconMapPin,
  IconCheckCircle,
  IconAlertCircle,
  IconChevronDown,
  IconSliders,
  IconBriefcase,
  IconFileText,
  IconX,
} from '../components/Icons';

// Titik Tilok RS Jiwa Tampan
const TILOK_LAT = 0.465791;
const TILOK_LONG = 101.381957;
const TILOK_RADIUS_DEFAULT = 200;

const ALASAN_OPTIONS = [
  'Dinas Luar / Diklat Provinsi',
  'Pendampingan Pasien Jiwa',
  'Rapat Koordinasi Dinkes / Kemenkes',
  'Pelayanan Jiwa Komunitas (NAPZA)',
  'Lainnya (Tuliskan Keterangan)',
];

export default function PdtScreen({
  user,
  currentTime,
  attendance,
  onUpdatePdtAttendance,
  onBack,
  isDarkMode = true,
  theme: propTheme,
}) {
  const theme = propTheme || (isDarkMode ? DARK_THEME : LIGHT_THEME);

  // Realtime clock
  const [liveClock, setLiveClock] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setLiveClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const clockToDisplay = currentTime || liveClock;

  const now = new Date();
  const dayNameId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
  const monthNameId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ][now.getMonth()];
  const dateFormatted = `${dayNameId}, ${now.getDate()} ${monthNameId} ${now.getFullYear()}`;

  // Geolocation & Radius (Default di luar tilok: 1.150 meter)
  const [userDistance, setUserDistance] = useState(1150);
  const [tilokRadius, setTilokRadius] = useState(TILOK_RADIUS_DEFAULT);
  const [showSopAccordion, setShowSopAccordion] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // State Modal Form PDT
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlasan, setSelectedAlasan] = useState(ALASAN_OPTIONS[0]);
  const [alasanLainnya, setAlasanLainnya] = useState('');
  const [suratTugas, setSuratTugas] = useState('ST/RSJT/XI/2026/088');
  const [lokasiTujuan, setLokasiTujuan] = useState('Dinas Kesehatan Provinsi Riau');
  const [fotoBukti, setFotoBukti] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  // Status pengajuan PDT hari ini
  const existingPdt = attendance?.pdt;
  const hasSubmittedToday = Boolean(existingPdt?.masuk) || successSubmitted;

  // Handler Ambil Foto Watermark
  const handleCapturePhoto = () => {
    // Simulasi pengambilan foto kamera dengan watermark dinas
    const dummyPhoto = `https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80`;
    setFotoBukti(dummyPhoto);
    setIsCameraActive(false);
  };

  const isFormValid =
    (selectedAlasan !== 'Lainnya (Tuliskan Keterangan)' || alasanLainnya.trim().length > 3) &&
    suratTugas.trim().length > 0 &&
    fotoBukti !== null;

  const handleSubmitPdt = () => {
    if (!isFormValid) {
      Alert.alert('Form Belum Lengkap', 'Mohon lengkapi alasan penugasan, nomor surat tugas, dan foto bukti kamera.');
      return;
    }

    const finalAlasan =
      selectedAlasan === 'Lainnya (Tuliskan Keterangan)' ? alasanLainnya.trim() : selectedAlasan;

    if (onUpdatePdtAttendance) {
      onUpdatePdtAttendance('masuk', clockToDisplay, 95, fotoBukti);
    }

    setSuccessSubmitted(true);
    setModalVisible(false);
    Alert.alert(
      'Pengajuan PDT Berhasil!',
      `Presensi Luar Tilok (PDT) berhasil dikirim pada ${clockToDisplay} WIB. Berkas kini Menunggu Persetujuan Ka. Instalasi / Admin Kepegawaian.`
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bgMain }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. HEADER TENANG & ELEGAN (BUKAN BANNER MERAH BAHAYA)             */}
        {/* ================================================================= */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}
          >
            <IconArrowLeft size={18} color={theme.textMain} />
            <Text style={[styles.backButtonText, { color: theme.textMain }]}>Beranda</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <IconBriefcase size={18} color="#0284c7" />
              <Text style={[styles.screenTitle, { color: theme.textMain }]}>Presensi Luar Tilok (PDT)</Text>
            </View>
            <Text style={[styles.screenSubtitle, { color: theme.textMuted }]}>
              Prosedur Absensi Resmi Pegawai Saat Dinas Luar
            </Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 2. DUA KOLOM RESPONSIVE: STATUS LOKASI (KIRI) & ALUR PDT (KANAN)  */}
        {/* ================================================================= */}
        <View style={styles.twoColumnGrid}>
          {/* KOLOM KIRI: STATUS LOKASI & PETA TILOK */}
          <View style={{ flex: 1, minWidth: 280, gap: 14 }}>
            {/* Status Jarak */}
            <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.textMain }]}>Status Lokasi GPS</Text>
                <View style={[styles.distanceChip, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                  <Text style={[styles.distanceChipText, { color: '#0284c7' }]}>
                    {(userDistance / 1000).toFixed(1)} km dari RSJ
                  </Text>
                </View>
              </View>

              <Text style={[styles.statusLocDesc, { color: theme.textSub }]}>
                Posisi Anda terdeteksi di luar area geofence RSJ Tampan ({tilokRadius} m). Anda memenuhi syarat untuk menggunakan formulir Presensi Luar Tilok (PDT).
              </Text>

              {/* Peta Kecil Compact (~180px) */}
              <View style={styles.mapWrapper}>
                <TilokMap
                  latitude={TILOK_LAT}
                  longitude={TILOK_LONG}
                  radius={tilokRadius}
                  userDistance={userDistance}
                  isOutsideRadius={true}
                  height={180}
                  cleanMode={true}
                />
              </View>
            </View>

            {/* Jam Server Digital */}
            <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, alignItems: 'center', paddingVertical: 18 }]}>
              <Text style={[styles.clockLabel, { color: theme.textMuted }]}>WAKTU RESMI SERVER SIAP</Text>
              <Text style={[styles.clockBigText, { color: theme.textMain }]}>{clockToDisplay}</Text>
              <Text style={[styles.clockDateText, { color: theme.textSub }]}>{dateFormatted}</Text>
            </View>

            {/* ACCORDION SOP & PANDUAN PDT (TERTUTUP DEFAULT) */}
            <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowSopAccordion(!showSopAccordion)}
                style={styles.sopAccordionHeader}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconFileText size={18} color="#0284c7" />
                  <Text style={[styles.sopTitle, { color: theme.textMain }]}>
                    Panduan & Ketentuan PDT RSJ Tampan
                  </Text>
                </View>
                <IconChevronDown size={18} color={theme.textMuted} />
              </TouchableOpacity>

              {showSopAccordion && (
                <View style={[styles.sopContentBox, { borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.sopPoint, { color: theme.textSub }]}>
                    1. <Text style={{ fontWeight: '700' }}>Kegunaan:</Text> Digunakan pegawai yang bertugas di luar fasilitas RSJ Tampan (diklat, rujukan, seminar, dinkes).
                  </Text>
                  <Text style={[styles.sopPoint, { color: theme.textSub }]}>
                    2. <Text style={{ fontWeight: '700' }}>Bukti:</Text> Wajib melampirkan foto selfie di lokasi kegiatan dan mencantumkan nomor surat tugas.
                  </Text>
                  <Text style={[styles.sopPoint, { color: theme.textSub }]}>
                    3. <Text style={{ fontWeight: '700' }}>Approval:</Text> Berkas akan diverifikasi oleh Kepala Instalasi / Admin Kepegawaian sebelum disahkan.
                  </Text>
                  <Text style={[styles.sopPoint, { color: theme.textSub }]}>
                    4. <Text style={{ fontWeight: '700' }}>Jam Pulang:</Text> Kepulangan cukup dilakukan dengan presensi normal bila sudah kembali ke RSJ.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* KOLOM KANAN: STEPPER ALUR & FORM PENGAJUAN */}
          <View style={{ flex: 1.2, minWidth: 300, gap: 14 }}>
            {/* STEPPER ALUR PDT 4 LANGKAH */}
            <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.cardTitle, { color: theme.textMain }]}>Alur Presensi PDT</Text>

              <View style={styles.pdtStepperRow}>
                {/* Step 1 */}
                <View style={styles.pdtStepCol}>
                  <View style={[styles.pdtStepDot, { backgroundColor: '#16a34a' }]}>
                    <Text style={styles.pdtStepNum}>✓</Text>
                  </View>
                  <Text style={[styles.pdtStepText, { color: '#16a34a', fontWeight: '800' }]}>Lokasi Valid</Text>
                </View>

                <View style={[styles.pdtStepLine, { backgroundColor: hasSubmittedToday ? '#16a34a' : '#0284c7' }]} />

                {/* Step 2 */}
                <View style={styles.pdtStepCol}>
                  <View style={[styles.pdtStepDot, { backgroundColor: hasSubmittedToday ? '#16a34a' : '#0284c7' }]}>
                    <Text style={styles.pdtStepNum}>{hasSubmittedToday ? '✓' : '2'}</Text>
                  </View>
                  <Text style={[styles.pdtStepText, { color: hasSubmittedToday ? '#16a34a' : theme.textMain }]}>Isi Alasan</Text>
                </View>

                <View style={[styles.pdtStepLine, { backgroundColor: hasSubmittedToday ? '#16a34a' : theme.borderSubtle }]} />

                {/* Step 3 */}
                <View style={styles.pdtStepCol}>
                  <View style={[styles.pdtStepDot, { backgroundColor: hasSubmittedToday ? '#16a34a' : theme.pillBg }]}>
                    <Text style={[styles.pdtStepNum, { color: hasSubmittedToday ? '#ffffff' : theme.textMuted }]}>
                      {hasSubmittedToday ? '✓' : '3'}
                    </Text>
                  </View>
                  <Text style={[styles.pdtStepText, { color: hasSubmittedToday ? '#16a34a' : theme.textMuted }]}>Foto Bukti</Text>
                </View>

                <View style={[styles.pdtStepLine, { backgroundColor: hasSubmittedToday ? '#16a34a' : theme.borderSubtle }]} />

                {/* Step 4 */}
                <View style={styles.pdtStepCol}>
                  <View style={[styles.pdtStepDot, { backgroundColor: hasSubmittedToday ? '#f59e0b' : theme.pillBg }]}>
                    <Text style={[styles.pdtStepNum, { color: hasSubmittedToday ? '#ffffff' : theme.textMuted }]}>
                      {hasSubmittedToday ? '⏳' : '4'}
                    </Text>
                  </View>
                  <Text style={[styles.pdtStepText, { color: hasSubmittedToday ? '#d97706' : theme.textMuted }]}>
                    {hasSubmittedToday ? 'Menunggu' : 'Verifikasi'}
                  </Text>
                </View>
              </View>
            </View>

            {/* STATUS PENGAJUAN / TOMBOL MULAI PRESENSI PDT */}
            <View style={[styles.cardBox, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              {hasSubmittedToday ? (
                <View style={{ gap: 12 }}>
                  <View style={styles.successBadgeRow}>
                    <IconCheckCircle size={22} color="#16a34a" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.successTitle, { color: '#047857' }]}>
                        Pengajuan PDT Telah Terkirim
                      </Text>
                      <Text style={[styles.successSub, { color: '#065f46' }]}>
                        Menunggu persetujuan resmi dari Kepala Instalasi / Admin Kepegawaian.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.submittedInfoBox, { backgroundColor: theme.pillBg }]}>
                    <Text style={[styles.infoLine, { color: theme.textMain }]}>
                      ⏱️ <Text style={{ fontWeight: '700' }}>Waktu Pengajuan:</Text> {existingPdt?.masuk || clockToDisplay} WIB
                    </Text>
                    <Text style={[styles.infoLine, { color: theme.textMain }]}>
                      📍 <Text style={{ fontWeight: '700' }}>Tujuan:</Text> {lokasiTujuan}
                    </Text>
                    <Text style={[styles.infoLine, { color: theme.textMain }]}>
                      📝 <Text style={{ fontWeight: '700' }}>Alasan:</Text> {selectedAlasan}
                    </Text>
                    <Text style={[styles.infoLine, { color: theme.textMain }]}>
                      📄 <Text style={{ fontWeight: '700' }}>Surat Tugas:</Text> {suratTugas}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={onBack}
                    style={[styles.backHomeBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                  >
                    <Text style={[styles.backHomeBtnText, { color: theme.textMain }]}>
                      Kembali ke Beranda
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textMain }]}>Formulir Presensi PDT Hari Ini</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSub }]}>
                      Klik tombol di bawah untuk mengisi rincian tugas dan mengunggah foto bukti lokasi dinas.
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setModalVisible(true)}
                    style={[styles.openFormBtn, { backgroundColor: '#0284c7' }]}
                  >
                    <Text style={styles.openFormBtnText}>Mulai Presensi PDT</Text>
                    <Text style={styles.openFormBtnSub}>Buka formulir verifikasi dinas luar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ================================================================= */}
        {/* 3. PANEL PENGUJIAN DEVELOPER (COLLAPSIBLE)                        */}
        {/* ================================================================= */}
        <View style={[styles.devPanelCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle, marginTop: 14 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDevPanel(!showDevPanel)}
            style={styles.devPanelHeader}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconSliders size={16} color={theme.textMuted} />
              <Text style={[styles.devPanelTitle, { color: theme.textMuted }]}>
                Panel Pengujian / Developer (Simulasi PDT)
              </Text>
            </View>
            <IconChevronDown size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {showDevPanel && (
            <View style={styles.devPanelContent}>
              <View style={styles.devBtnRow}>
                <TouchableOpacity
                  onPress={() => setUserDistance(1150)}
                  style={[styles.devActionBtn, { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderColor: '#0284c7' }]}
                >
                  <Text style={[styles.devActionText, { color: '#0284c7' }]}>Simulasi Luar Tilok (1.1 km)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUserDistance(50)}
                  style={[styles.devActionBtn, { backgroundColor: 'rgba(22, 163, 74, 0.12)', borderColor: '#16a34a' }]}
                >
                  <Text style={[styles.devActionText, { color: '#16a34a' }]}>Simulasi Dalam RSJ (50 m)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSuccessSubmitted(false)}
                  style={[styles.devActionBtn, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}
                >
                  <Text style={[styles.devActionText, { color: theme.textMain }]}>Reset Form PDT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ================================================================= */}
        {/* 4. MODAL / BOTTOM SHEET FORMULIR VERIFIKASI PDT                   */}
        {/* ================================================================= */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.bottomSheetCard, { backgroundColor: theme.cardSolid, borderColor: theme.borderSubtle }]}>
              {/* Header Halus */}
              <View style={[styles.modalHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textMain }]}>
                    Formulir Presensi Luar Tilok (PDT)
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                    {user?.name || 'Pegawai RSJ'} • {user?.badge || 'Ners Rawat Inap'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.closeIconBtn, { backgroundColor: theme.pillBg }]}
                >
                  <IconX size={18} color={theme.textMain} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 14, paddingVertical: 12 }}>
                  {/* WAKTU SERVER READ-ONLY (TIDAK DAPAT DIMANIPULASI) */}
                  <View style={[styles.serverTimeBox, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle }]}>
                    <IconClock size={18} color="#0284c7" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serverTimeLabel, { color: theme.textMuted }]}>
                        WAKTU ABSEN TERVERIFIKASI SERVER:
                      </Text>
                      <Text style={[styles.serverTimeValue, { color: theme.textMain }]}>
                        {clockToDisplay} WIB ({dateFormatted})
                      </Text>
                    </View>
                    <View style={styles.autoVerifiedPill}>
                      <Text style={styles.autoVerifiedText}>Otomatis</Text>
                    </View>
                  </View>

                  {/* Lokasi Tujuan */}
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Lokasi / Instansi Tujuan:</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                      placeholder="Contoh: Dinas Kesehatan Prov. Riau / Puskesmas"
                      placeholderTextColor={theme.textMuted}
                      value={lokasiTujuan}
                      onChangeText={setLokasiTujuan}
                    />
                  </View>

                  {/* Nomor Surat Tugas */}
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Nomor Surat Tugas (ST):</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain }]}
                      placeholder="Contoh: ST/RSJT/XI/2026/088"
                      placeholderTextColor={theme.textMuted}
                      value={suratTugas}
                      onChangeText={setSuratTugas}
                    />
                  </View>

                  {/* Pilihan Alasan Dinas (Warna Biru/Teal Terpilih, Bukan Merah) */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Alasan Dinas Luar:</Text>
                    <View style={styles.chipsWrap}>
                      {ALASAN_OPTIONS.map((opt) => {
                        const isSel = selectedAlasan === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            activeOpacity={0.8}
                            onPress={() => setSelectedAlasan(opt)}
                            style={[
                              styles.alasanChip,
                              isSel
                                ? { backgroundColor: '#0284c7', borderColor: '#0284c7' }
                                : { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle },
                            ]}
                          >
                            <Text
                              style={[
                                styles.alasanChipText,
                                { color: isSel ? '#ffffff' : theme.textMain, fontWeight: isSel ? '800' : '600' },
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {selectedAlasan === 'Lainnya (Tuliskan Keterangan)' && (
                      <TextInput
                        style={[styles.textInput, { backgroundColor: theme.pillBg, borderColor: theme.borderSubtle, color: theme.textMain, marginTop: 4 }]}
                        placeholder="Tuliskan keterangan detail alasan dinas..."
                        placeholderTextColor={theme.textMuted}
                        value={alasanLainnya}
                        onChangeText={setAlasanLainnya}
                      />
                    )}
                  </View>

                  {/* Foto Bukti Kamera dengan Watermark */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSub }]}>Foto Bukti Penugasan (Kamera):</Text>

                    {fotoBukti ? (
                      <View style={styles.photoPreviewCard}>
                        <Image source={{ uri: fotoBukti }} style={styles.photoImg} />
                        {/* Watermark Overlay */}
                        <View style={styles.watermarkOverlay}>
                          <Text style={styles.watermarkText}>SIAP RSJ TAMPAN • PDT VERIFIED</Text>
                          <Text style={styles.watermarkSub}>
                            {dateFormatted} - {clockToDisplay} WIB | Lat: {TILOK_LAT}, Long: {TILOK_LONG}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setFotoBukti(null)}
                          style={styles.retakePhotoBtn}
                        >
                          <Text style={styles.retakePhotoBtnText}>Ulangi Foto</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleCapturePhoto}
                        style={[styles.takePhotoBtn, { backgroundColor: theme.pillBg, borderColor: '#0284c7' }]}
                      >
                        <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
                        <Text style={[styles.takePhotoBtnText, { color: '#0284c7' }]}>
                          Ambil Foto Bukti Lokasi Dinas
                        </Text>
                        <Text style={[styles.takePhotoBtnSub, { color: theme.textMuted }]}>
                          Kamera akan menyematkan tanggal, jam, dan lokasi otomatis
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* TOMBOL KIRIM PENGAJUAN STICKY BAWAH */}
              <View style={[styles.modalFooter, { borderTopColor: theme.borderSubtle }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!isFormValid}
                  onPress={handleSubmitPdt}
                  style={[
                    styles.submitPdtBtn,
                    {
                      backgroundColor: isFormValid ? '#16a34a' : '#94a3b8',
                    },
                  ]}
                >
                  <Text style={styles.submitPdtBtnText}>
                    {isFormValid ? 'Kirim Pengajuan Presensi PDT' : 'Lengkapi Alasan & Foto Bukti'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },

  // 2-Column Grid
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  cardBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  distanceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceChipText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statusLocDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  mapWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clockLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clockBigText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginVertical: 4,
  },
  clockDateText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Accordion SOP
  sopAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sopTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  sopContentBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  sopPoint: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Stepper PDT
  pdtStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  pdtStepCol: {
    alignItems: 'center',
    width: 62,
  },
  pdtStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pdtStepNum: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  pdtStepText: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  pdtStepLine: {
    flex: 1,
    height: 2,
    marginTop: -16,
  },

  // Main Action
  openFormBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openFormBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  openFormBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },

  // Success Card
  successBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  successSub: {
    fontSize: 12,
    marginTop: 2,
  },
  submittedInfoBox: {
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  infoLine: {
    fontSize: 12.5,
  },
  backHomeBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  backHomeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Bottom Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  serverTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  serverTimeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serverTimeValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  autoVerifiedPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoVerifiedText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  alasanChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  alasanChipText: {
    fontSize: 12,
  },
  photoPreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 8,
  },
  watermarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  watermarkSub: {
    color: '#cbd5e1',
    fontSize: 9.5,
    marginTop: 2,
  },
  retakePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retakePhotoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  takePhotoBtn: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takePhotoBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  takePhotoBtnSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitPdtBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitPdtBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '900',
  },

  // Dev Panel
  devPanelCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  devPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  devPanelTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  devPanelContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    gap: 8,
  },
  devBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  devActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  devActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
