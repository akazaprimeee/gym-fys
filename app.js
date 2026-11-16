/**
 * Gimnasio Fuerza y Salud - Mobile App Logic
 * Designed for Client View (Digital Card with Real-time Seconds & Dynamic QR)
 * and Admin View (Receptionist QR Scanner & Validation Panel)
 */

// --- Application State & Mock Database ---
const DB_STORAGE_KEY = 'gym_fys_db_v1';

const INITIAL_DATA = {
  users: {
    '71234567': {
      dni: '71234567',
      password: '123',
      name: 'Carlos Mendoza Castro',
      shortName: 'Carlos',
      code: 'FS-0842',
      role: 'client',
      plan: 'Trimestral VIP',
      planFullName: 'Plan Trimestral Pro VIP',
      status: 'active', // 'active' | 'warning' | 'expired'
      expireDate: '2026-12-28',
      expireDisplay: '28 de Diciembre, 2026',
      daysLeft: 42,
      progressPercent: 78,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80',
      bloodType: 'O+'
    },
    '74561234': {
      dni: '74561234',
      password: '123',
      name: 'Valeria Ramos Silva',
      shortName: 'Valeria',
      code: 'FS-1105',
      role: 'client',
      plan: 'Mensual Estándar',
      planFullName: 'Plan Mensual Estándar',
      status: 'warning',
      expireDate: '2026-11-18',
      expireDisplay: '18 de Noviembre, 2026',
      daysLeft: 2,
      progressPercent: 95,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80',
      bloodType: 'A+'
    },
    '45892134': {
      dni: '45892134',
      password: '123',
      name: 'Roberto Farfán Castillo',
      shortName: 'Roberto',
      code: 'FS-0329',
      role: 'client',
      plan: 'Mensual Regular',
      planFullName: 'Plan Mensual Regular',
      status: 'expired',
      expireDate: '2026-11-05',
      expireDisplay: '05 de Noviembre, 2026',
      daysLeft: 0,
      progressPercent: 100,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80',
      bloodType: 'B+'
    },
    '88888888': {
      dni: '88888888',
      password: 'admin',
      name: 'Juan Pérez Almeyda',
      shortName: 'Juan',
      code: 'ADM-01',
      role: 'admin',
      position: 'Recepción y Control'
    }
  },
  pendingValidations: [
    {
      id: 1,
      type: 'pago',
      memberName: 'Valeria Ramos Silva',
      dni: '74561234',
      plan: 'Renovación Plan Mensual (30 días)',
      amount: 'S/ 150.00',
      method: 'Transferencia BCP',
      opNumber: 'OP-948271',
      date: 'Hoy, 10:45 AM',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      type: 'documento',
      memberName: 'Carlos Mendoza Castro',
      dni: '71234567',
      plan: 'Certificado de Aptitud Médica',
      amount: 'Documento Clínico',
      method: 'Constancia Médica',
      opNumber: 'MED-2026-08',
      date: 'Hoy, 09:15 AM',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      type: 'pago',
      memberName: 'Marco Silva Guerrero',
      dni: '72194833',
      plan: 'Plan Trimestral Pro Fuerza',
      amount: 'S/ 380.00',
      method: 'Yape Móvil',
      opNumber: 'YAPE-882194',
      date: 'Ayer, 07:30 PM',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
    }
  ],
  approvedHistory: [
    { name: 'Diana Torres', dni: '76123984', plan: 'Plan Semestral', amount: 'S/ 680.00', time: 'Hoy 08:30 AM' },
    { name: 'Jorge Ruesta', dni: '43998124', plan: 'Plan Mensual', amount: 'S/ 150.00', time: 'Ayer 06:15 PM' }
  ],
  checkins: [
    { name: 'Carlos Mendoza', dni: '71234567', status: 'active', time: '14:22:10', plan: 'Trimestral VIP' },
    { name: 'Valeria Ramos', dni: '74561234', status: 'warning', time: '13:50:35', plan: 'Mensual Estándar' },
    { name: 'Elena García', dni: '75128934', status: 'active', time: '12:15:00', plan: 'Anual Pro' }
  ]
};

// State Manager
let state = loadState();

function loadState() {
  const saved = localStorage.getItem(DB_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse localStorage, resetting to default:', e);
    }
  }
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveState() {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
}

// Current User Session
let currentUser = state.users['71234567']; // Default to Carlos
let currentRole = 'client'; // 'client' | 'admin'
let isSoundEnabled = true;
let isFullscreen = false;

// Dynamic QR & Timer states
let qrCodeInstance = null;
let qrCountdown = 20;
let qrInterval = null;
let currentQrToken = '';

// HTML5 QR Scanner instance
let html5QrScanner = null;
let isCameraActive = false;

