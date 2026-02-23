// ============================================
// 1. 상수 정의 (한 곳에서 관리)
// ============================================

const RARITY_TIERS = {
  1: { label: "COMMON", sub: "Standard record", color: "rgba(255,255,255,0.55)" },
  2: { label: "UNCOMMON", sub: "Above average", color: "rgba(255,255,255,0.75)" },
  3: { label: "RARE", sub: "Uncommon record", color: "rgba(0,246,255,0.9)" },
  4: { label: "EPIC", sub: "Rare record", color: "rgba(112,0,255,0.9)" },
  5: { label: "LEGENDARY", sub: "Very rare record", color: "rgba(255,0,222,0.9)" }
};

const ACHIEVEMENT_TOAST_CONFIG = {
  position: { top: "22px", left: "50%" },
  duration: 2000,
  fadeOutDuration: 320,
  style: {
    padding: "14px 18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,0,222,0.35)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    fontFamily: "monospace",
    maxWidth: "420px",
    textAlign: "center",
    boxShadow: "0 0 25px rgba(255,0,222,0.25)"
  }
};

// ============================================
// 2. 상태 관리 (모든 UI 상태 한곳에서)
// ============================================

const AchievementState = {
  filter: "all",      // all | unlocked | locked
  sort: "recent",     // recent | name | rarity | progress
  search: "",
  selectedId: null,
  
  reset() {
    this.filter = "all";
    this.sort = "recent";
    this.search = "";
    this.selectedId = null;
  }
};

// ============================================
// 3. 유틸리티 함수 (재사용 가능)
// ============================================

/** 희귀도 정보 조회 */
function getRarityInfo(rarity = 1) {
  return RARITY_TIERS[Math.max(1, Math.min(5, rarity))] || RARITY_TIERS[1];
}

/** 업적 해금 여부 */
function isAchievementUnlocked(achievementId) {
  return !!unlocked[achievementId];
}

/** 업적 필터링 & 정렬 */
function getFilteredAchievements() {
  let items = [...ACHIEVEMENTS];

  // 필터
  if (AchievementState.filter === "unlocked") {
    items = items.filter(a => isAchievementUnlocked(a.id));
  } else if (AchievementState.filter === "locked") {
    items = items.filter(a => !isAchievementUnlocked(a.id));
  }

  // 검색
  if (AchievementState.search) {
    const q = AchievementState.search.toLowerCase();
    items = items.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q)
    );
  }

  // 정렬
  switch (AchievementState.sort) {
    case "name":
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "rarity":
      items.sort((a, b) => (b.rarity || 1) - (a.rarity || 1));
      break;
    case "recent":
      items.sort((a, b) => {
        const aTime = unlocked[a.id]?.t || 0;
        const bTime = unlocked[b.id]?.t || 0;
        return bTime - aTime;
      });
      break;
  }

  return items;
}

// ============================================
// 4. DOM 생성 (깔끔한 템플릿)
// ============================================

/** 업적 리스트 아이템 HTML 생성 */
function createAchievementRowHTML(achievement) {
  const isUnlocked = isAchievementUnlocked(achievement.id);
  const rarity = getRarityInfo(achievement.rarity);
  const isSelected = AchievementState.selectedId === achievement.id;

  return `
    <div class="achv-row ${isUnlocked ? "" : "achv-locked"} ${isSelected ? "selected" : ""}"
         data-achievement-id="${achievement.id}">
      <div class="achv-icon" style="${isUnlocked ? "" : "filter: grayscale(0.2);"}">
        ${achievement.icon || "🏆"}
      </div>
      <div class="achv-info">
        <div class="achv-name">${achievement.name}</div>
        <div class="achv-desc">${achievement.desc}</div>
        <div class="achv-rarity" style="color: ${rarity.color};">
          ${rarity.label}
        </div>
      </div>
    </div>
  `;
}

