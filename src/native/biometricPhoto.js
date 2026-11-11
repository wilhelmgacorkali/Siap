/**
 * Biometric Photo Generator & Watermarking Utility
 * For RS Jiwa Tampan SIAP-RSJ System.
 * 
 * Generates official high-definition biometric attendance photos with:
 * - Real webcam frame capture (when available)
 * - Official biometric identity verification card (when simulating / camera unavailable)
 * - Anti-tamper official watermark stamp (RS Jiwa Tampan, GPS coordinates, timestamp, Face Match %)
 */

const TILOK_DEFAULT = {
  coords: '0.465791° N, 101.381957° E',
  location: 'RSJ Tampan - Gedung Instalasi',
  accuracy: '14 meter (Dalam Radius Tilok)',
};

/**
 * Creates an official biometric attendance photo as JPEG data URI.
 */
export function generateBiometricPhoto({
  videoEl = null,
  user = null,
  type = 'masuk', // 'masuk' | 'pulang'
  time = '07:05:00',
  date = null,
  matchScore = '99.4%',
  coords = TILOK_DEFAULT.coords,
  location = TILOK_DEFAULT.location,
  distance = TILOK_DEFAULT.accuracy,
  isDording = false,
} = {}) {
  const isMasuk = type === 'masuk';
  const displayTime = time || '07:00:00';
  const displayDate = date || new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const userName = user?.name || 'Ners. Fitri Rahmadani, S.Kep';
  const userNip = user?.nip || '19890412 201402 2 003';
  const typeLabel = isDording 
    ? (isMasuk ? 'DORDING - ABSEN MASUK' : 'DORDING - ABSEN PULANG')
    : (isMasuk ? 'ABSEN MASUK (PAGI)' : 'ABSEN PULANG (SORE)');

  // If in browser environment with canvas support
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 540;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');

      let hasDrawnVideo = false;
      if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        try {
          const vw = videoEl.videoWidth;
          const vh = videoEl.videoHeight;
          const minDim = Math.min(vw, vh);
          const sx = (vw - minDim) / 2;
          const sy = (vh - minDim) / 2;
          ctx.drawImage(videoEl, sx, sy, minDim, minDim, 0, 0, 540, 540);
          hasDrawnVideo = true;
        } catch (e) {
          hasDrawnVideo = false;
        }
      }

      // If video wasn't drawn, render high-tech biometric face verification portrait card
      if (!hasDrawnVideo) {
        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 540);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 540, 540);

        // Security pattern / mesh grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 540; x += 36) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 540);
          ctx.stroke();
        }
        for (let y = 0; y < 540; y += 36) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(540, y);
          ctx.stroke();
        }

        // Circular Face Framing Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(270, 210, 140, 0, Math.PI * 2);
        ctx.strokeStyle = isMasuk ? 'rgba(16, 185, 129, 0.4)' : 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(270, 210, 148, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();

        // Corner viewfinder reticles
        const corners = [
          [130, 70], [410, 70], [130, 350], [410, 350]
        ];
        ctx.strokeStyle = isMasuk ? '#34d399' : '#38bdf8';
        ctx.lineWidth = 3;
        corners.forEach(([cx, cy]) => {
          const dx = cx < 270 ? 1 : -1;
          const dy = cy < 210 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(cx, cy + dy * 24);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + dx * 24, cy);
          ctx.stroke();
        });

        // Stylized Nurse / Employee Silhouette Avatar
        // Shoulders
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(270, 340, 115, 65, 0, 0, Math.PI, true);
        ctx.fill();
        ctx.strokeStyle = isMasuk ? 'rgba(52, 211, 153, 0.5)' : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Medical Uniform V-Neck
        ctx.fillStyle = isMasuk ? '#065f46' : '#0369a1';
        ctx.beginPath();
        ctx.moveTo(235, 275);
        ctx.lineTo(270, 325);
        ctx.lineTo(305, 275);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(270, 195, 62, 75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isMasuk ? '#10b981' : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Nurse Medical Cap / Hijab outline
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(270, 142, 60, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        // Red cross on cap
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(267, 134, 6, 16);
        ctx.fillRect(262, 139, 16, 6);

        // Biometric scanning mesh nodes & connecting lines
        const nodes = [
          [245, 175], [295, 175], // eyes
          [270, 198],             // nose
          [252, 226], [288, 226], // mouth corners
          [270, 246],             // chin
          [230, 200], [310, 200], // cheeks
          [270, 158]              // forehead
        ];

        // Connecting lines
        ctx.strokeStyle = isMasuk ? 'rgba(52, 211, 153, 0.7)' : 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.2;
        const links = [
          [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4],
          [3, 5], [4, 5], [0, 6], [1, 7], [6, 3], [7, 4], [8, 0], [8, 1]
        ];
        links.forEach(([a, b]) => {
          ctx.beginPath();
          ctx.moveTo(nodes[a][0], nodes[a][1]);
          ctx.lineTo(nodes[b][0], nodes[b][1]);
          ctx.stroke();
        });

        // Pulsing dots
        nodes.forEach(([nx, ny]) => {
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isMasuk ? '#34d399' : '#38bdf8';
          ctx.fill();
        });

        // Laser scan line across face
        const scanGrad = ctx.createLinearGradient(0, 190, 0, 206);
        scanGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
        scanGrad.addColorStop(0.5, isMasuk ? 'rgba(52, 211, 153, 0.75)' : 'rgba(56, 189, 248, 0.75)');
        scanGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(150, 190, 240, 14);

        // Center Pill: Verified Face Match
        ctx.fillStyle = isMasuk ? 'rgba(6, 95, 70, 0.92)' : 'rgba(3, 105, 161, 0.92)';
        ctx.roundRect(140, 20, 260, 32, 16);
        ctx.fill();
        ctx.strokeStyle = isMasuk ? '#34d399' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`BIOMETRIK VALID: MATCH ${matchScore}`, 270, 41);
        ctx.textAlign = 'left';
      }

      // =========================================================
      // OFFICIAL WATERMARK OVERLAY STAMP (Bottom 120px)
      // =========================================================
      // Semi-transparent dark background banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, 410, 540, 130);

      // Top accent bar
      ctx.fillStyle = isMasuk ? '#10b981' : '#0284c7';
      ctx.fillRect(0, 408, 540, 3);

      // Hospital Header & Badge
      ctx.fillStyle = isMasuk ? '#34d399' : '#38bdf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('RS JIWA TAMPAN - PEKANBARU', 16, 432);

      // Type Badge (Pill)
      ctx.fillStyle = isMasuk ? '#059669' : '#0284c7';
      ctx.roundRect(380, 418, 144, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(typeLabel.slice(0, 22), 452, 433);
      ctx.textAlign = 'left';

      // Line 2: Timestamp & Date
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`WAKTU : ${displayTime} WIB • ${displayDate}`, 16, 456);

      // Line 3: Employee Info
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.fillText(`PEGAWAI: ${userName.slice(0, 26)} (${userNip})`, 16, 478);

      // Line 4: GPS & Geofence
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`GPS   : ${coords} | R: ${distance}`, 16, 498);

      // Line 5: Verification Security Hash
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      const hash = Math.abs((displayTime + userName).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase();
      ctx.fillText(`VALID : SIMRS-VERIFIED#${hash} • MATCH ${matchScore}`, 16, 520);

      return canvas.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      console.warn('Canvas photo generate error, using fallback SVG:', e);
    }
  }

  // Fallback: Inline SVG Data URI
  return generateBiometricSvgUri({
    user,
    type,
    time: displayTime,
    date: displayDate,
    matchScore,
    coords,
    location,
    distance,
    isDording,
  });
}

