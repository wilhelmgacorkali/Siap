// Asset definitions and data URIs for RSJ Tampan branding
export const RSJ_BUILDING_IMAGE = require('../../assets/rsj_building.jpg');

// Helper to convert raw SVG to reliable data URI across all web & native platforms
const toSvgDataUri = (svg) => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    try {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg.trim())))}`;
    } catch (e) {
      // fallback
    }
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
};

// 1. Official RSJ Tampan Symbol / Emblem (Square 160x160 - Transparent)
const rawSvgSymbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <g id="leaf-and-figures" transform="translate(6, 10)">
    <path d="M75,130 C45,130 18,110 8,85 C-2,60 10,28 38,15 C65,2 105,10 125,32 C115,58 98,95 75,130 Z" fill="#2e7d32" />
    <path d="M125,32 C145,55 142,95 120,120 C98,142 65,145 42,138 C60,135 90,110 110,75 C118,60 122,45 125,32 Z" fill="#43a047" />
    <path d="M42,138 C65,115 95,75 125,32" fill="none" stroke="#e8f5e9" stroke-width="3" stroke-linecap="round" opacity="0.85" />
    <path d="M72,105 C55,95 42,90 32,92" fill="none" stroke="#e8f5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />
    <path d="M92,75 C75,65 58,58 48,60" fill="none" stroke="#e8f5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />
    <path d="M108,52 C95,45 82,38 72,40" fill="none" stroke="#e8f5e9" stroke-width="2" stroke-linecap="round" opacity="0.75" />
    <g id="child-figure">
      <circle cx="62" cy="72" r="13" fill="#e53935" stroke="#ffffff" stroke-width="3.5" />
      <path d="M62,88 C52,88 44,95 38,104 C33,111 31,108 26,98 C24,93 21,95 22,99 C26,114 34,122 46,115 C46,120 48,136 55,138 C58,139 66,139 69,138 C76,136 78,120 78,115 C90,122 98,114 102,99 C103,95 100,93 98,98 C93,108 91,111 86,104 C80,95 72,88 62,88 Z" fill="#e53935" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
    </g>
    <g id="adult-figure">
      <circle cx="106" cy="58" r="15" fill="#fbc02d" stroke="#ffffff" stroke-width="3.5" />
      <path d="M106,75 C94,75 86,84 80,94 C74,103 71,99 66,88 C64,83 61,85 62,89 C67,106 76,116 88,108 C88,114 91,136 98,139 C102,140 110,140 114,139 C121,136 124,114 124,108 C136,116 145,106 150,89 C151,85 148,83 146,88 C141,99 138,103 132,94 C126,84 118,75 106,75 Z" fill="#fbc02d" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// 2. Full Official RSJ Tampan Logo (Horizontal 520x160 - Transparent)
const rawSvgOfficial = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160" width="100%" height="100%">
  <g id="leaf-and-figures" transform="translate(10, 15)">
    <path d="M75,130 C45,130 18,110 8,85 C-2,60 10,28 38,15 C65,2 105,10 125,32 C115,58 98,95 75,130 Z" fill="#2e7d32" />
    <path d="M125,32 C145,55 142,95 120,120 C98,142 65,145 42,138 C60,135 90,110 110,75 C118,60 122,45 125,32 Z" fill="#43a047" />
    <path d="M42,138 C65,115 95,75 125,32" fill="none" stroke="#e8f5e9" stroke-width="3" stroke-linecap="round" opacity="0.85" />
    <path d="M72,105 C55,95 42,90 32,92" fill="none" stroke="#e8f5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />
    <path d="M92,75 C75,65 58,58 48,60" fill="none" stroke="#e8f5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />
    <path d="M108,52 C95,45 82,38 72,40" fill="none" stroke="#e8f5e9" stroke-width="2" stroke-linecap="round" opacity="0.75" />
    <g id="child-figure">
      <circle cx="62" cy="72" r="13" fill="#e53935" stroke="#ffffff" stroke-width="3.5" />
      <path d="M62,88 C52,88 44,95 38,104 C33,111 31,108 26,98 C24,93 21,95 22,99 C26,114 34,122 46,115 C46,120 48,136 55,138 C58,139 66,139 69,138 C76,136 78,120 78,115 C90,122 98,114 102,99 C103,95 100,93 98,98 C93,108 91,111 86,104 C80,95 72,88 62,88 Z" fill="#e53935" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
    </g>
    <g id="adult-figure">
      <circle cx="106" cy="58" r="15" fill="#fbc02d" stroke="#ffffff" stroke-width="3.5" />
      <path d="M106,75 C94,75 86,84 80,94 C74,103 71,99 66,88 C64,83 61,85 62,89 C67,106 76,116 88,108 C88,114 91,136 98,139 C102,140 110,140 114,139 C121,136 124,114 124,108 C136,116 145,106 150,89 C151,85 148,83 146,88 C141,99 138,103 132,94 C126,84 118,75 106,75 Z" fill="#fbc02d" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
    </g>
  </g>
  <g id="brand-text" transform="translate(180, 22)">
    <text x="0" y="52" font-family="'Plus Jakarta Sans', 'Arial Rounded MT Bold', 'Montserrat', 'Trebuchet MS', sans-serif" font-size="44" font-weight="900" letter-spacing="0.5" fill="#2e7d32">RSJ TAMPAN</text>
    <text x="0" y="104" font-family="'Plus Jakarta Sans', 'Arial Rounded MT Bold', 'Montserrat', 'Trebuchet MS', sans-serif" font-size="42" font-weight="900" letter-spacing="0.8" fill="#2e7d32">PROVINSI RIAU</text>
  </g>
</svg>`;

// Export both standard symbol URI and full official transparent logo URI
export const RSJ_LOGO_URI = toSvgDataUri(rawSvgSymbol);
export const RSJ_OFFICIAL_LOGO_URI = toSvgDataUri(rawSvgOfficial);