// Audio Synthesizer (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!isSoundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      // Pleasant upward 2-tone chime
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'warning') {
      // Double pulse caution tone
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(392, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'error') {
      // Low alert buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196, now);
      osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.3);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'click') {
      // Gentle subtle click
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (err) {
    console.debug('Audio error:', err);
  }
}

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 border-emerald-400 text-white',
    error: 'bg-red-600 border-red-400 text-white',
    warning: 'bg-amber-600 border-amber-400 text-white',
    info: 'bg-brand-600 border-brand-400 text-white'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.className = `p-3 rounded-2xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-fade-in ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// --- Live Clock & Real-time Seconds Counter ---
function initRealtimeClock() {
  function updateTime() {
    const now = new Date();
    
    // Status bar clock (HH:MM)
    const hours24 = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = now.getMilliseconds();

    const statusClockEl = document.getElementById('statusBarClock');
    if (statusClockEl) statusClockEl.textContent = `${hours24}:${minutes}`;

    // Carnet Digital live seconds
    const carnetHourMin = document.getElementById('carnetHourMin');
    const carnetSec = document.getElementById('carnetSeconds');
    const carnetAmPm = document.getElementById('carnetAmPm');
    const carnetLiveDate = document.getElementById('carnetLiveDate');
    const msBar = document.getElementById('liveMillisecondBar');

    if (carnetHourMin) {
      let h = now.getHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      carnetHourMin.textContent = `${String(h).padStart(2, '0')}:${minutes}`;
      if (carnetSec) carnetSec.textContent = seconds;
      if (carnetAmPm) carnetAmPm.textContent = ampm;
      if (msBar) {
        // Smooth millisecond bar 0-100%
        const percent = (ms / 1000) * 100;
        msBar.style.width = `${percent}%`;
      }
    }

    if (carnetLiveDate) {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      carnetLiveDate.textContent = now.toLocaleDateString('es-PE', options).toUpperCase();
    }

    requestAnimationFrame(updateTime);
  }

  requestAnimationFrame(updateTime);
}

// --- Dynamic QR Code Generator ---
function initDynamicQr() {
  const container = document.getElementById('qrcodeCanvas');
  if (!container) return;

  container.innerHTML = '';
  // QRCode.js instance
  qrCodeInstance = new QRCode(container, {
    text: 'INIT_TOKEN',
    width: 172,
    height: 172,
    colorDark: '#080d1a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  regenerateDynamicQr();

  // 20s Countdown timer
  clearInterval(qrInterval);
  qrInterval = setInterval(() => {
    qrCountdown--;
    if (qrCountdown <= 0) {
      regenerateDynamicQr();
      qrCountdown = 20;
    }
    updateQrCountdownUI();
  }, 1000);
}

function regenerateDynamicQr(manual = false) {
  if (!currentUser) return;
  const tokenSalt = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Encrypted/Structured payload for gym validation
  currentQrToken = `FYS-${currentUser.dni}-${currentUser.status.toUpperCase()}-${timestamp}-${tokenSalt}`;

  const qrPayload = JSON.stringify({
    gym: 'Gimnasio Fuerza y Salud',
    dni: currentUser.dni,
    name: currentUser.name,
    status: currentUser.status,
    plan: currentUser.plan,
    expire: currentUser.expireDate,
    token: currentQrToken,
    ts: timestamp
  });

  if (qrCodeInstance) {
    qrCodeInstance.makeCode(qrPayload);
  }

  const tokenEl = document.getElementById('qrTokenPreview');
  if (tokenEl) tokenEl.textContent = `TOKEN: ${currentQrToken.substring(0, 22)}...`;

  if (manual) {
    qrCountdown = 20;
    updateQrCountdownUI();
    playSound('click');
    showToast('Código QR renovado con éxito', 'info');
  }
}

function updateQrCountdownUI() {
  const textEl = document.getElementById('qrCountdownText');
  const barEl = document.getElementById('qrCountdownBar');
  if (textEl) textEl.textContent = `${qrCountdown} segundos`;
  if (barEl) {
    const percent = (qrCountdown / 20) * 100;
    barEl.style.width = `${percent}%`;
  }
}

// --- Tab Selector in Client View (Carnet vs QR) ---
function switchClientTab(tab) {
  playSound('click');
  const carnetTabBtn = document.getElementById('selectCarnetTab');
  const qrTabBtn = document.getElementById('selectQrTab');
  const carnetBox = document.getElementById('carnetContainer');
  const qrBox = document.getElementById('qrContainer');

  if (tab === 'carnet') {
    carnetTabBtn.className = 'client-tab-btn flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md';
    qrTabBtn.className = 'client-tab-btn flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2';
    carnetBox.classList.remove('hidden');
    qrBox.classList.add('hidden');
  } else {
    qrTabBtn.className = 'client-tab-btn flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md';
    carnetTabBtn.className = 'client-tab-btn flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2';
    carnetBox.classList.add('hidden');
    qrBox.classList.remove('hidden');
    // Ensure QR is fresh
    regenerateDynamicQr();
  }
}

// --- Sub-Tabs in Admin View (Scanner vs Validation) ---
function switchAdminSubTab(tab) {
  playSound('click');
  const scannerBtn = document.getElementById('adminTabScannerBtn');
  const validationBtn = document.getElementById('adminTabValidationBtn');
  const scannerSection = document.getElementById('adminScannerSection');
  const validationSection = document.getElementById('adminValidationSection');

  if (tab === 'scanner') {
    scannerBtn.className = 'admin-tab-btn flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md';
    validationBtn.className = 'admin-tab-btn flex-1 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 relative';
    scannerSection.classList.remove('hidden');
    validationSection.classList.add('hidden');
  } else {
    validationBtn.className = 'admin-tab-btn flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md relative';
    scannerBtn.className = 'admin-tab-btn flex-1 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5';
    scannerSection.classList.add('hidden');
    validationSection.classList.remove('hidden');
    renderPendingDocs();
  }
}

// --- Toggle View Mode (Client vs Admin) ---
function toggleViewMode(targetRole) {
  if (!targetRole) {
    targetRole = currentRole === 'client' ? 'admin' : 'client';
  }
  
  playSound('click');
  currentRole = targetRole;

  const clientView = document.getElementById('clientView');
  const adminView = document.getElementById('adminView');
  const loginView = document.getElementById('loginView');
  const topText = document.getElementById('topToggleRoleText');
  const navText = document.getElementById('switchRoleNavText');
  const headerSub = document.getElementById('appHeaderSubtitle');
  const navClient = document.getElementById('bottomNavClient');
  const navAdmin = document.getElementById('bottomNavAdmin');

  loginView.classList.add('hidden');

  if (targetRole === 'client') {
    clientView.classList.remove('hidden');
    adminView.classList.add('hidden');

    topText.textContent = 'Alternar: Vista Admin';
    navText.textContent = 'A Recepción';
    headerSub.textContent = 'Portal de Socios';

    navClient.className = 'flex flex-col items-center gap-0.5 text-brand-400 transition-all';
    navAdmin.className = 'flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-all relative';

    renderClientView();
  } else {
    adminView.classList.remove('hidden');
    clientView.classList.add('hidden');

    topText.textContent = 'Alternar: Vista Socio';
    navText.textContent = 'A Mi Carnet';
    headerSub.textContent = 'Recepción & Control';

    navAdmin.className = 'flex flex-col items-center gap-0.5 text-brand-400 transition-all relative';
    navClient.className = 'flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-all';

    renderAdminView();
  }
}

// --- Render Client View Details ---
function renderClientView() {
  if (!currentUser) return;

  // Header & Avatar
  const nameEl = document.getElementById('clientName');
  const dniEl = document.getElementById('clientDni');
  const codeEl = document.getElementById('clientCode');
  const avatarEl = document.getElementById('clientAvatar');
  const planBadge = document.getElementById('clientPlanBadge');

  if (nameEl) nameEl.textContent = currentUser.name;
  if (dniEl) dniEl.textContent = currentUser.dni;
  if (codeEl) codeEl.textContent = currentUser.code || 'FS-0842';
  if (avatarEl && currentUser.avatar) avatarEl.src = currentUser.avatar;

  // Membership Card
  const card = document.getElementById('membershipCard');
  const planName = document.getElementById('membershipPlanName');
  const statusPill = document.getElementById('membershipStatusPill');
  const expireDate = document.getElementById('membershipExpireDate');
  const daysLeft = document.getElementById('membershipDaysLeft');
  const progressBar = document.getElementById('membershipProgressBar');
  const statusDot = document.getElementById('clientStatusBadgeDot');

  card.className = 'membership-card p-4 rounded-3xl border relative overflow-hidden shadow-xl transition-all';

  if (currentUser.status === 'active') {
    card.classList.add('status-active');
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-500 text-slate-950 shadow-md flex items-center gap-1.5';
    statusPill.innerHTML = '<i class="fa-solid fa-circle-check text-[11px]"></i> ACTIVA';
    daysLeft.textContent = `${currentUser.daysLeft} días restantes`;
    daysLeft.className = 'text-emerald-400 font-semibold';
    if (statusDot) statusDot.className = 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-dark-card flex items-center justify-center';
  } else if (currentUser.status === 'warning') {
    card.classList.add('status-warning');
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-amber-500 text-slate-950 shadow-md flex items-center gap-1.5';
    statusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-[11px]"></i> POR VENCER';
    daysLeft.textContent = `¡Vence en ${currentUser.daysLeft} días!`;
    daysLeft.className = 'text-amber-400 font-bold';
    if (statusDot) statusDot.className = 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-dark-card flex items-center justify-center';
  } else {
    card.classList.add('status-expired');
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-red-500 text-white shadow-md flex items-center gap-1.5';
    statusPill.innerHTML = '<i class="fa-solid fa-ban text-[11px]"></i> VENCIDA';
    daysLeft.textContent = 'Membresía caducada';
    daysLeft.className = 'text-red-400 font-bold';
    if (statusDot) statusDot.className = 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-dark-card flex items-center justify-center';
  }

  if (planName) planName.textContent = currentUser.planFullName || currentUser.plan;
  if (expireDate) expireDate.textContent = currentUser.expireDisplay || currentUser.expireDate;
  if (progressBar) progressBar.style.width = `${currentUser.progressPercent}%`;

  // Carnet Digital Data
  const carnetName = document.getElementById('carnetFullName');
  const carnetDni = document.getElementById('carnetDniText');
  const carnetId = document.getElementById('carnetIdCode');
  const carnetPlan = document.getElementById('carnetPlanText');
  const carnetVigencia = document.getElementById('carnetVigenciaText');
  const carnetPhoto = document.getElementById('carnetPhoto');

  if (carnetName) carnetName.textContent = currentUser.name;
  if (carnetDni) carnetDni.textContent = currentUser.dni;
  if (carnetId) carnetId.textContent = currentUser.code;
  if (carnetPlan) carnetPlan.textContent = currentUser.plan;
  if (carnetVigencia) carnetVigencia.textContent = currentUser.expireDate;
  if (carnetPhoto && currentUser.avatar) carnetPhoto.src = currentUser.avatar;

  // Refresh QR
  regenerateDynamicQr();
}

// --- Render Admin View Details ---
function renderAdminView() {
  // Update Metrics
  const metricPending = document.getElementById('metricPendingCount');
  const metricCheckins = document.getElementById('metricCheckinsCount');
  const pendingBadge = document.getElementById('adminPendingBadge');
  const footerDot = document.getElementById('footerPendingDot');

  const pendingCount = state.pendingValidations.length;
  if (metricPending) metricPending.textContent = pendingCount;
  if (pendingBadge) pendingBadge.textContent = pendingCount;
  if (footerDot) footerDot.style.display = pendingCount > 0 ? 'block' : 'none';

  if (metricCheckins) metricCheckins.textContent = state.checkins.length + 39;

  renderCheckinsList();
  renderPendingDocs();
  renderApprovedDocs();
}

// --- Validation Panel: Render Pending Items ---
function renderPendingDocs() {
  const container = document.getElementById('pendingDocsList');
  if (!container) return;

  if (state.pendingValidations.length === 0) {
    container.innerHTML = `
      <div class="p-6 rounded-3xl bg-dark-card border border-dark-border text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center text-xl">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <p class="text-xs font-bold text-white">¡No hay solicitudes pendientes!</p>
        <p class="text-[11px] text-slate-400">Todos los pagos y documentos han sido validados.</p>
        <button onclick="resetDemoPendingDocs()" class="mt-2 px-3 py-1.5 rounded-xl bg-brand-500/20 text-brand-300 text-xs font-semibold">
          Recargar ejemplos de prueba
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.pendingValidations.map(item => `
    <div class="bg-dark-card border border-dark-border rounded-2xl p-3.5 shadow-lg space-y-3 relative overflow-hidden transition-all hover:border-slate-600">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <div class="cursor-pointer group relative" onclick="openReceiptModal(${item.id})">
            <img src="${item.image}" alt="Comprobante" class="w-12 h-12 rounded-xl object-cover border border-slate-700 group-hover:scale-105 transition-transform">
            <span class="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h5 class="text-xs font-bold text-white">${item.memberName}</h5>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${item.type === 'pago' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}">${item.type}</span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono">DNI: ${item.dni} • ${item.date}</p>
            <p class="text-[11px] font-semibold text-brand-300">${item.plan}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono font-black text-emerald-400 block">${item.amount}</span>
          <span class="text-[9px] text-slate-400 block">${item.method}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
        <button onclick="openReceiptModal(${item.id})" class="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all">
          <i class="fa-solid fa-eye text-[10px]"></i> Ver
        </button>
        <button onclick="rejectPendingDoc(${item.id})" class="py-1.5 px-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-all">
          <i class="fa-solid fa-xmark text-[10px]"></i> Rechazar
        </button>
        <button onclick="approvePendingDoc(${item.id})" class="py-1.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all">
          <i class="fa-solid fa-check text-[10px]"></i> Aprobar
        </button>
      </div>
    </div>
  `).join('');
}

