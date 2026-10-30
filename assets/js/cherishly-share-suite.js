/**
 * Cherishly Compact & Responsive Interactive Share Suite
 * Optimized to fit 100% on any mobile screen without cutting out.
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
    return 'birthday';
  }

  const css = `
    /* Modal Card Constraints */
    .om-bday-modal-sheet, .om-frnd-modal-card, .om-gf-modal-card,
    .om-apol-modal-card, .om-anniv-modal-card, .om-puzz-modal-card, .om-surp-modal-card {
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

  window.initCherishlyShareSuite = function (container, currentShareUrl) {
    if (!container) return;

    // Remove existing if any
    const existing = container.querySelector('.om-share-suite');
    if (existing) existing.remove();

    // Mark parent modal card as active suite to hide legacy duplicate buttons
    container.classList.add('om-share-suite-active');
    const modalParent = container.closest('.om-frnd-modal, .om-bday-modal, .om-gf-modal, .om-apol-modal, .om-anniv-modal, .om-puzz-modal, .om-surp-modal');
    if (modalParent) modalParent.classList.add('om-share-suite-active');

    const category = detectCategory();
    const presets = PRESETS_BY_CATEGORY[category] || PRESETS_BY_CATEGORY.birthday;
    let selectedPreset = presets[0];

    const cleanUrl = currentShareUrl || window.location.href;

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

  function observeModals() {
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
          const urlEl = modal.querySelector('[id*="share-url"]') || modal.querySelector('.om-share-url');
          let currentUrl = (urlEl && urlEl.textContent && !urlEl.textContent.includes('Creating'))
            ? urlEl.textContent.trim()
            : window.location.href;

          const card = modal.querySelector('.om-bday-modal-body') || modal.querySelector('[class*="modal-card"]') || modal.firstElementChild;
          if (card && !card.querySelector('.om-share-suite')) {
            window.initCherishlyShareSuite(card, currentUrl);
          }
        }
      });

      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeModals);
  } else {
    observeModals();
  }
})();
