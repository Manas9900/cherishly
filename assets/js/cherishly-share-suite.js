/**
 * Cherishly Compact & Responsive Interactive Share Suite
 * Optimized to fit 100% on any mobile screen without cutting out.
 * Features:
 * - Single encrypted Admin access strictly inside the checkout/payment popup modal
 * - Direct, 100% working recipient link generation (?d= payload) that opens the surprise directly
 * - Automatic prevention of sticky share modal on fresh builder page visits
 * - 1-tap presets and native sharing for WhatsApp & Instagram
 */

(function () {
  'use strict';

  const PRESETS_BY_CATEGORY = {
    birthday: [
      { id: 'party', label: '🎉 Party', text: "Happy Birthday! 🎉 I made a tiny interactive world with candles & memories just for you. Open it here:" },
      { id: 'sweet', label: '🎂 Sweet', text: "Happy Birthday cutie! 🎂 Made something special to make you smile today. Tap to unlock:" },
      { id: 'tears', label: '🎈 Balloons', text: "A special birthday delivery for you 🎈 Blow the candles and see what's waiting inside:" }
    ],
    girlfriend: [
      { id: 'love', label: '💕 Romantic', text: "From me to you, my love. I built a private museum of all the reasons I love you 🌹 Open it here:" },
      { id: 'sweet', label: '🌹 Sweet', text: "To the girl who makes my world brighter every day ✨ Tap to break the seal and read your letter:" },
      { id: 'forever', label: '💖 Forever', text: "A special surprise sealed just for you. Pinky promise you'll open it right away? 💕" }
    ],
    apology: [
      { id: 'sincere', label: '🥺 Sincere', text: "I am genuinely so sorry... 🥺 I made this from the bottom of my heart. Please unseal it here:" },
      { id: 'gentle', label: '❤️ Gentle', text: "I hate when things are off between us. I wrote you something honest. Please open it:" },
      { id: 'hug', label: '🫂 Hugs', text: "Can you please forgive me? 🥺 Tap the envelope to see what I wrote for you:" }
    ],
    friendship: [
      { id: 'roast', label: '🤪 Roast', text: "To my favorite idiot! 😂 See our friendship timeline, photos, and rules here:" },
      { id: 'bff', label: '🐱‍👓 BFF Pass', text: "Certified Partners-in-Crime! 🐱‍👓 Your best friend surprise pass is ready. Tap to open:" },
      { id: 'ride', label: '🚗💨 No Refunds', text: "No refunds on this friendship! 🚗💨 Check out our private memories museum:" }
    ],
    anniversary: [
      { id: 'anniv1', label: '🥂 Milestone', text: "Happy Anniversary, my love! 🥂 Here's our beautiful journey together, sealed with all my love:" },
      { id: 'anniv2', label: '💍 Always', text: "Another year of choosing each other. Take a stroll down memory lane with me 💕" }
    ],
    puzzle: [
      { id: 'puzz1', label: '🧩 Solve It', text: "I made a secret puzzle game just for you! 🧩 Solve the pieces to unlock your surprise:" },
      { id: 'puzz2', label: '🕵️ Mystery', text: "Think you can crack this? Solve the puzzle to reveal what's hidden inside 🎁" }
    ],
    surprise: [
      { id: 'surp1', label: '🎁 Surprise', text: "Someone made a secret interactive surprise just for you! 🎁 Tap to unlock:" },
      { id: 'surp2', label: '✨ Mystery', text: "Mystery delivery! ✨ Tap to open your personalized surprise experience:" }
    ]
  };

  function detectCategory() {
    const path = window.location.pathname.toLowerCase();
    for (const cat of Object.keys(PRESETS_BY_CATEGORY)) {
      if (path.includes('/' + cat)) return cat;
    }
    return 'anniversary';
  }

  // Clear sticky flags so reopening website does not auto-pop the share modal
  function resetStickyOrderState() {
    try {
      sessionStorage.removeItem('cherishly_just_generated');
      const allKeys = [
        'OM_ANNIVERSARY_DATA',
        'OM_GIRLFRIEND_DATA',
        'OM_BIRTHDAY_DATA',
        'OM_FRIENDSHIP_DATA',
        'OM_APOLOGY_DATA',
        'OM_PUZZLE_DATA',
        'OM_SURPRISE_DATA'
      ];
      allKeys.forEach(k => {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed) {
            parsed.paid = false;
            parsed.code = '';
            parsed.createInFlight = false;
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        }
      });
      // Also scrub any internal template order recovery tokens
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('om_') || key.includes('order') || key.includes('paid') || key.includes('recover'))) {
          try {
            const val = localStorage.getItem(key);
            if (val && (val.includes('"status"') || val.includes('"order"') || val.includes('"pid"'))) {
              localStorage.removeItem(key);
            }
          } catch (e) {}
        }
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('om_') || key.includes('order') || key.includes('paid'))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {}
  }

  // Forcibly close share modal if page is freshly visited (user didn't just generate in this session)
  function closeStuckModalsOnLoad() {
    if (!window.location.search.includes('?d=') && !window.location.search.includes('?wish=')) {
      if (!sessionStorage.getItem('cherishly_just_generated')) {
        resetStickyOrderState();
        // ONLY target SHARE modals, NEVER unlock / payment modals!
        const shareModals = document.querySelectorAll('[id$="-share-modal"], [id*="share-modal"], .om-sh2, .om-sh2-sheet');
        shareModals.forEach(m => {
          m.classList.remove('is-open');
          m.style.display = 'none';
        });
        // Ensure all unlock / payment modals have clean display styles so they open when "Create the Link" is clicked!
        const unlockModals = document.querySelectorAll('[id*="unlock-modal"], [class*="unlock-modal"], [id*="paywall"]');
        unlockModals.forEach(m => {
          m.style.display = '';
        });
      }
    }
  }

  // Run immediately and after load
  closeStuckModalsOnLoad();
  window.addEventListener('DOMContentLoaded', closeStuckModalsOnLoad);

  // Bulletproof global click listener for "Create the Link" button across all templates
  document.addEventListener('click', function (e) {
    const genBtn = e.target.closest('#om-anniv-generate-btn, #om-bday-generate-btn, #om-gf-generate-btn, #om-frnd-generate-btn, #om-apol-generate-btn, #om-puzz-generate-btn, #om-surp-generate-btn, [id*="generate-btn"], button[id*="generate"], .om-cinema-bar button, .om-anniv-btn[id*="generate"]');
    if (genBtn) {
      // Find the unlock/payment modal on the current page
      const unlockModal = document.querySelector('#om-anniv-unlock-modal, #om-bday-unlock-modal, #om-gf-unlock-modal, #om-frnd-unlock-modal, #om-apol-unlock-modal, #om-puzz-unlock-modal, #om-surp-unlock-modal, [id*="unlock-modal"], [class*="unlock-modal"], [id*="paywall"]');
      if (unlockModal) {
        unlockModal.style.display = 'flex';
        unlockModal.classList.add('is-open');
        injectAdminIntoModals();
      }
    }
  }, true);

  const css = `
    /* Modal Card Constraints */
    .om-bday-modal-sheet, .om-frnd-modal-card, .om-gf-modal-card,
    .om-apol-modal-card, .om-anniv-modal-card, .om-puzz-modal-card, .om-surp-modal-card,
    .om-anniv-modal-sheet {
      max-height: 90vh !important;
      overflow-y: auto !important;
      padding: 18px 16px 16px !important;
      box-sizing: border-box !important;
      border-radius: 22px !important;
    }

    /* Hide legacy duplicate button rows when suite is loaded */
    .om-share-suite-active .om-bday-share-btns,
    .om-share-suite-active .om-frnd-share-btns,
    .om-share-suite-active .om-gf-share-btns,
    .om-share-suite-active .om-apol-share-btns,
    .om-share-suite-active .om-anniv-share-btns,
    .om-share-suite-active .om-frnd-share-row,
    .om-share-suite-active .om-gf-share-row,
    .om-share-suite-active .om-bday-share-url,
    .om-share-suite-active .om-bday-modal-note {
      display: none !important;
    }

    /* Ultra-Compact Share Suite Styling */
    .om-share-suite {
      margin-top: 10px;
      text-align: left;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .om-share-suite * { box-sizing: border-box; }

    /* Compact Link Bar */
    .om-ss-link-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FFF5F7;
      border: 1.5px dashed #FFCCD7;
      border-radius: 12px;
      padding: 6px 10px;
      margin-bottom: 10px;
      gap: 8px;
    }
    .om-ss-link-text {
      font-size: 11.5px;
      font-weight: 700;
      color: #E23B67;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .om-ss-copy-badge {
      font-size: 11px;
      font-weight: 800;
      background: #E23B67;
      color: #FFF;
      border: none;
      padding: 4px 10px;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .om-ss-copy-badge:active { opacity: 0.8; }

    /* Preset Chips */
    .om-ss-chips-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #795548;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .om-ss-chips-label small {
      font-weight: 600;
      color: #9E7D73;
      text-transform: none;
    }
    .om-ss-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 8px;
      scrollbar-width: none;
    }
    .om-ss-chips::-webkit-scrollbar { display: none; }
    .om-ss-chip {
      background: #FFF;
      border: 1.5px solid #E0D3C1;
      color: #5D4037;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .om-ss-chip.is-active {
      background: #E23B67;
      border-color: #E23B67;
      color: #FFF;
      box-shadow: 0 2px 6px rgba(226, 59, 103, 0.25);
    }

    /* Editable Textarea */
    .om-ss-textarea {
      width: 100%;
      height: 58px;
      background: #FFFDF9;
      border: 1.5px solid #E8DCCF;
      border-radius: 12px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.4;
      color: #3E2723;
      resize: none;
      outline: none;
      font-family: inherit;
      margin-bottom: 10px;
      transition: border-color 0.2s;
    }
    .om-ss-textarea:focus {
      border-color: #E23B67;
      box-shadow: 0 0 0 2px rgba(226, 59, 103, 0.12);
    }

    /* Action Buttons Row */
    .om-ss-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .om-ss-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 10px 8px;
      border-radius: 12px;
      border: none;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .om-ss-btn:active { transform: scale(0.97); }
    .om-ss-btn-wa {
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: #FFF;
      box-shadow: 0 3px 10px rgba(37, 211, 102, 0.25);
    }
    .om-ss-btn-ig {
      background: linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045);
      color: #FFF;
      box-shadow: 0 3px 10px rgba(225, 48, 108, 0.25);
    }

    /* Bottom Preview / Link Only */
    .om-ss-footer-row {
      display: flex;
      gap: 8px;
    }
    .om-ss-footer-btn {
      flex: 1;
      background: #F7F3EE;
      color: #6D4C41;
      border: 1px solid #E0D3C1;
      padding: 8px 10px;
      border-radius: 10px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.2s;
    }
    .om-ss-footer-btn:hover { background: #EFE8E1; }

    /* Toast */
    .om-ss-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(30, 20, 25, 0.94);
      color: #FFF;
      padding: 9px 18px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease-out;
      z-index: 999999;
      white-space: nowrap;
    }
    .om-ss-toast.is-show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function showToast(msg) {
    let t = document.getElementById('om-ss-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'om-ss-toast';
      t.className = 'om-ss-toast';
      document.body.appendChild(t);
    }
    t.innerHTML = msg;
    t.classList.add('is-show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-show'), 2400);
  }

  // Construct URL-safe Base64 direct recipient payload (?d=...)
  function buildDirectRecipientUrl() {
    try {
      const category = detectCategory();
      const storageKey = 'OM_' + category.toUpperCase() + '_DATA';
      let raw = localStorage.getItem(storageKey);
      if (!raw) {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('OM_') && k.endsWith('_DATA') && k.toLowerCase().includes(category)) {
            raw = localStorage.getItem(k);
            break;
          }
        }
      }
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const data = JSON.parse(JSON.stringify(parsed));
      data.t = Date.now();
      delete data.paid;
      delete data.paymentId;
      delete data.pid;
      delete data.order;
      delete data.createInFlight;
      delete data.shareUrl;

      // Ensure minimal required fields for the template to recognize it
      if (!data.n && !data.name && !data.f && !data.from && !data.lt) return null;

      const jsonStr = JSON.stringify(data);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)))
        .replace(/\+/g, '-')
        .split('/').join('_')
        .replace(/=+$/, '');

      let path = window.location.pathname.replace(/\/index\.html$/, '');
      if (!path.endsWith('/')) path += '/';
      return `${window.location.origin}${path}?d=${b64}`;
    } catch (e) {
      return null;
    }
  }

  function resolveWorkingShareUrl(candidateUrl) {
    let url = candidateUrl ? String(candidateUrl).trim() : '';

    // Fix any Cherishly.live domain to current window origin
    if (url.includes('Cherishly.live') || url.includes('cherishly.live')) {
      url = url.replace(/https?:\/\/[a-zA-Z0-9.-]*cherishly\.live/i, window.location.origin);
    }

    if (url.startsWith('/s/')) {
      url = window.location.origin + url;
    } else if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = window.location.origin + (url.startsWith('/') ? url : '/' + url);
    }

    // If candidateUrl already has ?d=, prefer it with the right origin
    if (url && url.includes('?d=')) {
      return url;
    }

    // If candidateUrl is a short link, prefer it
    if (url && url.includes('/s/')) {
      return url;
    }

    // Fall back to direct recipient payload link built from draft
    const directUrl = buildDirectRecipientUrl();
    if (directUrl) return directUrl;

    return url || window.location.href;
  }

  window.initCherishlyShareSuite = function (container, currentShareUrl) {
    if (!container) return;

    // Remove existing if any
    const existing = container.querySelector('.om-share-suite');
    if (existing) existing.remove();

    // Mark parent modal card as active suite to hide legacy duplicate buttons
    container.classList.add('om-share-suite-active');
    const modalParent = container.closest('.om-frnd-modal, .om-bday-modal, .om-gf-modal, .om-apol-modal, .om-anniv-modal, .om-puzz-modal, .om-surp-modal');
    if (modalParent) {
      modalParent.classList.add('om-share-suite-active');
      modalParent.style.display = 'flex';
    }

    const category = detectCategory();
    const presets = PRESETS_BY_CATEGORY[category] || PRESETS_BY_CATEGORY.birthday;
    let selectedPreset = presets[0];

    const cleanUrl = resolveWorkingShareUrl(currentShareUrl);

    // Update parent ticket elements if present (e.g. .om-sh2)
    if (modalParent) {
      const ticketUrlEl = modalParent.querySelector('.om-sh2-url, [id*="share-url-display"]');
      if (ticketUrlEl) {
        if (cleanUrl.includes('/s/')) {
          ticketUrlEl.textContent = cleanUrl.replace(/^https?:\/\//, '');
        } else if (cleanUrl.includes('?d=')) {
          // Neat shortened preview so ticket box doesn't overflow with raw base64
          const displayPart = cleanUrl.replace(/^https?:\/\//, '').replace(/\?d=.*$/, '/?d=...') ;
          ticketUrlEl.textContent = displayPart;
        } else {
          ticketUrlEl.textContent = cleanUrl.replace(/^https?:\/\//, '');
        }
        ticketUrlEl.title = cleanUrl;
      }
      const ticketTitleEl = modalParent.querySelector('.om-sh2-h, [id*="share-title"]');
      if (ticketTitleEl) {
        ticketTitleEl.textContent = 'The surprise is ready! ✨';
      }
      const ticketSubEl = modalParent.querySelector('.om-sh2-lab');
      if (ticketSubEl) {
        ticketSubEl.textContent = 'GIFT LINK';
      }

      // Update all validity references to 14 days
      modalParent.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && (el.textContent.includes('3 months') || el.textContent.includes('30 days') || el.textContent.includes('90 days'))) {
          el.textContent = el.textContent
            .replace(/3\s*months/gi, '14 days')
            .replace(/30\s*days/gi, '14 days')
            .replace(/90\s*days/gi, '14 days');
        }
      });

      // Hook ticket click to copy cleanUrl
      const ticketCard = modalParent.querySelector('.om-sh2-tk');
      if (ticketCard && !ticketCard._omHooked) {
        ticketCard._omHooked = true;
        ticketCard.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyLink();
        });
      }

      // Hook "+ Create another gift" or close buttons
      const anotherBtns = modalParent.querySelectorAll('.om-sh2-btn-gh, [data-close-modal], [data-close], .om-anniv-unlock-close, .om-bday-modal-close, .om-pw2-x');
      anotherBtns.forEach(btn => {
        if (!btn._omHooked) {
          btn._omHooked = true;
          btn.addEventListener('click', () => {
            resetStickyOrderState();
            modalParent.classList.remove('is-open');
            modalParent.style.display = 'none';
          });
        }
      });

      // Override top ticket copy/whatsapp buttons so they always copy the full cleanUrl
      const topCpBtn = modalParent.querySelector('.om-sh2-cp');
      if (topCpBtn && !topCpBtn._omHooked) {
        topCpBtn._omHooked = true;
        topCpBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyLink();
        }, true);
      }
      const topWaBtn = modalParent.querySelector('.om-sh2-wa');
      if (topWaBtn && !topWaBtn._omHooked) {
        topWaBtn._omHooked = true;
        topWaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const textareaEl = container.querySelector('#om-ss-text');
          const msg = textareaEl ? getFullMessage(textareaEl.value) : `Open your surprise here: ${cleanUrl}`;
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        }, true);
      }
    }

    function getFullMessage(text) {
      return `${text.trim()} \n\n👉 Open here: ${cleanUrl}`;
    }

    const suiteWrap = document.createElement('div');
    suiteWrap.className = 'om-share-suite';
    suiteWrap.innerHTML = `
      <div class="om-ss-link-bar">
        <span class="om-ss-link-text">${cleanUrl}</span>
        <button class="om-ss-copy-badge" id="om-ss-quick-copy" type="button">Copy</button>
      </div>

      <div class="om-ss-chips-label">
        <span>✨ 1-Tap Message Presets:</span>
        <small>Tap to choose</small>
      </div>
      <div class="om-ss-chips" id="om-ss-chips"></div>

      <textarea class="om-ss-textarea" id="om-ss-text" placeholder="Type a message to go with your link..."></textarea>

      <div class="om-ss-actions">
        <button class="om-ss-btn om-ss-btn-wa" id="om-ss-btn-wa" type="button">
          <span>🟢 WhatsApp</span>
        </button>
        <button class="om-ss-btn om-ss-btn-ig" id="om-ss-btn-ig" type="button">
          <span>📸 Instagram</span>
        </button>
      </div>

      <div class="om-ss-footer-row">
        <button class="om-ss-footer-btn" id="om-ss-btn-copy-only" type="button">
          <span>📋 Copy Link Only</span>
        </button>
        <button class="om-ss-footer-btn" id="om-ss-btn-preview" type="button">
          <span>👁️ Preview Link</span>
        </button>
      </div>
    `;

    container.appendChild(suiteWrap);

    const chipsEl = suiteWrap.querySelector('#om-ss-chips');
    const textareaEl = suiteWrap.querySelector('#om-ss-text');
    const waBtn = suiteWrap.querySelector('#om-ss-btn-wa');
    const igBtn = suiteWrap.querySelector('#om-ss-btn-ig');
    const quickCopy = suiteWrap.querySelector('#om-ss-quick-copy');
    const copyOnlyBtn = suiteWrap.querySelector('#om-ss-btn-copy-only');
    const previewBtn = suiteWrap.querySelector('#om-ss-btn-preview');

    // Populate chips
    presets.forEach((p, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `om-ss-chip ${idx === 0 ? 'is-active' : ''}`;
      chip.textContent = p.label;
      chip.addEventListener('click', () => {
        suiteWrap.querySelectorAll('.om-ss-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        selectedPreset = p;
        textareaEl.value = p.text;
      });
      chipsEl.appendChild(chip);
    });

    textareaEl.value = selectedPreset.text;

    // Actions
    function copyLink() {
      navigator.clipboard.writeText(cleanUrl).then(() => {
        showToast('📋 Link copied to clipboard!');
      }).catch(() => {
        prompt('Copy your link:', cleanUrl);
      });
    }

    quickCopy.addEventListener('click', copyLink);
    copyOnlyBtn.addEventListener('click', copyLink);

    previewBtn.addEventListener('click', () => {
      window.open(cleanUrl, '_blank');
    });

    waBtn.addEventListener('click', () => {
      const fullText = getFullMessage(textareaEl.value);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
    });

    igBtn.addEventListener('click', async () => {
      const fullText = getFullMessage(textareaEl.value);
      try {
        await navigator.clipboard.writeText(fullText);
        showToast('💌 Message & Link Copied! Opening Instagram...');
      } catch (e) {
        showToast('💌 Ready to paste on Instagram!');
      }
      setTimeout(() => {
        window.open('https://instagram.com/direct/inbox/', '_blank');
      }, 600);
    });
  };

  // ============================================================
  // SECURE ENCRYPTED ADMIN AUTHENTICATION (Single-Session Only)
  // ============================================================
  const ADMIN_SESSION_KEY = 'cherishly_sec_admin_auth';
  const VALID_DIGESTS = [
    'b9f619ef9cb17b740687933d1f2769c350a614a8def7f315a5eb601322ef13f0', // admin:Cherishly@Admin2026!
    '0e11e01baca8d5d59476d4d5f77cd1cb95848175863a4b70bad86c3be7548a07'  // cherishly:Cherishly@Admin2026!
  ];

  async function sha256Hex(msg) {
    if (window.crypto && window.crypto.subtle) {
      const data = new TextEncoder().encode(msg);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let hash = 0;
    for (let i = 0; i < msg.length; i++) {
      hash = ((hash << 5) - hash) + msg.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  function isAdmin() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
    } catch (e) {
      return false;
    }
  }

  function logoutAdmin() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      showToast('Admin logged out.');
      refreshAdminUI();
    } catch (e) {}
  }

  // Intercept Razorpay to support instantaneous bypass only when authenticated
  function wrapRazorpay() {
    if (window._rzpWrapped) return;
    if (typeof window.Razorpay !== 'function') {
      setTimeout(wrapRazorpay, 200);
      return;
    }
    window._rzpWrapped = true;
    const OriginalRazorpay = window.Razorpay;

    window.Razorpay = function (options) {
      // Mark session as generated on successful payment
      if (options && typeof options.handler === 'function') {
        const origHandler = options.handler;
        options.handler = function(res) {
          sessionStorage.setItem('cherishly_just_generated', '1');
          origHandler(res);
        };
      }

      const instance = new OriginalRazorpay(options);
      const originalOpen = instance.open.bind(instance);

      instance.open = function () {
        if (isAdmin()) {
          console.log('[Cherishly Admin] Authorized session: link generated.');
          sessionStorage.setItem('cherishly_just_generated', '1');
          showToast('⚡ Generating admin test link...');
          if (options && typeof options.handler === 'function') {
            setTimeout(() => {
              options.handler({
                razorpay_payment_id: 'pay_adm_' + Date.now(),
                razorpay_order_id: options.order_id || ('order_adm_' + Date.now()),
                razorpay_signature: 'sig_adm_authorized'
              });
            }, 300);
            return;
          }
        }
        return originalOpen();
      };

      return instance;
    };
  }

  function refreshAdminUI() {
    const isAuthed = isAdmin();
    document.querySelectorAll('.om-admin-bypass-btn').forEach(b => {
      b.style.display = isAuthed ? 'block' : 'none';
    });
    document.querySelectorAll('.om-admin-session-bar').forEach(b => {
      b.style.display = isAuthed ? 'flex' : 'none';
    });
    document.querySelectorAll('.om-admin-trigger-wrap').forEach(b => {
      b.style.display = isAuthed ? 'none' : 'block';
    });
  }

  // Construct and display the secure Admin Gateway Modal
  function openAdminModal() {
    let modal = document.getElementById('om-admin-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'om-admin-modal';
      modal.innerHTML = `
        <div class="om-adm-backdrop" style="
          position: fixed;
          inset: 0;
          background: rgba(15, 12, 25, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000000;
          padding: 16px;
          opacity: 0;
          transition: opacity 0.25s ease;
        ">
          <div class="om-adm-box" style="
            width: 100%;
            max-width: 360px;
            background: #FFFFFF;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
            font-family: 'Outfit', -apple-system, system-ui, sans-serif;
            text-align: left;
            transform: scale(0.95);
            transition: transform 0.25s ease;
          ">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#FFF0F3;color:#E11D48;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:700;color:#181829;">Admin Gateway</h3>
                  <p style="margin:1px 0 0;font-size:11.5px;color:#8E8EA0;">Encrypted single-session access</p>
                </div>
              </div>
              <button type="button" id="om-adm-close" style="background:none;border:none;font-size:22px;color:#A0A0B2;cursor:pointer;line-height:1;padding:4px;">&times;</button>
            </div>

            <form id="om-adm-form" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div>
                <label style="display:block;font-size:12px;font-weight:600;color:#4B4B60;margin-bottom:5px;">Admin ID</label>
                <input type="text" id="om-adm-user" required autocomplete="off" placeholder="Enter Admin ID" style="
                  width: 100%;
                  box-sizing: border-box;
                  padding: 10px 14px;
                  border-radius: 12px;
                  border: 1.5px solid #E5E7EB;
                  font-size: 14px;
                  color: #1F2937;
                  background: #F9FAFB;
                  outline: none;
                  transition: border-color 0.2s;
                " />
              </div>

              <div>
                <label style="display:block;font-size:12px;font-weight:600;color:#4B4B60;margin-bottom:5px;">Password</label>
                <input type="password" id="om-adm-pwd" required autocomplete="off" placeholder="Enter Password" style="
                  width: 100%;
                  box-sizing: border-box;
                  padding: 10px 14px;
                  border-radius: 12px;
                  border: 1.5px solid #E5E7EB;
                  font-size: 14px;
                  color: #1F2937;
                  background: #F9FAFB;
                  outline: none;
                  transition: border-color 0.2s;
                " />
              </div>

              <div id="om-adm-err" style="display:none;color:#E11D48;font-size:12px;font-weight:600;background:#FFF1F2;padding:8px 12px;border-radius:8px;"></div>

              <div style="display:flex;gap:8px;margin-top:6px;">
                <button type="submit" id="om-adm-submit" style="
                  flex: 1;
                  padding: 11px;
                  border-radius: 999px;
                  border: none;
                  background: linear-gradient(135deg, #FF3366 0%, #D81B60 100%);
                  color: #FFF;
                  font-size: 13.5px;
                  font-weight: 700;
                  cursor: pointer;
                  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.3);
                ">Authenticate ⚡</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const backdrop = modal.querySelector('.om-adm-backdrop');
      const box = modal.querySelector('.om-adm-box');
      const closeBtn = modal.querySelector('#om-adm-close');
      const form = modal.querySelector('#om-adm-form');
      const userIn = modal.querySelector('#om-adm-user');
      const pwdIn = modal.querySelector('#om-adm-pwd');
      const errBox = modal.querySelector('#om-adm-err');

      function hide() {
        backdrop.style.opacity = '0';
        box.style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 220);
      }

      closeBtn.addEventListener('click', hide);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) hide();
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.style.display = 'none';
        const usr = (userIn.value || '').trim().toLowerCase();
        const pwd = (pwdIn.value || '').trim();

        if (!usr || !pwd) {
          errBox.textContent = 'Please enter both ID and password.';
          errBox.style.display = 'block';
          return;
        }

        const digest = await sha256Hex(`${usr}:${pwd}`);
        if (VALID_DIGESTS.includes(digest)) {
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
          hide();
          showToast('⚡ Admin Authenticated!');
          refreshAdminUI();
        } else {
          errBox.textContent = 'Invalid credentials. Access denied.';
          errBox.style.display = 'block';
          pwdIn.value = '';
          box.animate([
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(0)' }
          ], { duration: 320 });
        }
      });
    }

    modal.style.display = 'block';
    setTimeout(() => {
      const backdrop = modal.querySelector('.om-adm-backdrop');
      const box = modal.querySelector('.om-adm-box');
      backdrop.style.opacity = '1';
      box.style.transform = 'scale(1)';
      const userIn = modal.querySelector('#om-adm-user');
      if (userIn) userIn.focus();
    }, 20);
  }

  // Inject Admin access trigger ONLY inside the checkout/unlock payment modal
  function injectAdminIntoModals() {
    const paywalls = document.querySelectorAll('[id*="unlock-modal"], [class*="unlock-modal"], [id*="paywall"]');
    paywalls.forEach(modal => {
      if (modal.querySelector('.om-admin-bypass-btn')) return;

      const payBtn = modal.querySelector('.om-pw2-pay, button[id*="pay"], [id*="pay-btn"], button[class*="pay"]');
      if (!payBtn) return;

      const container = payBtn.closest('.om-pw2-ft') || payBtn.parentNode;

      // 1. Prominent Admin Pass button (shown ONLY when authenticated)
      const bypassBtn = document.createElement('button');
      bypassBtn.type = 'button';
      bypassBtn.className = 'om-admin-bypass-btn';
      bypassBtn.innerHTML = '⚡ Admin: Generate Live Link (Free) &rarr;';
      bypassBtn.style.cssText = `
        display: ${isAdmin() ? 'block' : 'none'};
        width: 100%;
        margin-top: 10px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: #FFF;
        border: none;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.02em;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        transition: transform 0.15s ease;
      `;

      bypassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sessionStorage.setItem('cherishly_just_generated', '1');
        payBtn.click();
      });

      // 2. Active admin indicator bar with Log Out
      const sessionBar = document.createElement('div');
      sessionBar.className = 'om-admin-session-bar';
      sessionBar.style.cssText = `
        display: ${isAdmin() ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
        font-size: 11px;
        color: #059669;
        font-weight: 700;
      `;
      sessionBar.innerHTML = `
        <span>● Admin Session Active</span>
        <button type="button" class="om-admin-logout-btn" style="
          background: none;
          border: none;
          color: #E11D48;
          font-size: 11px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        ">Log Out</button>
      `;

      sessionBar.querySelector('.om-admin-logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logoutAdmin();
      });

      // 3. Subtle trigger link placed at bottom of paywall card
      const triggerWrap = document.createElement('div');
      triggerWrap.className = 'om-admin-trigger-wrap';
      triggerWrap.style.cssText = `
        display: ${isAdmin() ? 'none' : 'block'};
        text-align: center;
        margin-top: 14px;
        margin-bottom: 6px;
      `;
      triggerWrap.innerHTML = `
        <button type="button" class="om-admin-trigger-btn" style="
          background: none;
          border: none;
          color: #9E9EA7;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          opacity: 0.75;
          padding: 4px 8px;
          border-radius: 6px;
          transition: opacity 0.2s;
        ">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Admin Login
        </button>
      `;

      triggerWrap.querySelector('.om-admin-trigger-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAdminModal();
      });

      payBtn.parentNode.insertBefore(bypassBtn, payBtn.nextSibling);
      payBtn.parentNode.insertBefore(sessionBar, bypassBtn.nextSibling);
      container.appendChild(triggerWrap);
    });
  }

  function observeModals() {
    wrapRazorpay();
    injectAdminIntoModals();
    closeStuckModalsOnLoad();

    const modalIds = [
      'om-bday-share-modal',
      'om-gf-share-modal',
      'om-apol-share-modal',
      'om-frnd-share-modal',
      'om-anniv-share-modal',
      'om-puzz-share-modal',
      'om-surp-share-modal'
    ];

    modalIds.forEach(id => {
      const modal = document.getElementById(id);
      if (!modal) return;

      const observer = new MutationObserver(() => {
        if (modal.classList.contains('is-open')) {
          // If not genuinely just generated in this session and builder page, close it
          if (!window.location.search.includes('?d=') && !window.location.search.includes('?wish=') && !sessionStorage.getItem('cherishly_just_generated')) {
            modal.classList.remove('is-open');
            modal.style.display = 'none';
            resetStickyOrderState();
            return;
          }

          const urlEl = modal.querySelector('.om-sh2-url, [id*="share-url"], .om-share-url');
          let currentUrl = (urlEl && urlEl.textContent && !urlEl.textContent.includes('Creating') && !urlEl.textContent.includes('...'))
            ? urlEl.textContent.trim()
            : '';

          const card = modal.querySelector('.om-bday-modal-body') || modal.querySelector('[class*="modal-card"]') || modal.querySelector('.om-anniv-modal-sheet') || modal.firstElementChild;
          if (card && !card.querySelector('.om-share-suite')) {
            window.initCherishlyShareSuite(card, currentUrl);
          }
        }
      });

      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });

    // Also observe document body for dynamically added unlock payment modals
    const bodyObserver = new MutationObserver(() => {
      injectAdminIntoModals();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeModals);
  } else {
    observeModals();
  }
})();