/** 업적 상세 정보 HTML 생성 */
function createAchievementDetailHTML(achievement) {
  if (!achievement) return "";

  const isUnlocked = isAchievementUnlocked(achievement.id);
  const rarity = getRarityInfo(achievement.rarity);
  const unlockedData = unlocked[achievement.id];

  return `
    <div class="achv-detail-content">
      <div class="flex items-center justify-between mb-4">
        <div style="font-size: 32px;">${achievement.icon || "🏆"}</div>
        <div class="text-right">
          <div style="color: ${rarity.color}; font-weight: bold;">
            ${rarity.label}
          </div>
          <div style="font-size: 12px; opacity: 0.7;">
            ${rarity.sub}
          </div>
        </div>
      </div>

      <div class="mb-4 border-b border-white/10 pb-4">
        <h3 class="text-lg font-bold">${achievement.name}</h3>
        <p class="text-sm opacity-75 mt-2">${achievement.desc}</p>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-xs opacity-60">Status</div>
          <div style="color: ${isUnlocked ? "var(--vapor-blue)" : "rgba(255,255,255,0.6)"}; font-weight: bold;">
            ${isUnlocked ? "UNLOCKED" : "LOCKED"}
          </div>
        </div>
        <div>
          <div class="text-xs opacity-60">Unlocked Date</div>
          <div>${isUnlocked ? new Date(unlockedData.t).toLocaleString() : "—"}</div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-white/5 rounded border border-white/10">
        <div class="text-xs opacity-60 mb-2">How to Unlock</div>
        <div class="text-sm">${achievement.how || "Play more protocols to discover the requirement."}</div>
      </div>
    </div>
  `;
}

// ============================================
// 5. 렌더 함수 (최적화)
// ============================================

