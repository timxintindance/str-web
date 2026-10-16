// The Str Spa Customer Portal - JavaScript Core

let globalMasters = [];
let currentRegion = '全部';
let selectedMaster = null;
let selectedDate = null;
let selectedTime = null;
let lineBotId = '@960wphcq';

// 價格定義
const BASE_PRICE = 2800; // 100min
const ADDON_TIME_PRICE = 600; // +30min
let studioFee = 400; // 西門預設

document.addEventListener('DOMContentLoaded', async () => {
  await fetchConfig();
  await loadMasters();
  initDateList();
  calculatePrice();
});

// 1. 取得全域配置
async function fetchConfig() {
  lineBotId = '@960wphcq';
}

// 2. 載入並渲染師傅清單
async function loadMasters() {
  try {
    const res = await fetch('data/masters_profile.json?v=' + Date.now());
    const masters = await res.json();
    if (masters && Array.isArray(masters)) {
      globalMasters = masters;
      renderMasters(globalMasters);
      populateMasterSelect(globalMasters);
    }
  } catch (e) {
    console.error('Failed to load masters:', e);
  }
}

// 渲染師傅卡片形象牆 (WonderSpa 風格)
function renderMasters(masters) {
  const container = document.getElementById('masters-grid');
  container.innerHTML = '';

  const filtered = currentRegion === '全部' 
    ? masters 
    : masters.filter(m => m.region.includes(currentRegion) || (m.regions && m.regions.includes(currentRegion)));

  filtered.forEach((m, idx) => {
    const photos = m.photos || [];
    const picsJson = encodeURIComponent(JSON.stringify(photos));

    let imagesHtml = '';
    photos.forEach((pic, pIdx) => {
      imagesHtml += `
        <div class="relative w-full h-full flex-shrink-0 snap-center cursor-pointer bg-slate-950" onclick="openLightbox('${picsJson}', ${pIdx})">
          <img src="${pic}" class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" alt="${m.name}">
        </div>
      `;
    });

    let dotsHtml = '';
    if (photos.length > 1) {
      dotsHtml = `<div id="dots-${idx}" class="flex gap-1 justify-center absolute bottom-2 left-0 right-0 z-10">`;
      photos.forEach((_, i) => {
        dotsHtml += `<div class="dot ${i === 0 ? 'active' : ''}"></div>`;
      });
      dotsHtml += `</div>`;
    }

    const card = `
      <div class="glass-card glass-card-interactive flex flex-col overflow-hidden group">
        <!-- 輪播相簿容器 -->
        <div class="relative w-full aspect-[4/5] overflow-hidden bg-slate-950">
          <div class="snap-carousel w-full h-full" onscroll="handleCardScroll(this, ${idx})">
            ${imagesHtml}
          </div>
          <div class="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-amber-500/30">
            ${m.region}
          </div>
          ${dotsHtml}
        </div>

        <!-- 師傅資料 -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex justify-between items-center mb-2">
              <h4 class="text-base font-extrabold text-white tracking-wide">${m.name}</h4>
            </div>

            <!-- 身材數據標籤 -->
            <div class="flex flex-wrap gap-1 mb-1">
              ${m.height ? `<span class="text-[10px] bg-slate-800 text-gray-300 px-2 py-0.5 rounded-md border border-slate-700">身高 ${m.height}cm</span>` : ''}
              ${m.weight ? `<span class="text-[10px] bg-slate-800 text-gray-300 px-2 py-0.5 rounded-md border border-slate-700">體重 ${m.weight}kg</span>` : ''}
              ${m.age ? `<span class="text-[10px] bg-slate-800 text-gray-300 px-2 py-0.5 rounded-md border border-slate-700">${m.age}歲</span>` : ''}
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="pt-2 border-t border-white/5">
            <button onclick="selectMasterForBooking('${m.name}')" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer">
              <i class="fas fa-calendar-check text-[11px]"></i>
              <span>指定預約</span>
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// 監聽輪播指示點
window.handleCardScroll = function(elem, idx) {
  const scrollLeft = elem.scrollLeft;
  const width = elem.clientWidth;
  const index = Math.round(scrollLeft / width);
  const dotsContainer = document.getElementById(`dots-${idx}`);
  if (dotsContainer) {
    const dots = dotsContainer.children;
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === index);
    }
  }
};

// 地區切換
window.filterRegion = function(reg) {
  currentRegion = reg;
  document.querySelectorAll('.region-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes(reg) || (reg === '全部' && btn.innerText === '全部師傅'));
    btn.classList.toggle('bg-blue-600', btn.classList.contains('active'));
    btn.classList.toggle('text-white', btn.classList.contains('active'));
    btn.classList.toggle('bg-slate-800', !btn.classList.contains('active'));
  });
  renderMasters(globalMasters);
};

// 填充預約表單的師傅選項
function populateMasterSelect(masters) {
  const sel = document.getElementById('booking-master-select');
  sel.innerHTML = '<option value="" disabled selected>請選擇師傅</option>';
  masters.forEach(m => {
    sel.innerHTML += `<option value="${m.name}">${m.name} (${m.region} · ${m.height}cm/${m.weight}kg)</option>`;
  });
}

// 點擊「指定預約」快捷填入並滾動至表單
window.selectMasterForBooking = function(name) {
  selectedMaster = name;
  const sel = document.getElementById('booking-master-select');
  sel.value = name;
  onMasterSelected();
  document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
};

function onMasterSelected() {
  const sel = document.getElementById('booking-master-select');
  selectedMaster = sel.value;
  if (selectedDate) {
    loadSlotsForDate(selectedDate);
  }
  updateSummary();
}

// 地點切換
window.onLocationChange = function() {
  const locRadios = document.getElementsByName('location-type');
  let chosen = '西門工作室';
  for (let r of locRadios) {
    if (r.checked) chosen = r.value;
  }
  const customBox = document.getElementById('custom-address-box');
  if (chosen === '外出到府') {
    studioFee = 0;
    if (customBox) customBox.classList.remove('hidden');
  } else if (chosen === '西門工作室') {
    studioFee = 400;
    if (customBox) customBox.classList.add('hidden');
  } else if (chosen === '台中工作室') {
    studioFee = 300;
    if (customBox) customBox.classList.add('hidden');
  }
  calculatePrice();
  buildPreviewText();
};

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// 計算總價 (含工作室清潔費、加時與 23:00~06:00 深夜加成)
window.calculatePrice = function() {
  const addonChecked = document.getElementById('addon-time')?.checked || false;
  let total = BASE_PRICE + studioFee + (addonChecked ? ADDON_TIME_PRICE : 0);
  
  let isMidnight = false;
  if (selectedTime) {
    const [h] = selectedTime.split(':').map(Number);
    if (h >= 23 || h < 6) {
      isMidnight = true;
      total += 500;
    }
  }

  const duration = addonChecked ? 130 : 100;
  document.getElementById('summary-duration-text').innerText = duration;
  document.getElementById('sum-duration').innerText = `${duration} 分鐘`;
  
  const breakdownHint = isMidnight ? ' (含深夜加成 $500)' : '';
  document.getElementById('sum-total-price').innerText = `NT$ ${total.toLocaleString()}${breakdownHint}`;
  document.getElementById('selected-service-badge').innerText = `${duration}分鐘 · NT$ ${total.toLocaleString()}${breakdownHint}`;
  return { total, duration, isMidnight };
};

// 3. 步驟引導 Wizard (1 -> 2 -> 3)
window.goToStep = function(step) {
  try {
    if (step === 2) {
      if (!selectedMaster) {
        const masterSel = document.getElementById('booking-master-select');
        if (masterSel && masterSel.options.length > 1) {
          masterSel.selectedIndex = 1;
          selectedMaster = masterSel.value;
          onMasterSelected();
        } else if (globalMasters && globalMasters.length > 0) {
          selectedMaster = globalMasters[0].name;
          onMasterSelected();
        }
      }
      if (!selectedDate) {
        selectDate(document.querySelector('.date-pill')?.dataset.date);
      }
    } else if (step === 3) {
      if (!selectedTime) {
        const firstAvail = document.querySelector('.slot-box:not(.locked)');
        if (firstAvail) {
          firstAvail.click();
        } else {
          selectedTime = '時段由專人確認';
        }
      }
    }
  } catch (err) {
    console.error('goToStep pre-check error:', err);
  }

  // 切換步驟畫面
  const s1 = document.getElementById('step-content-1');
  const s2 = document.getElementById('step-content-2');
  const s3 = document.getElementById('step-content-3');
  if (s1) s1.classList.toggle('hidden', step !== 1);
  if (s2) s2.classList.toggle('hidden', step !== 2);
  if (s3) s3.classList.toggle('hidden', step !== 3);

  // 節點高亮
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`step-node-${i}`);
    if (node) {
      node.className = `step-node ${i < step ? 'completed' : i === step ? 'current' : 'pending'}`;
    }
  }

  try {
    buildPreviewText();
  } catch (e) {
    console.error('buildPreviewText on step change error:', e);
  }

  const targetSec = document.getElementById('booking-section');
  if (targetSec) {
    window.scrollTo({ top: targetSec.offsetTop - 60, behavior: 'smooth' });
  }
};

// 4. 日期橫向捲軸初始化 (生成未來 14 天)
function initDateList() {
  const container = document.getElementById('date-scroll-list');
  if (!container) return;
  container.innerHTML = '';

  const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const today = new Date();

  const monthEl = document.getElementById('current-month-text');
  if (monthEl) {
    monthEl.innerText = `${today.getFullYear()}年 ${today.getMonth() + 1}月`;
  }

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayLabel = i === 0 ? '今天' : dayNames[d.getDay()];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `date-pill flex-shrink-0 px-3.5 py-2.5 rounded-xl border text-center transition-all ${
      i === 0 ? 'bg-blue-600 border-blue-400 text-white font-bold' : 'bg-slate-800 border-slate-700 text-gray-300 hover:border-slate-500'
    }`;
    btn.dataset.date = dateStr;
    btn.onclick = () => selectDate(dateStr, btn);

    btn.innerHTML = `
      <span class="block text-[10px] text-gray-400 font-semibold">${dayLabel}</span>
      <span class="block text-sm font-extrabold mt-0.5">${d.getDate()}</span>
    `;

    container.appendChild(btn);
    if (i === 0) {
      selectedDate = dateStr;
    }
  }

  if (selectedDate) {
    loadSlotsForDate(selectedDate);
  }
}

function selectDate(dateStr, btnElement) {
  selectedDate = dateStr;
  document.querySelectorAll('.date-pill').forEach(b => {
    const isTarget = b.dataset.date === dateStr;
    b.className = `date-pill flex-shrink-0 px-3.5 py-2.5 rounded-xl border text-center transition-all ${
      isTarget ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-md shadow-blue-600/30' : 'bg-slate-800 border-slate-700 text-gray-300 hover:border-slate-500'
    }`;
  });
  loadSlotsForDate(dateStr);
  updateSummary();
}

// 5. 載入該日該師傅的時段空檔 (支援每 30 分鐘排程，純靜態全時段開放)
async function loadSlotsForDate(dateStr) {
  const container = document.getElementById('slots-grid-container');
  if (!container) return;

  try {
    container.innerHTML = '';
    let slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        slots.push({ time: `${hh}:${mm}`, status: 'available' });
      }
    }

    // 依營業時間順序排序
    slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    const addonChecked = document.getElementById('addon-time')?.checked || false;
    const currentDuration = addonChecked ? 130 : 100;

    // 自動預選：優先選晚間熱門時段 20:00，若無則選第一個可用時段
    const availableSlots = slots.filter(s => s.status === 'available');
    const isCurrentTimeAvailable = availableSlots.some(s => s.time === selectedTime);
    if (!isCurrentTimeAvailable && availableSlots.length > 0) {
      const preferred = availableSlots.find(s => s.time === '20:00') || availableSlots.find(s => s.time === '19:00') || availableSlots.find(s => s.time === '15:00') || availableSlots[0];
      selectedTime = preferred.time;
    }

    slots.forEach(s => {
      const isLocked = s.status === 'locked' || s.status === 'pending';
      const isAvailable = s.status === 'available';
      const isSelected = (selectedTime === s.time);
      
      const box = document.createElement('div');
      box.className = `slot-box p-2.5 text-center cursor-pointer transition-all ${isLocked ? 'locked' : ''} ${isSelected ? 'active' : ''}`;
      
      // 動態計算服務結束時間
      const [h, m] = s.time.split(':').map(Number);
      const endTotalMin = h * 60 + m + currentDuration;
      const endH = String(Math.floor(endTotalMin / 60) % 24).padStart(2, '0');
      const endM = String(endTotalMin % 60).padStart(2, '0');

      box.innerHTML = `
        <span class="block text-xs font-mono font-bold tracking-wider">${s.time}</span>
        <span class="block text-[9px] mt-0.5 ${isLocked ? 'text-gray-500' : isSelected ? 'text-white' : 'text-blue-400'}">
          ${isLocked ? '已約滿' : isSelected ? '已選中' : '可預約'}
        </span>
      `;

      if (isAvailable) {
        box.onclick = () => {
          document.querySelectorAll('.slot-box').forEach(sb => {
            sb.classList.remove('active');
            const subText = sb.querySelector('span:last-child');
            if (subText && !sb.classList.contains('locked')) {
              subText.className = 'block text-[9px] mt-0.5 text-blue-400';
              subText.innerText = '可預約';
            }
          });
          box.classList.add('active');
          const mySub = box.querySelector('span:last-child');
          if (mySub) {
            mySub.className = 'block text-[9px] mt-0.5 text-white';
            mySub.innerText = '已選中';
          }
          selectedTime = s.time;
          updateSummary();
          buildPreviewText();
        };
      }

      container.appendChild(box);
    });

    updateSummary();
    buildPreviewText();

  } catch (e) {
    console.error('Failed to load slots:', e);
    container.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-red-400">時段載入失敗</div>';
  }
}

function updateSummary() {
  const { total, duration, isMidnight } = calculatePrice();
  if (selectedDate && selectedTime) {
    const sumDateEl = document.getElementById('sum-datetime');
    if (sumDateEl) sumDateEl.innerText = `${selectedDate} ${selectedTime}`;
    const finalDateEl = document.getElementById('final-sum-datetime');
    if (finalDateEl) finalDateEl.innerText = `${selectedDate} ${selectedTime}`;
  }
  const sumDurEl = document.getElementById('final-sum-duration');
  if (sumDurEl) sumDurEl.innerText = `${duration} 分鐘`;
  const breakdown = isMidnight ? ' (含深夜加成 $500)' : '';
  const finalPriceEl = document.getElementById('final-sum-price');
  if (finalPriceEl) finalPriceEl.innerText = `NT$ ${total.toLocaleString()}${breakdown}`;
}

// 6. 拼裝預約預覽文字
function buildPreviewText() {
  const { total, duration } = calculatePrice();
  const notes = (document.getElementById('cust-notes')?.value || '').trim() || '無';
  const custName = (document.getElementById('cust-name')?.value || '').trim();

  let locationText = '台北西門工作室';
  let locType = '西門工作室';
  const locRadios = document.getElementsByName('location-type');
  for (let r of locRadios) {
    if (r.checked) locType = r.value;
  }
  if (locType === '台中工作室') {
    locationText = '台中工作室';
  } else if (locType === '外出到府') {
    const customAddr = document.getElementById('custom-address-input')?.value.trim();
    locationText = customAddr ? `外出服務 (${customAddr})` : '外出服務 (待專人確認地址)';
  } else {
    locationText = '台北西門工作室';
  }

  const durationNote = duration > 100 ? ` (${duration}min)` : '';
  const noteContent = custName ? `${custName} / ${notes}` : notes;

  const preview = 
`師傅：${selectedMaster || ''}
日期：${selectedDate || ''}
時間：${selectedTime || ''}${durationNote}
服務城市：${selectedMaster ? getMasterRegion(selectedMaster) : '台北'}
服務地點：${locationText}
費用：NT$ ${total.toLocaleString()}
備註：${noteContent}`;

  const preEl = document.getElementById('booking-preview-text');
  if (preEl) preEl.innerText = preview;

  // 計算並預先綁定 LINE 喚醒 URL 到主按鈕 href
  const encodedText = encodeURIComponent(preview);
  let cleanBotId = (lineBotId || '@960wphcq').trim();
  if (!cleanBotId.startsWith('@')) cleanBotId = '@' + cleanBotId;
  const encodedBotId = encodeURIComponent(cleanBotId);
  const lineOaUrl = `https://line.me/R/oaMessage/${encodedBotId}/?${encodedText}`;

  const mainBtn = document.getElementById('btn-line-dispatch-main');
  if (mainBtn) mainBtn.href = lineOaUrl;
  const modalBtn = document.getElementById('btn-open-line-url');
  if (modalBtn) modalBtn.href = lineOaUrl;

  return preview;
}

function getMasterRegion(mName) {
  const m = globalMasters.find(x => x.name.toLowerCase() === mName.toLowerCase());
  if (m && m.regions && m.regions.length > 0) return m.regions[0];
  if (m && m.region) return m.region.split('/')[0];
  return '台北';
}

window.copyPreviewText = function() {
  const text = document.getElementById('booking-preview-text').innerText;
  const showSuccess = () => {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3500);
    } else {
      alert('已成功複製預約內容！請直接在 LINE 聊天室貼上送出。');
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
      fallbackCopy(text, showSuccess);
    });
  } else {
    fallbackCopy(text, showSuccess);
  }
};

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    cb();
  } catch (e) {
    alert('已為您選取文字，請長按複製！');
  }
  document.body.removeChild(ta);
}