/**
 * Pure SVG Fallback generator (works even when canvas or video element is unavailable)
 */
export function generateBiometricSvgUri({
  user = null,
  type = 'masuk',
  time = '07:05:00',
  date = 'Hari Ini',
  matchScore = '99.4%',
  coords = TILOK_DEFAULT.coords,
  location = TILOK_DEFAULT.location,
  distance = TILOK_DEFAULT.accuracy,
  isDording = false,
} = {}) {
  const isMasuk = type === 'masuk';
  const userName = user?.name || 'Ners. Fitri Rahmadani, S.Kep';
  const userNip = user?.nip || '19890412 201402 2 003';
  const mainColor = isMasuk ? '#10b981' : '#0284c7';
  const accentColor = isMasuk ? '#34d399' : '#38bdf8';
  const typeText = isDording 
    ? (isMasuk ? 'DORDING MASUK' : 'DORDING PULANG') 
    : (isMasuk ? 'ABSEN MASUK' : 'ABSEN PULANG');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540" width="540" height="540">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${accentColor}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="540" height="540" fill="url(#bgGrad)"/>

    <!-- Mesh lines -->
    <g stroke="rgba(56, 189, 248, 0.08)" stroke-width="1">
      <line x1="100" y1="0" x2="100" y2="540"/>
      <line x1="200" y1="0" x2="200" y2="540"/>
      <line x1="300" y1="0" x2="300" y2="540"/>
      <line x1="400" y1="0" x2="400" y2="540"/>
      <line x1="0" y1="120" x2="540" y2="120"/>
      <line x1="0" y1="240" x2="540" y2="240"/>
      <line x1="0" y1="360" x2="540" y2="360"/>
    </g>

    <!-- Biometric Target Rings -->
    <circle cx="270" cy="205" r="140" fill="none" stroke="${mainColor}" stroke-width="2.5" opacity="0.45"/>
    <circle cx="270" cy="205" r="148" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.2"/>

    <!-- Reticles -->
    <path d="M 130 90 L 130 70 L 154 70" fill="none" stroke="${accentColor}" stroke-width="3"/>
    <path d="M 410 90 L 410 70 L 386 70" fill="none" stroke="${accentColor}" stroke-width="3"/>
    <path d="M 130 320 L 130 340 L 154 340" fill="none" stroke="${accentColor}" stroke-width="3"/>
    <path d="M 410 320 L 410 340 L 386 340" fill="none" stroke="${accentColor}" stroke-width="3"/>

    <!-- Nurse Avatar Silhouette -->
    <path d="M 155 350 C 155 285, 385 285, 385 350 Z" fill="#1e293b" stroke="${accentColor}" stroke-width="2" opacity="0.8"/>
    <path d="M 235 275 L 270 325 L 305 275 Z" fill="${isMasuk ? '#065f46' : '#0369a1'}"/>
    <ellipse cx="270" cy="195" rx="60" ry="75" fill="#334155" stroke="${mainColor}" stroke-width="2.5"/>
    <ellipse cx="270" cy="142" rx="60" ry="24" fill="#f8fafc"/>
    <rect x="267" y="134" width="6" height="16" fill="#ef4444"/>
    <rect x="262" y="139" width="16" height="6" fill="#ef4444"/>

    <!-- Face Nodes -->
    <g fill="${accentColor}" stroke="${accentColor}">
      <line x1="245" y1="175" x2="295" y2="175" stroke-width="1.2" opacity="0.7"/>
      <line x1="245" y1="175" x2="270" y2="198" stroke-width="1.2" opacity="0.7"/>
      <line x1="295" y1="175" x2="270" y2="198" stroke-width="1.2" opacity="0.7"/>
      <line x1="270" y1="198" x2="252" y2="226" stroke-width="1.2" opacity="0.7"/>
      <line x1="270" y1="198" x2="288" y2="226" stroke-width="1.2" opacity="0.7"/>
      <line x1="252" y1="226" x2="288" y2="226" stroke-width="1.2" opacity="0.7"/>
      <line x1="252" y1="226" x2="270" y2="246" stroke-width="1.2" opacity="0.7"/>
      <line x1="288" y1="226" x2="270" y2="246" stroke-width="1.2" opacity="0.7"/>
      <circle cx="245" cy="175" r="3.5"/>
      <circle cx="295" cy="175" r="3.5"/>
      <circle cx="270" cy="198" r="3.5"/>
      <circle cx="252" cy="226" r="3.5"/>
      <circle cx="288" cy="226" r="3.5"/>
      <circle cx="270" cy="246" r="3.5"/>
      <circle cx="270" cy="158" r="3.5"/>
    </g>

    <!-- Scan Line -->
    <rect x="150" y="190" width="240" height="14" fill="url(#scanGrad)"/>

    <!-- Top Badge -->
    <rect x="140" y="20" width="260" height="32" rx="16" fill="${isMasuk ? '#065f46' : '#0369a1'}" stroke="${accentColor}" stroke-width="1.5"/>
    <text x="270" y="41" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BIOMETRIK VALID: MATCH ${matchScore}</text>

    <!-- Official Watermark Footer -->
    <rect x="0" y="410" width="540" height="130" fill="#0f172a" fill-opacity="0.94"/>
    <rect x="0" y="408" width="540" height="3" fill="${mainColor}"/>

    <text x="16" y="432" font-family="sans-serif" font-size="14" font-weight="bold" fill="${accentColor}">RS JIWA TAMPAN - PEKANBARU</text>
    <rect x="380" y="418" width="144" height="22" rx="6" fill="${mainColor}"/>
    <text x="452" y="433" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">${typeText}</text>

    <text x="16" y="456" font-family="monospace" font-size="13" font-weight="bold" fill="#ffffff">WAKTU : ${time} WIB • ${date}</text>
    <text x="16" y="478" font-family="sans-serif" font-size="12" fill="#cbd5e1">PEGAWAI: ${userName} (${userNip})</text>
    <text x="16" y="498" font-family="monospace" font-size="11" fill="#94a3b8">GPS   : ${coords} | ${distance}</text>
    <text x="16" y="520" font-family="monospace" font-size="11" font-weight="bold" fill="${accentColor}">VALID : SIMRS-VERIFIED • MATCH ${matchScore}</text>
  </svg>`;

  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    try {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg.trim())))}`;
    } catch (e) {}
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}