function renderApprovedDocs() {
  const container = document.getElementById('approvedDocsList');
  if (!container) return;

  container.innerHTML = state.approvedHistory.map(item => `
    <div class="p-2 rounded-xl bg-dark-surface/60 border border-slate-800/80 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
        <div>
          <span class="font-bold text-white text-[11px]">${item.name}</span>
          <span class="text-[10px] text-slate-400 block">${item.plan} • ${item.time}</span>
        </div>
      </div>
      <span class="text-xs font-mono font-bold text-emerald-400">${item.amount}</span>
    </div>
  `).join('');
}

// Approve / Reject Actions
function approvePendingDoc(id) {
  const index = state.pendingValidations.findIndex(i => i.id === id);
  if (index === -1) return;

  const item = state.pendingValidations[index];

  // If this user exists in state, activate/renew their membership!
  if (state.users[item.dni]) {
    const user = state.users[item.dni];
    user.status = 'active';
    user.daysLeft = 30;
    user.expireDate = '2027-01-16';
    user.expireDisplay = '16 de Enero, 2027';
    user.progressPercent = 10;
  }

  // Move to approved history
  const now = new Date();
  state.approvedHistory.unshift({
    name: item.memberName,
    dni: item.dni,
    plan: item.plan,
    amount: item.amount,
    time: `Hoy ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  });

  // Remove from pending
  state.pendingValidations.splice(index, 1);
  saveState();

  playSound('success');
  showToast(`¡Aprobado con éxito! Membresía activada para ${item.memberName}`, 'success');
  
  renderAdminView();
  if (currentUser && currentUser.dni === item.dni) {
    renderClientView();
  }
}

function rejectPendingDoc(id) {
  const index = state.pendingValidations.findIndex(i => i.id === id);
  if (index === -1) return;

  const item = state.pendingValidations[index];
  state.pendingValidations.splice(index, 1);
  saveState();

  playSound('error');
  showToast(`Solicitud de ${item.memberName} rechazada.`, 'warning');
  renderAdminView();
}

function resetDemoPendingDocs() {
  state.pendingValidations = JSON.parse(JSON.stringify(INITIAL_DATA.pendingValidations));
  saveState();
  renderAdminView();
  showToast('Lista de solicitudes restaurada para pruebas', 'info');
}

// --- Check-ins Log & QR Scanner Verification ---
function renderCheckinsList() {
  const container = document.getElementById('checkinsLogList');
  if (!container) return;

  if (state.checkins.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">No hay ingresos registrados hoy.</p>';
    return;
  }

  container.innerHTML = state.checkins.map(chk => {
    let badge = '<span class="text-emerald-400 font-bold text-[10px]"><i class="fa-solid fa-circle-check"></i> Permitido</span>';
    if (chk.status === 'warning') {
      badge = '<span class="text-amber-400 font-bold text-[10px]"><i class="fa-solid fa-triangle-exclamation"></i> Por Vencer</span>';
    } else if (chk.status === 'expired') {
      badge = '<span class="text-red-400 font-bold text-[10px]"><i class="fa-solid fa-circle-xmark"></i> Denegado</span>';
    }

    return `
      <div class="p-2.5 rounded-2xl bg-dark-surface border border-slate-800/80 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
            ${chk.name.substring(0, 1)}
          </div>
          <div>
            <p class="text-xs font-bold text-white">${chk.name}</p>
            <p class="text-[10px] text-slate-400 font-mono">DNI: ${chk.dni} • ${chk.plan || 'Socio'}</p>
          </div>
        </div>
        <div class="text-right">
          ${badge}
          <span class="block text-[10px] font-mono text-slate-400">${chk.time}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Scanner Simulator & Access Verification Core
function processMemberVerification(dni) {
  const resultBox = document.getElementById('scanResultBox');
  if (!resultBox) return;

  const user = state.users[dni];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  resultBox.classList.remove('hidden');

  if (!user) {
    // Unregistered member
    playSound('error');
    resultBox.innerHTML = `
      <div class="bg-red-500/15 border-2 border-red-500 rounded-3xl p-4 text-center space-y-2 animate-fade-in">
        <div class="w-12 h-12 rounded-full bg-red-500 text-white mx-auto flex items-center justify-center text-xl shadow-lg shadow-red-500/40">
          <i class="fa-solid fa-ban"></i>
        </div>
        <h4 class="text-base font-black text-white uppercase tracking-tight">ACCESO DENEGADO</h4>
        <p class="text-xs text-red-300 font-semibold">DNI No Encontrado en el Sistema</p>
        <p class="text-[11px] text-slate-400">El número ${dni} no figura como socio registrado de Gimnasio Fuerza y Salud.</p>
        <button onclick="dismissScanResult()" class="mt-1 px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold">Cerrar</button>
      </div>
    `;
    return;
  }

  // Member found: evaluate status
  if (user.status === 'active') {
    playSound('success');
    // Register checkin
    state.checkins.unshift({
      name: user.name,
      dni: user.dni,
      status: 'active',
      plan: user.plan,
      time: timeStr
    });
    saveState();
    renderCheckinsList();

    resultBox.innerHTML = `
      <div class="bg-gradient-to-br from-emerald-950/80 to-dark-surface border-2 border-emerald-500 rounded-3xl p-4 text-center space-y-3 animate-fade-in shadow-2xl">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
            ¡ACCESO CONCEDIDO!
          </span>
          <span class="text-xs font-mono text-emerald-400">${timeStr}</span>
        </div>

        <div class="flex items-center gap-3 text-left bg-dark-card/90 p-3 rounded-2xl border border-emerald-500/30">
          <img src="${user.avatar || 'assets/logo.png'}" alt="Foto" class="w-14 h-14 rounded-xl object-cover border-2 border-emerald-400 shadow">
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-white truncate font-display">${user.name}</h4>
            <p class="text-xs text-slate-300 font-mono">DNI: ${user.dni} • Socio #${user.code}</p>
            <p class="text-xs font-semibold text-emerald-400">${user.planFullName || user.plan}</p>
            <p class="text-[10px] text-slate-400">Vigencia: ${user.expireDisplay}</p>
          </div>
        </div>

        <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-dumbbell"></i>
          <span>¡Bienvenido(a) a Gimnasio Fuerza y Salud! Pase adelante.</span>
        </div>

        <button onclick="dismissScanResult()" class="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
          Aceptar y Continuar
        </button>
      </div>
    `;
  } else if (user.status === 'warning') {
    playSound('warning');
    // Register checkin
    state.checkins.unshift({
      name: user.name,
      dni: user.dni,
      status: 'warning',
      plan: user.plan,
      time: timeStr
    });
    saveState();
    renderCheckinsList();

    resultBox.innerHTML = `
      <div class="bg-gradient-to-br from-amber-950/80 to-dark-surface border-2 border-amber-500 rounded-3xl p-4 text-center space-y-3 animate-fade-in shadow-2xl">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
            ACCESO PERMITIDO - AVISO DE PAGO
          </span>
          <span class="text-xs font-mono text-amber-400">${timeStr}</span>
        </div>

        <div class="flex items-center gap-3 text-left bg-dark-card/90 p-3 rounded-2xl border border-amber-500/30">
          <img src="${user.avatar || 'assets/logo.png'}" alt="Foto" class="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 shadow">
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-white truncate font-display">${user.name}</h4>
            <p class="text-xs text-slate-300 font-mono">DNI: ${user.dni} • Socio #${user.code}</p>
            <p class="text-xs font-semibold text-amber-400">${user.planFullName || user.plan}</p>
            <p class="text-[10px] text-amber-300 font-bold">¡Vence en ${user.daysLeft} días! (${user.expireDisplay})</p>
          </div>
        </div>

        <div class="p-2 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Recordar al socio renovar membresía en recepción antes de vencer.</span>
        </div>

        <button onclick="dismissScanResult()" class="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
          Aceptar Ingreso
        </button>
      </div>
    `;
  } else {
    // Expired
    playSound('error');
    state.checkins.unshift({
      name: user.name,
      dni: user.dni,
      status: 'expired',
      plan: user.plan,
      time: timeStr
    });
    saveState();
    renderCheckinsList();

    resultBox.innerHTML = `
      <div class="bg-gradient-to-br from-red-950/80 to-dark-surface border-2 border-red-500 rounded-3xl p-4 text-center space-y-3 animate-fade-in shadow-2xl">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500 text-white">
            ¡ACCESO DENEGADO!
          </span>
          <span class="text-xs font-mono text-red-400">${timeStr}</span>
        </div>

        <div class="flex items-center gap-3 text-left bg-dark-card/90 p-3 rounded-2xl border border-red-500/30">
          <img src="${user.avatar || 'assets/logo.png'}" alt="Foto" class="w-14 h-14 rounded-xl object-cover border-2 border-red-400 grayscale">
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-white truncate font-display">${user.name}</h4>
            <p class="text-xs text-slate-300 font-mono">DNI: ${user.dni} • Socio #${user.code}</p>
            <p class="text-xs font-bold text-red-400">MEMBRESÍA EXPIRADA</p>
            <p class="text-[10px] text-slate-400">Caducó el: ${user.expireDisplay}</p>
          </div>
        </div>

        <div class="p-2 rounded-xl bg-red-500/10 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-hand"></i>
          <span>El socio debe acercarse a recepción para regularizar su pago.</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button onclick="dismissScanResult()" class="py-2 rounded-xl bg-slate-800 text-white font-bold text-xs">
            Cerrar
          </button>
          <button onclick="quickRenewMemberFromAdmin('${user.dni}')" class="py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1">
            <i class="fa-solid fa-wallet"></i> Cobrar y Renovar
          </button>
        </div>
      </div>
    `;
  }
}

function dismissScanResult() {
  const resultBox = document.getElementById('scanResultBox');
  if (resultBox) resultBox.classList.add('hidden');
}

function simulateAdminScan(dni) {
  processMemberVerification(dni);
}

function handleManualLookup(e) {
  e.preventDefault();
  const input = document.getElementById('manualDniInput');
  if (!input || !input.value.trim()) return;
  const dni = input.value.trim();
  processMemberVerification(dni);
  input.value = '';
}

function quickRenewMemberFromAdmin(dni) {
  if (state.users[dni]) {
    const user = state.users[dni];
    user.status = 'active';
    user.daysLeft = 30;
    user.expireDate = '2027-01-16';
    user.expireDisplay = '16 de Enero, 2027';
    user.progressPercent = 10;
    saveState();
    playSound('success');
    showToast(`Membresía renovada para ${user.name}`, 'success');
    processMemberVerification(dni);
    if (currentUser && currentUser.dni === dni) {
      renderClientView();
    }
  }
}

// Camera Scanner with Html5Qrcode
function toggleCameraScanner() {
  const btn = document.getElementById('toggleCameraBtn');
  const icon = document.getElementById('cameraToggleIcon');
  const text = document.getElementById('cameraToggleText');
  const overlay = document.getElementById('scannerOverlay');

  if (isCameraActive) {
    // Stop camera
    if (html5QrScanner) {
      html5QrScanner.stop().then(() => {
        isCameraActive = false;
        text.textContent = 'Cámara';
        btn.classList.remove('bg-red-500/20', 'text-red-400');
        showToast('Cámara desactivada', 'info');
      }).catch(err => console.error(err));
    }
  } else {
    // Start camera
    if (!html5QrScanner) {
      html5QrScanner = new Html5Qrcode('qrReader');
    }

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5QrScanner.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        // Successful scan
        try {
          // If JSON payload
          if (decodedText.startsWith('{')) {
            const data = JSON.parse(decodedText);
            if (data.dni) {
              processMemberVerification(data.dni);
              return;
            }
          }
          // If FYS token
          if (decodedText.includes('FYS-')) {
            const parts = decodedText.split('-');
            if (parts.length >= 2) {
              processMemberVerification(parts[1]);
              return;
            }
          }
          // Or pure DNI
          processMemberVerification(decodedText.trim());
        } catch (err) {
          processMemberVerification(decodedText.trim());
        }
      },
      (errorMessage) => {
        // Scanning in progress...
      }
    ).then(() => {
      isCameraActive = true;
      text.textContent = 'Detener';
      btn.classList.add('bg-red-500/20', 'text-red-400');
      showToast('Cámara activa. Apunta a un código QR.', 'success');
    }).catch(err => {
      console.warn('Camera could not be started (permissions or device):', err);
      showToast('No se pudo acceder a la cámara. Usa el simulador rápido.', 'warning');
    });
  }
}

// --- Modals: Receipt / Payment Zoom Modal ---
let activeModalReceiptId = null;

function openReceiptModal(id) {
  playSound('click');
  const item = state.pendingValidations.find(i => i.id === id);
  if (!item) return;

  activeModalReceiptId = id;
  const modal = document.getElementById('receiptModal');
  const img = document.getElementById('receiptModalImg');
  const member = document.getElementById('receiptModalMember');
  const plan = document.getElementById('receiptModalPlan');
  const amount = document.getElementById('receiptModalAmount');
  const op = document.getElementById('receiptModalOp');

  img.src = item.image;
  member.textContent = item.memberName;
  plan.textContent = item.plan;
  amount.textContent = item.amount;
  op.textContent = item.opNumber;

  modal.classList.remove('hidden');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('hidden');
  activeModalReceiptId = null;
}

function handleApproveCurrentModal() {
  if (activeModalReceiptId) {
    approvePendingDoc(activeModalReceiptId);
    closeReceiptModal();
  }
}

function handleRejectCurrentModal() {
  if (activeModalReceiptId) {
    rejectPendingDoc(activeModalReceiptId);
    closeReceiptModal();
  }
}

// --- Modals: Renew Membership (Client) ---
function openRenewModal() {
  playSound('click');
  const modal = document.getElementById('renewModal');
  if (modal) modal.classList.remove('hidden');
}

function closeRenewModal() {
  const modal = document.getElementById('renewModal');
  if (modal) modal.classList.add('hidden');
}

function submitRenewalForm(e) {
  e.preventDefault();
  const planSelect = document.getElementById('renewPlanSelect');
  const opNumber = document.getElementById('renewOpNumber');

  if (!currentUser) return;

  const newItem = {
    id: Date.now(),
    type: 'pago',
    memberName: currentUser.name,
    dni: currentUser.dni,
    plan: planSelect.value,
    amount: planSelect.value.split('-')[1]?.trim() || 'S/ 150.00',
    method: 'Transferencia BCP / Yape',
    opNumber: `OP-${opNumber.value.trim()}`,
    date: 'Hoy (Enviado hace un momento)',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
  };

  state.pendingValidations.unshift(newItem);
  saveState();

  closeRenewModal();
  playSound('success');
  showToast('¡Comprobante enviado a recepción! Tu membresía se activará tras la validación.', 'success');
  opNumber.value = '';
}

// --- Modals: Socials ---
function openSocialsModal() {
  playSound('click');
  const modal = document.getElementById('socialsModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSocialsModal() {
  const modal = document.getElementById('socialsModal');
  if (modal) modal.classList.add('hidden');
}

// --- Login & Authentication ---
function quickFillLogin(dni, password) {
  const dniInput = document.getElementById('loginDni');
  const passInput = document.getElementById('loginPassword');
  if (dniInput) dniInput.value = dni;
  if (passInput) passInput.value = password;
  playSound('click');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const dni = document.getElementById('loginDni').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();

  const user = state.users[dni];

  if (user) {
    // Simple demo validation
    currentUser = user;
    playSound('success');
    showToast(`¡Bienvenido(a), ${user.shortName || user.name}!`, 'success');

    if (user.role === 'admin') {
      toggleViewMode('admin');
    } else {
      toggleViewMode('client');
    }
  } else {
    // Default fallback create or reject
    playSound('error');
    showToast('DNI no registrado o contraseña incorrecta. Usa los botones demo.', 'error');
  }
}

function handleLogout() {
  playSound('click');
  const loginView = document.getElementById('loginView');
  const clientView = document.getElementById('clientView');
  const adminView = document.getElementById('adminView');

  clientView.classList.add('hidden');
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');

  showToast('Has cerrado sesión', 'info');
}

// --- Viewport & Device Frame Toggle ---
function toggleFrameMode() {
  isFullscreen = !isFullscreen;
  const container = document.getElementById('appContainer');
  const text = document.getElementById('frameToggleText');

  if (isFullscreen) {
    container.classList.add('fullscreen');
    text.textContent = 'Vista Pantalla Completa';
  } else {
    container.classList.remove('fullscreen');
    text.textContent = 'Vista Enmarcada';
  }
  playSound('click');
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  const icon = document.getElementById('soundIcon');
  if (isSoundEnabled) {
    icon.className = 'fa-solid fa-volume-high text-emerald-400';
    showToast('Sonido activado', 'info');
  } else {
    icon.className = 'fa-solid fa-volume-xmark text-slate-500';
    showToast('Sonido desactivado', 'info');
  }
}

// --- Setup Event Listeners & Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  // Top and Navigation Buttons
  document.getElementById('topToggleRoleBtn')?.addEventListener('click', () => toggleViewMode());
  document.getElementById('switchRoleNavBtn')?.addEventListener('click', () => toggleViewMode());
  document.getElementById('toggleFrameBtn')?.addEventListener('click', toggleFrameMode);
  document.getElementById('toggleSoundBtn')?.addEventListener('click', toggleSound);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Login Form
  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);

  // Password visibility toggle
  const togglePassBtn = document.getElementById('togglePasswordVisibility');
  const passInput = document.getElementById('loginPassword');
  const passEye = document.getElementById('passEyeIcon');
  if (togglePassBtn && passInput && passEye) {
    togglePassBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        passEye.className = 'fa-regular fa-eye-slash text-brand-400';
      } else {
        passInput.type = 'password';
        passEye.className = 'fa-regular fa-eye';
      }
    });
  }

  // Start Realtime Anti-Fraud Clock
  initRealtimeClock();

  // Initialize Dynamic QR
  initDynamicQr();

  // Initial View Setup (Default to Client view for Carlos Mendoza)
  toggleViewMode('client');
});