// 7. LINE 送出 ＆ 內部出單閉環
window.submitBookingToLine = function(event) {
  const previewText = buildPreviewText();
  const { total, duration } = calculatePrice();
  const notes = (document.getElementById('cust-notes')?.value || '').trim();
  const custName = (document.getElementById('cust-name')?.value || '').trim();

  let locationText = '台北西門工作室';
  const locRadios = document.getElementsByName('location-type');
  for (let r of locRadios) {
    if (r.checked) {
      if (r.value === '台中工作室') locationText = '台中工作室';
      else if (r.value === '外出到府') {
        const addr = document.getElementById('custom-address-input')?.value.trim();
        locationText = addr ? `外出服務 (${addr})` : '外出服務';
      }
    }
  }

  // A. 剪貼簿複製並顯示提示
  copyPreviewText();

  // B. 計算 LINE 喚醒 URL
  const encodedText = encodeURIComponent(previewText);
  let cleanBotId = (lineBotId || '@960wphcq').trim();
  if (!cleanBotId.startsWith('@')) cleanBotId = '@' + cleanBotId;
  const encodedBotId = encodeURIComponent(cleanBotId);
  const lineOaUrl = `https://line.me/R/oaMessage/${encodedBotId}/?${encodedText}`;

  // 更新彈窗連結
  const modalBtn = document.getElementById('btn-open-line-url');
  if (modalBtn) modalBtn.href = lineOaUrl;

  // 顯示跳轉提示彈窗，確保萬一瀏覽器擋跳轉客人也能點擊
  const modal = document.getElementById('line-redirect-modal');
  if (modal) modal.classList.remove('hidden');

  // C. 原生跳轉喚醒 LINE App
  setTimeout(() => {
    window.location.href = lineOaUrl;
  }, 250);
};

