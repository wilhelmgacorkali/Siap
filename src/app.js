/**
 * SIAP (Sistem Informasi & Absensi Pegawai) - RSJ Tampan
 * Core Application Logic & State Engine
 * Integrated with Face Recognition & Attendance Percentage Scoring
 */

(function () {
  'use strict';

  // State Store
  const state = {
    user: null, // null when logged out, or user object
    currentScreen: 'login', // 'login' | 'dashboard' | 'presensi' | 'rekap' | 'pdt' | 'approval_pdt' | 'pegawai' | 'pengaturan'
    isSidebarOpen: false,
    selectedDevice: 'iphone', // 'iphone' | 'fullscreen'
    presensiMode: 'dording', // 'sekarang' | 'dording'
    simPreset: 'live', // 'live' | 'ontime' | 'late15' | 'late30' | 'late60'

    // Konfigurasi Jam Absen per Shift (dapat diubah Admin)
    shiftSettings: {
      pagi: {
        nama: 'Shift Pagi',
        icon: '🌅',
        masukMulai: '06:00',
        masukSelesai: '07:00',
        pulangMulai: '14:00',
        pulangSelesai: '15:00',
        warna: '#10b981',
      },
      sore: {
        nama: 'Shift Sore',
        icon: '🌇',
        masukMulai: '13:00',
        masukSelesai: '14:00',
        pulangMulai: '20:00',
        pulangSelesai: '22:00',
        warna: '#0284c7',
      },
      malam: {
        nama: 'Shift Malam',
        icon: '🌙',
        masukMulai: '20:00',
        masukSelesai: '21:00',
        pulangMulai: '07:00',
        pulangSelesai: '08:00',
        warna: '#7c3aed',
      },
      dording: {
        nama: 'Shift Dording',
        icon: '⏱️',
        masukMulai: '13:00',
        masukSelesai: '14:00',
        pulangMulai: '07:00',
        pulangSelesai: '08:00',
        warna: '#d97706',
      },
    },
    // Shift aktif yang digunakan untuk kalkulasi presensi
    activeShift: 'sore',
    cameraModal: {
      open: false,
      actionType: 'masuk', // 'masuk' | 'pulang'
      stream: null,
      faceMatched: true,
      matchRate: 98.7,
    },
    todayStatus: {
      masuk: null, // e.g. '13:05:22'
      masukScore: null, // { percentage: 100, lateMinutes: 0, statusText: 'Tepat Waktu (100%)', badgeClass: 'score-100', icon: '✓' }
      pulang: null,
      pulangScore: null,
      status: 'Belum Absen',
      lokasi: 'RSJ Tampan (Radius Tilok)',
      distance: 14, // meters from center
    },
    history: [
      { id: 1, date: '02 Sep 2026', shift: 'Perawat - Shift Siang', masuk: '13:01:40', pulang: '21:05:12', status: 'Hadir (100%)', tilok: 'RSJ Tampan' },
      { id: 2, date: '01 Sep 2026', shift: 'Perawat - Shift Pagi', masuk: '06:58:20', pulang: '14:02:10', status: 'Hadir (100%)', tilok: 'RSJ Tampan' },
      { id: 3, date: '31 Agu 2026', shift: 'Perawat - Shift Malam', masuk: '20:55:00', pulang: '07:05:30', status: 'Hadir (100%)', tilok: 'RSJ Tampan' },
      { id: 4, date: '30 Agu 2026', shift: 'Dinas Luar (PDT)', masuk: '08:00:00', pulang: '16:00:00', status: 'PDT Approved', tilok: 'Dinkes Prov. Riau' },
    ],
    pdtSubmissions: [
      { id: 'PDT-001', nama: 'Ners. Siti Aminah', tanggal: '05 Sep 2026', lokasi: 'Dinas Kesehatan Prov. Riau', alasan: 'Pelatihan Pelayanan Jiwa Terpadu', status: 'Pending' },
      { id: 'PDT-002', nama: 'dr. Ahmad Fauzi, Sp.KJ', tanggal: '02 Sep 2026', lokasi: 'Kemenkes RI Jakarta', alasan: 'Rapat Koordinasi RS Jiwa', status: 'Disetujui' },
    ],
    shiftSchedule: [
      { day: 1, code: 'P', name: 'Pagi' },
      { day: 2, code: 'S', name: 'Sore' },
      { day: 3, code: 'D', name: 'Dording' },
      { day: 4, code: 'M', name: 'Malam' },
      { day: 5, code: 'L', name: 'Libur' },
      { day: 6, code: 'P', name: 'Pagi' },
      { day: 7, code: 'P', name: 'Pagi' },
      { day: 8, code: 'S', name: 'Sore' },
      { day: 9, code: 'S', name: 'Sore' },
      { day: 10, code: 'D', name: 'Dording' },
      { day: 11, code: 'M', name: 'Malam' },
      { day: 12, code: 'L', name: 'Libur' },
      { day: 13, code: 'P', name: 'Pagi' },
      { day: 14, code: 'S', name: 'Sore' },
      { day: 15, code: 'S', name: 'Sore' },
      { day: 16, code: 'D', name: 'Dording' },
      { day: 17, code: 'M', name: 'Malam' },
      { day: 18, code: 'L', name: 'Libur' },
      { day: 19, code: 'P', name: 'Pagi' },
      { day: 20, code: 'P', name: 'Pagi' },
      { day: 21, code: 'S', name: 'Sore' },
      { day: 22, code: 'D', name: 'Dording' },
      { day: 23, code: 'M', name: 'Malam' },
      { day: 24, code: 'L', name: 'Libur' },
      { day: 25, code: 'P', name: 'Pagi' },
      { day: 26, code: 'S', name: 'Sore' },
      { day: 27, code: 'S', name: 'Sore' },
      { day: 28, code: 'D', name: 'Dording' },
      { day: 29, code: 'M', name: 'Malam' },
      { day: 30, code: 'L', name: 'Libur' },
    ],
  };

  // Fixed Tilok Coordinates (RSJ Tampan Pekanbaru, Riau)
  const RSJ_COORDS = [0.46824, 101.40263];
  let leafletMapInstance = null;

  // Clock Timer
  let clockInterval = null;

  // DOM Elements Cache
  const appContainer = document.getElementById('app-container');
  const deviceFrame = document.getElementById('device-frame');

  // Initialization
  function init() {
    setupDeviceSwitcher();
    startClockUpdates();
    renderApp();
  }

  // Device Frame Viewport Switcher
  function setupDeviceSwitcher() {
    const buttons = document.querySelectorAll('.device-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.device;
        state.selectedDevice = mode;
        if (mode === 'fullscreen') {
          deviceFrame.className = 'device-frame fullscreen-mode';
        } else {
          deviceFrame.className = 'device-frame';
        }
      });
    });
  }

  // Live Real-Time Clock
  function startClockUpdates() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const clockBadges = document.querySelectorAll('.live-clock-badge, .clock-digits, #top-status-time');
      clockBadges.forEach((el) => {
        if (el) el.textContent = timeStr;
      });
    }, 1000);
  }

  function getFormattedDate() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Helper: konversi "HH:MM" ke total menit
  function timeToMinutes(timeStr) {
    const parts = (timeStr || '00:00').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  // =========================================================================
  // ATTENDANCE PERCENTAGE SCORING ENGINE (Dinamis - Sesuai Pengaturan Shift)
  // =========================================================================
  function calculateAttendanceScore(type, timeStr) {
    const shift = state.shiftSettings[state.activeShift] || state.shiftSettings.sore;
    const totalMinutes = timeToMinutes(timeStr);

    if (type === 'masuk') {
      // Batas tepat waktu = masukSelesai
      const limitMinutes = timeToMinutes(shift.masukSelesai);

      if (totalMinutes <= limitMinutes) {
        return {
          percentage: 100,
          lateMinutes: 0,
          statusText: 'Tepat Waktu (100%)',
          badgeClass: 'score-100',
          icon: '✓',
        };
      } else {
        const late = totalMinutes - limitMinutes;
        let score = 100;
        if (late <= 5) score = 95;
        else if (late <= 15) score = 85;
        else if (late <= 30) score = 70;
        else if (late <= 60) score = 50;
        else score = Math.max(15, Math.round(100 - late * 0.8));

        return {
          percentage: score,
          lateMinutes: late,
          statusText: `Terlambat ${late} mnt (${score}%)`,
          badgeClass: score >= 80 ? 'score-warning' : 'score-danger',
          icon: '⏱️',
        };
      }
    } else {
      // Batas pulang tepat = pulangMulai
      const shiftEndMinutes = timeToMinutes(shift.pulangMulai);
      if (totalMinutes >= shiftEndMinutes) {
        return {
          percentage: 100,
          earlyMinutes: 0,
          statusText: 'Shift Selesai Penuh (100%)',
          badgeClass: 'score-100',
          icon: '✓',
        };
      } else {
        const early = shiftEndMinutes - totalMinutes;
        const score = Math.max(25, Math.round(100 - early * 1.0));
        return {
          percentage: score,
          earlyMinutes: early,
          statusText: `Pulang Awal ${early} mnt (${score}%)`,
          badgeClass: 'score-warning',
          icon: '⏱️',
        };
      }
    }
  }

  function getEffectiveTimeForSubmission() {
    if (state.simPreset === 'ontime') return '13:05:22';
    if (state.simPreset === 'late15') return '14:15:45';
    if (state.simPreset === 'late30') return '14:30:10';
    if (state.simPreset === 'late60') return '15:00:30';
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }

  // Navigation Controller
  function navigateTo(screenName, params = {}) {
    state.currentScreen = screenName;
    if (params.mode) {
      state.presensiMode = params.mode;
    }
    state.isSidebarOpen = false;
    renderApp();
  }

  // Toggle Sidebar
  function toggleSidebar(open) {
    if (typeof open === 'boolean') {
      state.isSidebarOpen = open;
    } else {
      state.isSidebarOpen = !state.isSidebarOpen;
    }
    const overlay = document.querySelector('.sidebar-overlay');
    const drawer = document.querySelector('.sidebar-drawer');
    if (overlay && drawer) {
      if (state.isSidebarOpen) {
        overlay.classList.add('active');
        drawer.classList.add('open');
      } else {
        overlay.classList.remove('active');
        drawer.classList.remove('open');
      }
    }
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-container';
    toast.innerHTML = `
      <div class="toast-message ${type}">
        <span>${type === 'success' ? '✓' : '⚠️'}</span>
        <span>${message}</span>
      </div>
    `;
    appContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // Confetti Celebration
  function triggerCelebration() {
    if (window.confetti) {
      window.confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#10b981', '#f59e0b', '#38bdf8'],
      });
    }
  }

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================
  function renderApp() {
    if (!state.user && state.currentScreen !== 'login') {
      state.currentScreen = 'login';
    }

    if (state.currentScreen === 'login') {
      renderLogin();
      return;
    }

    // Authenticated Shell (Header + Sidebar + Active Screen)
    appContainer.innerHTML = `
      ${renderHeaderBar()}
      ${renderSidebar()}
      <div class="screen-view" id="screen-view-content">
        ${renderActiveScreenContent()}
      </div>
      ${state.cameraModal.open ? renderCameraModal() : ''}
    `;

    attachGlobalEvents();

    if (state.currentScreen === 'presensi') {
      setTimeout(initLeafletMap, 100);
    }
  }

  // Header Bar with Menu Button & Official Identity
  function renderHeaderBar() {
    const titles = {
      dashboard: 'Beranda SIAP',
      presensi: state.presensiMode === 'dording' ? 'Presensi Dording (Shift Berkelanjutan)' : 'Presensi Sekarang (Tilok RSJ)',
      rekap: 'Rekap Absensi',
      pdt: 'Presensi Luar Tilok (PDT)',
      approval_pdt: 'Approve PDT',
      pegawai: 'Data Pegawai',
      pengaturan: '⚙️ Pengaturan Jam Absen',
    };

    return `
      <header class="app-header">
        <button class="menu-toggle-btn" id="btn-toggle-menu" title="Buka Menu Sidebar">
          <div class="menu-icon-bars">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>Menu</span>
        </button>

        <div class="header-center-title">
          <img src="assets/rsj_tampan_symbol_transparent.svg" alt="RSJ Tampan" style="width: 26px; height: 26px; vertical-align: middle; margin-right: 8px;">
          <span>${titles[state.currentScreen] || 'SIAP Mobile'}</span>
        </div>

        <div class="header-actions">
          <button class="header-icon-btn" id="btn-header-notif" title="Notifikasi">
            🔔
            <span class="notif-badge"></span>
          </button>
        </div>
      </header>
    `;
  }

  // Sliding Sidebar Drawer Component (Matching Photo 2)
  function renderSidebar() {
    const user = state.user || { name: 'Ners. Fitri Rahmadani', role: 'Pegawai RS - Shift Sore', avatar: 'FR' };
    const isPerawat = user.role.toLowerCase().includes('perawat') || user.role.toLowerCase().includes('pegawai');

    return `
      <div class="sidebar-overlay ${state.isSidebarOpen ? 'active' : ''}" id="sidebar-overlay"></div>
      <aside class="sidebar-drawer ${state.isSidebarOpen ? 'open' : ''}" id="sidebar-drawer">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <img src="assets/rsj_tampan_symbol_transparent.svg" alt="RSJ" style="width: 36px; height: 36px;">
            <div class="sidebar-brand-text">
              <h3>SIAP RSJ TAMPAN</h3>
              <p>Sistem Absensi Pegawai</p>
            </div>
          </div>
          <button class="sidebar-close-btn" id="btn-close-sidebar" title="Tutup Menu">✕</button>
        </div>

        <div class="sidebar-user-card">
          <div class="sidebar-avatar">${user.avatar || 'AS'}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <span class="sidebar-role-badge ${isPerawat ? 'perawat' : ''}">${user.role}</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-title">Menu Utama</div>
          <button class="sidebar-nav-item ${state.currentScreen === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
            <span class="sidebar-nav-icon">🌐</span>
            <span>Beranda</span>
          </button>
          
          <button class="sidebar-nav-item ${state.currentScreen === 'presensi' && state.presensiMode === 'sekarang' ? 'active' : ''}" data-nav="presensi" data-mode="sekarang">
            <span class="sidebar-nav-icon">🕒</span>
            <span>Presensi Sekarang</span>
          </button>

          <button class="sidebar-nav-item ${state.currentScreen === 'presensi' && state.presensiMode === 'dording' ? 'active' : ''}" data-nav="presensi" data-mode="dording">
            <span class="sidebar-nav-icon">⏱️</span>
            <span>Presensi Dording</span>
          </button>

          <div class="sidebar-section-title">DATA</div>
          <button class="sidebar-nav-item ${state.currentScreen === 'pegawai' ? 'active' : ''}" data-nav="pegawai">
            <span class="sidebar-nav-icon">👥</span>
            <span>Pegawai</span>
          </button>

          <div class="sidebar-section-title">LAPORAN</div>
          <button class="sidebar-nav-item ${state.currentScreen === 'rekap' ? 'active' : ''}" data-nav="rekap">
            <span class="sidebar-nav-icon">📊</span>
            <span>Rekap Absensi</span>
          </button>

          <button class="sidebar-nav-item ${state.currentScreen === 'approval_pdt' ? 'active' : ''}" data-nav="approval_pdt">
            <span class="sidebar-nav-icon">✅</span>
            <span>Approve PDT</span>
            <span class="sidebar-nav-badge">1</span>
          </button>

          <div class="sidebar-section-title">LAINNYA</div>
          <button class="sidebar-nav-item ${state.currentScreen === 'pdt' ? 'active' : ''}" data-nav="pdt">
            <span class="sidebar-nav-icon">🚗</span>
            <span>Presensi Luar Tilok (PDT)</span>
          </button>
          <button class="sidebar-nav-item" id="btn-menu-kendala">
            <span class="sidebar-nav-icon">🛠️</span>
            <span>Kendala Teknis</span>
          </button>

          <div class="sidebar-section-title">ADMINISTRASI</div>
          <button class="sidebar-nav-item ${state.currentScreen === 'pengaturan' ? 'active' : ''}" data-nav="pengaturan">
            <span class="sidebar-nav-icon">⚙️</span>
            <span>Pengaturan Jam Absen</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="sidebar-logout-btn" id="btn-sidebar-logout">
            <span>🚪</span>
            <span>Sign Out / Keluar</span>
          </button>
        </div>
      </aside>
    `;
  }

  // Active Screen Content Router
  function renderActiveScreenContent() {
    switch (state.currentScreen) {
      case 'dashboard':
        return renderDashboardScreen();
      case 'presensi':
        return renderPresensiScreen();
      case 'rekap':
        return renderRekapScreen();
      case 'pdt':
        return renderPdtScreen();
      case 'approval_pdt':
        return renderApprovalPdtScreen();
      case 'pegawai':
        return renderPegawaiScreen();
      case 'pengaturan':
        return renderPengaturanScreen();
      default:
        return renderDashboardScreen();
    }
  }

  // =========================================================================
  // 1. LOGIN SCREEN (Moving Background + Transparent RSJ Logo + Animations)
  // =========================================================================
  function renderLogin() {
    appContainer.innerHTML = `
      <div class="login-screen">
        <!-- Animated Moving Hospital Background (Ken Burns effect) -->
        <div class="login-bg-motion"></div>
        <div class="login-bg-overlay"></div>

        <!-- Floating Ambient Light Particles -->
        <div class="floating-particle particle-1"></div>
        <div class="floating-particle particle-2"></div>
        <div class="floating-particle particle-3"></div>

        <!-- Transparent Frosted Glass Card -->
        <div class="login-card-transparent">
          <!-- Official RSJ Tampan Logo (Transparent Vector SVG matching User Image) -->
          <div class="rsj-logo-container">
            <img src="assets/rsj_tampan_official_transparent.svg" alt="RSJ Tampan Provinsi Riau" class="rsj-logo-official-img">
          </div>

          <!-- Form Title -->
          <div class="login-title-rsui">Portal Pegawai RS</div>
          <div style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 14px;">Khusus Presensi Pegawai RS Jiwa Tampan</div>

          <form id="login-form">
            <!-- Email / NIP Input -->
            <div class="rsui-form-group">
              <div class="rsui-input-wrap">
                <span class="rsui-input-icon">✉️</span>
                <input type="text" id="login-username" class="rsui-input-field" placeholder="NIP / Nama Pegawai RS" value="Ners. Fitri Rahmadani" required autocomplete="username">
              </div>
            </div>

            <!-- Password Input -->
            <div class="rsui-form-group">
              <div class="rsui-input-wrap">
                <span class="rsui-input-icon">🔒</span>
                <input type="password" id="login-password" class="rsui-input-field" placeholder="Password" value="password123" required autocomplete="current-password">
              </div>
            </div>

            <!-- Solid MASUK Button -->
            <button type="submit" class="btn-masuk-rsui" id="btn-login-submit">
              <span>MASUK SEBAGAI PEGAWAI</span>
            </button>

            <div style="display: flex; gap: 6px; margin-top: 12px;">
              <button type="button" class="sim-pill" id="quick-login-perawat" style="flex: 1.2; text-align: center; height: 32px; font-weight: 700;">
                🩺 Pegawai RS (Utama)
              </button>
              <button type="button" class="sim-pill" id="quick-login-admin" style="flex: 1; text-align: center; height: 32px; opacity: 0.85;">
                🛠️ Akses Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Bind Login Events
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim() || 'Ners. Fitri Rahmadani';
        performLogin(username, username.toLowerCase().includes('admin') ? 'Administrator (Akses Monitoring)' : 'Pegawai RS - Shift Sore');
      });
    }

    const btnQuickPerawat = document.getElementById('quick-login-perawat');
    if (btnQuickPerawat) {
      btnQuickPerawat.addEventListener('click', () => performLogin('Ners. Fitri Rahmadani', 'Pegawai RS - Shift Sore'));
    }

    const btnQuickAdmin = document.getElementById('quick-login-admin');
    if (btnQuickAdmin) {
      btnQuickAdmin.addEventListener('click', () => performLogin('ADMIN SIMRS', 'Administrator (Akses Monitoring)'));
    }
  }

  function performLogin(name, role) {
    const isAdmin = role.toLowerCase().includes('admin');
    state.user = {
      name: name,
      role: role,
      nip: isAdmin ? '19800101 200501 1 001' : '19890412 201403 2 004',
      avatar: name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      unit: isAdmin ? 'Pengawasan & Monitoring SIMRS (Akses Terbatas)' : 'Instalasi Rawat Inap & Keperawatan RSJ',
    };
    showToast(`Selamat datang, ${state.user.name}!`);
    navigateTo('dashboard');
  }

  // =========================================================================
  // 2. DASHBOARD SCREEN (Matching Photo 2: 5 Action Cards + Jadwal Dinas)
  // =========================================================================
  function renderDashboardScreen() {
    const user = state.user;
    const dateFormatted = getFormattedDate();
    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];

    return `
      <div class="dashboard-screen">
        <!-- Official Hospital Brand Banner on Dashboard / Beranda -->
        <div class="dashboard-brand-banner">
          <img src="assets/rsj_tampan_official_transparent.svg" alt="RSJ Tampan Provinsi Riau" class="dashboard-brand-logo-img">
          <div class="dashboard-brand-info">
            <strong>RS JIWA TAMPAN</strong>
            <span>Pemerintah Provinsi Riau</span>
          </div>
        </div>

        <!-- Welcome Greeting Card matching Photo 2 with Official Transparent Logo -->
        <div class="welcome-card">
          <div class="welcome-decor-circle"></div>
          <div class="welcome-decor-circle-2"></div>

          <div class="welcome-card-top-row">
            <div>
              <div class="welcome-sub">Welcome!,</div>
              <h2 class="welcome-name">${user.name} ,</h2>
              <div class="welcome-role-tag">${user.role}</div>
            </div>
            <div class="welcome-logo-badge">
              <img src="assets/rsj_tampan_official_transparent.svg" alt="RSJ Tampan Provinsi Riau" style="height: 52px; width: auto; background: rgba(255,255,255,0.92); padding: 5px 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            </div>
          </div>

          <div class="welcome-datetime">
            <span>📅 ${dateFormatted}</span>
            <span class="live-clock-badge" id="top-status-time">${timeFormatted}</span>
          </div>
        </div>

        <!-- 5 ACTION CARDS (Matching Photo 2 layout) -->
        <div class="dashboard-actions-grid">
          <!-- 1. Presensi Sekarang (Biru) -->
          <div class="action-card card-presensi-sekarang" id="card-action-presensi">
            <div class="action-card-content">
              <div class="action-card-title">
                <span>📍</span> Presensi Sekarang
              </div>
              <div class="action-card-desc">
                Lakukan absensi masuk dan pulang Anda hari ini.
              </div>
            </div>
            <div class="action-card-icon-wrap">
              <span>👉</span>
            </div>
          </div>

          <!-- 2. Rekap Absensi (Merah) -->
          <div class="action-card card-rekap-absensi" id="card-action-rekap">
            <div class="action-card-content">
              <div class="action-card-title">
                <span>📊</span> Rekap Absensi
              </div>
              <div class="action-card-desc">
                Lihat riwayat absensi Anda.
              </div>
            </div>
            <div class="action-card-icon-wrap">
              <span>📅</span>
            </div>
          </div>

          <!-- 3. Presensi Diluar Tilok (PDT) (Navy/Dark Slate) -->
          <div class="action-card card-presensi-pdt" id="card-action-pdt">
            <div class="action-card-content">
              <div class="action-card-title">
                <span>🚗</span> Presensi Diluar Tilok (PDT)
              </div>
              <div class="action-card-desc">
                Gunakan fitur ini untuk melakukan presensi di luar lokasi tilok.
              </div>
            </div>
            <div class="action-card-icon-wrap">
              <span>📝</span>
            </div>
          </div>

          <!-- 4. Approve PDT (Steel Slate) -->
          <div class="action-card card-approve-pdt" id="card-action-approve-pdt">
            <div class="action-card-content">
              <div class="action-card-title">
                <span>✅</span> Approve PDT
              </div>
              <div class="action-card-desc">
                Approve presensi diluar tilok (PDT).
              </div>
            </div>
            <div class="action-card-icon-wrap">
              <span>📋</span>
            </div>
          </div>

          <!-- 5. Presensi Dording (Kuning Gold) -->
          <div class="action-card card-presensi-dording" id="card-action-dording">
            <div class="action-card-content">
              <div class="action-card-title">
                <span>⏱️</span> Presensi Dording
              </div>
              <div class="action-card-desc">
                Gunakan fitur ini untuk melakukan presensi dording.
              </div>
            </div>
            <div class="action-card-icon-wrap">
              <span>⚡</span>
            </div>
          </div>
        </div>

        <!-- Interactive Shift Calendar (Jadwal Dinas matching Photo 2) -->
        <div class="jadwal-dinas-section">
          <div class="jadwal-header">
            <div class="jadwal-title">
              <span>📅</span> Jadwal Dinas
            </div>
            <div style="display: flex; gap: 6px;">
              <span class="jadwal-month-badge" style="background: #10b981; color: #fff;">Tahun 2026</span>
              <span class="jadwal-month-badge" style="background: #10b981; color: #fff;">Bulan 09</span>
            </div>
          </div>

          <div class="shift-calendar-scroll">
            ${state.shiftSchedule.map(item => `
              <div class="shift-day-pill ${item.day === 3 ? 'today' : ''}" data-day="${item.day}">
                <span class="shift-day-num">${item.day}</span>
                <span class="shift-code-badge shift-${item.code.toLowerCase()}">${item.code}</span>
              </div>
            `).join('')}
          </div>

          <div class="shift-legend">
            <div class="legend-item"><span class="legend-dot shift-p"></span> Pagi</div>
            <div class="legend-item"><span class="legend-dot shift-s"></span> Sore</div>
            <div class="legend-item"><span class="legend-dot shift-m"></span> Malam</div>
            <div class="legend-item"><span class="legend-dot shift-d"></span> Dording</div>
            <div class="legend-item"><span class="legend-dot shift-l"></span> Libur</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. PRESENSI SCREEN (Matching Photo 1 with Percentage Box Under Buttons)
  // =========================================================================
  function renderPresensiScreen() {
    const isDording = state.presensiMode === 'dording';
    const dateFormatted = getFormattedDate();
    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];

    const hasMasuk = !!state.todayStatus.masuk;
    const hasPulang = !!state.todayStatus.pulang;
    const masukScore = state.todayStatus.masukScore;
    const pulangScore = state.todayStatus.pulangScore;

    return `
      <div class="presensi-screen">
        <!-- Pink Breadcrumb / Notice Banner matching Photo 1 -->
        <div class="presensi-notice-banner">
          <h4>
            <span>🏥</span> ${isDording ? 'Presensi Dording (Dinas Shift Berkelanjutan)' : 'Presensi Sekarang (Tilok RSJ Tampan)'}
          </h4>
          <div>${isDording ? 'Presensi yang dilakukan ketika ada jadwal dording (Dinas Shift Berkelanjutan)' : 'Presensi yang dilakukan ketika ada jadwal dinas reguler di dalam radius tilok.'}</div>
        </div>

        <div class="presensi-desktop-grid">
          <!-- Column 1: Map, Big Clock, Absen Buttons + Percentage Display -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Interactive Geofencing Map -->
            <div class="map-card">
              <div class="map-header">
                <span>📍 Peta Geofence Tilok</span>
                <span class="geofence-status-pill">
                  <span>●</span> Radius Tilok Aktif (14m)
                </span>
              </div>

              <div id="leaflet-map"></div>

              <div class="map-toolbar">
                <span>Gedung Instalasi NAPZA / RSJ Tampan</span>
                <button class="btn-gps-refresh" id="btn-refresh-gps">🎯 Kalibrasi</button>
              </div>
            </div>

            <!-- Big Live Clock Display -->
            <div class="clock-display-card">
              <div class="clock-digits">${timeFormatted}</div>
              <div class="clock-date">📅 ${dateFormatted}</div>
            </div>

            <!-- Testing Simulation Preset Toolbar -->
            <div class="simulation-bar-card">
              <div class="simulation-bar-header">
                <span>⚡ Simulasi Waktu Presensi:</span>
                <span style="color: #0284c7;">Pilih untuk Uji Persentase</span>
              </div>
              <div class="simulation-pills-row">
                <button class="sim-pill ${state.simPreset === 'live' ? 'active' : ''}" data-preset="live">
                  ⏰ Waktu Nyata (Live)
                </button>
                <button class="sim-pill ${state.simPreset === 'ontime' ? 'active' : ''}" data-preset="ontime">
                  🟢 Tepat Waktu (13:05 -> 100%)
                </button>
                <button class="sim-pill ${state.simPreset === 'late15' ? 'active' : ''}" data-preset="late15">
                  🟡 Telat 15m (14:15 -> 85%)
                </button>
                <button class="sim-pill ${state.simPreset === 'late30' ? 'active' : ''}" data-preset="late30">
                  🟠 Telat 30m (14:30 -> 70%)
                </button>
                <button class="sim-pill ${state.simPreset === 'late60' ? 'active' : ''}" data-preset="late60">
                  🔴 Telat 60m (15:00 -> 50%)
                </button>
              </div>
            </div>

            <!-- Action Buttons Row with Percentage Box Below (Matching Photo 1) -->
            <div class="absen-actions-row">
              <!-- Kolom Absen Masuk -->
              <div class="absen-col">
                <button class="btn-absen-action btn-absen-masuk" id="btn-action-masuk" ${hasMasuk ? 'disabled' : ''}>
                  <span>📥</span>
                  <span>Absen Masuk</span>
                </button>

                <!-- Box Nilai Jam & Persentase di Bawah Tombol -->
                <div class="absen-score-wrap">
                  <div class="absen-recorded-time ${hasMasuk ? 'active' : ''}">
                    ${state.todayStatus.masuk || '--:--'}
                  </div>
                  <div class="absen-percentage-box ${masukScore ? masukScore.badgeClass : ''}">
                    <span>${masukScore ? masukScore.icon : '⏳'}</span>
                    <span>${masukScore ? `${masukScore.percentage}%` : '0%'}</span>
                  </div>
                  <div class="absen-score-status-sub ${masukScore && masukScore.percentage === 100 ? 'ontime' : 'late'}">
                    ${masukScore ? masukScore.statusText : 'Menunggu Absen Masuk'}
                  </div>
                </div>
              </div>

              <!-- Kolom Absen Pulang -->
              <div class="absen-col">
                <button class="btn-absen-action btn-absen-pulang" id="btn-action-pulang" ${!hasMasuk || hasPulang ? 'disabled' : ''}>
                  <span>📤</span>
                  <span>Absen Pulang</span>
                </button>

                <!-- Box Nilai Jam & Persentase di Bawah Tombol -->
                <div class="absen-score-wrap">
                  <div class="absen-recorded-time ${hasPulang ? 'active' : ''}">
                    ${state.todayStatus.pulang || '--:--'}
                  </div>
                  <div class="absen-percentage-box ${pulangScore ? pulangScore.badgeClass : ''}">
                    <span>${pulangScore ? pulangScore.icon : '⏳'}</span>
                    <span>${pulangScore ? `${pulangScore.percentage}%` : '0%'}</span>
                  </div>
                  <div class="absen-score-status-sub ${pulangScore ? 'ontime' : ''}">
                    ${pulangScore ? pulangScore.statusText : (hasMasuk ? 'Siap Absen Pulang' : 'Belum Absen Masuk')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Shift Schedule Details Table (Dinamis dari Pengaturan) -->
          <div class="shift-details-card">
            <div class="shift-details-header">
              <span>Detail Shift Pegawai</span>
              <span class="shift-badge-name">${state.shiftSettings[state.activeShift].icon} ${state.shiftSettings[state.activeShift].nama}</span>
            </div>

            <!-- Pilih Shift Aktif -->
            <div class="shift-info-row" style="flex-direction: column; align-items: flex-start; gap: 6px;">
              <span class="shift-label">Shift Aktif Hari Ini</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${Object.entries(state.shiftSettings).map(([key, sh]) => `
                  <button class="sim-pill shift-selector-btn ${state.activeShift === key ? 'active' : ''}" data-shift="${key}" style="font-size: 11px; padding: 4px 10px;">
                    ${sh.icon} ${sh.nama}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Jam Absen Masuk (Dinamis) -->
            <div class="shift-info-row shift-info-row-time">
              <span class="shift-label">Jam Absen Masuk</span>
              <div class="shift-time-range-wrap">
                <div class="shift-time-box">${state.shiftSettings[state.activeShift].masukMulai}:00</div>
                <span class="shift-time-sep">—</span>
                <div class="shift-time-box">${state.shiftSettings[state.activeShift].masukSelesai}:59</div>
              </div>
            </div>

            <!-- Jam Absen Pulang (Dinamis) -->
            <div class="shift-info-row shift-info-row-time">
              <span class="shift-label">Jam Absen Pulang</span>
              <div class="shift-time-range-wrap">
                <div class="shift-time-box">${state.shiftSettings[state.activeShift].pulangMulai}:00</div>
                <span class="shift-time-sep">—</span>
                <div class="shift-time-box">${state.shiftSettings[state.activeShift].pulangSelesai}:59</div>
              </div>
            </div>

            <!-- Status Presensi -->
            <div class="shift-info-row">
              <span class="shift-label">Status Presensi</span>
              <span class="shift-val" style="color: ${hasPulang ? '#059669' : hasMasuk ? '#0284c7' : '#d97706'}; font-family: 'Plus Jakarta Sans', sans-serif;">
                ${hasPulang ? '✓ Selesai Dinas' : hasMasuk ? '● Sedang Dinas' : '○ Belum Masuk'}
              </span>
            </div>

            <div style="margin-top: 14px; background: #f8fafc; border-radius: 8px; padding: 10px; font-size: 11px; color: #64748b; line-height: 1.4;">
              <strong>ℹ️ Ketentuan Persentase:</strong><br>
              • Tepat waktu (sebelum ${state.shiftSettings[state.activeShift].masukSelesai}:59) bernilai <strong>100%</strong>.<br>
              • Melewati jam shift akan mengurangi persentase secara proporsional.<br>
              • <a href="#" id="link-ke-pengaturan" style="color:#0284c7; font-weight:700;">⚙️ Ubah Jam Absen</a>
            </div>
          </div>

          <!-- Column 3: SOP / Document Preview Panel matching Photo 1 right panel -->
          <div class="sop-document-card">
            <div class="sop-document-header">
              <span>📄 SOP & Cetak Data Pasien</span>
              <span style="font-size: 10px; color: #0284c7;">1 / 1</span>
            </div>
            <div class="sop-doc-preview-mockup">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                Cetak Foto dan Data Pasien (Labor & Rawat Jiwa)
              </div>
              <p style="margin-bottom: 8px;">
                1. Klik menu "Pemeriksaan Baru" pada instalasi terkait.<br>
                2. Pastikan pegawai yang bertugas telah melakukan presensi biometrik Face Recognition di area RSJ Tampan.<br>
                3. Nilai kehadiran akan otomatis terintegrasi dengan SIMRS RS Jiwa Tampan Provinsi Riau.
              </p>
              <div style="display: flex; gap: 6px; margin-top: 10px;">
                <button class="sim-pill" style="flex:1;">🖨️ Cetak</button>
                <button class="sim-pill" style="flex:1;">⬇️ Unduh PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize Leaflet Map
  function initLeafletMap() {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement || typeof L === 'undefined') return;

    if (leafletMapInstance) {
      leafletMapInstance.remove();
      leafletMapInstance = null;
    }

    try {
      leafletMapInstance = L.map('leaflet-map', {
        zoomControl: false,
        attributionControl: false,
      }).setView(RSJ_COORDS, 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(leafletMapInstance);

      // Pink Geofence Circle around RSJ Tampan matching Photo 1
      L.circle(RSJ_COORDS, {
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.28,
        radius: 90,
        weight: 2,
      }).addTo(leafletMapInstance);

      // Hospital Center Pin Marker matching Photo 1
      const hospitalIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="background:#0284c7;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(2,132,199,0.7);border:2px solid #fff;font-size:14px;">🏥</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker(RSJ_COORDS, { icon: hospitalIcon })
        .addTo(leafletMapInstance)
        .bindPopup('<b>Gedung Instalasi NAPZA</b><br>Rumah Sakit Jiwa Tampan')
        .openPopup();

      // User location marker in geofence
      const userLoc = [RSJ_COORDS[0] + 0.0001, RSJ_COORDS[1] + 0.00007];
      const userIcon = L.divIcon({
        className: 'user-pin-icon',
        html: `<div style="background:#10b981;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(16,185,129,0.8);border:2px solid #fff;font-size:11px;">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(userLoc, { icon: userIcon }).addTo(leafletMapInstance);

    } catch (e) {
      console.warn('Map initialization error:', e);
    }
  }

  // =========================================================================
  // 4. REKAP SCREEN
  // =========================================================================
  function renderRekapScreen() {
    return `
      <div class="rekap-screen">
        <div class="stats-grid-row">
          <div class="stat-mini-card">
            <div class="stat-mini-num">24</div>
            <div class="stat-mini-label">Total Hadir</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-num" style="color: #10b981;">100%</div>
            <div class="stat-mini-label">Disiplin Presensi</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-num" style="color: #f59e0b;">1</div>
            <div class="stat-mini-label">PDT Dinas</div>
          </div>
        </div>

        <div class="rekap-history-card">
          <div style="font-size: 14px; font-weight: 800; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span>Riwayat Kehadiran Pegawai</span>
            <span style="font-size: 11px; color: #0284c7; font-weight: 600;">September 2026</span>
          </div>

          <div class="rekap-list">
            ${state.history.map(item => `
              <div class="rekap-item-row">
                <div>
                  <div class="rekap-item-date">${item.date}</div>
                  <div class="rekap-item-shift">${item.shift} • <span style="color:#059669; font-weight:600;">${item.tilok}</span></div>
                </div>
                <div class="rekap-item-times">
                  <div class="rekap-time-in">In: ${item.masuk}</div>
                  <div class="rekap-time-out">Out: ${item.pulang}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. PDT (Presensi Diluar Tilok) SCREEN
  // =========================================================================
  function renderPdtScreen() {
    return `
      <div class="pdt-screen">
        <div class="form-card">
          <div class="form-card-title">🚗 Formulir Pengajuan Presensi Luar Tilok (PDT)</div>
          
          <form id="pdt-form">
            <div class="form-group">
              <label class="form-label">Nama Pegawai</label>
              <input type="text" class="input-field" value="${state.user ? state.user.name : 'Ners. Fitri Rahmadani'}" readonly style="background:#f1f5f9;">
            </div>

            <div class="form-group">
              <label class="form-label">Tanggal Pelaksanaan</label>
              <input type="date" class="input-field" value="2026-09-04" required>
            </div>

            <div class="form-group">
              <label class="form-label">Lokasi Tugas / Dinas Luar</label>
              <input type="text" class="input-field" placeholder="Contoh: Dinkes Prov. Riau / RSUD Arifin Achmad" required>
            </div>

            <div class="form-group">
              <label class="form-label">Alasan / Uraian Tugas</label>
              <textarea class="textarea-field" placeholder="Jelaskan keperluan dinas luar atau tugas operasional..."></textarea>
            </div>

            <button type="submit" class="btn-login-submit" style="background: var(--slate-gradient); margin-top: 10px;">
              <span>Kirim Pengajuan PDT</span>
              <span>📤</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 6. APPROVAL PDT SCREEN
  // =========================================================================
  function renderApprovalPdtScreen() {
    return `
      <div class="pdt-screen">
        <div class="form-card">
          <div class="form-card-title">✅ Daftar Verifikasi & Approval PDT</div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 14px;">Daftar pengajuan presensi di luar lokasi tilok yang membutuhkan persetujuan atasan.</p>

          ${state.pdtSubmissions.map((pdt) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 13px; color: #0f172a;">${pdt.nama}</strong>
                <span style="font-size: 10.5px; font-weight: 700; background: ${pdt.status === 'Pending' ? '#fef3c7' : '#ecfdf5'}; color: ${pdt.status === 'Pending' ? '#b45309' : '#047857'}; padding: 2px 8px; border-radius: 8px;">
                  ${pdt.status}
                </span>
              </div>
              <div style="font-size: 11.5px; color: #475569;">📅 ${pdt.tanggal} • 📍 ${pdt.lokasi}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Alasan: "${pdt.alasan}"</div>

              ${pdt.status === 'Pending' ? `
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                  <button class="btn-login-submit btn-approve-pdt" data-id="${pdt.id}" style="flex:1; height: 36px; font-size: 12px; background: var(--success-gradient);">
                    Setujui
                  </button>
                  <button class="btn-cancel-modal" style="height: 36px; font-size: 12px;">
                    Tolak
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 7. PEGAWAI SCREEN
  // =========================================================================
  function renderPegawaiScreen() {
    const user = state.user;
    return `
      <div class="pdt-screen">
        <div class="form-card" style="text-align: center;">
          <div class="sidebar-avatar" style="width: 70px; height: 70px; font-size: 24px; margin: 0 auto 12px;">
            ${user.avatar || 'AS'}
          </div>
          <h3 style="font-size: 16px; font-weight: 800;">${user.name}</h3>
          <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 2px;">${user.role}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">NIP: ${user.nip}</div>

          <div style="margin-top: 20px; text-align: left; border-top: 1px solid #f1f5f9; padding-top: 14px;">
            <div class="shift-info-row">
              <span class="shift-label">Instalasi / Unit</span>
              <span class="shift-val">${user.unit}</span>
            </div>
            <div class="shift-info-row">
              <span class="shift-label">Lokasi Tilok Wajib</span>
              <span class="shift-val">RSJ Tampan Pekanbaru</span>
            </div>
            <div class="shift-info-row">
              <span class="shift-label">Status Kepegawaian</span>
              <span class="shift-val" style="color: #059669;">Aktif / Terdaftar SIMRS</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 8. PENGATURAN JAM ABSEN SCREEN
  // =========================================================================
  function renderPengaturanScreen() {
    const shifts = state.shiftSettings;
    const activeShift = state.activeShift;

    const shiftCards = Object.entries(shifts).map(([key, sh]) => `
      <div class="pengaturan-shift-card ${activeShift === key ? 'active-shift' : ''}" id="pcard-${key}">
        <!-- Header Kartu Shift -->
        <div class="pengaturan-card-header" style="background: ${sh.warna}15; border-left: 4px solid ${sh.warna};">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">${sh.icon}</span>
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">${sh.nama}</div>
              <div style="font-size:10px; color:#64748b;">Klik untuk atur jam masuk &amp; pulang</div>
            </div>
          </div>
          <span class="pengaturan-shift-aktif-badge" style="background:${sh.warna}; display:${activeShift === key ? 'inline-flex' : 'none'};">Aktif</span>
        </div>

        <!-- Form Pengaturan Jam -->
        <div class="pengaturan-card-body">
          <!-- Jam Masuk -->
          <div class="pengaturan-time-group">
            <div class="pengaturan-time-label">🟢 Jam Absen Masuk (Tepat Waktu)</div>
            <div class="pengaturan-time-row">
              <div class="pengaturan-time-field">
                <label>Mulai Dari</label>
                <input type="time" class="pengaturan-time-input" id="input-${key}-masukMulai" value="${sh.masukMulai}" data-shift="${key}" data-field="masukMulai">
              </div>
              <span class="pengaturan-time-dash">—</span>
              <div class="pengaturan-time-field">
                <label>Batas Akhir (Tepat Waktu)</label>
                <input type="time" class="pengaturan-time-input" id="input-${key}-masukSelesai" value="${sh.masukSelesai}" data-shift="${key}" data-field="masukSelesai">
              </div>
            </div>
            <div class="pengaturan-info-note">Pegawai yang absen masuk setelah jam batas akan dihitung terlambat &amp; persentase berkurang.</div>
          </div>

          <!-- Jam Pulang -->
          <div class="pengaturan-time-group">
            <div class="pengaturan-time-label">🔴 Jam Absen Pulang (Shift Penuh)</div>
            <div class="pengaturan-time-row">
              <div class="pengaturan-time-field">
                <label>Mulai Bisa Pulang</label>
                <input type="time" class="pengaturan-time-input" id="input-${key}-pulangMulai" value="${sh.pulangMulai}" data-shift="${key}" data-field="pulangMulai">
              </div>
              <span class="pengaturan-time-dash">—</span>
              <div class="pengaturan-time-field">
                <label>Batas Akhir Pulang</label>
                <input type="time" class="pengaturan-time-input" id="input-${key}-pulangSelesai" value="${sh.pulangSelesai}" data-shift="${key}" data-field="pulangSelesai">
              </div>
            </div>
            <div class="pengaturan-info-note">Pegawai yang pulang sebelum jam mulai akan dihitung pulang cepat &amp; persentase berkurang.</div>
          </div>

          <!-- Ringkasan Shift -->
          <div class="pengaturan-summary-row">
            <span>📥 Masuk: <strong>${sh.masukMulai}</strong> s/d <strong>${sh.masukSelesai}</strong></span>
            <span>📤 Pulang: <strong>${sh.pulangMulai}</strong> s/d <strong>${sh.pulangSelesai}</strong></span>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="pdt-screen">
        <!-- Header Pengaturan -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0284c7 100%); border-radius: 16px; padding: 18px; margin-bottom: 16px; color: #fff;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="font-size:24px;">⚙️</span>
            <div>
              <div style="font-size:15px; font-weight:800;">Pengaturan Jam Absen</div>
              <div style="font-size:11px; opacity:0.85;">Atur jam masuk &amp; pulang untuk semua jenis shift di RSJ Tampan</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.15); border-radius:8px; padding:8px 12px; font-size:11px; margin-top:10px;">
            ⚡ Shift Aktif Saat Ini: <strong>${shifts[activeShift].icon} ${shifts[activeShift].nama}</strong>
            &nbsp;|&nbsp; Masuk s/d <strong>${shifts[activeShift].masukSelesai}</strong>
            &nbsp;|&nbsp; Pulang mulai <strong>${shifts[activeShift].pulangMulai}</strong>
          </div>
        </div>

        <!-- Pilih Shift Aktif -->
        <div style="background:#fff; border-radius:14px; padding:14px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">🎯 Shift Aktif Untuk Absen Hari Ini</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${Object.entries(shifts).map(([key, sh]) => `
              <button class="sim-pill shift-selector-btn ${activeShift === key ? 'active' : ''}" data-shift="${key}"
                style="border-left: 3px solid ${sh.warna}; font-size:12px; padding:6px 14px;">
                ${sh.icon} ${sh.nama}
              </button>
            `).join('')}
          </div>
          <div style="margin-top:10px; font-size:11px; color:#64748b;">
            Shift aktif menentukan jam referensi untuk kalkulasi persentase presensi seluruh pegawai.
          </div>
        </div>

        <!-- Kartu Per Shift -->
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${shiftCards}
        </div>

        <!-- Tombol Simpan -->
        <button class="btn-login-submit" id="btn-simpan-pengaturan" style="margin-top:18px; background: linear-gradient(135deg, #059669, #10b981);">
          <span>💾 Simpan Semua Pengaturan</span>
        </button>

        <!-- Tombol Reset -->
        <button class="btn-cancel-modal" id="btn-reset-pengaturan" style="width:100%; margin-top:10px; height:40px; font-size:13px;">
          🔄 Reset ke Default
        </button>
      </div>
    `;
  }

  // =========================================================================
  // 9. HIGH-TECH FACE RECOGNITION BIOMETRIC SCANNER MODAL
  // =========================================================================
  function renderCameraModal() {
    const action = state.cameraModal.actionType === 'masuk' ? 'Absen Masuk' : 'Absen Pulang';
    const effectiveTime = getEffectiveTimeForSubmission();
    const score = calculateAttendanceScore(state.cameraModal.actionType, effectiveTime);

    return `
      <div class="camera-modal-overlay">
        <div class="camera-modal-card">
          <!-- Header -->
          <div class="camera-modal-header">
            <div class="fr-header-badge">
              <div class="fr-pulse-dot"></div>
              <span>Face Recognition Biometrik (AI)</span>
            </div>
            <button class="sidebar-close-btn" id="btn-close-camera" style="color: #cbd5e1; background: rgba(255,255,255,0.1);">✕</button>
          </div>

          <!-- Video / Biometric Scanner Viewport -->
          <div class="camera-viewport-wrap">
            <video id="camera-video" autoplay playsinline muted></video>

            <!-- Fallback High-tech Simulated Face Graphic if camera blocked -->
            <div class="simulated-face-wrap" id="simulated-face-fallback" style="display: none;">
              <div class="simulated-avatar-graphic">
                <span>👤</span>
              </div>
              <div style="margin-top:10px; font-size:11px; color:#cbd5e1; text-align:center; z-index:5;">
                <span style="display:block; font-weight:700; color:#f59e0b; margin-bottom:4px;">Kamera Belum Terhubung</span>
                <span>Klik tombol di bawah setelah mengizinkan akses kamera:</span>
                <div style="margin-top:6px;">
                  <button id="btn-retry-camera" style="background:#0284c7; color:#fff; border:none; border-radius:6px; padding:6px 14px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                    🔄 Hubungkan Kamera Ulang
                  </button>
                </div>
              </div>
            </div>

            <!-- 4 Corner Target Brackets & Laser Line -->
            <div class="fr-scanner-box">
              <div class="fr-corner fr-corner-tl"></div>
              <div class="fr-corner fr-corner-tr"></div>
              <div class="fr-corner fr-corner-bl"></div>
              <div class="fr-corner fr-corner-br"></div>
              <div class="fr-laser-line"></div>

              <!-- SVG Facial Landmark Mesh -->
              <svg class="fr-mesh-svg" viewBox="0 0 190 220">
                <!-- Eye Landmarks -->
                <circle cx="65" cy="85" r="3.5" fill="#38bdf8" />
                <circle cx="125" cy="85" r="3.5" fill="#38bdf8" />
                <line x1="65" y1="85" x2="125" y2="85" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.7" />
                
                <!-- Nose Bridge -->
                <circle cx="95" cy="115" r="3" fill="#10b981" />
                <line x1="95" y1="85" x2="95" y2="115" stroke="#10b981" stroke-width="1" opacity="0.6" />
                
                <!-- Mouth Contour -->
                <circle cx="75" cy="148" r="2.5" fill="#38bdf8" />
                <circle cx="95" cy="152" r="3" fill="#38bdf8" />
                <circle cx="115" cy="148" r="2.5" fill="#38bdf8" />
                <path d="M75,148 Q95,156 115,148" fill="none" stroke="#38bdf8" stroke-width="1.2" opacity="0.8" />
                
                <!-- Jawline Ellipse Contour -->
                <ellipse cx="95" cy="115" rx="70" ry="85" fill="none" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5" stroke-dasharray="4,4" />
              </svg>
            </div>

            <!-- Status Pill at Top -->
            <div class="fr-status-pill-top">
              <div class="fr-tag-geofence">
                <span>📍</span> RSJ Tampan (Radius 14m)
              </div>
              <div class="fr-tag-live">AI LIVE 30 FPS</div>
            </div>

            <!-- Bottom Recognition HUD -->
            <div class="fr-result-hud">
              <div class="fr-result-row">
                <div class="fr-user-matched">
                  <span>👤</span> ${state.user ? state.user.name : 'Ners. Fitri Rahmadani'}
                </div>
                <div class="fr-match-rate">Kecocokan: 98.7%</div>
              </div>
              <div class="fr-result-row" style="color: #94a3b8; font-size: 10px;">
                <span>NIP: 19890412 201403 2 004</span>
                <span style="color: #10b981;">Liveness: Valid ✓</span>
              </div>
              <div class="fr-location-geo" style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; margin-top: 2px;">
                <span>⏰ Jam: ${effectiveTime} (${action})</span>
                <span style="font-weight: 800; color: ${score.percentage === 100 ? '#10b981' : '#f59e0b'};">
                  Skor: ${score.percentage}% (${score.statusText})
                </span>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="camera-modal-footer">
            <button class="btn-cancel-modal" id="btn-cancel-camera">Batal</button>
            <button class="btn-snap-capture" id="btn-snap-capture">
              <span>📸</span>
              <span>Ambil Foto & Verifikasi</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Camera Handler with Robust Webcam Support, Auto-Play & Fallbacks
  function initCameraStream() {
    const video = document.getElementById('camera-video');
    const fallback = document.getElementById('simulated-face-fallback');
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const attachStreamToVideo = (stream) => {
        state.cameraModal.stream = stream;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            video.onloadedmetadata = () => video.play().catch(e => console.warn('Video play error:', e));
          });
        }
        if (fallback) fallback.style.display = 'none';
      };

      // 1st Attempt: with facingMode 'user'
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      .then(attachStreamToVideo)
      .catch((err) => {
        console.warn('facingMode user failed, retrying with generic video constraint for PC/laptop webcam:', err);
        // 2nd Attempt: generic video: true (essential for desktop/laptop webcams like Lenovo FHD Webcam)
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(attachStreamToVideo)
          .catch((fallbackErr) => {
            console.warn('Webcam permission not granted or camera busy:', fallbackErr);
            if (fallback) fallback.style.display = 'flex';
            if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
              showToast('Izin kamera belum aktif. Silakan muat ulang (refresh) halaman atau izinkan di browser.');
            } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
              showToast('Kamera sedang digunakan aplikasi lain (Zoom/Teams/Kamera Windows).');
            }
          });
      });
    } else if (fallback) {
      fallback.style.display = 'flex';
    }
  }

  function openCamera(actionType) {
    state.cameraModal.open = true;
    state.cameraModal.actionType = actionType;
    renderApp();

    setTimeout(() => {
      initCameraStream();
    }, 120);
  }

  function closeCamera() {
    if (state.cameraModal.stream) {
      try {
        state.cameraModal.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      state.cameraModal.stream = null;
    }
    state.cameraModal.open = false;
    renderApp();
  }

  function commitAttendance() {
    const isMasuk = state.cameraModal.actionType === 'masuk';
    const effectiveTime = getEffectiveTimeForSubmission();
    const score = calculateAttendanceScore(state.cameraModal.actionType, effectiveTime);

    if (isMasuk) {
      state.todayStatus.masuk = effectiveTime;
      state.todayStatus.masukScore = score;
      state.todayStatus.status = 'Hadir';
      showToast(`Face Recognition Berhasil! Absen Masuk: ${effectiveTime} (${score.statusText})`);
    } else {
      state.todayStatus.pulang = effectiveTime;
      state.todayStatus.pulangScore = score;
      state.todayStatus.status = 'Selesai Dinas';
      showToast(`Face Recognition Berhasil! Absen Pulang: ${effectiveTime} (${score.statusText})`);
    }

    triggerCelebration();
    closeCamera();
  }

  // =========================================================================
  // GLOBAL EVENT BINDING
  // =========================================================================
  function attachGlobalEvents() {
    // Menu Button Click -> Open Sidebar
    const menuBtn = document.getElementById('btn-toggle-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => toggleSidebar(true));
    }

    // Close Sidebar Buttons & Backdrop
    const closeBtn = document.getElementById('btn-close-sidebar');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => toggleSidebar(false));
    }

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => toggleSidebar(false));
    }

    // Sidebar Navigation Links
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const targetScreen = item.dataset.nav;
        const targetMode = item.dataset.mode || 'dording';
        if (targetScreen) {
          navigateTo(targetScreen, { mode: targetMode });
        }
      });
    });

    // Kendala Teknis button
    const btnKendala = document.getElementById('btn-menu-kendala');
    if (btnKendala) {
      btnKendala.addEventListener('click', () => {
        showToast('Layanan Pengaduan Kendala Teknis SIMRS Siap Melayani (Ext: 104)');
      });
    }

    // Sidebar Logout
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        state.user = null;
        showToast('Anda telah keluar dari aplikasi.');
        navigateTo('login');
      });
    }

    // Dashboard Action Cards (Matching 5 Cards)
    const cardPresensi = document.getElementById('card-action-presensi');
    if (cardPresensi) {
      cardPresensi.addEventListener('click', () => navigateTo('presensi', { mode: 'sekarang' }));
    }

    const cardRekap = document.getElementById('card-action-rekap');
    if (cardRekap) {
      cardRekap.addEventListener('click', () => navigateTo('rekap'));
    }

    const cardPdt = document.getElementById('card-action-pdt');
    if (cardPdt) {
      cardPdt.addEventListener('click', () => navigateTo('pdt'));
    }

    const cardApprovePdt = document.getElementById('card-action-approve-pdt');
    if (cardApprovePdt) {
      cardApprovePdt.addEventListener('click', () => navigateTo('approval_pdt'));
    }

    const cardDording = document.getElementById('card-action-dording');
    if (cardDording) {
      cardDording.addEventListener('click', () => navigateTo('presensi', { mode: 'dording' }));
    }

    // Presensi Screen Actions
    const btnMasuk = document.getElementById('btn-action-masuk');
    if (btnMasuk) {
      btnMasuk.addEventListener('click', () => openCamera('masuk'));
    }

    const btnPulang = document.getElementById('btn-action-pulang');
    if (btnPulang) {
      btnPulang.addEventListener('click', () => openCamera('pulang'));
    }

    const btnRefreshGps = document.getElementById('btn-refresh-gps');
    if (btnRefreshGps) {
      btnRefreshGps.addEventListener('click', () => {
        showToast('GPS Terkalibrasi: Berada di Area RSJ Tampan (Radius 14m)');
        initLeafletMap();
      });
    }

    // Simulation Test Pills
    const simPills = document.querySelectorAll('.sim-pill[data-preset]');
    simPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        state.simPreset = pill.dataset.preset;
        renderApp();
      });
    });

    // Camera Modal Actions
    const btnCancelCam = document.getElementById('btn-cancel-camera');
    if (btnCancelCam) {
      btnCancelCam.addEventListener('click', closeCamera);
    }

    const btnCloseCam = document.getElementById('btn-close-camera');
    if (btnCloseCam) {
      btnCloseCam.addEventListener('click', closeCamera);
    }

    const btnSnap = document.getElementById('btn-snap-capture');
    if (btnSnap) {
      btnSnap.addEventListener('click', commitAttendance);
    }

    const btnRetryCam = document.getElementById('btn-retry-camera');
    if (btnRetryCam) {
      btnRetryCam.addEventListener('click', () => {
        showToast('Menghubungkan ulang ke kamera...');
        initCameraStream();
      });
    }

    // PDT Form Submit
    const pdtForm = document.getElementById('pdt-form');
    if (pdtForm) {
      pdtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Pengajuan PDT berhasil dikirim dan menunggu approval!');
        navigateTo('dashboard');
      });
    }

    // PDT Approval button
    const approveBtns = document.querySelectorAll('.btn-approve-pdt');
    approveBtns.forEach((b) => {
      b.addEventListener('click', () => {
        showToast('Pengajuan PDT telah disetujui!');
        navigateTo('dashboard');
      });
    });

    // ---- PENGATURAN JAM ABSEN EVENTS ----

    // Shift Selector Buttons (di halaman presensi & pengaturan)
    const shiftSelectorBtns = document.querySelectorAll('.shift-selector-btn');
    shiftSelectorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeShift = btn.dataset.shift;
        state.todayStatus.masuk = null;
        state.todayStatus.pulang = null;
        state.todayStatus.masukScore = null;
        state.todayStatus.pulangScore = null;
        renderApp();
        showToast(`Shift aktif: ${state.shiftSettings[state.activeShift].icon} ${state.shiftSettings[state.activeShift].nama}`);
      });
    });

    // Input perubahan waktu langsung update state
    const timeInputs = document.querySelectorAll('.pengaturan-time-input');
    timeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const shiftKey = input.dataset.shift;
        const field = input.dataset.field;
        if (shiftKey && field && state.shiftSettings[shiftKey]) {
          state.shiftSettings[shiftKey][field] = input.value;
          // Update ringkasan shift di kartu secara live
          const card = document.getElementById(`pcard-${shiftKey}`);
          if (card) {
            const summary = card.querySelector('.pengaturan-summary-row');
            if (summary) {
              const sh = state.shiftSettings[shiftKey];
              summary.innerHTML = `
                <span>📥 Masuk: <strong>${sh.masukMulai}</strong> s/d <strong>${sh.masukSelesai}</strong></span>
                <span>📤 Pulang: <strong>${sh.pulangMulai}</strong> s/d <strong>${sh.pulangSelesai}</strong></span>
              `;
            }
          }
        }
      });
    });

    // Tombol Simpan Pengaturan
    const btnSimpan = document.getElementById('btn-simpan-pengaturan');
    if (btnSimpan) {
      btnSimpan.addEventListener('click', () => {
        // Baca semua nilai input terbaru
        timeInputs.forEach((input) => {
          const shiftKey = input.dataset.shift;
          const field = input.dataset.field;
          if (shiftKey && field) {
            state.shiftSettings[shiftKey][field] = input.value;
          }
        });
        const sh = state.shiftSettings[state.activeShift];
        showToast(`✅ Pengaturan tersimpan! Shift aktif: ${sh.icon} ${sh.nama} | Masuk s/d ${sh.masukSelesai} | Pulang mulai ${sh.pulangMulai}`);
        setTimeout(() => navigateTo('presensi', { mode: state.activeShift === 'dording' ? 'dording' : 'sekarang' }), 1200);
      });
    }

    // Tombol Reset ke Default
    const btnReset = document.getElementById('btn-reset-pengaturan');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.shiftSettings = {
          pagi:    { nama:'Shift Pagi',    icon:'🌅', masukMulai:'06:00', masukSelesai:'07:00', pulangMulai:'14:00', pulangSelesai:'15:00', warna:'#10b981' },
          sore:    { nama:'Shift Sore',    icon:'🌇', masukMulai:'13:00', masukSelesai:'14:00', pulangMulai:'20:00', pulangSelesai:'22:00', warna:'#0284c7' },
          malam:   { nama:'Shift Malam',   icon:'🌙', masukMulai:'20:00', masukSelesai:'21:00', pulangMulai:'07:00', pulangSelesai:'08:00', warna:'#7c3aed' },
          dording: { nama:'Shift Dording', icon:'⏱️', masukMulai:'13:00', masukSelesai:'14:00', pulangMulai:'07:00', pulangSelesai:'08:00', warna:'#d97706' },
        };
        state.activeShift = 'sore';
        showToast('🔄 Pengaturan direset ke nilai default.');
        renderApp();
      });
    }

    // Link ke pengaturan dari halaman presensi
    const linkPengaturan = document.getElementById('link-ke-pengaturan');
    if (linkPengaturan) {
      linkPengaturan.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('pengaturan');
      });
    }
  }

  // Run app on DOM Load
  document.addEventListener('DOMContentLoaded', init);
})();
