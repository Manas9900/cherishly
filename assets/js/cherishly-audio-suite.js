/**
 * Cherishly Unified Audio & Song Suite
 * Features:
 * 1. Live Voice Recording via MediaRecorder with live timer, waveform & retry
 * 2. Dedicated Song / Audio File Upload (MP3, M4A, WAV, etc.) from device
 * 3. Cloudflare Worker R2 Upload with Base64 Data URL offline fallback
 * 4. Recipient Showcase: Animated Dancing Pookie Meme + Floating Flower Stream
 * 5. Automatic Background Music Ducking / Auto-Pause during dedicated audio playback
 */

(function (window, document) {
  'use strict';

  var BACKEND_URL = 'https://cherishly-backend.manas0000singh.workers.dev/wp-json/om/v1/upload-voice';

  // Inject unified styles once
  var styleId = 'cherishly-audio-suite-styles';
  if (!document.getElementById(styleId)) {
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Cherishly Audio Suite Styles */
      .om-as-box {
        width: 100%;
        margin: 12px 0 16px;
        box-sizing: border-box;
        font-family: inherit;
      }
      .om-as-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        background: rgba(0, 0, 0, 0.05);
        padding: 4px;
        border-radius: 999px;
      }
      .om-as-tab {
        flex: 1;
        padding: 9px 12px;
        border-radius: 999px;
        border: none;
        background: transparent;
        font-size: 13px;
        font-weight: 700;
        color: #64748B;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .om-as-tab.is-active {
        background: #FFFFFF;
        color: #0F172A;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .om-as-panel {
        display: none;
        background: rgba(255, 255, 255, 0.85);
        border: 1.5px dashed rgba(203, 213, 225, 0.8);
        border-radius: 18px;
        padding: 16px;
        text-align: center;
        box-sizing: border-box;
      }
      .om-as-panel.is-active {
        display: block;
      }

      /* Record panel */
      .om-as-rec-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 999px;
        padding: 6px 12px;
      }
      .om-as-rec-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 999px;
        border: none;
        background: #E11D48;
        color: #FFF;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.2s ease;
      }
      .om-as-rec-btn:active {
        transform: scale(0.96);
      }
      .om-as-rec-btn.is-recording {
        background: #DC2626;
        animation: om-rec-pulse 1.2s infinite;
      }
      @keyframes om-rec-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
      }
      .om-as-rec-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #FFF;
      }
      .om-as-rec-wave {
        display: flex;
        align-items: center;
        gap: 3px;
        height: 20px;
      }
      .om-as-rec-wave span {
        width: 3px;
        height: 6px;
        background: #CBD5E1;
        border-radius: 3px;
        transition: height 0.15s ease;
      }
      .om-as-rec-wave.is-live span {
        background: #E11D48;
        animation: om-wave-bar 0.8s ease-in-out infinite alternate;
      }
      .om-as-rec-wave.is-live span:nth-child(1) { animation-delay: 0.1s; }
      .om-as-rec-wave.is-live span:nth-child(2) { animation-delay: 0.3s; }
      .om-as-rec-wave.is-live span:nth-child(3) { animation-delay: 0.2s; }
      .om-as-rec-wave.is-live span:nth-child(4) { animation-delay: 0.4s; }
      .om-as-rec-wave.is-live span:nth-child(5) { animation-delay: 0.15s; }
      @keyframes om-wave-bar {
        0% { height: 4px; }
        100% { height: 18px; }
      }
      .om-as-timer {
        font-size: 13px;
        font-weight: 700;
        color: #475569;
        font-variant-numeric: tabular-nums;
      }
      .om-as-mini-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #E2E8F0;
        color: #1E293B;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .om-as-mini-btn:hover {
        background: #CBD5E1;
      }

      /* Song Upload Panel */
      .om-as-dropzone {
        cursor: pointer;
        padding: 18px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .om-as-drop-icon {
        font-size: 32px;
        line-height: 1;
      }
      .om-as-drop-t {
        font-size: 14px;
        font-weight: 700;
        color: #1E293B;
      }
      .om-as-drop-s {
        font-size: 12px;
        color: #64748B;
      }
      .om-as-upload-btn {
        margin-top: 8px;
        padding: 8px 18px;
        border-radius: 999px;
        border: none;
        background: #0F172A;
        color: #FFF;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .om-as-spinner {
        display: inline-block;
        width: 22px;
        height: 22px;
        border: 2.5px solid #CBD5E1;
        border-top-color: #E11D48;
        border-radius: 50%;
        animation: om-spin 0.8s linear infinite;
        margin-bottom: 8px;
      }
      @keyframes om-spin {
        to { transform: rotate(360deg); }
      }

      /* Ready Audio Card (shared by builder preview & recipient view) */
      .om-as-ready-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 10px 14px;
        text-align: left;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      }
      .om-as-play-btn {
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%);
        color: #FFF;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(225, 29, 72, 0.3);
        transition: transform 0.15s ease;
      }
      .om-as-play-btn:active {
        transform: scale(0.92);
      }
      .om-as-card-info {
        flex: 1 1 auto;
        min-width: 0;
      }
      .om-as-card-name {
        display: block;
        font-size: 13.5px;
        font-weight: 700;
        color: #1E293B;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .om-as-card-sub {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        color: #64748B;
        margin-top: 2px;
      }
      .om-as-bars {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        height: 12px;
      }
      .om-as-bars i {
        display: inline-block;
        width: 2px;
        height: 4px;
        background: #94A3B8;
        border-radius: 1px;
        transition: height 0.15s ease;
      }
      .om-as-ready-card.is-playing .om-as-bars i {
        background: #E11D48;
        animation: om-bar-pulse 0.7s infinite alternate ease-in-out;
      }
      .om-as-ready-card.is-playing .om-as-bars i:nth-child(1) { animation-delay: 0.1s; }
      .om-as-ready-card.is-playing .om-as-bars i:nth-child(2) { animation-delay: 0.3s; }
      .om-as-ready-card.is-playing .om-as-bars i:nth-child(3) { animation-delay: 0.15s; }
      .om-as-ready-card.is-playing .om-as-bars i:nth-child(4) { animation-delay: 0.4s; }
      .om-as-ready-card.is-playing .om-as-bars i:nth-child(5) { animation-delay: 0.25s; }
      @keyframes om-bar-pulse {
        0% { height: 3px; }
        100% { height: 12px; }
      }
      .om-as-del-btn {
        flex: 0 0 auto;
        border: none;
        background: none;
        color: #94A3B8;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
      }
      .om-as-del-btn:hover {
        color: #EF4444;
      }

      /* Recipient Showcase: Dancing Pookie Meme + Flowers */
      .om-as-showcase {
        position: relative;
        width: 100%;
        max-width: 360px;
        margin: 18px auto;
        box-sizing: border-box;
      }
      .om-as-pookie-box {
        position: relative;
        width: 100%;
        min-height: 130px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 0;
        overflow: hidden;
      }
      .om-as-pookie-dance {
        width: 95px;
        height: 95px;
        object-fit: contain;
        filter: drop-shadow(0 6px 14px rgba(225, 29, 72, 0.25));
        transform-origin: center bottom;
        transition: transform 0.25s ease;
      }
      .om-as-showcase.is-playing .om-as-pookie-dance {
        animation: om-pookie-dance 0.55s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
      }
      @keyframes om-pookie-dance {
        0% { transform: scale(1) translateY(0) rotate(-5deg); }
        50% { transform: scale(1.08) translateY(-9px) rotate(5deg); }
        100% { transform: scale(1) translateY(0) rotate(-5deg); }
      }
      .om-as-flower-stream {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .om-as-fl {
        position: absolute;
        font-size: 20px;
        opacity: 0;
        user-select: none;
      }
      .om-as-showcase.is-playing .om-as-fl {
        animation: om-fl-drift 2.8s linear infinite;
      }
      .om-as-fl.f1 { left: 10%; animation-delay: 0s; }
      .om-as-fl.f2 { left: 26%; animation-delay: 1.1s; }
      .om-as-fl.f3 { left: 74%; animation-delay: 0.5s; }
      .om-as-fl.f4 { left: 88%; animation-delay: 1.7s; }
      .om-as-fl.f5 { left: 44%; animation-delay: 2.2s; }
      .om-as-fl.f6 { left: 58%; animation-delay: 0.8s; }
      @keyframes om-fl-drift {
        0% { bottom: -15px; opacity: 0; transform: scale(0.6) rotate(0deg); }
        20% { opacity: 0.95; transform: scale(1.1) rotate(45deg); }
        75% { opacity: 0.85; transform: scale(1.15) rotate(180deg) translateX(8px); }
        100% { bottom: 95%; opacity: 0; transform: scale(0.7) rotate(360deg) translateX(-8px); }
      }
      .om-as-pookie-wreath {
        font-size: 13px;
        letter-spacing: 6px;
        margin-top: 4px;
        opacity: 0.85;
      }
      .om-as-err {
        font-size: 12px;
        color: #DC2626;
        margin-top: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // Audio Ducking Manager: cleanly pauses and resumes all background music
  function duckBackgroundMusic(shouldDuck, currentAudio) {
    var audios = document.querySelectorAll('audio');
    audios.forEach(function (a) {
      if (a !== currentAudio) {
        if (shouldDuck) {
          if (!a.paused) {
            a.__omWasPlaying = true;
            try { a.pause(); } catch (e) {}
          }
        } else {
          if (a.__omWasPlaying) {
            a.__omWasPlaying = false;
            try { a.play(); } catch (e) {}
          }
        }
      }
    });

    // Also support custom template audio controllers if present
    if (window._0x4a00a7 && typeof window._0x4a00a7.duck === 'function') {
      try { window._0x4a00a7.duck('vnote', shouldDuck); } catch (e) {}
    }
  }

  // Builder Audio Component
  function initVoiceAndSongBuilder(container, options) {
    if (!container) return;
    options = options || {};

    var activeAudio = null;
    var mediaRecorder = null;
    var recordedChunks = [];
    var recTimerInterval = null;
    var recSeconds = 0;
    var maxSeconds = options.maxSeconds || 60;

    var currentData = {
      url: (options.initial && options.initial.url) || '',
      name: (options.initial && options.initial.name) || '',
      isSong: !!(options.initial && options.initial.isSong)
    };

    container.innerHTML = `
      <div class="om-as-box">
        <div class="om-as-tabs">
          <button type="button" class="om-as-tab is-active" data-mode="rec">
            <span>🎙️</span> Record Voice
          </button>
          <button type="button" class="om-as-tab" data-mode="song">
            <span>🎵</span> Upload Song / Audio
          </button>
        </div>

        <!-- 1. Voice Record Panel -->
        <div class="om-as-panel is-active" data-panel="rec">
          <div class="om-as-rec-row">
            <button type="button" class="om-as-rec-btn" id="om-as-rec-action">
              <span class="om-as-rec-dot"></span>
              <span class="om-as-rec-txt">Record</span>
            </button>
            <div class="om-as-rec-wave" id="om-as-rec-wave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <span class="om-as-timer" id="om-as-timer">up to ${maxSeconds}s</span>
          </div>
          <p class="om-as-err" id="om-as-rec-err" style="display:none"></p>
        </div>

        <!-- 2. Song File Upload Panel -->
        <div class="om-as-panel" data-panel="song">
          <input type="file" id="om-as-song-input" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.webm" style="display:none">
          <div class="om-as-dropzone" id="om-as-dropzone">
            <div class="om-as-drop-icon">🎵</div>
            <div class="om-as-drop-t">Choose an audio file or song</div>
            <div class="om-as-drop-s">MP3, M4A, WAV, OGG — tap to browse</div>
            <button type="button" class="om-as-upload-btn" id="om-as-browse-btn">Select Music File &rarr;</button>
          </div>
          <div id="om-as-uploading" style="display:none;padding:16px;">
            <div class="om-as-spinner"></div>
            <div style="font-size:12.5px;font-weight:700;color:#1E293B">Saving your audio file...</div>
          </div>
          <p class="om-as-err" id="om-as-song-err" style="display:none"></p>
        </div>

        <!-- 3. Audio Ready Preview Player -->
        <div id="om-as-preview-wrap" style="display:none;margin-top:10px;">
          <div class="om-as-ready-card" id="om-as-preview-card">
            <button type="button" class="om-as-play-btn" id="om-as-prev-play">&#9654;</button>
            <div class="om-as-card-info">
              <span class="om-as-card-name" id="om-as-prev-name">Audio Note</span>
              <div class="om-as-card-sub">
                <span id="om-as-prev-meta">Ready to play</span>
                <span class="om-as-bars">
                  <i></i><i></i><i></i><i></i><i></i>
                </span>
              </div>
            </div>
            <button type="button" class="om-as-del-btn" id="om-as-prev-del" title="Remove audio">&times;</button>
          </div>
        </div>
      </div>
    `;

    var tabRec = container.querySelector('[data-mode="rec"]');
    var tabSong = container.querySelector('[data-mode="song"]');
    var panelRec = container.querySelector('[data-panel="rec"]');
    var panelSong = container.querySelector('[data-panel="song"]');

    var recActionBtn = container.querySelector('#om-as-rec-action');
    var recTxt = container.querySelector('.om-as-rec-txt');
    var recWave = container.querySelector('#om-as-rec-wave');
    var timerEl = container.querySelector('#om-as-timer');
    var recErr = container.querySelector('#om-as-rec-err');

    var songInput = container.querySelector('#om-as-song-input');
    var dropzone = container.querySelector('#om-as-dropzone');
    var browseBtn = container.querySelector('#om-as-browse-btn');
    var uploadingBox = container.querySelector('#om-as-uploading');
    var songErr = container.querySelector('#om-as-song-err');

    var previewWrap = container.querySelector('#om-as-preview-wrap');
    var previewCard = container.querySelector('#om-as-preview-card');
    var prevPlayBtn = container.querySelector('#om-as-prev-play');
    var prevNameEl = container.querySelector('#om-as-prev-name');
    var prevMetaEl = container.querySelector('#om-as-prev-meta');
    var prevDelBtn = container.querySelector('#om-as-prev-del');

    function stopActiveAudio() {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
      duckBackgroundMusic(false);
      if (previewCard) previewCard.classList.remove('is-playing');
      if (prevPlayBtn) prevPlayBtn.innerHTML = '&#9654;';
    }

    function switchMode(mode) {
      stopActiveAudio();
      if (mode === 'song') {
        tabSong.classList.add('is-active');
        tabRec.classList.remove('is-active');
        panelSong.classList.add('is-active');
        panelRec.classList.remove('is-active');
      } else {
        tabRec.classList.add('is-active');
        tabSong.classList.remove('is-active');
        panelRec.classList.add('is-active');
        panelSong.classList.remove('is-active');
      }
    }

    tabRec.addEventListener('click', function () { switchMode('rec'); });
    tabSong.addEventListener('click', function () { switchMode('song'); });

    function showReadyPreview(url, name, isSong) {
      currentData.url = url;
      currentData.name = name;
      currentData.isSong = !!isSong;

      prevNameEl.textContent = name || (isSong ? 'Dedicated Song' : 'Voice Note');
      prevMetaEl.textContent = isSong ? 'Song ready 🎵' : 'Voice note recorded 🎙️';
      previewWrap.style.display = 'block';

      if (options.onSave) {
        options.onSave({ url: url, name: name, isSong: !!isSong });
      }
    }

    // Play/Pause preview
    prevPlayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!currentData.url) return;

      if (!activeAudio || activeAudio.src !== currentData.url) {
        stopActiveAudio();
        activeAudio = new Audio(currentData.url);
        activeAudio.addEventListener('ended', function () {
          stopActiveAudio();
        });
      }

      if (activeAudio.paused) {
        duckBackgroundMusic(true, activeAudio);
        activeAudio.play().then(function () {
          prevPlayBtn.innerHTML = '&#10074;&#10074;';
          previewCard.classList.add('is-playing');
        }).catch(function () {
          stopActiveAudio();
        });
      } else {
        stopActiveAudio();
      }
    });

    // Delete audio
    prevDelBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      stopActiveAudio();
      currentData.url = '';
      currentData.name = '';
      currentData.isSong = false;
      previewWrap.style.display = 'none';
      if (songInput) songInput.value = '';
      timerEl.textContent = `up to ${maxSeconds}s`;
      recActionBtn.classList.remove('is-recording');
      recTxt.textContent = 'Record';
      recWave.classList.remove('is-live');

      if (options.onDelete) options.onDelete();

      // Clear draft hash so refreshing will not reload deleted audio
      if (window.location.hash && window.location.hash.includes('#draft=')) {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {}
      }
    });

    // --- MediaRecorder Recording Logic ---
    function formatTime(s) {
      var m = Math.floor(s / 60);
      var rem = s % 60;
      return m + ':' + (rem < 10 ? '0' : '') + rem;
    }

    function startRecording() {
      recErr.style.display = 'none';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recErr.textContent = 'Microphone access is not supported by this browser.';
        recErr.style.display = 'block';
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          recordedChunks = [];
          var mime = 'audio/webm;codecs=opus';
          if (!window.MediaRecorder.isTypeSupported(mime)) {
            mime = 'audio/webm';
            if (!window.MediaRecorder.isTypeSupported(mime)) {
              mime = 'audio/mp4';
              if (!window.MediaRecorder.isTypeSupported(mime)) {
                mime = '';
              }
            }
          }

          try {
            mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
          }

          mediaRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = function () {
            stream.getTracks().forEach(function (track) { track.stop(); });
            var blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            saveRecordedBlob(blob);
          };

          mediaRecorder.start(250);
          recSeconds = 0;
          timerEl.textContent = '0:00';
          recActionBtn.classList.add('is-recording');
          recTxt.textContent = 'Stop & Save';
          recWave.classList.add('is-live');

          recTimerInterval = setInterval(function () {
            recSeconds++;
            timerEl.textContent = formatTime(recSeconds);
            if (recSeconds >= maxSeconds) {
              stopRecording();
            }
          }, 1000);
        })
        .catch(function (err) {
          console.warn('[Cherishly Audio] Mic permission denied:', err);
          recErr.textContent = 'Microphone permission was denied. Please allow microphone in browser settings.';
          recErr.style.display = 'block';
        });
    }

    function stopRecording() {
      if (recTimerInterval) {
        clearInterval(recTimerInterval);
        recTimerInterval = null;
      }
      recActionBtn.classList.remove('is-recording');
      recTxt.textContent = 'Record';
      recWave.classList.remove('is-live');

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }

    recActionBtn.addEventListener('click', function () {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
      } else {
        startRecording();
      }
    });

    function saveRecordedBlob(blob) {
      recTxt.textContent = 'Saving...';
      var fd = new FormData();
      var ext = (blob.type && blob.type.includes('mp4')) ? 'm4a' : 'webm';
      var filename = 'voice_' + Date.now() + '.' + ext;
      fd.append('audio', blob, filename);
      fd.append('file', blob, filename);

      fetch(BACKEND_URL, {
        method: 'POST',
        body: fd
      })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json && json.success && json.data && (json.data.url || json.data.display_url)) {
          var url = json.data.display_url || json.data.url;
          recTxt.textContent = 'Record';
          showReadyPreview(url, 'Voice Note (' + formatTime(recSeconds) + ')', false);
        } else {
          throw new Error('Upload unsuccessful');
        }
      })
      .catch(function (err) {
        console.warn('[Cherishly Audio] Backend upload failed, using inline Data URL fallback:', err);
        var reader = new FileReader();
        reader.onloadend = function () {
          recTxt.textContent = 'Record';
          if (reader.result) {
            showReadyPreview(reader.result, 'Voice Note (' + formatTime(recSeconds) + ')', false);
          } else {
            recErr.textContent = 'Could not save voice recording. Please try again.';
            recErr.style.display = 'block';
          }
        };
        reader.readAsDataURL(blob);
      });
    }

    // --- Song File Upload Logic ---
    function handleFile(file) {
      if (!file) return;
      songErr.style.display = 'none';

      if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|ogg|aac|webm)$/i.test(file.name)) {
        songErr.textContent = 'Please choose an audio file (MP3, M4A, WAV, etc.)';
        songErr.style.display = 'block';
        return;
      }

      dropzone.style.display = 'none';
      uploadingBox.style.display = 'block';

      var fd = new FormData();
      fd.append('audio', file, file.name);
      fd.append('song', file, file.name);
      fd.append('file', file, file.name);

      fetch(BACKEND_URL, {
        method: 'POST',
        body: fd
      })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json && json.success && json.data && (json.data.url || json.data.display_url)) {
          var url = json.data.display_url || json.data.url;
          uploadingBox.style.display = 'none';
          dropzone.style.display = 'flex';
          showReadyPreview(url, file.name, true);
        } else {
          throw new Error('Upload error');
        }
      })
      .catch(function (err) {
        console.warn('[Cherishly Audio] Song upload failed, falling back to Data URL:', err);
        var reader = new FileReader();
        reader.onloadend = function () {
          uploadingBox.style.display = 'none';
          dropzone.style.display = 'flex';
          if (reader.result) {
            showReadyPreview(reader.result, file.name, true);
          } else {
            songErr.textContent = 'Could not load audio file. Please try another.';
            songErr.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    dropzone.addEventListener('click', function () { songInput.click(); });
    browseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      songInput.click();
    });
    songInput.addEventListener('change', function () {
      if (songInput.files && songInput.files[0]) {
        handleFile(songInput.files[0]);
      }
    });

    // Drag and drop support
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.style.background = '#EFF6FF';
    });
    dropzone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dropzone.style.background = 'transparent';
    });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.style.background = 'transparent';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Restore if already provided
    if (currentData.url) {
      if (currentData.isSong) switchMode('song');
      showReadyPreview(currentData.url, currentData.name, currentData.isSong);
    }
  }

  // Recipient Showcase Component (Dancing Pookie Meme + Flowers + Dedicated Audio Player)
  function renderRecipientShowcase(container, config) {
    if (!container) return;
    config = config || {};
    var audioUrl = config.audioUrl;
    if (!audioUrl) return;

    var stickerSrc = config.stickerSrc || '../assets/stickers/cute kitten/cat-dance-cat.webp';
    var title = config.title || (config.isSong ? 'Dedicated Song 🎵' : 'Dedicated Voice Note 🎙️');

    container.innerHTML = `
      <div class="om-as-showcase" id="om-as-showcase">
        <div class="om-as-pookie-box">
          <div class="om-as-flower-stream" aria-hidden="true">
            <span class="om-as-fl f1">🌸</span>
            <span class="om-as-fl f2">💐</span>
            <span class="om-as-fl f3">🌷</span>
            <span class="om-as-fl f4">🌼</span>
            <span class="om-as-fl f5">🌺</span>
            <span class="om-as-fl f6">🌹</span>
          </div>
          <div class="om-as-pookie-center" style="display:flex;flex-direction:column;align-items:center;">
            <img src="${stickerSrc}" alt="Dancing Pookie Meme" class="om-as-pookie-dance" id="om-as-pookie-img">
            <div class="om-as-pookie-wreath">🌸 🌼 🌷 🌹</div>
          </div>
        </div>

        <div class="om-as-ready-card" id="om-as-recip-card">
          <button type="button" class="om-as-play-btn" id="om-as-recip-play" aria-label="Play dedicated audio">&#9654;</button>
          <div class="om-as-card-info">
            <span class="om-as-card-name">${title}</span>
            <div class="om-as-card-sub">
              <span id="om-as-recip-status">Tap to play</span>
              <span class="om-as-bars">
                <i></i><i></i><i></i><i></i><i></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    var showcaseEl = container.querySelector('#om-as-showcase');
    var playBtn = container.querySelector('#om-as-recip-play');
    var cardEl = container.querySelector('#om-as-recip-card');
    var statusEl = container.querySelector('#om-as-recip-status');
    var audio = new Audio(audioUrl);

    function stopPlayback() {
      audio.pause();
      playBtn.innerHTML = '&#9654;';
      showcaseEl.classList.remove('is-playing');
      cardEl.classList.remove('is-playing');
      statusEl.textContent = 'Tap to play';
      duckBackgroundMusic(false, audio);
    }

    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) {
        duckBackgroundMusic(true, audio);
        audio.play().then(function () {
          playBtn.innerHTML = '&#10074;&#10074;';
          showcaseEl.classList.add('is-playing');
          cardEl.classList.add('is-playing');
          statusEl.textContent = 'Playing with love...';
        }).catch(function () {
          stopPlayback();
        });
      } else {
        stopPlayback();
      }
    });

    audio.addEventListener('ended', function () {
      stopPlayback();
    });

    audio.addEventListener('error', function () {
      statusEl.textContent = 'Could not load audio';
      stopPlayback();
    });
  }

  // Global inline audio player handler for raw song links across all templates
  var globalInlineAudio = null;
  var activeAudioBtn = null;

  function handleInlineSongClick(e) {
    var btn = e.target.closest('a[href*=".mp3"], a[href*=".wav"], a[href*=".m4a"], a[href*=".ogg"], a[href*="/photos/voices/"], .om-anniv-songlink, [id*="songlink"], [class*="songlink"]');
    if (!btn) return;

    var href = btn.getAttribute('href') || (btn.dataset && btn.dataset.audioUrl) || '';
    if (!href || href.includes('spotify.com') || href.includes('youtube.com') || href.includes('youtu.be')) {
      return; // Let external streaming platforms open naturally
    }

    // It is a direct audio file or voice note - play inline!
    e.preventDefault();
    e.stopPropagation();

    if (globalInlineAudio && !globalInlineAudio.paused && activeAudioBtn === btn) {
      globalInlineAudio.pause();
      btn.innerHTML = btn.dataset.origText || '▶ Play our song 🎵';
      return;
    }

    if (globalInlineAudio) {
      globalInlineAudio.pause();
      if (activeAudioBtn && activeAudioBtn !== btn) {
        activeAudioBtn.innerHTML = activeAudioBtn.dataset.origText || '▶ Play our song 🎵';
      }
    }

    if (!btn.dataset.origText) {
      btn.dataset.origText = btn.innerHTML;
    }

    activeAudioBtn = btn;
    globalInlineAudio = new Audio(href);

    globalInlineAudio.addEventListener('play', function () {
      btn.innerHTML = '⏸ Pause our song 🎵';
      duckBackgroundMusic(true);
    });

    globalInlineAudio.addEventListener('pause', function () {
      btn.innerHTML = btn.dataset.origText || '▶ Play our song 🎵';
      duckBackgroundMusic(false);
    });

    globalInlineAudio.addEventListener('ended', function () {
      btn.innerHTML = btn.dataset.origText || '▶ Play our song 🎵';
      duckBackgroundMusic(false);
    });

    globalInlineAudio.addEventListener('error', function () {
      btn.innerHTML = btn.dataset.origText || '▶ Play our song 🎵';
      duckBackgroundMusic(false);
      window.open(href, '_blank', 'noopener,noreferrer');
    });

    globalInlineAudio.play().catch(function () {
      // If autoplay blocked, fall back to new tab
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  }

  document.addEventListener('click', handleInlineSongClick, true);

  // Export to window
  window.CherishlyAudioSuite = {
    initBuilder: initVoiceAndSongBuilder,
    renderRecipient: renderRecipientShowcase,
    duckBackgroundMusic: duckBackgroundMusic
  };

})(window, document);