window.closeLineRedirectModal = function() {
  document.getElementById('line-redirect-modal').classList.add('hidden');
};

// 8. 燈箱 (Lightbox)
let currentLightboxPics = [];
let currentLightboxIdx = 0;

window.openLightbox = function(picsJson, startIndex) {
  currentLightboxPics = JSON.parse(decodeURIComponent(picsJson));
  currentLightboxIdx = startIndex;
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const dots = document.getElementById('lightbox-dots');

  img.src = currentLightboxPics[startIndex];
  dots.innerHTML = '';
  currentLightboxPics.forEach((_, i) => {
    dots.innerHTML += `<div class="dot ${i === startIndex ? 'active' : ''}"></div>`;
  });

  modal.classList.remove('hidden');
};

window.closeLightbox = function() {
  document.getElementById('lightbox-modal').classList.add('hidden');
};

// 9. 評價 Modal (WonderSpa Style)
window.openReviewModal = async function(mName) {
  document.getElementById('review-modal-master-name').innerText = mName;
  const list = document.getElementById('review-list-container');
  list.innerHTML = '<div class="py-6 text-center text-xs text-gray-400">載入評價中...</div>';
  document.getElementById('review-modal').classList.remove('hidden');

  try {
    const res = await fetch(`/api/reviews/${mName}`);
    const data = await res.json();
    document.getElementById('review-modal-score').innerText = `⭐ ${data.average_rating || 10.0} 滿分推薦 (${data.review_count || 0}則好評)`;

    list.innerHTML = '';
    if (!data.reviews || data.reviews.length === 0) {
      list.innerHTML = '<p class="text-center text-gray-500 py-6 text-xs">目前尚無評價</p>';
      return;
    }

    data.reviews.forEach(r => {
      list.innerHTML += `
        <div class="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="font-bold text-white">${r.name}</span>
            <span class="text-[10px] text-gray-400">${r.date}</span>
          </div>
          <div class="flex gap-2 text-[10px]">
            <span class="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">技術 ${r.rating1}</span>
            <span class="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">服務 ${r.rating2}</span>
          </div>
          <p class="text-gray-300 leading-relaxed pt-1">${r.comment}</p>
        </div>
      `;
    });
  } catch (e) {
    list.innerHTML = '<p class="text-center text-red-400 py-4 text-xs">評價載入失敗</p>';
  }
};

window.closeReviewModal = function() {
  document.getElementById('review-modal').classList.add('hidden');
};

// 10. 匯款後五碼回報 Modal
window.openRemitModal = function() {
  document.getElementById('remit-modal').classList.remove('hidden');
};
window.closeRemitModal = function() {
  document.getElementById('remit-modal').classList.add('hidden');
};

window.submitRemitReport = async function() {
  const phone = document.getElementById('remit-phone').value.trim();
  const digits = document.getElementById('remit-digits').value.trim();
  if (!phone || !digits || digits.length < 4) {
    alert('請輸入正確的手機號碼與後五碼！');
    return;
  }

  try {
    const res = await fetch('/api/remit_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, five_digits: digits })
    });
    const data = await res.json();
    alert(data.message || '後五碼已成功回報！');
    closeRemitModal();
  } catch (e) {
    alert('回報失敗，請直接在 LINE 告知小編！');
  }
};