/** 메인 업적 리스트 렌더 */
function renderAchievementList() {
  const listEl = document.getElementById("achievement-list");
  if (!listEl) return;

  const items = getFilteredAchievements();

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="p-6 text-sm opacity-60 text-center">
        No achievements matched your filters.
      </div>
    `;
    return;
  }

  listEl.innerHTML = items.map(createAchievementRowHTML).join("");

  // 각 행에 클릭 리스너 추가
  listEl.querySelectorAll(".achv-row").forEach(row => {
    row.addEventListener("click", () => {
      const id = row.dataset.achievementId;
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      selectAchievement(id);
      displayAchievementDetail(achievement);
    });
  });
}

/** 업적 통계 업데이트 */
function updateAchievementStats() {
  const total = ACHIEVEMENTS.length;
  const unlocked_count = ACHIEVEMENTS.filter(a => isAchievementUnlocked(a.id)).length;
  const percentage = total > 0 ? Math.round((unlocked_count / total) * 100) : 0;

  const totalEl = document.getElementById("achv-total-count");
  const unlockedEl = document.getElementById("achv-unlocked-count");
  const percentEl = document.getElementById("achv-percent");
  const barEl = document.getElementById("achv-progress-bar");

  if (totalEl) totalEl.textContent = total;
  if (unlockedEl) unlockedEl.textContent = unlocked_count;
  if (percentEl) percentEl.textContent = percentage + "%";
  if (barEl) barEl.style.width = percentage + "%";
}

/** 업적 상세 정보 표시 */
function displayAchievementDetail(achievement) {
  if (!achievement) {
    document.getElementById("achv-detail-empty").classList.remove("hidden");
    document.getElementById("achv-detail").classList.add("hidden");
    return;
  }

  document.getElementById("achv-detail-empty").classList.add("hidden");
  const detailEl = document.getElementById("achv-detail");
  detailEl.innerHTML = createAchievementDetailHTML(achievement);
  detailEl.classList.remove("hidden");
}

/** 선택된 업적 업데이트 */
function selectAchievement(id) {
  const wasSelected = AchievementState.selectedId === id;
  AchievementState.selectedId = wasSelected ? null : id;

  document.querySelectorAll(".achv-row").forEach(row => {
    row.classList.toggle("selected", row.dataset.achievementId === id && !wasSelected);
  });
}

/** 전체 업적 렌더 */
function renderAchievements() {
  updateAchievementStats();
  renderAchievementList();
}

// ============================================
// 6. 이벤트 바인딩 (한 번만)
// ============================================

function bindAchievementEvents() {
  const btnAll = document.getElementById("achv-filter-all");
  const btnUnlocked = document.getElementById("achv-filter-unlocked");
  const btnLocked = document.getElementById("achv-filter-locked");
  const sortSelect = document.getElementById("achv-sort");
  const searchInput = document.getElementById("achv-search");
  const resetBtn = document.getElementById("achv-reset");

  if (!btnAll || btnAll.dataset.bound === "1") return;
  btnAll.dataset.bound = "1";

  // 필터 버튼
  btnAll.addEventListener("click", () => {
    AchievementState.filter = "all";
    updateFilterButtons();
    renderAchievements();
  });

  btnUnlocked.addEventListener("click", () => {
    AchievementState.filter = "unlocked";
    updateFilterButtons();
    renderAchievements();
  });

  btnLocked.addEventListener("click", () => {
    AchievementState.filter = "locked";
    updateFilterButtons();
    renderAchievements();
  });

  // 정렬
  sortSelect.addEventListener("change", (e) => {
    AchievementState.sort = e.target.value;
    renderAchievements();
  });

  // 검색
  searchInput.addEventListener("input", (e) => {
    AchievementState.search = e.target.value.trim().toLowerCase();
    renderAchievements();
  });

  // 리셋
  resetBtn.addEventListener("click", () => {
    AchievementState.reset();
    sortSelect.value = "recent";
    searchInput.value = "";
    updateFilterButtons();
    renderAchievements();
  });

  // 상세 보기 닫기
  const closeDetailBtn = document.getElementById("achv-detail-close");
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
      AchievementState.selectedId = null;
      document.getElementById("achv-detail-empty").classList.remove("hidden");
      document.getElementById("achv-detail").classList.add("hidden");
    });
  }
}

/** 필터 버튼 상태 업데이트 */
function updateFilterButtons() {
  const btnAll = document.getElementById("achv-filter-all");
  const btnUnlocked = document.getElementById("achv-filter-unlocked");
  const btnLocked = document.getElementById("achv-filter-locked");

  btnAll.classList.toggle("active", AchievementState.filter === "all");
  btnUnlocked.classList.toggle("active", AchievementState.filter === "unlocked");
  btnLocked.classList.toggle("active", AchievementState.filter === "locked");
}

// ============================================
// 7. 업적 해금 시스템
// ============================================

function unlockAchievement(id) {
  if (unlocked[id]) return;
  unlocked[id] = { t: Date.now() };
  saveAchievements();
  showAchievementToast(id);
}

function showAchievementToast(id) {
  const achievement = ACHIEVEMENTS.find(x => x.id === id);
  if (!achievement) return;

  const div = document.createElement("div");

  // 스타일 적용
  Object.assign(div.style, {
    position: "fixed",
    top: ACHIEVEMENT_TOAST_CONFIG.position.top,
    left: ACHIEVEMENT_TOAST_CONFIG.position.left,
    transform: "translateX(-50%)",
    zIndex: "99999",
    ...ACHIEVEMENT_TOAST_CONFIG.style
  });

  div.innerHTML = `
    <div style="font-size:10px; letter-spacing:0.35em; color: rgba(255,0,222,0.9); text-transform: uppercase;">
      ACHIEVEMENT UNLOCKED
    </div>
    <div style="margin-top:6px; font-size:18px; font-weight:900;">${achievement.name}</div>
    <div style="margin-top:4px; font-size:12px; opacity:0.75;">${achievement.desc}</div>
  `;

  document.body.appendChild(div);

  // 애니메이션
  div.animate(
    [
      { transform: "translateX(-50%) translateY(-20px)", opacity: "0" },
      { transform: "translateX(-50%) translateY(0)", opacity: "1" }
    ],
    { duration: 260, easing: "cubic-bezier(0.175,0.885,0.32,1.275)" }
  );

  // 자동 제거
  setTimeout(() => {
    div.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: ACHIEVEMENT_TOAST_CONFIG.fadeOutDuration, easing: "ease" }
    ).onfinish = () => div.remove();
  }, ACHIEVEMENT_TOAST_CONFIG.duration);
}

// ============================================
// 8. 초기화 함수
// ============================================

function initializeAchievements() {
  bindAchievementEvents();
  renderAchievements();
}

// 게임 종료 시 업적 체크
function checkAchievementsOnEnd(finalRank, accVal) {
  if (gameMode === "single") {
    if (stats.paradox === 0) unlockAchievement("PARADOX_FREE");
    if (stats.miss === 0) unlockAchievement("PERFECT_RECALL");
    if (finalRank === "SSS") unlockAchievement("SSS_SYNC");
  }
}
