// Preset Pustaka Ilustrasi & Animasi Kebencanaan Sigumi
// Format SVG dioptimasi dengan animasi CSS inline murni sehingga kompatibel di web & mobile

const createSvgDataUri = (svgString) => {
  const sanitized = svgString.replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;")
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitized.trim())}`
}

export const PRESET_ILLUSTRATIONS = [
  {
    id: "erupsi-merapi",
    title: "Erupsi & Awan Panas",
    category: "Erupsi",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Visualisasi kawah gunung berapi aktif dengan kepulan asap dan erupsi magma.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="60%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#31102b" />
          </linearGradient>
          <linearGradient id="volcanoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
          <linearGradient id="lavaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffedd5" />
            <stop offset="30%" stop-color="#f97316" />
            <stop offset="100%" stop-color="#dc2626" />
          </linearGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f97316" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#ef4444" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0" />
          </radialGradient>
          <style>
            @keyframes smokeRise {
              0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
              50% { transform: translateY(-30px) scale(1.1); opacity: 0.5; }
              100% { transform: translateY(-70px) scale(1.4); opacity: 0; }
            }
            @keyframes lavaPulse {
              0%, 100% { filter: drop-shadow(0 0 15px #f97316); opacity: 0.9; }
              50% { filter: drop-shadow(0 0 35px #ef4444); opacity: 1; }
            }
            @keyframes sparkFloat {
              0% { transform: translate(0, 0); opacity: 1; }
              100% { transform: translate(var(--dx, 20px), -80px); opacity: 0; }
            }
            .smoke-1 { animation: smokeRise 4s infinite ease-out; transform-origin: 400px 180px; }
            .smoke-2 { animation: smokeRise 3.5s infinite 1.2s ease-out; transform-origin: 390px 180px; }
            .smoke-3 { animation: smokeRise 4.2s infinite 2.4s ease-out; transform-origin: 415px 180px; }
            .lava { animation: lavaPulse 2s infinite ease-in-out; }
            .spark { animation: sparkFloat 2s infinite linear; }
          </style>
        </defs>

        <!-- Sky -->
        <rect width="800" height="450" fill="url(#skyGrad)" />

        <!-- Distant Stars -->
        <circle cx="120" cy="60" r="1.5" fill="#ffffff" opacity="0.6" />
        <circle cx="280" cy="40" r="1" fill="#ffffff" opacity="0.5" />
        <circle cx="680" cy="80" r="1.5" fill="#ffffff" opacity="0.7" />
        <circle cx="530" cy="50" r="1" fill="#ffffff" opacity="0.4" />

        <!-- Eruption Smoke Clouds -->
        <g>
          <ellipse class="smoke-1" cx="400" cy="150" rx="45" ry="35" fill="#475569" opacity="0.6" />
          <ellipse class="smoke-2" cx="380" cy="140" rx="55" ry="40" fill="#334155" opacity="0.7" />
          <ellipse class="smoke-3" cx="420" cy="135" rx="50" ry="38" fill="#1e293b" opacity="0.8" />
          <circle class="smoke-1" cx="360" cy="110" r="45" fill="#64748b" opacity="0.5" />
          <circle class="smoke-2" cx="440" cy="100" r="40" fill="#475569" opacity="0.5" />
        </g>

        <!-- Lava Glow at Summit -->
        <ellipse cx="400" cy="185" rx="90" ry="40" fill="url(#glowGrad)" class="lava" />

        <!-- Mountain Volcano -->
        <path d="M 120 450 L 375 190 L 425 190 L 680 450 Z" fill="url(#volcanoGrad)" />
        <path d="M 260 450 L 390 190 L 415 190 L 520 450 Z" fill="#090d16" opacity="0.4" />

        <!-- Summit Crater & Lava Flow -->
        <ellipse cx="400" cy="190" rx="25" ry="8" fill="#f97316" class="lava" />
        <path d="M 390 190 Q 380 230 365 270 Q 355 310 370 340 Q 380 370 375 450" stroke="#f97316" stroke-width="4" fill="none" opacity="0.85" stroke-linecap="round" />
        <path d="M 405 190 Q 415 220 430 260 Q 445 300 440 360 L 445 450" stroke="#ef4444" stroke-width="3" fill="none" opacity="0.8" stroke-linecap="round" />
        <path d="M 400 190 Q 395 240 405 280 L 400 350" stroke="#ffedd5" stroke-width="2" fill="none" opacity="0.9" />

        <!-- Foreground Hill Ridge -->
        <path d="M 0 420 Q 200 380 400 410 Q 600 440 800 400 L 800 450 L 0 450 Z" fill="#020617" />

        <!-- Text Title Overlay -->
        <rect x="25" y="25" width="170" height="34" rx="17" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(249, 115, 22, 0.4)" stroke-width="1" />
        <circle cx="42" cy="42" r="5" fill="#f97316" class="lava" />
        <text x="56" y="47" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#f8fafc">Erupsi Vulkanik</text>
      </svg>
    `),
  },
  {
    id: "jalur-evakuasi",
    title: "Jalur & Rute Evakuasi",
    category: "Evakuasi",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Tanda arah penyelamatan diri darurat menuju zona hijau aman bencana.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b" />
            <stop offset="50%" stop-color="#022c22" />
            <stop offset="100%" stop-color="#041f18" />
          </linearGradient>
          <style>
            @keyframes pulseArrow {
              0%, 100% { transform: translateX(0); opacity: 0.6; }
              50% { transform: translateX(12px); opacity: 1; }
            }
            @keyframes runPerson {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
            .arrow-1 { animation: pulseArrow 1.5s infinite ease-in-out; }
            .arrow-2 { animation: pulseArrow 1.5s infinite 0.3s ease-in-out; }
            .arrow-3 { animation: pulseArrow 1.5s infinite 0.6s ease-in-out; }
            .runner { animation: runPerson 0.8s infinite ease-in-out; }
          </style>
        </defs>

        <rect width="800" height="450" fill="url(#bgGrad)" />

        <!-- Glowing Frame -->
        <rect x="50" y="50" width="700" height="350" rx="24" fill="none" stroke="#10b981" stroke-width="6" opacity="0.8" />
        <rect x="65" y="65" width="670" height="320" rx="16" fill="none" stroke="#34d399" stroke-width="2" opacity="0.3" stroke-dasharray="10 6" />

        <!-- Evacuation Running Figure -->
        <g class="runner" transform="translate(140, 110)">
          <!-- Head -->
          <circle cx="90" cy="50" r="26" fill="#10b981" />
          <!-- Torso -->
          <path d="M 70 85 L 115 80 L 105 150 L 75 145 Z" fill="#10b981" />
          <!-- Arms -->
          <path d="M 75 90 L 35 125 L 20 115" stroke="#10b981" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M 110 85 L 145 110 L 160 145" stroke="#10b981" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <!-- Legs -->
          <path d="M 80 145 L 45 195 L 15 190" stroke="#10b981" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path d="M 100 145 L 135 185 L 175 205" stroke="#10b981" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>

        <!-- Directional Chevrons -->
        <g transform="translate(420, 160)">
          <path class="arrow-1" d="M 0 0 L 40 50 L 0 100" stroke="#34d399" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path class="arrow-2" d="M 70 0 L 110 50 L 70 100" stroke="#10b981" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <path class="arrow-3" d="M 140 0 L 180 50 L 140 100" stroke="#059669" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>

        <!-- Footer Text -->
        <text x="400" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="4">
          JALUR EVAKUASI DARURAT
        </text>
      </svg>
    `),
  },
  {
    id: "gempa-seismik",
    title: "Gempa & Getaran Seismik",
    category: "Gempa",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Grafik getaran seismik gelombang gempa vulkanik dan peringatan instrumen.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="gridBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#18181b" />
            <stop offset="100%" stop-color="#09090b" />
          </linearGradient>
          <style>
            @keyframes waveFlow {
              0% { stroke-dashoffset: 800; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes blinkAlert {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
            .wave-line {
              stroke-dasharray: 800;
              animation: waveFlow 3s linear infinite;
            }
            .blinker { animation: blinkAlert 1s infinite ease-in-out; }
          </style>
        </defs>

        <rect width="800" height="450" fill="url(#gridBg)" />

        <!-- Grid Lines -->
        <g stroke="#27272a" stroke-width="1" opacity="0.6">
          <line x1="0" y1="90" x2="800" y2="90" />
          <line x1="0" y1="180" x2="800" y2="180" />
          <line x1="0" y1="225" x2="800" y2="225" stroke="#3f3f46" stroke-width="1.5" />
          <line x1="0" y1="270" x2="800" y2="270" />
          <line x1="0" y1="360" x2="800" y2="360" />
          <line x1="160" y1="0" x2="160" y2="450" />
          <line x1="320" y1="0" x2="320" y2="450" />
          <line x1="480" y1="0" x2="480" y2="450" />
          <line x1="640" y1="0" x2="640" y2="450" />
        </g>

        <!-- Seismic Waveform -->
        <path class="wave-line" d="M 0 225 L 140 225 L 170 215 L 190 235 L 210 225 L 280 225 L 310 140 L 335 320 L 360 110 L 390 340 L 420 160 L 440 270 L 465 200 L 485 240 L 510 225 L 800 225" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

        <path d="M 0 225 L 140 225 L 170 215 L 190 235 L 210 225 L 280 225 L 310 140 L 335 320 L 360 110 L 390 340 L 420 160 L 440 270 L 465 200 L 485 240 L 510 225 L 800 225" fill="none" stroke="#f87171" stroke-width="2" opacity="0.6" />

        <!-- Status Card -->
        <rect x="40" y="40" width="220" height="60" rx="10" fill="rgba(39, 39, 42, 0.8)" stroke="#dc2626" stroke-width="1.5" />
        <circle class="blinker" cx="65" cy="70" r="8" fill="#ef4444" />
        <text x="85" y="65" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#ffffff">SEISMIK AKTIF</text>
        <text x="85" y="82" font-family="monospace" font-size="11" fill="#9ca3af">AMPLITUDO: 48 mm</text>
      </svg>
    `),
  },
  {
    id: "tas-siaga-bencana",
    title: "Tas Siaga Bencana (Survival Kit)",
    category: "Siaga",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Perlengkapan ransel darurat 72 jam untuk evakuasi cepat keluarga.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="bagBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <style>
            @keyframes bagFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            @keyframes beamPulse {
              0%, 100% { opacity: 0.3; transform: scaleX(0.9); }
              50% { opacity: 0.8; transform: scaleX(1.1); }
            }
            .floating-bag { animation: bagFloat 3s infinite ease-in-out; }
            .beam { animation: beamPulse 2s infinite ease-in-out; transform-origin: 320px 210px; }
          </style>
        </defs>

        <rect width="800" height="450" fill="url(#bagBg)" />

        <!-- Radial Ambient Glow -->
        <circle cx="400" cy="225" r="160" fill="#3b82f6" opacity="0.12" />

        <g class="floating-bag" transform="translate(260, 80)">
          <!-- Bag Body -->
          <rect x="60" y="90" width="160" height="190" rx="30" fill="#dc2626" stroke="#991b1b" stroke-width="4" />
          <!-- Bag Pocket Front -->
          <rect x="80" y="160" width="120" height="100" rx="16" fill="#b91c1c" />
          <!-- White Cross Emblem -->
          <rect x="130" y="185" width="20" height="50" rx="4" fill="#ffffff" />
          <rect x="115" y="200" width="50" height="20" rx="4" fill="#ffffff" />
          <!-- Bag Straps / Top Handle -->
          <path d="M 105 90 C 105 50, 175 50, 175 90" stroke="#7f1d1d" stroke-width="12" fill="none" stroke-linecap="round" />
          <!-- Side Compartments -->
          <rect x="35" y="130" width="30" height="110" rx="10" fill="#991b1b" />
          <rect x="215" y="130" width="30" height="110" rx="10" fill="#991b1b" />
          <!-- Flashlight on side -->
          <rect x="222" y="100" width="16" height="40" rx="5" fill="#eab308" />
          <circle cx="230" cy="96" r="8" fill="#fef08a" />
        </g>

        <!-- Flashlight Beam -->
        <polygon class="beam" points="500,180 720,110 740,260 500,200" fill="#fef08a" opacity="0.4" />

        <!-- Title -->
        <text x="400" y="390" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f8fafc">
          KIT SIAGA BENCANA 72 JAM
        </text>
      </svg>
    `),
  },
  {
    id: "sirene-peringatan",
    title: "Sirene Peringatan Dini",
    category: "Peringatan",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Sistem sirene bunyi peringatan status siaga dan instruksi evakuasi darurat.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1e2e" />
            <stop offset="100%" stop-color="#0f0f17" />
          </linearGradient>
          <style>
            @keyframes ringWave {
              0% { r: 50px; opacity: 0.9; }
              100% { r: 180px; opacity: 0; }
            }
            @keyframes sirenSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .wave-ring-1 { animation: ringWave 2s infinite ease-out; }
            .wave-ring-2 { animation: ringWave 2s infinite 0.7s ease-out; }
            .wave-ring-3 { animation: ringWave 2s infinite 1.4s ease-out; }
            .beacon-light { animation: sirenSpin 3s infinite linear; transform-origin: 400px 210px; }
          </style>
        </defs>

        <rect width="800" height="450" fill="url(#darkBg)" />

        <!-- Expanding Acoustic Soundwaves -->
        <circle class="wave-ring-1" cx="400" cy="210" r="60" fill="none" stroke="#f59e0b" stroke-width="4" />
        <circle class="wave-ring-2" cx="400" cy="210" r="60" fill="none" stroke="#ef4444" stroke-width="3" />
        <circle class="wave-ring-3" cx="400" cy="210" r="60" fill="none" stroke="#dc2626" stroke-width="2" />

        <!-- Rotating Beacon Beams -->
        <g class="beacon-light">
          <polygon points="400,210 180,90 240,40" fill="#ef4444" opacity="0.3" />
          <polygon points="400,210 620,330 560,380" fill="#ef4444" opacity="0.3" />
        </g>

        <!-- Siren Base & Horn -->
        <rect x="360" y="250" width="80" height="90" rx="10" fill="#374151" />
        <rect x="340" y="320" width="120" height="25" rx="6" fill="#1f2937" />

        <!-- Red Siren Dome -->
        <ellipse cx="400" cy="210" rx="55" ry="50" fill="#dc2626" stroke="#ef4444" stroke-width="4" />
        <ellipse cx="400" cy="195" rx="40" ry="20" fill="#f87171" opacity="0.6" />

        <text x="400" y="390" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#f59e0b" letter-spacing="3">
          SISTEM PERINGATAN DINI (EWS)
        </text>
      </svg>
    `),
  },
  {
    id: "shelter-titik-kumpul",
    title: "Shelter & Titik Kumpul Aman",
    category: "Evakuasi",
    type: "svg-animated",
    badge: "SVG ANIMASI",
    description: "Lokasi titik kumpul aman (assembly point) dan pengungsian sementara.",
    url: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
          <linearGradient id="shelterBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f2942" />
            <stop offset="100%" stop-color="#081827" />
          </linearGradient>
          <style>
            @keyframes pinBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes radarPulse {
              0% { transform: scale(0.3); opacity: 0.9; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            .pin-anim { animation: pinBounce 2s infinite ease-in-out; }
            .radar { animation: radarPulse 2.5s infinite ease-out; transform-origin: 400px 300px; }
          </style>
        </defs>

        <rect width="800" height="450" fill="url(#shelterBg)" />

        <!-- Radar Pulse on Ground -->
        <ellipse class="radar" cx="400" cy="300" rx="90" ry="35" fill="none" stroke="#38bdf8" stroke-width="3" />

        <!-- Pin & Tent -->
        <g class="pin-anim">
          <!-- Tent Shelter -->
          <polygon points="400,120 280,280 520,280" fill="#0284c7" stroke="#38bdf8" stroke-width="4" />
          <polygon points="400,120 370,280 430,280" fill="#0369a1" />
          <polygon points="400,190 370,280 430,280" fill="#0c4a6e" />

          <!-- Location Pin on Top -->
          <circle cx="400" cy="90" r="22" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
          <circle cx="400" cy="90" r="8" fill="#ffffff" />
        </g>

        <!-- Base Label -->
        <text x="400" y="375" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#ffffff">
          TITIK KUMPUL (ASSEMBLY POINT)
        </text>
        <text x="400" y="405" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">
          Zona Aman Bebas Bahaya Erupsi &amp; Gas Beracun
        </text>
      </svg>
    `),
  },
]

export const ANIMATION_EFFECTS = [
  { id: "none", label: "Tanpa Efek", className: "" },
  { id: "float", label: "Melayang (Floating)", className: "anim-float" },
  { id: "pulse", label: "Denyut Waspada (Pulse)", className: "anim-pulse" },
  { id: "shake", label: "Getaran Gempa (Shake)", className: "anim-shake" },
  { id: "breathe", label: "Nafas Halus (Breathe)", className: "anim-breathe" },
  { id: "zoom", label: "Zoom Interaktif (Hover)", className: "anim-zoom-hover" },
]

export const ASPECT_RATIOS = [
  { id: "16-9", label: "16:9 Widescreen", className: "aspect-video" },
  { id: "4-3", label: "4:3 Standar", className: "aspect-[4/3]" },
  { id: "1-1", label: "1:1 Kotak", className: "aspect-square" },
  { id: "21-9", label: "21:9 Panorama", className: "aspect-[21/9]" },
]

export const detectMediaType = (url) => {
  if (!url) return "unknown"
  const cleanUrl = url.split("#")[0].split("?")[0].toLowerCase()

  if (cleanUrl.endsWith(".json") || url.includes("lottie")) return "lottie"
  if (cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".webm") || cleanUrl.endsWith(".mov")) return "video"
  if (cleanUrl.endsWith(".svg") || url.startsWith("data:image/svg+xml")) return "svg"
  if (cleanUrl.endsWith(".gif")) return "gif"
  return "image"
}

export const parseMediaConfig = (fullUrl) => {
  if (!fullUrl) return { url: "", effect: "none", ratio: "16-9" }

  const [baseUrl, hash] = fullUrl.split("#")
  let effect = "none"
  let ratio = "16-9"

  if (hash) {
    const params = new URLSearchParams(hash)
    if (params.get("effect")) effect = params.get("effect")
    if (params.get("ratio")) ratio = params.get("ratio")
  }

  return { url: baseUrl, effect, ratio }
}

export const buildMediaUrl = (baseUrl, effect = "none", ratio = "16-9") => {
  if (!baseUrl) return ""
  const cleanBase = baseUrl.split("#")[0]
  if (effect === "none" && ratio === "16-9") return cleanBase

  const params = new URLSearchParams()
  if (effect !== "none") params.set("effect", effect)
  if (ratio !== "16-9") params.set("ratio", ratio)

  return `${cleanBase}#${params.toString()}`
}
