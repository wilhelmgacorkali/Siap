
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
import * as ImagePicker from 'expo-image-picker';
import TilokMap from '../components/TilokMap';

// Titik Tilok Resmi RS Jiwa Tampan (Sesuai Foto 2)
const TILOK_RESMI = {
  latitude: 0.465791,
  longitude: 101.381957,
  radius: 200, // meter
  jamPulang: '16:00:00',
  zonaWaktu: 'WIB',
  nama: 'RS Jiwa Tampan - Pekanbaru',
};

export default function PdtScreen({
  user,
  currentTime,
  attendance,
  onUpdatePdtAttendance,
  onBack,
  isDarkMode = true,
  theme,
}) {
  // Waktu digital lokal jika prop kosong
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

  // Tanggal Hari Ini (Format: 16 September 2026)
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // State Simulasi Jarak Geofencing (Default di luar tilok: 1.150m)
  const [simulatedDistance, setSimulatedDistance] = useState(1150);
  const isOutside = simulatedDistance > TILOK_RESMI.radius;

  // State Modal Absen PDT
  const [modalVisible, setModalVisible] = useState(false);
  const [absenType, setAbsenType] = useState('masuk'); // 'masuk' | 'pulang'
  const [alasan, setAlasan] = useState('Masih di jalan menuju kantor');
  const [keteranganDetail, setKeteranganDetail] = useState('');
  const [fotoBukti, setFotoBukti] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [localPdtData, setLocalPdtData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset Jam Simulasi untuk Pengujian Jam Kerja
  const [simulatedTimePreset, setSimulatedTimePreset] = useState('live');

  // Attendance Records PDT (kombinasi props dan lokal seketika)
  const pdtData = {
    ...(attendance?.pdt || {
      masuk: null,
      pulang: null,
      masukScore: null,
      pulangScore: null,
    }),
    ...localPdtData,
  };

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Callback ref agar media stream langsung terhubung begitu elemen <video> di-mount ke DOM
  const attachVideoRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.muted = true;
      node.playsInline = true;
      const p = node.play();
      if (p !== undefined) {
        p.catch((err) => console.log('Video play catch on ref attach:', err));
      }
    }
  };

  // Pastikan stream terpasang ketika isCameraActive bernilai true
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.catch((err) => console.log('Video play catch on cameraActive effect:', err));
      }
    }
  }, [isCameraActive]);

  // Bersihkan track kamera saat unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Bersihkan kamera saat modal ditutup
  useEffect(() => {
    if (!modalVisible) {
      stopCamera();
    }
  }, [modalVisible]);

  // Mulai Kamera untuk Foto Bukti di Jalan
  const startCamera = async (targetFacingMode = facingMode) => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Akses kamera dibutuhkan untuk mengambil foto bukti.');
          return;
        }
        let result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          // Gunakan base64 jika ada agar bisa ditampilkan, jika tidak gunakan uri
          const uriOrBase64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          setFotoBukti(uriOrBase64);
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal membuka kamera perangkat: ' + err.message);
      }
      return;
    }

    // Stop stream lama jika masih aktif
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    // Implementasi khusus Web (HTML5 navigator.mediaDevices)
    try {
      setCameraError(null);
      setIsCameraLoading(true);

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung (getUserMedia).');
      }

      let stream = null;
      try {
        // Percobaan 1: Coba dengan constraint facingMode ideal dan resolusi HD
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Percobaan facingMode gagal, mencoba fallback generic video: true...', err1);
        // Percobaan 2: Fallback generic video: true (sangat penting untuk webcam PC/laptop USB)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.catch((err) => console.log('Video play catch in startCamera:', err));
        }
      }
    } catch (err) {
      console.error('Kamera error:', err);
      setCameraError('Akses kamera tidak diizinkan atau kamera tidak tersedia pada browser Anda.');
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  // Toggle antara Kamera Depan dan Belakang (Jalan)
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  };

  // Fungsi utilitas untuk mengambil frame kamera aktif dengan watermark resmi
  const captureCurrentFrame = () => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      // Batasi ukuran gambar maksimal 800px agar ringan di penyimpanan tapi tetap sangat tajam
      const scale = Math.min(1, 800 / Math.max(vw, vh));
      const targetW = Math.round(vw * scale);
      const targetH = Math.round(vh * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // Jika kamera depan, buat cerminan wajar seperti tampilan preview
      if (facingMode === 'user') {
        ctx.translate(targetW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, targetW, targetH);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        ctx.drawImage(video, 0, 0, targetW, targetH);
      }

      // Watermark PDT Resmi
      const bannerHeight = Math.max(75, Math.round(targetH * 0.22));
      const bannerTop = targetH - bannerHeight;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, bannerTop, targetW, bannerHeight);

      // Garis oranye aksen SIMRS
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, bannerTop, targetW, 3);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('BUKTI PERJALANAN PRESENSI LUAR TILOK (PDT)', 14, bannerTop + 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10.5px monospace';
      ctx.fillText(
        `GPS: 0.4732N, 101.3755E (${simulatedDistance}m dari RSJ Tampan) | ${clockToDisplay} WIB`,
        14,
        bannerTop + 38
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(
        `Pegawai: ${user?.name || 'Pegawai RS'} | Alasan: ${alasan.slice(0, 32)}`,
        14,
        bannerTop + 56
      );

      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (err) {
      console.error('Frame capture error:', err);
      return null;
    }
  };

  const handleCapturePhoto = () => {
    const photo = captureCurrentFrame();
    if (photo) {
      setFotoBukti(photo);
      setFormError(null);
      stopCamera();
    } else {
      setFormError('Gagal mengambil foto dari kamera. Silakan coba kembali.');
    }
  };

  // Upload Foto dari Penyimpanan Lokal
  const handleUploadPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoBukti(event.target.result);
        setFormError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Buka Modal Absen
  const handleOpenAbsen = (type) => {
    // 1. Cek Geofencing
    if (!isOutside) {
      const msg = `Anda saat ini terdeteksi berada di dalam radius resmi (${simulatedDistance}m <= 200m). Menu PDT khusus untuk presensi di luar radius kantor. Apakah Anda ingin tetap lanjut ke form PDT?`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
        if (!window.confirm(msg)) return;
      } else {
        Alert.alert(
          'Perhatian Tilok',
          msg,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Lanjut PDT',
              onPress: () => {
                setAbsenType(type);
                setFotoBukti(null);
                setFormError(null);
                setModalVisible(true);
              },
            },
          ]
        );
        return;
      }
    }

    setAbsenType(type);
    setFotoBukti(null);
    setFormError(null);
    setModalVisible(true);
  };

  // Kirim & Simpan Absen PDT
  const handleSubmitPdt = () => {
    setFormError(null);

    // 1. Cek Foto Bukti: Jika belum ada foto tapi kamera sedang aktif menyala, otomatis ambil frame saat itu juga!
    let photoToSave = fotoBukti;
    if (!photoToSave && isCameraActive && videoRef.current) {
      photoToSave = captureCurrentFrame();
      if (photoToSave) {
        setFotoBukti(photoToSave);
      }
    }

    // 2. Jika foto tetap belum ada, berikan notifikasi error yang jelas dan interaktif
    if (!photoToSave) {
      const errMsg = 'Harap ambil foto bukti kondisi jalan terlebih dahulu atau pilih file foto!';
      setFormError(errMsg);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert('⚠️ Foto Bukti Diperlukan\n\n' + errMsg);
      } else {
        Alert.alert('Foto Bukti Diperlukan', errMsg);
      }
      return;
    }

    setIsSubmitting(true);

    const finalTime =
      simulatedTimePreset === 'ontime'
        ? (absenType === 'masuk' ? '07:45:00' : '16:05:00')
        : clockToDisplay;

    // Perhitungan score & data presensi PDT
    const scoreData = {
      code: absenType === 'masuk' ? 'PDT-M' : 'PDT-P',
      label: absenType === 'masuk' ? 'Masuk (Luar Tilok)' : 'Pulang (Luar Tilok)',
      percentage: 100,
      potongan: '0.00%',
      icon: '🚗',
      bg: '#fff7ed',
      color: '#c2410c',
      reason: alasan,
      keterangan: keteranganDetail,
      photo: photoToSave,
      distance: simulatedDistance,
      validTilokCoords: `${TILOK_RESMI.latitude}, ${TILOK_RESMI.longitude} (Radius ${TILOK_RESMI.radius}m)`,
    };

    try {
      // 1. Simpan ke sistem induk App
      if (onUpdatePdtAttendance) {
        onUpdatePdtAttendance(absenType, finalTime, scoreData);
      }

      // 2. Simpan ke state lokal seketika agar UI kartu langsung update (bercentang hijau)
      setLocalPdtData((prev) => ({
        ...prev,
        [absenType]: finalTime,
        [`${absenType}Score`]: scoreData,
      }));

      // 3. Matikan kamera dan tutup modal
      stopCamera();
      setModalVisible(false);
      setIsSubmitting(false);

      // 4. Tampilkan pesan sukses jelas
      const successText = `Presensi ${absenType === 'masuk' ? 'Masuk' : 'Pulang'} luar tilok (PDT) berhasil disimpan pada ${finalTime} WIB!`;
      setSuccessMessage(successText);

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`✓ Presensi PDT Berhasil Disimpan!\n\n${successText}\n\nAlasan: ${alasan}`);
      } else {
        Alert.alert('Presensi PDT Berhasil Disimpan! ✓', successText);
      }
    } catch (err) {
      console.error('Submit PDT error:', err);
      setIsSubmitting(false);
      setFormError('Gagal menyimpan presensi: ' + err.message);
    }
  };

  return (
    <ScrollView style={[styles.scroll, theme && { backgroundColor: theme.bgMain }]} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        {/* Breadcrumb & Screen Title Sesuai Screenshot 1 */}
        <View style={styles.headerBar}>
          <Text style={styles.screenTitle}>Pegawai Presensi PDT</Text>
          <Text style={styles.breadcrumb}>Home / Pegawai Presensi PDT</Text>
        </View>

        {/* Banner Notifikasi Sukses PDT */}
        {successMessage && (
          <View style={styles.successBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.successIconBadge}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
              </View>
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => setSuccessMessage(null)} style={{ padding: 4 }}>
              <Text style={{ color: '#047857', fontSize: 13, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Banner Merah Khas SIAP RSJ Tampan (Screenshot 1) */}
        <View style={styles.redBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.redBannerIcon}>
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>📍</Text>
            </View>
            <View>
              <Text style={styles.redBannerTitle}>Presensi Diluar Tilok (PDT)</Text>
              <Text style={styles.redBannerSub}>
                Presensi yang dilakukan diluar titik lokasi yang ditentukan
              </Text>
            </View>
          </View>
        </View>

        {/* Panel Konten Utama: 3 Kolom / Responsif */}
        <View style={styles.contentGrid}>
          {/* ================= Kolom Kiri: Peta, Jam, dan Tombol Absen ================= */}
          <View style={styles.leftColumn}>
            {/* Peta Tilok & Radius Leaflet */}
            <View style={styles.mapCard}>
              <TilokMap
                latitude={TILOK_RESMI.latitude}
                longitude={TILOK_RESMI.longitude}
                radius={TILOK_RESMI.radius}
                userDistance={simulatedDistance}
                isOutsideRadius={isOutside}
                height={200}
                showControls={false}
              />

              {/* Quick Distance Switcher untuk Pengujian */}
              <View style={styles.distanceSwitcherRow}>
                <Text style={{ fontSize: 10.5, color: '#64748b', fontWeight: '700' }}>
                  Simulasi Lokasi Pegawai:
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[
                      styles.switchPill,
                      simulatedDistance === 1150 && styles.switchPillActiveOrange,
                    ]}
                    onPress={() => setSimulatedDistance(1150)}
                  >
                    <Text
                      style={[
                        styles.switchPillText,
                        simulatedDistance === 1150 && styles.switchPillTextActive,
                      ]}
                    >
                      🚗 Di Jalan (1.1 km - Luar Radius)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.switchPill,
                      simulatedDistance === 14 && styles.switchPillActiveGreen,
                    ]}
                    onPress={() => setSimulatedDistance(14)}
                  >
                    <Text
                      style={[
                        styles.switchPillText,
                        simulatedDistance === 14 && styles.switchPillTextActive,
                      ]}
                    >
                      🏢 Di Kantor (14m)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Jam Digital Besar & Tanggal (Screenshot 1) */}
            <View style={styles.clockCard}>
              <Text style={styles.bigClockText}>{clockToDisplay}</Text>
              <Text style={styles.dateText}>{todayFormatted}</Text>
              <Text style={styles.timezoneText}>Waktu Indonesia Barat (WIB)</Text>
            </View>

            {/* Tombol Absen Masuk (Hijau) & Absen Pulang (Kuning) Sesuai Screenshot 1 */}
            <View style={styles.actionsRow}>
              {/* Absen Masuk */}
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[
                    styles.pdtActionButton,
                    styles.btnMasukGreen,
                    pdtData.masuk && styles.btnDisabled,
                  ]}
                  disabled={!!pdtData.masuk}
                  onPress={() => handleOpenAbsen('masuk')}
                >
                  <Text style={styles.btnActionIcon}>✓</Text>
                  <Text style={styles.btnActionText}>Absen Masuk</Text>
                </TouchableOpacity>

                {/* Status Box Bawah Tombol */}
                <View style={styles.indicatorBox}>
                  {pdtData.masuk ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.indicatorStatusDone}>
                        ✓ Jam: {pdtData.masuk}
                      </Text>
                      <Text style={{ fontSize: 9.5, color: '#047857', fontWeight: '700' }}>
                        Tercatat (PDT 100%)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.indicatorPlaceholder}>XX 0%</Text>
                  )}
                </View>
              </View>

              {/* Absen Pulang */}
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[
                    styles.pdtActionButton,
                    styles.btnPulangYellow,
                    pdtData.pulang && styles.btnDisabled,
                  ]}
                  disabled={!!pdtData.pulang}
                  onPress={() => handleOpenAbsen('pulang')}
                >
                  <Text style={styles.btnActionText}>Absen Pulang</Text>
                </TouchableOpacity>

                {/* Status Box Bawah Tombol */}
                <View style={styles.indicatorBox}>
                  {pdtData.pulang ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.indicatorStatusDone}>
                        ✓ Jam: {pdtData.pulang}
                      </Text>
                      <Text style={{ fontSize: 9.5, color: '#b45309', fontWeight: '700' }}>
                        Tercatat (PDT 100%)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.indicatorPlaceholder}>XX 0%</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* ================= Kolom Tengah: Info Shift & Jam Kerja ================= */}
          <View style={styles.middleColumn}>
            <View style={styles.infoCard}>
              {/* Jenis Absen Row */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jenis Absen</Text>
                <View style={styles.badgeNormalShift}>
                  <Text style={styles.badgeNormalText}>Normal (Non-shift)</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Jam Absen Masuk Box */}
              <View style={styles.infoRowBlock}>
                <Text style={styles.infoLabel}>Jam Absen Masuk</Text>
                <View style={styles.timeRangeBox}>
                  <Text style={styles.timeRangeText}>07:00:00</Text>
                  <Text style={styles.timeRangeDash}>-</Text>
                  <Text style={styles.timeRangeText}>08:00:59</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Jam Absen Pulang Box */}
              <View style={styles.infoRowBlock}>
                <Text style={styles.infoLabel}>Jam Absen Pulang</Text>
                <View style={styles.timeRangeBox}>
                  <Text style={styles.timeRangeText}>16:00:00</Text>
                  <Text style={styles.timeRangeDash}>-</Text>
                  <Text style={styles.timeRangeText}>18:00:59</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Konfigurasi Radius Titik Lokasi Resmi (Foto 2) */}
              <View style={styles.tilokConfigBox}>
                <Text style={styles.tilokConfigTitle}>🎯 Titik Valid RSJ Tampan (Foto 2)</Text>
                <View style={styles.tilokConfigGrid}>
                  <View style={styles.tilokParam}>
                    <Text style={styles.tilokParamLabel}>Latitude</Text>
                    <Text style={styles.tilokParamVal}>{TILOK_RESMI.latitude}</Text>
                  </View>
                  <View style={styles.tilokParam}>
                    <Text style={styles.tilokParamLabel}>Longitude</Text>
                    <Text style={styles.tilokParamVal}>{TILOK_RESMI.longitude}</Text>
                  </View>
                  <View style={styles.tilokParam}>
                    <Text style={styles.tilokParamLabel}>Radius</Text>
                    <Text style={[styles.tilokParamVal, { color: '#e11d48' }]}>
                      {TILOK_RESMI.radius} meter
                    </Text>
                  </View>
                  <View style={styles.tilokParam}>
                    <Text style={styles.tilokParamLabel}>Jam Pulang</Text>
                    <Text style={styles.tilokParamVal}>{TILOK_RESMI.jamPulang}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ================= Kolom Kanan: Panduan Dokumen (Screenshot 1) ================= */}
          <View style={styles.rightColumn}>
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <Text style={styles.guideTitle}>
                  📄 Panduan Presensi Luar Tilok (PDT)
                </Text>
                <Text style={styles.guideSubtitle}>
                  Standar Operasional Prosedur (SOP) SIMRS RSJ Tampan
                </Text>
              </View>

              {/* Stepper Langkah */}
              <View style={styles.guideBody}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>Deteksi Geofencing Radius</Text>
                    <Text style={styles.stepText}>
                      Pastikan perangkat Anda aktif GPS. Sistem secara otomatis membaca koordinat dan mendeteksi apabila Anda berada di luar radius 200m dari titik resmi RS Jiwa Tampan.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>Waktu Presensi Sesuai Shift</Text>
                    <Text style={styles.stepText}>
                      Absen Masuk dibuka pada pukul <Text style={{ fontWeight: '800' }}>07:00:00 - 08:00:59</Text> dan Absen Pulang pada <Text style={{ fontWeight: '800' }}>16:00:00 - 18:00:59</Text>.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>Alasan di Luar Titik Lokasi</Text>
                    <Text style={styles.stepText}>
                      Pegawai wajib menyertakan keterangan alasan berada di luar tilok, seperti masih di perjalanan menuju RS, kendala macet, atau dinas luar rujukan.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>Lampiran Foto Bukti di Jalan</Text>
                    <Text style={styles.stepText}>
                      Ambil foto langsung atau lampirkan dokumen foto kondisi nyata di perjalanan untuk verifikasi SIMRS dan atasan langsung.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.backButtonBottom}
                onPress={onBack}
              >
                <Text style={styles.backButtonBottomText}>← Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= MODAL: Input Alasan & Lampirkan Foto Bukti ================= */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    🚗 Verifikasi Presensi Luar Tilok (PDT)
                  </Text>
                  <Text style={styles.modalSub}>
                    Absen {absenType === 'masuk' ? 'Masuk' : 'Pulang'} • {todayFormatted} ({clockToDisplay} WIB)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    stopCamera();
                    setModalVisible(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Text style={{ color: '#64748b', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                {/* Status Geofencing Warning */}
                <View style={styles.geofenceNotice}>
                  <Text style={{ fontSize: 18 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.geofenceNoticeTitle}>
                      Terdeteksi Di Luar Radius Tilok ({simulatedDistance} meter)
                    </Text>
                    <Text style={styles.geofenceNoticeDesc}>
                      Titik Tilok Resmi: Lat {TILOK_RESMI.latitude}, Long {TILOK_RESMI.longitude} (Radius {TILOK_RESMI.radius}m).
                    </Text>
                  </View>
                </View>

                {/* Pilihan Waktu Simulasi */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pilih Waktu Catat Absen:</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.timePresetChip,
                        simulatedTimePreset === 'live' && styles.timePresetChipActive,
                      ]}
                      onPress={() => setSimulatedTimePreset('live')}
                    >
                      <Text
                        style={[
                          styles.timePresetText,
                          simulatedTimePreset === 'live' && styles.timePresetTextActive,
                        ]}
                      >
                        ⏱️ Jam Sekarang ({clockToDisplay})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timePresetChip,
                        simulatedTimePreset === 'ontime' && styles.timePresetChipActive,
                      ]}
                      onPress={() => setSimulatedTimePreset('ontime')}
                    >
                      <Text
                        style={[
                          styles.timePresetText,
                          simulatedTimePreset === 'ontime' && styles.timePresetTextActive,
                        ]}
                      >
                        ⭐ Tepat Waktu ({absenType === 'masuk' ? '07:45' : '16:05'})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Pilihan Alasan Presensi Di Luar Tilok */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    1. Alasan Berada di Luar Tilok: <Text style={{ color: '#e11d48' }}>*</Text>
                  </Text>
                  <View style={styles.reasonChipsWrap}>
                    {[
                      'Masih di jalan menuju kantor',
                      'Terjebak macet total lalu lintas',
                      'Kendaraan bermasalah di perjalanan',
                      'Dinas luar / Tugas rujukan pasien',
                      'Lainnya',
                    ].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.reasonChip,
                          alasan === r && styles.reasonChipActive,
                        ]}
                        onPress={() => setAlasan(r)}
                      >
                        <Text
                          style={[
                            styles.reasonChipText,
                            alasan === r && styles.reasonChipTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Input Teks Alasan Detail */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Keterangan Tambahan (Opsional):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Contoh: Sedang dalam perjalanan di Jl. HR Soebrantas, perkiraan sampai kantor 15 menit lagi..."
                    value={keteranganDetail}
                    onChangeText={setKeteranganDetail}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Lampirkan Foto Bukti di Jalan */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    2. Lampirkan Foto Bukti di Jalan / Kondisi Perjalanan:{' '}
                    <Text style={{ color: '#e11d48' }}>*</Text>
                  </Text>

                  {/* Preview Foto Jika Sudah Diambil */}
                  {fotoBukti ? (
                    <View style={styles.photoPreviewCard}>
                      <Image source={{ uri: fotoBukti }} style={styles.previewImage} />
                      <View style={styles.previewMeta}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                          ✓ Foto Bukti Berhasil Dilampirkan
                        </Text>
                        <TouchableOpacity
                          style={styles.btnRetake}
                          onPress={() => {
                            setFotoBukti(null);
                            startCamera();
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                            Ambil Ulang ↺
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cameraBox}>
                      {isCameraActive ? (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                          {/* Container Preview Kamera Live */}
                          <View style={styles.videoContainer}>
                            {Platform.OS === 'web' && (
                              <video
                                ref={attachVideoRef}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={(e) => {
                                  try {
                                    e.currentTarget.play();
                                  } catch (err) {
                                    console.warn('Metadata play catch:', err);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: 10,
                                  backgroundColor: '#0f172a',
                                  objectFit: 'cover',
                                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                                }}
                              />
                            )}

                            {/* Badge Indikator Status Kamera */}
                            <View style={styles.cameraBadgeOverlay}>
                              <View style={styles.liveIndicatorBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveIndicatorText}>LIVE KAMERA</Text>
                              </View>
                              <View style={styles.facingBadge}>
                                <Text style={styles.facingBadgeText}>
                                  {facingMode === 'user' ? '👤 Depan' : '🛣️ Belakang (Jalan)'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Tombol Kontrol: Jepret, Putar Kamera, Batalkan */}
                          <View style={styles.cameraControlsRow}>
                            <TouchableOpacity
                              style={styles.btnCapture}
                              onPress={handleCapturePhoto}
                            >
                              <Text style={styles.btnCaptureText}>📸 Ambil Foto Bukti Sekarang</Text>
                            </TouchableOpacity>

                            {Platform.OS === 'web' && (
                              <TouchableOpacity
                                style={styles.btnFlipCamera}
                                onPress={handleToggleFacingMode}
                              >
                                <Text style={styles.btnFlipCameraText}>🔄 Putar</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.btnCancelCamera}
                              onPress={stopCamera}
                            >
                              <Text style={styles.btnCancelCameraText}>✕ Batal</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', padding: 12, width: '100%' }}>
                          {isCameraLoading ? (
                            <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                              <Text style={{ fontSize: 26, marginBottom: 6 }}>⏳</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
                                Menghubungkan ke Kamera...
                              </Text>
                              <Text style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>
                                Mohon tunggu atau izinkan akses kamera pada browser
                              </Text>
                            </View>
                          ) : (
                            <>
                              <Text style={{ fontSize: 28 }}>📷</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 4 }}>
                                Ambil atau Unggah Foto Bukti
                              </Text>
                              <Text style={{ fontSize: 10.5, color: '#64748b', textAlign: 'center', marginTop: 2 }}>
                                Lampirkan foto bahwa Anda masih di jalan menuju kantor
                              </Text>

                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                <TouchableOpacity
                                  style={styles.btnStartCamera}
                                  onPress={() => startCamera('user')}
                                >
                                  <Text style={styles.btnStartCameraText}>📸 Buka Kamera Langsung</Text>
                                </TouchableOpacity>

                                {Platform.OS === 'web' && (
                                  <label style={styles.btnUploadFile}>
                                    <Text style={styles.btnUploadFileText}>📁 Pilih File Foto</Text>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleUploadPhoto}
                                      style={{ display: 'none' }}
                                    />
                                  </label>
                                )}
                              </View>
                            </>
                          )}
                        </View>
                      )}

                      {cameraError && (
                        <View style={styles.cameraErrorBox}>
                          <Text style={{ fontSize: 13, marginRight: 6 }}>⚠️</Text>
                          <Text style={styles.cameraErrorText}>
                            {cameraError}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Validasi Titik Tilok Resmi Sistem (Foto 2) */}
                <View style={styles.validPointCard}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#0f172a' }}>
                    🎯 Data Titik Radius Resmi RS Jiwa Tampan (Foto 2):
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
                    Koordinat: {TILOK_RESMI.latitude}° N, {TILOK_RESMI.longitude}° E | Radius: {TILOK_RESMI.radius} meter
                  </Text>
                  <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700', marginTop: 2 }}>
                    ✓ Data koordinat dan bukti foto perjalanan akan disimpan sebagai bukti sah PDT.
                  </Text>
                </View>
              </ScrollView>

              {/* Tombol Simpan & Kirim PDT */}
              <View style={styles.modalFooter}>
                {formError && (
                  <View style={styles.formErrorBox}>
                    <Text style={{ fontSize: 13, marginRight: 6 }}>⚠️</Text>
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.btnSubmitPdt, isSubmitting && { opacity: 0.7 }]}
                  disabled={isSubmitting}
                  onPress={handleSubmitPdt}
                >
                  <Text style={styles.btnSubmitPdtText}>
                    {isSubmitting
                      ? 'Sedang Menyimpan Presensi PDT...'
                      : 'Simpan & Kirim Presensi Luar Tilok (PDT) ✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  page: {
    padding: 16,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  headerBar: {
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  breadcrumb: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  redBanner: {
    backgroundColor: '#e11d48',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(225, 29, 72, 0.25)' }
      : { elevation: 2 }),
  },
  redBannerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  redBannerSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  leftColumn: {
    flex: 1.2,
    minWidth: 320,
  },
  middleColumn: {
    flex: 1,
    minWidth: 280,
  },
  rightColumn: {
    flex: 1.1,
    minWidth: 280,
  },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  distanceSwitcherRow: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafaf9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  switchPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  switchPillActiveOrange: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  switchPillActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  switchPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  switchPillTextActive: {
    color: '#ffffff',
  },
  clockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  bigClockText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  timezoneText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pdtActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }
      : { elevation: 2 }),
  },
  btnMasukGreen: {
    backgroundColor: '#22c55e',
  },
  btnPulangYellow: {
    backgroundColor: '#eab308',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnActionIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  indicatorBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
    minHeight: 40,
    justifyContent: 'center',
  },
  indicatorPlaceholder: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  indicatorStatusDone: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRowBlock: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  badgeNormalShift: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeNormalText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  timeRangeBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  timeRangeDash: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginVertical: 1,
  },
  tilokConfigBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  tilokConfigTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#9f1239',
    marginBottom: 8,
  },
  tilokConfigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tilokParam: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  tilokParamLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  tilokParamVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '800',
    marginTop: 1,
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guideHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  guideSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  guideBody: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '900',
  },
  stepHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepText: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  backButtonBottom: {
    marginTop: 18,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  backButtonBottomText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }
      : { elevation: 5 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  geofenceNotice: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  geofenceNoticeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#c2410c',
  },
  geofenceNoticeDesc: {
    fontSize: 10.5,
    color: '#9a3412',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  timePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  timePresetChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  timePresetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timePresetTextActive: {
    color: '#ffffff',
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  reasonChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  reasonChipTextActive: {
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    fontSize: 11.5,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  cameraBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  btnStartCamera: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnStartCameraText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  btnUploadFile: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnUploadFileText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  videoContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveIndicatorText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  facingBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  facingBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  btnCapture: {
    flex: 1,
    backgroundColor: '#e11d48',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCaptureText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnFlipCamera: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnFlipCameraText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  btnCancelCamera: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnCancelCameraText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  cameraErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    width: '100%',
  },
  cameraErrorText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  photoPreviewCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  previewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
  },
  btnRetake: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  validPointCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  formErrorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
    flex: 1,
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBannerText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 10,
  },
  btnSubmitPdt: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSubmitPdtText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
