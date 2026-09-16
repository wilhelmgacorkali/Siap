import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

export default function FaceRecognitionModal({
  visible,
  type = 'masuk', // 'masuk' | 'pulang'
  user,
  currentTime,
  isDording = false,
  onClose,
  onSubmit,
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('ready'); // 'ready' | 'scanning' | 'success'
  const [matchScore, setMatchScore] = useState(99.4);
  const [selectedPreset, setSelectedPreset] = useState('live'); // 'live' | 'ontime' | 'late15' | 'late30' | 'late60'

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Inject CSS keyframe animation for the scanning laser line (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'face-recognition-keyframes';
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
          @keyframes laserScan {
            0% { top: 0; }
            100% { top: calc(100% - 4px); }
          }
          @keyframes pulseDot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.6); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [visible]);

  // Ensure video stream gets attached whenever cameraActive is true and video mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => console.warn('Video play catch:', err));
      }
    }
  }, [cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    setScanStep('ready');
    setCapturedPhoto(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = null;
        try {
          // Attempt 1: with facingMode user (ideal for mobile front camera)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (err1) {
          console.log('facingMode:user failed, trying generic video constraint for PC webcam:', err1);
          // Attempt 2: generic video: true (essential for laptop/USB webcams like HD Webcam / Lenovo)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        setCameraActive(true);

        // If video element is already mounted, attach immediately
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch((e) => console.warn('Play error:', e));
        }
      } else {
        setCameraActive(false);
      }
    } catch (err) {
      console.log('Camera access notice:', err.message);
      setCameraError('Kamera tidak aktif atau izin belum siap. Silakan klik tombol coba lagi di bawah.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Determine time based on selected simulation preset or live clock
  const getSelectedTime = () => {
    if (isDording) {
      if (selectedPreset === 'ontime') {
        return type === 'masuk' ? '13:50:00' : '20:05:00';
      }
      if (selectedPreset === 'late15') {
        return type === 'masuk' ? '14:15:00' : '19:45:00';
      }
      if (selectedPreset === 'late30') {
        return type === 'masuk' ? '14:30:00' : '19:30:00';
      }
      if (selectedPreset === 'late60') {
        return type === 'masuk' ? '15:00:00' : '19:00:00';
      }
      return currentTime || (type === 'masuk' ? '13:50:00' : '20:05:00');
    }

    if (selectedPreset === 'ontime') {
      return type === 'masuk' ? '07:43:04' : '14:05:00';
    }
    if (selectedPreset === 'late15') {
      return type === 'masuk' ? '08:15:00' : '13:45:00';
    }
    if (selectedPreset === 'late30') {
      return type === 'masuk' ? '08:30:00' : '13:30:00';
    }
    if (selectedPreset === 'late60') {
      return type === 'masuk' ? '09:00:00' : '13:00:00';
    }
    return currentTime || (type === 'masuk' ? '07:43:04' : '14:05:00');
  };

  // Preview score calculation
  const calculateScore = (timeStr) => {
    const fallbackTime = isDording ? '13:50:00' : '07:43:04';
    const parts = (timeStr || fallbackTime).split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const totalMinutes = h * 60 + m;

    if (type === 'masuk') {
      // 07:00:00 s/d 08:00:59 (Shift Pagi) atau 13:00:00 s/d 14:00:59 (Dording)
      const limit = isDording ? 14 * 60 : 8 * 60; // 14:00 untuk Dording, 08:00 (08:00:59) untuk Shift Pagi
      if (totalMinutes <= limit) {
        return {
          percentage: 100,
          code: 'SWM',
          potongan: '0.00%',
          text: 'Sesuai Waktu Masuk (SWM)',
          subtext: 'Presensi Tepat Waktu (100%)',
          color: '#16a34a',
          badgeBg: '#ecfdf5',
          bg: '#ecfdf5',
          borderColor: '#16a34a',
          icon: '✓',
        };
      } else {
        const late = totalMinutes - limit;
        let p = 100;
        let pot = '0.00%';
        if (late <= 15) { p = 95; pot = '1.25%'; }
        else if (late <= 30) { p = 90; pot = '2.50%'; }
        else if (late <= 60) { p = 85; pot = '3.75%'; }
        else if (late <= 90) { p = 80; pot = '5.00%'; }
        else if (late <= 120) { p = 70; pot = '7.50%'; }
        else { p = Math.max(25, Math.round(100 - late * 0.35)); pot = `${100 - p}%`; }

        return {
          percentage: p,
          code: 'TL',
          potongan: pot,
          text: `Terlambat ${late}m (${p}%)`,
          subtext: `Potongan Keterlambatan -${pot}`,
          color: p >= 80 ? '#d97706' : '#dc2626',
          badgeBg: p >= 80 ? '#fffbeb' : '#fef2f2',
          bg: p >= 80 ? '#fffbeb' : '#fef2f2',
          borderColor: p >= 80 ? '#f59e0b' : '#ef4444',
          icon: '⏱️',
        };
      }
    } else {
      // 14:00:00 s/d 16:00:59 (Shift Pagi) atau 20:00:00 s/d 21:00:59 (Dording)
      const limit = isDording ? 20 * 60 : 14 * 60; // 20:00 untuk Dording, 14:00 (14:00:00 - 16:00:59) untuk Shift Pagi
      if (totalMinutes >= limit) {
        return {
          percentage: 100,
          code: 'SWP',
          potongan: '0.00%',
          text: 'Sesuai Waktu Pulang (SWP)',
          subtext: 'Jam Kerja Lengkap (100%)',
          color: '#16a34a',
          badgeBg: '#ecfdf5',
          bg: '#ecfdf5',
          borderColor: '#16a34a',
          icon: '✓',
        };
      } else {
        const early = limit - totalMinutes;
        const p = Math.max(25, Math.round(100 - early * 0.8));
        return {
          percentage: p,
          code: 'PSW',
          potongan: `${100 - p}%`,
          text: `Pulang Cepat ${early}m (${p}%)`,
          subtext: `Kurang Jam Kerja -${100 - p}%`,
          color: '#d97706',
          badgeBg: '#fffbeb',
          bg: '#fffbeb',
          borderColor: '#f59e0b',
          icon: '⏱️',
        };
      }
    }
  };

  const currentSimulatedTime = getSelectedTime();
  const currentCalculatedScore = calculateScore(currentSimulatedTime);

  // Trigger Face Recognition Scan & Photo Capture
  const handleCapture = () => {
    setIsScanning(true);
    setScanStep('scanning');

    // Play high-tech audio beep if available
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        setTimeout(() => {
          osc.frequency.value = 1760;
          setTimeout(() => osc.stop(), 120);
        }, 100);
      }
    } catch (e) {}

    // Snap photo from real webcam or generate simulated biometric frame
    setTimeout(() => {
      let photoUrl = null;
      if (cameraActive && videoRef.current) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          // Crop square center
          const minDim = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
          const sx = (videoRef.current.videoWidth - minDim) / 2;
          const sy = (videoRef.current.videoHeight - minDim) / 2;
          ctx.drawImage(videoRef.current, sx, sy, minDim, minDim, 0, 0, 480, 480);

          // Add official watermark stamp
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(0, 400, 480, 80);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('RS JIWA TAMPAN - PEKANBARU', 14, 424);
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px monospace';
          ctx.fillText(`GPS: 0.465791N, 101.381957E | R:200m | ${currentSimulatedTime} WIB`, 14, 446);
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`VALID: Face Match 99.4% | ${user?.name?.slice(0, 24)}`, 14, 468);

          photoUrl = canvas.toDataURL('image/jpeg', 0.85);
        } catch (err) {
          console.log('Capture error:', err);
        }
      }

      setCapturedPhoto(photoUrl);
      setScanStep('success');
      setIsScanning(false);

      // Finish and submit after showing success tick
      setTimeout(() => {
        stopCamera();
        onSubmit({
          time: currentSimulatedTime,
          score: currentCalculatedScore,
          photo: photoUrl,
        });
      }, 1000);
    }, 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.card}>
          {/* Header */}
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={modalStyles.iconCircle}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
              <View>
                <Text style={modalStyles.headerTitle}>Face Recognition Biometrik</Text>
                <Text style={modalStyles.headerSub}>
                  Verifikasi Wajah di Area RSJ Tampan ({isDording ? 'Dording - ' : ''}{type === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'})
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* AI Biometric Camera Viewport */}
          <View style={modalStyles.cameraFrame}>
            {/* Live Video Element */}
            {Platform.OS === 'web' && cameraActive ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.muted = true;
                    el.playsInline = true;
                    el.play().catch((e) => console.warn('Play error on mount:', e));
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror mode
                }}
              />
            ) : (
              /* Simulated High-Tech Camera Avatar */
              <View style={modalStyles.avatarSimulation}>
                <View style={modalStyles.avatarCircle}>
                  <Text style={{ fontSize: 72 }}>👩‍⚕️</Text>
                </View>
                <Text style={modalStyles.avatarName}>{user?.name}</Text>
                <Text style={modalStyles.avatarNip}>NIP: {user?.nip}</Text>
                {cameraError && (
                  <Text style={modalStyles.cameraNotice}>{cameraError}</Text>
                )}
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    onPress={startCamera}
                    style={{
                      marginTop: 10,
                      backgroundColor: '#0284c7',
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                      🔄 Hubungkan Kamera Sekarang
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Futuristic Face Recognition Scanning Mesh Overlay */}
            <View style={modalStyles.overlayGrid}>
              {/* Corner Targets */}
              <View style={[modalStyles.corner, modalStyles.tl]} />
              <View style={[modalStyles.corner, modalStyles.tr]} />
              <View style={[modalStyles.corner, modalStyles.bl]} />
              <View style={[modalStyles.corner, modalStyles.br]} />

              {/* Biometric Oval Guide */}
              <View
                style={[
                  modalStyles.faceOval,
                  scanStep === 'success' && modalStyles.faceOvalSuccess,
                ]}
              >
                {/* Vertical Laser Scan Line Animation */}
                {isScanning && <View style={modalStyles.laserScanLine} />}

                {/* Mesh Landmark Points */}
                <View style={[modalStyles.meshDot, { top: '32%', left: '35%' }]} />
                <View style={[modalStyles.meshDot, { top: '32%', right: '35%' }]} />
                <View style={[modalStyles.meshDot, { top: '50%', left: '49%' }]} />
                <View style={[modalStyles.meshDot, { top: '70%', left: '38%' }]} />
                <View style={[modalStyles.meshDot, { top: '70%', right: '38%' }]} />
              </View>

              {/* Top AI HUD Status Badge */}
              <View style={modalStyles.hudTop}>
                <View
                  style={[
                    modalStyles.statusDot,
                    scanStep === 'success' ? { backgroundColor: '#10b981' } : {},
                  ]}
                />
                <Text style={modalStyles.hudTopText}>
                  {scanStep === 'scanning'
                    ? '🔍 MENGANALISIS STRUKTUR WAJAH...'
                    : scanStep === 'success'
                    ? '✓ WAJAH TERVERIFIKASI (MATCH 99.4%)'
                    : 'AI FACE DETECT: SIAP MEMINDAI'}
                </Text>
              </View>

              {/* Bottom Tilok Location Stamp */}
              <View style={modalStyles.hudBottom}>
                <Text style={modalStyles.hudLocationText}>
                  📍 Area RSJ Tampan (Radius Tilok Valid: 14m)
                </Text>
                <Text style={modalStyles.hudTimeText}>
                  ⏰ {currentSimulatedTime} WIB | Match: {matchScore}%
                </Text>
              </View>
            </View>
          </View>

          {/* Simulation Preset Selector: Live vs Ontime vs Late */}
          <View style={modalStyles.presetWrap}>
            <Text style={modalStyles.presetLabel}>
              ⚡ Uji Simulasi Waktu Presensi (Mempengaruhi % Kehadiran):
            </Text>
            <View style={modalStyles.presetRow}>
              {(isDording
                ? [
                    { id: 'live', label: '⏰ Live Jam', time: currentTime || '13:50:00' },
                    { id: 'ontime', label: '🟢 Tepat (100%)', time: type === 'masuk' ? '13:50:00' : '20:05:00' },
                    { id: 'late15', label: '🟡 Telat 15m (95%)', time: type === 'masuk' ? '14:15:00' : '19:45:00' },
                    { id: 'late30', label: '🟠 Telat 30m (90%)', time: type === 'masuk' ? '14:30:00' : '19:30:00' },
                    { id: 'late60', label: '🔴 Telat 1j (85%)', time: type === 'masuk' ? '15:00:00' : '19:00:00' },
                  ]
                : [
                    { id: 'live', label: '⏰ Live Jam', time: currentTime || '07:15:00' },
                    { id: 'ontime', label: '🟢 Tepat (100%)', time: type === 'masuk' ? '07:15:00' : '16:05:00' },
                    { id: 'late15', label: '🟡 Telat 15m (95%)', time: type === 'masuk' ? '07:45:00' : '15:45:00' },
                    { id: 'late30', label: '🟠 Telat 30m (90%)', time: type === 'masuk' ? '08:00:00' : '15:30:00' },
                    { id: 'late60', label: '🔴 Telat 1j (85%)', time: type === 'masuk' ? '08:30:00' : '15:00:00' },
                  ]
              ).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPreset(p.id)}
                  style={[
                    modalStyles.presetBtn,
                    selectedPreset === p.id && modalStyles.presetBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.presetBtnText,
                      selectedPreset === p.id && modalStyles.presetBtnTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Real-time Percentage Preview Card */}
          <View
            style={[
              modalStyles.scorePreviewCard,
              { backgroundColor: currentCalculatedScore.badgeBg, borderColor: currentCalculatedScore.color },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.scoreTitle}>
                Prediksi Skor Nilai Presensi {type === 'masuk' ? 'Masuk' : 'Pulang'}:
              </Text>
              <Text style={[modalStyles.scoreSubtitle, { color: currentCalculatedScore.color }]}>
                {currentCalculatedScore.text} • Jam: {currentSimulatedTime} WIB
              </Text>
            </View>
            <View
              style={[
                modalStyles.percentagePill,
                { backgroundColor: currentCalculatedScore.color },
              ]}
            >
              <Text style={modalStyles.percentagePillText}>
                {currentCalculatedScore.percentage}%
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={modalStyles.btnRow}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={() => {
                stopCamera();
                onClose();
              }}
              disabled={isScanning}
            >
              <Text style={modalStyles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modalStyles.captureBtn,
                scanStep === 'success' && { backgroundColor: '#059669' },
              ]}
              onPress={handleCapture}
              disabled={isScanning || scanStep === 'success'}
            >
              <Text style={modalStyles.captureBtnText}>
                {isScanning
                  ? '⏳ Memindai Wajah...'
                  : scanStep === 'success'
                  ? '✓ Presensi Berhasil!'
                  : '📸 Ambil Foto & Verifikasi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }
      : { elevation: 8 }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#090d16',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  avatarSimulation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginBottom: 8,
  },
  avatarName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarNip: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  cameraNotice: {
    color: '#38bdf8',
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  overlayGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38bdf8',
  },
  tl: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3 },
  faceOval: {
    width: 150,
    height: 190,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.75)',
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
  },
  faceOvalSuccess: {
    borderColor: '#10b981',
    borderStyle: 'solid',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  laserScanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#38bdf8',
    boxShadow: '0 0 12px 2px #38bdf8',
    ...(Platform.OS === 'web'
      ? {
        }
      : {}),
  },
  meshDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    boxShadow: '0 0 6px #38bdf8',
  },
  hudTop: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  hudTopText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  hudBottom: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  hudLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  hudTimeText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  presetWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  presetBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  presetBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#ffffff',
  },
  scorePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  scoreSubtitle: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 2,
  },
  percentagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  percentagePillText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  captureBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
        }
      : {}),
  },
  captureBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
