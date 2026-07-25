<template>
  <main
    v-if="activePage !== 'play'"
    id="titleScreen"
    ref="appRootElement"
    class="title-screen"
    :class="{
      'panel-open': activePanel !== 'landing',
      'tutorial-active': tutorialActive,
      'is-browser-fullscreen': isImmersiveViewport,
    }"
    :data-viewport-mode="mobileViewportMode"
    :data-font-size="settings.fontSize"
    :data-font-family="settings.fontFamily"
    :data-layout="settings.layout"
    :data-panel="settings.panel"
    :style="mobileViewportStyle"
    aria-label="Màn hình tiêu đề Hoa Chưa Nở"
  >
    <img class="title-bg" :src="titleBgUrl" alt="" />
    <div class="vignette" />
    <div class="mist" />
    <svg class="rain-lines" viewBox="0 0 1366 768" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="rainFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fff2de" stop-opacity="0" />
          <stop offset="0.48" stop-color="#fff2de" stop-opacity="0.5" />
          <stop offset="1" stop-color="#fff2de" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="M338 0v760M402 0v760M718 0v760M846 0v760M1016 0v760" stroke="url(#rainFade)" stroke-width="1" />
    </svg>

    <div class="top-name">Mihiraki no Hana</div>
    <div class="shell-window-actions">
      <button class="icon-button" type="button" title="Thu gọn giao diện" @click="closeFrontend">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <button
        class="fullscreen-button icon-button"
        type="button"
        :title="fullscreenButtonTitle"
        :aria-label="fullscreenButtonTitle"
        :aria-pressed="isImmersiveViewport"
        :disabled="!fullscreenSupported"
        @click="toggleBrowserFullscreen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            v-if="isImmersiveViewport"
            d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <button
      v-if="mobileViewportMode === 'mobile-landscape' && activePanel !== 'landing'"
      class="mobile-panel-back"
      type="button"
      :disabled="busy"
      aria-label="Quay lại lớp trước"
      @click="closeMobileTitlePanel"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <span>Quay lại</span>
    </button>

    <section class="title-copy">
      <small>Kinh doanh và gặp gỡ ôn tuyền hiện đại</small>
      <h1>Hoa Chưa Nở</h1>
      <p class="subtitle">Sương đêm bám lấy hành lang gỗ, ánh đèn dần sáng lên từ bên bể tắm. Chọn thân phận, rồi giao đêm nay cho tiếng nước.</p>
    </section>

    <nav class="main-menu" aria-label="Menu tiêu đề">
      <button
        v-for="item in titleMenuItems"
        :key="item.key"
        class="menu-button"
        :class="{ 'is-active': item.key === activePanel || (item.key === 'start' && activePanel === 'modes') }"
        type="button"
        :disabled="busy"
        @click="handleTitleMenu(item.key)"
      >
        {{ item.label }}
      </button>
    </nav>

    <button class="continue-pill" type="button" :disabled="busy" @click="openModesPanel">Bắt đầu trò chơi</button>

    <section class="mode-dock" :class="{ 'is-open': activePanel === 'modes' }" aria-label="Chọn thân phận chơi">
      <header class="mode-title">
        <div>
          <h2>Chọn thân phận chơi</h2>
          <p>Sau khi tạo save, thân phận chơi không thể thay đổi.</p>
        </div>
        <button class="enter-button" type="button" :disabled="busy || !modeSelectionReady" @click="continueAfterMode">
          Tiếp tục
        </button>
      </header>
      <div class="mode-row">
        <button
          v-for="(mode, modeIndex) in modes"
          :key="mode.key"
          class="mode-ribbon"
          :class="{ 'is-selected': modeSelectionReady && selectedMode === mode.key }"
          type="button"
          :disabled="busy"
          @click="selectMode(mode.key)"
        >
          <span class="mode-order" aria-hidden="true">0{{ modeIndex + 1 }}</span>
          <span class="mode-mark">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 4 56 18v28L32 60 8 46V18Z" fill="rgba(11,8,6,.38)" stroke="rgba(212,176,110,.68)" />
              <path d="M20 18h24M20 46h24M14 32h36" stroke="rgba(247,236,220,.22)" />
            </svg>
            {{ mode.mark }}
          </span>
          <h3>{{ mode.title }}</h3>
          <p>{{ mode.note }}</p>
          <span class="mode-select-hint">
            {{ modeSelectionReady && selectedMode === mode.key ? 'Đã chọn' : 'Bấm để chọn' }}
          </span>
        </button>
      </div>
    </section>

    <section class="floating-list save-list" :class="{ 'is-open': activePanel === 'load' }" aria-label="Save">
      <header class="floating-title">
        <div>
          <h2>Save</h2>
          <p>Thân phận chơi hiện tại: {{ selectedModeTitle }}. Sau khi chọn save, có thể tạo mới, nạp, nhập hoặc quản lý.</p>
        </div>
        <button class="enter-button" type="button" :disabled="busy" @click="loadSlots">Làm mới danh sách</button>
      </header>

      <div class="save-slot-grid">
        <button
          v-for="slot in slotViews"
          :key="slot.id"
          class="save-slot-ribbon"
          :class="{
            'is-selected': selectedSlotId === slot.id,
            'is-active': runtime.activeSlotId === slot.id,
            'is-empty': !slot.meta,
          }"
          type="button"
          :disabled="busy"
          @click="selectedSlotId = slot.id"
        >
          <span>{{ slot.label }}</span>
          <strong>{{ slot.meta?.label || 'Save trống' }}</strong>
          <small v-if="slot.meta">{{ slot.meta.mode }} · {{ formatDate(slot.meta.updatedAt) }}</small>
          <small v-else>Có thể bắt đầu từ đây</small>
          <em v-if="slot.meta">Đã lưu · {{ formatMB(slot.meta.byteLength) }}</em>
          <em v-else>Chưa bắt đầu</em>
        </button>
      </div>

      <div class="slot-actions">
        <button class="setting-choice is-primary" type="button" :disabled="busy" @click="startGame">
          {{ selectedSlotMeta ? `Ghi đè tạo mới save ${selectedModeTitle}` : `Tạo mới save ${selectedModeTitle}` }}
        </button>
        <button class="setting-choice" type="button" :disabled="busy || !selectedSlotMeta" @click="loadSelectedSlot">
          Nạp
        </button>
        <button
          v-if="savePanelContext === 'play'"
          class="setting-choice"
          :class="{ 'tutorial-target': tutorialTarget === 'save' }"
          type="button"
          :disabled="busy || runtime.activeMode === '未选择'"
          @click="saveSelectedSlot"
        >
          Lưu
        </button>
        <button
          v-if="savePanelContext === 'play'"
          class="setting-choice"
          type="button"
          :disabled="busy"
          @click="returnToPlay"
        >
          Quay lại trò chơi
        </button>
        <button class="setting-choice" type="button" :disabled="busy || !selectedSlotMeta" @click="deleteSelectedSlot">
          Xóa
        </button>
        <button class="setting-choice" type="button" :disabled="busy" @click="showSaveTools = !showSaveTools">
          Quản lý save
        </button>
      </div>

      <div v-if="showSaveTools" class="slot-actions save-tools">
        <button class="setting-choice" type="button" :disabled="busy || !selectedSlotMeta" @click="inspectSelectedSlot">
          Kiểm tra save
        </button>
        <button class="setting-choice" type="button" :disabled="busy || !selectedSlotMeta" @click="repairSelectedSlot">
          Sửa chữa save
        </button>
        <button class="setting-choice" type="button" :disabled="busy || !selectedSlotMeta" @click="exportSelectedSlot">
          Xuất save
        </button>
        <button class="setting-choice" type="button" :disabled="busy" @click="chooseImportFile">Nhập save</button>
      </div>

      <input
        ref="importInput"
        class="visually-hidden"
        type="file"
        accept="application/json,.json"
        @change="handleImportFile"
      />

      <div v-if="inspection" class="inspection-strip" :data-ok="inspection.ok ? 'true' : 'false'">
        <header>
          <strong>{{ inspection.ok ? 'Kiểm tra đạt' : 'Phát hiện bất thường' }}</strong>
          <span
            >{{ inspection.messageCount }} tầng · {{ inspection.chunkCount }} đoạn ·
            {{ formatMB(inspection.byteLength) }}</span
          >
        </header>
        <article v-for="(issue, index) in inspection.issues" :key="index" :data-level="issue.level">
          <b>{{ issue.level }}</b>
          <p>{{ issue.message }}</p>
          <pre v-if="issue.detail !== undefined">{{ formatDetail(issue.detail) }}</pre>
        </article>
      </div>
    </section>

    <section class="floating-list profile-list" :class="{ 'is-open': activePanel === 'profile' }" aria-label="Thông tin người dùng">
      <header class="floating-title">
        <div>
          <h2>Thiết lập nhân vật</h2>
          <p>Nội dung này sẽ trở thành ấn tượng cơ bản của bạn trong Hoa Chưa Nở.</p>
        </div>
        <button class="enter-button" type="button" :disabled="busy" @click="activePanel = 'load'">Quay lại</button>
      </header>

      <div class="profile-form">
        <label class="profile-field">
          <span>Tên</span>
          <input v-model="profileName" class="profile-input" type="text" maxlength="40" placeholder="Nhập tên của bạn" />
        </label>

        <div class="profile-field">
          <span>Giới tính</span>
          <div class="settings-options">
            <button
              v-for="option in profileGenderOptions"
              :key="option.key"
              class="setting-choice"
              :class="{ 'is-selected': profileGenderKey === option.key }"
              type="button"
              :disabled="busy"
              @click="profileGenderKey = option.key"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <label v-if="profileGenderKey === '自定义'" class="profile-field">
          <span>Tùy chỉnh</span>
          <input
            v-model="profileGenderText"
            class="profile-input"
            type="text"
            maxlength="40"
            placeholder="Nhập cách gọi giới tính"
          />
        </label>

        <label class="profile-field">
          <span>Thiết lập nhân vật</span>
          <textarea
            v-model="profileDescription"
            class="profile-textarea"
            maxlength="4000"
            placeholder="Viết ngoại hình, tính cách, kinh nghiệm, sở thích hoặc thông tin khác bạn muốn được ghi nhớ."
          />
        </label>
      </div>

      <div class="slot-actions">
        <button class="setting-choice" type="button" :disabled="busy" @click="activePanel = 'load'">Quay lại save</button>
        <button class="setting-choice is-primary" type="button" :disabled="busy" @click="startGame">Bắt đầu</button>
      </div>
    </section>

    <section class="floating-list is-settings" :class="{ 'is-open': activePanel === 'settings' }" aria-label="Cài đặt">
      <div class="settings-panel">
        <div v-for="group in settingGroups" :key="group.key" class="settings-row">
          <div class="settings-label">
            <strong>{{ group.title }}</strong>
            <span>{{ group.note }}</span>
          </div>
          <div class="settings-options">
            <button
              v-for="option in group.options"
              :key="option.value"
              class="setting-choice"
              :class="{ 'is-selected': settings[group.key] === option.value }"
              type="button"
              @click="updateSetting(group.key, option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-label">
            <strong>Ghi chép sự cố</strong>
            <span>Xuất 5 thao tác gần nhất khi gặp bất thường</span>
          </div>
          <div class="settings-options">
            <button class="setting-choice" type="button" :disabled="busy" @click="exportProblemRecord">Xuất ghi chép</button>
          </div>
        </div>
      </div>
    </section>

    <div class="toast" :class="{ 'is-show': toastText }">{{ toastText }}</div>
  </main>

  <main
    v-else
    ref="appRootElement"
    class="play-screen"
    :class="{
      'mode-menu': isPlayMenuVisible,
      'mode-scene': !isPlayMenuVisible,
      'has-scene-input': airpState && !isPlayMenuVisible,
      'tutorial-active': tutorialActive,
      'is-browser-fullscreen': isImmersiveViewport,
    }"
    :data-viewport-mode="mobileViewportMode"
    :data-play-mode="activeMode"
    :style="mobileViewportStyle"
    aria-label="Màn hình chơi Hoa Chưa Nở"
  >
    <img class="scene-bg" :src="currentSceneBg" alt="" />
    <div class="shade" />
    <div class="steam" />
    <svg class="hud-lines" viewBox="0 0 1366 768" preserveAspectRatio="none" aria-hidden="true">
      <path d="M36 42h170M36 714h300M1020 90h260M1180 692h126" stroke="rgba(247,236,220,.24)" />
      <path d="M180 90v580M1194 138v500" stroke="rgba(247,236,220,.12)" stroke-dasharray="4 8" />
    </svg>

    <header v-if="activeMode === '老板'" class="corner-brand">
      <img class="brand-seal" :src="TANGQUAN_LOGO_URL" alt="" aria-hidden="true" />
      <span class="brand-text"
        ><strong>{{ bossUserName }}</strong
        ><span>Hoa Chưa Nở · Chủ tiệm</span></span
      >
    </header>

    <aside v-if="activeMode === '老板'" class="left-rail" aria-label="Trạng thái hiện tại">
      <div class="identity-plaque">
        <b>{{ playPlaque.main }}</b>
        <span>{{ playPlaque.sub }}</span>
      </div>
      <div v-for="item in playStatusItems" :key="item.label" class="status-slip">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="item.icon" fill="none" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <strong>{{ item.text }}</strong>
      </div>
    </aside>

    <div v-if="activeMode === '老板'" class="top-center">
      <span class="gem" />
      <span>{{ currentSlotLabel }}</span>
      <span class="gem" />
    </div>

    <div class="top-icons">
      <template v-if="!isPlayMenuVisible && !airpState">
        <button
          class="icon-button time-travel-button"
          type="button"
          :title="`Tiến thời gian (hiện tại ${currentGameTime})`"
          @click="openTimePicker"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 7v5l3.4 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
        <button
          class="icon-button"
          :class="{ 'tutorial-target': tutorialTarget === 'open-save' }"
          type="button"
          title="Save"
          @click="openLoadPanel('play')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" fill="none" stroke="currentColor" stroke-width="1.8" />
          </svg>
        </button>
        <button class="icon-button" type="button" title="Về màn hình tiêu đề" @click="returnToTitle">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12 12 5l8 7v7H4z" fill="none" stroke="currentColor" stroke-width="1.8" />
          </svg>
        </button>
        <button class="icon-button" type="button" title="Thu gọn giao diện" @click="closeFrontend">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m6 6 12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </template>
      <button
        class="fullscreen-button icon-button"
        type="button"
        :title="fullscreenButtonTitle"
        :aria-label="fullscreenButtonTitle"
        :aria-pressed="isImmersiveViewport"
        :disabled="!fullscreenSupported"
        @click="toggleBrowserFullscreen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            v-if="isImmersiveViewport"
            d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div v-if="activeMode === '老板' && bossSceneSpriteUrl" class="sprite-spot" aria-hidden="true">
      <img :src="bossSceneSpriteUrl" alt="" />
    </div>

    <nav v-if="activeMode === '老板'" class="right-actions" aria-label="Thao tác nhanh">
      <button class="action-pill" type="button" @click="openBossMenu('overview')">
        <span>Tổng quan</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13h6V5H4zm10 6h6V5h-6zM4 19h6v-4H4z" fill="currentColor" />
        </svg>
      </button>
      <button class="action-pill" type="button" @click="openBossMenu('schedule')">
        <span>Xếp ca</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v16H5zM8 2v4M16 2v4M5 9h14" fill="none" stroke="currentColor" stroke-width="1.8" />
        </svg>
      </button>
      <button
        class="action-pill"
        :class="{ 'tutorial-target': tutorialTarget === 'boss-open-employees' }"
        type="button"
        @click="openBossMenu('employees')"
      >
        <span>Nhân viên</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          />
        </svg>
      </button>
      <button class="action-pill" type="button" @click="openBossMenu('recruit')">
        <span>Tuyển dụng</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" />
        </svg>
      </button>
      <button class="action-pill" type="button" @click="openBossMenu('settlement')">
        <span>Kết toán</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h10v16H7zM9 8h6M9 12h6M9 16h3" fill="none" stroke="currentColor" stroke-width="1.8" />
        </svg>
      </button>
    </nav>

    <section v-if="activeMode === '老板'" class="menu-layer" aria-label="Menu chủ tiệm">
      <nav class="menu-tabs" aria-label="Danh mục menu chủ tiệm">
        <button
          v-for="tab in bossTabs"
          :key="tab.key"
          class="menu-tab"
          :class="{
            'is-active': bossView === tab.key,
            'tutorial-target':
              (tutorialTarget === 'boss-open-schedule' && tab.key === 'schedule') ||
              (tutorialTarget === 'boss-open-overview' && tab.key === 'overview') ||
              (tutorialTarget === 'boss-open-recruit' && tab.key === 'recruit') ||
              (tutorialTarget === 'boss-open-facilities' && tab.key === 'facilities') ||
              (tutorialTarget === 'boss-open-settlement' && tab.key === 'settlement'),
          }"
          type="button"
          @click="openBossMenu(tab.key)"
        >
          {{ tab.title }}
        </button>
      </nav>

      <article class="menu-main">
        <header class="menu-head">
          <div>
            <h2>{{ activeBossTab.title }}</h2>
            <p>{{ activeBossTab.note }}</p>
          </div>
          <button
            class="close-button"
            :class="{ 'tutorial-target': tutorialTarget === 'boss-close-menu' }"
            type="button"
            @click="closeBossMenu"
          >
            Quay lại
          </button>
        </header>

        <div class="menu-content">
          <template v-if="bossView === 'overview'">
            <div class="data-grid three">
              <section class="metric-line">
                <span>Lượng khách hôm nay</span>
                <strong>{{ bossState.客流 }}</strong>
                <p>Giới hạn tiếp đón {{ bossCapacity }}, chịu ảnh hưởng chung bởi đánh giá, xếp ca và bảo trì.</p>
              </section>
              <section class="metric-line">
                <span>Đánh giá cửa hàng</span>
                <strong>{{ bossState.店铺评分 }}</strong>
                <p>Tỷ lệ đánh giá tốt {{ percent(bossState.好评率) }}, sẽ ảnh hưởng đến lượng khách ngày mai.</p>
              </section>
              <section class="metric-line">
                <span>Độ bảo trì</span>
                <strong>{{ bossState.基建.维护度 }}</strong>
                <p>Bảo trì thấp sẽ kéo giảm lượng khách, đánh giá và trạng thái nhân viên.</p>
              </section>
            </div>

            <div class="data-grid two spaced">
              <section v-if="bossHotProject" class="data-line">
                <div class="line-head">
                  <h3>{{ bossHotProject.名称 }}</h3>
                  <span class="tag good">{{ bossHotProject.热度 }}</span>
                </div>
                <p>Đánh giá {{ bossHotProject.评分 }} · Giá trị đề xuất {{ percent(bossHotProject.推荐值 / 100) }}</p>
                <div class="thin-meter" :style="{ '--value': `${bossHotProject.推荐值}%` }"><span /></div>
              </section>
              <section class="metric-line">
                <span>Lợi nhuận gộp hôm nay</span>
                <strong>{{ yuan(bossState.结算.毛利) }}</strong>
                <p>
                  Thu nhập {{ yuan(bossState.结算.收入) }}, chi tiêu {{ yuan(bossState.结算.支出) }}, tổng lương ngày
                  {{ yuan(bossPayroll) }}.
                </p>
              </section>
            </div>

            <div class="data-grid two spaced">
              <section class="metric-line">
                <span>Vị trí hiện tại</span>
                <strong>{{ bossState.地点 }}</strong>
                <p>Nhân viên cùng khu vực: {{ bossCurrentStaffText }}.</p>
              </section>
              <section class="metric-line">
                <span>Hài lòng nhân viên</span>
                <strong>{{ bossAverageSatisfaction }}</strong>
                <p>Hài lòng thấp sẽ tăng rủi ro nghỉ việc, lương ngày và phòng nghỉ sẽ giảm bớt áp lực.</p>
              </section>
            </div>

            <div class="data-grid two spaced">
              <section class="metric-line">
                <span>Chỉ định đang chiếm dụng</span>
                <strong>{{ bossState.指名.length }}</strong>
                <p>Chỉ định xuyên ngày sẽ tiếp tục chiếm dụng nhân viên tương ứng.</p>
              </section>
              <section class="metric-line">
                <span>Làm mới tuyển dụng</span>
                <strong>{{ bossRecruitCountdown }}</strong>
                <p>Ứng viên hiện tại: {{ bossState.招聘.候选.map(item => item.姓名).join('、') || 'Đang chờ làm mới' }}.</p>
              </section>
            </div>

            <div class="data-grid spaced">
              <section v-for="log in bossState.经营提醒" :key="log" class="data-line">
                <h3>{{ log }}</h3>
                <p>Nhắc nhở kinh doanh sẽ hiển thị tập trung ở đây.</p>
              </section>
            </div>
          </template>

          <template v-else-if="bossView === 'schedule'">
            <div class="schedule">
              <div class="shift-row">
                <div class="shift-name">Nhân viên</div>
                <div v-for="part in bossState.时间段" :key="part" class="shift-name">{{ part }}</div>
              </div>
              <div v-for="employee in bossState.员工" :key="employee.姓名" class="shift-row">
                <div class="shift-name">{{ employee.姓名 }}</div>
                <button
                  v-for="(slot, index) in employee.排班"
                  :key="`${employee.姓名}-${index}`"
                  class="shift-cell"
                  :class="{
                    'is-work': slot !== '休息',
                    'is-selected': isBossShiftSelected(employee.姓名, index),
                    'tutorial-target':
                      tutorialTarget === 'boss-select-shift' && employee.姓名 === bossState.看板娘.姓名 && index === 0,
                  }"
                  type="button"
                  @click="selectBossShift(employee.姓名, index)"
                >
                  <strong>{{ slot }}</strong>
                  <span>{{ bossState.时间段[index] }}</span>
                </button>
              </div>
            </div>

            <section v-if="bossActiveShift" class="schedule-panel">
              <h3>{{ bossActiveShift.name }} · {{ bossState.时间段[bossActiveShift.index] }}</h3>
              <p class="hint">Chọn vị trí hoặc trạng thái cho khung giờ này.</p>
              <div class="option-grid">
                <button
                  v-for="choice in bossScheduleChoices"
                  :key="choice"
                  class="option-button"
                  :class="{ 'is-active': currentBossShiftValue === choice }"
                  type="button"
                  @click="setBossShiftOption(choice)"
                >
                  {{ choice }}
                </button>
              </div>
            </section>
            <section v-else class="schedule-panel">
              <h3>Chọn ô thời gian</h3>
              <p class="hint">Sau khi bấm khung giờ tương ứng của nhân viên, chọn nghỉ ngơi, chờ lệnh hoặc khu vực cụ thể ở đây.</p>
            </section>
            <div class="row-actions">
              <button
                class="small-button"
                :class="{ 'tutorial-target': tutorialTarget === 'boss-confirm-schedule' }"
                type="button"
                @click="confirmBossSchedule"
              >
                Xác nhận xếp ca
              </button>
            </div>
          </template>

          <template v-else-if="bossView === 'areas'">
            <div class="data-grid two">
              <section v-for="area in bossState.区域" :key="area.名称" class="data-line">
                <div class="line-head">
                  <h3>{{ area.名称 }}</h3>
                  <span class="tag" :class="{ warn: area.名称 === bossState.地点 }">{{ area.客人 }} người</span>
                </div>
                <p>{{ area.说明 }}</p>
                <p>Đang làm: {{ area.员工.join('、') || 'Chưa có' }}</p>
                <div class="row-actions">
                  <button class="small-button" type="button" @click="goBossArea(area.名称)">
                    {{ area.名称 === bossState.地点 ? 'Đang ở đây' : 'Đến đây' }}
                  </button>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="bossView === 'employees'">
            <div class="data-grid two">
              <section
                v-for="employee in bossState.员工"
                :key="employee.姓名"
                class="data-line has-character-avatar"
                :class="{ 'tutorial-focus': tutorialInspectAtri && employee.姓名 === bossState.看板娘.姓名 }"
              >
                <img class="character-avatar" :src="characterAvatarUrl(employee.姓名)" alt="" />
                <div class="line-head">
                  <h3>{{ employee.姓名 }}</h3>
                  <span>
                    <span v-if="employee.头衔" class="tag good">{{ employee.头衔 }}</span>
                    <span class="tag">{{ employee.评级 }}</span>
                    <span class="tag" :class="{ warn: employee.状态 === '指名中' }">{{ employee.状态 }}</span>
                  </span>
                </div>
                <p>{{ employee.区域 }} · Lương ngày {{ yuan(employee.日薪) }} · Đánh giá {{ employee.评分 }}</p>
                <div class="thin-meter" :style="{ '--value': `${employee.评分}%` }"><span /></div>
                <p>
                  Hài lòng {{ employee.满意度 }} · Mệt mỏi {{ employee.疲劳 }} · Thu nhập cá nhân hôm nay {{ yuan(employee.个人收入) }}
                </p>
                <div class="thin-meter danger-aware" :style="{ '--value': `${employee.离职风险}%` }"><span /></div>
                <p>Rủi ro nghỉ việc {{ employee.离职风险 }} · Lương ngày kỳ vọng {{ yuan(employee.期望日薪) }}</p>
                <p>
                  Phục vụ {{ employee.服务次数 }} · Chỉ định {{ employee.指名次数 }} · Kết quả thêm {{ employee.额外结果次数 }}
                </p>
                <div class="row-actions">
                  <template v-if="employee.区域 === bossState.地点">
                    <button class="small-button" type="button" @click="talkBossEmployee(employee.姓名)">Trò chuyện</button>
                    <button class="small-button" type="button" @click="raiseBossSalary(employee.姓名)">Tăng lương ngày</button>
                    <button class="small-button" type="button" @click="checkBossService(employee.姓名)">
                      Xem dịch vụ
                    </button>
                  </template>
                  <button v-else class="small-button" type="button" @click="goBossEmployee(employee.姓名)">Đến đây</button>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="bossView === 'projects'">
            <div class="data-grid two">
              <section v-for="project in bossState.项目" :key="project.名称" class="data-line">
                <div class="line-head">
                  <h3>{{ project.名称 }}</h3>
                  <span class="tag" :class="{ good: project.推荐值 >= 86 }">{{ project.热度 }}</span>
                </div>
                <p>Giá cơ bản {{ yuan(project.基础价格) }} · Đánh giá {{ project.评分 }}</p>
                <div class="thin-meter" :style="{ '--value': `${project.推荐值}%` }"><span /></div>
                <p>
                  {{ project.设施需求 }} · Đơn hôm nay {{ project.今日订单 }}/{{ project.容量 }} · Giá trị đề xuất
                  {{ percent(project.推荐值 / 100) }}.
                </p>
                <div class="row-actions">
                  <button class="small-button" type="button" @click="adjustBossProject(project.名称, 'down')">
                    Giảm giá
                  </button>
                  <button class="small-button" type="button" @click="adjustBossProject(project.名称, 'up')">
                    Tăng giá
                  </button>
                  <button class="small-button" type="button" @click="investBossQuality(project.名称)">Đầu tư chất lượng</button>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="bossView === 'nominations'">
            <div class="data-grid two">
              <section v-for="item in bossState.指名" :key="`${item.员工}-${item.客人}`" class="data-line">
                <div class="line-head">
                  <h3>{{ item.员工 }}</h3>
                  <span class="tag warn">Còn lại {{ item.剩余天数 }} ngày</span>
                </div>
                <p>{{ item.客人 }} · {{ item.区域 }}</p>
                <p>
                  Thu nhập cá nhân nhân viên {{ yuan(item.预计收入) }}, gồm phí chỉ định {{ yuan(item.每日指名费) }} và tiền boa dự kiến
                  {{ yuan(item.预计小费) }}.
                </p>
                <div class="row-actions">
                  <button class="small-button" type="button" @click="checkBossService(item.员工)">Xem dịch vụ</button>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="bossView === 'market'">
            <div class="data-grid two">
              <section class="metric-line">
                <span>Ngày sinh</span>
                <strong>{{ bossState.AI人才市场.生成日期 }}</strong>
                <p>Mỗi ngày chỉ sinh một lần sau khi qua 00:00; nạp save không sinh lại.</p>
              </section>
              <section class="metric-line">
                <span>Nguồn ứng viên</span>
                <strong>{{ bossState.AI人才市场.来源 === 'ai' ? 'AI' : 'Dự phòng cục bộ' }}</strong>
                <p>Nhóm NPC thuần độc lập, không đọc OC hiện có, cũng không dùng bất kỳ hình ảnh OC nào.</p>
              </section>
            </div>
            <div class="data-grid two">
              <section v-for="item in bossState.AI人才市场.候选" :key="item.id" class="data-line">
                <div class="line-head">
                  <h3>{{ item.姓名 }}</h3>
                  <span class="tag">{{ item.评级 }} · {{ item.性别 }} · {{ item.种族 }}</span>
                </div>
                <p>{{ item.经历简介 }}</p>
                <p>{{ item.来源地 }} · {{ item.年龄段 }} · Sở trường {{ item.擅长项目.join('、') }}</p>
                <p>Giá ký hợp đồng {{ yuan(item.市场签约价格) }} · Lương ngày kỳ vọng {{ yuan(item.期望日薪) }}</p>
                <div class="row-actions">
                  <button class="small-button" type="button" @click="talkBossAiMarket(item.id)">Giao lưu</button>
                  <button class="small-button" type="button" @click="signBossAiMarket(item.id)">Ký hợp đồng</button>
                </div>
              </section>
            </div>
            <p v-if="bossState.AI人才市场.问题.length" class="hint">
              {{ bossState.AI人才市场.问题.join('；') }}
            </p>
          </template>

          <template v-else-if="bossView === 'recruit'">
            <div class="data-grid two">
              <section class="metric-line">
                <span>Đếm ngược làm mới</span>
                <strong>{{ bossRecruitCountdown }}</strong>
                <p>Cứ mỗi 12 giờ thực tế làm mới hai ứng viên, người chưa tuyển sẽ bị thay thế ở vòng sau.</p>
              </section>
              <section class="metric-line">
                <span>Ứng viên hiện tại</span>
                <strong>{{ bossState.招聘.候选.length }} / 2</strong>
                <p>Đã tuyển {{ bossState.招聘.已录用.length }} người, sau khi tuyển không quay lại nhóm ứng viên nữa.</p>
              </section>
            </div>
            <div class="row-actions panel-actions">
              <button
                class="small-button"
                type="button"
                :disabled="bossState.资金 < bossRecruitRefreshCost"
                @click="paidRefreshBossRecruit"
              >
                Làm mới trả phí · {{ yuan(bossRecruitRefreshCost) }}
              </button>
              <span class="hint">Lưu ngay sau khi làm mới; chỉ ảnh hưởng nhóm OC thường, không ảnh hưởng chợ nhân tài AI.</span>
            </div>
            <section
              v-for="candidate in bossState.招聘.候选"
              :key="candidate.姓名"
              class="data-line spaced has-character-avatar"
            >
              <img class="character-avatar" :src="characterAvatarUrl(candidate.姓名)" alt="" />
              <div class="line-head">
                <h3>{{ candidate.姓名 }}</h3>
                <span class="tag">Lương ngày kỳ vọng {{ yuan(candidate.期望日薪) }}</span>
              </div>
              <p>{{ candidate.说明 }}</p>
              <div class="row-actions">
                <button class="small-button" type="button" @click="talkBossRecruit(candidate.姓名)">Phỏng vấn</button>
                <button class="small-button" type="button" @click="hireBossRecruit(candidate.姓名)">Tuyển dụng</button>
                <button class="small-button" type="button" @click="rejectBossRecruit(candidate.姓名)">Từ chối</button>
              </div>
            </section>
            <p v-if="bossState.招聘.候选.length === 0" class="hint">Vòng ứng viên này đã xử lý xong, vui lòng chờ lần làm mới theo thời gian thực tiếp theo.</p>
          </template>

          <template v-else-if="bossView === 'facilities'">
            <div class="data-grid three">
              <section class="metric-line">
                <span>Giới hạn tiếp đón</span>
                <strong>{{ bossCapacity }}</strong>
                <p>Chịu ảnh hưởng chung bởi toàn bộ cấp độ xây dựng, bảo trì và khu vực có thể mở hiện tại.</p>
              </section>
              <section class="metric-line">
                <span>Độ bảo trì</span>
                <strong>{{ bossState.基建.维护度 }}</strong>
                <p>Chi phí bảo trì hiện tại {{ yuan(bossMaintenanceCost) }}.</p>
              </section>
              <section class="metric-line">
                <span>Đã mở</span>
                <strong>{{ bossUnlockedInfrastructureItems.length }}</strong>
                <p>Khu vực và dự án sẽ mở theo kết quả nghiệm thu.</p>
              </section>
            </div>
            <div class="data-grid two spaced">
              <section v-for="item in bossInfrastructureItems" :key="item.key" class="data-line">
                <div class="line-head">
                  <h3>{{ item.label }}</h3>
                  <span class="tag" :class="{ good: item.isMaxed, warn: item.inProgress }">
                    {{ item.inProgress ? 'Đang thi công' : item.isMaxed ? 'Đạt cấp tối đa' : `Cấp ${item.level}` }}
                  </span>
                </div>
                <p>{{ item.note }}</p>
                <p v-if="item.isMaxed">Lộ trình này đã hoàn tất, về sau chỉ cần bảo trì.</p>
                <p v-else>Nâng lên cấp {{ item.level + 1 }}: tổng chi phí {{ yuan(item.cost) }}, dự kiến {{ item.days }} ngày.</p>
                <p v-if="item.nextUnlocks.length">
                  Mục tiêu liên quan: {{ item.nextUnlocks.map(unlock => unlock.名称).join('、') }}
                </p>
                <p v-else-if="!item.isMaxed">Cấp tiếp theo chủ yếu tăng dung lượng, sự thoải mái và độ ổn định kinh doanh.</p>
                <div class="row-actions">
                  <button
                    class="small-button"
                    type="button"
                    :disabled="item.isMaxed || item.inProgress"
                    @click="upgradeBossFacility(item.key)"
                  >
                    {{ item.isMaxed ? 'Hoàn tất' : item.inProgress ? 'Đang thi công' : 'Khởi công' }}
                  </button>
                </div>
              </section>
              <section class="data-line">
                <div class="line-head">
                  <h3>Bảo trì môi trường</h3>
                  <span class="tag" :class="{ warn: bossState.基建.维护度 < 65, good: bossState.基建.维护度 >= 86 }">
                    {{ bossState.基建.维护度 }}
                  </span>
                </div>
                <p>Bảo trì càng thấp, đánh giá khách, đề xuất dự án và trạng thái nhân viên càng dễ giảm sút.</p>
                <div class="thin-meter" :style="{ '--value': `${bossState.基建.维护度}%` }"><span /></div>
                <div class="row-actions">
                  <button class="small-button" type="button" @click="maintainBossFacilities">Bảo trì</button>
                </div>
              </section>
            </div>
            <section class="building-board spaced">
              <header class="building-board-head">
                <div>
                  <h3>Mở rộng công trình</h3>
                  <p>Kéo màn hình để xem toàn bộ lộ trình; bấm vào công trình để xem chi phí, thời gian thi công và điều kiện mở.</p>
                </div>
                <div class="row-actions compact">
                  <span class="tag good">Đã xây {{ bossBuiltBuildingCount }}</span>
                  <span class="tag">Tổng số {{ bossBuildingItems.length }}</span>
                  <button class="small-button" type="button" @click="zoomBossBuildingStep(-BOSS_BUILDING_ZOOM.step)">
                    Thu nhỏ
                  </button>
                  <span class="tag">{{ bossBuildingScaleText }}</span>
                  <button class="small-button" type="button" @click="zoomBossBuildingStep(BOSS_BUILDING_ZOOM.step)">
                    Phóng to
                  </button>
                  <button class="small-button" type="button" @click="resetBossBuildingView">Căn giữa</button>
                </div>
              </header>

              <div class="building-tree-panel">
                <div
                  ref="bossBuildingMapRef"
                  class="building-map"
                  role="application"
                  aria-label="Lộ trình mở rộng công trình"
                  @pointerdown="startBossBuildingPan"
                  @pointermove="moveBossBuildingPan"
                  @pointerup="endBossBuildingPan"
                  @pointerleave="endBossBuildingPan"
                  @wheel.prevent="zoomBossBuildingMap"
                >
                  <div
                    class="building-map-canvas"
                    :style="{
                      width: `${bossBuildingMapSize.width}px`,
                      height: `${bossBuildingMapSize.height}px`,
                      transform: `translate(${bossBuildingPan.x}px, ${bossBuildingPan.y}px) scale(${bossBuildingScale})`,
                    }"
                  >
                    <svg
                      class="building-links"
                      :viewBox="`0 0 ${bossBuildingMapSize.width} ${bossBuildingMapSize.height}`"
                      aria-hidden="true"
                    >
                      <line
                        v-for="line in bossBuildingLines"
                        :key="line.id"
                        :x1="line.x1"
                        :y1="line.y1"
                        :x2="line.x2"
                        :y2="line.y2"
                        :class="line.statusClass"
                      />
                    </svg>

                    <button
                      v-for="node in bossBuildingNodes"
                      :key="node.id"
                      class="building-node"
                      :class="[node.statusClass, { 'is-selected': bossSelectedBuilding?.id === node.id }]"
                      type="button"
                      :style="{ left: `${node.x}px`, top: `${node.y}px` }"
                      @pointerdown.stop
                      @click="bossSelectedBuildingId = node.id"
                    >
                      <span>{{ node.分类 }}</span>
                      <strong>{{ node.名称 }}</strong>
                      <small>{{ node.levelText }}</small>
                    </button>
                  </div>
                </div>

                <aside v-if="bossSelectedBuilding" class="building-detail">
                  <div class="line-head">
                    <h3>{{ bossSelectedBuilding.名称 }}</h3>
                    <span
                      class="tag"
                      :class="{
                        good: bossSelectedBuilding.状态 === '已建成',
                        warn: bossSelectedBuilding.状态 === '施工中' || bossSelectedBuilding.状态 === '待验收',
                      }"
                    >
                      {{ bossSelectedBuilding.levelText }}
                    </span>
                  </div>
                  <p>{{ bossSelectedBuilding.说明 }}</p>
                  <p>Điều kiện: {{ bossSelectedBuilding.requirementText }}</p>
                  <p v-if="bossSelectedBuilding.missing.length">Còn thiếu: {{ bossSelectedBuilding.missing.join('、') }}</p>
                  <p
                    v-else-if="
                      bossSelectedBuilding.状态 === '已建成' &&
                      bossSelectedBuilding.等级 >= bossSelectedBuilding.maxLevel
                    "
                  >
                    Công trình này đã đạt cấp độ cao nhất.
                  </p>
                  <p v-else-if="bossSelectedBuilding.状态 === '施工中'">Công trình đang được tiến hành, sẽ giảm số ngày còn lại sau khi kết toán ngày.</p>
                  <p v-else-if="bossSelectedBuilding.状态 === '待验收'">Công trình đã hoàn thành, cần nghiệm thu mới chính thức có hiệu lực.</p>
                  <p v-else>
                    Chi phí dự kiến {{ yuan(bossSelectedBuilding.cost) }}, thời gian thi công {{ bossSelectedBuilding.days }} ngày.
                  </p>
                  <p>{{ bossSelectedBuilding.effectText }}</p>
                  <div class="row-actions">
                    <button
                      class="small-button"
                      type="button"
                      :disabled="!bossSelectedBuildingCanAct"
                      @click="handleBossSelectedBuildingAction"
                    >
                      {{ bossSelectedBuildingActionText }}
                    </button>
                  </div>
                </aside>
              </div>
            </section>
            <div class="data-grid two spaced">
              <section class="data-line">
                <div class="line-head">
                  <h3>Nội dung đã mở</h3>
                  <span class="tag good">{{ bossUnlockedInfrastructureItems.length }}</span>
                </div>
                <div class="ledger-list">
                  <p v-for="item in bossUnlockedInfrastructureItems" :key="item.id">
                    {{ item.名称 }} · {{ item.分类 }} · {{ item.说明 }}
                  </p>
                </div>
              </section>
              <section class="data-line">
                <div class="line-head">
                  <h3>Mục tiêu tiếp theo</h3>
                  <span class="tag">{{ bossUpcomingInfrastructureItems.length }}</span>
                </div>
                <div class="ledger-list">
                  <p v-for="item in bossUpcomingInfrastructureItems" :key="item.id">
                    {{ item.名称 }} · {{ item.分类 }} · {{ item.说明 }}
                  </p>
                  <p v-if="!bossUpcomingInfrastructureItems.length">Hiện không có mục tiêu sắp mở.</p>
                </div>
              </section>
            </div>
            <section class="data-line spaced">
              <div class="line-head">
                <h3>Tiến độ công trình</h3>
                <span class="tag">{{ bossState.工程.length }}</span>
              </div>
              <template v-if="bossState.工程.length">
                <div class="ledger-list">
                  <p v-for="project in bossState.工程" :key="project.id">
                    {{ project.名称 || getBossInfrastructureLabel(project.设施) }} {{ project.当前等级 }}→{{
                      project.目标等级
                    }}
                    · {{ project.状态 }} · Còn lại {{ project.剩余天数 }} ngày · Mỗi ngày {{ yuan(project.每日消耗) }}
                    <button
                      v-if="project.状态 === '待验收'"
                      class="inline-action"
                      type="button"
                      @click="acceptBossProject(project.id)"
                    >
                      Nghiệm thu
                    </button>
                  </p>
                </div>
              </template>
              <p v-else>Hiện không có công trình nào đang thi công.</p>
            </section>
          </template>

          <template v-else-if="bossView === 'settlement'">
            <div class="data-grid two">
              <section class="metric-line">
                <span>Trạng thái kinh doanh</span>
                <strong>{{ bossState.营业状态 }}</strong>
                <p>{{ bossBusinessStatusText }}</p>
              </section>
              <section class="metric-line">
                <span>Hiệu chỉnh hôm nay</span>
                <strong>{{ bossState.节假日.名称 }}</strong>
                <p>
                  Khách {{ percent(bossState.节假日.客流倍率) }} · Giá {{ percent(bossState.节假日.价格倍率) }} · Hoạt động
                  {{ percent(bossState.节假日.活动倍率) }}
                </p>
              </section>
            </div>
            <div class="data-grid three">
              <section class="metric-line">
                <span>Thu nhập</span>
                <strong>{{ yuan(bossState.结算.收入) }}</strong>
                <p>Đến quán, dự án, bao trọn lưu trú và gói hoạt động.</p>
              </section>
              <section class="metric-line">
                <span>Chi tiêu</span>
                <strong>{{ yuan(bossState.结算.支出) }}</strong>
                <p>Lương ngày, vận hành, bảo trì và chuẩn bị dịch vụ.</p>
              </section>
              <section class="metric-line">
                <span>Lợi nhuận gộp</span>
                <strong>{{ yuan(bossState.结算.毛利) }}</strong>
                <p>Đồng bộ vốn sau khi kết toán.</p>
              </section>
            </div>
            <div class="data-grid two spaced">
              <section class="metric-line">
                <span>Thu nhập cá nhân nhân viên</span>
                <strong>{{ yuan(bossState.结算.员工收入合计) }}</strong>
                <p>Phí chỉ định và tiền boa thuộc về cá nhân nhân viên, không vào vốn cửa hàng.</p>
              </section>
              <section class="metric-line">
                <span>Dự đoán ngày mai</span>
                <strong>{{ bossState.结算.明日预测.客流 }}</strong>
                <p>Đánh giá {{ bossState.结算.明日预测.店铺评分 }}, hài lòng trung bình {{ bossState.结算.明日预测.平均满意度 }}.</p>
              </section>
            </div>
            <section class="data-line spaced">
              <div class="line-head">
                <h3>Chức năng nhanh</h3>
                <span class="tag">{{ bossState.营业状态 }}</span>
              </div>
              <p>Tạm ngừng chỉ dừng nhận thêm khách; ngừng kinh doanh hôm nay sẽ đưa doanh thu ngày về 0 nhưng vẫn có chi phí cơ bản; nghỉ một ngày sẽ trực tiếp tiến ngày và trừ chi phí tối thiểu.</p>
              <p>
                Quảng bá: {{ bossActiveCampaignText }}. Đầu tư chất lượng: {{ bossActiveQualityText }}. Phúc lợi nhân viên còn lại
                {{ bossState.员工福利.剩余天数 }} ngày.
              </p>
              <div class="row-actions">
                <button class="small-button" type="button" @click="toggleBossPause">
                  {{ bossState.营业状态 === '暂停营业' ? 'Khôi phục kinh doanh' : 'Tạm ngừng kinh doanh' }}
                </button>
                <button class="small-button" type="button" @click="closeBossToday">Ngừng kinh doanh hôm nay</button>
                <button class="small-button" type="button" @click="restBossToday">Nghỉ một ngày</button>
                <button class="small-button" type="button" @click="startBossCampaign">Quảng bá</button>
                <button class="small-button" type="button" @click="investBossCare">Phúc lợi nhân viên</button>
              </div>
            </section>
            <section class="data-line spaced">
              <div class="line-head">
                <h3>Kết toán hôm nay</h3>
                <button class="small-button" type="button" @click="closeBossDay">Thực hiện</button>
              </div>
              <p>Đóng băng và tính toán sổ sách hôm nay trước, sau khi nhật ký kinh doanh hoàn tất mới tiến đến 00:00, làm mới trạng thái xuyên ngày và ghi vào save.</p>
            </section>
            <section v-if="bossState.结算.经营纪要" class="data-line spaced">
              <div class="line-head">
                <h3>{{ bossState.结算.经营纪要.标题 }}</h3>
                <span class="tag">{{ bossState.结算.经营纪要.来源 === 'ai' ? 'Nhật ký AI' : 'Nhật ký cục bộ' }}</span>
              </div>
              <p>{{ bossState.结算.经营纪要.客人概况 }}</p>
              <p>{{ bossState.结算.经营纪要.收入说明 }}</p>
              <p>{{ bossState.结算.经营纪要.评价说明 }}</p>
              <div class="ledger-list">
                <p v-for="item in bossState.结算.经营纪要.项目日结" :key="`daily-project-${item.项目}`">
                  {{ item.项目 }} · {{ item.订单 }} 单 · {{ item.纪要 }}
                </p>
                <p v-for="item in bossState.结算.经营纪要.员工纪要" :key="`daily-employee-${item.员工}`">
                  {{ item.员工 }} · {{ item.角色 }} · {{ item.纪要 }}
                </p>
                <p v-for="item in bossState.结算.经营纪要.事件纪要" :key="`daily-event-${item.id}`">
                  {{ item.纪要 }}
                </p>
              </div>
              <p>{{ bossState.结算.经营纪要.收束 }}</p>
            </section>
            <div class="data-grid two spaced">
              <section class="data-line">
                <div class="line-head">
                  <h3>Chi tiết chi tiêu</h3>
                  <span class="tag">{{ yuan(bossState.结算.支出) }}</span>
                </div>
                <p>
                  Lương nhân viên {{ yuan(bossState.结算.支出明细.日薪) }} · Vận hành cố định
                  {{ yuan(bossState.结算.支出明细.固定运营) }}
                </p>
                <p>
                  Bảo trì cơ sở vật chất {{ yuan(bossState.结算.支出明细.设施维护) }} · Chuẩn bị dịch vụ
                  {{ yuan(bossState.结算.支出明细.服务准备) }}
                </p>
                <p>Tiêu hao công trình {{ yuan(bossState.结算.支出明细.工程消耗) }}</p>
              </section>
              <section class="data-line">
                <div class="line-head">
                  <h3>Kết toán ngày nhân viên</h3>
                  <span class="tag">{{ bossState.结算.员工日结.length }}</span>
                </div>
                <div class="ledger-list">
                  <p v-for="report in bossState.结算.员工日结" :key="report.员工">
                    {{ report.员工 }} · {{ report.角色 }} · Lương {{ yuan(report.工资) }} · Mệt mỏi
                    {{ signedNumber(report.疲劳变化) }}
                  </p>
                </div>
              </section>
            </div>
            <section class="data-line spaced">
              <div class="line-head">
                <h3>Sổ sách hôm nay</h3>
                <span class="tag">{{ bossState.结算.状态 }}</span>
              </div>
              <div class="ledger-list">
                <p v-for="entry in bossState.结算.流水" :key="entry.id">
                  {{ entry.名称 }} · {{ entry.类型 }} {{ yuan(entry.金额) }} · Vốn {{ signedYuan(entry.资金变动) }}
                </p>
              </div>
            </section>
          </template>
        </div>
      </article>
    </section>

    <CustomerPlay
      v-if="activeMode === '游客'"
      :state="customerState"
      :menu-open="customerMenuOpen"
      :view="customerView"
      :selected-employee="customerSelectedEmployee"
      :selected-project="customerSelectedProject"
      :selected-contact="customerSelectedContact"
      :invite-selection="customerInviteSelection"
      :story-open="customerStoryOpen"
      :busy="busy || airpSubmitting"
      :sprite-url="customerSceneSpriteUrl"
      :scene-participants="customerSceneParticipantNames"
      :contact-output-mode="customerContactOutputMode"
      :tutorial-target="tutorialTarget"
      @open-menu="openCustomerMenu"
      @close-menu="closeCustomerMenu"
      @travel="goCustomerArea"
      @select-employee="selectCustomerEmployee"
      @select-project="selectCustomerProject"
      @nominate="nominateCustomer"
      @end-nomination="endCustomerNominationAction"
      @book-service="bookSelectedCustomerService"
      @start-service="startSelectedCustomerService"
      @finish-service="finishSelectedCustomerService"
      @talk="talkCustomerEmployee"
      @request-contact="requestCustomerContact"
      @extra="requestCustomerExtraService"
      @invite="inviteCustomerEmployee"
      @toggle-invite="toggleCustomerInviteSelection"
      @invite-selected="inviteSelectedCustomerEmployees"
      @tip="tipCustomer"
      @free-airp="openCustomerFreeAirp"
      @next-dialogue="advanceCustomerDialogue"
      @previous-dialogue="rewindCustomerDialogue"
      @select-contact="selectCustomerContact"
      @send-message="sendCustomerContactMessage"
      @toggle-contact-output="toggleCustomerContactOutputMode"
      @check-in="checkInCustomer"
      @check-out="checkOutCustomer"
      @rest-day="restCustomerDay"
      @close-story="closeCustomerStory"
    />

    <WaiterPlay
      v-if="activeMode === '服务员'"
      :state="waiterState"
      :view="waiterView"
      :menu-open="waiterMenuOpen"
      :selected-assignment-id="waiterSelectedAssignmentId"
      :sprite-url="waiterSceneSpriteUrl"
      :busy="busy || airpSubmitting"
      :tutorial-target="tutorialTarget"
      @open-menu="openWaiterMenu"
      @close-menu="closeWaiterMenu"
      @select-assignment="selectWaiterAssignment"
      @start-shift="startWaiterShiftAction"
      @rest="restWaiterAction"
      @start-service="startWaiterServiceAction"
      @continue-service="continueWaiterServiceAirp"
      @finish-service="finishWaiterServiceAction"
      @spend="buyWaiterOptionAction"
      @settle="settleWaiterDayAction"
      @boss-talk="openWaiterBossTalk"
      @coworker-talk="openWaiterCoworkerTalk"
      @open-save="openLoadPanel('play')"
    />

    <section v-if="activeMode === '老板' && !isPlayMenuVisible" class="dialogue">
      <div class="nameplate">{{ dialogueSpeakerName }}</div>
      <button class="dialogue-strip" type="button" :disabled="sceneDialoguePageCount < 2" @click="advanceSceneDialogue">
        <p class="dialogue-text">{{ playShellText }}</p>
        <span v-if="sceneDialoguePageCount > 1" class="dialogue-page-count">
          {{ sceneDialoguePageIndex + 1 }} / {{ sceneDialoguePageCount }}
        </span>
      </button>
    </section>

    <section
      v-if="sceneStoryOpen && activeMode !== '游客' && !isPlayMenuVisible"
      class="scene-story-reader"
      aria-label="Đọc văn bản"
    >
      <header>
        <div>
          <small>{{ airpState?.note }}</small>
          <h2>{{ airpState?.title || 'Văn bản hiện trường' }}</h2>
        </div>
        <button type="button" @click="closeSceneStory">Quay lại</button>
      </header>
      <article>
        <p v-for="(paragraph, index) in sceneStoryParagraphs" :key="index">{{ paragraph }}</p>
      </article>
    </section>

    <section v-if="airpState && !isPlayMenuVisible" class="scene-input" aria-label="Nhập liệu hiện trường">
      <header>
        <div>
          <strong>{{ airpState.title }}</strong>
          <span>{{ airpState.note }}</span>
        </div>
        <div class="scene-header-actions">
          <template v-if="resolveAirpOutputMode(airpState) === 'dialogue' && sceneDialoguePageCount > 1">
            <button class="inline-action" type="button" :disabled="airpSubmitting" @click="rewindSceneDialogue">
              Câu trước
            </button>
            <span class="scene-page-count">{{ sceneDialoguePageIndex + 1 }} / {{ sceneDialoguePageCount }}</span>
            <button class="inline-action" type="button" :disabled="airpSubmitting" @click="advanceSceneDialogue">
              Câu sau
            </button>
          </template>
          <button
            v-if="resolveAirpOutputMode(airpState) === 'story' && sceneStoryText"
            class="inline-action"
            type="button"
            :disabled="airpSubmitting"
            @click="openSceneStory"
          >
            Xem văn bản
          </button>
          <button class="inline-action" type="button" :disabled="airpSubmitting || busy" @click="toggleAirpOutputMode">
            Chuyển chế độ chat · Hiện tại: {{ resolveAirpOutputMode(airpState) === 'story' ? 'Văn bản' : 'Galgame' }}
          </button>
          <button
            class="inline-action"
            type="button"
            :disabled="airpSubmitting || !latestSceneGenerationPair"
            @click="undoLatestSceneGeneration"
          >
            Lùi lại
          </button>
          <button
            class="inline-action"
            type="button"
            :disabled="airpSubmitting || !canRerollLatestSceneGeneration"
            @click="rerollLatestSceneGeneration"
          >
            Roll lại
          </button>
          <button
            class="inline-action"
            :class="{ 'tutorial-target': tutorialTarget === 'airp-leave' }"
            type="button"
            :disabled="airpSubmitting"
            @click="closeAirpScene"
          >
            Rời đi
          </button>
        </div>
      </header>
      <div v-if="resolveAirpOutputMode(airpState) === 'dialogue'" class="scene-dialogue-output" aria-live="polite">
        <b>{{ activeSceneDialogueSpeaker }}</b>
        <p>{{ activeSceneDialogueText || 'Đối phương tạm thời không nói tiếp.' }}</p>
      </div>
      <div class="scene-input-row">
        <textarea
          v-model="airpInput"
          :placeholder="airpState.placeholder"
          :disabled="airpSubmitting"
          @keydown.ctrl.enter.prevent="submitAirpInput"
          @keydown.meta.enter.prevent="submitAirpInput"
        />
        <button
          class="scene-send"
          type="button"
          :disabled="airpSubmitting || !airpInput.trim()"
          @click="submitAirpInput"
        >
          {{ airpSubmitting ? 'Đang chờ' : 'Gửi' }}
        </button>
      </div>
    </section>

    <div class="toast" :class="{ 'is-show': toastText }">{{ toastText }}</div>
  </main>

  <section
    v-if="activePage === 'play' && activeMode === '老板' && !bossState.看板娘.已选择"
    class="hostess-picker-layer"
    aria-label="Chọn linh vật đại diện"
  >
    <div class="hostess-picker-dialog">
      <header>
        <small>Bước đầu tiên của save mới</small>
        <h2>Chọn linh vật đại diện cho Hoa Chưa Nở</h2>
        <p>Cô ấy sẽ ngay lập tức trở thành nhân viên khởi đầu và bị loại khỏi nhóm tuyển dụng thường sau này. Sau khi lựa chọn được ghi vào save sẽ không hiện lại nữa.</p>
      </header>
      <div class="hostess-picker-grid">
        <button
          v-for="character in bossHostessCandidates"
          :key="character.id"
          type="button"
          @click="selectBossHostessAction(character.id)"
        >
          <img :src="characterAvatarUrl(character.id)" alt="" />
          <strong>{{ character.name }}</strong>
          <span>{{ character.id }}</span>
        </button>
      </div>
    </div>
  </section>

  <TimePicker
    :open="timePickerOpen"
    :current-time="currentGameTime"
    :mode="activeMode"
    @cancel="closeTimePicker"
    @confirm="confirmManualTimeTravel"
  />

  <section v-if="confirmState" class="confirm-layer" aria-label="Xác nhận thao tác">
    <div class="confirm-backdrop" />
    <div class="confirm-dialog">
      <small>Hoa Chưa Nở</small>
      <h2>{{ confirmState.title }}</h2>
      <p>{{ confirmState.message }}</p>
      <div class="confirm-actions">
        <button class="setting-choice" type="button" @click="resolveConfirm(false)">Hủy</button>
        <button class="setting-choice is-primary" type="button" @click="resolveConfirm(true)">Xác nhận</button>
      </div>
    </div>
  </section>

  <TutorialOverlay
    :active="tutorialActive"
    :step="currentTutorialStep"
    :index="tutorialProgress.step"
    :total="tutorialStepCount"
    @next="advanceTutorialWithoutAction"
    @skip="skipTutorial"
  />

  <section v-if="mobileViewportMode === 'mobile-portrait'" class="mobile-orientation-gate" aria-live="polite">
    <div class="mobile-orientation-card">
      <span class="mobile-rotate-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <rect x="20" y="8" width="24" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="3" />
          <path
            d="M12 34c0 11 9 20 20 20h9M10 27l2 7 7-2"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <small>Hoa Chưa Nở · Chế độ điện thoại</small>
      <h2>Vui lòng xoay ngang điện thoại</h2>
      <p>Sau khi xoay ngang sẽ tự động vào giao diện chuyên dụng, không nén bản desktop thành bản dọc.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { isTangquanMvuAvailable, readCurrentTangquanMvuData, waitForTangquanMvu } from '../../runtime/mvuRuntime';
import {
  createTangquanAutoSaveController,
  type TangquanAutoSaveEvent,
  type TangquanAutoSaveResult,
  type TangquanAutoSaveSnapshot,
} from '../../save/autoSaveController';
import type { TangquanSaveRuntime } from '../../save/saveRuntime';
import type { TangquanUserGenderKey, TangquanUserProfileInput } from '../../save/userProfileWorldbook';
import TutorialOverlay from './TutorialOverlay.vue';
import TimePicker from './TimePicker.vue';
import {
  makeTutorialProgress,
  normalizeTutorialProgress,
  TUTORIAL_STEPS,
  type TutorialAction,
  type TutorialProgress,
} from './tutorial';
import type {
  TangquanLoadedSave,
  TangquanPlayMode,
  TangquanSaveInspection,
  TangquanSaveSlotMeta,
} from '../../save/worldbookSave';
import {
  makeTangquanBuildingEntryId,
  makeTangquanInfrastructureEntryId,
  makeTangquanProjectEntryId,
  TANGQUAN_AREA_TO_BUILDING,
  TANGQUAN_PROJECT_NAMES,
  TANGQUAN_PROJECT_TO_BUILDING,
} from '../../worldbook/worldbookEntryCatalog';
import { parseTangquanAiMessage, type TangquanDialoguePage, type TangquanParsedAiMessage } from './aiMessageParser';
import {
  acceptBossConstructionProject,
  applyBossManualTimeTarget,
  adjustBossProjectPrice,
  cloneBossPageState,
  closeBossBusinessToday,
  confirmBossScheduleState,
  getBossAverageSatisfaction,
  getBossBuildingCatalog,
  getBossInfrastructureCapacity,
  getBossInfrastructureCatalog,
  getBossInfrastructureLabel,
  getBossInfrastructureUpgradeCost,
  getBossMaintenanceCost,
  getBossRecruitCountdown,
  getBossRecruitPaidRefreshCost,
  getBossUnlockedInfrastructureItems,
  getBossUpcomingInfrastructureItems,
  hireBossRecruitCandidate,
  investBossProjectQuality,
  investBossStaffCare,
  maintainBossInfrastructure,
  makeBossPageState,
  markBossAiTalentMarketAttempted,
  normalizeBossPageState,
  paidRefreshBossRecruitment,
  pauseBossBusiness,
  raiseBossEmployeeSalary,
  recalculateBossState,
  refreshBossRecruitmentByRealTime,
  rejectBossRecruitCandidate,
  restBossOneDay,
  resumeBossBusiness,
  selectBossHostess,
  setBossRecruitmentFemaleUser,
  settleBossDay,
  signBossAiTalentCandidate,
  startBossBuildingProject,
  startBossMarketingCampaign,
  upgradeBossInfrastructure,
  type BossBuildingCatalogItem,
  type BossDailyReport,
  type BossEmployee,
  type BossInfrastructureCatalogItem,
  type BossInfrastructureKey,
  type BossInfrastructureUnlock,
  type BossPageState,
  type BossProject,
  type BossMutationResult,
} from './bossEconomy';
import {
  applyBossDailyReport,
  attachBossDailyReport,
  makeBossDailyReportFacts,
  makeBossDailyReportInjects,
  makeLocalBossDailyReport,
  type BossDailyReportFacts,
} from './bossDailyReport';
import {
  applyBossAiTalentMarketResponse,
  parseBossAiTalentCandidates,
  parseBossAiTalentFullProfile,
  type BossAiTalentCandidate,
  type BossAiTalentFullProfile,
} from './aiTalentMarket';
import {
  makeBossAiTalentCandidateGenerationRequest,
  makeBossAiTalentFullProfileGenerationRequest,
  makeBossAiTalentFullProfilePromptInput,
  type BossAiTalentCandidatePromptInput,
} from './aiTalentMarketPrompts';
import { findTangquanCharacter, listTangquanCharacters, makeTangquanCharacterEntryId } from './characterCatalog';
import {
  appendCustomerMessage,
  applyCustomerManualTimeTarget,
  applyCustomerTimeText,
  bookCustomerService,
  checkInCustomerStay,
  checkOutCustomerStay,
  cloneCustomerPageState,
  CUSTOMER_ROOM_OPTIONS,
  endCustomerNomination,
  finishCustomerService,
  getCustomerCurrentEmployee,
  listCustomerAvailableEmployees,
  makeCustomerAreaEntryContent,
  makeCustomerEmployeeEntryContent,
  makeCustomerEmployeesEntryContent,
  makeCustomerPageState,
  makeCustomerProjectEntryContent,
  markCustomerConversationRead,
  nextCustomerDialoguePage,
  nominateCustomerEmployee,
  normalizeCustomerPageState,
  previousCustomerDialoguePage,
  removeCustomerMessages,
  restCustomerToNextDay,
  setCustomerDialoguePages,
  setCustomerFemaleUser,
  setCustomerStory,
  startCustomerService,
  tipCustomerEmployee,
  travelCustomerArea,
  updateCustomerMessageContent,
  type CustomerEmployee,
  type CustomerMenuView,
  type CustomerMutationResult,
  type CustomerPageState,
} from './customerGame';
import {
  applyCustomerStatDataToState,
  cloneCustomerMvuBlockStore,
  composeCustomerStatDataWithBlocks,
  deactivateCustomerStatDataBlocks,
  makeCustomerCommonStatData,
  makeCustomerMvuBlockStore,
  normalizeCustomerMvuBlockStore,
  type CustomerMvuBlockContext,
  type CustomerMvuBlockId,
  type CustomerMvuBlockStore,
} from './customerMvuBlocks';
import CustomerPlay from './CustomerPlay.vue';
import { makeCustomerGenerationInjects } from './customerPrompts';
import { makeCustomerDailyArrangementInjects, makeWaiterDailyArrangementInjects } from './dailyArrangementPrompts';
import { applyCustomerDailyArrangement, applyWaiterDailyArrangement } from './dailyArrangementRuntime';
import {
  buyWaiterOption,
  applyWaiterManualTimeTarget,
  applyWaiterGrowthFromMvu,
  applyWaiterTimeText,
  cloneWaiterPageState,
  finishWaiterService,
  getWaiterInvestmentCost,
  hasAttemptedWaiterGuestGeneration,
  markWaiterGuestGenerationFallback,
  makeWaiterAreaEntryContent,
  makeWaiterAssignmentFacts,
  makeWaiterAssignmentFactsEntryContent,
  makeWaiterCoworkerEntryContent,
  makeWaiterGuestEntryContent,
  makeWaiterPageState,
  makeWaiterProjectEntryContent,
  normalizeWaiterPageState,
  restWaiter,
  setWaiterDialogue,
  settleWaiterDay,
  startWaiterService,
  startWaiterShift,
  type WaiterInvestmentKey,
  type WaiterMenuView,
  type WaiterMutationResult,
  type WaiterPageState,
  type WaiterRecoveryKey,
} from './waiterGame';
import {
  applyWaiterStatDataToState,
  cloneWaiterMvuBlockStore,
  composeWaiterStatDataWithBlocks,
  deactivateWaiterStatDataBlocks,
  makeWaiterCommonStatData,
  makeWaiterMvuBlockStore,
  normalizeWaiterMvuBlockStore,
  type WaiterMvuBlockContext,
  type WaiterMvuBlockId,
  type WaiterMvuBlockStore,
} from './waiterMvuBlocks';
import WaiterPlay from './WaiterPlay.vue';
import {
  TANGQUAN_LOGO_URL,
  normalizeCharacterStandingSuppression,
  resolveCharacterAvatar,
  resolveKnownCharacterStanding,
  resolveCharacterStanding,
  resolveTangquanBackground,
} from './mediaCatalog';
import {
  classifyTangquanViewport,
  makeTangquanViewportCssVariables,
  readTangquanViewportMetrics,
  type TangquanViewportMetrics,
  type TangquanViewportMode,
} from './mobileViewport';
import { makeWaiterGenerationInjects } from './waiterPrompts';
import { planTangquanTimeTravel } from './timeTravel';
import {
  normalizeTangquanAirpOutputMode,
  toggleTangquanAirpOutputMode,
  withTangquanAirpOutputMode,
} from './airpOutputMode';
import {
  buildTangquanSceneHistoryPrompts,
  makeTangquanContactSceneId,
  makeTangquanRuntimeSceneId,
  makeTangquanSceneEntityId,
  normalizeTangquanParticipantIds,
  type TangquanSceneHistoryMessage,
  type TangquanSceneIdentity,
} from './sceneHistory';
import {
  applyBossStatDataToState,
  cloneMvuBlockStore,
  composeStatDataWithBlocks,
  deactivateStatDataBlocks,
  makeAreaEntryContent,
  makeBossCommonStatData,
  makeCandidateEntryContent,
  makeEmployeeEntryContent,
  makeGuestEntryContent,
  makeMvuBlockStore,
  makeProjectEntryContent,
  normalizeMvuBlockStore,
  type BossMvuBlockContext,
  type TangquanMvuBlockId,
  type TangquanMvuBlockStore,
} from './mvuBlocks';
import { getTangquanUiSettings, patchTangquanUiSettings, type TangquanUiSettings } from './settings';
import type { TangquanGameUiServices } from './types';

type Mode = Exclude<TangquanPlayMode, '未选择'>;
type ActivePage = 'home' | 'play';
type TitlePanel = 'landing' | 'modes' | 'load' | 'profile' | 'settings';
type TitleMenuKey = 'start' | 'continue' | 'load' | 'settings';
type SavePanelContext = 'title' | 'play';
type SettingKey = keyof TangquanUiSettings;
type BossMenuView =
  | 'overview'
  | 'schedule'
  | 'areas'
  | 'employees'
  | 'projects'
  | 'nominations'
  | 'market'
  | 'recruit'
  | 'facilities'
  | 'settlement';
type ConfirmState = {
  title: string;
  message: string;
};
type BossShiftSelection = {
  name: string;
  index: number;
};
type BossBuildingNode = BossBuildingCatalogItem & {
  x: number;
  y: number;
  statusClass: string;
  levelText: string;
  requirementText: string;
  actionText: string;
  canAct: boolean;
  effectText: string;
};
type BossBuildingLine = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  statusClass: string;
};
type BossBuildingDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};
type AirpSceneState = {
  mode: Mode;
  kind?: 'dialogue' | 'story' | 'message';
  outputMode?: 'dialogue' | 'story';
  sceneId?: string;
  startedAfterMessageId?: number;
  speakerId?: string;
  participantIds?: string[];
  locationId?: string;
  serviceId?: string;
  projectId?: string;
  assignmentId?: string;
  characterId?: string;
  suppressCharacterStanding?: boolean;
  title: string;
  note: string;
  speaker: string;
  participants?: string[];
  line: string;
  placeholder: string;
  scene: Record<string, unknown>;
  entryIds: string[];
  entryContentMap?: Record<string, string>;
  blockIds?: TangquanMvuBlockId[];
  blockContext?: BossMvuBlockContext;
  customerBlockIds?: CustomerMvuBlockId[];
  customerBlockContext?: CustomerMvuBlockContext;
  waiterBlockIds?: WaiterMvuBlockId[];
  waiterBlockContext?: WaiterMvuBlockContext;
};
type CustomerGenerationKind = NonNullable<AirpSceneState['kind']>;
type CustomerGenerationLink = {
  version: 1;
  traceId: string;
  kind: CustomerGenerationKind;
  outputMode: 'dialogue' | 'story';
  speaker: string;
  contactName: string;
  userMessageId: number;
  assistantMessageId: number;
  contactUserMessageId: string;
  contactReplyMessageId: string;
};
type CustomerUiSaveState = {
  version: 1;
  view: CustomerMenuView;
  menuOpen: boolean;
  selectedEmployee: string;
  selectedProject: string;
  selectedContact: string;
  inviteSelection: string[];
  storyOpen: boolean;
  airpState: AirpSceneState | null;
  airpInput: string;
  generationLinks: CustomerGenerationLink[];
  contactOutputMode: 'dialogue' | 'story';
};
type BossUiSaveState = {
  version: 1;
  view: BossMenuView;
  menuOpen: boolean;
  airpState: AirpSceneState | null;
  airpInput: string;
};
type WaiterUiSaveState = {
  version: 1;
  view: WaiterMenuView;
  menuOpen: boolean;
  selectedAssignmentId: string;
  airpState: AirpSceneState | null;
  airpInput: string;
  generationLinks: WaiterGenerationLink[];
};
type WaiterGenerationLink = {
  version: 1;
  traceId: string;
  assignmentId: string;
  userMessageId: number;
  assistantMessageId: number;
};
type SceneGenerationExtra = {
  version: 1 | 2;
  traceId: string;
  mode: Mode;
  kind: CustomerGenerationKind;
  outputMode?: 'dialogue' | 'story';
  sceneKey: string;
  speaker: string;
  participants?: string[];
  sceneId?: string;
  startedAfterMessageId?: number;
  speakerId?: string;
  participantIds?: string[];
  locationId?: string;
  serviceId?: string;
  projectId?: string;
  assignmentId?: string;
  role: 'user' | 'assistant';
};
type SceneGenerationPair = {
  traceId: string;
  extra: SceneGenerationExtra;
  userMessage: ChatMessageSwiped;
  assistantMessage: ChatMessageSwiped;
};
type UiMemorySnapshot = {
  version: 1;
  activePage: ActivePage;
  activePanel: TitlePanel;
  savePanelContext: SavePanelContext;
  selectedMode: Mode;
  activeMode: Mode;
  activeUserName: string;
  activeUserGenderKey: TangquanUserGenderKey;
  tutorialProgress?: TutorialProgress;
  currentSlotLabel: string;
  selectedSlotId: string;
  bossState: BossPageState;
  bossView: BossMenuView;
  bossMenuOpen: boolean;
  bossActiveShift: BossShiftSelection | null;
  bossSelectedBuildingId: string;
  bossBuildingPan: { x: number; y: number };
  bossBuildingScale: number;
  bossBuildingViewInitialized: boolean;
  bossSpeakerName: string;
  bossDialogueText: string;
  airpState: AirpSceneState | null;
  airpInput: string;
  activeTemporaryEntryIds: string[];
  mvuBlockStore: TangquanMvuBlockStore;
  customerState: CustomerPageState;
  customerView: CustomerMenuView;
  customerMenuOpen: boolean;
  customerSelectedEmployee: string;
  customerSelectedProject: string;
  customerSelectedContact: string;
  customerInviteSelection: string[];
  customerStoryOpen: boolean;
  customerMvuBlockStore: CustomerMvuBlockStore;
  customerGenerationLinks: CustomerGenerationLink[];
  waiterState: WaiterPageState;
  waiterView: WaiterMenuView;
  waiterMenuOpen: boolean;
  waiterSelectedAssignmentId: string;
  waiterMvuBlockStore: WaiterMvuBlockStore;
  waiterGenerationLinks: WaiterGenerationLink[];
  sceneDialoguePages: TangquanDialoguePage[];
  sceneDialoguePageIndex: number;
  sceneStoryText: string;
  sceneStoryOpen: boolean;
};

const SAVE_SLOT_COUNT = 12;
const SAVE_SLOT_IDS = Array.from(
  { length: SAVE_SLOT_COUNT },
  (_, index) => `slot-${String(index + 1).padStart(2, '0')}`,
);
const CUSTOMER_MENU_VIEWS: CustomerMenuView[] = [
  'today',
  'areas',
  'projects',
  'nomination',
  'relationship',
  'contacts',
  'schedule',
  'wallet',
];
const WAITER_MENU_VIEWS: WaiterMenuView[] = [
  'shift',
  'service',
  'nomination',
  'growth',
  'finance',
  'rating',
  'investment',
  'log',
];
const BOSS_BUILDING_BRANCH_ORDER: BossInfrastructureKey[] = [
  '前台接待',
  '更衣清洗',
  '汤池',
  '休息区',
  '理疗区',
  '包间',
  '餐饮区',
  '客房',
  '庭院',
  '员工休息室',
  '后勤',
  '占地规模',
];
const BOSS_BUILDING_ANCHORS: Record<BossInfrastructureKey, string> = {
  占地规模: 'area_lobby',
  前台接待: 'area_lobby',
  更衣清洗: 'area_changing',
  汤池: 'area_indoor_bath',
  休息区: 'area_rest_hall',
  理疗区: 'area_massage',
  包间: 'area_basic_room',
  餐饮区: 'area_tea_corner',
  客房: 'area_guest_room',
  庭院: 'area_garden_path',
  员工休息室: 'area_staff_room',
  后勤: 'area_office',
};
const BOSS_BUILDING_MAP_SIZE = { width: 2200, height: 2100 };
const BOSS_BUILDING_NODE_SIZE = { width: 142, height: 66 };
const BOSS_BUILDING_ZOOM = { min: 0.28, max: 1.3, step: 0.1 };

const props = defineProps<{
  services: TangquanGameUiServices;
  onClose: () => void;
}>();

interface BrowserFullscreenContext {
  target: Element;
  ownerDocument: Document;
  contentDocument: Document;
}

interface BrowserViewportStackSnapshot {
  element: HTMLElement;
  style: string | null;
}

const appRootElement = ref<HTMLElement | null>(null);
const mobileViewportMetrics = ref<TangquanViewportMetrics>({
  width: 1366,
  height: 768,
  offsetLeft: 0,
  offsetTop: 0,
  scale: 1,
  devicePixelRatio: 1,
  maxTouchPoints: 0,
  coarsePointer: false,
});
const mobileViewportMode = ref<TangquanViewportMode>('desktop');
const mobileViewportStyle = computed(() => makeTangquanViewportCssVariables(mobileViewportMetrics.value));
const isBrowserFullscreen = ref(false);
const isBrowserViewportExpanded = ref(false);
const nativeFullscreenSupported = ref(false);
const isImmersiveViewport = computed(() => isBrowserFullscreen.value || isBrowserViewportExpanded.value);
const fullscreenSupported = computed(() => nativeFullscreenSupported.value || mobileViewportMode.value !== 'desktop');
const fullscreenButtonTitle = computed(() => {
  if (isBrowserViewportExpanded.value) return 'Thoát toàn màn hình trong trình duyệt';
  if (isBrowserFullscreen.value) return 'Thoát toàn màn hình';
  if (nativeFullscreenSupported.value) return 'Toàn màn hình';
  if (mobileViewportMode.value !== 'desktop') return 'Toàn màn hình trong trình duyệt';
  return 'Trình duyệt hiện tại không hỗ trợ toàn màn hình';
});
let mobileViewportWindow: Window | null = null;
let browserFullscreenTarget: Element | null = null;
let browserFullscreenDocument: Document | null = null;
let browserFullscreenContentDocument: Document | null = null;
let browserViewportExpandedStyle: string | null = null;
let browserViewportExpandedHtmlOverflow = '';
let browserViewportExpandedBodyOverflow = '';
let browserViewportExpandedStackRoots: BrowserViewportStackSnapshot[] = [];

function refreshMobileViewport() {
  const view = mobileViewportWindow ?? appRootElement.value?.ownerDocument.defaultView;
  if (!view) return;
  const nextMetrics = readTangquanViewportMetrics(view);
  const nextMode = classifyTangquanViewport(nextMetrics);
  const changed = nextMode !== mobileViewportMode.value;
  mobileViewportMetrics.value = nextMetrics;
  mobileViewportMode.value = nextMode;
  if (changed) {
    props.services.log.info('手机横屏', '界面视口模式已切换', {
      viewportMode: nextMode,
      width: Math.round(nextMetrics.width),
      height: Math.round(nextMetrics.height),
      dpr: nextMetrics.devicePixelRatio,
      touchPoints: nextMetrics.maxTouchPoints,
      coarsePointer: nextMetrics.coarsePointer,
    });
  }
}

function bindMobileViewport() {
  mobileViewportWindow = appRootElement.value?.ownerDocument.defaultView ?? window;
  mobileViewportWindow.addEventListener('resize', refreshMobileViewport);
  mobileViewportWindow.addEventListener('orientationchange', refreshMobileViewport);
  mobileViewportWindow.visualViewport?.addEventListener('resize', refreshMobileViewport);
  mobileViewportWindow.visualViewport?.addEventListener('scroll', refreshMobileViewport);
  refreshMobileViewport();
}

function unbindMobileViewport() {
  mobileViewportWindow?.removeEventListener('resize', refreshMobileViewport);
  mobileViewportWindow?.removeEventListener('orientationchange', refreshMobileViewport);
  mobileViewportWindow?.visualViewport?.removeEventListener('resize', refreshMobileViewport);
  mobileViewportWindow?.visualViewport?.removeEventListener('scroll', refreshMobileViewport);
  mobileViewportWindow = null;
}

function resolveBrowserFullscreenContext(): BrowserFullscreenContext {
  const contentDocument = appRootElement.value?.ownerDocument ?? document;
  const frameElement = contentDocument.defaultView?.frameElement;
  const target = frameElement ?? contentDocument.documentElement;
  return { target, ownerDocument: target.ownerDocument, contentDocument };
}

function syncBrowserFullscreenState() {
  const nextState = Boolean(
    browserFullscreenTarget && browserFullscreenDocument?.fullscreenElement === browserFullscreenTarget,
  );
  if (isBrowserFullscreen.value === nextState) {
    return;
  }
  isBrowserFullscreen.value = nextState;
  props.services.log.info('界面全屏', nextState ? '已进入浏览器全屏' : '已退出浏览器全屏', {
    page: activePage.value,
    mode: activeMode.value,
  });
}

function handleBrowserFullscreenError() {
  props.services.log.warn('界面全屏', '浏览器报告全屏请求失败');
}

function isolateFullscreenEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !isImmersiveViewport.value) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  void exitBrowserFullscreen();
}

function bindBrowserFullscreen() {
  const { target, ownerDocument, contentDocument } = resolveBrowserFullscreenContext();
  browserFullscreenTarget = target;
  browserFullscreenDocument = ownerDocument;
  browserFullscreenContentDocument = contentDocument;
  nativeFullscreenSupported.value = ownerDocument.fullscreenEnabled && typeof target.requestFullscreen === 'function';
  ownerDocument.addEventListener('fullscreenchange', syncBrowserFullscreenState);
  ownerDocument.addEventListener('fullscreenerror', handleBrowserFullscreenError);
  ownerDocument.addEventListener('keydown', isolateFullscreenEscape, true);
  if (ownerDocument !== contentDocument) {
    contentDocument.addEventListener('keydown', isolateFullscreenEscape, true);
  }
  syncBrowserFullscreenState();
}

function unbindBrowserFullscreen() {
  browserFullscreenDocument?.removeEventListener('fullscreenchange', syncBrowserFullscreenState);
  browserFullscreenDocument?.removeEventListener('fullscreenerror', handleBrowserFullscreenError);
  browserFullscreenDocument?.removeEventListener('keydown', isolateFullscreenEscape, true);
  if (browserFullscreenDocument !== browserFullscreenContentDocument) {
    browserFullscreenContentDocument?.removeEventListener('keydown', isolateFullscreenEscape, true);
  }
  browserFullscreenTarget = null;
  browserFullscreenDocument = null;
  browserFullscreenContentDocument = null;
  nativeFullscreenSupported.value = false;
  isBrowserFullscreen.value = false;
}

function syncBrowserViewportExpansionSize() {
  const target = browserFullscreenTarget as HTMLElement | null;
  const view = browserFullscreenDocument?.defaultView;
  if (!target?.style || !view || !isBrowserViewportExpanded.value) return;
  const viewport = readTangquanViewportMetrics(view);
  Object.assign(target.style, {
    position: 'fixed',
    left: `${Math.round(viewport.offsetLeft)}px`,
    top: `${Math.round(viewport.offsetTop)}px`,
    width: `${Math.round(viewport.width)}px`,
    height: `${Math.round(viewport.height)}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    margin: '0',
    border: '0',
    aspectRatio: 'auto',
    zIndex: '2147483647',
  });
}

function enterBrowserViewportExpansion(): boolean {
  const target = browserFullscreenTarget as HTMLElement | null;
  const ownerDocument = browserFullscreenDocument;
  const ownerWindow = ownerDocument?.defaultView;
  if (
    !target?.style ||
    !ownerDocument ||
    !ownerWindow ||
    mobileViewportMode.value === 'desktop' ||
    isBrowserViewportExpanded.value
  ) {
    return false;
  }

  browserViewportExpandedStyle = target.getAttribute('style');
  browserViewportExpandedHtmlOverflow = ownerDocument.documentElement.style.overflow;
  browserViewportExpandedBodyOverflow = ownerDocument.body?.style.overflow ?? '';
  browserViewportExpandedStackRoots = [target.closest<HTMLElement>('#chat'), target.closest<HTMLElement>('#sheld')]
    .filter((element): element is HTMLElement => Boolean(element))
    .map(element => ({ element, style: element.getAttribute('style') }));
  ownerDocument.documentElement.style.overflow = 'hidden';
  if (ownerDocument.body) ownerDocument.body.style.overflow = 'hidden';
  browserViewportExpandedStackRoots.forEach(({ element }) => {
    element.style.zIndex = element.id === 'chat' ? '2147483646' : '2147483645';
  });
  target.dataset.tqBrowserViewportExpanded = 'true';
  isBrowserViewportExpanded.value = true;
  ownerWindow.addEventListener('resize', syncBrowserViewportExpansionSize);
  ownerWindow.visualViewport?.addEventListener('resize', syncBrowserViewportExpansionSize);
  ownerWindow.visualViewport?.addEventListener('scroll', syncBrowserViewportExpansionSize);
  syncBrowserViewportExpansionSize();
  props.services.log.info('界面全屏', '已进入手机浏览器内容视口全屏', {
    page: activePage.value,
    mode: activeMode.value,
    width: Math.round(mobileViewportMetrics.value.width),
    height: Math.round(mobileViewportMetrics.value.height),
  });
  return true;
}

function exitBrowserViewportExpansion() {
  const target = browserFullscreenTarget as HTMLElement | null;
  const ownerDocument = browserFullscreenDocument;
  const ownerWindow = ownerDocument?.defaultView;
  if (!target || !ownerDocument || !ownerWindow || !isBrowserViewportExpanded.value) return;

  ownerWindow.removeEventListener('resize', syncBrowserViewportExpansionSize);
  ownerWindow.visualViewport?.removeEventListener('resize', syncBrowserViewportExpansionSize);
  ownerWindow.visualViewport?.removeEventListener('scroll', syncBrowserViewportExpansionSize);
  if (browserViewportExpandedStyle === null) target.removeAttribute('style');
  else target.setAttribute('style', browserViewportExpandedStyle);
  delete target.dataset.tqBrowserViewportExpanded;
  browserViewportExpandedStackRoots.forEach(({ element, style }) => {
    if (style === null) element.removeAttribute('style');
    else element.setAttribute('style', style);
  });
  ownerDocument.documentElement.style.overflow = browserViewportExpandedHtmlOverflow;
  if (ownerDocument.body) ownerDocument.body.style.overflow = browserViewportExpandedBodyOverflow;
  browserViewportExpandedStyle = null;
  browserViewportExpandedStackRoots = [];
  isBrowserViewportExpanded.value = false;
  ownerWindow.dispatchEvent(new ownerWindow.Event('resize'));
  props.services.log.info('界面全屏', '已退出手机浏览器内容视口全屏');
}

async function toggleBrowserFullscreen() {
  const target = browserFullscreenTarget;
  const ownerDocument = browserFullscreenDocument;
  if (!target || !ownerDocument || !fullscreenSupported.value) {
    showToast('Trình duyệt hiện tại không hỗ trợ toàn màn hình');
    return;
  }

  if (ownerDocument.fullscreenElement === target) {
    await ownerDocument.exitFullscreen();
    return;
  }
  if (isBrowserViewportExpanded.value) {
    exitBrowserViewportExpansion();
    return;
  }

  if (nativeFullscreenSupported.value) {
    try {
      await target.requestFullscreen();
      return;
    } catch (error) {
      props.services.log.warn('界面全屏', '标准全屏请求失败，准备检查手机浏览器内降级', String(error));
      syncBrowserFullscreenState();
    }
  }

  if (enterBrowserViewportExpansion()) {
    showToast('Đã dùng chế độ toàn màn hình trong trình duyệt');
  } else {
    showToast('Trình duyệt hiện tại không hỗ trợ toàn màn hình');
  }
}

async function exitBrowserFullscreen() {
  const target = browserFullscreenTarget;
  const ownerDocument = browserFullscreenDocument;
  if (target && ownerDocument && ownerDocument.fullscreenElement === target) {
    try {
      await ownerDocument.exitFullscreen();
    } catch (error) {
      props.services.log.warn('界面全屏', '收起界面前退出全屏失败', String(error));
    }
  }
  exitBrowserViewportExpansion();
}

async function closeFrontend() {
  await exitBrowserFullscreen();
  props.onClose();
}

const modes: { key: Mode; mark: string; title: string; note: string }[] = [
  {
    key: '老板',
    mark: '店',
    title: 'Chủ kinh doanh',
    note: 'Bạn đóng vai chủ kinh doanh của Hoa Chưa Nở, sắp xếp ca làm, nhân tài, kết toán thu nhập, và cũng có thể tự mình bước vào hiện trường.',
  },
  {
    key: '游客',
    mark: '客',
    title: 'Khách đến quán',
    note: 'Bạn đóng vai khách đến tiêu dùng tại quán, tiến triển bằng chỉ định, dịch vụ, thiện cảm, liên hệ và hẹn riêng.',
  },
  {
    key: '服务员',
    mark: '侍',
    title: 'Nhân viên phục vụ tại quán',
    note: 'Bạn đóng vai nhân viên phục vụ làm việc tại quán, nhận ca tiếp đón, nhận đánh giá, và thúc đẩy thay đổi hạng đánh giá của bản thân.',
  },
];

const bossTabs: { key: BossMenuView; title: string; note: string }[] = [
  { key: 'overview', title: 'Tổng quan', note: 'Thông tin kinh doanh quan trọng nhất hôm nay.' },
  { key: 'schedule', title: 'Xếp ca', note: 'Bấm khung giờ tương ứng của nhân viên rồi chọn vị trí hoặc nghỉ ngơi.' },
  { key: 'areas', title: 'Khu vực', note: 'Xem lượng khách và nhân viên đang làm ở từng khu vực.' },
  { key: 'employees', title: 'Nhân viên', note: 'Nhân viên cùng khu vực có thể trò chuyện, tăng lương ngày hoặc xem dịch vụ.' },
  { key: 'projects', title: 'Dự án', note: 'Giá trị đề xuất của dự án ảnh hưởng đến lượng khách và điều chỉnh giá sau này.' },
  { key: 'nominations', title: 'Chỉ định', note: 'Chỉ định xuyên ngày tiếp diễn theo số ngày còn lại.' },
  { key: 'market', title: 'Chợ nhân tài', note: 'Xem nhân tài có thể mua vào.' },
  { key: 'recruit', title: 'Tuyển dụng', note: 'Ứng viên mặc định làm mới mỗi 12 giờ.' },
  { key: 'facilities', title: 'Cơ sở hạ tầng', note: 'Mở rộng cơ sở, bảo trì môi trường và nâng giới hạn tiếp đón.' },
  { key: 'settlement', title: 'Kết toán', note: 'Kết toán kinh doanh hôm nay và tiến đến 00:00.' },
];

const profileGenderOptions: { key: TangquanUserGenderKey; label: string }[] = [
  { key: '男', label: 'Nam' },
  { key: '女', label: 'Nữ' },
  { key: '扶她', label: 'Futanari' },
  { key: '男娘', label: 'Trai giả gái' },
  { key: '双性', label: 'Lưỡng tính' },
  { key: '无性', label: 'Vô tính' },
  { key: '自定义', label: 'Tùy chỉnh' },
];

const settingGroups: {
  key: SettingKey;
  title: string;
  note: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: 'fontSize',
    title: 'Cỡ chữ',
    note: 'Kích thước văn bản khi đọc',
    options: [
      { value: 'small', label: 'Nhỏ' },
      { value: 'standard', label: 'Tiêu chuẩn' },
      { value: 'large', label: 'Lớn' },
      { value: 'xlarge', label: 'Rất lớn' },
    ],
  },
  {
    key: 'fontFamily',
    title: 'Kiểu chữ',
    note: 'Ưu tiên bầu không khí hay rõ ràng',
    options: [
      { value: 'default', label: 'Mặc định' },
      { value: 'elegant', label: 'Tao nhã' },
      { value: 'clear', label: 'Rõ ràng' },
    ],
  },
  {
    key: 'layout',
    title: 'Bố cục giao diện',
    note: 'Tự động thích ứng các màn hình khác nhau',
    options: [
      { value: 'auto', label: 'Tự động' },
      { value: 'compact', label: 'Gọn' },
      { value: 'wide', label: 'Rộng rãi' },
    ],
  },
  {
    key: 'panel',
    title: 'Độ trong suốt hộp thoại',
    note: 'Ưu tiên chữ hay ưu tiên hình ảnh',
    options: [
      { value: 'clear', label: 'Rõ ràng' },
      { value: 'standard', label: 'Tiêu chuẩn' },
      { value: 'soft', label: 'Trong suốt' },
    ],
  },
];

const settings = ref<TangquanUiSettings>(getTangquanUiSettings());
const runtime = ref<TangquanSaveRuntime>(props.services.save.getRuntime());
const activePage = ref<ActivePage>('home');
const activePanel = ref<TitlePanel>('landing');
const savePanelContext = ref<SavePanelContext>('title');
const selectedMode = ref<Mode>(runtime.value.activeMode === '未选择' ? '老板' : runtime.value.activeMode);
const modeSelectionReady = ref(false);
const activeMode = ref<Mode>(selectedMode.value);
const currentSlotLabel = ref('Save mới');
const slots = ref<TangquanSaveSlotMeta[]>([]);
const selectedSlotId = ref(SAVE_SLOT_IDS[0]);
const inspection = ref<TangquanSaveInspection | null>(null);
const showSaveTools = ref(false);
const profileName = ref('');
const profileGenderKey = ref<TangquanUserGenderKey>('男');
const profileGenderText = ref('');
const profileDescription = ref('');
const activeUserName = ref('');
const activeUserGenderKey = ref<TangquanUserGenderKey>('男');
const tutorialProgress = ref<TutorialProgress>(makeTutorialProgress(activeMode.value));
const importInput = ref<HTMLInputElement | null>(null);
const confirmState = ref<ConfirmState | null>(null);
const timePickerOpen = ref(false);
const bossState = ref<BossPageState>(makeBossPageState());
const bossView = ref<BossMenuView>('overview');
const bossMenuOpen = ref(false);
const bossActiveShift = ref<BossShiftSelection | null>(null);
const bossSelectedBuildingId = ref('');
const bossBuildingMapRef = ref<HTMLElement | null>(null);
const bossBuildingPan = ref({ x: 0, y: 0 });
const bossBuildingScale = ref(0.68);
const bossBuildingViewInitialized = ref(false);
const bossBuildingDrag = ref<BossBuildingDragState | null>(null);
const bossSpeakerName = ref('Chủ tiệm');
const bossDialogueText = ref('Cửa tiệm đã bật đèn, việc kinh doanh, xếp ca và tương tác hiện trường hôm nay sẽ tiếp tục từ đây.');
const initialCustomerState = makeCustomerPageState();
const customerState = ref<CustomerPageState>(initialCustomerState);
const customerView = ref<CustomerMenuView>('today');
const customerMenuOpen = ref(false);
const customerSelectedEmployee = ref(getCustomerCurrentEmployee(initialCustomerState)?.姓名 ?? '');
const customerSelectedProject = ref(Object.keys(initialCustomerState.项目)[0] ?? '');
const customerSelectedContact = ref('');
const customerInviteSelection = ref<string[]>([]);
const customerStoryOpen = ref(false);
const customerMvuBlockStore = ref<CustomerMvuBlockStore>(makeCustomerMvuBlockStore());
const customerGenerationLinks = ref<CustomerGenerationLink[]>([]);
const customerContactOutputMode = ref<'dialogue' | 'story'>('dialogue');
const initialWaiterState = makeWaiterPageState();
const waiterState = ref<WaiterPageState>(initialWaiterState);
const waiterView = ref<WaiterMenuView>('shift');
const waiterMenuOpen = ref(false);
const waiterSelectedAssignmentId = ref(initialWaiterState.assignments[0]?.id ?? '');
const waiterMvuBlockStore = ref<WaiterMvuBlockStore>(makeWaiterMvuBlockStore());
const waiterGenerationLinks = ref<WaiterGenerationLink[]>([]);
const airpState = ref<AirpSceneState | null>(null);
const airpInput = ref('');
const airpSubmitting = ref(false);
const realTimeNow = ref(Date.now());
const sceneDialoguePages = ref<TangquanDialoguePage[]>([]);
const sceneDialogueIndex = ref(0);
const sceneStoryText = ref('');
const sceneStoryOpen = ref(false);
const chatHistoryVersion = ref(0);
const activeTemporaryEntryIds = ref<string[]>([]);
const mvuBlockStore = ref<TangquanMvuBlockStore>(makeMvuBlockStore());
const busy = ref(false);
const currentGameTime = computed(() => {
  if (activeMode.value === '游客') return customerState.value.时间;
  if (activeMode.value === '服务员') return waiterState.value.time;
  return bossState.value.时间;
});
const bossHostessCandidates = computed(() => listTangquanCharacters(activeUserGenderKey.value === '女'));

const tutorialActive = computed(
  () =>
    tutorialProgress.value.active &&
    !tutorialProgress.value.completed &&
    tutorialProgress.value.mode === activeMode.value &&
    (activePage.value === 'play' || (savePanelContext.value === 'play' && activePanel.value === 'load')),
);
const tutorialSteps = computed(() => TUTORIAL_STEPS[tutorialProgress.value.mode]);
const currentTutorialStep = computed(() => tutorialSteps.value[tutorialProgress.value.step] ?? null);
const tutorialTarget = computed(() => (tutorialActive.value ? (currentTutorialStep.value?.action ?? '') : ''));
const tutorialStepCount = computed(() => tutorialSteps.value.length);
const tutorialInspectAtri = computed(
  () => tutorialActive.value && tutorialProgress.value.mode === '老板' && tutorialProgress.value.step === 2,
);

watch(tutorialTarget, async target => {
  if (!target) return;
  await nextTick();
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('.tutorial-target')?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'auto',
    });
  });
});

function finishTutorial(skipped: boolean) {
  tutorialProgress.value = {
    ...tutorialProgress.value,
    active: false,
    completed: true,
    skipped,
  };
  writeUiMemorySnapshot(skipped ? '跳过新手引导' : '完成新手引导');
  showToast(skipped ? 'Đã bỏ qua hướng dẫn tân thủ' : 'Hướng dẫn tân thủ hoàn tất');
}

function advanceTutorialWithoutAction() {
  if (!tutorialActive.value || currentTutorialStep.value?.action) return;
  if (tutorialProgress.value.step >= tutorialSteps.value.length - 1) {
    finishTutorial(false);
    return;
  }
  tutorialProgress.value = { ...tutorialProgress.value, step: tutorialProgress.value.step + 1 };
  writeUiMemorySnapshot('新手引导下一步');
}

function completeTutorialAction(action: TutorialAction) {
  if (!tutorialActive.value || currentTutorialStep.value?.action !== action) return;
  if (tutorialProgress.value.step >= tutorialSteps.value.length - 1) {
    finishTutorial(false);
    return;
  }
  tutorialProgress.value = { ...tutorialProgress.value, step: tutorialProgress.value.step + 1 };
  writeUiMemorySnapshot(`新手引导：${action}`);
}

function skipTutorial() {
  if (!tutorialActive.value) return;
  finishTutorial(true);
}
const toastText = ref('');
let toastTimer = 0;
let aiGenerationQueue: Promise<void> = Promise.resolve();
let aiGenerationSequence = 0;
let aiGenerationPending = 0;
let backgroundSyncPending = 0;
let sceneHasUnsavedAiInteraction = false;
let pendingConfirmResolve: ((value: boolean) => void) | null = null;
let customerChatSyncTimer = 0;
let waiterChatSyncTimer = 0;
let bossChatSyncTimer = 0;
let postRemountMvuSyncTimer = 0;
let chatDomSyncTimer = 0;
let realTimeTimer = 0;
let chatMutationObserver: MutationObserver | null = null;
const customerChatEventStops: Array<() => void> = [];
const scheduledBackgroundSyncs = new Set<string>();

function getAutoSaveBlockReasons(): string[] {
  const reasons: string[] = [];
  if (busy.value) reasons.push('界面操作进行中');
  if (airpSubmitting.value) reasons.push('AI互动正在生成或处理楼层');
  if (aiGenerationPending > 0) reasons.push(`AI队列仍有${aiGenerationPending}项任务`);
  if (backgroundSyncPending > 0) reasons.push(`楼层/MVU/世界书后台同步仍有${backgroundSyncPending}项`);
  if (scheduledBackgroundSyncs.size > 0) reasons.push(`楼层/MVU同步定时器仍有${scheduledBackgroundSyncs.size}项`);
  if (props.services.loading.getState().visible) reasons.push('Loading遮罩尚未结束');
  if (confirmState.value || pendingConfirmResolve) reasons.push('确认弹窗仍打开');
  return reasons;
}

function handleAutoSaveEvent(event: TangquanAutoSaveEvent) {
  if (event.type === 'dirty') {
    props.services.log.debug('自动保存', '数据已标记为待保存', {
      reason: event.reason,
      dirtyRevision: event.snapshot.dirtyRevision,
      reasons: event.snapshot.reasons,
    });
    return;
  }
  if (event.type === 'scheduled') {
    props.services.log.debug('自动保存', '保存请求已合并并延后', {
      delayMs: event.delayMs,
      dirtyRevision: event.snapshot.dirtyRevision,
      reasons: event.snapshot.reasons,
    });
    return;
  }
  if (event.type === 'blocked') {
    props.services.log.debug('自动保存', '当前处于禁止保存状态，保留请求稍后重试', {
      trigger: event.result.trigger,
      blockers: event.result.blockers,
      reasons: event.result.reasons,
    });
    return;
  }
  if (event.type === 'start') {
    props.services.log.info('自动保存', '静默完整保存开始', event.context);
    return;
  }
  if (event.type === 'saved') {
    props.services.log.info('自动保存', '静默完整保存完成', {
      trigger: event.result.trigger,
      reasons: event.result.reasons,
      elapsedMs: event.result.elapsedMs,
      ...event.result.meta,
    });
    showToast('Đã tự động lưu');
    return;
  }
  if (event.type === 'failed') {
    props.services.log.error('自动保存', '静默完整保存失败，当前存档保持不变并等待重试', {
      trigger: event.result.trigger,
      reasons: event.result.reasons,
      elapsedMs: event.result.elapsedMs,
      error: event.result.error,
    });
    showToast('Tự động lưu thất bại, sẽ thử lại sau');
    return;
  }
  if (event.type === 'clean') {
    props.services.log.debug('自动保存', '待保存状态已清除', {
      reason: event.reason,
      lastSavedAt: event.snapshot.lastSavedAt,
    });
  }
}

const autoSave = createTangquanAutoSaveController({
  hasActiveSlot: () => Boolean(props.services.save.getRuntime().activeSlotId),
  getBlockState: () => {
    const reasons = getAutoSaveBlockReasons();
    return { blocked: reasons.length > 0, reasons };
  },
  save: async () => {
    const meta = await props.services.save.saveActiveDataQuiet(makeCurrentSaveDataPatch());
    return meta
      ? {
          slotId: meta.slotId,
          chunkCount: meta.chunkCount,
          byteLength: meta.byteLength,
          checksum: meta.checksum,
        }
      : null;
  },
  onEvent: handleAutoSaveEvent,
});

function markAutoSaveDirty(reason: string) {
  autoSave.markDirty(reason);
}

function requestAutoSave(reason: string, force = false): Promise<TangquanAutoSaveResult> {
  return autoSave.request(reason, { force });
}

function getManualTimeTravelBlockReason(): string {
  if (tutorialActive.value) return '请先完成或跳过当前新手引导';
  if (airpState.value) return '请先离开当前互动现场，再推进时间';
  if (activeMode.value === '游客' && customerState.value.当前服务) {
    const status = customerState.value.当前服务.状态;
    return status === '进行中' ? '请先结束当前游客服务' : '请先处理当前已预约服务';
  }
  if (activeMode.value === '服务员' && waiterState.value.currentService) {
    return '请先结束当前服务员接待';
  }
  const autoSaveState = autoSave.inspect();
  if (autoSaveState.saving) return '自动保存正在写入，请稍后再推进时间';
  if (autoSaveState.requestPending) return '已有保存请求等待处理，请稍后再推进时间';
  return getAutoSaveBlockReasons()[0] ?? '';
}

function openTimePicker() {
  const blocker = getManualTimeTravelBlockReason();
  if (blocker) {
    showToast(blocker);
    return;
  }
  timePickerOpen.value = true;
  writeUiMemorySnapshot('打开时间选择器');
}

function closeTimePicker() {
  timePickerOpen.value = false;
  writeUiMemorySnapshot('取消时间选择');
}

function markAutoSaveClean(reason: string, savedAt?: string | number) {
  const normalized =
    typeof savedAt === 'string' ? Date.parse(savedAt) : typeof savedAt === 'number' ? savedAt : Date.now();
  autoSave.markClean(reason, Number.isFinite(normalized) ? normalized : Date.now());
}

async function forceAutoSaveBeforeTransition(reason: string): Promise<boolean> {
  if (!props.services.save.getRuntime().activeSlotId) return true;
  const waitDeadline = Date.now() + 5_000;
  let blockers = getAutoSaveBlockReasons();
  while (blockers.length > 0 && Date.now() < waitDeadline) {
    await new Promise<void>(resolve => window.setTimeout(resolve, 100));
    blockers = getAutoSaveBlockReasons();
  }
  if (blockers.length > 0) {
    props.services.log.warn('自动保存', '切换前等待安全窗口超时，已取消本次切换', { reason, blockers });
    showToast('Hiện vẫn còn nhiệm vụ, tạm thời chưa thể chuyển');
    return false;
  }
  const result = await requestAutoSave(reason, true);
  if (result.status === 'saved' || result.status === 'skipped') return true;
  props.services.log.warn('自动保存', '切换前保存未完成，已取消本次切换', {
    reason,
    status: result.status,
    blockers: result.blockers,
    error: result.error,
  });
  showToast(result.status === 'deferred' ? 'Hiện vẫn còn nhiệm vụ, tạm thời chưa thể chuyển' : 'Lưu thất bại, đã hủy chuyển');
  return false;
}

async function runBackgroundSync<T>(label: string, task: () => Promise<T>): Promise<T> {
  backgroundSyncPending += 1;
  props.services.log.debug('自动保存门禁', '后台同步开始', { label, pending: backgroundSyncPending });
  try {
    return await task();
  } finally {
    backgroundSyncPending = Math.max(0, backgroundSyncPending - 1);
    props.services.log.debug('自动保存门禁', '后台同步结束', { label, pending: backgroundSyncPending });
  }
}

function noteAutoSaveActivity() {
  autoSave.noteActivity();
}

let autoSaveActivityDocument: Document | null = null;

function bindAutoSaveActivity() {
  const contentDocument = appRootElement.value?.ownerDocument ?? document;
  autoSaveActivityDocument = contentDocument;
  contentDocument.addEventListener('pointerdown', noteAutoSaveActivity, true);
  contentDocument.addEventListener('keydown', noteAutoSaveActivity, true);
  contentDocument.addEventListener('input', noteAutoSaveActivity, true);
}

function unbindAutoSaveActivity() {
  autoSaveActivityDocument?.removeEventListener('pointerdown', noteAutoSaveActivity, true);
  autoSaveActivityDocument?.removeEventListener('keydown', noteAutoSaveActivity, true);
  autoSaveActivityDocument?.removeEventListener('input', noteAutoSaveActivity, true);
  autoSaveActivityDocument = null;
}

function enqueueAiGeneration<T>(label: string, task: () => Promise<T>): Promise<T> {
  const sequence = ++aiGenerationSequence;
  const queuedAt = Date.now();
  aiGenerationPending += 1;
  props.services.log.info('AI队列', '生成任务已排队', {
    sequence,
    label,
    pending: aiGenerationPending,
  });

  const operation = aiGenerationQueue.then(async () => {
    props.services.log.info('AI队列', '生成任务开始', {
      sequence,
      label,
      waitMs: Date.now() - queuedAt,
      pending: aiGenerationPending,
    });
    return task();
  });

  aiGenerationQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation.finally(() => {
    aiGenerationPending = Math.max(0, aiGenerationPending - 1);
    props.services.log.info('AI队列', '生成任务结束', {
      sequence,
      label,
      pending: aiGenerationPending,
      elapsedMs: Date.now() - queuedAt,
    });
  });
}

const sceneDialoguePageCount = computed(() =>
  activeMode.value === '游客' ? customerState.value.对话.台词页.length : sceneDialoguePages.value.length,
);
const sceneDialoguePageIndex = computed(() =>
  activeMode.value === '游客' ? customerState.value.对话.当前页 : sceneDialogueIndex.value,
);
const activeSceneDialoguePage = computed<TangquanDialoguePage | null>(() => {
  if (!airpState.value || resolveAirpOutputMode(airpState.value) !== 'dialogue') return null;
  if (activeMode.value === '游客') {
    return customerState.value.对话.台词页[customerState.value.对话.当前页] ?? null;
  }
  return sceneDialoguePages.value[sceneDialogueIndex.value] ?? null;
});
const activeSceneDialogueSpeaker = computed(
  () => activeSceneDialoguePage.value?.speaker.trim() || airpState.value?.speaker.trim() || 'Hoa Chưa Nở',
);
const activeSceneDialogueText = computed(
  () => activeSceneDialoguePage.value?.text.trim() || airpState.value?.line.trim() || '',
);
const sceneStoryParagraphs = computed(() =>
  sceneStoryText.value
    .split(/\r?\n+/)
    .map(item => item.trim())
    .filter(Boolean),
);
const latestSceneGenerationPair = computed(() => {
  void chatHistoryVersion.value;
  return findLatestSceneGenerationPair(airpState.value);
});
const canRerollLatestSceneGeneration = computed(() => {
  const pair = latestSceneGenerationPair.value;
  return Boolean(pair && pair.assistantMessage.message_id === getLastMessageId());
});

function resolvePresetOutputFormat(scene: AirpSceneState | null): 'none' | 'galgame' | 'airp' {
  if (!scene) {
    return 'none';
  }
  return resolveAirpOutputMode(scene) === 'story' ? 'airp' : 'galgame';
}

function resolveAirpOutputMode(scene: AirpSceneState): 'dialogue' | 'story' {
  return normalizeTangquanAirpOutputMode(scene.outputMode, scene.kind);
}

async function syncPresetOutputFormat(scene: AirpSceneState | null, reason: string): Promise<void> {
  await props.services.presetOutputFormat.setFormat(resolvePresetOutputFormat(scene), reason);
}

function makeUiMemorySnapshot(): UiMemorySnapshot {
  return {
    version: 1,
    activePage: activePage.value,
    activePanel: activePanel.value,
    savePanelContext: savePanelContext.value,
    selectedMode: selectedMode.value,
    activeMode: activeMode.value,
    activeUserName: activeUserName.value,
    activeUserGenderKey: activeUserGenderKey.value,
    tutorialProgress: _.cloneDeep(tutorialProgress.value),
    currentSlotLabel: currentSlotLabel.value,
    selectedSlotId: selectedSlotId.value,
    bossState: cloneBossPageState(bossState.value),
    bossView: bossView.value,
    bossMenuOpen: bossMenuOpen.value,
    bossActiveShift: bossActiveShift.value ? { ...bossActiveShift.value } : null,
    bossSelectedBuildingId: bossSelectedBuildingId.value,
    bossBuildingPan: { ...bossBuildingPan.value },
    bossBuildingScale: bossBuildingScale.value,
    bossBuildingViewInitialized: bossBuildingViewInitialized.value,
    bossSpeakerName: bossSpeakerName.value,
    bossDialogueText: bossDialogueText.value,
    airpState: airpState.value ? _.cloneDeep(airpState.value) : null,
    airpInput: airpInput.value,
    activeTemporaryEntryIds: [...activeTemporaryEntryIds.value],
    mvuBlockStore: cloneMvuBlockStore(mvuBlockStore.value),
    customerState: cloneCustomerPageState(customerState.value),
    customerView: customerView.value,
    customerMenuOpen: customerMenuOpen.value,
    customerSelectedEmployee: customerSelectedEmployee.value,
    customerSelectedProject: customerSelectedProject.value,
    customerSelectedContact: customerSelectedContact.value,
    customerInviteSelection: [...customerInviteSelection.value],
    customerStoryOpen: customerStoryOpen.value,
    customerMvuBlockStore: cloneCustomerMvuBlockStore(customerMvuBlockStore.value),
    customerGenerationLinks: _.cloneDeep(customerGenerationLinks.value),
    waiterState: cloneWaiterPageState(waiterState.value),
    waiterView: waiterView.value,
    waiterMenuOpen: waiterMenuOpen.value,
    waiterSelectedAssignmentId: waiterSelectedAssignmentId.value,
    waiterMvuBlockStore: cloneWaiterMvuBlockStore(waiterMvuBlockStore.value),
    waiterGenerationLinks: _.cloneDeep(waiterGenerationLinks.value),
    sceneDialoguePages: _.cloneDeep(sceneDialoguePages.value),
    sceneDialoguePageIndex: sceneDialogueIndex.value,
    sceneStoryText: sceneStoryText.value,
    sceneStoryOpen: sceneStoryOpen.value,
  };
}

function writeUiMemorySnapshot(reason = '界面状态更新') {
  props.services.uiMemory?.write(makeUiMemorySnapshot());
  props.services.log.debug('界面记忆', '已记录当前显示状态', { reason });
}

function clearUiMemorySnapshot(reason = '清空界面状态') {
  props.services.uiMemory?.clear();
  props.services.log.debug('界面记忆', '已清空当前显示状态', { reason });
}

async function restoreUiMemorySnapshot(): Promise<boolean> {
  const rawSnapshot = props.services.uiMemory?.read();
  if (!isRecord(rawSnapshot) || rawSnapshot.version !== 1) {
    return false;
  }

  const snapshot = rawSnapshot as UiMemorySnapshot;
  try {
    activePage.value = snapshot.activePage;
    activePanel.value = snapshot.activePanel;
    savePanelContext.value = snapshot.savePanelContext;
    selectedMode.value = snapshot.selectedMode;
    activeMode.value = snapshot.activeMode;
    activeUserName.value = snapshot.activeUserName?.trim() || 'Chủ tiệm';
    activeUserGenderKey.value = snapshot.activeUserGenderKey ?? '男';
    tutorialProgress.value = normalizeTutorialProgress(snapshot.tutorialProgress, snapshot.activeMode);
    currentSlotLabel.value = snapshot.currentSlotLabel;
    selectedSlotId.value = snapshot.selectedSlotId;
    bossState.value = recalculateBossState(normalizeBossPageState(snapshot.bossState));
    bossView.value = snapshot.bossView;
    bossMenuOpen.value = snapshot.bossMenuOpen;
    bossActiveShift.value = snapshot.bossActiveShift ? { ...snapshot.bossActiveShift } : null;
    bossSelectedBuildingId.value = snapshot.bossSelectedBuildingId;
    bossBuildingPan.value = { ...snapshot.bossBuildingPan };
    bossBuildingScale.value = snapshot.bossBuildingScale;
    bossBuildingViewInitialized.value = snapshot.bossBuildingViewInitialized;
    bossSpeakerName.value =
      snapshot.bossSpeakerName && snapshot.bossSpeakerName !== 'Hoa Chưa Nở'
        ? snapshot.bossSpeakerName
        : activeUserName.value;
    bossDialogueText.value = snapshot.bossDialogueText;
    sceneDialoguePages.value = Array.isArray(snapshot.sceneDialoguePages)
      ? _.cloneDeep(snapshot.sceneDialoguePages).filter(page => page && typeof page.text === 'string')
      : [];
    sceneDialogueIndex.value = _.clamp(
      Number(snapshot.sceneDialoguePageIndex) || 0,
      0,
      Math.max(0, sceneDialoguePages.value.length - 1),
    );
    sceneStoryText.value = typeof snapshot.sceneStoryText === 'string' ? snapshot.sceneStoryText : '';
    sceneStoryOpen.value = Boolean(snapshot.sceneStoryOpen && sceneStoryText.value);
    airpState.value = snapshot.airpState ? _.cloneDeep(snapshot.airpState) : null;
    airpInput.value = snapshot.airpInput;
    airpSubmitting.value = false;
    activeTemporaryEntryIds.value = [...snapshot.activeTemporaryEntryIds];
    mvuBlockStore.value = normalizeMvuBlockStore(snapshot.mvuBlockStore);
    customerState.value = setCustomerFemaleUser(
      normalizeCustomerPageState(snapshot.customerState),
      activeUserGenderKey.value === '女',
    );
    customerView.value = snapshot.customerView ?? 'today';
    customerMenuOpen.value = Boolean(snapshot.customerMenuOpen);
    customerSelectedEmployee.value =
      snapshot.customerSelectedEmployee || getCustomerCurrentEmployee(customerState.value)?.姓名 || '';
    customerSelectedProject.value = snapshot.customerSelectedProject || Object.keys(customerState.value.项目)[0] || '';
    customerSelectedContact.value =
      snapshot.customerSelectedContact || Object.keys(customerState.value.联系人)[0] || '';
    customerInviteSelection.value = Array.isArray(snapshot.customerInviteSelection)
      ? snapshot.customerInviteSelection
          .filter(name => typeof name === 'string' && Boolean(customerState.value.联系人[name]))
          .slice(0, 4)
      : [];
    customerStoryOpen.value = Boolean(snapshot.customerStoryOpen);
    customerMvuBlockStore.value = normalizeCustomerMvuBlockStore(snapshot.customerMvuBlockStore);
    customerGenerationLinks.value = normalizeCustomerGenerationLinks(snapshot.customerGenerationLinks);
    waiterState.value = normalizeWaiterPageState(snapshot.waiterState);
    waiterView.value = snapshot.waiterView ?? 'shift';
    waiterMenuOpen.value = Boolean(snapshot.waiterMenuOpen);
    waiterSelectedAssignmentId.value =
      snapshot.waiterSelectedAssignmentId || waiterState.value.assignments[0]?.id || '';
    waiterMvuBlockStore.value = normalizeWaiterMvuBlockStore(snapshot.waiterMvuBlockStore);
    waiterGenerationLinks.value = normalizeWaiterGenerationLinks(snapshot.waiterGenerationLinks);

    if (activePage.value === 'play' && activeMode.value === '老板') {
      await props.services.worldbookRuntime.syncModeEntries('老板', runtime.value.activeSlotId || selectedSlotId.value);
      const current = await props.services.mvuRuntime.readCurrentStatData();
      const restored = applyBossStatDataToState(bossState.value, mvuBlockStore.value, current, true);
      bossState.value = restored.state;
      mvuBlockStore.value = restored.store;
      await restoreBossSceneRuntime(airpState.value?.mode === '老板' ? airpState.value : null, '界面重挂恢复');
    }
    if (activePage.value === 'play' && activeMode.value === '游客') {
      await props.services.worldbookRuntime.syncModeEntries('游客', runtime.value.activeSlotId || selectedSlotId.value);
      const current = await props.services.mvuRuntime.readCurrentStatData();
      const restored = applyCustomerStatDataToState(customerState.value, customerMvuBlockStore.value, current, true);
      customerState.value = restored.state;
      customerMvuBlockStore.value = restored.store;
      await restoreCustomerSceneRuntime(airpState.value?.mode === '游客' ? airpState.value : null, '界面重挂恢复');
    }
    if (activePage.value === 'play' && activeMode.value === '服务员') {
      await props.services.worldbookRuntime.syncModeEntries(
        '服务员',
        runtime.value.activeSlotId || selectedSlotId.value,
      );
      const current = await props.services.mvuRuntime.readCurrentStatData();
      const restored = applyWaiterStatDataToState(waiterState.value, waiterMvuBlockStore.value, current, true);
      waiterState.value = restored.state;
      waiterMvuBlockStore.value = restored.store;
      await restoreWaiterSceneRuntime(airpState.value?.mode === '服务员' ? airpState.value : null, '界面重挂恢复');
    }

    props.services.log.info('Vue前端', '已从运行期记忆恢复游玩界面', {
      activePage: activePage.value,
      activeMode: activeMode.value,
      bossView: bossView.value,
      airp: Boolean(airpState.value),
    });
    schedulePostRemountMvuReconcile();
    return true;
  } catch (error) {
    clearUiMemorySnapshot('运行期记忆损坏');
    props.services.log.warn('Vue前端', '运行期记忆恢复失败，改用存档恢复', String(error));
    return false;
  }
}

const titleMenuItems: { key: TitleMenuKey; label: string }[] = [
  { key: 'start', label: 'Bắt đầu trò chơi' },
  { key: 'continue', label: 'Tiếp tục trò chơi' },
  { key: 'load', label: 'Save' },
  { key: 'settings', label: 'Cài đặt' },
];

const slotViews = computed(() =>
  SAVE_SLOT_IDS.map((id, index) => ({
    id,
    label: `Save ${String(index + 1).padStart(2, '0')}`,
    meta: slots.value.find(slot => slot.slotId === id) ?? null,
  })),
);

const selectedSlotMeta = computed(() => slots.value.find(slot => slot.slotId === selectedSlotId.value) ?? null);

const selectedModeTitle = computed(
  () => modes.find(mode => mode.key === selectedMode.value)?.title ?? selectedMode.value,
);

const isBossMenuVisible = computed(() => activeMode.value === '老板' && bossMenuOpen.value);
const isPlayMenuVisible = computed(
  () =>
    isBossMenuVisible.value ||
    (activeMode.value === '游客' && customerMenuOpen.value) ||
    (activeMode.value === '服务员' && waiterMenuOpen.value),
);

const activeBossTab = computed(() => bossTabs.find(tab => tab.key === bossView.value) ?? bossTabs[0]);

const bossPayroll = computed(() => bossState.value.员工.reduce((sum, employee) => sum + employee.日薪, 0));

const bossHotProject = computed(() => [...bossState.value.项目].sort((a, b) => b.推荐值 - a.推荐值)[0] ?? null);

const bossCurrentStaff = computed(() =>
  bossState.value.员工.filter(employee => employee.区域 === bossState.value.地点),
);

const bossCurrentStaffText = computed(() => bossCurrentStaff.value.map(employee => employee.姓名).join('、') || 'Chưa có');

const bossScheduleChoices = computed(() => ['休息', '待命', ...bossState.value.区域.map(area => area.名称), '清洁']);

const bossAverageSatisfaction = computed(() => getBossAverageSatisfaction(bossState.value));

const bossCapacity = computed(() => getBossInfrastructureCapacity(bossState.value));

const bossMaintenanceCost = computed(() => getBossMaintenanceCost(bossState.value));

const bossBusinessStatusText = computed(() => {
  if (bossState.value.营业状态 === '暂停营业') {
    return `Lượng khách trước khi tạm ngừng ${bossState.value.暂停保留客流}, sẽ không tiếp tục tăng khách mới.`;
  }
  if (bossState.value.营业状态 === '今日停业') {
    return 'Hôm nay không tiếp khách, khi kết toán không có doanh thu kinh doanh.';
  }
  return 'Tiếp khách bình thường, lượng khách và đơn dự án tính theo công thức hiện tại.';
});

const bossInfrastructureItems = computed<BossInfrastructureCatalogItem[]>(() =>
  getBossInfrastructureCatalog(bossState.value),
);

const bossBuildingItems = computed<BossBuildingCatalogItem[]>(() => getBossBuildingCatalog(bossState.value));

const bossBuildingMapSize = computed(() => BOSS_BUILDING_MAP_SIZE);

const bossBuildingNodes = computed<BossBuildingNode[]>(() => makeBossBuildingNodes(bossBuildingItems.value));

const bossBuildingLines = computed<BossBuildingLine[]>(() => makeBossBuildingLines(bossBuildingNodes.value));

const bossBuildingScaleText = computed(() => `${Math.round(bossBuildingScale.value * 100)}%`);

const bossSelectedBuilding = computed<BossBuildingNode | null>(() => {
  const selected = bossBuildingNodes.value.find(item => item.id === bossSelectedBuildingId.value);
  return (
    selected ??
    bossBuildingNodes.value.find(item => item.状态 === '待验收') ??
    bossBuildingNodes.value.find(item => item.状态 === '可扩建') ??
    bossBuildingNodes.value[0] ??
    null
  );
});

const bossSelectedBuildingProject = computed(() => {
  if (!bossSelectedBuilding.value) {
    return null;
  }
  return (
    bossState.value.工程.find(
      project => project.类型 === '建筑' && project.建筑ID === bossSelectedBuilding.value?.id,
    ) ?? null
  );
});

const bossSelectedBuildingActionText = computed(() => {
  const building = bossSelectedBuilding.value;
  if (!building) {
    return '选择建筑';
  }
  if (building.状态 === '待验收') {
    return '验收';
  }
  if (building.状态 === '已建成') {
    return building.等级 >= building.maxLevel ? '完成' : '升级';
  }
  if (building.状态 === '可扩建') {
    return '扩建';
  }
  return building.状态;
});

const bossSelectedBuildingCanAct = computed(() => {
  const building = bossSelectedBuilding.value;
  if (!building) {
    return false;
  }
  if (building.状态 === '待验收') {
    return Boolean(bossSelectedBuildingProject.value);
  }
  return building.canStart;
});

const bossBuiltBuildingCount = computed(() => bossBuildingItems.value.filter(item => item.状态 === '已建成').length);

const bossUnlockedInfrastructureItems = computed<BossInfrastructureUnlock[]>(() =>
  getBossUnlockedInfrastructureItems(bossState.value),
);

const bossUpcomingInfrastructureItems = computed<BossInfrastructureUnlock[]>(() =>
  getBossUpcomingInfrastructureItems(bossState.value),
);

const bossActiveCampaignText = computed(
  () => bossState.value.宣传活动.map(item => `${item.名称} còn ${item.剩余天数} ngày`).join('、') || 'Chưa có',
);

const bossActiveQualityText = computed(
  () => bossState.value.品质投入.map(item => `${item.项目} còn ${item.剩余天数} ngày`).join('、') || 'Chưa có',
);

const currentBossShiftValue = computed(() => {
  if (!bossActiveShift.value) {
    return '';
  }
  const employee = bossState.value.员工.find(item => item.姓名 === bossActiveShift.value?.name);
  return employee?.排班[bossActiveShift.value.index] ?? '';
});

const bossUserName = computed(() => activeUserName.value.trim() || 'Chủ tiệm');

const dialogueSpeakerName = computed(() => {
  if (activeMode.value === '老板') {
    return bossSpeakerName.value;
  }
  return 'Hoa Chưa Nở';
});

const profileGenderLabel = computed(() => {
  if (profileGenderKey.value === '自定义') {
    return profileGenderText.value.trim();
  }
  return profileGenderKey.value;
});

const bossRecruitCountdown = computed(() => getBossRecruitCountdown(bossState.value, realTimeNow.value));
const bossRecruitRefreshCost = computed(() => getBossRecruitPaidRefreshCost(bossState.value));

const titleBgUrl = computed(() => resolveTangquanBackground('title-entrance'));

const bossSceneEmployee = computed(() => bossState.value.员工.find(employee => employee.区域 === bossState.value.地点));

const customerSceneEmployee = computed(() => {
  const preferredName = customerState.value.当前服务?.员工 ?? customerState.value.当前指名?.员工;
  const preferred = preferredName ? customerState.value.员工[preferredName] : null;
  if (preferred?.区域 === customerState.value.地点 && preferred.状态 !== '休息') {
    return preferred;
  }
  return (
    Object.values(customerState.value.员工).find(
      employee => employee.区域 === customerState.value.地点 && employee.状态 !== '休息',
    ) ?? null
  );
});

const bossSceneSpriteUrl = computed(() => {
  const scene = airpState.value?.mode === '老板' ? airpState.value : null;
  if (scene?.suppressCharacterStanding) return '';
  if (scene) {
    const characterId = scene.characterId || findTangquanCharacter(scene.speaker)?.id || '';
    return characterId ? resolveKnownCharacterStanding(characterId) : '';
  }
  const employee = bossSceneEmployee.value;
  return employee ? resolveKnownCharacterStanding(employee.角色ID || employee.姓名) : '';
});
const customerSceneSpriteUrl = computed(() =>
  customerSceneEmployee.value ? resolveCharacterStanding(customerSceneEmployee.value.姓名) : '',
);
const customerSceneParticipantNames = computed(() => {
  if (airpState.value?.mode !== '游客') return [];
  return _.uniq([...(airpState.value.participants ?? []), airpState.value.speaker])
    .map(name => name.trim())
    .filter(name => Boolean(customerState.value.员工[name]))
    .slice(0, 4);
});
const waiterSceneSpriteUrl = computed(() => resolveCharacterStanding('114'));

const currentSceneBg = computed(() => {
  if (activeMode.value === '老板') {
    return resolveTangquanBackground(bossState.value.地点, bossState.value.时间, 'boss-lobby');
  }
  if (activeMode.value === '游客') {
    return resolveTangquanBackground(customerState.value.地点, customerState.value.时间, 'customer-private-bath');
  }
  return resolveTangquanBackground(waiterState.value.location, waiterState.value.time, 'waiter-staff-room');
});

function characterAvatarUrl(name: string): string {
  return resolveCharacterAvatar(name);
}

function tickRealTime() {
  const now = Date.now();
  realTimeNow.value = now;
  if (activePage.value !== 'play' || activeMode.value !== '老板') {
    return;
  }
  const refreshed = refreshBossRecruitmentByRealTime(bossState.value, now);
  if (refreshed !== bossState.value) {
    bossState.value = refreshed;
    writeUiMemorySnapshot('招聘现实时间刷新');
    showToast('Ứng viên tuyển dụng đã được làm mới');
  }
}

const playPlaque = computed(() => {
  if (activeMode.value === '老板') {
    return {
      main: String(Math.max(1, Math.round(bossState.value.客流 + bossState.value.店铺评分 * 4))),
      sub: 'Độ hot hôm nay',
    };
  }
  if (activeMode.value === '游客') {
    return { main: String(customerState.value.到店次数).padStart(2, '0'), sub: 'Số lần đến quán' };
  }
  return { main: waiterState.value.grade, sub: 'Đánh giá hiện tại' };
});

const playStatusItems = computed(() => {
  if (activeMode.value === '老板') {
    return [
      { label: 'Vốn', text: yuan(bossState.value.资金), icon: 'M5 5h14v14H5zM8 9h8M8 13h8' },
      { label: 'Thời gian', text: bossState.value.时间, icon: 'M12 6v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' },
      { label: 'Địa điểm', text: bossState.value.地点, icon: 'M12 3 4 9v11h16V9z' },
    ];
  }
  if (activeMode.value === '游客') {
    const nomination = customerState.value.当前指名 ?? customerState.value.指名[0] ?? null;
    return [
      { label: 'Tiền', text: yuan(customerState.value.资金), icon: 'M5 5h14v14H5zM8 9h8M8 13h8' },
      {
        label: 'Chỉ định',
        text: nomination?.员工 ?? 'Chưa chỉ định',
        icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
      },
      { label: 'Đặt lịch', text: customerState.value.当前服务?.项目 ?? 'Chưa có', icon: 'M5 7h14v10H5zM8 10h8' },
    ];
  }
  const waiterIncome = Object.values(waiterState.value.todayIncome).reduce((sum, value) => sum + value, 0);
  return [
    { label: 'Ca làm', text: waiterState.value.shift.name, icon: 'M5 4h14v16H5zM8 2v4M16 2v4M5 9h14' },
    { label: 'Khu vực', text: waiterState.value.location, icon: 'M12 3 4 9v11h16V9z' },
    { label: 'Thu nhập', text: yuan(waiterIncome), icon: 'M5 5h14v14H5zM8 9h8M8 13h8' },
  ];
});

const playShellText = computed(() => {
  if (activeMode.value === '老板') {
    return bossDialogueText.value;
  }
  if (activeMode.value === '游客') {
    return 'Hơi nước lan qua cửa phòng riêng, chỉ định, dịch vụ, thiện cảm và liên hệ sẽ từ từ mở ra từ đây.';
  }
  return 'Đèn phòng thay đồ sáng yên tĩnh, ca làm, tiếp khách, thu nhập và xếp hạng sẽ từ từ mở ra từ đây.';
});

function refreshRuntime() {
  runtime.value = props.services.save.getRuntime();
  if (runtime.value.activeMode !== '未选择') {
    activeMode.value = runtime.value.activeMode;
    if (activePage.value === 'play') {
      selectedMode.value = runtime.value.activeMode;
    }
  }
}

function showToast(text: string) {
  toastText.value = text;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastText.value = '';
  }, 1600);
}

function getBossBuildingPrimaryKey(building: BossBuildingCatalogItem): BossInfrastructureKey {
  const keys = Object.keys(building.条件) as BossInfrastructureKey[];
  return keys[0] ?? '占地规模';
}

function getBossBuildingRequirementText(building: BossBuildingCatalogItem): string {
  const entries = Object.entries(building.条件) as [BossInfrastructureKey, number][];
  return entries.map(([key, level]) => `${getBossInfrastructureLabel(key)} cấp ${level}`).join('、') || 'Không có';
}

const BOSS_BUILDING_STATUS_LABELS: Record<BossBuildingCatalogItem['状态'], string> = {
  未开放: 'Chưa mở',
  可扩建: 'Có thể mở rộng',
  施工中: 'Đang thi công',
  待验收: 'Chờ nghiệm thu',
  已建成: 'Đã hoàn thành',
};

function getBossBuildingLevelText(building: BossBuildingCatalogItem): string {
  if (building.状态 === '已建成') {
    return `Cấp ${building.等级}`;
  }
  return BOSS_BUILDING_STATUS_LABELS[building.状态] ?? building.状态;
}

function getBossBuildingStatusClass(status: BossBuildingCatalogItem['状态']): string {
  if (status === '已建成') {
    return 'is-built';
  }
  if (status === '可扩建') {
    return 'is-expandable';
  }
  if (status === '施工中') {
    return 'is-building';
  }
  if (status === '待验收') {
    return 'is-accept';
  }
  return 'is-locked';
}

function getBossBuildingEffectText(building: BossBuildingCatalogItem): string {
  if (building.分类 === '经营') {
    return 'Sau khi hoàn thành sẽ chủ yếu ảnh hưởng đến ổn định kinh doanh, hồi phục nhân viên, áp lực bảo trì hoặc khả năng nhận đặt lịch.';
  }
  if (building.分类 === '项目') {
    return 'Sau khi hoàn thành sẽ mở hoặc tăng cường dự án tiêu dùng tương ứng, và đưa vào tính đơn hàng kết toán ngày.';
  }
  return 'Sau khi hoàn thành sẽ mở khu vực mới, tăng không gian tiếp đón, sự thoải mái và lộ trình mở rộng sau này.';
}

function makeBossBuildingNodes(buildings: BossBuildingCatalogItem[]): BossBuildingNode[] {
  const branchCounts = new Map<BossInfrastructureKey, number>();
  const leftPadding = 78;
  const topPadding = 56;
  const levelGap = 270;
  const branchGap = 160;
  const laneGap = 76;
  const overflowColumnGap = 185;
  return buildings.map(building => {
    const primaryKey = getBossBuildingPrimaryKey(building);
    const branchIndex = Math.max(0, BOSS_BUILDING_BRANCH_ORDER.indexOf(primaryKey));
    const used = branchCounts.get(primaryKey) ?? 0;
    branchCounts.set(primaryKey, used + 1);
    const maxRequirement = Math.max(1, ...(Object.values(building.条件) as number[]));
    const laneIndex = used % 2;
    const overflowColumn = Math.floor(used / 2);
    const x =
      leftPadding +
      (maxRequirement - 1) * levelGap +
      overflowColumn * overflowColumnGap +
      (building.分类 === '经营' ? 34 : 0);
    const y = topPadding + branchIndex * branchGap + laneIndex * laneGap;
    const statusClass = getBossBuildingStatusClass(building.状态);
    const actionText =
      building.状态 === '已建成'
        ? building.等级 >= building.maxLevel
          ? '完成'
          : '升级'
        : building.状态 === '可扩建'
          ? '扩建'
          : building.状态;
    return {
      ...building,
      x,
      y,
      statusClass,
      levelText: getBossBuildingLevelText(building),
      requirementText: getBossBuildingRequirementText(building),
      actionText,
      canAct: building.canStart,
      effectText: getBossBuildingEffectText(building),
    };
  });
}

function makeBossBuildingLines(nodes: BossBuildingNode[]): BossBuildingLine[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return nodes
    .filter(node => !Object.values(BOSS_BUILDING_ANCHORS).includes(node.id))
    .map(node => {
      const parentId = BOSS_BUILDING_ANCHORS[getBossBuildingPrimaryKey(node)] ?? 'area_lobby';
      const parent = nodeMap.get(parentId) ?? nodeMap.get('area_lobby');
      if (!parent || parent.id === node.id) {
        return null;
      }
      return {
        id: `${parent.id}-${node.id}`,
        x1: parent.x + BOSS_BUILDING_NODE_SIZE.width,
        y1: parent.y + BOSS_BUILDING_NODE_SIZE.height / 2,
        x2: node.x,
        y2: node.y + BOSS_BUILDING_NODE_SIZE.height / 2,
        statusClass: node.statusClass,
      };
    })
    .filter((line): line is BossBuildingLine => Boolean(line));
}

function clampViewNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundScale(value: number) {
  return Math.round(value * 100) / 100;
}

function resetBossBuildingView() {
  const map = bossBuildingMapRef.value;
  if (!map) {
    bossBuildingPan.value = { x: 0, y: 0 };
    bossBuildingScale.value = 0.68;
    writeUiMemorySnapshot('建筑图复位');
    return;
  }
  const rect = map.getBoundingClientRect();
  const selected =
    bossSelectedBuilding.value ??
    bossBuildingNodes.value.find(node => node.状态 === '可扩建') ??
    bossBuildingNodes.value.find(node => node.状态 === '待验收') ??
    bossBuildingNodes.value[0];
  const scale = roundScale(
    clampViewNumber(rect.width < 620 ? 0.58 : 0.72, BOSS_BUILDING_ZOOM.min, BOSS_BUILDING_ZOOM.max),
  );
  bossBuildingScale.value = scale;
  if (!selected) {
    bossBuildingPan.value = { x: 0, y: 0 };
    bossBuildingViewInitialized.value = true;
    return;
  }
  bossBuildingPan.value = {
    x: Math.round(rect.width / 2 - (selected.x + BOSS_BUILDING_NODE_SIZE.width / 2) * scale),
    y: Math.round(rect.height / 2 - (selected.y + BOSS_BUILDING_NODE_SIZE.height / 2) * scale),
  };
  bossBuildingViewInitialized.value = true;
  writeUiMemorySnapshot('建筑图复位');
}

function zoomBossBuildingTo(nextScale: number, anchor?: { clientX: number; clientY: number }) {
  const oldScale = bossBuildingScale.value;
  const scale = roundScale(clampViewNumber(nextScale, BOSS_BUILDING_ZOOM.min, BOSS_BUILDING_ZOOM.max));
  if (Math.abs(scale - oldScale) < 0.001) {
    return;
  }
  const rect = bossBuildingMapRef.value?.getBoundingClientRect();
  const anchorX = rect && anchor ? anchor.clientX - rect.left : (rect?.width ?? 0) / 2;
  const anchorY = rect && anchor ? anchor.clientY - rect.top : (rect?.height ?? 0) / 2;
  const ratio = scale / oldScale;
  bossBuildingPan.value = {
    x: Math.round(anchorX - (anchorX - bossBuildingPan.value.x) * ratio),
    y: Math.round(anchorY - (anchorY - bossBuildingPan.value.y) * ratio),
  };
  bossBuildingScale.value = scale;
  bossBuildingViewInitialized.value = true;
  writeUiMemorySnapshot('建筑图缩放');
}

function zoomBossBuildingStep(delta: number) {
  zoomBossBuildingTo(bossBuildingScale.value + delta);
}

function zoomBossBuildingMap(event: WheelEvent) {
  const direction = event.deltaY > 0 ? -BOSS_BUILDING_ZOOM.step : BOSS_BUILDING_ZOOM.step;
  zoomBossBuildingTo(bossBuildingScale.value + direction, event);
}

function startBossBuildingPan(event: PointerEvent) {
  bossBuildingDrag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: bossBuildingPan.value.x,
    originY: bossBuildingPan.value.y,
  };
  bossBuildingViewInitialized.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function moveBossBuildingPan(event: PointerEvent) {
  const drag = bossBuildingDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }
  bossBuildingPan.value = {
    x: Math.round(drag.originX + event.clientX - drag.startX),
    y: Math.round(drag.originY + event.clientY - drag.startY),
  };
}

function endBossBuildingPan(event: PointerEvent) {
  if (bossBuildingDrag.value?.pointerId === event.pointerId) {
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    bossBuildingDrag.value = null;
    writeUiMemorySnapshot('建筑图拖动');
  }
}

function yuan(value: number) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

function signedYuan(value: number) {
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${yuan(rounded)}`;
}

function signedNumber(value: number) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function setBossLine(name: string, text: string) {
  bossSpeakerName.value = name;
  bossDialogueText.value = text;
}

async function syncBossMvuSnapshot() {
  if (activeMode.value !== '老板') {
    return;
  }
  await props.services.mvuRuntime.mergeCurrentStatData(makeBossCommonStatData(bossState.value), '老板');
}

async function activateBossMvuBlocks(
  blockIds: TangquanMvuBlockId[],
  context: BossMvuBlockContext = {},
  reason = '更新当前变量块',
) {
  if (activeMode.value !== '老板') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = composeStatDataWithBlocks(current, bossState.value, mvuBlockStore.value, blockIds, context);
  mvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '老板', false);
  props.services.log.info('MVU变量块', '已装入当前变量块', { reason, blockIds, context });
}

async function refreshActiveBossMvuBlocks(reason = '刷新当前变量块') {
  if (activeMode.value !== '老板') {
    return;
  }
  if (mvuBlockStore.value.activeBlockIds.length === 0) {
    await syncBossMvuSnapshot();
    return;
  }
  await activateBossMvuBlocks(mvuBlockStore.value.activeBlockIds, mvuBlockStore.value.activeContext, reason);
}

async function deactivateBossMvuBlocks(reason = '卸下当前变量块') {
  if (activeMode.value !== '老板') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = deactivateStatDataBlocks(current, bossState.value, mvuBlockStore.value);
  mvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '老板', false);
  props.services.log.info('MVU变量块', '已卸下当前变量块', { reason });
}

async function saveActiveBossMvuBlocks(reason = '保存当前变量块', statData?: Record<string, unknown>) {
  if (activeMode.value !== '老板') {
    return;
  }
  const current = statData ?? (await props.services.mvuRuntime.readCurrentStatData());
  const result = applyBossStatDataToState(bossState.value, mvuBlockStore.value, current);
  bossState.value = result.state;
  mvuBlockStore.value = result.store;
  props.services.log.info('MVU变量块', '已保存当前变量块', {
    reason,
    activeBlockIds: mvuBlockStore.value.activeBlockIds,
  });
}

async function syncCustomerMvuSnapshot() {
  if (activeMode.value !== '游客') {
    return;
  }
  await props.services.mvuRuntime.mergeCurrentStatData(makeCustomerCommonStatData(customerState.value), '游客');
}

async function activateCustomerMvuBlocks(
  blockIds: CustomerMvuBlockId[],
  context: CustomerMvuBlockContext = {},
  reason = '更新游客变量块',
) {
  if (activeMode.value !== '游客') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = composeCustomerStatDataWithBlocks(
    current,
    customerState.value,
    customerMvuBlockStore.value,
    blockIds,
    context,
  );
  customerMvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '游客');
  props.services.log.info('游客MVU变量块', '已装入当前变量块', { reason, blockIds, context });
}

async function refreshActiveCustomerMvuBlocks(reason = '刷新游客变量块') {
  if (activeMode.value !== '游客') {
    return;
  }
  if (customerMvuBlockStore.value.activeBlockIds.length === 0) {
    const current = await props.services.mvuRuntime.readCurrentStatData();
    const result = deactivateCustomerStatDataBlocks(current, customerState.value, customerMvuBlockStore.value);
    customerMvuBlockStore.value = result.store;
    await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '游客');
    return;
  }
  await activateCustomerMvuBlocks(
    customerMvuBlockStore.value.activeBlockIds,
    customerMvuBlockStore.value.activeContext,
    reason,
  );
}

async function deactivateCustomerMvuBlocks(reason = '卸下游客变量块') {
  if (activeMode.value !== '游客') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = deactivateCustomerStatDataBlocks(current, customerState.value, customerMvuBlockStore.value);
  customerMvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '游客');
  props.services.log.info('游客MVU变量块', '已卸下当前变量块', { reason });
}

async function saveActiveCustomerMvuBlocks(reason = '保存游客变量块', statData?: Record<string, unknown>) {
  if (activeMode.value !== '游客') {
    return;
  }
  const current = statData ?? (await props.services.mvuRuntime.readCurrentStatData());
  const result = applyCustomerStatDataToState(customerState.value, customerMvuBlockStore.value, current);
  customerState.value = result.state;
  customerMvuBlockStore.value = result.store;
  props.services.log.info('游客MVU变量块', '已保存当前变量块', {
    reason,
    activeBlockIds: customerMvuBlockStore.value.activeBlockIds,
  });
}

async function syncWaiterMvuSnapshot() {
  if (activeMode.value !== '服务员') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = deactivateWaiterStatDataBlocks(current, waiterState.value, waiterMvuBlockStore.value);
  waiterMvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '服务员');
}

async function activateWaiterMvuBlocks(
  blockIds: WaiterMvuBlockId[],
  context: WaiterMvuBlockContext = {},
  reason = '更新服务员变量块',
) {
  if (activeMode.value !== '服务员') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = composeWaiterStatDataWithBlocks(
    current,
    waiterState.value,
    waiterMvuBlockStore.value,
    blockIds,
    context,
  );
  waiterMvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '服务员');
  props.services.log.info('服务员MVU变量块', '已装入当前变量块', { reason, blockIds, context });
}

async function refreshActiveWaiterMvuBlocks(reason = '刷新服务员变量块') {
  if (activeMode.value !== '服务员') {
    return;
  }
  if (waiterMvuBlockStore.value.activeBlockIds.length === 0) {
    await syncWaiterMvuSnapshot();
    return;
  }
  await activateWaiterMvuBlocks(
    waiterMvuBlockStore.value.activeBlockIds,
    waiterMvuBlockStore.value.activeContext,
    reason,
  );
}

async function deactivateWaiterMvuBlocks(reason = '卸下服务员变量块') {
  if (activeMode.value !== '服务员') {
    return;
  }
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const result = deactivateWaiterStatDataBlocks(current, waiterState.value, waiterMvuBlockStore.value);
  waiterMvuBlockStore.value = result.store;
  await props.services.mvuRuntime.replaceCurrentStatData(result.statData, '服务员');
  props.services.log.info('服务员MVU变量块', '已卸下当前变量块', { reason });
}

async function saveActiveWaiterMvuBlocks(reason = '保存服务员变量块', statData?: Record<string, unknown>) {
  if (activeMode.value !== '服务员') {
    return;
  }
  const current = statData ?? (await props.services.mvuRuntime.readCurrentStatData());
  const result = applyWaiterStatDataToState(waiterState.value, waiterMvuBlockStore.value, current);
  waiterState.value = result.state;
  waiterMvuBlockStore.value = result.store;
  props.services.log.info('服务员MVU变量块', '已保存当前变量块', {
    reason,
    activeBlockIds: waiterMvuBlockStore.value.activeBlockIds,
  });
}

async function replaceTemporaryEntries(entryIds: string[], reason: string, contentMap: Record<string, string> = {}) {
  const nextIds = _.uniq(entryIds);
  const oldIds = activeTemporaryEntryIds.value;
  const disableIds = oldIds.filter(id => !nextIds.includes(id));
  if (disableIds.length > 0) {
    await props.services.worldbookRuntime.disableEntries(disableIds, reason);
  }
  if (nextIds.length > 0) {
    await props.services.worldbookRuntime.enableEntries(nextIds, reason, contentMap);
  }
  activeTemporaryEntryIds.value = nextIds;
}

async function disableModeWorldbookEntries(reason: string) {
  const modeEntryIds = props.services.worldbookRuntime
    .listEntryDefinitions()
    .filter(
      entry =>
        entry.activation === 'mode' ||
        ['boss.variable-rule', 'customer.variable-rule', 'waiter.variable-rule'].includes(entry.id),
    )
    .map(entry => entry.id);
  await props.services.worldbookRuntime.disableEntries(modeEntryIds, reason);
}

function makeAirpEntryIds(scene: AirpSceneState): string[] {
  const entryIds = [...scene.entryIds];
  const participants = _.uniq([...(scene.participants ?? []), scene.speaker].map(name => name.trim()).filter(Boolean));
  participants.forEach(name => {
    const characterEntryId = makeTangquanCharacterEntryId(name);
    if (characterEntryId) entryIds.push(characterEntryId);
  });
  if (scene.mode === '老板') {
    entryIds.push('boss.variable-rule');
  } else if (scene.mode === '游客' && scene.customerBlockIds?.includes('customer.relationship')) {
    entryIds.push('customer.variable-rule');
  } else if (scene.mode === '服务员' && scene.waiterBlockIds?.includes('waiter.growth')) {
    entryIds.push('waiter.variable-rule');
  }
  return _.uniq(entryIds);
}

const AIRP_DYNAMIC_ENTRY_IDS = new Set([
  'area.current',
  'project.current',
  'character.current-employee',
  'character.current-guest',
  'character.current-candidate',
]);

function keepAirpBaseEntryId(entryId: string): boolean {
  return !AIRP_DYNAMIC_ENTRY_IDS.has(entryId) && !entryId.startsWith('facility.');
}

function rebuildAirpSceneFromState(scene: AirpSceneState, statData?: Record<string, unknown>): AirpSceneState {
  const entryIds = scene.entryIds.filter(keepAirpBaseEntryId);
  const entryContentMap: Record<string, string> = {};
  const interactionScene = isRecord(statData?.互动现场) ? _.cloneDeep(statData.互动现场) : scene.scene;

  if (scene.mode === '老板') {
    const blockIds = scene.blockIds ?? [];
    const blockContext = { ...mvuBlockStore.value.activeContext, ...scene.blockContext };
    const hasArea = blockIds.includes('boss.area') || scene.entryIds.includes('area.current');
    const area = hasArea ? findBossArea(bossState.value.地点) : null;
    if (area) {
      entryIds.push('area.current', ...makeBossAreaWorldbookEntryIds(area.名称));
      entryContentMap['area.current'] = makeAreaEntryContent(area);
      blockContext.areaName = area.名称;
    }
    const employee = blockContext.employeeName ? findBossEmployee(blockContext.employeeName) : null;
    if (employee && blockIds.includes('boss.employee')) {
      entryIds.push('character.current-employee');
      entryContentMap['character.current-employee'] = makeEmployeeEntryContent(employee);
    }
    const nomination = employee
      ? bossState.value.指名.find(item => item.员工 === employee.姓名 && item.剩余天数 > 0)
      : null;
    if (nomination && blockIds.includes('boss.guest')) {
      entryIds.push('character.current-guest');
      entryContentMap['character.current-guest'] = makeGuestEntryContent(nomination);
    }
    const project = nomination ? findBossProjectByArea(nomination.区域) : null;
    if (project && blockIds.includes('boss.service')) {
      entryIds.push('project.current', ...makeBossProjectWorldbookEntryIds(project));
      entryContentMap['project.current'] = makeProjectEntryContent(project);
    }
    if (blockIds.includes('boss.candidate')) {
      const market = blockContext.candidateName
        ? bossState.value.人才市场.find(item => item.姓名 === blockContext.candidateName)
        : null;
      const recruit = blockContext.recruitCandidateName
        ? bossState.value.招聘.候选.find(item => item.姓名 === blockContext.recruitCandidateName)
        : null;
      const candidate = market ?? recruit;
      if (candidate) {
        entryIds.push('character.current-candidate');
        entryContentMap['character.current-candidate'] = makeCandidateEntryContent(
          candidate,
          market ? '人才市场' : '招聘',
        );
      }
    }
    return {
      ...scene,
      scene: interactionScene,
      entryIds: makeAirpEntryIds({ ...scene, entryIds }),
      entryContentMap,
      blockContext,
    };
  }

  if (scene.mode === '游客') {
    const blockIds = scene.customerBlockIds ?? [];
    const blockContext = { ...customerMvuBlockStore.value.activeContext, ...scene.customerBlockContext };
    if (scene.entryIds.includes('area.current')) {
      entryIds.push('area.current', ...makeCustomerAreaWorldbookEntryIds(customerState.value.地点));
      entryContentMap['area.current'] = makeCustomerAreaEntryContent(customerState.value);
    }
    const employeeName = blockContext.employeeName || blockContext.contactName || '';
    const employeeNames = _.uniq(
      [...(blockContext.employeeNames ?? []), ...(scene.participants ?? []), employeeName]
        .map(name => name.trim())
        .filter(Boolean),
    );
    const employees = employeeNames
      .map(findCustomerEmployee)
      .filter((employee): employee is CustomerEmployee => Boolean(employee));
    const employee = (employeeName ? findCustomerEmployee(employeeName) : null) ?? employees[0] ?? null;
    if (employees.length > 0 && blockIds.includes('customer.employee')) {
      entryIds.push('character.current-employee');
      entryContentMap['character.current-employee'] =
        employees.length > 1
          ? makeCustomerEmployeesEntryContent(employees)
          : makeCustomerEmployeeEntryContent(employees[0]);
      blockContext.employeeNames = employees.map(item => item.姓名);
    }
    const projectName =
      customerState.value.当前服务?.员工 === employeeName
        ? customerState.value.当前服务.项目
        : blockContext.projectName;
    const project = projectName ? findCustomerProject(projectName) : null;
    if (project && blockIds.includes('customer.project')) {
      entryIds.push('project.current', ...makeCustomerProjectWorldbookEntryIds(project.名称));
      entryContentMap['project.current'] = makeCustomerProjectEntryContent(project);
      blockContext.projectName = project.名称;
    }
    return {
      ...scene,
      scene: interactionScene,
      entryIds: makeAirpEntryIds({ ...scene, entryIds }),
      entryContentMap,
      customerBlockContext: blockContext,
    };
  }

  const blockIds = scene.waiterBlockIds ?? [];
  const blockContext = { ...waiterMvuBlockStore.value.activeContext, ...scene.waiterBlockContext };
  const assignment = blockContext.assignmentId ? findWaiterAssignment(blockContext.assignmentId) : null;
  if (assignment && blockIds.includes('waiter.service')) {
    entryIds.push(
      'area.current',
      'project.current',
      'character.current-guest',
      ...makeWaiterProjectWorldbookEntryIds(assignment.project, assignment.area),
    );
    Object.assign(entryContentMap, makeWaiterServiceEntryContentMap(assignment.id));
  } else if (scene.entryIds.includes('area.current')) {
    entryIds.push('area.current', ...makeWaiterAreaWorldbookEntryIds(waiterState.value.location));
    entryContentMap['area.current'] = makeWaiterAreaEntryContent(waiterState.value);
  }
  if (scene.entryIds.includes('character.current-employee')) {
    entryIds.push('character.current-employee');
    entryContentMap['character.current-employee'] = makeWaiterCoworkerEntryContent(
      scene.speaker,
      waiterState.value.location,
    );
  }
  return {
    ...scene,
    scene: interactionScene,
    entryIds: makeAirpEntryIds({ ...scene, entryIds }),
    entryContentMap,
    waiterBlockContext: blockContext,
  };
}

async function refreshActiveAirpSceneRuntime(reason: string, statData?: Record<string, unknown>) {
  const scene = airpState.value;
  if (!scene) return;
  const current = statData ?? (await props.services.mvuRuntime.readCurrentStatData());
  const refreshedScene = rebuildAirpSceneFromState(scene, current);
  airpState.value = refreshedScene;
  await replaceTemporaryEntries(refreshedScene.entryIds, reason, refreshedScene.entryContentMap);
}

async function openAirpScene(scene: AirpSceneState) {
  const preparedScene = prepareAirpSceneIdentity(scene, true);
  preparedScene.entryIds = makeAirpEntryIds(preparedScene);
  const prepareScene = async () => {
    resetScenePresentation(preparedScene);
    await syncPresetOutputFormat(preparedScene, `进入现场：${preparedScene.title}`);
    await replaceTemporaryEntries(preparedScene.entryIds, preparedScene.title, preparedScene.entryContentMap);
    if (preparedScene.mode === '老板') {
      await activateBossMvuBlocks(preparedScene.blockIds ?? [], preparedScene.blockContext ?? {}, preparedScene.title);
    }
    if (preparedScene.mode === '游客') {
      await activateCustomerMvuBlocks(
        preparedScene.customerBlockIds ?? [],
        preparedScene.customerBlockContext ?? {},
        preparedScene.title,
      );
    }
    if (preparedScene.mode === '服务员') {
      await activateWaiterMvuBlocks(
        preparedScene.waiterBlockIds ?? [],
        preparedScene.waiterBlockContext ?? {},
        preparedScene.title,
      );
    }
    await props.services.mvuRuntime.setInteractionScene(preparedScene.scene, preparedScene.mode);
    airpState.value = preparedScene;
    airpInput.value = '';
    if (preparedScene.mode === '老板') {
      setBossLine(preparedScene.speaker, preparedScene.line);
      closeBossMenu();
    }
    if (preparedScene.mode === '游客') {
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        preparedScene.speaker,
        preparedScene.line,
      );
      customerMenuOpen.value = false;
      customerStoryOpen.value = false;
    }
    if (preparedScene.mode === '服务员') {
      waiterState.value = setWaiterDialogue(waiterState.value, preparedScene.speaker, preparedScene.line);
      waiterMenuOpen.value = false;
    }
    showToast('Hiện trường đã sẵn sàng');
    writeUiMemorySnapshot('进入现场');
  };
  if (busy.value) {
    await prepareScene();
    return;
  }
  await runAction('进入现场', prepareScene);
}

async function restoreCustomerSceneRuntime(scene: AirpSceneState | null, reason: string) {
  if (activeMode.value !== '游客') {
    return;
  }
  if (scene?.mode === '游客') {
    const current = await props.services.mvuRuntime.readCurrentStatData();
    const restoredScene = rebuildAirpSceneFromState({ ...scene, entryIds: makeAirpEntryIds(scene) }, current);
    await replaceTemporaryEntries(restoredScene.entryIds, reason, restoredScene.entryContentMap);
    await activateCustomerMvuBlocks(
      restoredScene.customerBlockIds ?? [],
      restoredScene.customerBlockContext ?? {},
      reason,
    );
    await props.services.mvuRuntime.setInteractionScene(restoredScene.scene, '游客');
    await syncPresetOutputFormat(restoredScene, `${reason}恢复输出格式`);
    airpState.value = restoredScene;
    return;
  }
  await deactivateCustomerMvuBlocks(reason);
  await replaceTemporaryEntries([], reason);
  await props.services.mvuRuntime.clearInteractionScene('游客');
  await syncPresetOutputFormat(null, `${reason}关闭输出格式`);
}

async function restoreWaiterSceneRuntime(scene: AirpSceneState | null, reason: string) {
  if (activeMode.value !== '服务员') {
    return;
  }
  if (scene?.mode === '服务员') {
    const current = await props.services.mvuRuntime.readCurrentStatData();
    const restoredScene = rebuildAirpSceneFromState({ ...scene, entryIds: makeAirpEntryIds(scene) }, current);
    await replaceTemporaryEntries(restoredScene.entryIds, reason, restoredScene.entryContentMap);
    await activateWaiterMvuBlocks(restoredScene.waiterBlockIds ?? [], restoredScene.waiterBlockContext ?? {}, reason);
    await props.services.mvuRuntime.setInteractionScene(restoredScene.scene, '服务员');
    await syncPresetOutputFormat(restoredScene, `${reason}恢复输出格式`);
    airpState.value = restoredScene;
    return;
  }
  await deactivateWaiterMvuBlocks(reason);
  await replaceTemporaryEntries([], reason);
  await props.services.mvuRuntime.clearInteractionScene('服务员');
  await syncPresetOutputFormat(null, `${reason}关闭输出格式`);
}

async function restoreBossSceneRuntime(scene: AirpSceneState | null, reason: string) {
  if (activeMode.value !== '老板') return;
  if (scene?.mode === '老板') {
    const current = await props.services.mvuRuntime.readCurrentStatData();
    const restoredScene = rebuildAirpSceneFromState({ ...scene, entryIds: makeAirpEntryIds(scene) }, current);
    await replaceTemporaryEntries(restoredScene.entryIds, reason, restoredScene.entryContentMap);
    await activateBossMvuBlocks(restoredScene.blockIds ?? [], restoredScene.blockContext ?? {}, reason);
    await props.services.mvuRuntime.setInteractionScene(restoredScene.scene, '老板');
    await syncPresetOutputFormat(restoredScene, `${reason}恢复输出格式`);
    airpState.value = restoredScene;
    return;
  }
  await deactivateBossMvuBlocks(reason);
  await replaceTemporaryEntries([], reason);
  await props.services.mvuRuntime.clearInteractionScene('老板');
  await syncPresetOutputFormat(null, `${reason}关闭输出格式`);
}

async function restoreCustomerRuntimeAfterChatDeletion(reason: string) {
  const current = await props.services.mvuRuntime.readCurrentStatData();
  const restored = applyCustomerStatDataToState(customerState.value, customerMvuBlockStore.value, current, true);
  customerState.value = restored.state;
  customerMvuBlockStore.value = restored.store;
  const scene = airpState.value?.mode === '游客' ? airpState.value : null;
  await restoreCustomerSceneRuntime(scene, `${reason}后恢复现场`);
}

async function closeAirpScene() {
  const scene = airpState.value;
  if (!scene) {
    return;
  }
  let closed = false;
  await runAction('离开现场', async () => {
    if (scene.mode === '老板') {
      await deactivateBossMvuBlocks('离开现场');
    } else if (scene.mode === '游客') {
      await deactivateCustomerMvuBlocks('离开现场');
    } else if (scene.mode === '服务员') {
      await saveActiveWaiterMvuBlocks('离开现场保存结果');
      await deactivateWaiterMvuBlocks('离开现场');
    }
    await props.services.mvuRuntime.clearInteractionScene(scene.mode);
    await replaceTemporaryEntries([], '离开现场');
    await syncPresetOutputFormat(null, '离开现场');
    airpState.value = null;
    resetScenePresentation(null);
    airpInput.value = '';
    if (scene.mode === '老板') {
      setBossLine(bossUserName.value, 'Bạn tạm thời rời khỏi hiện trường, trang kinh doanh sẽ giữ nguyên vị trí vừa rồi.');
    }
    if (scene.mode === '游客') {
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        'Hoa Chưa Nở',
        'Bạn đã rời khỏi tương tác vừa rồi, lịch trình hiện tại vẫn được giữ nguyên.',
      );
    }
    if (scene.mode === '服务员') {
      waiterState.value = setWaiterDialogue(
        waiterState.value,
        'Trưởng ca',
        'Bạn đã rời khỏi hiện trường vừa rồi, ca làm và sắp xếp tiếp khách hiện tại vẫn được giữ nguyên.',
      );
    }
    showToast('Đã rời khỏi hiện trường');
    writeUiMemorySnapshot('离开现场');
    closed = true;
  });
  if (closed) {
    completeTutorialAction('airp-leave');
    if (sceneHasUnsavedAiInteraction) {
      sceneHasUnsavedAiInteraction = false;
      await requestAutoSave('有效AI互动后离开现场');
    }
  }
}

function getGenerationText(result: string | GenerateToolCallResult): string {
  if (typeof result === 'string') {
    return result;
  }
  throw new Error('本次生成返回了工具调用结果，暂时不能写入楼层');
}

const SCENE_GENERATION_EXTRA_KEY = 'tangquanSceneGeneration';

function makeSceneGenerationTraceId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `scene-${Date.now().toString(36)}-${random}`;
}

function makeAirpSceneKey(scene: AirpSceneState): string {
  return [scene.mode, scene.kind ?? '', scene.title, scene.speaker, ...(scene.participants ?? [])].join('|');
}

function makeSceneParticipantId(name: string): string {
  const cleanName = name.trim();
  if (!cleanName) return '';
  const character = findTangquanCharacter(cleanName);
  if (character) return `character:${character.id}`;
  if (cleanName === '老板' || cleanName === '店长') return 'role:boss';
  if (cleanName === '当班同事') return 'role:coworker';
  return makeTangquanSceneEntityId('actor', cleanName);
}

function readSceneTextFact(scene: AirpSceneState, keys: string[]): string {
  for (const key of keys) {
    const value = scene.scene[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function inferLegacySceneStartedAfterMessageId(scene: AirpSceneState): number {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 1) return Math.max(0, lastMessageId);
  const legacySceneKey = makeAirpSceneKey(scene);
  const messages = getChatMessages(`1-${lastMessageId}`, { include_swipes: true }).sort(
    (a, b) => b.message_id - a.message_id,
  );
  let firstMatchingMessageId: number | null = null;
  let foundSceneMessage = false;
  for (const message of messages) {
    const extra = getSceneGenerationExtra(message);
    if (!extra) {
      if (foundSceneMessage && !message.is_hidden) break;
      continue;
    }
    if (extra.sceneKey !== legacySceneKey) {
      if (foundSceneMessage) break;
      continue;
    }
    foundSceneMessage = true;
    firstMatchingMessageId = message.message_id;
  }
  return firstMatchingMessageId === null ? lastMessageId : Math.max(0, firstMatchingMessageId - 1);
}

function prepareAirpSceneIdentity(scene: AirpSceneState, freshScene: boolean): AirpSceneState {
  const participants = _.uniq([...(scene.participants ?? []), scene.speaker].map(name => name.trim()).filter(Boolean));
  const derivedParticipantIds = participants.map(makeSceneParticipantId).filter(Boolean);
  const explicitParticipantIds = normalizeTangquanParticipantIds(scene.participantIds ?? []);
  const participantIds =
    explicitParticipantIds.length === participants.length
      ? explicitParticipantIds
      : normalizeTangquanParticipantIds([...explicitParticipantIds, ...derivedParticipantIds]);
  const speakerId = scene.speakerId?.trim() || makeSceneParticipantId(scene.speaker);
  const locationName = readSceneTextFact(scene, ['地点', '区域']);
  const projectName =
    scene.projectId?.trim() ||
    scene.customerBlockContext?.projectName?.trim() ||
    readSceneTextFact(scene, ['项目', '当前项目']);
  const assignmentId = scene.assignmentId?.trim() || scene.waiterBlockContext?.assignmentId?.trim() || '';
  const serviceId = scene.serviceId?.trim() || assignmentId;
  const sceneId = scene.sceneId?.trim() || makeTangquanRuntimeSceneId(`${scene.mode}-scene`);
  const characterId = scene.characterId?.trim() || findTangquanCharacter(scene.speaker)?.id || '';
  const startedAfterMessageId = Number.isInteger(scene.startedAfterMessageId)
    ? Math.max(0, Number(scene.startedAfterMessageId))
    : freshScene
      ? Math.max(0, getLastMessageId())
      : inferLegacySceneStartedAfterMessageId(scene);
  return {
    ...scene,
    outputMode: resolveAirpOutputMode(scene),
    participants,
    sceneId,
    startedAfterMessageId,
    speakerId,
    participantIds,
    characterId,
    suppressCharacterStanding: normalizeCharacterStandingSuppression(
      characterId || scene.speaker,
      scene.suppressCharacterStanding,
    ),
    locationId: scene.locationId?.trim() || (locationName ? makeTangquanSceneEntityId('location', locationName) : ''),
    serviceId,
    projectId:
      scene.projectId?.trim() ||
      (projectName ? makeTangquanSceneEntityId('project', projectName.replace(/^project:/, '')) : ''),
    assignmentId,
  };
}

function makeSceneIdentity(scene: AirpSceneState): TangquanSceneIdentity {
  const normalized = prepareAirpSceneIdentity(scene, false);
  return {
    sceneId: normalized.sceneId ?? '',
    mode: normalized.mode,
    kind: normalized.kind ?? (resolvePresetOutputFormat(normalized) === 'airp' ? 'story' : 'dialogue'),
    speakerId: normalized.speakerId ?? '',
    participantIds: [...(normalized.participantIds ?? [])],
    locationId: normalized.locationId ?? '',
    serviceId: normalized.serviceId ?? '',
    projectId: normalized.projectId ?? '',
    assignmentId: normalized.assignmentId ?? '',
    startedAfterMessageId: normalized.startedAfterMessageId ?? 0,
    legacySceneKey: makeAirpSceneKey(normalized),
  };
}

function makeSceneGenerationExtra(
  scene: AirpSceneState,
  traceId: string,
  role: 'user' | 'assistant',
): Record<string, unknown> {
  return {
    [SCENE_GENERATION_EXTRA_KEY]: {
      version: 2,
      traceId,
      mode: scene.mode,
      kind: scene.kind ?? (resolvePresetOutputFormat(scene) === 'airp' ? 'story' : 'dialogue'),
      outputMode: resolveAirpOutputMode(scene),
      sceneKey: makeAirpSceneKey(scene),
      speaker: scene.speaker,
      participants: [...(scene.participants ?? [])],
      sceneId: scene.sceneId,
      startedAfterMessageId: scene.startedAfterMessageId,
      speakerId: scene.speakerId,
      participantIds: [...(scene.participantIds ?? [])],
      locationId: scene.locationId,
      serviceId: scene.serviceId,
      projectId: scene.projectId,
      assignmentId: scene.assignmentId,
      role,
    } satisfies SceneGenerationExtra,
  };
}

function getSceneGenerationExtra(message: ChatMessage | ChatMessageSwiped): SceneGenerationExtra | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const messageExtra = isRecord(record.extra) ? record.extra : null;
  const nestedMessageExtra = isRecord(messageExtra?.extra) ? messageExtra.extra : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(Number(record.swipe_id) || 0, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const swipeExtra = isRecord(swipeInfo?.extra) ? swipeInfo.extra : null;
  const candidates = [
    messageExtra?.[SCENE_GENERATION_EXTRA_KEY],
    nestedMessageExtra?.[SCENE_GENERATION_EXTRA_KEY],
    swipeInfo?.[SCENE_GENERATION_EXTRA_KEY],
    swipeExtra?.[SCENE_GENERATION_EXTRA_KEY],
  ];
  const value = candidates.find(
    item =>
      isRecord(item) &&
      [1, 2].includes(Number(item.version)) &&
      typeof item.traceId === 'string' &&
      ['老板', '游客', '服务员'].includes(String(item.mode)) &&
      ['dialogue', 'story', 'message'].includes(String(item.kind)),
  );
  return value ? (value as SceneGenerationExtra) : null;
}

function getSceneMessageText(message: ChatMessage | ChatMessageSwiped): string {
  if ('message' in message && typeof message.message === 'string') {
    return message.message;
  }
  const swipeId = _.clamp(Number(message.swipe_id) || 0, 0, Math.max(0, message.swipes.length - 1));
  return String(message.swipes[swipeId] ?? message.swipes[0] ?? '');
}

function getSceneMessageMvuData(message: ChatMessage | ChatMessageSwiped): Mvu.MvuData | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const swipeId = Number(record.swipe_id) || 0;
  const swipeData = Array.isArray(record.swipes_data)
    ? record.swipes_data[_.clamp(swipeId, 0, Math.max(0, record.swipes_data.length - 1))]
    : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(swipeId, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const candidates = [
    swipeData,
    isRecord(swipeInfo) ? swipeInfo.data : null,
    isRecord(record.data) ? record.data : null,
  ];
  const value = candidates.find(candidate => isRecord(candidate) && isRecord(candidate.stat_data));
  return value ? (_.cloneDeep(value) as Mvu.MvuData) : null;
}

function makeSceneChatHistoryPrompts(scene: AirpSceneState, beforeMessageId?: number): RolePrompt[] {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 1) return [];
  const identity = makeSceneIdentity(scene);
  const messages = getChatMessages(`1-${lastMessageId}`, { include_swipes: true })
    .filter(message => ['system', 'user', 'assistant'].includes(message.role))
    .map(message => {
      const extra = getSceneGenerationExtra(message);
      return {
        messageId: message.message_id,
        role: message.role as TangquanSceneHistoryMessage['role'],
        content: getSceneMessageText(message),
        hidden: message.is_hidden,
        sceneId: extra?.sceneId,
        legacySceneKey: extra?.sceneKey,
      } satisfies TangquanSceneHistoryMessage;
    });
  return buildTangquanSceneHistoryPrompts({ identity, messages, beforeMessageId });
}

function findLatestSceneGenerationPair(scene: AirpSceneState | null): SceneGenerationPair | null {
  if (!scene) return null;
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 2) return null;
  const identity = makeSceneIdentity(scene);
  const messages = getChatMessages(`1-${lastMessageId}`, { include_swipes: true });
  const pairs = new Map<
    string,
    { extra: SceneGenerationExtra; user?: ChatMessageSwiped; assistant?: ChatMessageSwiped }
  >();
  messages.forEach(message => {
    const extra = getSceneGenerationExtra(message);
    if (!extra || extra.mode !== scene.mode || message.message_id <= identity.startedAfterMessageId) return;
    if (extra.sceneId ? extra.sceneId !== identity.sceneId : extra.sceneKey !== identity.legacySceneKey) return;
    const pair = pairs.get(extra.traceId) ?? { extra };
    if (message.role === 'user') pair.user = message;
    if (message.role === 'assistant') pair.assistant = message;
    pairs.set(extra.traceId, pair);
  });
  const complete = [...pairs.entries()]
    .filter(
      (
        entry,
      ): entry is [string, { extra: SceneGenerationExtra; user: ChatMessageSwiped; assistant: ChatMessageSwiped }] =>
        Boolean(entry[1].user && entry[1].assistant),
    )
    .sort((a, b) => b[1].assistant.message_id - a[1].assistant.message_id)[0];
  return complete
    ? {
        traceId: complete[0],
        extra: complete[1].extra,
        userMessage: complete[1].user,
        assistantMessage: complete[1].assistant,
      }
    : null;
}

function resetScenePresentation(scene: AirpSceneState | null) {
  sceneDialoguePages.value =
    scene && resolveAirpOutputMode(scene) === 'dialogue' && scene.line.trim()
      ? [{ speaker: scene.speaker, text: scene.line.trim() }]
      : [];
  sceneDialogueIndex.value = 0;
  sceneStoryText.value = '';
  sceneStoryOpen.value = false;
}

function applyCurrentSceneDialoguePage() {
  const page = sceneDialoguePages.value[sceneDialogueIndex.value];
  if (!page) return;
  if (activeMode.value === '老板') {
    setBossLine(page.speaker || airpState.value?.speaker || bossUserName.value, page.text);
  } else if (activeMode.value === '服务员') {
    waiterState.value = setWaiterDialogue(
      waiterState.value,
      page.speaker || airpState.value?.speaker || waiterState.value.dialogue.speaker,
      page.text,
    );
  }
}

function applyScenePresentation(scene: AirpSceneState, parsedMessage: TangquanParsedAiMessage, reason: string) {
  const outputMode = resolveAirpOutputMode(scene);
  if (outputMode === 'story') {
    sceneStoryText.value = parsedMessage.displayText;
    if (scene.mode === '游客') {
      customerState.value = setCustomerStory(customerState.value, parsedMessage.displayText);
      customerStoryOpen.value = true;
    } else {
      sceneStoryOpen.value = true;
    }
  } else {
    const pages =
      parsedMessage.dialoguePages.length > 0
        ? parsedMessage.dialoguePages
        : [{ speaker: scene.speaker, text: parsedMessage.displayText }];
    if (scene.mode === '游客') {
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        pages,
        scene.speaker,
        parsedMessage.displayText,
      );
    } else {
      sceneDialoguePages.value = pages;
      sceneDialogueIndex.value = 0;
      applyCurrentSceneDialoguePage();
    }
  }
  props.services.log.info('页面解析', '已把 AI 回复应用到当前游玩页面', {
    reason,
    mode: scene.mode,
    kind: scene.kind,
    outputMode,
    pageCount: parsedMessage.dialoguePages.length,
    storyLength: outputMode === 'story' ? parsedMessage.displayText.length : 0,
    timeText: parsedMessage.timeText,
  });
}

function advanceSceneDialogue() {
  if (activeMode.value === '游客') {
    advanceCustomerDialogue();
    return;
  }
  if (sceneDialoguePages.value.length < 2) return;
  sceneDialogueIndex.value = (sceneDialogueIndex.value + 1) % sceneDialoguePages.value.length;
  applyCurrentSceneDialoguePage();
  writeUiMemorySnapshot('现场下一句');
}

function rewindSceneDialogue() {
  if (activeMode.value === '游客') {
    rewindCustomerDialogue();
    return;
  }
  if (sceneDialoguePages.value.length < 2) return;
  sceneDialogueIndex.value =
    (sceneDialogueIndex.value - 1 + sceneDialoguePages.value.length) % sceneDialoguePages.value.length;
  applyCurrentSceneDialoguePage();
  writeUiMemorySnapshot('现场上一句');
}

function openSceneStory() {
  if (sceneStoryText.value) {
    sceneStoryOpen.value = true;
    writeUiMemorySnapshot('打开正文阅读');
  }
}

function closeSceneStory() {
  sceneStoryOpen.value = false;
  writeUiMemorySnapshot('关闭正文阅读');
}

async function toggleAirpOutputMode() {
  const scene = airpState.value;
  if (!scene || airpSubmitting.value || busy.value) return;
  const currentMode = resolveAirpOutputMode(scene);
  const outputMode = toggleTangquanAirpOutputMode(currentMode);
  const sceneId = scene.sceneId;
  const participants = [...(scene.participantIds ?? [])];
  await runAction('切换聊天模式', async () => {
    const nextScene = withTangquanAirpOutputMode(scene, outputMode);
    await enqueueAiGeneration('切换现场输出契约', async () => {
      await syncPresetOutputFormat(nextScene, `切换聊天模式：${outputMode}`);
    });
    airpState.value = nextScene;
    props.services.log.info('AIRP模式', '现场输出模式已切换，业务身份保持不变', {
      sceneId,
      outputMode,
      participantIds: participants,
      currentSceneId: nextScene.sceneId,
      currentParticipantIds: nextScene.participantIds,
      entryIds: nextScene.entryIds,
    });
    writeUiMemorySnapshot('切换聊天模式');
    showToast(outputMode === 'story' ? 'Phản hồi tiếp theo chuyển sang văn bản đầy đủ' : 'Phản hồi tiếp theo chuyển sang hội thoại ngắn Galgame');
  });
  markAutoSaveDirty('切换聊天模式');
  await requestAutoSave('切换聊天模式');
}

const CUSTOMER_GENERATION_EXTRA_KEY = 'tangquanCustomerGeneration';

function makeCustomerGenerationTraceId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `customer-${Date.now().toString(36)}-${random}`;
}

function normalizeCustomerGenerationLinks(value: unknown): CustomerGenerationLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const normalized = value
    .map(item => {
      if (!isRecord(item) || item.version !== 1 || !['dialogue', 'story', 'message'].includes(String(item.kind))) {
        return null;
      }
      const userMessageId = Number(item.userMessageId);
      const assistantMessageId = Number(item.assistantMessageId);
      if (!Number.isInteger(userMessageId) || !Number.isInteger(assistantMessageId)) {
        return null;
      }
      return {
        version: 1 as const,
        traceId: String(item.traceId || ''),
        kind: item.kind as CustomerGenerationKind,
        outputMode: item.outputMode === 'story' || item.kind === 'story' ? ('story' as const) : ('dialogue' as const),
        speaker: String(item.speaker || ''),
        contactName: String(item.contactName || ''),
        userMessageId,
        assistantMessageId,
        contactUserMessageId: String(item.contactUserMessageId || ''),
        contactReplyMessageId: String(item.contactReplyMessageId || ''),
      };
    })
    .filter((item): item is CustomerGenerationLink => Boolean(item?.traceId));
  const seenTraceIds = new Set<string>();
  const deduplicated = normalized
    .slice()
    .reverse()
    .filter(item => {
      if (seenTraceIds.has(item.traceId)) {
        return false;
      }
      seenTraceIds.add(item.traceId);
      return true;
    })
    .reverse();
  const latestSceneIndex = _.findLastIndex(deduplicated, item => item.kind !== 'message');
  return deduplicated.filter((item, index) => item.kind === 'message' || index === latestSceneIndex).slice(-120);
}

function makeCustomerGenerationExtra(
  traceId: string,
  kind: CustomerGenerationKind,
  speaker: string,
  contactName: string,
  role: 'user' | 'assistant',
) {
  return {
    [CUSTOMER_GENERATION_EXTRA_KEY]: {
      version: 1,
      traceId,
      kind,
      speaker,
      contactName,
      role,
    },
  };
}

function getCustomerGenerationExtra(message: ChatMessage | ChatMessageSwiped): Record<string, unknown> | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const messageExtra = isRecord(record.extra) ? record.extra : null;
  const nestedMessageExtra = isRecord(messageExtra?.extra) ? messageExtra.extra : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(Number(record.swipe_id) || 0, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const swipeExtra = isRecord(swipeInfo?.extra) ? swipeInfo.extra : null;
  const candidates = [
    messageExtra?.[CUSTOMER_GENERATION_EXTRA_KEY],
    nestedMessageExtra?.[CUSTOMER_GENERATION_EXTRA_KEY],
    swipeInfo?.[CUSTOMER_GENERATION_EXTRA_KEY],
    swipeExtra?.[CUSTOMER_GENERATION_EXTRA_KEY],
  ];
  const value = candidates.find(item => isRecord(item) && item.version === 1 && typeof item.traceId === 'string');
  return isRecord(value) ? value : null;
}

function getCustomerGenerationMessageText(message: ChatMessage | ChatMessageSwiped): string {
  if ('message' in message && typeof message.message === 'string') {
    return message.message;
  }
  const swipeId = _.clamp(Number(message.swipe_id) || 0, 0, Math.max(0, message.swipes.length - 1));
  return String(message.swipes[swipeId] ?? message.swipes[0] ?? '');
}

function getCustomerMessageStatData(message: ChatMessage | ChatMessageSwiped): Record<string, unknown> | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const swipeId = Number(record.swipe_id) || 0;
  const swipeData = Array.isArray(record.swipes_data)
    ? record.swipes_data[_.clamp(swipeId, 0, Math.max(0, record.swipes_data.length - 1))]
    : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(swipeId, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const candidates = [
    swipeData,
    isRecord(swipeInfo) ? swipeInfo.data : null,
    isRecord(record.data) ? record.data : null,
  ];
  for (const candidate of candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.stat_data)) continue;
    return candidate.stat_data;
  }
  return null;
}

function getLatestChatMessageStatData(): Record<string, unknown> | null {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 0) return null;
  const latest = getChatMessages(lastMessageId, { include_swipes: true })[0];
  return latest ? getCustomerMessageStatData(latest) : null;
}

function canUseCustomerMessageIdFallback(
  link: CustomerGenerationLink,
  userMessage: ChatMessage | ChatMessageSwiped,
): boolean {
  if (link.kind !== 'message') {
    return true;
  }
  const conversation = customerState.value.联系人[link.contactName];
  const contactUserMessage = conversation?.消息.find(message => message.id === link.contactUserMessageId);
  const contactReplyMessage = conversation?.消息.find(message => message.id === link.contactReplyMessageId);
  return Boolean(
    contactUserMessage &&
    contactReplyMessage &&
    contactUserMessage.发送者 === '用户' &&
    contactUserMessage.内容 === getCustomerGenerationMessageText(userMessage),
  );
}

function findCreatedCustomerGenerationMessageIds(traceId: string): {
  userMessageId: number;
  assistantMessageId: number;
} {
  const lastMessageId = getLastMessageId();
  const startMessageId = Math.max(0, lastMessageId - 4);
  const messages = getChatMessages(`${startMessageId}-${lastMessageId}`);
  const matching = messages.filter(message => getCustomerGenerationExtra(message)?.traceId === traceId);
  return {
    userMessageId: matching.find(message => message.role === 'user')?.message_id ?? Math.max(0, lastMessageId - 1),
    assistantMessageId: matching.find(message => message.role === 'assistant')?.message_id ?? lastMessageId,
  };
}

function registerCustomerGenerationLink(link: CustomerGenerationLink) {
  const retained = customerGenerationLinks.value.filter(item => {
    if (item.traceId === link.traceId) return false;
    if (link.kind !== 'message' && item.kind !== 'message') return false;
    return true;
  });
  customerGenerationLinks.value = [...retained, link].slice(-120);
}

const WAITER_GENERATION_EXTRA_KEY = 'tangquanWaiterGeneration';

function makeWaiterGenerationTraceId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `waiter-${Date.now().toString(36)}-${random}`;
}

function normalizeWaiterGenerationLinks(value: unknown): WaiterGenerationLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  return value
    .map(item => {
      if (!isRecord(item) || item.version !== 1) {
        return null;
      }
      const userMessageId = Number(item.userMessageId);
      const assistantMessageId = Number(item.assistantMessageId);
      const traceId = String(item.traceId || '');
      if (!traceId || !Number.isInteger(userMessageId) || !Number.isInteger(assistantMessageId)) {
        return null;
      }
      return {
        version: 1 as const,
        traceId,
        assignmentId: String(item.assignmentId || ''),
        userMessageId,
        assistantMessageId,
      };
    })
    .filter((item): item is WaiterGenerationLink => Boolean(item))
    .reverse()
    .filter(item => {
      if (seen.has(item.traceId)) return false;
      seen.add(item.traceId);
      return true;
    })
    .reverse()
    .slice(-80);
}

function makeWaiterGenerationExtra(traceId: string, assignmentId: string, role: 'user' | 'assistant') {
  return {
    [WAITER_GENERATION_EXTRA_KEY]: {
      version: 1,
      traceId,
      assignmentId,
      role,
    },
  };
}

function getWaiterGenerationExtra(message: ChatMessage | ChatMessageSwiped): Record<string, unknown> | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const messageExtra = isRecord(record.extra) ? record.extra : null;
  const nestedMessageExtra = isRecord(messageExtra?.extra) ? messageExtra.extra : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(Number(record.swipe_id) || 0, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const swipeExtra = isRecord(swipeInfo?.extra) ? swipeInfo.extra : null;
  const candidates = [
    messageExtra?.[WAITER_GENERATION_EXTRA_KEY],
    nestedMessageExtra?.[WAITER_GENERATION_EXTRA_KEY],
    swipeInfo?.[WAITER_GENERATION_EXTRA_KEY],
    swipeExtra?.[WAITER_GENERATION_EXTRA_KEY],
  ];
  const value = candidates.find(item => isRecord(item) && item.version === 1 && typeof item.traceId === 'string');
  return isRecord(value) ? value : null;
}

function getWaiterMessageStatData(message: ChatMessage | ChatMessageSwiped): Record<string, unknown> | null {
  const record = message as (ChatMessage & Partial<ChatMessageSwiped>) | (ChatMessageSwiped & Partial<ChatMessage>);
  const swipeId = Number(record.swipe_id) || 0;
  const swipeData = Array.isArray(record.swipes_data)
    ? record.swipes_data[_.clamp(swipeId, 0, Math.max(0, record.swipes_data.length - 1))]
    : null;
  const swipeInfo = Array.isArray(record.swipes_info)
    ? record.swipes_info[_.clamp(swipeId, 0, Math.max(0, record.swipes_info.length - 1))]
    : null;
  const candidates = [
    swipeData,
    isRecord(swipeInfo) ? swipeInfo.data : null,
    isRecord(record.data) ? record.data : null,
  ];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const statData = candidate.stat_data;
    if (isRecord(statData)) return statData;
  }
  return null;
}

function findCreatedWaiterGenerationMessageIds(traceId: string): { userMessageId: number; assistantMessageId: number } {
  const lastMessageId = getLastMessageId();
  const startMessageId = Math.max(0, lastMessageId - 4);
  const messages = getChatMessages(`${startMessageId}-${lastMessageId}`);
  const matching = messages.filter(message => getWaiterGenerationExtra(message)?.traceId === traceId);
  return {
    userMessageId: matching.find(message => message.role === 'user')?.message_id ?? Math.max(0, lastMessageId - 1),
    assistantMessageId: matching.find(message => message.role === 'assistant')?.message_id ?? lastMessageId,
  };
}

function removeCustomerGenerationLink(traceId: string) {
  customerGenerationLinks.value = customerGenerationLinks.value.filter(item => item.traceId !== traceId);
}

function clearCustomerGeneratedResult(link: CustomerGenerationLink, reason: string) {
  if (link.kind === 'message') {
    customerState.value = removeCustomerMessages(
      customerState.value,
      link.contactName,
      [link.contactUserMessageId, link.contactReplyMessageId].filter(Boolean),
    );
  } else {
    const scene = airpState.value?.mode === '游客' ? airpState.value : null;
    customerState.value = setCustomerDialoguePages(
      customerState.value,
      [],
      scene?.speaker || link.speaker || 'Hoa Chưa Nở',
      scene?.line || 'Đoạn hội thoại vừa rồi đã được thu hồi.',
    );
    if (link.outputMode === 'story') {
      customerState.value = setCustomerStory(customerState.value, '');
      customerStoryOpen.value = false;
    }
  }
  removeCustomerGenerationLink(link.traceId);
  props.services.log.info('游客楼层同步', '已撤销不存在楼层对应的页面结果', {
    reason,
    traceId: link.traceId,
    kind: link.kind,
  });
}

function applyCustomerGeneratedMessage(
  link: CustomerGenerationLink,
  message: ChatMessage | ChatMessageSwiped,
  reason: string,
) {
  const parsedMessage = parseTangquanAiMessage(getCustomerGenerationMessageText(message));
  if (link.kind === 'message') {
    const replyText = parsedMessage.dialoguePages[0]?.text || parsedMessage.displayText || 'Đối phương tạm thời chưa trả lời.';
    customerState.value = updateCustomerMessageContent(
      customerState.value,
      link.contactName,
      link.contactReplyMessageId,
      replyText,
    );
  } else {
    const pages =
      parsedMessage.dialoguePages.length > 0
        ? parsedMessage.dialoguePages
        : [{ speaker: link.speaker, text: parsedMessage.displayText }];
    customerState.value = setCustomerDialoguePages(customerState.value, pages, link.speaker, parsedMessage.displayText);
    if (link.outputMode === 'story') {
      customerState.value = setCustomerStory(customerState.value, parsedMessage.displayText);
    }
    if (parsedMessage.timeText) {
      customerState.value = applyCustomerTimeText(customerState.value, parsedMessage.timeText);
    }
  }
  props.services.log.info('游客楼层同步', '已按当前楼层内容刷新页面结果', {
    reason,
    traceId: link.traceId,
    kind: link.kind,
    messageId: message.message_id,
  });
}

function updateCustomerGeneratedUserMessage(
  link: CustomerGenerationLink,
  message: ChatMessage | ChatMessageSwiped,
  reason: string,
) {
  if (link.kind !== 'message' || !link.contactUserMessageId) {
    return;
  }
  customerState.value = updateCustomerMessageContent(
    customerState.value,
    link.contactName,
    link.contactUserMessageId,
    getCustomerGenerationMessageText(message),
  );
  props.services.log.info('游客楼层同步', '已按当前用户楼层刷新联系人消息', {
    reason,
    traceId: link.traceId,
    messageId: message.message_id,
  });
}

async function syncCustomerGeneratedResults(
  reason: string,
  changedMessageId: number,
  deletedMessageId: number | null = null,
) {
  if (activeMode.value !== '游客') {
    return;
  }
  if (customerGenerationLinks.value.length === 0) {
    if (deletedMessageId !== null) {
      await restoreCustomerRuntimeAfterChatDeletion(reason);
    }
    return;
  }
  const lastMessageId = getLastMessageId();
  const messages = lastMessageId >= 0 ? getChatMessages(`0-${lastMessageId}`, { include_swipes: true }) : [];
  const messagesById = new Map(messages.map(message => [message.message_id, message]));
  const messagesByTrace = new Map<string, { user?: ChatMessageSwiped; assistant?: ChatMessageSwiped }>();
  messages.forEach(message => {
    const trace = getCustomerGenerationExtra(message);
    if (!trace) return;
    const current = messagesByTrace.get(String(trace.traceId)) ?? {};
    if (message.role === 'user') current.user = message;
    if (message.role === 'assistant') current.assistant = message;
    messagesByTrace.set(String(trace.traceId), current);
  });

  const nextLinks: CustomerGenerationLink[] = [];
  for (const originalLink of customerGenerationLinks.value) {
    const traced = messagesByTrace.get(originalLink.traceId);
    const deletedLinkedMessage =
      deletedMessageId === originalLink.userMessageId || deletedMessageId === originalLink.assistantMessageId;
    const idUserCandidate = !deletedLinkedMessage ? messagesById.get(originalLink.userMessageId) : undefined;
    const idUserTrace = idUserCandidate ? getCustomerGenerationExtra(idUserCandidate) : null;
    const fallbackUserMessage =
      idUserCandidate?.role === 'user' && (!idUserTrace || idUserTrace.traceId === originalLink.traceId)
        ? idUserCandidate
        : undefined;
    const userMessage =
      traced?.user ??
      (fallbackUserMessage && canUseCustomerMessageIdFallback(originalLink, fallbackUserMessage)
        ? fallbackUserMessage
        : undefined);
    const expectedAssistantId = userMessage ? userMessage.message_id + 1 : originalLink.assistantMessageId;
    const idAssistantCandidate = !deletedLinkedMessage ? messagesById.get(expectedAssistantId) : undefined;
    const idAssistantTrace = idAssistantCandidate ? getCustomerGenerationExtra(idAssistantCandidate) : null;
    const assistantMessage =
      traced?.assistant ??
      (idAssistantCandidate?.role === 'assistant' &&
      (!idAssistantTrace || idAssistantTrace.traceId === originalLink.traceId)
        ? idAssistantCandidate
        : undefined);
    if (!userMessage || !assistantMessage) {
      clearCustomerGeneratedResult(originalLink, reason);
      continue;
    }
    const link = {
      ...originalLink,
      userMessageId: userMessage?.message_id ?? originalLink.userMessageId,
      assistantMessageId: assistantMessage.message_id,
    };
    nextLinks.push(link);
    if (changedMessageId === assistantMessage.message_id) {
      applyCustomerGeneratedMessage(link, assistantMessage, reason);
    }
    if (userMessage && changedMessageId === userMessage.message_id) {
      updateCustomerGeneratedUserMessage(link, userMessage, reason);
    }
  }
  customerGenerationLinks.value = nextLinks;
  const latestLink = [...nextLinks].sort((a, b) => b.assistantMessageId - a.assistantMessageId)[0];
  const latestAssistant = latestLink
    ? (messagesByTrace.get(latestLink.traceId)?.assistant ?? messagesById.get(latestLink.assistantMessageId))
    : null;
  const latestStatData = latestAssistant
    ? getCustomerMessageStatData(latestAssistant)
    : messages.length > 0
      ? getCustomerMessageStatData(messages.at(-1)!)
      : null;
  if (latestStatData) {
    const applied = applyCustomerStatDataToState(
      customerState.value,
      customerMvuBlockStore.value,
      latestStatData,
      true,
    );
    customerState.value = applied.state;
    customerMvuBlockStore.value = applied.store;
    if (airpState.value?.mode === '游客') {
      await refreshActiveAirpSceneRuntime(reason, applied.statData);
    }
  }
  if (deletedMessageId !== null) {
    await restoreCustomerRuntimeAfterChatDeletion(reason);
  }
  writeUiMemorySnapshot(reason);
}

function scheduleCustomerGeneratedResultSync(
  reason: string,
  changedMessageId: number,
  deletedMessageId: number | null = null,
) {
  window.clearTimeout(customerChatSyncTimer);
  scheduledBackgroundSyncs.add('customer-chat');
  customerChatSyncTimer = window.setTimeout(() => {
    customerChatSyncTimer = 0;
    scheduledBackgroundSyncs.delete('customer-chat');
    void runBackgroundSync(`游客楼层同步：${reason}`, async () => {
      await syncCustomerGeneratedResults(reason, changedMessageId, deletedMessageId);
      markAutoSaveDirty(`游客楼层同步：${reason}`);
    }).catch(error => {
      props.services.log.error('游客楼层同步', `${reason}失败`, String(error));
    });
  }, 180);
}

async function syncWaiterGeneratedResults(
  reason: string,
  deletedMessageId: number | null = null,
  allowRollback = false,
) {
  if (activeMode.value !== '服务员' || !waiterState.value.currentService) {
    return;
  }
  const assignmentId = waiterState.value.currentService.assignmentId;
  const assignment = waiterState.value.assignments.find(item => item.id === assignmentId) ?? null;
  const lastMessageId = getLastMessageId();
  const messages = lastMessageId >= 0 ? getChatMessages(`0-${lastMessageId}`, { include_swipes: true }) : [];
  const messagesById = new Map(messages.map(message => [message.message_id, message]));
  const assistantsByTrace = new Map<string, ChatMessage | ChatMessageSwiped>();
  messages.forEach(message => {
    if (message.role !== 'assistant') return;
    const extra = getWaiterGenerationExtra(message);
    if (extra?.traceId && extra.assignmentId === assignmentId) {
      assistantsByTrace.set(String(extra.traceId), message);
    }
  });
  const assistantByLink = new Map<string, ChatMessage | ChatMessageSwiped>();
  const remainingLinks = waiterGenerationLinks.value.filter(link => {
    if (link.assignmentId !== assignmentId) return false;
    if (deletedMessageId === link.userMessageId || deletedMessageId === link.assistantMessageId) return false;
    const traced = assistantsByTrace.get(link.traceId);
    const fallback = messagesById.get(link.assistantMessageId);
    const assistant = traced ?? (fallback?.role === 'assistant' ? fallback : undefined);
    if (!assistant) return false;
    assistantByLink.set(link.traceId, assistant);
    return true;
  });
  waiterGenerationLinks.value = remainingLinks;
  const latestLink = [...remainingLinks].sort((a, b) => b.assistantMessageId - a.assistantMessageId)[0];
  const latestMessage = latestLink ? assistantByLink.get(latestLink.traceId) : null;
  const statData = latestMessage
    ? getWaiterMessageStatData(latestMessage)
    : messages.length > 0
      ? getWaiterMessageStatData(messages.at(-1)!)
      : null;
  props.services.log.debug('服务员楼层同步', '已读取当前消息页变量', {
    latestMessageId: latestMessage?.message_id ?? null,
    hasStatData: Boolean(statData),
    growth: statData?.成长记录 ?? null,
  });
  if (statData) {
    const applied = applyWaiterStatDataToState(waiterState.value, waiterMvuBlockStore.value, statData, allowRollback);
    waiterState.value = applied.state;
    waiterMvuBlockStore.value = applied.store;
    props.services.log.debug('服务员楼层同步', '已应用当前消息页变量', {
      growth: waiterState.value.growth,
    });
  } else {
    const baseline = waiterState.value.currentService.resultBaseline;
    waiterState.value = applyWaiterGrowthFromMvu(waiterState.value, baseline, true);
  }
  if (latestMessage) {
    const sceneExtra = getSceneGenerationExtra(latestMessage);
    if ((sceneExtra?.outputMode ?? sceneExtra?.kind) === 'story' && assignment) {
      waiterState.value = setWaiterDialogue(
        waiterState.value,
        assignment.guest,
        `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
      );
    } else {
      const parsed = parseTangquanAiMessage(typeof latestMessage.message === 'string' ? latestMessage.message : '');
      waiterState.value = setWaiterDialogue(
        waiterState.value,
        assignment?.guest ?? waiterState.value.dialogue.speaker,
        parsed.dialoguePages[0]?.text || parsed.displayText,
      );
    }
  } else if (assignment) {
    waiterState.value = setWaiterDialogue(
      waiterState.value,
      assignment.guest,
      `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
    );
  }
  await refreshActiveWaiterMvuBlocks(reason);
  if (airpState.value?.mode === '服务员') {
    await refreshActiveAirpSceneRuntime(reason);
  }
  writeUiMemorySnapshot(reason);
  props.services.log.info('服务员楼层同步', '已按当前楼层恢复服务结果', {
    reason,
    assignmentId,
    remainingLinks: remainingLinks.length,
  });
}

function scheduleWaiterGeneratedResultSync(
  reason: string,
  deletedMessageId: number | null = null,
  allowRollback = false,
) {
  window.clearTimeout(waiterChatSyncTimer);
  scheduledBackgroundSyncs.add('waiter-chat');
  waiterChatSyncTimer = window.setTimeout(() => {
    waiterChatSyncTimer = 0;
    scheduledBackgroundSyncs.delete('waiter-chat');
    void runBackgroundSync(`服务员楼层同步：${reason}`, async () => {
      await syncWaiterGeneratedResults(reason, deletedMessageId, allowRollback);
      markAutoSaveDirty(`服务员楼层同步：${reason}`);
    }).catch(error => {
      props.services.log.error('服务员楼层同步', `${reason}失败`, String(error));
    });
  }, 180);
}

async function syncBossMvuFromLatestMessage(reason: string) {
  if (activeMode.value !== '老板') return;
  const current = getLatestChatMessageStatData() ?? (await props.services.mvuRuntime.readCurrentStatData());
  const applied = applyBossStatDataToState(bossState.value, mvuBlockStore.value, current, true);
  bossState.value = applied.state;
  mvuBlockStore.value = applied.store;
  if (airpState.value?.mode === '老板') {
    await refreshActiveAirpSceneRuntime(reason, applied.statData);
  }
  writeUiMemorySnapshot(reason);
  props.services.log.info('老板楼层同步', '已按当前消息页恢复经营现场结果', { reason });
}

function scheduleBossMvuSync(reason: string) {
  window.clearTimeout(bossChatSyncTimer);
  scheduledBackgroundSyncs.add('boss-chat');
  bossChatSyncTimer = window.setTimeout(() => {
    bossChatSyncTimer = 0;
    scheduledBackgroundSyncs.delete('boss-chat');
    void runBackgroundSync(`老板楼层同步：${reason}`, async () => {
      await syncBossMvuFromLatestMessage(reason);
      markAutoSaveDirty(`老板楼层同步：${reason}`);
    }).catch(error => {
      props.services.log.error('老板楼层同步', `${reason}失败`, String(error));
    });
  }, 180);
}

function syncScenePresentationFromLatestMessage(reason: string) {
  chatHistoryVersion.value += 1;
  const scene = airpState.value;
  if (!scene) return;
  const pair = findLatestSceneGenerationPair(scene);
  if (!pair) {
    resetScenePresentation(scene);
    if (scene.mode === '老板') {
      setBossLine(scene.speaker, scene.line);
    } else if (scene.mode === '服务员') {
      waiterState.value = setWaiterDialogue(waiterState.value, scene.speaker, scene.line);
    }
    props.services.log.info('页面解析', '当前现场没有可用生成楼层，已恢复进入现场时的显示', { reason });
    return;
  }
  const parsed = parseTangquanAiMessage(getSceneMessageText(pair.assistantMessage));
  applyScenePresentation(scene, parsed, reason);
}

async function reconcileActiveModeMvuFromCurrent(reason: string) {
  if (activePage.value !== 'play') return;
  const current = getLatestChatMessageStatData() ?? (await props.services.mvuRuntime.readCurrentStatData());
  if (activeMode.value === '老板') {
    const applied = applyBossStatDataToState(bossState.value, mvuBlockStore.value, current, true);
    bossState.value = applied.state;
    mvuBlockStore.value = applied.store;
    await refreshActiveAirpSceneRuntime(reason, applied.statData);
  } else if (activeMode.value === '游客') {
    const applied = applyCustomerStatDataToState(customerState.value, customerMvuBlockStore.value, current, true);
    customerState.value = applied.state;
    customerMvuBlockStore.value = applied.store;
    await refreshActiveAirpSceneRuntime(reason, applied.statData);
  } else if (activeMode.value === '服务员') {
    const applied = applyWaiterStatDataToState(waiterState.value, waiterMvuBlockStore.value, current, true);
    waiterState.value = applied.state;
    waiterMvuBlockStore.value = applied.store;
    const lastMessageId = getLastMessageId();
    const latestMessage = lastMessageId >= 0 ? getChatMessages(lastMessageId, { include_swipes: true })[0] : null;
    const waiterExtra = latestMessage ? getWaiterGenerationExtra(latestMessage) : null;
    const assignmentId = waiterState.value.currentService?.assignmentId ?? '';
    const assignment = assignmentId ? waiterState.value.assignments.find(item => item.id === assignmentId) : null;
    if (latestMessage?.role === 'assistant' && waiterExtra?.assignmentId === assignmentId) {
      const sceneExtra = getSceneGenerationExtra(latestMessage);
      if ((sceneExtra?.outputMode ?? sceneExtra?.kind) === 'story' && assignment) {
        waiterState.value = setWaiterDialogue(
          waiterState.value,
          assignment.guest,
          `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
        );
      } else {
        const parsed = parseTangquanAiMessage(typeof latestMessage.message === 'string' ? latestMessage.message : '');
        waiterState.value = setWaiterDialogue(
          waiterState.value,
          assignment?.guest ?? waiterState.value.dialogue.speaker,
          parsed.dialoguePages[0]?.text || parsed.displayText,
        );
      }
    } else if (assignment) {
      waiterState.value = setWaiterDialogue(
        waiterState.value,
        assignment.guest,
        `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
      );
    }
    await refreshActiveAirpSceneRuntime(reason, applied.statData);
  }
  writeUiMemorySnapshot(reason);
  props.services.log.info('MVU重挂核对', '已按稳定后的当前楼层重新同步', { reason, mode: activeMode.value });
}

function schedulePostRemountMvuReconcile() {
  window.clearTimeout(postRemountMvuSyncTimer);
  scheduledBackgroundSyncs.add('post-remount');
  postRemountMvuSyncTimer = window.setTimeout(() => {
    postRemountMvuSyncTimer = 0;
    scheduledBackgroundSyncs.delete('post-remount');
    void runBackgroundSync('界面重挂延迟核对', () => reconcileActiveModeMvuFromCurrent('界面重挂延迟核对')).catch(
      error => {
        props.services.log.error('MVU重挂核对', '延迟核对失败', String(error));
      },
    );
  }, 2600);
}

function startCustomerChatEventSync() {
  const eventWindow = window as Window & { __tqCustomerChatEventStops?: Array<() => void> };
  eventWindow.__tqCustomerChatEventStops?.splice(0).forEach(stop => stop());
  customerChatEventStops.push(
    eventOn(tavern_events.MESSAGE_DELETED, messageId => {
      chatHistoryVersion.value += 1;
      scheduleBossMvuSync('删除楼层');
      scheduleCustomerGeneratedResultSync('删除楼层', messageId, messageId);
      scheduleWaiterGeneratedResultSync('删除楼层', messageId, true);
      window.setTimeout(() => syncScenePresentationFromLatestMessage('删除楼层'), 220);
    }).stop,
    eventOn(tavern_events.MESSAGE_SWIPED, messageId => {
      chatHistoryVersion.value += 1;
      scheduleBossMvuSync('切换消息页');
      scheduleCustomerGeneratedResultSync('切换消息页', messageId);
      scheduleWaiterGeneratedResultSync('切换消息页', null, true);
      window.setTimeout(() => syncScenePresentationFromLatestMessage('切换消息页'), 220);
    }).stop,
    eventOn(tavern_events.MESSAGE_EDITED, messageId => {
      chatHistoryVersion.value += 1;
      scheduleBossMvuSync('编辑楼层');
      scheduleCustomerGeneratedResultSync('编辑楼层', messageId);
      scheduleWaiterGeneratedResultSync('编辑楼层', null, true);
      window.setTimeout(() => syncScenePresentationFromLatestMessage('编辑楼层'), 220);
    }).stop,
    eventOn(tavern_events.MESSAGE_UPDATED, messageId => {
      chatHistoryVersion.value += 1;
      scheduleBossMvuSync('更新楼层');
      scheduleCustomerGeneratedResultSync('更新楼层', messageId);
      scheduleWaiterGeneratedResultSync('更新楼层');
      window.setTimeout(() => syncScenePresentationFromLatestMessage('更新楼层'), 220);
    }).stop,
  );
  eventWindow.__tqCustomerChatEventStops = customerChatEventStops;
}

function startChatMutationSync() {
  chatMutationObserver?.disconnect();
  const parentWindow = window.parent;
  const chat = parentWindow.document.querySelector('#chat');
  if (!chat) return;
  const isRealMessageNode = (node: Node) => {
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (!element) return false;
    if (element.closest('.mes[data-tq-visual-zero="true"]')) return false;
    return Boolean(element.closest('.mes') || element.matches('.mes') || element.querySelector('.mes'));
  };
  chatMutationObserver = new parentWindow.MutationObserver(mutations => {
    const relevant = mutations.some(mutation => {
      if (isRealMessageNode(mutation.target)) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some(isRealMessageNode);
    });
    if (!relevant) return;
    window.clearTimeout(chatDomSyncTimer);
    scheduledBackgroundSyncs.add('chat-dom');
    chatDomSyncTimer = window.setTimeout(() => {
      chatDomSyncTimer = 0;
      scheduledBackgroundSyncs.delete('chat-dom');
      void runBackgroundSync('聊天楼层变化', async () => {
        const lastMessageId = getLastMessageId();
        if (activeMode.value === '游客') {
          await syncCustomerGeneratedResults('聊天楼层变化', lastMessageId);
        } else if (activeMode.value === '服务员') {
          await syncWaiterGeneratedResults('聊天楼层变化', null, true);
        }
        await reconcileActiveModeMvuFromCurrent('聊天楼层变化');
        markAutoSaveDirty('聊天楼层变化');
      }).catch(error => {
        props.services.log.error('MVU楼层监听', '聊天楼层变化同步失败', String(error));
      });
    }, 2800);
  });
  chatMutationObserver.observe(chat, { childList: true, subtree: true, characterData: true });
}

async function readLatestMvuData(): Promise<Mvu.MvuData> {
  return readCurrentTangquanMvuData();
}

function makeMvuChangedPaths(before: unknown, after: unknown, path = 'stat_data', output: string[] = []): string[] {
  if (output.length >= 500 || _.isEqual(before, after)) return output;
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    keys.forEach(key => makeMvuChangedPaths(before[key], after[key], `${path}.${key}`, output));
    return output;
  }
  output.push(path);
  return output;
}

function mergeParsedTimeIntoMvuData(mvuData: Mvu.MvuData, oldMvuData: Mvu.MvuData, timeText: string): Mvu.MvuData {
  const parsedTimeText = timeText.trim();
  if (!parsedTimeText) return mvuData;

  const oldCurrentTime = String(_.get(oldMvuData, 'stat_data.当前时间', '')).trim();
  const parsedDate = parsedTimeText.match(/\d{4}年\d{1,2}月\d{1,2}日(?:\s+星期[^\s]+)?/)?.[0] ?? '';
  const oldDate = oldCurrentTime.match(/\d{4}年\d{1,2}月\d{1,2}日(?:\s+星期[^\s]+)?/)?.[0] ?? '';
  const parsedClock = parsedTimeText.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/);
  const oldClock = oldCurrentTime.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/);
  const dateText = parsedDate || oldDate;
  const clockText = parsedClock
    ? `${parsedClock[1].padStart(2, '0')}:${parsedClock[2]}`
    : oldClock
      ? `${oldClock[1].padStart(2, '0')}:${oldClock[2]}`
      : '';
  const currentTime = [dateText, clockText].filter(Boolean).join(' ').trim();
  if (!currentTime) return mvuData;

  const next = _.cloneDeep(mvuData);
  _.set(next, 'stat_data.当前时间', currentTime);
  return next;
}

async function requestSceneGeneration(
  scene: AirpSceneState,
  userText: string,
  oldMvuData: Mvu.MvuData,
  reason: string,
  diagnostics: {
    inputBoxValue: string;
    inputSource: 'scene-input' | 'reroll-user-floor';
    beforeMessageId?: number;
  },
): Promise<{ message: string; parsedMessage: TangquanParsedAiMessage; newMvuData: Mvu.MvuData }> {
  return enqueueAiGeneration(reason, async () => {
    await syncPresetOutputFormat(scene, `${reason}：确认输出格式`);
    await replaceTemporaryEntries(scene.entryIds, scene.title, scene.entryContentMap);
    const identity = makeSceneIdentity(scene);
    const outputMode = resolveAirpOutputMode(scene);
    const chatHistoryPrompts = makeSceneChatHistoryPrompts(scene, diagnostics.beforeMessageId);
    const customerInjects =
      scene.mode === '游客' ? makeCustomerGenerationInjects(outputMode, scene.speaker) : undefined;
    const waiterInjects = scene.mode === '服务员' ? makeWaiterGenerationInjects(outputMode, scene.speaker) : undefined;
    let presetInspection: unknown = null;
    try {
      presetInspection = props.services.presetOutputFormat.inspect();
    } catch (error) {
      presetInspection = { error: String(error) };
    }
    props.services.log.info('生成诊断', '本轮输入与最终聊天历史', {
      sceneId: identity.sceneId,
      inputSource: diagnostics.inputSource,
      inputBoxValue: diagnostics.inputBoxValue,
      generateUserInput: userText,
      chatHistory: _.cloneDeep(chatHistoryPrompts),
      chatHistoryOverrideCount: chatHistoryPrompts.length,
      exactCurrentInputInHistory: chatHistoryPrompts.filter(prompt => prompt.content.trim() === userText).length,
      currentInputAppendCount: 1,
    });
    props.services.log.info('生成诊断', '即将调用酒馆 generate()', {
      reason,
      scene: _.cloneDeep(scene),
      sceneId: identity.sceneId,
      mode: identity.mode,
      kind: identity.kind,
      outputMode,
      speakerId: identity.speakerId,
      participantIds: identity.participantIds,
      locationId: identity.locationId,
      serviceId: identity.serviceId,
      projectId: identity.projectId,
      assignmentId: identity.assignmentId,
      inputSource: diagnostics.inputSource,
      inputBoxValue: diagnostics.inputBoxValue,
      userInput: userText,
      preset: presetInspection,
      injects: _.cloneDeep(customerInjects ?? waiterInjects ?? []),
      chatHistory: _.cloneDeep(chatHistoryPrompts),
      chatHistoryOverrideCount: chatHistoryPrompts.length,
      exactCurrentInputInHistory: chatHistoryPrompts.filter(prompt => prompt.content.trim() === userText).length,
      currentInputAppendCount: 1,
      activeTemporaryEntryIds: [...activeTemporaryEntryIds.value],
      oldMvuData: _.cloneDeep(oldMvuData),
      lastMessageId: getLastMessageId(),
    });
    const result = await generate({
      user_input: userText,
      should_stream: true,
      overrides: {
        chat_history: {
          with_depth_entries: true,
          prompts: chatHistoryPrompts,
        },
      },
      ...(customerInjects?.length
        ? { injects: customerInjects }
        : waiterInjects?.length
          ? { injects: waiterInjects }
          : {}),
    });
    const rawMessage = getGenerationText(result);
    const message = rawMessage.trim() || '<content>Đối phương tạm thời không tiếp tục phản hồi.</content>';
    props.services.log.info('生成诊断', 'generate() 已返回原始文本', {
      reason,
      sceneId: identity.sceneId,
      participantIds: identity.participantIds,
      rawMessage,
      rawLength: rawMessage.length,
    });
    const parsedMessage = parseTangquanAiMessage(message);
    props.services.log.info('解析诊断', '正文解析完成', {
      reason,
      parsedMessage: _.cloneDeep(parsedMessage),
      expectedKind: outputMode,
      formatIssues: [
        parsedMessage.contentTagCount === 0 ? '缺少 content 标签' : '',
        parsedMessage.contentTagCount > 1 ? '存在多个 content 标签' : '',
        outputMode === 'dialogue' && parsedMessage.dialoguePages.length === 0 ? '未解析到分页台词' : '',
        outputMode === 'story' && !parsedMessage.displayText.trim() ? '正文为空' : '',
      ].filter(Boolean),
    });
    let newMvuData = oldMvuData;
    if (isTangquanMvuAvailable()) {
      await waitForTangquanMvu();
      const parseBase = _.cloneDeep(oldMvuData);
      newMvuData = (await Mvu.parseMessage(message, parseBase)) ?? parseBase;
    } else {
      props.services.log.warn('MVU', 'MVU 不可用，现场回复已生成但未解析变量更新');
    }
    newMvuData = mergeParsedTimeIntoMvuData(newMvuData, oldMvuData, parsedMessage.timeText);
    const oldStatData = _.get(oldMvuData, 'stat_data');
    const newStatData = _.get(newMvuData, 'stat_data');
    props.services.log.info('MVU诊断', 'AI 回复变量解析完成', {
      reason,
      changedPaths: makeMvuChangedPaths(oldStatData, newStatData),
      oldStatData: _.cloneDeep(oldStatData),
      newStatData: _.cloneDeep(newStatData),
    });
    return { message, parsedMessage, newMvuData };
  });
}

function makeDailyGenerationOverrides(): Overrides {
  return {
    world_info_before: '',
    persona_description: '',
    char_description: '',
    char_personality: '',
    scenario: '',
    world_info_after: '',
    dialogue_examples: '',
    chat_history: {
      with_depth_entries: false,
      prompts: [],
    },
  };
}

async function requestBossDailyReport(reason: string, facts: BossDailyReportFacts): Promise<BossDailyReport> {
  const fallback = (issues: string[] = []) => makeLocalBossDailyReport(facts, issues);
  return enqueueAiGeneration(reason, async () => {
    const restoreFormat = resolvePresetOutputFormat(airpState.value);
    const formatReady = await props.services.presetOutputFormat.setFormat('bossDaily', `${reason}：经营日报输出`);
    if (!formatReady) {
      const issues = ['老板经营日报输出格式不可用'];
      props.services.log.warn('经营日报', '专用输出格式不可用，使用本地经营纪要', {
        reason,
        issues,
        facts: _.cloneDeep(facts),
      });
      return fallback(issues);
    }
    try {
      const injects = makeBossDailyReportInjects(facts);
      props.services.log.info('经营日报', '即将根据冻结事实生成老板经营纪要', {
        reason,
        preset: props.services.presetOutputFormat.inspect(),
        facts: _.cloneDeep(facts),
        injects: _.cloneDeep(injects),
      });
      const result = await generate({
        user_input: '',
        should_stream: false,
        should_silence: true,
        max_chat_history: 0,
        overrides: makeDailyGenerationOverrides(),
        injects,
      });
      const rawMessage = getGenerationText(result);
      const applied = applyBossDailyReport(rawMessage, facts);
      props.services.log.info('经营日报', '老板经营纪要解析完成', {
        reason,
        ok: applied.ok,
        issues: applied.issues,
        rawMessage,
      });
      return applied.report;
    } catch (error) {
      const issues = [String(error)];
      props.services.log.error('经营日报', '老板经营纪要生成失败，使用本地纪要', {
        reason,
        error: String(error),
      });
      return fallback(issues);
    } finally {
      await props.services.presetOutputFormat.setFormat(restoreFormat, `${reason}：恢复现场输出`);
    }
  });
}

async function finishBossDayWithReport({
  label,
  mutate,
  line,
}: {
  label: string;
  mutate: (state: BossPageState) => BossMutationResult;
  line: string;
}) {
  let completed = false;
  let reportSource: BossDailyReport['来源'] | '' = '';
  let reportBusinessDay = 0;
  let reportDate = '';
  await runAction(label, async () => {
    const frozenState = cloneBossPageState(bossState.value);
    const result = mutate(frozenState);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    const facts = makeBossDailyReportFacts(frozenState, result.state);
    props.services.log.info('经营日报', '老板日结事实已冻结，等待纪要完成后提交跨日状态', {
      label,
      businessDay: facts.businessDay,
      date: facts.date,
      settlement: _.cloneDeep(facts.settlement),
      projectNames: facts.projects.map(item => item.name),
      employeeNames: facts.employees.map(item => item.name),
      eventIds: facts.events.map(item => item.id),
    });
    const report = await requestBossDailyReport(`${label}经营日报`, facts);
    bossState.value = attachBossDailyReport(result.state, report);
    completed = true;
    reportSource = report.来源;
    reportBusinessDay = report.营业日;
    reportDate = report.日期;
    await refreshActiveBossMvuBlocks(label);
    openBossMenu('settlement');
    await deactivateBossMvuBlocks(label);
    setBossLine(bossUserName.value, line);
    showToast(result.message);
  });
  if (!completed) return;
  markAutoSaveDirty(label);
  const saveResult = await requestAutoSave(`${label}跨日完成`, true);
  if (saveResult.status === 'saved') {
    await refreshSlotsQuietly();
    props.services.log.info('经营日报', '老板日结、经营纪要与跨日状态已自动保存', {
      label,
      slotId: saveResult.meta?.slotId ?? '',
      source: reportSource,
      businessDay: reportBusinessDay,
      date: reportDate,
      nextBusinessDay: bossState.value.营业日,
      nextDate: bossState.value.日期,
      elapsedMs: saveResult.elapsedMs,
    });
  }
}

async function requestCustomerDailyArrangement(reason: string): Promise<string | null> {
  return enqueueAiGeneration(reason, async () => {
    const restoreFormat = resolvePresetOutputFormat(airpState.value);
    const formatReady = await props.services.presetOutputFormat.setFormat('customerDaily', `${reason}：每日输出`);
    if (!formatReady) {
      props.services.log.warn('每日安排', '游客每日输出格式不可用，保留前端确定性安排', { reason });
      return null;
    }
    try {
      const sourceState = cloneCustomerPageState(customerState.value);
      const injects = makeCustomerDailyArrangementInjects(sourceState);
      props.services.log.info('每日安排', '即将生成游客每日安排', {
        reason,
        preset: props.services.presetOutputFormat.inspect(),
        injects: _.cloneDeep(injects),
        date: sourceState.日期,
        employeeNames: [...sourceState.今日员工],
      });
      const result = await generate({
        user_input: '',
        should_stream: false,
        should_silence: true,
        max_chat_history: 0,
        overrides: makeDailyGenerationOverrides(),
        injects,
      });
      const rawMessage = getGenerationText(result);
      const applied = applyCustomerDailyArrangement(rawMessage, sourceState);
      props.services.log.info('每日安排', '游客每日安排解析完成', {
        reason,
        ok: applied.ok,
        issues: applied.issues,
        rawMessage,
      });
      if (!applied.ok) {
        return null;
      }
      customerState.value = applied.state;
      return applied.note;
    } catch (error) {
      props.services.log.error('每日安排', '游客每日安排生成失败，保留前端确定性安排', {
        reason,
        error: String(error),
      });
      return null;
    } finally {
      await props.services.presetOutputFormat.setFormat(restoreFormat, `${reason}：恢复现场输出`);
    }
  });
}

async function requestWaiterDailyArrangement(reason: string): Promise<string | null> {
  if (hasAttemptedWaiterGuestGeneration(waiterState.value)) {
    props.services.log.info('每日客人', '当日服务员客人已经生成，跳过重复请求', {
      reason,
      dateIso: waiterState.value.dateIso,
      source: waiterState.value.guestGeneration.source,
      assignmentIds: waiterState.value.assignments.map(item => item.id),
      guestIds: [...waiterState.value.dailyGuestIds],
    });
    return null;
  }
  return enqueueAiGeneration(reason, async () => {
    waiterState.value = markWaiterGuestGenerationFallback(waiterState.value);
    const sourceState = cloneWaiterPageState(waiterState.value);
    const persistResult = async (result: 'ai' | 'fallback') => {
      try {
        const meta = await props.services.save.saveActiveData(makeCurrentSaveDataPatch());
        await refreshSlotsQuietly();
        props.services.log.info('每日客人', '服务员当日客人已写入存档', {
          reason,
          result,
          slotId: meta?.slotId ?? '',
          dateIso: waiterState.value.dateIso,
          guestIds: [...waiterState.value.dailyGuestIds],
          assignmentIds: waiterState.value.assignments.map(item => item.id),
        });
        if (meta) markAutoSaveClean(`服务员当日客人即时保存：${result}`, meta.updatedAt);
      } catch (error) {
        props.services.log.error('每日客人', '服务员当日客人写入存档失败，保留当前内存状态', {
          reason,
          result,
          error: String(error),
        });
      }
    };
    const restoreFormat = resolvePresetOutputFormat(airpState.value);
    const formatReady = await props.services.presetOutputFormat.setFormat('waiterDaily', `${reason}：每日输出`);
    if (!formatReady) {
      waiterState.value = markWaiterGuestGenerationFallback(sourceState, ['服务员每日输出格式不可用']);
      props.services.log.warn('每日客人', '服务员每日输出格式不可用，使用本地多性别兜底', {
        reason,
        guestIds: [...waiterState.value.dailyGuestIds],
      });
      await persistResult('fallback');
      return null;
    }
    try {
      const injects = makeWaiterDailyArrangementInjects(sourceState);
      props.services.log.info('每日客人', '即将生成服务员每日客人与接待安排', {
        reason,
        preset: props.services.presetOutputFormat.inspect(),
        injects: _.cloneDeep(injects),
        date: sourceState.dateText,
        assignmentIds: sourceState.assignments.map(item => item.id),
        fallbackGuestIds: [...sourceState.dailyGuestIds],
        activeNominationGuestIds: sourceState.activeNominations.map(item => item.guestId),
      });
      const result = await generate({
        user_input: '',
        should_stream: false,
        should_silence: true,
        max_chat_history: 0,
        overrides: makeDailyGenerationOverrides(),
        injects,
      });
      const rawMessage = getGenerationText(result);
      const applied = applyWaiterDailyArrangement(rawMessage, sourceState);
      props.services.log.info('每日客人', '服务员每日客人与接待安排解析完成', {
        reason,
        ok: applied.ok,
        issues: applied.issues,
        rawMessage,
      });
      if (!applied.ok) {
        waiterState.value = markWaiterGuestGenerationFallback(sourceState, applied.issues);
        await persistResult('fallback');
        return null;
      }
      waiterState.value = applied.state;
      await persistResult('ai');
      return applied.note;
    } catch (error) {
      waiterState.value = markWaiterGuestGenerationFallback(sourceState, [String(error)]);
      props.services.log.error('每日客人', '服务员每日客人生成失败，使用本地多性别兜底', {
        reason,
        error: String(error),
      });
      await persistResult('fallback');
      return null;
    } finally {
      await props.services.presetOutputFormat.setFormat(restoreFormat, `${reason}：恢复现场输出`);
    }
  });
}

async function submitAirpInput() {
  const scene = airpState.value;
  const inputBoxValue = airpInput.value;
  const userText = inputBoxValue.trim();
  if (!scene) {
    showToast('Chưa vào hiện trường');
    return;
  }
  if (!userText) {
    showToast('Hãy nhập việc cần làm trước');
    return;
  }
  if (airpSubmitting.value) {
    return;
  }

  let generated = false;
  airpSubmitting.value = true;
  writeUiMemorySnapshot('现场互动发送前');
  try {
    await runAction('现场互动', async () => {
      const oldMvuData = _.cloneDeep(await readLatestMvuData());
      const bossStateBeforeGeneration = scene.mode === '老板' ? cloneBossPageState(bossState.value) : null;
      const customerStateBeforeGeneration = scene.mode === '游客' ? cloneCustomerPageState(customerState.value) : null;
      const waiterStateBeforeGeneration = scene.mode === '服务员' ? cloneWaiterPageState(waiterState.value) : null;
      const generation = await requestSceneGeneration(scene, userText, oldMvuData, '现场互动', {
        inputBoxValue,
        inputSource: 'scene-input',
      });
      const { parsedMessage } = generation;
      const customerTraceId = scene.mode === '游客' && scene.kind ? makeCustomerGenerationTraceId() : '';
      const waiterAssignmentId = scene.waiterBlockContext?.assignmentId ?? '';
      const waiterTraceId =
        scene.mode === '服务员' && scene.kind && waiterAssignmentId ? makeWaiterGenerationTraceId() : '';
      const sceneTraceId = customerTraceId || waiterTraceId || makeSceneGenerationTraceId();
      let newMvuData = generation.newMvuData;
      if (bossStateBeforeGeneration) {
        const statData = _.get(newMvuData, 'stat_data');
        if (isRecord(statData)) {
          const applied = applyBossStatDataToState(bossStateBeforeGeneration, mvuBlockStore.value, statData);
          bossState.value = applied.state;
          mvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        }
      }
      if (customerStateBeforeGeneration) {
        const statData = _.get(newMvuData, 'stat_data');
        if (isRecord(statData)) {
          const applied = applyCustomerStatDataToState(
            customerStateBeforeGeneration,
            customerMvuBlockStore.value,
            statData,
          );
          customerState.value = applied.state;
          customerMvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        }
      }
      if (waiterStateBeforeGeneration) {
        const statData = _.get(newMvuData, 'stat_data');
        if (isRecord(statData)) {
          const applied = applyWaiterStatDataToState(waiterStateBeforeGeneration, waiterMvuBlockStore.value, statData);
          waiterState.value = applied.state;
          waiterMvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        }
      }
      await createChatMessages(
        [
          {
            role: 'user',
            message: userText,
            data: oldMvuData,
            extra: {
              ...makeSceneGenerationExtra(scene, sceneTraceId, 'user'),
              ...(customerTraceId && scene.kind
                ? makeCustomerGenerationExtra(customerTraceId, scene.kind, scene.speaker, '', 'user')
                : {}),
              ...(waiterTraceId ? makeWaiterGenerationExtra(waiterTraceId, waiterAssignmentId, 'user') : {}),
            },
          },
          {
            role: 'assistant',
            message: parsedMessage.displayText,
            data: newMvuData,
            extra: {
              ...makeSceneGenerationExtra(scene, sceneTraceId, 'assistant'),
              ...(customerTraceId && scene.kind
                ? makeCustomerGenerationExtra(customerTraceId, scene.kind, scene.speaker, '', 'assistant')
                : {}),
              ...(waiterTraceId ? makeWaiterGenerationExtra(waiterTraceId, waiterAssignmentId, 'assistant') : {}),
            },
          },
        ],
        { insert_before: 'end', refresh: 'none' },
      );
      const createdLastId = getLastMessageId();
      await setChatMessages([{ message_id: createdLastId, data: newMvuData }], { refresh: 'none' });
      await setChatMessages([{ message_id: createdLastId - 1 }, { message_id: createdLastId }], {
        refresh: 'affected',
      });
      chatHistoryVersion.value += 1;
      props.services.log.info('楼层诊断', '现场互动楼层已创建', {
        sceneTraceId,
        userMessageId: createdLastId - 1,
        assistantMessageId: createdLastId,
        messages: getChatMessages(`${Math.max(0, createdLastId - 1)}-${createdLastId}`, { include_swipes: true }),
      });
      props.services.log.info('AIRP解析', '现场回复显示文本已整理', {
        usedContentTag: parsedMessage.usedContentTag,
        timeText: parsedMessage.timeText,
        dialoguePages: parsedMessage.dialoguePages.length,
      });
      if (scene.mode === '老板') {
        const statData = _.get(newMvuData, 'stat_data');
        await saveActiveBossMvuBlocks('现场互动完成', isRecord(statData) ? statData : undefined);
      }
      if (scene.mode === '游客') {
        const messageIds = findCreatedCustomerGenerationMessageIds(customerTraceId);
        const statData = _.get(newMvuData, 'stat_data');
        await saveActiveCustomerMvuBlocks(
          '现场互动完成',
          isRecord(statData) ? statData : await props.services.mvuRuntime.readCurrentStatData(),
        );
        if (parsedMessage.timeText) {
          customerState.value = applyCustomerTimeText(customerState.value, parsedMessage.timeText);
          await syncCustomerMvuSnapshot();
        }
        if (scene.kind) {
          registerCustomerGenerationLink({
            version: 1,
            traceId: customerTraceId,
            kind: scene.kind,
            outputMode: resolveAirpOutputMode(scene),
            speaker: scene.speaker,
            contactName: '',
            ...messageIds,
            contactUserMessageId: '',
            contactReplyMessageId: '',
          });
        }
      }
      if (scene.mode === '服务员') {
        const messageIds = findCreatedWaiterGenerationMessageIds(waiterTraceId);
        const statData = _.get(newMvuData, 'stat_data');
        await saveActiveWaiterMvuBlocks(
          '现场互动完成',
          isRecord(statData) ? statData : await props.services.mvuRuntime.readCurrentStatData(),
        );
        if (parsedMessage.timeText) {
          waiterState.value = applyWaiterTimeText(waiterState.value, parsedMessage.timeText);
          await refreshActiveWaiterMvuBlocks('现场时间更新');
        }
        if (waiterTraceId && waiterAssignmentId) {
          waiterGenerationLinks.value = normalizeWaiterGenerationLinks([
            ...waiterGenerationLinks.value,
            {
              version: 1,
              traceId: waiterTraceId,
              assignmentId: waiterAssignmentId,
              ...messageIds,
            },
          ]);
        }
      }
      await refreshActiveAirpSceneRuntime(
        '现场互动结果刷新',
        isRecord(_.get(newMvuData, 'stat_data'))
          ? (_.get(newMvuData, 'stat_data') as Record<string, unknown>)
          : undefined,
      );
      applyScenePresentation(scene, parsedMessage, '现场互动完成');
      airpInput.value = '';
      writeUiMemorySnapshot('现场互动完成');
      await props.services.zeroLock.mirrorNow('现场互动完成');
      props.services.beautifier.applyNow('现场互动完成');
      showToast('Đã sinh');
      generated = true;
    });
  } finally {
    airpSubmitting.value = false;
    writeUiMemorySnapshot('现场互动结束');
  }
  if (generated) {
    sceneHasUnsavedAiInteraction = true;
    markAutoSaveDirty('有效AI现场互动');
  }
}

async function undoLatestSceneGeneration() {
  const scene = airpState.value;
  const pair = findLatestSceneGenerationPair(scene);
  if (!scene || !pair || airpSubmitting.value) {
    showToast('Hiện trường hiện tại không có phản hồi nào để lùi lại');
    return;
  }
  if (!(await confirmAction('Xác nhận thu hồi lượt nhập và phản hồi gần nhất chứ?', 'Lùi lại hiện trường'))) {
    return;
  }
  let changed = false;
  await runAction('回退现场', async () => {
    props.services.log.info('楼层诊断', '准备删除现场生成楼层', {
      traceId: pair.traceId,
      userMessage: pair.userMessage,
      assistantMessage: pair.assistantMessage,
    });
    await deleteChatMessages([pair.userMessage.message_id, pair.assistantMessage.message_id], { refresh: 'affected' });
    chatHistoryVersion.value += 1;
    if (scene.mode === '老板') {
      await syncBossMvuFromLatestMessage('前端回退');
    } else if (scene.mode === '游客') {
      await syncCustomerGeneratedResults(
        '前端回退',
        pair.assistantMessage.message_id,
        pair.assistantMessage.message_id,
      );
    } else {
      await syncWaiterGeneratedResults('前端回退', pair.assistantMessage.message_id, true);
    }
    syncScenePresentationFromLatestMessage('前端回退');
    writeUiMemorySnapshot('前端回退');
    await props.services.zeroLock.mirrorNow('前端回退');
    props.services.beautifier.applyNow('前端回退');
    showToast('Đã lùi lại tương tác hiện trường gần nhất');
    changed = true;
  });
  if (changed) markAutoSaveDirty('回退现场楼层');
}

async function rerollLatestSceneGeneration() {
  const scene = airpState.value;
  const pair = findLatestSceneGenerationPair(scene);
  if (!scene || !pair || pair.assistantMessage.message_id !== getLastMessageId() || airpSubmitting.value) {
    showToast('Hiện trường hiện tại không có phản hồi cuối để Roll lại');
    return;
  }
  const userText = getSceneMessageText(pair.userMessage).trim();
  const oldMvuData = getSceneMessageMvuData(pair.userMessage);
  if (!userText || !oldMvuData) {
    showToast('Không tìm thấy bản ghi vòng trước, đã dừng Roll lại');
    return;
  }

  let generated = false;
  airpSubmitting.value = true;
  try {
    await runAction('重 Roll', async () => {
      const generation = await requestSceneGeneration(scene, userText, oldMvuData, '前端重 Roll', {
        inputBoxValue: getSceneMessageText(pair.userMessage),
        inputSource: 'reroll-user-floor',
        beforeMessageId: pair.userMessage.message_id,
      });
      let newMvuData = generation.newMvuData;
      const statData = _.get(newMvuData, 'stat_data');
      if (isRecord(statData)) {
        if (scene.mode === '老板') {
          const applied = applyBossStatDataToState(bossState.value, mvuBlockStore.value, statData, true);
          bossState.value = applied.state;
          mvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        } else if (scene.mode === '游客') {
          const applied = applyCustomerStatDataToState(
            customerState.value,
            customerMvuBlockStore.value,
            statData,
            true,
          );
          customerState.value = applied.state;
          customerMvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        } else {
          const applied = applyWaiterStatDataToState(waiterState.value, waiterMvuBlockStore.value, statData, true);
          waiterState.value = applied.state;
          waiterMvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        }
      }

      const assignmentId = scene.waiterBlockContext?.assignmentId ?? '';
      const mergedExtra = {
        ...makeSceneGenerationExtra(scene, pair.traceId, 'assistant'),
        ...(scene.mode === '游客' && scene.kind
          ? makeCustomerGenerationExtra(pair.traceId, scene.kind, scene.speaker, '', 'assistant')
          : {}),
        ...(scene.mode === '服务员' && assignmentId
          ? makeWaiterGenerationExtra(pair.traceId, assignmentId, 'assistant')
          : {}),
      };
      const existingSwipes =
        pair.assistantMessage.swipes.length > 0
          ? [...pair.assistantMessage.swipes]
          : [getSceneMessageText(pair.assistantMessage)];
      const existingData = [...pair.assistantMessage.swipes_data];
      const existingInfo = [...pair.assistantMessage.swipes_info];
      while (existingData.length < existingSwipes.length) existingData.push({});
      while (existingInfo.length < existingSwipes.length) existingInfo.push({});
      const newSwipeId = existingSwipes.length;
      const nextSwipes = [...existingSwipes, generation.parsedMessage.displayText];
      const nextData = [...existingData, newMvuData];
      const nextInfo = [...existingInfo, { ...mergedExtra, extra: mergedExtra, data: newMvuData }];
      await setChatMessages(
        [
          {
            message_id: pair.assistantMessage.message_id,
            swipes: nextSwipes,
          },
        ],
        { refresh: 'none' },
      );
      await setChatMessages(
        [
          {
            message_id: pair.assistantMessage.message_id,
            swipes_data: nextData,
            swipes_info: nextInfo,
          },
        ],
        { refresh: 'none' },
      );
      await setChatMessages([{ message_id: pair.assistantMessage.message_id, swipe_id: newSwipeId }], {
        refresh: 'affected',
      });
      chatHistoryVersion.value += 1;
      props.services.log.info('楼层诊断', '重 Roll 已追加真实消息页', {
        traceId: pair.traceId,
        assistantMessageId: pair.assistantMessage.message_id,
        newSwipeId,
        swipeCount: nextSwipes.length,
        activeMessage: getChatMessages(pair.assistantMessage.message_id, { include_swipes: true })[0],
      });

      if (scene.mode === '老板') {
        await saveActiveBossMvuBlocks(
          '重 Roll 完成',
          isRecord(_.get(newMvuData, 'stat_data')) ? _.get(newMvuData, 'stat_data') : undefined,
        );
        await syncBossMvuFromLatestMessage('前端重 Roll');
      } else if (scene.mode === '游客') {
        await saveActiveCustomerMvuBlocks(
          '重 Roll 完成',
          isRecord(_.get(newMvuData, 'stat_data')) ? _.get(newMvuData, 'stat_data') : undefined,
        );
        await syncCustomerGeneratedResults('前端重 Roll', pair.assistantMessage.message_id);
      } else {
        await saveActiveWaiterMvuBlocks(
          '重 Roll 完成',
          isRecord(_.get(newMvuData, 'stat_data')) ? _.get(newMvuData, 'stat_data') : undefined,
        );
        await syncWaiterGeneratedResults('前端重 Roll', null, true);
      }
      applyScenePresentation(scene, generation.parsedMessage, '前端重 Roll');
      await refreshActiveAirpSceneRuntime(
        '前端重 Roll',
        isRecord(_.get(newMvuData, 'stat_data'))
          ? (_.get(newMvuData, 'stat_data') as Record<string, unknown>)
          : undefined,
      );
      writeUiMemorySnapshot('前端重 Roll');
      await props.services.zeroLock.mirrorNow('前端重 Roll');
      props.services.beautifier.applyNow('前端重 Roll');
      showToast(`Đã chuyển sang phản hồi thứ ${newSwipeId + 1}`);
      generated = true;
    });
  } finally {
    airpSubmitting.value = false;
    writeUiMemorySnapshot('重 Roll 结束');
  }
  if (generated) {
    sceneHasUnsavedAiInteraction = true;
    markAutoSaveDirty('重 Roll现场回复');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function extractSavedBossState(data: Record<string, unknown>): BossPageState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return null;
  }
  return normalizeBossPageState(frontendData['老板页面']);
}

function extractSavedMvuBlockStore(data: Record<string, unknown>): TangquanMvuBlockStore {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return makeMvuBlockStore();
  }
  return normalizeMvuBlockStore(frontendData['变量块仓库']);
}

function extractSavedCustomerState(data: Record<string, unknown>): CustomerPageState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return null;
  }
  return normalizeCustomerPageState(frontendData['游客页面']);
}

function extractSavedCustomerMvuBlockStore(data: Record<string, unknown>): CustomerMvuBlockStore {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return makeCustomerMvuBlockStore();
  }
  return normalizeCustomerMvuBlockStore(frontendData['游客变量块仓库']);
}

function extractSavedWaiterState(data: Record<string, unknown>): WaiterPageState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return null;
  }
  return normalizeWaiterPageState(frontendData['服务员页面']);
}

function extractSavedWaiterMvuBlockStore(data: Record<string, unknown>): WaiterMvuBlockStore {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return makeWaiterMvuBlockStore();
  }
  return normalizeWaiterMvuBlockStore(frontendData['服务员变量块仓库']);
}

function normalizeSavedAirpState(value: unknown): AirpSceneState | null {
  if (
    !isRecord(value) ||
    !['老板', '游客', '服务员'].includes(String(value.mode)) ||
    typeof value.title !== 'string' ||
    typeof value.note !== 'string' ||
    typeof value.speaker !== 'string' ||
    typeof value.line !== 'string' ||
    typeof value.placeholder !== 'string' ||
    !isRecord(value.scene) ||
    !Array.isArray(value.entryIds) ||
    !value.entryIds.every(item => typeof item === 'string')
  ) {
    return null;
  }
  const scene = _.cloneDeep(value) as AirpSceneState;
  scene.participants = _.uniq(
    [
      ...(Array.isArray(value.participants)
        ? value.participants.filter((name): name is string => typeof name === 'string')
        : []),
      scene.speaker,
    ]
      .map(name => name.trim())
      .filter(Boolean),
  );
  scene.participantIds = Array.isArray(value.participantIds)
    ? value.participantIds.filter((id): id is string => typeof id === 'string')
    : [];
  return prepareAirpSceneIdentity(scene, false);
}

function extractSavedCustomerUiState(data: Record<string, unknown>): CustomerUiSaveState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return null;
  }
  const value = frontendData['游客界面状态'];
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }
  const view = CUSTOMER_MENU_VIEWS.includes(value.view as CustomerMenuView)
    ? (value.view as CustomerMenuView)
    : 'today';
  return {
    version: 1,
    view,
    menuOpen: Boolean(value.menuOpen),
    selectedEmployee: typeof value.selectedEmployee === 'string' ? value.selectedEmployee : '',
    selectedProject: typeof value.selectedProject === 'string' ? value.selectedProject : '',
    selectedContact: typeof value.selectedContact === 'string' ? value.selectedContact : '',
    inviteSelection: Array.isArray(value.inviteSelection)
      ? value.inviteSelection.filter((name): name is string => typeof name === 'string').slice(0, 4)
      : [],
    storyOpen: Boolean(value.storyOpen),
    airpState: normalizeSavedAirpState(value.airpState),
    airpInput: typeof value.airpInput === 'string' ? value.airpInput : '',
    generationLinks: normalizeCustomerGenerationLinks(value.generationLinks),
    contactOutputMode: value.contactOutputMode === 'story' ? 'story' : 'dialogue',
  };
}

function makeCurrentCustomerUiSaveState(): CustomerUiSaveState {
  return {
    version: 1,
    view: customerView.value,
    menuOpen: customerMenuOpen.value,
    selectedEmployee: customerSelectedEmployee.value,
    selectedProject: customerSelectedProject.value,
    selectedContact: customerSelectedContact.value,
    inviteSelection: [...customerInviteSelection.value],
    storyOpen: customerStoryOpen.value,
    airpState: airpState.value ? _.cloneDeep(airpState.value) : null,
    airpInput: airpInput.value,
    generationLinks: _.cloneDeep(customerGenerationLinks.value),
    contactOutputMode: customerContactOutputMode.value,
  };
}

function extractSavedWaiterUiState(data: Record<string, unknown>): WaiterUiSaveState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return null;
  }
  const value = frontendData['服务员界面状态'];
  if (!isRecord(value) || value.version !== 1) {
    return null;
  }
  const view = WAITER_MENU_VIEWS.includes(value.view as WaiterMenuView) ? (value.view as WaiterMenuView) : 'shift';
  return {
    version: 1,
    view,
    menuOpen: Boolean(value.menuOpen),
    selectedAssignmentId: typeof value.selectedAssignmentId === 'string' ? value.selectedAssignmentId : '',
    airpState: normalizeSavedAirpState(value.airpState),
    airpInput: typeof value.airpInput === 'string' ? value.airpInput : '',
    generationLinks: normalizeWaiterGenerationLinks(value.generationLinks),
  };
}

function extractSavedTutorialProgress(data: Record<string, unknown>, mode: Mode): TutorialProgress {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) {
    return makeTutorialProgress(mode);
  }
  return normalizeTutorialProgress(frontendData['新手教程'], mode);
}

function makeCurrentWaiterUiSaveState(): WaiterUiSaveState {
  return {
    version: 1,
    view: waiterView.value,
    menuOpen: waiterMenuOpen.value,
    selectedAssignmentId: waiterSelectedAssignmentId.value,
    airpState: airpState.value?.mode === '服务员' ? _.cloneDeep(airpState.value) : null,
    airpInput: airpState.value?.mode === '服务员' ? airpInput.value : '',
    generationLinks: _.cloneDeep(waiterGenerationLinks.value),
  };
}

function extractSavedBossUiState(data: Record<string, unknown>): BossUiSaveState | null {
  const frontendData = data['前端数据'];
  if (!isRecord(frontendData)) return null;
  const value = frontendData['老板界面状态'];
  if (!isRecord(value) || value.version !== 1) return null;
  const view = bossTabs.some(item => item.key === value.view) ? (value.view as BossMenuView) : 'overview';
  return {
    version: 1,
    view,
    menuOpen: Boolean(value.menuOpen),
    airpState: normalizeSavedAirpState(value.airpState),
    airpInput: typeof value.airpInput === 'string' ? value.airpInput : '',
  };
}

function makeCurrentBossUiSaveState(): BossUiSaveState {
  return {
    version: 1,
    view: bossView.value,
    menuOpen: bossMenuOpen.value,
    airpState: airpState.value?.mode === '老板' ? _.cloneDeep(airpState.value) : null,
    airpInput: airpState.value?.mode === '老板' ? airpInput.value : '',
  };
}

function resetBossPageState(
  nextState: BossPageState = makeBossPageState(),
  nextMvuBlockStore: TangquanMvuBlockStore = makeMvuBlockStore(),
  nextUiState: BossUiSaveState | null = null,
) {
  bossState.value = recalculateBossState(nextState);
  mvuBlockStore.value = cloneMvuBlockStore(nextMvuBlockStore);
  bossView.value = nextUiState?.view ?? 'overview';
  bossMenuOpen.value = Boolean(nextUiState?.menuOpen);
  bossActiveShift.value = null;
  airpState.value = nextUiState?.airpState ? _.cloneDeep(nextUiState.airpState) : null;
  airpInput.value = nextUiState?.airpInput ?? '';
  resetScenePresentation(airpState.value);
  activeTemporaryEntryIds.value = airpState.value ? [...airpState.value.entryIds] : [];
  setBossLine(bossUserName.value, 'Cửa tiệm đã bật đèn, việc kinh doanh, xếp ca và tương tác hiện trường hôm nay sẽ tiếp tục từ đây.');
  writeUiMemorySnapshot('重置老板页面');
}

function resetCustomerPageState(
  nextState: CustomerPageState = makeCustomerPageState(),
  nextMvuBlockStore: CustomerMvuBlockStore = makeCustomerMvuBlockStore(),
  nextUiState: CustomerUiSaveState | null = null,
) {
  customerState.value = setCustomerFemaleUser(
    normalizeCustomerPageState(nextState),
    activeUserGenderKey.value === '女',
  );
  customerMvuBlockStore.value = cloneCustomerMvuBlockStore(nextMvuBlockStore);
  customerView.value = nextUiState?.view ?? 'today';
  customerMenuOpen.value = Boolean(nextUiState?.menuOpen);
  customerSelectedEmployee.value = customerState.value.员工[nextUiState?.selectedEmployee ?? '']
    ? (nextUiState?.selectedEmployee ?? '')
    : (getCustomerCurrentEmployee(customerState.value)?.姓名 ?? '');
  customerSelectedProject.value = customerState.value.项目[nextUiState?.selectedProject ?? '']
    ? (nextUiState?.selectedProject ?? '')
    : (Object.keys(customerState.value.项目)[0] ?? '');
  customerSelectedContact.value = customerState.value.联系人[nextUiState?.selectedContact ?? '']
    ? (nextUiState?.selectedContact ?? '')
    : (Object.keys(customerState.value.联系人)[0] ?? '');
  customerInviteSelection.value = (nextUiState?.inviteSelection ?? [])
    .filter(name => Boolean(customerState.value.联系人[name]))
    .slice(0, 4);
  customerStoryOpen.value = Boolean(nextUiState?.storyOpen && customerState.value.对话.最近正文);
  customerGenerationLinks.value = normalizeCustomerGenerationLinks(nextUiState?.generationLinks);
  customerContactOutputMode.value = nextUiState?.contactOutputMode ?? 'dialogue';
  airpState.value = nextUiState?.airpState ? _.cloneDeep(nextUiState.airpState) : null;
  airpInput.value = nextUiState?.airpInput ?? '';
  resetScenePresentation(airpState.value);
  activeTemporaryEntryIds.value = airpState.value ? [...airpState.value.entryIds] : [];
  writeUiMemorySnapshot('重置游客页面');
}

function resetWaiterPageState(
  nextState: WaiterPageState = makeWaiterPageState(),
  nextMvuBlockStore: WaiterMvuBlockStore = makeWaiterMvuBlockStore(),
  nextUiState: WaiterUiSaveState | null = null,
) {
  waiterState.value = normalizeWaiterPageState(nextState);
  waiterMvuBlockStore.value = cloneWaiterMvuBlockStore(nextMvuBlockStore);
  waiterGenerationLinks.value = normalizeWaiterGenerationLinks(nextUiState?.generationLinks);
  waiterView.value = nextUiState?.view ?? 'shift';
  waiterMenuOpen.value = Boolean(nextUiState?.menuOpen);
  waiterSelectedAssignmentId.value = waiterState.value.assignments.some(
    item => item.id === nextUiState?.selectedAssignmentId,
  )
    ? (nextUiState?.selectedAssignmentId ?? '')
    : (waiterState.value.assignments.find(item => item.status === '待接待')?.id ??
      waiterState.value.assignments[0]?.id ??
      '');
  airpState.value = nextUiState?.airpState ? _.cloneDeep(nextUiState.airpState) : null;
  airpInput.value = nextUiState?.airpInput ?? '';
  resetScenePresentation(airpState.value);
  activeTemporaryEntryIds.value = airpState.value ? [...airpState.value.entryIds] : [];
  writeUiMemorySnapshot('重置服务员页面');
}

function extractSavedUserGenderKey(data: Record<string, unknown>): TangquanUserGenderKey {
  const userInfo = isRecord(data['用户信息']) ? data['用户信息'] : null;
  const value = userInfo?.性别选项;
  return profileGenderOptions.some(option => option.key === value) ? (value as TangquanUserGenderKey) : '男';
}

function extractSavedUserName(data: Record<string, unknown>): string {
  const userInfo = isRecord(data['用户信息']) ? data['用户信息'] : null;
  return typeof userInfo?.姓名 === 'string' && userInfo.姓名.trim() ? userInfo.姓名.trim() : '店长';
}

function applyLoadedSaveToPlayView(loaded: TangquanLoadedSave) {
  if (loaded.meta.mode === '未选择') {
    return;
  }
  activeMode.value = loaded.meta.mode;
  selectedMode.value = loaded.meta.mode;
  tutorialProgress.value = extractSavedTutorialProgress(loaded.payload.data, loaded.meta.mode);
  activeUserName.value = extractSavedUserName(loaded.payload.data);
  activeUserGenderKey.value = extractSavedUserGenderKey(loaded.payload.data);
  if (SAVE_SLOT_IDS.includes(loaded.meta.slotId)) {
    selectedSlotId.value = loaded.meta.slotId;
  }
  if (loaded.meta.mode === '老板') {
    const savedBossState =
      extractSavedBossState(loaded.payload.data) ?? makeBossPageState(activeUserGenderKey.value === '女');
    resetBossPageState(
      setBossRecruitmentFemaleUser(savedBossState, activeUserGenderKey.value === '女'),
      extractSavedMvuBlockStore(loaded.payload.data),
      extractSavedBossUiState(loaded.payload.data),
    );
  } else if (loaded.meta.mode === '游客') {
    resetCustomerPageState(
      extractSavedCustomerState(loaded.payload.data) ??
        makeCustomerPageState(new Date(), activeUserGenderKey.value === '女'),
      extractSavedCustomerMvuBlockStore(loaded.payload.data),
      extractSavedCustomerUiState(loaded.payload.data),
    );
  } else if (loaded.meta.mode === '服务员') {
    resetWaiterPageState(
      extractSavedWaiterState(loaded.payload.data) ?? makeWaiterPageState(),
      extractSavedWaiterMvuBlockStore(loaded.payload.data),
      extractSavedWaiterUiState(loaded.payload.data),
    );
  }
  currentSlotLabel.value = loaded.meta.label;
  activePage.value = 'play';
  activePanel.value = 'landing';
  savePanelContext.value = 'title';
  writeUiMemorySnapshot('载入存档显示');
}

function makeCurrentSaveDataPatch(): Record<string, unknown> {
  if (activeMode.value === '老板') {
    return {
      前端数据: {
        老板页面: cloneBossPageState(bossState.value),
        变量块仓库: cloneMvuBlockStore(mvuBlockStore.value),
        老板界面状态: makeCurrentBossUiSaveState(),
        新手教程: _.cloneDeep(tutorialProgress.value),
      },
    };
  }
  if (activeMode.value === '游客') {
    return {
      前端数据: {
        游客页面: cloneCustomerPageState(customerState.value),
        游客变量块仓库: cloneCustomerMvuBlockStore(customerMvuBlockStore.value),
        游客界面状态: makeCurrentCustomerUiSaveState(),
        新手教程: _.cloneDeep(tutorialProgress.value),
      },
    };
  }
  if (activeMode.value === '服务员') {
    return {
      前端数据: {
        服务员页面: cloneWaiterPageState(waiterState.value),
        服务员变量块仓库: cloneWaiterMvuBlockStore(waiterMvuBlockStore.value),
        服务员界面状态: makeCurrentWaiterUiSaveState(),
        新手教程: _.cloneDeep(tutorialProgress.value),
      },
    };
  }
  return {};
}

async function runBossMutation(
  label: string,
  mutate: () => { ok: boolean; message: string; state: BossPageState },
  onSuccess?: () => void | Promise<void>,
): Promise<boolean> {
  let changed = false;
  await runAction(label, async () => {
    const result = mutate();
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    bossState.value = result.state;
    changed = true;
    await refreshActiveBossMvuBlocks(label);
    await onSuccess?.();
    showToast(result.message);
  });
  if (changed) markAutoSaveDirty(label);
  return changed;
}

async function selectBossHostessAction(characterId: string) {
  let completed = false;
  await runAction('选择看板娘', async () => {
    const result = selectBossHostess(bossState.value, characterId);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    bossState.value = result.state;
    completed = true;
    await syncBossMvuSnapshot();
    setBossLine(result.state.看板娘.姓名, `"Từ hôm nay, tôi sẽ với tư cách Linh vật đại diện cùng ông chăm sóc nơi này."`);
    completeTutorialAction('boss-select-hostess');
    showToast(result.message);
  });
  if (!completed) return;
  markAutoSaveDirty('选择看板娘');
  await requestAutoSave('选择看板娘完成', true);
}

function openBossMenu(view: BossMenuView = bossView.value) {
  if (view === 'recruit') {
    bossState.value = refreshBossRecruitmentByRealTime(bossState.value, Date.now());
  }
  if (view === 'market') void ensureBossAiTalentMarketReady();
  bossView.value = view;
  bossMenuOpen.value = true;
  if (view === 'facilities' && !bossBuildingViewInitialized.value) {
    void nextTick(resetBossBuildingView);
  }
  writeUiMemorySnapshot('打开老板菜单');
  const tutorialActions: Partial<Record<BossMenuView, TutorialAction>> = {
    employees: 'boss-open-employees',
    schedule: 'boss-open-schedule',
    overview: 'boss-open-overview',
    recruit: 'boss-open-recruit',
    facilities: 'boss-open-facilities',
    settlement: 'boss-open-settlement',
  };
  const tutorialAction = tutorialActions[view];
  if (tutorialAction) completeTutorialAction(tutorialAction);
}

function closeBossMenu() {
  bossMenuOpen.value = false;
  writeUiMemorySnapshot('关闭老板菜单');
  completeTutorialAction('boss-close-menu');
}

function findBossEmployee(name: string): BossEmployee | null {
  return bossState.value.员工.find(employee => employee.姓名 === name) ?? null;
}

function makeBossEmployeeAiSceneIdentity(employee: BossEmployee): Partial<AirpSceneState> {
  const characterId = employee.角色ID?.trim() ?? '';
  if (!/^ai-market-[a-z0-9-]{8,70}$/.test(characterId)) return {};
  return {
    speakerId: characterId,
    participantIds: [characterId],
    characterId,
    suppressCharacterStanding: true,
  };
}

function makeBossEmployeeProfileEntryIds(employee: BossEmployee): string[] {
  const characterId = employee.角色ID?.trim() ?? '';
  return /^ai-market-[a-z0-9-]{8,70}$/.test(characterId) ? [`character.profile.${characterId}`] : [];
}

function findBossArea(name: string) {
  return bossState.value.区域.find(area => area.名称 === name) ?? null;
}

function findBossProjectByArea(name: string) {
  return bossState.value.项目.find(project => project.名称 === name || project.设施需求 === name) ?? null;
}

function getBossBuiltLevel(buildingId: string): number {
  return bossState.value.建筑.find(building => building.id === buildingId)?.等级 ?? 0;
}

function resolveBossBuildingNameForArea(areaName: string): string {
  return TANGQUAN_AREA_TO_BUILDING[areaName] ?? areaName;
}

function findBossBuildingByName(name: string): BossBuildingCatalogItem | null {
  const buildingName = resolveBossBuildingNameForArea(name);
  return getBossBuildingCatalog(bossState.value).find(building => building.名称 === buildingName) ?? null;
}

function makeBossInfrastructureWorldbookEntryIds(requirements: Partial<Record<BossInfrastructureKey, number>>) {
  return (Object.keys(requirements) as BossInfrastructureKey[])
    .map(key => {
      const currentLevel = bossState.value.基建[key];
      return currentLevel > 0 ? makeTangquanInfrastructureEntryId(key, currentLevel) : '';
    })
    .filter(Boolean);
}

function makeBossBuildingWorldbookEntryIds(building: BossBuildingCatalogItem | null): string[] {
  if (!building) {
    return [];
  }
  const builtLevel = getBossBuiltLevel(building.id);
  const ids = makeBossInfrastructureWorldbookEntryIds(building.条件);
  if (builtLevel > 0) {
    ids.push(makeTangquanBuildingEntryId(building.名称, builtLevel));
  }
  return _.uniq(ids);
}

function makeBossAreaWorldbookEntryIds(areaName: string): string[] {
  const building = findBossBuildingByName(areaName);
  if (building) {
    return makeBossBuildingWorldbookEntryIds(building);
  }
  const infrastructureName = areaName as BossInfrastructureKey;
  if (Object.prototype.hasOwnProperty.call(bossState.value.基建, infrastructureName)) {
    return makeBossInfrastructureWorldbookEntryIds({ [infrastructureName]: bossState.value.基建[infrastructureName] });
  }
  return [];
}

function makeBossProjectWorldbookEntryIds(project: BossProject | null): string[] {
  if (!project) {
    return [];
  }
  const buildingName = TANGQUAN_PROJECT_TO_BUILDING[project.名称];
  const buildingIds = buildingName ? makeBossBuildingWorldbookEntryIds(findBossBuildingByName(buildingName)) : [];
  return _.uniq([makeTangquanProjectEntryId(project.名称), ...buildingIds]);
}

function makeBossAreaEntryContentMap(areaName: string): Record<string, string> {
  const area = findBossArea(areaName);
  return area ? { 'area.current': makeAreaEntryContent(area) } : {};
}

function makeBossEmployeeEntryContentMap(employee: BossEmployee): Record<string, string> {
  return {
    ...makeBossAreaEntryContentMap(employee.区域),
    'character.current-employee': makeEmployeeEntryContent(employee),
  };
}

function makeBossServiceEntryContentMap(
  employee: BossEmployee,
  nomination?: BossPageState['指名'][number],
): Record<string, string> {
  const contentMap = makeBossEmployeeEntryContentMap(employee);
  if (nomination) {
    contentMap['character.current-guest'] = makeGuestEntryContent(nomination);
    const project = findBossProjectByArea(nomination.区域);
    if (project) {
      contentMap['project.current'] = makeProjectEntryContent(project);
    }
  }
  return contentMap;
}

function isBossShiftSelected(name: string, index: number) {
  return bossActiveShift.value?.name === name && bossActiveShift.value.index === index;
}

function selectBossShift(name: string, index: number) {
  bossActiveShift.value = { name, index };
  writeUiMemorySnapshot('选择排班格');
  if (name === bossState.value.看板娘.姓名 && index === 0) completeTutorialAction('boss-select-shift');
}

function setBossShiftOption(choice: string) {
  if (!bossActiveShift.value) {
    return;
  }
  const employee = findBossEmployee(bossActiveShift.value.name);
  if (!employee) {
    return;
  }
  employee.排班[bossActiveShift.value.index] = choice;
  writeUiMemorySnapshot('修改排班格');
  markAutoSaveDirty('修改老板排班');
}

function inspectLatestAiTimeForBossSchedule() {
  const lastMessageId = getLastMessageId();
  const latestAssistant =
    lastMessageId >= 0
      ? getChatMessages(`0-${lastMessageId}`, { role: 'assistant', include_swipes: true }).at(-1)
      : undefined;
  if (!latestAssistant) {
    return {
      exists: false,
      messageId: null,
      timeText: '',
    };
  }
  const parsed = parseTangquanAiMessage(getSceneMessageText(latestAssistant));
  return {
    exists: Boolean(parsed.timeText.trim()),
    messageId: latestAssistant.message_id,
    timeText: parsed.timeText,
  };
}

function makeBossScheduleDiagnosticSnapshot(state: BossPageState, mvuData: Mvu.MvuData, phase: 'before' | 'after') {
  return {
    phase,
    date: state.日期,
    time: state.时间,
    schedules: state.员工.map(employee => ({
      id: employee.id,
      name: employee.姓名,
      schedule: [...employee.排班],
    })),
    employeeAreas: state.员工.map(employee => ({
      id: employee.id,
      name: employee.姓名,
      area: employee.区域,
      status: employee.状态,
    })),
    mvuCurrentTime: String(_.get(mvuData, 'stat_data.当前时间', '')),
    aiTimeParse: inspectLatestAiTimeForBossSchedule(),
    callChain: [
      '老板排班页“确定排班”按钮',
      'App.vue::confirmBossSchedule()',
      'runAction("确认排班")',
      'bossEconomy.ts::confirmBossScheduleState()',
      'App.vue::refreshActiveBossMvuBlocks()',
    ],
    runtimeStack: new Error('确认排班调用链').stack ?? '',
  };
}

async function confirmBossSchedule() {
  let confirmed = false;
  await runAction('确认排班', async () => {
    const beforeMvuData = _.cloneDeep(await readLatestMvuData());
    props.services.log.info(
      '排班诊断',
      '确认排班前状态',
      makeBossScheduleDiagnosticSnapshot(bossState.value, beforeMvuData, 'before'),
    );
    bossState.value = confirmBossScheduleState(bossState.value);
    await refreshActiveBossMvuBlocks('确认排班');
    const afterMvuData = _.cloneDeep(await readLatestMvuData());
    props.services.log.info(
      '排班诊断',
      '确认排班后状态',
      makeBossScheduleDiagnosticSnapshot(bossState.value, afterMvuData, 'after'),
    );
    showToast('Xếp ca đã được xác nhận');
    const employeeName = bossState.value.员工[0]?.姓名;
    setBossLine(
      employeeName || bossUserName.value,
      employeeName ? '"Xếp ca đã được xác nhận, tôi sẽ chuẩn bị theo sắp xếp mới."' : 'Xếp ca đã được xác nhận.',
    );
    confirmed = true;
  });
  if (confirmed) {
    markAutoSaveDirty('确认老板排班');
    completeTutorialAction('boss-confirm-schedule');
  }
}

async function goBossArea(areaName: string) {
  await runAction('前往区域', async () => {
    bossState.value.地点 = areaName;
    await replaceTemporaryEntries([], '前往区域');
    await deactivateBossMvuBlocks('前往区域');
    await props.services.mvuRuntime.clearInteractionScene('老板');
    setBossLine(bossCurrentStaff.value[0]?.姓名 || 'Nhân viên', `"Đây là ${areaName}, lượng khách hiện tại đã được cập nhật trong menu."`);
  });
  markAutoSaveDirty('老板前往区域');
}

async function goBossEmployee(name: string) {
  const employee = findBossEmployee(name);
  if (!employee) {
    return;
  }
  await runAction('前往员工所在区域', async () => {
    bossState.value.地点 = employee.区域;
    await replaceTemporaryEntries([], '前往员工所在区域');
    await deactivateBossMvuBlocks('前往员工所在区域');
    await props.services.mvuRuntime.clearInteractionScene('老板');
    setBossLine(employee.姓名, `"Thưa ông chủ, ông đã đến rồi. Bây giờ đây là ${employee.区域}."`);
  });
  markAutoSaveDirty('老板前往员工区域');
}

async function talkBossEmployee(name: string) {
  const employee = findBossEmployee(name);
  if (!employee) {
    showToast('Không tìm thấy nhân viên này');
    return;
  }
  await openAirpScene({
    mode: '老板',
    kind: 'dialogue',
    ...makeBossEmployeeAiSceneIdentity(employee),
    title: `Trò chuyện với ${employee.姓名}`,
    note: `${employee.区域} · Lương ngày ${yuan(employee.日薪)} · Hài lòng ${employee.满意度}`,
    speaker: employee.姓名,
    line: '"Bây giờ tôi tiện nói chuyện, anh/chị muốn hỏi về khách hôm nay, hay hỏi về xếp ca trước?"',
    placeholder: 'Nhập điều bạn muốn nói với nhân viên, hoặc nội dung bạn muốn hỏi, sắp xếp.',
    entryIds: [
      'area.current',
      'character.current-employee',
      ...makeBossEmployeeProfileEntryIds(employee),
      ...makeBossAreaWorldbookEntryIds(employee.区域),
    ],
    entryContentMap: makeBossEmployeeEntryContentMap(employee),
    blockIds: ['boss.overview', 'boss.area', 'boss.employee'],
    blockContext: {
      areaName: employee.区域,
      employeeName: employee.姓名,
    },
    scene: {
      地点: employee.区域,
      员工: {
        [employee.姓名]: {
          日薪: employee.日薪,
          当前安排: employee.区域,
          评级: employee.评级,
          评分: employee.评分,
          满意度: employee.满意度,
          疲劳: employee.疲劳,
        },
      },
    },
  });
}

async function raiseBossSalary(name: string) {
  await runBossMutation('Tăng lương ngày', () => raiseBossEmployeeSalary(bossState.value, name));
}

async function checkBossService(name: string) {
  const employee = findBossEmployee(name);
  if (!employee) {
    return;
  }
  bossState.value.地点 = employee.区域;
  const nomination = bossState.value.指名.find(item => item.员工 === employee.姓名 && item.剩余天数 > 0);
  const scene: Record<string, unknown> = {
    地点: employee.区域,
    员工: {
      [employee.姓名]: {
        当前状态: employee.状态,
        日薪: employee.日薪,
        当前安排: employee.区域,
        服务次数: employee.服务次数,
        指名次数: employee.指名次数,
        额外结果次数: employee.额外结果次数,
      },
    },
  };
  if (nomination) {
    scene.指名关系 = {
      [employee.姓名]: {
        客人: nomination.客人,
        指名剩余天数: nomination.剩余天数,
        当前项目: nomination.区域,
        员工个人收入预估: nomination.预计收入,
      },
    };
  }
  const project = nomination ? findBossProjectByArea(nomination.区域) : null;
  const entryIds = [
    'area.current',
    'character.current-employee',
    ...makeBossEmployeeProfileEntryIds(employee),
    ...makeBossAreaWorldbookEntryIds(employee.区域),
  ];
  if (nomination) {
    entryIds.push('character.current-guest');
  }
  if (project) {
    entryIds.push('project.current', ...makeBossProjectWorldbookEntryIds(project));
  }
  await openAirpScene({
    mode: '老板',
    kind: 'story',
    ...makeBossEmployeeAiSceneIdentity(employee),
    serviceId: nomination
      ? makeTangquanSceneEntityId('boss-service', `${employee.姓名}-${nomination.客人}-${nomination.区域}`)
      : makeTangquanSceneEntityId('boss-service', `${employee.姓名}-${employee.区域}`),
    projectId: project ? makeTangquanSceneEntityId('project', project.名称) : '',
    title: `Xem dịch vụ của ${employee.姓名}`,
    note: nomination ? `${nomination.客人} · Chỉ định còn lại ${nomination.剩余天数} ngày` : `${employee.区域} · Dịch vụ hiện tại`,
    speaker: employee.姓名,
    line: '"Tôi sẽ tiếp tục trông coi ở đây. Nếu anh/chị muốn tự mình quan sát, có thể bắt đầu từ đây."',
    placeholder: 'Nhập điều bạn muốn làm sau khi vào hiện trường, ví dụ quan sát, hỏi khách, nhắc nhở nhân viên hoặc tự mình can thiệp.',
    entryIds,
    entryContentMap: makeBossServiceEntryContentMap(employee, nomination),
    blockIds: nomination
      ? ['boss.area', 'boss.employee', 'boss.guest', 'boss.service']
      : ['boss.area', 'boss.employee', 'boss.service'],
    blockContext: {
      areaName: employee.区域,
      employeeName: employee.姓名,
    },
    scene,
  });
}

async function adjustBossProject(name: string, direction: 'up' | 'down') {
  const label = direction === 'up' ? 'Tăng giá' : 'Giảm giá';
  await runBossMutation(`${label} dự án`, () => adjustBossProjectPrice(bossState.value, name, direction));
}

async function investBossQuality(name: string) {
  if (!(await confirmAction(`Xác nhận đầu tư nguyên liệu và chuẩn bị tốt hơn cho ${name} chứ? Việc này sẽ tăng trải nghiệm ngắn hạn và ý muốn đặt dịch vụ.`, 'Đầu tư chất lượng'))) {
    return;
  }
  await runBossMutation('Đầu tư chất lượng', () => investBossProjectQuality(bossState.value, name));
}

function resolveBossAiBusinessPhase(businessDay = bossState.value.营业日): string {
  if (businessDay <= 30) return 'Giai đoạn khởi đầu';
  if (businessDay <= 90) return 'Giai đoạn tăng trưởng';
  return 'Giai đoạn ổn định';
}

function resolveBossAiShopLevel(): number {
  const levels = Object.entries(bossState.value.基建)
    .filter(([key]) => key !== '维护度')
    .map(([, value]) => Number(value))
    .filter(Number.isFinite);
  return Math.max(1, Math.round(levels.reduce((sum, value) => sum + value, 0) / Math.max(1, levels.length)));
}

function makeBossAiExcludedNames(additionalNames: string[] = []): string[] {
  return _.uniq(
    [
      ...listTangquanCharacters(true).map(character => character.name),
      ...bossState.value.员工.map(employee => employee.姓名),
      ...bossState.value.招聘.候选.map(candidate => candidate.姓名),
      ...bossState.value.人才市场.map(candidate => candidate.姓名),
      ...additionalNames,
    ]
      .map(name => name.trim())
      .filter(Boolean),
  );
}

function makeBossAiExcludedIds(additionalIds: string[] = []): string[] {
  return _.uniq(
    [
      ...listTangquanCharacters(true).map(character => character.id),
      ...bossState.value.员工.map(employee => employee.角色ID ?? ''),
      ...additionalIds,
    ]
      .map(id => id.trim())
      .filter(Boolean),
  );
}

function makeBossAiCandidatePromptInput(
  generatedEntries: Awaited<ReturnType<TangquanGameUiServices['worldbookRuntime']['listGeneratedCharacterEntries']>>,
): BossAiTalentCandidatePromptInput {
  const employeeCount = bossState.value.员工.length;
  return {
    task: 'generateAiTalentCandidates',
    date: bossState.value.日期,
    businessDay: bossState.value.营业日,
    businessPhase: resolveBossAiBusinessPhase(),
    shopLevel: resolveBossAiShopLevel(),
    shopRating: Math.round(Math.max(0, Math.min(5, bossState.value.店铺评分)) * 20),
    currentFunds: bossState.value.资金,
    recruitPressure: employeeCount < 3 ? '高' : employeeCount < 6 ? '中等' : '低',
    allowedProjects: [...TANGQUAN_PROJECT_NAMES],
    excludedNames: makeBossAiExcludedNames(
      generatedEntries.map(entry => entry.entryName.replace(/^\[未开之花\]\[AI角色\]\s*/, '')),
    ),
    excludedIds: makeBossAiExcludedIds(generatedEntries.map(entry => entry.candidateId)),
  };
}

async function requestBossAiTalentCandidates(
  input: BossAiTalentCandidatePromptInput,
): Promise<{ raw: string | null; issues: string[] }> {
  return enqueueAiGeneration('AI 人才市场每日候选', async () => {
    const restoreFormat = resolvePresetOutputFormat(airpState.value);
    const formatReady = await props.services.presetOutputFormat.setFormat('none', 'AI 人才市场每日候选：严格 JSON');
    if (!formatReady) return { raw: null, issues: ['AI 人才市场无法切换到 none 输出格式'] };
    let retryIssues: string[] = [];
    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const request = makeBossAiTalentCandidateGenerationRequest(input, retryIssues);
        const result = await generate({
          user_input: request.userInput,
          should_stream: false,
          should_silence: true,
          max_chat_history: 0,
          overrides: makeDailyGenerationOverrides(),
          injects: request.injects,
        });
        const raw = getGenerationText(result);
        const parsed = parseBossAiTalentCandidates(raw, {
          date: input.date,
          excludedNames: input.excludedNames,
          excludedIds: input.excludedIds,
          allowedProjects: input.allowedProjects,
        });
        props.services.log.info('AI人才市场', '每日候选解析完成', {
          attempt,
          ok: parsed.ok,
          issues: parsed.issues,
          candidateIds: parsed.candidates.map(candidate => candidate.id),
          raw,
        });
        if (parsed.ok) return { raw, issues: [] };
        retryIssues = parsed.issues;
      }
      return { raw: null, issues: retryIssues.length > 0 ? retryIssues : ['AI 候选连续两次校验失败'] };
    } catch (error) {
      props.services.log.error('AI人才市场', '每日候选生成失败，使用本地纯 NPC 兜底', { error: String(error) });
      return { raw: null, issues: [String(error)] };
    } finally {
      await props.services.presetOutputFormat.setFormat(restoreFormat, 'AI 人才市场每日候选：恢复现场输出');
    }
  });
}

async function requestBossAiTalentFullProfile(
  candidate: BossAiTalentCandidate,
  excludedNames: string[],
  excludedIds: string[],
): Promise<BossAiTalentFullProfile> {
  const input = makeBossAiTalentFullProfilePromptInput({
    candidate,
    businessDay: bossState.value.营业日,
    businessPhase: resolveBossAiBusinessPhase(),
    shopLevel: resolveBossAiShopLevel(),
    currentProjects: bossState.value.项目.map(project => project.名称),
    userName: activeUserName.value,
    userGender: activeUserGenderKey.value,
    excludedNames,
    excludedIds,
  });
  return enqueueAiGeneration(`AI 人才完整人设：${candidate.姓名}`, async () => {
    const restoreFormat = resolvePresetOutputFormat(airpState.value);
    const formatReady = await props.services.presetOutputFormat.setFormat('none', 'AI 人才完整人设：严格 JSON');
    if (!formatReady) throw new Error('AI 人才完整人设无法切换到 none 输出格式');
    let retryIssues: string[] = [];
    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const request = makeBossAiTalentFullProfileGenerationRequest(input, retryIssues);
        const result = await generate({
          user_input: request.userInput,
          should_stream: false,
          should_silence: true,
          max_chat_history: 0,
          overrides: makeDailyGenerationOverrides(),
          injects: request.injects,
        });
        const raw = getGenerationText(result);
        const parsed = parseBossAiTalentFullProfile(raw, { candidate, excludedNames });
        props.services.log.info('AI人才市场', '完整人设解析完成', {
          attempt,
          candidateId: candidate.id,
          ok: parsed.ok,
          issues: parsed.issues,
          entryId: parsed.value?.worldbook.entryId ?? '',
          raw,
        });
        if (parsed.ok && parsed.value) return parsed.value;
        retryIssues = parsed.issues;
      }
      throw new Error(`完整人设连续两次校验失败：${retryIssues.join('；')}`);
    } finally {
      await props.services.presetOutputFormat.setFormat(restoreFormat, 'AI 人才完整人设：恢复现场输出');
    }
  });
}

async function ensureBossAiTalentMarketReady() {
  if (bossState.value.AI人才市场.已尝试生成) return;
  let changed = false;
  await runAction('准备 AI 人才市场', async () => {
    const generatedEntries = await props.services.worldbookRuntime.listGeneratedCharacterEntries();
    const input = makeBossAiCandidatePromptInput(generatedEntries);
    const generated = await requestBossAiTalentCandidates(input);
    const next = cloneBossPageState(bossState.value);
    next.AI人才市场 = generated.raw
      ? applyBossAiTalentMarketResponse(next.AI人才市场, generated.raw, {
          excludedNames: input.excludedNames,
          excludedIds: input.excludedIds,
          allowedProjects: input.allowedProjects,
        })
      : markBossAiTalentMarketAttempted(next, generated.issues).AI人才市场;
    bossState.value = next;
    changed = true;
    showToast(generated.raw ? 'Chợ nhân tài đã sinh snapshot AI cố định trong ngày' : 'Đầu ra AI không hợp lệ, đã dùng snapshot NPC thuần cục bộ trong ngày');
  });
  if (!changed) return;
  markAutoSaveDirty('AI 人才市场当日快照');
  await requestAutoSave('AI 人才市场当日快照', true);
}

async function talkBossAiMarket(candidateId: string) {
  const candidate = bossState.value.AI人才市场.候选.find(item => item.id === candidateId);
  if (!candidate) {
    showToast('Không tìm thấy ứng viên này');
    return;
  }
  bossState.value.地点 = '办公室';
  const officeContentMap = makeBossAreaEntryContentMap('办公室');
  const officeEntryIds =
    Object.keys(officeContentMap).length > 0
      ? ['area.current', ...makeBossAreaWorldbookEntryIds('办公室')]
      : makeBossAreaWorldbookEntryIds('办公室');
  await openAirpScene({
    mode: '老板',
    kind: 'dialogue',
    serviceId: makeTangquanSceneEntityId('ai-market', candidate.id),
    speakerId: candidate.id,
    participantIds: [candidate.id],
    characterId: candidate.id,
    suppressCharacterStanding: true,
    title: `Giao lưu với ${candidate.姓名}`,
    note: `NPC thuần hạng ${candidate.评级} · Giá ký hợp đồng ${yuan(candidate.市场签约价格)}`,
    speaker: candidate.姓名,
    line: '"Nếu anh/chị muốn tìm hiểu về tôi, có thể hỏi trực tiếp."',
    placeholder: 'Nhập câu hỏi, điều kiện hoặc thăm dò bạn muốn giao lưu.',
    entryIds: officeEntryIds,
    entryContentMap: {
      ...officeContentMap,
    },
    blockIds: [],
    blockContext: {},
    scene: {
      地点: '办公室',
      候选人: {
        [candidate.姓名]: {
          ID: candidate.id,
          来源: 'AI人才市场',
          期望日薪: candidate.期望日薪,
          评级: candidate.评级,
          市场签约价格: candidate.市场签约价格,
          简介: candidate.经历简介,
        },
      },
    },
  });
}

async function signBossAiMarket(candidateId: string) {
  const candidate = bossState.value.AI人才市场.候选.find(item => item.id === candidateId);
  if (!candidate) {
    showToast('Không tìm thấy ứng viên này');
    return;
  }
  if (bossState.value.员工.some(employee => employee.姓名.trim() === candidate.姓名.trim())) {
    showToast('Danh sách đã có nhân viên trùng tên');
    return;
  }
  if (bossState.value.员工.some(employee => employee.角色ID === candidate.id)) {
    showToast('Danh sách đã có nhân viên trùng ID');
    return;
  }
  if (bossState.value.资金 < candidate.市场签约价格) {
    showToast('Không đủ tiền, chưa tiến hành ký hợp đồng');
    return;
  }
  if (
    !(await confirmAction(
      `Ký hợp đồng ${candidate.姓名} cần ${yuan(candidate.市场签约价格)}. Chỉ trừ tiền sau khi ghi hồ sơ nhân vật đầy đủ thành công, có tiếp tục không?`,
      'Ký hợp đồng chợ nhân tài',
    ))
  )
    return;
  const frozenCandidate = _.cloneDeep(candidate);
  let completed = false;
  let savedAt = '';
  await runAction(`签约 AI 人才 ${frozenCandidate.姓名}`, async () => {
    const entryId = `character.profile.${frozenCandidate.id}`;
    const initialInspection = await props.services.worldbookRuntime.inspectGeneratedCharacterEntry(entryId);
    if (initialInspection.exists) {
      showToast('Entry world book cùng ID đã tồn tại, không tiến hành ký hợp đồng trùng lặp');
      return;
    }
    const generatedEntries = await props.services.worldbookRuntime.listGeneratedCharacterEntries();
    const generatedNames = generatedEntries.map(entry => entry.entryName.replace(/^\[未开之花\]\[AI角色\]\s*/, ''));
    const excludedNames = makeBossAiExcludedNames(generatedNames);
    const excludedIds = makeBossAiExcludedIds(generatedEntries.map(entry => entry.candidateId));
    const fullProfile = await requestBossAiTalentFullProfile(frozenCandidate, excludedNames, excludedIds);

    const currentCandidate = bossState.value.AI人才市场.候选.find(item => item.id === frozenCandidate.id);
    if (!currentCandidate || currentCandidate.姓名 !== frozenCandidate.姓名) {
      throw new Error('签约候选在生成期间发生变化');
    }
    if (bossState.value.员工.some(employee => employee.姓名.trim() === frozenCandidate.姓名.trim())) {
      throw new Error('名册中已有同名员工');
    }
    if (bossState.value.员工.some(employee => employee.角色ID === frozenCandidate.id)) {
      throw new Error('名册中已有同 ID 员工');
    }
    if (bossState.value.资金 < frozenCandidate.市场签约价格) {
      throw new Error('资金不足');
    }
    const inspectionBeforeWrite = await props.services.worldbookRuntime.inspectGeneratedCharacterEntry(entryId);
    if (inspectionBeforeWrite.exists) throw new Error(`签约前发现重复世界书条目：${entryId}`);
    const stateBefore = cloneBossPageState(bossState.value);
    const blockStoreBefore = cloneMvuBlockStore(mvuBlockStore.value);
    const mvuBefore = await props.services.mvuRuntime.readCurrentStatData();
    const worldbookBefore = await props.services.worldbookRuntime.snapshot();
    try {
      await props.services.worldbookRuntime.createGeneratedCharacterEntry({
        entryId: fullProfile.worldbook.entryId,
        entryName: fullProfile.worldbook.entryName,
        candidateId: frozenCandidate.id,
        content: fullProfile.worldbook.content,
      });
      const signed = signBossAiTalentCandidate(bossState.value, frozenCandidate.id);
      if (!signed.ok) throw new Error(signed.message);
      bossState.value = signed.state;
      await refreshActiveBossMvuBlocks('AI 人才签约');
      const meta = await props.services.save.saveActiveData(makeCurrentSaveDataPatch());
      if (!meta) throw new Error('当前没有可写入的活动存档');
      savedAt = meta.updatedAt;
      completed = true;
      setBossLine(frozenCandidate.姓名, '"Thủ tục đã hoàn tất. Tiếp theo xin hãy cho tôi biết sắp xếp cụ thể."');
      showToast(`${frozenCandidate.姓名} đã gia nhập danh sách, chi phí ký hợp đồng đã bị trừ`);
      props.services.log.info('AI人才市场', '签约事务完整提交', {
        candidateId: frozenCandidate.id,
        candidateName: frozenCandidate.姓名,
        entryId,
        signingPrice: frozenCandidate.市场签约价格,
        slotId: meta.slotId,
      });
    } catch (error) {
      bossState.value = stateBefore;
      mvuBlockStore.value = blockStoreBefore;
      const rollbackIssues: string[] = [];
      try {
        await props.services.mvuRuntime.replaceCurrentStatData(mvuBefore, '老板', false);
      } catch (rollbackError) {
        rollbackIssues.push(`MVU 回滚失败：${String(rollbackError)}`);
      }
      try {
        await props.services.worldbookRuntime.restoreSnapshot(worldbookBefore, 'AI 人才签约失败回滚');
      } catch (rollbackError) {
        rollbackIssues.push(`世界书快照回滚失败：${String(rollbackError)}`);
        try {
          await props.services.worldbookRuntime.deleteGeneratedCharacterEntry(entryId, 'AI 人才签约失败清理残片');
        } catch (deleteError) {
          rollbackIssues.push(`世界书残片删除失败：${String(deleteError)}`);
        }
      }
      props.services.log.error('AI人才市场', '签约事务失败并已执行回滚', {
        candidateId: frozenCandidate.id,
        error: String(error),
        rollbackIssues,
      });
      throw new Error(
        `AI 人才签约未提交：${String(error)}${rollbackIssues.length ? `；${rollbackIssues.join('；')}` : ''}`,
      );
    }
  });
  if (!completed) return;
  markAutoSaveClean('AI 人才签约即时保存', savedAt);
  await refreshSlotsQuietly();
}

async function paidRefreshBossRecruit() {
  const cost = getBossRecruitPaidRefreshCost(bossState.value);
  if (bossState.value.资金 < cost) {
    showToast(`Không đủ tiền, còn cần thêm ${yuan(cost - bossState.value.资金)}`);
    return;
  }
  if (!(await confirmAction(`Xác nhận chi ${yuan(cost)} để làm mới ngay nhóm tuyển dụng OC thường chứ?`, 'Làm mới trả phí'))) return;
  const completed = await runBossMutation('Làm mới trả phí nhóm tuyển dụng thường', () =>
    paidRefreshBossRecruitment(bossState.value, Date.now()),
  );
  if (completed) await requestAutoSave('普通招聘池付费刷新完成', true);
}

async function talkBossRecruit(name: string) {
  const recruit = bossState.value.招聘.候选.find(candidate => candidate.姓名 === name);
  if (!recruit) {
    showToast('Không tìm thấy ứng viên này');
    return;
  }
  bossState.value.地点 = '办公室';
  const officeContentMap = makeBossAreaEntryContentMap('办公室');
  const officeEntryIds =
    Object.keys(officeContentMap).length > 0
      ? ['area.current', ...makeBossAreaWorldbookEntryIds('办公室')]
      : makeBossAreaWorldbookEntryIds('办公室');
  const character = findTangquanCharacter(recruit.姓名);
  await openAirpScene({
    mode: '老板',
    kind: 'dialogue',
    characterId: character?.id ?? '',
    speakerId: character ? `character:${character.id}` : '',
    participantIds: character ? [`character:${character.id}`] : [],
    title: `Phỏng vấn ${recruit.姓名}`,
    note: `Lương ngày kỳ vọng ${yuan(recruit.期望日薪)} · Số lần từ chối ${recruit.拒绝记录}`,
    speaker: recruit.姓名,
    line: '"Tôi đã sẵn sàng, anh/chị muốn hỏi gì trước?"',
    placeholder: 'Nhập câu hỏi phỏng vấn, mô tả vị trí, điều kiện đãi ngộ hoặc yêu cầu quan sát.',
    entryIds: [...officeEntryIds, 'character.current-candidate'],
    entryContentMap: {
      ...officeContentMap,
      'character.current-candidate': makeCandidateEntryContent(recruit, '招聘'),
    },
    blockIds: ['boss.candidate'],
    blockContext: {
      recruitCandidateName: recruit.姓名,
    },
    scene: {
      地点: '办公室',
      候选人: {
        [recruit.姓名]: {
          来源: '招聘候选',
          期望日薪: recruit.期望日薪,
          拒绝记录: recruit.拒绝记录,
          简介: recruit.说明,
        },
      },
    },
  });
}

async function hireBossRecruit(name: string) {
  const recruit = bossState.value.招聘.候选.find(candidate => candidate.姓名 === name);
  if (!recruit) {
    showToast('Không tìm thấy ứng viên này');
    return;
  }
  if (bossState.value.员工.some(employee => employee.姓名.trim() === recruit.姓名.trim())) {
    showToast('Danh sách đã có nhân viên trùng tên');
    return;
  }
  if (!(await confirmAction(`Xác nhận tuyển dụng ${recruit.姓名} chứ? Chuẩn bị nhập chức sẽ trừ một khoản phí.`, 'Tuyển dụng ứng viên'))) {
    return;
  }
  await runBossMutation(
    '录用候选',
    () => hireBossRecruitCandidate(bossState.value, recruit.姓名),
    async () => {
      await deactivateBossMvuBlocks('录用候选');
      await replaceTemporaryEntries([], '录用候选');
    },
  );
}

async function rejectBossRecruit(name: string) {
  await runAction('拒绝候选', async () => {
    bossState.value = rejectBossRecruitCandidate(bossState.value, name);
    await deactivateBossMvuBlocks('拒绝候选');
    await replaceTemporaryEntries([], '拒绝候选');
    showToast('Đã từ chối, vòng này không hiển thị ứng viên này nữa');
  });
  markAutoSaveDirty('拒绝候选');
}

async function upgradeBossFacility(key: BossInfrastructureKey) {
  const cost = getBossInfrastructureUpgradeCost(bossState.value, key);
  const item = bossInfrastructureItems.value.find(entry => entry.key === key);
  if (!item || item.isMaxed) {
    showToast('Lộ trình xây dựng này đã hoàn thành');
    return;
  }
  const unlockText = item.nextUnlocks.length
    ? `, có thể mở ${item.nextUnlocks.map(unlock => unlock.名称).join('、')}`
    : '';
  if (
    !(await confirmAction(
      `Xác nhận khởi công ${item.label} ${item.level}→${item.level + 1} chứ? Tổng chi phí khoảng ${yuan(cost)}, dự kiến ${item.days} ngày${unlockText}.`,
      'Mở rộng cơ sở vật chất',
    ))
  ) {
    return;
  }
  await runBossMutation('Mở rộng cơ sở vật chất', () => upgradeBossInfrastructure(bossState.value, key));
}

async function startBossBuilding(buildingId: string) {
  const building = bossBuildingItems.value.find(item => item.id === buildingId);
  if (!building) {
    showToast('Không tìm thấy công trình này');
    return;
  }
  const action = building.状态 === '已建成' ? 'nâng cấp' : 'mở rộng';
  if (
    !(await confirmAction(
      `Xác nhận ${action} ${building.名称} chứ? Dự kiến chi phí ${yuan(building.cost)}, thời gian thi công ${building.days} ngày.`,
      `${action} công trình`,
    ))
  ) {
    return;
  }
  await runBossMutation(`${action}建筑`, () => startBossBuildingProject(bossState.value, buildingId));
}

async function handleBossSelectedBuildingAction() {
  const building = bossSelectedBuilding.value;
  if (!building) {
    showToast('Hãy chọn một công trình trước');
    return;
  }
  if (building.状态 === '待验收') {
    const project = bossSelectedBuildingProject.value;
    if (!project) {
      showToast('Không tìm thấy công trình chờ nghiệm thu');
      return;
    }
    await acceptBossProject(project.id);
    return;
  }
  await startBossBuilding(building.id);
}

async function acceptBossProject(projectId: string) {
  if (!(await confirmAction('Xác nhận nghiệm thu công trình này chứ? Sau khi nghiệm thu cấp độ cơ sở sẽ chính thức có hiệu lực.', 'Nghiệm thu công trình'))) {
    return;
  }
  await runBossMutation('Nghiệm thu công trình', () => acceptBossConstructionProject(bossState.value, projectId));
}

async function maintainBossFacilities() {
  const cost = bossMaintenanceCost.value;
  if (cost <= 0) {
    showToast('Độ bảo trì hiện tại đã rất cao');
    return;
  }
  if (!(await confirmAction(`Xác nhận chi ${yuan(cost)} để bảo trì chứ?`, 'Bảo trì môi trường'))) {
    return;
  }
  await runBossMutation('Bảo trì môi trường', () => maintainBossInfrastructure(bossState.value));
}

async function startBossCampaign() {
  if (!(await confirmAction('Xác nhận bắt đầu chiến dịch quảng bá chứ? Quảng bá sẽ tốn tiền, và tăng lượng khách cùng độ hot dự án trong vài ngày.', 'Chiến dịch quảng bá'))) {
    return;
  }
  await runBossMutation('Chiến dịch quảng bá', () => startBossMarketingCampaign(bossState.value));
}

async function investBossCare() {
  if (!(await confirmAction('Xác nhận sắp xếp phúc lợi nhân viên chứ? Việc này sẽ tốn tiền, tăng sự hài lòng và giảm mệt mỏi cùng rủi ro nghỉ việc.', 'Phúc lợi nhân viên'))) {
    return;
  }
  await runBossMutation('Phúc lợi nhân viên', () => investBossStaffCare(bossState.value));
}

async function toggleBossPause() {
  if (bossState.value.营业状态 === '暂停营业') {
    await runBossMutation(
      '恢复营业',
      () => resumeBossBusiness(bossState.value),
      () => {
        setBossLine(bossUserName.value, 'Cửa tiệm bắt đầu tiếp khách trở lại.');
      },
    );
    return;
  }
  if (!(await confirmAction('Xác nhận tạm ngừng kinh doanh chứ? Sau khi tạm ngừng hôm nay sẽ không có thêm khách mới, nhưng vẫn có thể xử lý việc trong quán.', 'Tạm ngừng kinh doanh'))) {
    return;
  }
  await runBossMutation(
    '暂停营业',
    () => pauseBossBusiness(bossState.value),
    () => {
      setBossLine(bossUserName.value, 'Cửa tiệm đã tạm ngừng tiếp khách, có thể xử lý trước việc xếp ca, nhân viên hoặc hiện trường.');
    },
  );
}

async function closeBossToday() {
  if (
    !(await confirmAction('Xác nhận ngừng kinh doanh hôm nay chứ? Sau khi ngừng, lượng khách hôm nay về 0, khi kết toán không có doanh thu kinh doanh, nhưng vẫn phát sinh chi phí cơ bản.', 'Ngừng kinh doanh hôm nay'))
  ) {
    return;
  }
  await runBossMutation(
    '今日停业',
    () => closeBossBusinessToday(bossState.value),
    () => {
      openBossMenu('settlement');
      setBossLine(bossUserName.value, 'Hôm nay đã ngừng kinh doanh, sổ sách sẽ được xử lý như một ngày không có lượng khách.');
    },
  );
}

async function restBossToday() {
  if (!(await confirmAction('Xác nhận nghỉ một ngày chứ? Việc này sẽ trực tiếp tiến đến 00:00 ngày hôm sau, và trừ chi phí bảo trì và lưu trực tối thiểu.', 'Nghỉ một ngày'))) {
    return;
  }
  await finishBossDayWithReport({
    label: '休息一天',
    mutate: restBossOneDay,
    line: 'Quán đã yên tĩnh nghỉ ngơi một ngày, trạng thái nhân viên hồi phục đôi chút.',
  });
}

async function closeBossDay() {
  if (bossState.value.今日已结算) {
    openBossMenu('settlement');
    showToast('Hôm nay đã kết toán rồi');
    return;
  }
  if (!(await confirmAction('Xác nhận kết toán hôm nay chứ? Sau khi kết toán thời gian sẽ tiến đến 00:00.', 'Kết toán hôm nay'))) {
    return;
  }
  await finishBossDayWithReport({
    label: '今日结算',
    mutate: settleBossDay,
    line: 'Sổ sách và nhật ký kinh doanh hôm nay đã được niêm phong, lượng khách và trạng thái nhân viên ngày mai cũng đã được làm mới.',
  });
}

function findCustomerEmployee(name: string): CustomerEmployee | null {
  return customerState.value.员工[name] ?? null;
}

function findCustomerProject(name: string) {
  return customerState.value.项目[name] ?? null;
}

function makeCustomerAreaWorldbookEntryIds(areaName: string): string[] {
  const buildingName = TANGQUAN_AREA_TO_BUILDING[areaName];
  return buildingName ? [makeTangquanBuildingEntryId(buildingName, 1)] : [];
}

function makeCustomerProjectWorldbookEntryIds(projectName: string): string[] {
  const project = findCustomerProject(projectName);
  if (!project) {
    return [];
  }
  const projectEntryIds = TANGQUAN_PROJECT_NAMES.includes(project.名称 as (typeof TANGQUAN_PROJECT_NAMES)[number])
    ? [makeTangquanProjectEntryId(project.名称)]
    : [];
  return _.uniq([...projectEntryIds, ...makeCustomerAreaWorldbookEntryIds(project.区域)]);
}

function makeCustomerAreaContentMap(areaName: string): Record<string, string> {
  const snapshot = cloneCustomerPageState(customerState.value);
  snapshot.地点 = areaName;
  return { 'area.current': makeCustomerAreaEntryContent(snapshot) };
}

function makeCustomerEmployeeContentMap(employee: CustomerEmployee, includeArea = true): Record<string, string> {
  return {
    ...(includeArea ? makeCustomerAreaContentMap(employee.区域) : {}),
    'character.current-employee': makeCustomerEmployeeEntryContent(employee),
  };
}

function makeCustomerEmployeesContentMap(employees: CustomerEmployee[], includeArea = false): Record<string, string> {
  const primary = employees[0];
  return {
    ...(includeArea && primary ? makeCustomerAreaContentMap(primary.区域) : {}),
    'character.current-employee': makeCustomerEmployeesEntryContent(employees),
  };
}

function makeCustomerServiceContentMap(employee: CustomerEmployee, projectName: string): Record<string, string> {
  const project = findCustomerProject(projectName);
  const sceneArea = project?.区域 ?? employee.区域;
  const sceneEmployee = { ...employee, 区域: sceneArea };
  return {
    ...makeCustomerAreaContentMap(sceneArea),
    'character.current-employee': makeCustomerEmployeeEntryContent(sceneEmployee),
    ...(project ? { 'project.current': makeCustomerProjectEntryContent(project) } : {}),
  };
}

async function runCustomerMutation(
  label: string,
  mutate: () => CustomerMutationResult,
  onSuccess?: () => void | Promise<void>,
): Promise<boolean> {
  let changed = false;
  await runAction(label, async () => {
    const result = mutate();
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    customerState.value = result.state;
    changed = true;
    await refreshActiveCustomerMvuBlocks(label);
    await onSuccess?.();
    showToast(result.message);
  });
  if (changed) markAutoSaveDirty(label);
  return changed;
}

function openCustomerMenu(view: CustomerMenuView = customerView.value) {
  customerView.value = view;
  customerMenuOpen.value = true;
  customerStoryOpen.value = false;
  if (view === 'projects') {
    const selectedProject = findCustomerProject(customerSelectedProject.value);
    if (!selectedProject || !selectedProject.开放) {
      customerSelectedProject.value = Object.values(customerState.value.项目).find(project => project.开放)?.名称 ?? '';
    }
    const availableEmployees = listCustomerAvailableEmployees(customerState.value, customerSelectedProject.value);
    if (!availableEmployees.some(employee => employee.姓名 === customerSelectedEmployee.value)) {
      customerSelectedEmployee.value = availableEmployees[0]?.姓名 ?? '';
    }
  }
  if (view === 'contacts') {
    const firstContact = customerSelectedContact.value || Object.keys(customerState.value.联系人)[0] || '';
    customerSelectedContact.value = firstContact;
    if (firstContact) {
      customerState.value = markCustomerConversationRead(customerState.value, firstContact);
    }
  }
  writeUiMemorySnapshot('打开游客菜单');
  if (view === 'nomination') completeTutorialAction('customer-open-nomination');
  if (view === 'projects') completeTutorialAction('customer-open-projects');
}

function closeCustomerMenu() {
  customerMenuOpen.value = false;
  writeUiMemorySnapshot('关闭游客菜单');
}

function selectCustomerEmployee(employeeName: string) {
  if (!findCustomerEmployee(employeeName)) {
    return;
  }
  customerSelectedEmployee.value = employeeName;
  writeUiMemorySnapshot('选择游客员工');
  if (employeeName === 'atri') completeTutorialAction('customer-select-atri');
}

function selectCustomerProject(projectName: string) {
  if (!findCustomerProject(projectName)) {
    return;
  }
  customerSelectedProject.value = projectName;
  const selectedEmployee = findCustomerEmployee(customerSelectedEmployee.value);
  if (
    !selectedEmployee ||
    !listCustomerAvailableEmployees(customerState.value, projectName).some(item => item.姓名 === selectedEmployee.姓名)
  ) {
    customerSelectedEmployee.value = listCustomerAvailableEmployees(customerState.value, projectName)[0]?.姓名 ?? '';
  }
  writeUiMemorySnapshot('选择游客项目');
  if (projectName === '入浴休憩') completeTutorialAction('customer-select-project');
}

function selectCustomerContact(employeeName: string) {
  if (!customerState.value.联系人[employeeName]) {
    return;
  }
  customerSelectedContact.value = employeeName;
  customerSelectedEmployee.value = employeeName;
  customerState.value = markCustomerConversationRead(customerState.value, employeeName);
  writeUiMemorySnapshot('选择联系人');
}

async function toggleCustomerContactOutputMode() {
  if (busy.value || airpSubmitting.value) return;
  const nextMode = customerContactOutputMode.value === 'story' ? 'dialogue' : 'story';
  await runAction('切换联系人聊天模式', async () => {
    await enqueueAiGeneration('切换联系人输出契约', async () => {
      const employee = findCustomerEmployee(customerSelectedContact.value);
      const scene = employee ? { ...makeCustomerContactScene(employee), outputMode: nextMode } : null;
      await syncPresetOutputFormat(scene, `切换联系人聊天模式：${nextMode}`);
    });
    customerContactOutputMode.value = nextMode;
    writeUiMemorySnapshot('切换联系人聊天模式');
    showToast(nextMode === 'story' ? 'Phản hồi tiếp theo của liên hệ chuyển sang văn bản' : 'Phản hồi tiếp theo của liên hệ chuyển sang Galgame');
  });
  markAutoSaveDirty('切换联系人聊天模式');
  await requestAutoSave('切换联系人聊天模式');
}

async function goCustomerArea(areaName: string) {
  await runCustomerMutation(
    '前往区域',
    () => travelCustomerArea(customerState.value, areaName),
    async () => {
      await deactivateCustomerMvuBlocks('前往区域');
      await replaceTemporaryEntries([], '前往区域');
      await props.services.mvuRuntime.clearInteractionScene('游客');
      customerMenuOpen.value = false;
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        '未开之花',
        `Ánh đèn và hơi nước của ${areaName} lại lan tỏa, nhân viên và dự án ở đây hôm nay đã được cập nhật.`,
      );
    },
  );
}

async function checkInCustomer(payload: { room: string; days: number }) {
  const room = payload.room || '简易客房';
  const days = Math.max(1, Math.min(7, Math.round(payload.days || 1)));
  const roomOption = CUSTOMER_ROOM_OPTIONS.find(option => option.名称 === room);
  const total = (roomOption?.每日房费 ?? 0) * days;
  if (!(await confirmAction(`Xác nhận làm thủ tục ${room} ${days} ngày chứ? Sẽ thanh toán ${yuan(total)}.`, 'Làm thủ tục lưu trú'))) {
    return;
  }
  await runCustomerMutation(
    '办理住宿',
    () => checkInCustomerStay(customerState.value, room, days),
    async () => {
      customerView.value = 'today';
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        'Lễ tân',
        `"Đã làm xong thủ tục lưu trú, phòng và sắp xếp hôm nay của ông đều đã sẵn sàng."`,
      );
    },
  );
}

async function checkOutCustomer() {
  if (!(await confirmAction('Xác nhận làm thủ tục trả phòng chứ? Chỉ định xuyên ngày chưa kết thúc cũng sẽ kết thúc theo, phí đã trả không hoàn lại.', 'Làm thủ tục trả phòng'))) {
    return;
  }
  await runCustomerMutation(
    '办理退房',
    () => checkOutCustomerStay(customerState.value),
    async () => {
      customerView.value = 'today';
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        'Lễ tân',
        '"Trả phòng đã hoàn tất, ông vẫn có thể tiếp tục lưu lại với tư cách khách vãng lai."',
      );
    },
  );
}

async function nominateCustomer(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee) {
    showToast('Không tìm thấy nhân viên này');
    return;
  }
  const days = customerState.value.住宿.状态 === '住宿中' ? customerState.value.住宿.剩余天数 : 1;
  const total = days * employee.每日指名费;
  if (
    !(await confirmAction(
      `Xác nhận chỉ định ${employeeName}${days > 1 ? ` ${days} ngày` : ''} chứ? Sẽ thanh toán ${yuan(total)}.`,
      'Xác nhận chỉ định',
    ))
  ) {
    return;
  }
  await runCustomerMutation(
    '确认指名',
    () => nominateCustomerEmployee(customerState.value, employeeName, days),
    async () => {
      customerSelectedEmployee.value = employeeName;
      customerView.value = 'today';
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        employeeName,
        `"Sắp xếp tiếp theo tôi sẽ đồng hành cùng ông. Ông muốn đến khu vực nào trước?"`,
      );
      if (employeeName === 'atri') completeTutorialAction('customer-nominate-atri');
    },
  );
}

async function endCustomerNominationAction(employeeName: string) {
  if (!(await confirmAction(`Xác nhận kết thúc chỉ định với ${employeeName} chứ? Phí chỉ định đã trả sẽ không hoàn lại.`, 'Kết thúc chỉ định'))) {
    return;
  }
  await runCustomerMutation(
    '结束指名',
    () => endCustomerNomination(customerState.value, employeeName),
    async () => {
      customerView.value = 'today';
    },
  );
}

async function bookSelectedCustomerService() {
  const project = findCustomerProject(customerSelectedProject.value);
  const employee = findCustomerEmployee(customerSelectedEmployee.value);
  if (!project || !employee) {
    showToast('Vui lòng chọn dự án và nhân viên trước');
    return;
  }
  if (!listCustomerAvailableEmployees(customerState.value, project.名称).some(item => item.姓名 === employee.姓名)) {
    showToast('Nhân viên này hiện không thể nhận dự án đó');
    return;
  }
  if (
    !(await confirmAction(`Xác nhận đặt lịch ${project.名称} với ${employee.姓名} chứ? Sẽ thanh toán ${yuan(project.价格)}.`, 'Xác nhận đặt lịch'))
  ) {
    return;
  }
  await runCustomerMutation(
    '预约服务',
    () => bookCustomerService(customerState.value, project.名称, employee.姓名),
    async () => {
      customerView.value = 'today';
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        employee.姓名,
        `"${project.名称} đã được sắp xếp xong, khi nào sẵn sàng chúng ta sẽ bắt đầu."`,
      );
      completeTutorialAction('customer-book-service');
    },
  );
}

async function startSelectedCustomerService() {
  const service = customerState.value.当前服务;
  if (!service) {
    showToast('Hiện không có dịch vụ đã đặt lịch');
    return;
  }
  await runCustomerMutation(
    '开始服务',
    () => startCustomerService(customerState.value),
    async () => {
      const employee = findCustomerEmployee(service.员工);
      const project = findCustomerProject(service.项目);
      if (!employee || !project) {
        return;
      }
      await openAirpScene({
        mode: '游客',
        kind: 'dialogue',
        serviceId: service.id,
        projectId: makeTangquanSceneEntityId('project', project.名称),
        title: `${employee.姓名} · ${project.名称}`,
        note: `${project.区域} · ${project.时长分钟} phút`,
        speaker: employee.姓名,
        line: `"Đã sẵn sàng rồi. Tiếp theo muốn bắt đầu từ đâu?"`,
        placeholder: 'Nhập điều bạn muốn nói, việc muốn làm, hoặc yêu cầu cho lượt dịch vụ này.',
        entryIds: [
          'area.current',
          'project.current',
          'character.current-employee',
          ...makeCustomerProjectWorldbookEntryIds(project.名称),
        ],
        entryContentMap: makeCustomerServiceContentMap(employee, project.名称),
        customerBlockIds: ['customer.employee', 'customer.relationship', 'customer.project', 'customer.service'],
        customerBlockContext: { employeeName: employee.姓名, projectName: project.名称 },
        scene: {
          地点: project.区域,
          员工: employee.姓名,
          项目: project.名称,
          当前关系: { 好感度: employee.好感度, 信任度: employee.信任度, 联系状态: employee.联系状态 },
        },
      });
      completeTutorialAction('customer-start-service');
    },
  );
}

async function finishSelectedCustomerService() {
  const service = customerState.value.当前服务;
  if (!service) {
    showToast('Hiện không có dịch vụ đang diễn ra');
    return;
  }
  if (!(await confirmAction(`Xác nhận kết thúc ${service.项目} chứ?`, 'Kết thúc dịch vụ'))) {
    return;
  }
  await runCustomerMutation(
    '结束服务',
    () => finishCustomerService(customerState.value),
    async () => {
      await deactivateCustomerMvuBlocks('结束服务');
      await replaceTemporaryEntries([], '结束服务');
      await props.services.mvuRuntime.clearInteractionScene('游客');
      airpState.value = null;
      airpInput.value = '';
      customerMenuOpen.value = true;
      customerView.value = 'relationship';
      customerSelectedEmployee.value = service.员工;
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        service.员工,
        '"Dịch vụ hôm nay đã kết thúc. Anh còn muốn nói gì với tôi không?"',
      );
    },
  );
}

function makeCustomerEmployeeScene(
  employee: CustomerEmployee,
  kind: AirpSceneState['kind'],
  title: string,
  line: string,
  placeholder: string,
  extraScene: Record<string, unknown> = {},
): AirpSceneState {
  const currentService = customerState.value.当前服务;
  const project = currentService?.员工 === employee.姓名 ? findCustomerProject(currentService.项目) : null;
  const includeProject = Boolean(project);
  const sceneArea = project?.区域 ?? employee.区域;
  return {
    mode: '游客',
    kind,
    serviceId: currentService?.员工 === employee.姓名 ? currentService.id : '',
    projectId: project ? makeTangquanSceneEntityId('project', project.名称) : '',
    title,
    note: `${sceneArea} · Thiện cảm ${employee.好感度} · Tin tưởng ${employee.信任度}`,
    speaker: employee.姓名,
    line,
    placeholder,
    entryIds: [
      'area.current',
      'character.current-employee',
      ...(includeProject ? ['project.current'] : []),
      ...makeCustomerAreaWorldbookEntryIds(sceneArea),
      ...(project ? makeCustomerProjectWorldbookEntryIds(project.名称) : []),
    ],
    entryContentMap: project
      ? makeCustomerServiceContentMap(employee, project.名称)
      : makeCustomerEmployeeContentMap(employee),
    customerBlockIds: [
      'customer.employee',
      'customer.relationship',
      ...(project ? ['customer.project' as const, 'customer.service' as const] : []),
    ],
    customerBlockContext: { employeeName: employee.姓名, projectName: project?.名称 },
    scene: {
      地点: sceneArea,
      员工: employee.姓名,
      当前关系: { 好感度: employee.好感度, 信任度: employee.信任度, 联系状态: employee.联系状态 },
      ...extraScene,
    },
  };
}

async function ensureCustomerAtEmployee(employee: CustomerEmployee): Promise<boolean> {
  if (customerState.value.地点 === employee.区域) {
    return true;
  }
  const result = travelCustomerArea(customerState.value, employee.区域);
  if (!result.ok) {
    showToast(result.message);
    return false;
  }
  customerState.value = result.state;
  await syncCustomerMvuSnapshot();
  return true;
}

async function talkCustomerEmployee(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee || !(await ensureCustomerAtEmployee(employee))) {
    return;
  }
  customerSelectedEmployee.value = employee.姓名;
  await openAirpScene(
    makeCustomerEmployeeScene(
      employee,
      'dialogue',
      `Trò chuyện với ${employee.姓名}`,
      '"Em đang nghe. Hôm nay anh/chị muốn nói chuyện gì?"',
      'Nhập điều bạn muốn nói với cô ấy.',
    ),
  );
}

async function requestCustomerContact(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee) return;
  if (employee.联系状态 === '已添加') {
    showToast('Đã là liên hệ');
    return;
  }
  if (!(await ensureCustomerAtEmployee(employee))) return;
  await openAirpScene(
    makeCustomerEmployeeScene(
      employee,
      'dialogue',
      `Yêu cầu thông tin liên hệ với ${employee.姓名}`,
      'Cô ấy nhìn bạn, chờ bạn nói hết câu.',
      'Nhập cách bạn định đề nghị trao đổi thông tin liên hệ.',
      { 互动类型: '请求联系方式' },
    ),
  );
}

async function requestCustomerExtraService(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee) return;
  if (!(await ensureCustomerAtEmployee(employee))) return;
  await openAirpScene(
    makeCustomerEmployeeScene(
      employee,
      'story',
      `Bàn dịch vụ thêm với ${employee.姓名}`,
      'Cô ấy không nói hộ bạn, chỉ chờ bạn tự đề xuất ý tưởng.',
      'Tự do mô tả yêu cầu, thương lượng hoặc hành động của bạn. Cô ấy sẽ phản hồi tùy theo mối quan hệ và tình huống lúc đó.',
      { 互动类型: '额外服务' },
    ),
  );
}

function toggleCustomerInviteSelection(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee || employee.联系状态 !== '已添加') return;
  if (customerInviteSelection.value.includes(employeeName)) {
    customerInviteSelection.value = customerInviteSelection.value.filter(name => name !== employeeName);
  } else if (customerInviteSelection.value.length >= 4) {
    showToast('Mỗi lượt mời đi cùng chỉ được chọn tối đa 4 người');
    return;
  } else {
    customerInviteSelection.value = [...customerInviteSelection.value, employeeName];
  }
  writeUiMemorySnapshot('选择同行邀约角色');
}

async function inviteSelectedCustomerEmployees() {
  await inviteCustomerEmployees(customerInviteSelection.value);
}

async function inviteCustomerEmployee(employeeName: string) {
  await inviteCustomerEmployees([employeeName]);
}

async function inviteCustomerEmployees(employeeNames: string[]) {
  const employees = _.uniq(employeeNames)
    .map(findCustomerEmployee)
    .filter((employee): employee is CustomerEmployee => Boolean(employee && employee.联系状态 === '已添加'))
    .slice(0, 4);
  if (employees.length === 0) {
    showToast('Chưa có thông tin liên hệ nào khả dụng');
    return;
  }
  const primary = employees[0];
  const names = employees.map(employee => employee.姓名);
  const relationships = Object.fromEntries(
    employees.map(employee => [
      employee.姓名,
      {
        好感度: employee.好感度,
        信任度: employee.信任度,
        联系状态: employee.联系状态,
      },
    ]),
  );
  await openAirpScene({
    mode: '游客',
    kind: 'story',
    locationId: 'channel:online',
    title: `Mời ${names.join('、')} gặp riêng`,
    note: `Trực tuyến · ${employees.length} liên hệ`,
    speaker: primary.姓名,
    participants: names,
    line: 'Trước khi gửi tin nhắn, bạn vẫn có thể sắp xếp lại lời lẽ của mình.',
    placeholder: 'Nhập nội dung lời mời, thời gian, người tham gia và điều bạn muốn cùng làm.',
    entryIds: ['character.current-employee'],
    entryContentMap: makeCustomerEmployeesContentMap(employees, false),
    customerBlockIds: ['customer.employee', 'customer.relationship', 'customer.contact'],
    customerBlockContext: { employeeName: primary.姓名, employeeNames: names, contactName: primary.姓名 },
    scene: {
      互动类型: '私下邀约',
      交流方式: '线上',
      主要员工: primary.姓名,
      员工: names,
      当前关系: relationships[primary.姓名],
      相关关系: relationships,
    },
  });
}

async function tipCustomer(employeeName: string) {
  const employee = findCustomerEmployee(employeeName);
  if (!employee) return;
  if (!(await confirmAction(`Xác nhận tặng thưởng ${yuan(500)} cho ${employeeName} chứ?`, 'Xác nhận tặng thưởng'))) {
    return;
  }
  await runCustomerMutation('打赏', () => tipCustomerEmployee(customerState.value, employeeName, 500));
}

async function openCustomerFreeAirp() {
  // 只取当前确实位于用户所在地的员工
  const candidate = getCustomerCurrentEmployee(customerState.value, customerSelectedEmployee.value);
  const presentEmployee = candidate && candidate.区域 === customerState.value.地点 ? candidate : null;
  const entryIds = ['area.current', ...makeCustomerAreaWorldbookEntryIds(customerState.value.地点)];
  const contentMap = makeCustomerAreaContentMap(customerState.value.地点);
  if (presentEmployee) {
    entryIds.push('character.current-employee');
    Object.assign(contentMap, makeCustomerEmployeeContentMap(presentEmployee));
  }
  await openAirpScene({
    mode: '游客',
    kind: 'story',
    title: `Hành động tự do tại ${customerState.value.地点}`,
    note: presentEmployee ? `当前可互动：${presentEmployee.姓名}` : '当前区域自由行动',
    speaker: presentEmployee?.姓名 ?? '',
    line: 'Bối cảnh hiện tại đã sẵn sàng, bạn có thể tự do mô tả việc muốn làm tiếp theo.',
    placeholder: 'Nhập điều bạn muốn làm tiếp theo.',
    entryIds,
    entryContentMap: contentMap,
    customerBlockIds: presentEmployee ? ['customer.employee', 'customer.relationship'] : [],
    customerBlockContext: presentEmployee ? { employeeName: presentEmployee.姓名 } : {},
    scene: {
      地点: customerState.value.地点,
      ...(presentEmployee ? { 当前员工: presentEmployee.姓名 } : {}),
    },
  });
}

function advanceCustomerDialogue() {
  customerState.value = nextCustomerDialoguePage(customerState.value);
  writeUiMemorySnapshot('游客台词翻页');
}

function rewindCustomerDialogue() {
  customerState.value = previousCustomerDialoguePage(customerState.value);
  writeUiMemorySnapshot('游客台词上一页');
}

function closeCustomerStory() {
  customerStoryOpen.value = false;
  writeUiMemorySnapshot('关闭正文阅读');
}

async function restCustomerDay() {
  if (
    !(await confirmAction('Xác nhận nghỉ đến 09:00 ngày hôm sau chứ? Số ngày còn lại của lưu trú và chỉ định sẽ giảm mỗi thứ một ngày, xếp ca nhân viên sẽ được làm mới.', 'Nghỉ đến ngày hôm sau'))
  ) {
    return;
  }
  const completed = await runCustomerMutation(
    '休息到次日',
    () => restCustomerToNextDay(customerState.value),
    async () => {
      await deactivateCustomerMvuBlocks('休息到次日');
      await replaceTemporaryEntries([], '休息到次日');
      await props.services.mvuRuntime.clearInteractionScene('游客');
      airpState.value = null;
      airpInput.value = '';
      customerView.value = 'today';
      const dailyNote = await requestCustomerDailyArrangement('游客次日安排');
      customerState.value = setCustomerDialoguePages(
        customerState.value,
        [],
        'Lễ tân',
        dailyNote || '"Chào buổi sáng. Xếp ca và trạng thái có thể đặt lịch hôm nay đã được cập nhật."',
      );
      await syncCustomerMvuSnapshot();
    },
  );
  if (completed) {
    await requestAutoSave('游客跨日流程完成', true);
  }
}

function makeCustomerContactScene(employee: CustomerEmployee): AirpSceneState {
  const speakerId = makeSceneParticipantId(employee.姓名);
  return prepareAirpSceneIdentity(
    {
      mode: '游客',
      kind: 'message',
      outputMode: customerContactOutputMode.value,
      sceneId: makeTangquanContactSceneId(speakerId),
      startedAfterMessageId: 0,
      speakerId,
      participantIds: [speakerId],
      locationId: 'channel:online',
      title: `Tin nhắn liên hệ với ${employee.姓名}`,
      note: 'Trao đổi trực tuyến',
      speaker: employee.姓名,
      participants: [employee.姓名],
      line: '',
      placeholder: '',
      scene: { 互动类型: '线上交流', 员工: employee.姓名 },
      entryIds: [],
    },
    false,
  );
}

function makeCustomerContactHistoryPrompts(employee: CustomerEmployee, scene: AirpSceneState): RolePrompt[] {
  const identity = makeSceneIdentity(scene);
  const conversation = customerState.value.联系人[employee.姓名];
  const messages: TangquanSceneHistoryMessage[] = (conversation?.消息 ?? []).map((message, index) => ({
    messageId: index + 1,
    role: message.发送者 === '用户' ? 'user' : 'assistant',
    content: message.内容,
    sceneId: identity.sceneId,
  }));
  return buildTangquanSceneHistoryPrompts({ identity, messages });
}

async function sendCustomerContactMessage(payload: { employeeName: string; text: string }) {
  const employee = findCustomerEmployee(payload.employeeName);
  const userText = payload.text.trim();
  if (!employee || !userText || employee.联系状态 !== '已添加' || airpSubmitting.value) {
    return;
  }
  const previousScene = airpState.value?.mode === '游客' ? _.cloneDeep(airpState.value) : null;
  let runtimeRestored = false;
  let contactSucceeded = false;
  airpSubmitting.value = true;
  try {
    await runAction('发送联系人消息', async () => {
      await enqueueAiGeneration(`联系人消息：${employee.姓名}`, async () => {
        const contactScene = makeCustomerContactScene(employee);
        const contactIdentity = makeSceneIdentity(contactScene);
        const contactOutputMode = resolveAirpOutputMode(contactScene);
        const chatHistoryPrompts = makeCustomerContactHistoryPrompts(employee, contactScene);
        await syncPresetOutputFormat(contactScene, `联系人消息：${employee.姓名}`);
        const profileEntryId = makeTangquanCharacterEntryId(employee.姓名);
        const entryIds = [
          'character.current-employee',
          'customer.variable-rule',
          ...(profileEntryId ? [profileEntryId] : []),
        ];
        const contentMap = makeCustomerEmployeeContentMap(employee, false);
        await replaceTemporaryEntries(entryIds, `与${employee.姓名}线上交流`, contentMap);
        await activateCustomerMvuBlocks(
          ['customer.employee', 'customer.relationship', 'customer.contact'],
          { employeeName: employee.姓名, contactName: employee.姓名 },
          `与${employee.姓名}线上交流`,
        );
        await props.services.mvuRuntime.setInteractionScene({ 互动类型: '线上交流', 员工: employee.姓名 }, '游客');
        const oldMvuData = _.cloneDeep(await readLatestMvuData());
        const customerStateBeforeGeneration = cloneCustomerPageState(customerState.value);
        const injects = makeCustomerGenerationInjects(contactOutputMode, employee.姓名);
        props.services.log.info('生成诊断', '联系人本轮输入与最终聊天历史', {
          sceneId: contactIdentity.sceneId,
          inputSource: 'contact-input',
          inputBoxValue: payload.text,
          generateUserInput: userText,
          chatHistory: _.cloneDeep(chatHistoryPrompts),
          chatHistoryOverrideCount: chatHistoryPrompts.length,
          exactCurrentInputInHistory: chatHistoryPrompts.filter(prompt => prompt.content.trim() === userText).length,
          currentInputAppendCount: 1,
        });
        props.services.log.info('生成诊断', '即将调用联系人 generate()', {
          employeeName: employee.姓名,
          sceneId: contactIdentity.sceneId,
          mode: contactIdentity.mode,
          kind: contactIdentity.kind,
          outputMode: contactOutputMode,
          speakerId: contactIdentity.speakerId,
          participantIds: contactIdentity.participantIds,
          locationId: contactIdentity.locationId,
          inputSource: 'contact-input',
          inputBoxValue: payload.text,
          userInput: userText,
          preset: props.services.presetOutputFormat.inspect(),
          injects: _.cloneDeep(injects),
          chatHistory: _.cloneDeep(chatHistoryPrompts),
          chatHistoryOverrideCount: chatHistoryPrompts.length,
          exactCurrentInputInHistory: chatHistoryPrompts.filter(prompt => prompt.content.trim() === userText).length,
          currentInputAppendCount: 1,
          activeTemporaryEntryIds: [...activeTemporaryEntryIds.value],
          oldMvuData: _.cloneDeep(oldMvuData),
          lastMessageId: getLastMessageId(),
        });
        const result = await generate({
          user_input: userText,
          should_stream: true,
          overrides: {
            chat_history: {
              with_depth_entries: true,
              prompts: chatHistoryPrompts,
            },
          },
          injects,
        });
        const rawMessage = getGenerationText(result);
        const message = rawMessage.trim() || '<content>Đối phương tạm thời chưa trả lời.</content>';
        props.services.log.info('生成诊断', '联系人 generate() 已返回原始文本', {
          employeeName: employee.姓名,
          sceneId: contactIdentity.sceneId,
          participantIds: contactIdentity.participantIds,
          rawMessage,
          rawLength: rawMessage.length,
        });
        const parsedMessage = parseTangquanAiMessage(message);
        props.services.log.info('解析诊断', '联系人回复解析完成', {
          employeeName: employee.姓名,
          parsedMessage: _.cloneDeep(parsedMessage),
          expectedKind: contactOutputMode,
          formatIssues: [
            parsedMessage.contentTagCount === 0 ? '缺少 content 标签' : '',
            parsedMessage.contentTagCount > 1 ? '存在多个 content 标签' : '',
            parsedMessage.dialoguePages.length === 0 ? '未解析到联系人台词' : '',
          ].filter(Boolean),
        });
        const traceId = makeCustomerGenerationTraceId();
        let newMvuData = oldMvuData;
        if (isTangquanMvuAvailable()) {
          await waitForTangquanMvu();
          const parseBase = _.cloneDeep(oldMvuData);
          newMvuData = (await Mvu.parseMessage(message, parseBase)) ?? parseBase;
        }
        newMvuData = mergeParsedTimeIntoMvuData(newMvuData, oldMvuData, parsedMessage.timeText);
        props.services.log.info('MVU诊断', '联系人回复变量解析完成', {
          employeeName: employee.姓名,
          changedPaths: makeMvuChangedPaths(_.get(oldMvuData, 'stat_data'), _.get(newMvuData, 'stat_data')),
          oldStatData: _.cloneDeep(_.get(oldMvuData, 'stat_data')),
          newStatData: _.cloneDeep(_.get(newMvuData, 'stat_data')),
        });
        const parsedStatData = _.get(newMvuData, 'stat_data');
        if (isRecord(parsedStatData)) {
          const applied = applyCustomerStatDataToState(
            customerStateBeforeGeneration,
            customerMvuBlockStore.value,
            parsedStatData,
          );
          customerState.value = applied.state;
          customerMvuBlockStore.value = applied.store;
          newMvuData = _.cloneDeep(newMvuData);
          _.set(newMvuData, 'stat_data', applied.statData);
        }
        await createChatMessages(
          [
            {
              role: 'user',
              message: userText,
              data: oldMvuData,
              extra: {
                ...makeSceneGenerationExtra(contactScene, traceId, 'user'),
                ...makeCustomerGenerationExtra(traceId, 'message', employee.姓名, employee.姓名, 'user'),
              },
            },
            {
              role: 'assistant',
              message: parsedMessage.displayText,
              data: newMvuData,
              extra: {
                ...makeSceneGenerationExtra(contactScene, traceId, 'assistant'),
                ...makeCustomerGenerationExtra(traceId, 'message', employee.姓名, employee.姓名, 'assistant'),
              },
            },
          ],
          { insert_before: 'end', refresh: 'none' },
        );
        const createdLastId = getLastMessageId();
        await setChatMessages([{ message_id: createdLastId, data: newMvuData }], { refresh: 'none' });
        await setChatMessages([{ message_id: createdLastId - 1 }, { message_id: createdLastId }], {
          refresh: 'affected',
        });
        props.services.log.info('楼层诊断', '联系人消息楼层已创建', {
          traceId,
          userMessageId: createdLastId - 1,
          assistantMessageId: createdLastId,
          messages: getChatMessages(`${Math.max(0, createdLastId - 1)}-${createdLastId}`, { include_swipes: true }),
        });
        const statData = _.get(newMvuData, 'stat_data');
        await saveActiveCustomerMvuBlocks('线上交流完成', isRecord(statData) ? statData : undefined);
        const replyText = parsedMessage.dialoguePages[0]?.text || parsedMessage.displayText || 'Đối phương tạm thời chưa trả lời.';
        customerState.value = appendCustomerMessage(customerState.value, employee.姓名, '用户', userText);
        const contactUserMessageId = customerState.value.联系人[employee.姓名]?.消息.at(-1)?.id ?? '';
        customerState.value = appendCustomerMessage(customerState.value, employee.姓名, employee.姓名, replyText);
        const contactReplyMessageId = customerState.value.联系人[employee.姓名]?.消息.at(-1)?.id ?? '';
        customerState.value = markCustomerConversationRead(customerState.value, employee.姓名);
        registerCustomerGenerationLink({
          version: 1,
          traceId,
          kind: 'message',
          outputMode: contactOutputMode,
          speaker: employee.姓名,
          contactName: employee.姓名,
          ...findCreatedCustomerGenerationMessageIds(traceId),
          contactUserMessageId,
          contactReplyMessageId,
        });
        await restoreCustomerSceneRuntime(previousScene, '线上交流后恢复现场');
        runtimeRestored = true;
        writeUiMemorySnapshot('线上交流完成');
        await props.services.zeroLock.mirrorNow('线上交流完成');
        props.services.beautifier.applyNow('线上交流完成');
        showToast('Tin nhắn đã được gửi');
        contactSucceeded = true;
      });
    });
  } finally {
    if (activeMode.value === '游客') {
      if (!runtimeRestored) {
        await restoreCustomerSceneRuntime(previousScene, '线上交流结束');
      }
    }
    airpSubmitting.value = false;
    writeUiMemorySnapshot('线上交流结束');
  }
  if (contactSucceeded) {
    markAutoSaveDirty('有效AI联系人互动');
    await requestAutoSave('联系人互动结束');
  }
}

async function runAction(label: string, action: () => Promise<void>) {
  if (busy.value) {
    return;
  }
  busy.value = true;
  const operationId = props.services.log.beginOperation(label, makeProblemRecordContext());
  let operationStatus: 'success' | 'error' = 'success';
  props.services.log.info('Vue前端', `${label}开始`);
  try {
    await action();
    props.services.log.info('Vue前端', `${label}完成`);
  } catch (error) {
    operationStatus = 'error';
    props.services.log.error('Vue前端', `${label}失败`, error);
    showToast(`${label} thất bại, vui lòng thử lại sau`);
  } finally {
    refreshRuntime();
    writeUiMemorySnapshot(label);
    busy.value = false;
    props.services.log.finishOperation(operationId, operationStatus, makeProblemRecordContext());
  }
}

async function confirmManualTimeTravel(payload: { targetTime: string; crossesMidnight: boolean }) {
  const plan = planTangquanTimeTravel(currentGameTime.value, payload.targetTime);
  if (!plan.ok) {
    showToast(plan.reason);
    return;
  }
  if (plan.crossesMidnight !== payload.crossesMidnight) {
    showToast('Thời gian hiện tại đã thay đổi, vui lòng chọn lại thời gian mục tiêu');
    timePickerOpen.value = false;
    return;
  }
  const blocker = getManualTimeTravelBlockReason();
  if (blocker) {
    showToast(blocker);
    return;
  }

  timePickerOpen.value = false;
  const label = plan.crossesMidnight ? '手动跨日跳时' : '手动推进时间';
  let completed = false;
  let completionMessage = '';
  await runAction(label, async () => {
    props.services.log.info('时间跳转', '开始执行确定性时间推进', {
      mode: activeMode.value,
      currentTime: plan.currentTime,
      targetTime: plan.targetTime,
      crossesMidnight: plan.crossesMidnight,
      advanceMinutes: plan.advanceMinutes,
    });

    if (activeMode.value === '老板') {
      const fromDate = bossState.value.日期;
      let nextState = cloneBossPageState(bossState.value);
      if (plan.crossesMidnight) {
        const settled = settleBossDay(nextState);
        if (!settled.ok) {
          showToast(settled.message);
          return;
        }
        const facts = makeBossDailyReportFacts(nextState, settled.state);
        const report = await requestBossDailyReport('手动跨日跳时经营日报', facts);
        nextState = attachBossDailyReport(settled.state, report);
      }
      const applied = applyBossManualTimeTarget(nextState, plan.targetTime, {
        fromDate,
        crossesMidnight: plan.crossesMidnight,
      });
      if (!applied.ok) {
        showToast(applied.message);
        return;
      }
      bossState.value = applied.state;
      if (plan.crossesMidnight) {
        await deactivateBossMvuBlocks(label);
        openBossMenu('settlement');
        setBossLine(bossUserName.value, `Kinh doanh hôm nay đã được niêm phong, thời gian tiến đến ${plan.targetTime}.`);
      } else {
        await refreshActiveBossMvuBlocks(label);
      }
      completionMessage = applied.message;
    } else if (activeMode.value === '游客') {
      const fromDate = customerState.value.日期;
      let nextState = cloneCustomerPageState(customerState.value);
      if (plan.crossesMidnight) {
        const rested = restCustomerToNextDay(nextState);
        if (!rested.ok) {
          showToast(rested.message);
          return;
        }
        nextState = rested.state;
      }
      const applied = applyCustomerManualTimeTarget(nextState, plan.targetTime, {
        fromDate,
        crossesMidnight: plan.crossesMidnight,
      });
      if (!applied.ok) {
        showToast(applied.message);
        return;
      }
      customerState.value = applied.state;
      if (plan.crossesMidnight) {
        await deactivateCustomerMvuBlocks(label);
        await replaceTemporaryEntries([], label);
        await props.services.mvuRuntime.clearInteractionScene('游客');
        customerGenerationLinks.value = [];
        customerView.value = 'today';
        customerMenuOpen.value = false;
        const dailyNote = await requestCustomerDailyArrangement('游客手动跨日次日安排');
        customerState.value = setCustomerDialoguePages(
          customerState.value,
          [],
          'Lễ tân',
          dailyNote || '"Một ngày mới đã bắt đầu, xếp ca và trạng thái có thể đặt lịch hôm nay đã được cập nhật."',
        );
        await syncCustomerMvuSnapshot();
      } else {
        await refreshActiveCustomerMvuBlocks(label);
      }
      completionMessage = applied.message;
    } else {
      const fromDate = waiterState.value.dateIso;
      let nextState = cloneWaiterPageState(waiterState.value);
      if (plan.crossesMidnight) {
        const settled = settleWaiterDay(nextState);
        if (!settled.ok) {
          showToast(settled.message);
          return;
        }
        nextState = settled.state;
      }
      const applied = applyWaiterManualTimeTarget(nextState, plan.targetTime, {
        fromDate,
        crossesMidnight: plan.crossesMidnight,
      });
      if (!applied.ok) {
        showToast(applied.message);
        return;
      }
      waiterState.value = applied.state;
      if (plan.crossesMidnight) {
        await deactivateWaiterMvuBlocks(label);
        await replaceTemporaryEntries([], label);
        await props.services.mvuRuntime.clearInteractionScene('服务员');
        waiterGenerationLinks.value = [];
        await requestWaiterDailyArrangement('服务员手动跨日次日安排');
        waiterSelectedAssignmentId.value = waiterState.value.assignments[0]?.id ?? '';
        waiterView.value = 'shift';
        waiterMenuOpen.value = true;
        await syncWaiterMvuSnapshot();
      } else {
        await refreshActiveWaiterMvuBlocks(label);
      }
      completionMessage = applied.message;
    }

    completed = true;
    props.services.log.info('时间跳转', '确定性时间推进完成', {
      mode: activeMode.value,
      targetTime: plan.targetTime,
      crossesMidnight: plan.crossesMidnight,
    });
    showToast(completionMessage);
  });

  if (!completed) return;
  const loadingReleaseDeadline = Date.now() + 5_000;
  while (props.services.loading.getState().visible && Date.now() < loadingReleaseDeadline) {
    await new Promise<void>(resolve => window.setTimeout(resolve, 50));
  }
  markAutoSaveDirty(label);
  const saveResult = await requestAutoSave(`${label}完成`, true);
  if (saveResult.status === 'saved') await refreshSlotsQuietly();
  props.services.log.info('时间跳转', '时间推进保存结果', {
    mode: activeMode.value,
    targetTime: plan.targetTime,
    crossesMidnight: plan.crossesMidnight,
    status: saveResult.status,
    blockers: saveResult.blockers,
    error: saveResult.error,
  });
}

function findWaiterAssignment(assignmentId: string) {
  return waiterState.value.assignments.find(item => item.id === assignmentId) ?? null;
}

function makeWaiterAreaWorldbookEntryIds(areaName: string): string[] {
  const buildingName = TANGQUAN_AREA_TO_BUILDING[areaName];
  return buildingName ? [makeTangquanBuildingEntryId(buildingName, 1)] : [];
}

function makeWaiterProjectWorldbookEntryIds(projectName: string, areaName: string): string[] {
  const projectEntryIds = TANGQUAN_PROJECT_NAMES.includes(projectName as (typeof TANGQUAN_PROJECT_NAMES)[number])
    ? [makeTangquanProjectEntryId(projectName)]
    : [];
  return _.uniq([...projectEntryIds, ...makeWaiterAreaWorldbookEntryIds(areaName)]);
}

function makeWaiterServiceEntryContentMap(assignmentId: string): Record<string, string> {
  const assignment = findWaiterAssignment(assignmentId);
  if (!assignment) {
    return {};
  }
  const snapshot = cloneWaiterPageState(waiterState.value);
  snapshot.location = assignment.area;
  return {
    'area.current': makeWaiterAreaEntryContent(snapshot),
    'project.current': makeWaiterProjectEntryContent(assignment),
    'character.current-guest': makeWaiterGuestEntryContent(snapshot, assignment),
  };
}

async function runWaiterMutation(
  label: string,
  mutate: () => WaiterMutationResult,
  onSuccess?: () => void | Promise<void>,
): Promise<boolean> {
  let changed = false;
  await runAction(label, async () => {
    const result = mutate();
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    waiterState.value = result.state;
    changed = true;
    await refreshActiveWaiterMvuBlocks(label);
    await onSuccess?.();
    writeUiMemorySnapshot(label);
    showToast(result.message);
  });
  if (changed) markAutoSaveDirty(label);
  return changed;
}

function openWaiterMenu(view: WaiterMenuView = waiterView.value) {
  waiterView.value = view;
  waiterMenuOpen.value = true;
  writeUiMemorySnapshot('打开服务员菜单');
  if (view === 'shift') completeTutorialAction('waiter-open-menu');
  if (view === 'growth') completeTutorialAction('waiter-open-growth');
  if (view === 'log') completeTutorialAction('waiter-open-log');
}

function closeWaiterMenu() {
  waiterMenuOpen.value = false;
  writeUiMemorySnapshot('关闭服务员菜单');
}

function selectWaiterAssignment(assignmentId: string) {
  if (!findWaiterAssignment(assignmentId)) {
    return;
  }
  waiterSelectedAssignmentId.value = assignmentId;
  writeUiMemorySnapshot('选择接待安排');
}

async function startWaiterShiftAction() {
  await runWaiterMutation(
    '服务员到岗',
    () => startWaiterShift(waiterState.value),
    () => {
      waiterMenuOpen.value = false;
      completeTutorialAction('waiter-start-shift');
    },
  );
}

async function restWaiterAction() {
  await runWaiterMutation(
    '服务员休息',
    () => restWaiter(waiterState.value),
    () => {
      waiterMenuOpen.value = false;
    },
  );
}

async function openWaiterServiceScene(assignmentId: string, line = '') {
  const assignment = findWaiterAssignment(assignmentId);
  if (!assignment) {
    showToast('Không tìm thấy lượt tiếp đón hiện tại');
    return;
  }
  waiterSelectedAssignmentId.value = assignment.id;
  const entryIds = _.uniq([
    'area.current',
    'project.current',
    'character.current-guest',
    ...makeWaiterProjectWorldbookEntryIds(assignment.project, assignment.area),
  ]);
  await openAirpScene({
    mode: '服务员',
    kind: 'story',
    speakerId: assignment.guestId,
    participantIds: [assignment.guestId],
    serviceId: assignment.id,
    projectId: makeTangquanSceneEntityId('project', assignment.project),
    assignmentId: assignment.id,
    title: `${assignment.guest} · ${assignment.project}`,
    note: `${assignment.area} · ${assignment.source}`,
    speaker: assignment.guest,
    line: line || assignment.opening || `${assignment.project} đã bắt đầu, tương tác cụ thể tiếp theo do bạn tự quyết định.`,
    placeholder: 'Nhập hành động hoặc câu trả lời của bạn trong lượt dịch vụ này...',
    scene: {
      地点: assignment.area,
      客人ID: assignment.guestId,
      客人: assignment.guest,
      当前项目: assignment.project,
      指名状态: assignment.source === '指名客' ? '已指名' : '未指名',
      服务状态: assignment.status,
    },
    entryIds,
    entryContentMap: makeWaiterServiceEntryContentMap(assignment.id),
    waiterBlockIds: ['waiter.service', 'waiter.growth'],
    waiterBlockContext: { assignmentId: assignment.id },
  });
}

async function startWaiterServiceAction(assignmentId: string) {
  await runWaiterMutation(
    '开始服务员接待',
    () => startWaiterService(waiterState.value, assignmentId),
    async () => {
      const assignment = findWaiterAssignment(assignmentId);
      if (assignment) {
        await openWaiterServiceScene(assignment.id);
        completeTutorialAction('waiter-start-service');
      }
    },
  );
}

async function continueWaiterServiceAirp() {
  const assignmentId = waiterState.value.currentService?.assignmentId;
  if (!assignmentId) {
    showToast('Hiện không có lượt tiếp đón nào đang diễn ra');
    return;
  }
  await openWaiterServiceScene(assignmentId, waiterState.value.dialogue.text);
}

async function finishWaiterServiceAction() {
  if (!(await confirmAction('Xác nhận kết thúc và kết toán dịch vụ hiện tại chứ? Chỉ tính các kết quả khách quan đã ghi nhận.', 'Kết thúc dịch vụ'))) {
    return;
  }
  let completed = false;
  await runAction('结束服务员接待', async () => {
    const assignmentId = waiterState.value.currentService?.assignmentId ?? '';
    await saveActiveWaiterMvuBlocks('服务结束前保存结果');
    const result = finishWaiterService(waiterState.value);
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    waiterState.value = result.state;
    waiterGenerationLinks.value = waiterGenerationLinks.value.filter(link => link.assignmentId !== assignmentId);
    await deactivateWaiterMvuBlocks('服务结束');
    await replaceTemporaryEntries([], '服务结束');
    await props.services.mvuRuntime.clearInteractionScene('服务员');
    airpState.value = null;
    airpInput.value = '';
    waiterSelectedAssignmentId.value =
      waiterState.value.assignments.find(item => item.status === '待接待')?.id ?? waiterSelectedAssignmentId.value;
    await syncWaiterMvuSnapshot();
    writeUiMemorySnapshot('服务结束');
    showToast(result.message);
    completed = true;
  });
  if (completed) markAutoSaveDirty('结束服务员接待');
}

async function buyWaiterOptionAction(key: WaiterInvestmentKey | WaiterRecoveryKey) {
  const cost = getWaiterInvestmentCost(waiterState.value, key);
  if (!(await confirmAction(`Xác nhận chi ${yuan(cost)} để thực hiện “${key}” chứ?`, 'Chi tiêu cá nhân'))) {
    return;
  }
  await runWaiterMutation('服务员个人消费', () => buyWaiterOption(waiterState.value, key));
}

async function settleWaiterDayAction() {
  if (!(await confirmAction('Xác nhận kết thúc ca hôm nay và tiến sang ngày tiếp theo chứ? Lương ngày và chi phí sinh hoạt sẽ được kết toán lần này.', 'Kết toán tan ca'))) {
    return;
  }
  const completed = await runWaiterMutation(
    '服务员下班结算',
    () => settleWaiterDay(waiterState.value),
    async () => {
      await deactivateWaiterMvuBlocks('下班结算');
      await replaceTemporaryEntries([], '下班结算');
      await props.services.mvuRuntime.clearInteractionScene('服务员');
      airpState.value = null;
      airpInput.value = '';
      waiterGenerationLinks.value = [];
      await requestWaiterDailyArrangement('服务员次日安排');
      waiterSelectedAssignmentId.value = waiterState.value.assignments[0]?.id ?? '';
      waiterView.value = 'shift';
      waiterMenuOpen.value = true;
      await syncWaiterMvuSnapshot();
    },
  );
  if (completed) {
    await requestAutoSave('服务员跨日流程完成', true);
  }
}

async function openWaiterBossTalk() {
  const assignmentFacts = makeWaiterAssignmentFacts(waiterState.value);
  const contentMap = {
    'area.current': [
      makeWaiterAreaEntryContent(waiterState.value),
      makeWaiterAssignmentFactsEntryContent(waiterState.value),
    ].join('\n'),
  };
  await openAirpScene({
    mode: '服务员',
    kind: 'dialogue',
    title: 'Nói chuyện với ông chủ',
    note: `${waiterState.value.location} · Đánh giá hiện tại ${waiterState.value.grade}`,
    speaker: 'Chủ tiệm',
    line: 'Ông chủ đang lắng nghe bạn nói.',
    placeholder: 'Nhập điều bạn muốn nói chuyện với ông chủ...',
    scene: {
      地点: waiterState.value.location,
      互动对象: '老板',
      服务状态: '谈话中',
      当日接待安排: assignmentFacts,
    },
    entryIds: ['area.current', ...makeWaiterAreaWorldbookEntryIds(waiterState.value.location)],
    entryContentMap: contentMap,
    waiterBlockIds: [],
    waiterBlockContext: {},
  });
}

async function openWaiterCoworkerTalk() {
  const coworkerName = 'Đồng nghiệp trong ca';
  await openAirpScene({
    mode: '服务员',
    kind: 'dialogue',
    title: 'Trò chuyện với đồng nghiệp',
    note: `${waiterState.value.location} · Trao đổi trong ca`,
    speaker: coworkerName,
    line: 'Đồng nghiệp dừng việc đang làm, chờ bạn nói tiếp.',
    placeholder: 'Nhập nội dung bạn muốn trò chuyện với đồng nghiệp...',
    scene: { 地点: waiterState.value.location, 互动对象: coworkerName, 服务状态: '交流中' },
    entryIds: [
      'area.current',
      'character.current-employee',
      ...makeWaiterAreaWorldbookEntryIds(waiterState.value.location),
    ],
    entryContentMap: {
      'area.current': makeWaiterAreaEntryContent(waiterState.value),
      'character.current-employee': makeWaiterCoworkerEntryContent(coworkerName, waiterState.value.location),
    },
    waiterBlockIds: [],
    waiterBlockContext: {},
  });
}

async function handleTitleMenu(key: TitleMenuKey) {
  if (key === 'start') {
    openModesPanel();
    return;
  }
  if (key === 'continue') {
    await continueGame();
    return;
  }
  if (key === 'load') {
    await openLoadPanel();
    return;
  }
  if (key === 'settings') {
    openSettingsPanel();
    return;
  }
}

function closeMobileTitlePanel() {
  if (activePanel.value === 'load' && savePanelContext.value === 'play') {
    returnToPlay();
    return;
  }
  activePanel.value = activePanel.value === 'profile' ? 'load' : 'landing';
  inspection.value = null;
  showSaveTools.value = false;
  writeUiMemorySnapshot('手机横屏返回上一层');
}

function openModesPanel() {
  activePage.value = 'home';
  modeSelectionReady.value = false;
  activePanel.value = 'modes';
  writeUiMemorySnapshot('打开游玩身份选择');
}

function selectMode(mode: Mode) {
  selectedMode.value = mode;
  modeSelectionReady.value = true;
  writeUiMemorySnapshot('选择游玩身份');
}

async function continueAfterMode() {
  if (!modeSelectionReady.value) {
    showToast('Vui lòng chọn thân phận chơi trước.');
    return;
  }
  await openLoadPanel('title');
  selectedSlotId.value =
    SAVE_SLOT_IDS.find(slotId => !slots.value.some(slot => slot.slotId === slotId)) ?? SAVE_SLOT_IDS[0];
}

async function openLoadPanel(context: SavePanelContext = 'title') {
  activePage.value = 'home';
  savePanelContext.value = context;
  await loadSlots();
  if (context === 'play') {
    if (currentTutorialStep.value?.action === 'waiter-open-save') {
      completeTutorialAction('waiter-open-save');
    } else {
      completeTutorialAction('open-save');
    }
  }
}

function returnToPlay() {
  if (runtime.value.activeMode === '未选择') {
    showToast('Hiện chưa có save nào đang chơi');
    activePanel.value = 'landing';
    return;
  }
  activePage.value = 'play';
  activePanel.value = 'landing';
  writeUiMemorySnapshot('返回游戏');
}

async function returnToTitle() {
  if (activePage.value === 'play' && activeMode.value === '服务员') {
    await runAction('返回标题前保存现场', async () => {
      await saveActiveWaiterMvuBlocks('返回标题前保存现场');
      markAutoSaveDirty('返回标题前服务员现场');
    });
  }
  if (activePage.value === 'play' && !(await forceAutoSaveBeforeTransition('返回标题前'))) {
    return;
  }
  if (activePage.value === 'play' && activeMode.value === '老板') {
    await runAction('返回标题', async () => {
      clearUiMemorySnapshot('返回标题');
      await deactivateBossMvuBlocks('返回标题');
      await replaceTemporaryEntries([], '返回标题');
      await disableModeWorldbookEntries('返回标题');
      airpState.value = null;
      airpInput.value = '';
      activePage.value = 'home';
      activePanel.value = 'landing';
      savePanelContext.value = 'title';
    });
    sceneHasUnsavedAiInteraction = false;
    return;
  }
  if (activePage.value === 'play' && activeMode.value === '游客') {
    await runAction('返回标题', async () => {
      clearUiMemorySnapshot('返回标题');
      await deactivateCustomerMvuBlocks('返回标题');
      await replaceTemporaryEntries([], '返回标题');
      await disableModeWorldbookEntries('返回标题');
      airpState.value = null;
      airpInput.value = '';
      customerMenuOpen.value = false;
      customerStoryOpen.value = false;
      activePage.value = 'home';
      activePanel.value = 'landing';
      savePanelContext.value = 'title';
    });
    sceneHasUnsavedAiInteraction = false;
    return;
  }
  if (activePage.value === 'play' && activeMode.value === '服务员') {
    await runAction('返回标题', async () => {
      clearUiMemorySnapshot('返回标题');
      await deactivateWaiterMvuBlocks('返回标题');
      await replaceTemporaryEntries([], '返回标题');
      await disableModeWorldbookEntries('返回标题');
      airpState.value = null;
      airpInput.value = '';
      waiterMenuOpen.value = false;
      activePage.value = 'home';
      activePanel.value = 'landing';
      savePanelContext.value = 'title';
    });
    sceneHasUnsavedAiInteraction = false;
    return;
  }
  activePage.value = 'home';
  activePanel.value = 'landing';
  savePanelContext.value = 'title';
  await disableModeWorldbookEntries('返回标题');
  clearUiMemorySnapshot('返回标题');
  writeUiMemorySnapshot('返回标题');
}

function openSettingsPanel() {
  activePage.value = 'home';
  activePanel.value = 'settings';
  writeUiMemorySnapshot('打开设置');
}

async function loadSlots() {
  await runAction('查看存档', async () => {
    slots.value = await props.services.save.listSlots();
    inspection.value = null;
    showSaveTools.value = false;
    activePanel.value = 'load';
    const fixedSlotCount = slots.value.filter(slot => SAVE_SLOT_IDS.includes(slot.slotId)).length;
    showToast(fixedSlotCount > 0 ? `Tìm thấy ${fixedSlotCount} save` : 'Hiện chưa có save');
  });
}

function openProfilePanel() {
  activePage.value = 'home';
  profileName.value = '';
  profileGenderKey.value = '男';
  profileGenderText.value = '';
  profileDescription.value = '';
  activePanel.value = 'profile';
  inspection.value = null;
  writeUiMemorySnapshot('打开人物设定');
}

function makeUserProfileInput(): TangquanUserProfileInput | null {
  const name = profileName.value.trim();
  if (!name) {
    showToast('Vui lòng điền tên');
    return null;
  }
  if (!profileGenderLabel.value) {
    showToast('Vui lòng điền giới tính');
    return null;
  }
  return {
    name,
    genderKey: profileGenderKey.value,
    genderText: profileGenderText.value.trim(),
    description: profileDescription.value.trim(),
  };
}

function selectedSlotTitle(): string {
  return (
    selectedSlotMeta.value?.label ||
    slotViews.value.find(slot => slot.id === selectedSlotId.value)?.label ||
    selectedSlotId.value
  );
}

function confirmAction(message: string, title = '确认操作'): Promise<boolean> {
  if (pendingConfirmResolve) {
    return Promise.resolve(false);
  }

  confirmState.value = { title, message };
  return new Promise(resolve => {
    pendingConfirmResolve = resolve;
  });
}

function resolveConfirm(value: boolean) {
  const resolve = pendingConfirmResolve;
  pendingConfirmResolve = null;
  confirmState.value = null;
  resolve?.(value);
}

async function startGame() {
  if (activePanel.value !== 'profile') {
    openProfilePanel();
    showToast('Hãy điền thông tin của bạn trước');
    return;
  }

  const userProfile = makeUserProfileInput();
  if (!userProfile) {
    return;
  }

  if (
    !(await confirmAction(
      selectedSlotMeta.value
        ? `Xác nhận ghi đè "${selectedSlotTitle()}" và bắt đầu game mới chứ? Save cũ sẽ bị thay thế; save đang chơi hiện tại sẽ được lưu trước.`
        : `Xác nhận bắt đầu game mới tại "${selectedSlotTitle()}" chứ? Save đang chơi hiện tại sẽ được lưu trước.`,
      'Bắt đầu game',
    ))
  ) {
    return;
  }

  if (!(await forceAutoSaveBeforeTransition('开始新游戏前'))) {
    return;
  }

  let startedMeta: TangquanSaveSlotMeta | null = null;
  await runAction('开始游戏', async () => {
    clearUiMemorySnapshot('开始新存档');
    if (runtime.value.activeMode === '老板') {
      await deactivateBossMvuBlocks('开始新存档');
      await replaceTemporaryEntries([], '开始新存档');
    } else if (runtime.value.activeMode === '游客') {
      await deactivateCustomerMvuBlocks('开始新存档');
      await replaceTemporaryEntries([], '开始新存档');
    } else if (runtime.value.activeMode === '服务员') {
      await deactivateWaiterMvuBlocks('开始新存档');
      await replaceTemporaryEntries([], '开始新存档');
    }
    const mode = selectedMode.value;
    activeUserGenderKey.value = userProfile.genderKey;
    activeUserName.value = userProfile.name;
    tutorialProgress.value = makeTutorialProgress(mode);
    const userInfo = {
      姓名: userProfile.name,
      性别: profileGenderLabel.value,
      性别选项: userProfile.genderKey,
      自设: userProfile.description,
    };
    const initialSaveData = props.services.runtime.makeInitialSaveData(mode, userInfo);
    _.set(initialSaveData, '前端数据.新手教程', _.cloneDeep(tutorialProgress.value));
    if (mode === '老板') {
      _.set(initialSaveData, '前端数据.老板页面', makeBossPageState(userProfile.genderKey === '女'));
      _.set(initialSaveData, '前端数据.变量块仓库', makeMvuBlockStore());
    } else if (mode === '游客') {
      _.set(initialSaveData, '前端数据.游客页面', makeCustomerPageState(new Date(), userProfile.genderKey === '女'));
      _.set(initialSaveData, '前端数据.游客变量块仓库', makeCustomerMvuBlockStore());
    } else if (mode === '服务员') {
      _.set(initialSaveData, '前端数据.服务员页面', makeWaiterPageState());
      _.set(initialSaveData, '前端数据.服务员变量块仓库', makeWaiterMvuBlockStore());
    }
    const meta = await props.services.save.startSlot(
      selectedSlotId.value,
      mode,
      `${mode}存档`,
      initialSaveData,
      userProfile,
    );
    startedMeta = meta;
    await props.services.runtime.prepareNewGame(mode, selectedSlotId.value);
    await refreshSlotsQuietly();
    activeMode.value = mode;
    if (mode === '老板') {
      const savedBossState = extractSavedBossState(initialSaveData);
      resetBossPageState(
        savedBossState ?? makeBossPageState(userProfile.genderKey === '女'),
        extractSavedMvuBlockStore(initialSaveData),
      );
      await syncBossMvuSnapshot();
    } else if (mode === '游客') {
      const savedCustomerState = extractSavedCustomerState(initialSaveData);
      resetCustomerPageState(
        savedCustomerState ?? makeCustomerPageState(new Date(), userProfile.genderKey === '女'),
        extractSavedCustomerMvuBlockStore(initialSaveData),
      );
      await requestCustomerDailyArrangement('游客首日安排');
      await syncCustomerMvuSnapshot();
    } else if (mode === '服务员') {
      const savedWaiterState = extractSavedWaiterState(initialSaveData);
      resetWaiterPageState(savedWaiterState ?? makeWaiterPageState(), extractSavedWaiterMvuBlockStore(initialSaveData));
      await requestWaiterDailyArrangement('服务员首日安排');
      await syncWaiterMvuSnapshot();
    }
    currentSlotLabel.value = meta.label;
    activePage.value = 'play';
    showToast('Đã bắt đầu');
  });
  if (startedMeta) {
    markAutoSaveClean('新存档初始条目建立完成', startedMeta.updatedAt);
    markAutoSaveDirty('新存档初始化流程完成');
    await requestAutoSave('新存档初始化完成', true);
    sceneHasUnsavedAiInteraction = false;
  }
}

async function loadSlot(slotId: string) {
  const currentRuntime = props.services.save.getRuntime();
  if (
    currentRuntime.activeSlotId &&
    currentRuntime.activeSlotId !== slotId &&
    !(await forceAutoSaveBeforeTransition(`切换到存档 ${slotId} 前`))
  ) {
    return;
  }
  let loadedMeta: TangquanSaveSlotMeta | null = null;
  await runAction('载入存档', async () => {
    clearUiMemorySnapshot('载入存档');
    if (runtime.value.activeMode === '老板') {
      await deactivateBossMvuBlocks('载入存档');
      await replaceTemporaryEntries([], '载入存档');
    } else if (runtime.value.activeMode === '游客') {
      await deactivateCustomerMvuBlocks('载入存档');
      await replaceTemporaryEntries([], '载入存档');
    } else if (runtime.value.activeMode === '服务员') {
      await deactivateWaiterMvuBlocks('载入存档');
      await replaceTemporaryEntries([], '载入存档');
    }
    const loaded = await props.services.save.loadSlot(slotId);
    loadedMeta = loaded.meta;
    if (loaded.meta.mode !== '未选择') {
      applyLoadedSaveToPlayView(loaded);
      await props.services.runtime.activateLoadedMode(loaded.meta.mode, loaded.meta.slotId);
      if (loaded.meta.mode === '老板') {
        await restoreBossSceneRuntime(airpState.value?.mode === '老板' ? airpState.value : null, '载入存档恢复现场');
      } else if (loaded.meta.mode === '游客') {
        await restoreCustomerSceneRuntime(
          airpState.value?.mode === '游客' ? airpState.value : null,
          '载入存档恢复现场',
        );
      } else if (loaded.meta.mode === '服务员') {
        await restoreWaiterSceneRuntime(
          airpState.value?.mode === '服务员' ? airpState.value : null,
          '载入存档恢复现场',
        );
      }
    }
    showToast('Đã nạp');
  });
  if (loadedMeta) {
    markAutoSaveClean('存档载入完成', loadedMeta.updatedAt);
    sceneHasUnsavedAiInteraction = false;
  }
}

async function loadSelectedSlot() {
  if (!selectedSlotMeta.value) {
    showToast('Save này chưa bắt đầu');
    return;
  }
  if (
    !(await confirmAction(
      `Xác nhận nạp "${selectedSlotTitle()}" chứ? Cuộc trò chuyện hiện tại sẽ chuyển sang save này; các save khác đang chơi sẽ được lưu trước.`,
      'Nạp save',
    ))
  ) {
    return;
  }
  await loadSlot(selectedSlotId.value);
}

async function saveSelectedSlot() {
  if (!(await confirmAction(`Xác nhận lưu tiến độ chơi hiện tại vào “${selectedSlotTitle()}” chứ?`, 'Lưu save'))) {
    return;
  }
  const tutorialBeforeSave = _.cloneDeep(tutorialProgress.value);
  const finishingTutorial = tutorialActive.value && currentTutorialStep.value?.action === 'save';
  if (finishingTutorial) {
    tutorialProgress.value = {
      ...tutorialProgress.value,
      active: false,
      completed: true,
      skipped: false,
    };
  }
  let saved = false;
  let savedMeta: TangquanSaveSlotMeta | null = null;
  await runAction('保存存档', async () => {
    if (activeMode.value === '老板') {
      await saveActiveBossMvuBlocks('保存存档');
    } else if (activeMode.value === '游客') {
      await saveActiveCustomerMvuBlocks('保存存档');
    } else if (activeMode.value === '服务员') {
      await saveActiveWaiterMvuBlocks('保存存档');
    }
    const meta = await props.services.save.saveCurrentAsSlot(
      selectedSlotId.value,
      selectedSlotMeta.value?.label,
      makeCurrentSaveDataPatch(),
    );
    await refreshSlotsQuietly();
    currentSlotLabel.value = meta.label;
    savedMeta = meta;
    inspection.value = null;
    saved = true;
    showToast('Đã lưu');
  });
  if (savedMeta) markAutoSaveClean('手动保存完成', savedMeta.updatedAt);
  if (!finishingTutorial) return;
  if (!saved) {
    tutorialProgress.value = tutorialBeforeSave;
    writeUiMemorySnapshot('新手引导存档失败');
    return;
  }
  writeUiMemorySnapshot('完成新手引导');
  showToast('Hướng dẫn tân thủ hoàn tất, tiến độ đã được lưu');
  returnToPlay();
}

async function deleteSelectedSlot() {
  if (!selectedSlotMeta.value) {
    showToast('Save này chưa bắt đầu');
    return;
  }
  if (!(await confirmAction(`Xác nhận xóa “${selectedSlotTitle()}” chứ? Sau khi xóa không thể khôi phục trực tiếp.`, 'Xóa save'))) {
    return;
  }
  let deletedActiveSlot = false;
  await runAction('删除存档', async () => {
    const deletingActiveSlot = runtime.value.activeSlotId === selectedSlotId.value;
    deletedActiveSlot = deletingActiveSlot;
    const deletingMode = runtime.value.activeMode === '未选择' ? activeMode.value : runtime.value.activeMode;
    await props.services.save.deleteSlot(selectedSlotId.value);
    if (deletingActiveSlot) {
      if (deletingMode === '老板') {
        await deactivateBossMvuBlocks('删除当前存档');
      } else if (deletingMode === '游客') {
        await deactivateCustomerMvuBlocks('删除当前存档');
      } else if (deletingMode === '服务员') {
        await deactivateWaiterMvuBlocks('删除当前存档');
      }
      await replaceTemporaryEntries([], '删除当前存档');
      await disableModeWorldbookEntries('删除当前存档');
      await props.services.presetOutputFormat.setFormat('none');
      await props.services.mvuRuntime.resetCommonStatData(deletingMode);
      airpState.value = null;
      resetScenePresentation(null);
      clearUiMemorySnapshot('删除当前存档');
      currentSlotLabel.value = '';
    }
    await refreshSlotsQuietly();
    inspection.value = null;
    showToast('Đã xóa');
  });
  if (deletedActiveSlot) {
    markAutoSaveClean('当前存档已删除');
    sceneHasUnsavedAiInteraction = false;
  }
}

async function inspectSelectedSlot() {
  if (!selectedSlotMeta.value) {
    showToast('Save này chưa bắt đầu');
    return;
  }
  if (!(await confirmAction(`Xác nhận kiểm tra “${selectedSlotTitle()}” chứ? Trong lúc kiểm tra vui lòng không thao tác trang.`, 'Kiểm tra save'))) {
    return;
  }
  await runAction('检查存档', async () => {
    inspection.value = await props.services.save.inspectSlot(selectedSlotId.value);
    showToast(inspection.value.ok ? 'Kiểm tra đạt' : 'Phát hiện bất thường');
  });
}

async function repairSelectedSlot() {
  if (!selectedSlotMeta.value) {
    showToast('Save này chưa bắt đầu');
    return;
  }
  if (!(await confirmAction(`Xác nhận sửa chữa “${selectedSlotTitle()}” chứ? Sửa chữa sẽ ghi lại thông tin chỉ mục của save này.`, 'Sửa chữa save'))) {
    return;
  }
  await runAction('修复存档', async () => {
    await props.services.save.repairSlot(selectedSlotId.value);
    await refreshSlotsQuietly();
    inspection.value = await props.services.save.inspectSlot(selectedSlotId.value);
    showToast(inspection.value.ok ? 'Đã sửa chữa' : 'Đã thử sửa chữa');
  });
}

async function exportSelectedSlot() {
  if (!selectedSlotMeta.value) {
    showToast('Save này chưa bắt đầu');
    return;
  }
  if (!(await confirmAction(`Xác nhận xuất “${selectedSlotTitle()}” chứ?`, 'Xuất save'))) {
    return;
  }
  await runAction('导出存档', async () => {
    const exported = await props.services.save.exportSlot(selectedSlotId.value);
    downloadText(exported.filename, exported.content, exported.mime);
    showToast('Đã xuất');
  });
}

function chooseImportFile() {
  importInput.value?.click();
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  input.value = '';
  if (!file) {
    return;
  }

  if (
    !(await confirmAction(`Xác nhận nhập “${file.name}” vào “${selectedSlotTitle()}” chứ? Việc này sẽ ghi đè save đã chọn.`, 'Nhập save'))
  ) {
    return;
  }

  await runAction('导入存档', async () => {
    const imported = await props.services.save.importSlot(selectedSlotId.value, await file.text());
    await refreshSlotsQuietly();
    selectedMode.value = imported.meta.mode === '未选择' ? selectedMode.value : imported.meta.mode;
    inspection.value = null;
    showToast('Đã nhập');
  });
}

async function refreshSlotsQuietly() {
  slots.value = await props.services.save.listSlots();
}

async function continueGame() {
  refreshRuntime();
  if (!runtime.value.activeSlotId) {
    showToast('Hiện chưa có save nào đang chơi');
    activePanel.value = 'landing';
    return;
  }
  if (
    !(await confirmAction(
      'Xác nhận tiếp tục save hiện tại chứ? Cuộc trò chuyện hiện tại sẽ chuyển sang save đang chơi; nội dung hiện tại nếu chưa lưu sẽ không được lưu riêng.',
      'Tiếp tục chơi',
    ))
  ) {
    return;
  }
  await loadSlot(runtime.value.activeSlotId);
}

function updateSetting(key: SettingKey, value: string) {
  settings.value = patchTangquanUiSettings({ [key]: value } as Partial<TangquanUiSettings>);
  props.services.log.info('设置', '显示设置已更新', { key, value });
  showToast('Cài đặt đã được lưu');
}

function makeProblemRecordContext() {
  const mode = activePage.value === 'play' ? activeMode.value : selectedMode.value;
  const modeState =
    mode === '老板'
      ? { date: bossState.value.日期, time: bossState.value.时间, location: bossState.value.地点 }
      : mode === '游客'
        ? { date: customerState.value.日期, time: customerState.value.时间, location: customerState.value.地点 }
        : { date: waiterState.value.dateText, time: waiterState.value.time, location: waiterState.value.location };
  return {
    page: activePage.value,
    panel: activePanel.value,
    mode,
    menuOpen: isPlayMenuVisible.value,
    menuView: mode === '老板' ? bossView.value : mode === '游客' ? customerView.value : waiterView.value,
    activeSlotId: runtime.value.activeSlotId,
    lastMessageId: getLastMessageId(),
    temporaryEntryIds: [...activeTemporaryEntryIds.value],
    scene: airpState.value
      ? { kind: airpState.value.kind, title: airpState.value.title, speaker: airpState.value.speaker }
      : null,
    ...modeState,
  };
}

function exportProblemRecord() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadText(
    `未开之花-问题记录-${timestamp}.json`,
    props.services.log.exportJson(makeProblemRecordContext()),
    'application/json',
  );
  showToast('Ghi chép sự cố đã được xuất');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || 'Thời gian không xác định';
  }
  return date.toLocaleString();
}

function formatMB(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 MB';
  }
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatDetail(detail: unknown) {
  if (typeof detail === 'string') {
    return detail;
  }
  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

async function restoreActivePlayViewFromRuntime() {
  refreshRuntime();
  if (!runtime.value.activeSlotId || runtime.value.activeMode === '未选择') {
    return;
  }

  try {
    const loaded = await props.services.save.readSlotData(runtime.value.activeSlotId);
    applyLoadedSaveToPlayView(loaded);
    if (loaded.meta.mode === '老板') {
      await props.services.worldbookRuntime.syncModeEntries('老板', loaded.meta.slotId);
      await restoreBossSceneRuntime(airpState.value?.mode === '老板' ? airpState.value : null, '界面重挂恢复老板现场');
    } else if (loaded.meta.mode === '游客') {
      await props.services.worldbookRuntime.syncModeEntries('游客', loaded.meta.slotId);
      await restoreCustomerSceneRuntime(
        airpState.value?.mode === '游客' ? airpState.value : null,
        '界面重挂恢复游客现场',
      );
    } else if (loaded.meta.mode === '服务员') {
      await props.services.worldbookRuntime.syncModeEntries('服务员', loaded.meta.slotId);
      await restoreWaiterSceneRuntime(
        airpState.value?.mode === '服务员' ? airpState.value : null,
        '界面重挂恢复服务员现场',
      );
    }
    props.services.log.info('Vue前端', '已从当前存档恢复游玩界面', {
      slotId: loaded.meta.slotId,
      mode: loaded.meta.mode,
    });
  } catch (error) {
    currentSlotLabel.value = 'Save hiện tại';
    props.services.log.warn('Vue前端', '恢复当前游玩界面失败，保留标题页', String(error));
  } finally {
    refreshRuntime();
  }
}

defineExpose({
  inspectAutoSave: (): TangquanAutoSaveSnapshot => autoSave.inspect(),
  markAutoSaveDirty: (reason: string) => markAutoSaveDirty(reason),
  requestAutoSave: (reason: string, force = false) => requestAutoSave(reason, force),
});

onMounted(() => {
  bindMobileViewport();
  bindBrowserFullscreen();
  bindAutoSaveActivity();
  startCustomerChatEventSync();
  startChatMutationSync();
  props.services.log.info('Vue前端', '主界面已挂载');
  refreshRuntime();
  tickRealTime();
  realTimeTimer = window.setInterval(tickRealTime, 1000);
  void (async () => {
    if (await restoreUiMemorySnapshot()) {
      await syncCustomerGeneratedResults('界面重挂校验', -1);
      await syncWaiterGeneratedResults('界面重挂校验');
      refreshRuntime();
      if (runtime.value.activeSlotId) markAutoSaveClean('界面重挂恢复完成');
      return;
    }
    if (runtime.value.activeSlotId) {
      currentSlotLabel.value = 'Save hiện tại';
      await restoreActivePlayViewFromRuntime();
      await syncCustomerGeneratedResults('存档恢复楼层校验', -1);
      await syncWaiterGeneratedResults('存档恢复楼层校验');
      writeUiMemorySnapshot('从存档恢复界面');
    } else {
      writeUiMemorySnapshot('初始挂载');
    }
    if (runtime.value.activeSlotId) markAutoSaveClean('界面挂载基线完成');
  })();
});

onBeforeUnmount(() => {
  autoSave.dispose();
  unbindAutoSaveActivity();
  void exitBrowserFullscreen();
  unbindBrowserFullscreen();
  unbindMobileViewport();
  void props.services.presetOutputFormat.setFormat('none', '界面卸载');
  const eventWindow = window as Window & { __tqCustomerChatEventStops?: Array<() => void> };
  window.clearTimeout(customerChatSyncTimer);
  customerChatSyncTimer = 0;
  window.clearTimeout(waiterChatSyncTimer);
  waiterChatSyncTimer = 0;
  window.clearTimeout(bossChatSyncTimer);
  bossChatSyncTimer = 0;
  window.clearTimeout(postRemountMvuSyncTimer);
  postRemountMvuSyncTimer = 0;
  window.clearTimeout(chatDomSyncTimer);
  chatDomSyncTimer = 0;
  scheduledBackgroundSyncs.clear();
  window.clearInterval(realTimeTimer);
  realTimeTimer = 0;
  chatMutationObserver?.disconnect();
  chatMutationObserver = null;
  customerChatEventStops.splice(0).forEach(stop => stop());
  if (eventWindow.__tqCustomerChatEventStops === customerChatEventStops) {
    delete eventWindow.__tqCustomerChatEventStops;
  }
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

button {
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.52;
}

.tutorial-active button:not(.tutorial-target):not(.fullscreen-button),
.tutorial-active input:not(.tutorial-target),
.tutorial-active textarea:not(.tutorial-target),
.tutorial-active select:not(.tutorial-target),
.tutorial-active :deep(button:not(.tutorial-target):not(.fullscreen-button)),
.tutorial-active :deep(input:not(.tutorial-target)),
.tutorial-active :deep(textarea:not(.tutorial-target)),
.tutorial-active :deep(select:not(.tutorial-target)) {
  pointer-events: none !important;
}

.tutorial-active .tutorial-target,
.tutorial-active :deep(.tutorial-target) {
  position: relative;
  z-index: 72;
  pointer-events: auto !important;
  outline: 2px solid rgba(233, 195, 119, 0.92);
  outline-offset: 4px;
  box-shadow:
    0 0 0 7px rgba(215, 179, 109, 0.16),
    0 0 32px rgba(215, 179, 109, 0.42);
  animation: tutorial-pulse 1.4s ease-in-out infinite;
}

.tutorial-active .tutorial-focus {
  position: relative;
  z-index: 72;
  pointer-events: none;
  outline: 2px solid rgba(233, 195, 119, 0.92);
  outline-offset: 4px;
  box-shadow:
    0 0 0 7px rgba(215, 179, 109, 0.16),
    0 0 32px rgba(215, 179, 109, 0.42);
  animation: tutorial-pulse 1.4s ease-in-out infinite;
}

@keyframes tutorial-pulse {
  50% {
    outline-color: rgba(128, 170, 156, 0.96);
    box-shadow:
      0 0 0 10px rgba(128, 170, 156, 0.12),
      0 0 36px rgba(128, 170, 156, 0.38);
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.title-screen,
.play-screen {
  --ink: #0b0806;
  --text: #f7ecdc;
  --muted: rgba(247, 236, 220, 0.66);
  --dim: rgba(247, 236, 220, 0.42);
  --line: rgba(247, 236, 220, 0.2);
  --line-strong: rgba(247, 236, 220, 0.42);
  --gold: #d7b36d;
  --tea: #80aa9c;
  --amber: #b87955;
  --rose: #c78875;
  --blue: #88a9b4;
  position: relative;
  width: min(100vw, 1366px, calc(100vh * 16 / 9));
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  overflow: hidden;
  color: var(--text);
  background: var(--ink);
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  letter-spacing: 0;
  isolation: isolate;
  user-select: none;
}

.title-screen.is-browser-fullscreen,
.play-screen.is-browser-fullscreen {
  width: min(100vw, calc(100vh * 16 / 9));
  max-width: none;
}

.title-screen {
  --ui-font-scale: 1;
  --panel-opacity: 0.62;
}

.title-screen[data-font-size='small'] {
  --ui-font-scale: 0.92;
}

.title-screen[data-font-size='large'] {
  --ui-font-scale: 1.08;
}

.title-screen[data-font-size='xlarge'] {
  --ui-font-scale: 1.18;
}

.title-screen[data-font-family='elegant'] {
  font-family: 'LXGW WenKai', 'KaiTi', 'STKaiti', 'Microsoft YaHei', serif;
}

.title-screen[data-font-family='clear'] {
  font-family: 'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
}

.title-screen[data-layout='compact'] .main-menu {
  gap: 0.86rem;
}

.title-screen[data-layout='wide'] .main-menu {
  gap: 1.46rem;
}

.title-screen[data-panel='clear'] {
  --panel-opacity: 0.76;
}

.title-screen[data-panel='soft'] {
  --panel-opacity: 0.48;
}

.title-bg,
.scene-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  transition:
    filter 220ms ease,
    transform 220ms ease;
}

.title-bg {
  filter: saturate(0.82) contrast(1.04) brightness(0.68);
}

.scene-bg {
  filter: saturate(0.86) contrast(1.04) brightness(0.72);
}

.vignette,
.mist,
.rain-lines,
.shade,
.steam,
.hud-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.vignette {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(5, 4, 3, 0.88), rgba(5, 4, 3, 0.18) 42%, rgba(5, 4, 3, 0.7)),
    linear-gradient(180deg, rgba(5, 4, 3, 0.22), rgba(5, 4, 3, 0.1) 48%, rgba(5, 4, 3, 0.78));
  transition: background 180ms ease;
}

.title-screen.panel-open .vignette {
  background:
    linear-gradient(90deg, rgba(5, 4, 3, 0.9), rgba(5, 4, 3, 0.26) 42%, rgba(5, 4, 3, 0.82)),
    linear-gradient(180deg, rgba(5, 4, 3, 0.26), rgba(5, 4, 3, 0.22) 45%, rgba(5, 4, 3, 0.9));
}

.mist {
  z-index: 2;
  opacity: 0.32;
  background:
    radial-gradient(ellipse at 30% 78%, rgba(255, 233, 199, 0.28), transparent 26rem),
    radial-gradient(ellipse at 68% 64%, rgba(133, 169, 158, 0.16), transparent 22rem);
  animation: mistMove 8s ease-in-out infinite alternate;
}

@keyframes mistMove {
  from {
    transform: translateY(8px);
    opacity: 0.24;
  }
  to {
    transform: translateY(-8px);
    opacity: 0.38;
  }
}

.rain-lines {
  z-index: 3;
  opacity: 0.28;
  mix-blend-mode: screen;
}

.top-name {
  position: absolute;
  top: 2.6rem;
  left: 3.4rem;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(247, 236, 220, 0.82);
  font-size: 1rem;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.7);
}

.top-name::before,
.top-name::after {
  content: '';
  width: 1.2rem;
  height: 1.2rem;
  border-top: 2px solid var(--muted);
  border-left: 2px solid var(--muted);
  transform: rotate(-45deg);
}

.top-name::after {
  transform: rotate(135deg);
}

.title-copy {
  position: absolute;
  left: 6%;
  bottom: 16%;
  z-index: 5;
  max-width: 28rem;
  text-shadow: 0 7px 28px rgba(0, 0, 0, 0.7);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.title-screen.panel-open .title-copy {
  opacity: 0;
  transform: translateY(-1.4rem) scale(0.98);
  pointer-events: none;
}

.title-copy small {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--muted);
  font-size: 0.82rem;
}

.title-copy small::before {
  content: '';
  width: 2.4rem;
  height: 1px;
  background: var(--gold);
}

h1 {
  margin: 0.7rem 0 0;
  font-family: 'Yu Mincho', 'Songti SC', 'SimSun', serif;
  font-size: clamp(3.2rem, 7vw, 6.4rem);
  font-weight: 500;
  line-height: 0.92;
  letter-spacing: 0;
}

.subtitle {
  margin: 1.2rem 0 0;
  max-width: 24rem;
  color: rgba(247, 236, 220, 0.74);
  font-size: calc(0.95rem * var(--ui-font-scale));
  line-height: 1.8;
}

.main-menu {
  position: absolute;
  top: 34%;
  right: 6.4%;
  z-index: 8;
  display: grid;
  gap: 1.18rem;
  min-width: 10rem;
}

.title-screen.panel-open .menu-button {
  color: rgba(247, 236, 220, 0.46);
}

.title-screen.panel-open .menu-button:hover,
.title-screen.panel-open .menu-button.is-active {
  color: #fff3e0;
}

.menu-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.9rem;
  padding: 0;
  background: transparent;
  color: rgba(247, 236, 220, 0.72);
  font-size: calc(1.18rem * var(--ui-font-scale));
  text-align: left;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.76);
}

.menu-button::after {
  content: '';
  width: 2.5rem;
  height: 1px;
  margin-left: 1.1rem;
  background: currentColor;
  opacity: 0;
  transform: scaleX(0.3);
  transform-origin: right;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.menu-button:hover,
.menu-button.is-active {
  color: #fff5e6;
}

.menu-button:hover::after,
.menu-button.is-active::after {
  opacity: 0.8;
  transform: scaleX(1);
}

.continue-pill {
  position: absolute;
  left: 50%;
  bottom: 9%;
  z-index: 6;
  min-width: 18rem;
  padding: 0.74rem 2.8rem;
  border: 1px solid rgba(247, 236, 220, 0.32);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(247, 236, 220, 0.55);
  font-size: calc(1rem * var(--ui-font-scale));
  text-align: center;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.title-screen.panel-open .continue-pill {
  opacity: 0;
  transform: translateX(-50%) translateY(0.8rem);
  pointer-events: none;
}

.mode-dock,
.floating-list {
  position: absolute;
  z-index: 12;
  display: none;
}

.mode-dock.is-open,
.floating-list.is-open {
  display: block;
}

.mode-dock {
  left: 6%;
  right: 29%;
  bottom: 6.4%;
}

.mode-title,
.floating-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.82rem;
  color: var(--muted);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.75);
}

.mode-title h2,
.floating-title h2 {
  margin: 0;
  color: #fff3e0;
  font-size: calc(1.12rem * var(--ui-font-scale));
  font-weight: 500;
}

.mode-title p,
.floating-title p {
  margin: 0.25rem 0 0;
  font-size: calc(0.78rem * var(--ui-font-scale));
}

.enter-button {
  min-width: 5.4rem;
  min-height: 2rem;
  border: 1px solid rgba(247, 236, 220, 0.28);
  border-radius: 999px;
  background: rgba(8, 6, 5, 0.36);
  color: rgba(247, 236, 220, 0.76);
  font-size: calc(1rem * var(--ui-font-scale));
  backdrop-filter: blur(10px);
}

.mode-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.mode-ribbon {
  position: relative;
  min-height: 6.35rem;
  padding: 0.9rem 1.05rem 0.9rem 4.35rem;
  background: linear-gradient(90deg, rgba(9, 7, 6, var(--panel-opacity)), rgba(9, 7, 6, 0.2));
  color: rgba(247, 236, 220, 0.78);
  text-align: left;
  backdrop-filter: blur(10px);
  clip-path: polygon(0 0, calc(100% - 1.2rem) 0, 100% 50%, calc(100% - 1.2rem) 100%, 0 100%, 0.9rem 50%);
}

.mode-ribbon::before,
.mode-ribbon::after,
.save-slot-ribbon::before,
.save-slot-ribbon::after {
  content: '';
  position: absolute;
  left: 1.1rem;
  right: 1.4rem;
  height: 1px;
  background: linear-gradient(90deg, rgba(212, 176, 110, 0.8), transparent);
}

.mode-ribbon::before,
.save-slot-ribbon::before {
  top: 0;
}

.mode-ribbon::after,
.save-slot-ribbon::after {
  bottom: 0;
}

.mode-ribbon:hover,
.mode-ribbon.is-selected,
.save-slot-ribbon:hover,
.save-slot-ribbon.is-selected {
  color: #fff5e6;
  background: linear-gradient(90deg, rgba(74, 47, 30, 0.68), rgba(9, 7, 6, 0.25));
}

.mode-mark {
  position: absolute;
  left: 1.14rem;
  top: 0.86rem;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--gold);
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 1.35rem;
}

.mode-mark svg {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.mode-ribbon h3 {
  margin: 0;
  font-size: calc(1.05rem * var(--ui-font-scale));
  font-weight: 500;
}

.mode-ribbon p,
.floating-item p {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: calc(0.78rem * var(--ui-font-scale));
  line-height: 1.58;
}

.floating-list {
  left: 6%;
  right: 36%;
  bottom: 9%;
  max-height: 72%;
  overflow: auto;
}

.floating-list.is-settings {
  right: 40%;
  bottom: 8%;
  max-width: 42rem;
}

.save-list {
  right: 29%;
  bottom: 5.6%;
}

.profile-list {
  right: 33%;
  bottom: 6%;
  max-width: 46rem;
}

.save-slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.save-slot-ribbon {
  position: relative;
  min-height: 5.6rem;
  padding: 0.68rem 0.78rem 0.68rem 1rem;
  background: linear-gradient(90deg, rgba(9, 7, 6, var(--panel-opacity)), rgba(9, 7, 6, 0.2));
  color: rgba(247, 236, 220, 0.76);
  text-align: left;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.save-slot-ribbon.is-active {
  box-shadow: inset 0 0 0 1px rgba(120, 166, 154, 0.55);
}

.save-slot-ribbon.is-empty {
  color: rgba(247, 236, 220, 0.48);
}

.save-slot-ribbon span,
.save-slot-ribbon strong,
.save-slot-ribbon small,
.save-slot-ribbon em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-slot-ribbon span {
  color: rgba(212, 176, 110, 0.78);
  font-size: 0.72rem;
}

.save-slot-ribbon strong {
  margin-top: 0.32rem;
  color: currentColor;
  font-size: 0.9rem;
  font-weight: 500;
}

.save-slot-ribbon small,
.save-slot-ribbon em {
  margin-top: 0.24rem;
  color: var(--muted);
  font-size: 0.7rem;
  font-style: normal;
}

.slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-top: 0.72rem;
}

.slot-actions.compact {
  justify-content: end;
  margin-top: 0;
}

.settings-panel {
  display: grid;
  gap: 0.72rem;
}

.profile-form {
  display: grid;
  gap: 0.86rem;
  padding: 0.1rem 0 0.2rem;
}

.profile-field {
  display: grid;
  gap: 0.42rem;
  color: rgba(247, 236, 220, 0.78);
}

.profile-field > span {
  color: rgba(212, 176, 110, 0.82);
  font-size: calc(0.78rem * var(--ui-font-scale));
}

.profile-input,
.profile-textarea {
  width: 100%;
  border: 1px solid rgba(247, 236, 220, 0.2);
  border-radius: 0;
  background: linear-gradient(90deg, rgba(9, 7, 6, var(--panel-opacity)), rgba(9, 7, 6, 0.26));
  color: rgba(247, 236, 220, 0.9);
  font: inherit;
  font-size: calc(0.86rem * var(--ui-font-scale));
  line-height: 1.65;
  outline: none;
  backdrop-filter: blur(8px);
}

.profile-input {
  min-height: 2.45rem;
  padding: 0.34rem 0.72rem;
}

.profile-textarea {
  min-height: 10.4rem;
  resize: vertical;
  padding: 0.68rem 0.78rem;
}

.profile-input::placeholder,
.profile-textarea::placeholder {
  color: rgba(247, 236, 220, 0.36);
}

.profile-input:focus,
.profile-textarea:focus {
  border-color: rgba(212, 176, 110, 0.62);
  box-shadow: inset 0 0 0 1px rgba(212, 176, 110, 0.2);
}

.settings-row {
  display: grid;
  grid-template-columns: minmax(6.2rem, 0.72fr) minmax(0, 1.6fr);
  gap: 0.9rem;
  padding: 0.76rem 0;
  border-top: 1px dotted rgba(247, 236, 220, 0.26);
}

.settings-row:last-child {
  border-bottom: 1px dotted rgba(247, 236, 220, 0.26);
}

.settings-label strong {
  display: block;
  color: rgba(255, 243, 224, 0.9);
  font-size: calc(0.92rem * var(--ui-font-scale));
  font-weight: 500;
}

.settings-label span {
  display: block;
  margin-top: 0.28rem;
  color: rgba(247, 236, 220, 0.48);
  font-size: calc(0.72rem * var(--ui-font-scale));
  line-height: 1.45;
}

.settings-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.42rem;
}

.setting-choice {
  min-height: 1.9rem;
  padding: 0.32rem 0.78rem;
  border: 1px solid rgba(247, 236, 220, 0.2);
  border-radius: 999px;
  background: rgba(8, 6, 5, 0.32);
  color: rgba(247, 236, 220, 0.62);
  font-size: calc(0.78rem * var(--ui-font-scale));
  backdrop-filter: blur(8px);
}

.setting-choice:hover,
.setting-choice.is-selected,
.setting-choice.is-primary {
  border-color: rgba(212, 176, 110, 0.62);
  background: rgba(74, 47, 30, 0.46);
  color: #fff3e0;
}

.floating-item,
.inspection-strip {
  padding: 0.82rem 0;
  border-top: 1px dotted rgba(247, 236, 220, 0.28);
  color: rgba(247, 236, 220, 0.82);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.72);
}

.floating-item:last-child {
  border-bottom: 1px dotted rgba(247, 236, 220, 0.28);
}

.floating-item h3 {
  margin: 0;
  font-size: calc(1rem * var(--ui-font-scale));
  font-weight: 500;
}

.inspection-strip pre {
  max-height: 6rem;
  overflow: auto;
  margin: 0.4rem 0 0;
  color: var(--muted);
  white-space: pre-wrap;
}

.inspection-strip {
  margin-top: 0.72rem;
}

.inspection-strip[data-ok='true'] {
  color: #dff5ea;
}

.inspection-strip[data-ok='false'] {
  color: #ffd2c6;
}

.inspection-strip article {
  display: grid;
  grid-template-columns: 3.6rem minmax(0, 1fr);
  gap: 0.4rem;
  padding-top: 0.5rem;
}

.inspection-strip header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.inspection-strip p {
  margin: 0;
}

.confirm-layer {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1rem;
  color: #f7ecdc;
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  letter-spacing: 0;
}

.confirm-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 42%, rgba(212, 176, 110, 0.16), transparent 32%), rgba(7, 6, 5, 0.72);
  backdrop-filter: blur(10px);
}

.confirm-dialog {
  position: relative;
  width: min(520px, calc(100vw - 42px));
  max-height: calc(100% - 2rem);
  overflow: auto;
  padding: 1.35rem 1.45rem 1.25rem;
  border: 1px solid rgba(247, 236, 220, 0.28);
  background:
    linear-gradient(135deg, rgba(9, 7, 6, 0.92), rgba(37, 25, 18, 0.78)),
    radial-gradient(circle at 100% 0, rgba(120, 166, 154, 0.18), transparent 34%);
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.48),
    inset 0 0 0 1px rgba(212, 176, 110, 0.12);
}

.confirm-dialog::before,
.confirm-dialog::after {
  content: '';
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 176, 110, 0.68), transparent);
}

.confirm-dialog::before {
  top: 0.72rem;
}

.confirm-dialog::after {
  bottom: 0.72rem;
}

.confirm-dialog small {
  display: block;
  margin-bottom: 0.28rem;
  color: rgba(212, 176, 110, 0.82);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.confirm-dialog h2 {
  margin: 0;
  font-size: 1.24rem;
  font-weight: 600;
}

.confirm-dialog p {
  margin: 0.72rem 0 1.05rem;
  color: rgba(247, 236, 220, 0.76);
  font-size: 0.9rem;
  line-height: 1.7;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.72rem;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 4.5%;
  z-index: 40;
  padding: 0.56rem 1rem;
  border-radius: 999px;
  background: rgba(8, 6, 5, 0.68);
  color: rgba(247, 236, 220, 0.86);
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
  pointer-events: none;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  backdrop-filter: blur(10px);
}

.toast.is-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.shade {
  z-index: 1;
  background:
    radial-gradient(circle at 52% 42%, rgba(255, 222, 180, 0.16), transparent 23rem),
    linear-gradient(90deg, rgba(5, 4, 3, 0.72), rgba(5, 4, 3, 0.12) 50%, rgba(5, 4, 3, 0.64)),
    linear-gradient(180deg, rgba(5, 4, 3, 0.16), rgba(5, 4, 3, 0.7));
}

.steam {
  z-index: 2;
  opacity: 0.34;
  background:
    radial-gradient(ellipse at 34% 78%, rgba(255, 236, 204, 0.2), transparent 19rem),
    radial-gradient(ellipse at 72% 70%, rgba(128, 170, 156, 0.16), transparent 18rem);
  animation: steamMove 8s ease-in-out infinite alternate;
}

.hud-lines {
  z-index: 3;
  opacity: 0.32;
}

.corner-brand {
  position: absolute;
  top: 2rem;
  left: 2.25rem;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 0.72rem;
  color: rgba(247, 236, 220, 0.84);
  text-shadow: 0 5px 16px rgba(0, 0, 0, 0.74);
}

.brand-seal {
  display: block;
  width: 2.2rem;
  height: 2.2rem;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.42));
}

.brand-text strong,
.brand-text span {
  display: block;
}

.brand-text strong {
  font-weight: 500;
}

.brand-text span {
  color: var(--muted);
  font-size: 0.76rem;
}

.left-rail {
  position: absolute;
  top: 7.6rem;
  left: 2.25rem;
  z-index: 8;
  width: 10.8rem;
}

.identity-plaque {
  margin-bottom: 1.4rem;
  padding: 0.9rem 1rem 1.1rem;
  background: linear-gradient(180deg, rgba(21, 24, 43, 0.72), rgba(16, 16, 28, 0.52));
  color: #fff3e1;
  text-align: center;
  clip-path: polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%);
  backdrop-filter: blur(10px);
}

.play-screen[data-play-mode='游客'] .identity-plaque {
  background: linear-gradient(180deg, rgba(43, 34, 54, 0.72), rgba(22, 18, 31, 0.52));
}

.play-screen[data-play-mode='服务员'] .identity-plaque {
  background: linear-gradient(180deg, rgba(28, 39, 54, 0.76), rgba(17, 24, 34, 0.54));
}

.identity-plaque b {
  display: block;
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 2.4rem;
  font-weight: 500;
  line-height: 1;
}

.identity-plaque span {
  display: block;
  margin-top: 0.3rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.status-slip {
  display: grid;
  grid-template-columns: 2rem 1fr;
  align-items: center;
  min-height: 2.45rem;
  margin-bottom: 0.7rem;
  background: linear-gradient(90deg, rgba(17, 19, 32, 0.72), rgba(17, 19, 32, 0.34));
  color: rgba(247, 236, 220, 0.86);
  box-shadow: inset 0 0 0 1px rgba(247, 236, 220, 0.16);
  backdrop-filter: blur(8px);
}

.status-slip svg {
  width: 1.1rem;
  height: 1.1rem;
  margin: auto;
  opacity: 0.86;
}

.status-slip strong {
  padding-right: 0.6rem;
  text-align: right;
  font-size: 0.95rem;
  font-weight: 500;
}

.top-center {
  position: absolute;
  top: 1.8rem;
  left: 50%;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: rgba(247, 236, 220, 0.86);
  transform: translateX(-50%);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
}

.gem {
  width: 0.7rem;
  height: 0.7rem;
  background: linear-gradient(135deg, #fff2df, #d89a8f);
  transform: rotate(45deg);
}

.top-icons {
  position: absolute;
  top: 1.8rem;
  right: 2rem;
  z-index: 30;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.hostess-picker-layer {
  position: fixed;
  inset: 0;
  z-index: 118;
  display: grid;
  place-items: center;
  padding: 24px;
  color: #f7ecdc;
  background: rgba(12, 8, 6, 0.82);
  backdrop-filter: blur(10px);
}

.hostess-picker-dialog {
  width: min(920px, 100%);
  max-height: min(760px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid rgba(222, 188, 137, 0.45);
  border-radius: 22px;
  background: linear-gradient(155deg, rgba(72, 47, 34, 0.98), rgba(25, 18, 15, 0.99));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
}

.hostess-picker-dialog header {
  padding: 24px 28px 16px;
  text-align: center;
}

.hostess-picker-dialog header small {
  color: #d8b881;
  letter-spacing: 0.16em;
}

.hostess-picker-dialog header h2 {
  margin: 7px 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 26px;
}

.hostess-picker-dialog header p {
  margin: 0;
  color: rgba(247, 236, 220, 0.68);
  font-size: 13px;
}

.hostess-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 10px;
  max-height: 570px;
  overflow-y: auto;
  padding: 8px 24px 26px;
}

.hostess-picker-grid button {
  display: grid;
  place-items: center;
  gap: 5px;
  min-height: 128px;
  padding: 12px 8px;
  border: 1px solid rgba(222, 188, 137, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #f7ecdc;
  cursor: pointer;
}

.hostess-picker-grid button:hover {
  border-color: rgba(222, 188, 137, 0.68);
  background: rgba(222, 188, 137, 0.12);
}

.hostess-picker-grid img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.hostess-picker-grid span {
  color: rgba(247, 236, 220, 0.48);
  font-size: 11px;
}

.shell-window-actions {
  position: absolute;
  top: 2.35rem;
  right: 3.2rem;
  z-index: 30;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.icon-button {
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  background: transparent;
  color: rgba(247, 236, 220, 0.74);
}

.icon-button:hover {
  color: #fff7e8;
}

.fullscreen-button[aria-pressed='true'] {
  color: #fff7e8;
}

.icon-button svg {
  width: 1.45rem;
  height: 1.45rem;
}

.sprite-spot {
  position: absolute;
  left: 43%;
  right: 26%;
  bottom: 7%;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: end;
  pointer-events: none;
}

.sprite-spot img {
  width: min(22rem, 100%);
  height: auto;
  filter: drop-shadow(0 26px 34px rgba(0, 0, 0, 0.55));
}

.right-actions {
  position: absolute;
  top: 30%;
  right: 3.2rem;
  z-index: 9;
  display: grid;
  gap: 0.85rem;
  width: 12rem;
}

.action-pill {
  display: grid;
  grid-template-columns: 1fr 2.7rem;
  align-items: center;
  min-height: 2.85rem;
  padding-left: 1.2rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(8, 6, 5, 0.7), rgba(8, 6, 5, 0.34));
  color: rgba(247, 236, 220, 0.78);
  text-align: left;
  backdrop-filter: blur(8px);
}

.action-pill:hover {
  color: #fff7e8;
  background: linear-gradient(90deg, rgba(81, 51, 34, 0.76), rgba(8, 6, 5, 0.38));
}

.action-pill svg {
  width: 1.6rem;
  height: 1.6rem;
  opacity: 0.72;
}

.mode-menu .scene-bg {
  filter: saturate(0.68) contrast(0.96) brightness(0.46) blur(5px);
  transform: scale(1.04);
}

.sprite-spot,
.corner-brand,
.left-rail,
.dialogue {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.mode-menu .sprite-spot,
.mode-menu .corner-brand,
.mode-menu .left-rail,
.mode-menu .right-actions,
.mode-menu .dialogue {
  opacity: 0;
  pointer-events: none;
}

.mode-menu .sprite-spot,
.mode-menu .corner-brand,
.mode-menu .left-rail,
.mode-menu .dialogue {
  transform: translateY(1.1rem);
}

.menu-layer {
  position: absolute;
  inset: 0;
  z-index: 22;
  display: none;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 5.4rem 4.6rem 4.2rem;
}

.mode-menu .menu-layer {
  display: grid;
  grid-template-columns: 11rem minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
  gap: 2.2rem;
}

.menu-tabs {
  min-height: 0;
  align-self: center;
  display: grid;
  gap: 0.82rem;
}

.menu-tab {
  position: relative;
  min-height: 2.15rem;
  padding: 0 0 0 1rem;
  background: transparent;
  color: rgba(247, 236, 220, 0.62);
  text-align: left;
}

.menu-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.4rem;
  bottom: 0.4rem;
  width: 3px;
  background: var(--tea);
  opacity: 0.35;
}

.menu-tab::after {
  content: '';
  position: absolute;
  left: 4.8rem;
  right: 0;
  top: 50%;
  border-top: 1px dotted rgba(247, 236, 220, 0.22);
}

.menu-tab:hover,
.menu-tab.is-active {
  color: #fff7e8;
}

.menu-tab.is-active::before {
  opacity: 1;
}

.menu-main {
  min-width: 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  align-self: stretch;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 0.2rem 0 0;
  background: linear-gradient(90deg, rgba(7, 5, 4, 0.28), rgba(7, 5, 4, 0.08));
  backdrop-filter: blur(12px);
}

.menu-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0 0.85rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.22);
}

.menu-head h2 {
  margin: 0;
  color: #fff3e0;
  font-size: 1.45rem;
  font-weight: 500;
}

.menu-head p {
  margin: 0.3rem 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.close-button,
.small-button,
.choice-button {
  min-height: 2rem;
  padding: 0 0.78rem;
  border: 1px solid rgba(247, 236, 220, 0.18);
  border-radius: 999px;
  background: rgba(7, 5, 4, 0.28);
  color: rgba(247, 236, 220, 0.72);
  backdrop-filter: blur(8px);
}

.close-button:hover,
.small-button:hover,
.choice-button:hover {
  border-color: var(--line-strong);
  color: #fff7e8;
}

.inline-action {
  min-height: 1.5rem;
  margin-left: 0.5rem;
  padding: 0 0.52rem;
  border: 1px solid rgba(247, 236, 220, 0.18);
  border-radius: 999px;
  background: rgba(247, 236, 220, 0.08);
  color: rgba(247, 236, 220, 0.78);
  font-size: 0.72rem;
}

.inline-action:hover {
  border-color: var(--line-strong);
  color: #fff7e8;
}

.menu-content {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.9rem 0.72rem 0.2rem 0;
  scrollbar-gutter: stable;
}

.menu-content::-webkit-scrollbar {
  width: 0.36rem;
}

.menu-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(247, 236, 220, 0.2);
}

.data-grid {
  display: grid;
  gap: 0.82rem;
}

.data-grid.spaced,
.data-line.spaced {
  margin-top: 0.8rem;
}

.data-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.data-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.data-line,
.metric-line,
.schedule-panel {
  position: relative;
  padding: 0.72rem 0.2rem 0.78rem 0.85rem;
  border-top: 1px dotted rgba(247, 236, 220, 0.24);
}

.data-line.has-character-avatar {
  min-height: 7.2rem;
  padding-left: 5.35rem;
}

.character-avatar {
  position: absolute;
  top: 0.72rem;
  left: 0.9rem;
  width: 3.7rem;
  aspect-ratio: 7 / 10;
  border: 1px solid rgba(215, 179, 109, 0.34);
  background: rgba(0, 0, 0, 0.22);
  object-fit: cover;
  object-position: center top;
  box-shadow: 0 0.7rem 1.5rem rgba(0, 0, 0, 0.28);
}

.data-line::before,
.metric-line::before,
.schedule-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.9rem;
  bottom: 0.9rem;
  width: 3px;
  background: var(--gold);
  opacity: 0.62;
}

.data-line.muted {
  opacity: 0.58;
}

.data-line.muted::before {
  background: rgba(247, 236, 220, 0.38);
}

.metric-line span,
.data-line span {
  color: var(--muted);
  font-size: 0.76rem;
}

.metric-line strong {
  display: block;
  margin-top: 0.22rem;
  color: #fff3e0;
  font-size: 1.42rem;
  font-weight: 500;
}

.data-line h3,
.schedule-panel h3 {
  margin: 0;
  color: #fff3e0;
  font-size: 1rem;
  font-weight: 500;
}

.data-line p,
.metric-line p,
.hint {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.58;
}

.line-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0 0.48rem;
  border-radius: 999px;
  background: rgba(247, 236, 220, 0.08);
  color: rgba(247, 236, 220, 0.75);
  font-size: 0.72rem;
}

.tag.good {
  color: #dff5ea;
  background: rgba(128, 170, 156, 0.22);
}

.tag.warn {
  color: #ffe2bf;
  background: rgba(183, 121, 85, 0.24);
}

.thin-meter {
  height: 0.34rem;
  margin-top: 0.58rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(247, 236, 220, 0.1);
}

.thin-meter span {
  display: block;
  width: var(--value);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--tea), var(--gold));
}

.thin-meter.danger-aware span {
  background: linear-gradient(90deg, rgba(128, 170, 156, 0.92), rgba(183, 121, 85, 0.95));
}

.ledger-list {
  display: grid;
  gap: 0.28rem;
  margin-top: 0.48rem;
}

.row-actions,
.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.62rem;
}

.row-actions.compact {
  align-items: center;
  margin-top: 0;
}

.building-board {
  position: relative;
  padding: 0.72rem 0 0;
  border-top: 1px dotted rgba(247, 236, 220, 0.24);
}

.building-board::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.9rem;
  bottom: 0;
  width: 3px;
  background: var(--gold);
  opacity: 0.62;
}

.building-board-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding-left: 0.85rem;
}

.building-board-head h3,
.building-detail h3 {
  margin: 0;
  color: #fff3e0;
  font-size: 1rem;
  font-weight: 500;
}

.building-board-head p,
.building-detail p {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.58;
}

.building-tree-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(14rem, 0.8fr);
  gap: 0.9rem;
  margin-top: 0.8rem;
  padding-left: 0.85rem;
}

.building-map {
  position: relative;
  height: 24rem;
  overflow: hidden;
  border: 1px solid rgba(247, 236, 220, 0.14);
  background:
    radial-gradient(circle at 18% 20%, rgba(212, 176, 110, 0.12), transparent 13rem),
    radial-gradient(circle at 78% 64%, rgba(128, 170, 156, 0.1), transparent 15rem),
    linear-gradient(135deg, rgba(7, 5, 4, 0.42), rgba(7, 5, 4, 0.18));
  box-shadow: inset 0 0 0 1px rgba(212, 176, 110, 0.08);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.building-map:active {
  cursor: grabbing;
}

.building-map::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(247, 236, 220, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(247, 236, 220, 0.04) 1px, transparent 1px);
  background-size: 3.6rem 3.6rem;
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  pointer-events: none;
}

.building-map-canvas {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.building-links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.building-links line {
  stroke: rgba(247, 236, 220, 0.18);
  stroke-width: 1.4;
  stroke-dasharray: 6 8;
}

.building-links line.is-built {
  stroke: rgba(128, 170, 156, 0.52);
  stroke-dasharray: 0;
}

.building-links line.is-expandable,
.building-links line.is-accept {
  stroke: rgba(212, 176, 110, 0.62);
}

.building-node {
  position: absolute;
  width: 8.8rem;
  min-height: 3.05rem;
  padding: 0.46rem 0.58rem 0.48rem;
  border: 1px solid rgba(247, 236, 220, 0.16);
  background: linear-gradient(135deg, rgba(11, 8, 6, 0.78), rgba(36, 24, 18, 0.5));
  color: rgba(247, 236, 220, 0.78);
  text-align: left;
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(212, 176, 110, 0.08);
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.building-node::before {
  content: '';
  position: absolute;
  left: 0.42rem;
  top: 0.46rem;
  bottom: 0.46rem;
  width: 2px;
  background: rgba(247, 236, 220, 0.28);
}

.building-node span,
.building-node small {
  display: block;
  margin-left: 0.42rem;
  color: rgba(247, 236, 220, 0.5);
  font-size: 0.64rem;
}

.building-node strong {
  display: block;
  margin: 0.08rem 0 0.08rem 0.42rem;
  color: #fff3e0;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.2;
}

.building-node.is-locked {
  opacity: 0.42;
  filter: saturate(0.55);
}

.building-node.is-built {
  border-color: rgba(128, 170, 156, 0.36);
  background: linear-gradient(135deg, rgba(16, 34, 30, 0.66), rgba(9, 8, 6, 0.5));
}

.building-node.is-built::before {
  background: rgba(128, 170, 156, 0.78);
}

.building-node.is-expandable,
.building-node.is-accept {
  border-color: rgba(212, 176, 110, 0.56);
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.3),
    0 0 22px rgba(212, 176, 110, 0.12),
    inset 0 0 0 1px rgba(212, 176, 110, 0.18);
}

.building-node.is-building::before,
.building-node.is-expandable::before,
.building-node.is-accept::before {
  background: rgba(212, 176, 110, 0.86);
}

.building-node.is-selected {
  transform: translateY(-2px);
  color: #fff7e8;
  border-color: rgba(247, 236, 220, 0.48);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.36),
    0 0 0 1px rgba(247, 236, 220, 0.16),
    0 0 30px rgba(212, 176, 110, 0.18);
}

.building-detail {
  max-height: 24rem;
  min-height: 24rem;
  overflow-y: auto;
  padding: 0.92rem 0.96rem 1rem;
  border-left: 1px solid rgba(247, 236, 220, 0.2);
  background: linear-gradient(135deg, rgba(7, 5, 4, 0.34), rgba(7, 5, 4, 0.16));
  backdrop-filter: blur(10px);
}

.schedule {
  display: grid;
  gap: 0.32rem;
}

.shift-row {
  display: grid;
  grid-template-columns: 5rem repeat(4, minmax(0, 1fr));
  gap: 0.32rem;
}

.shift-name,
.shift-cell,
.option-button {
  min-height: 2.7rem;
  background: rgba(7, 5, 4, 0.18);
  color: rgba(247, 236, 220, 0.74);
  box-shadow: inset 0 -1px 0 rgba(247, 236, 220, 0.16);
}

.shift-name {
  display: grid;
  place-items: center;
  font-size: 0.78rem;
}

.shift-cell {
  padding: 0.34rem;
}

.shift-cell.is-work {
  background: rgba(128, 170, 156, 0.14);
}

.shift-cell.is-selected {
  color: #fff4df;
  box-shadow:
    inset 0 -1px 0 rgba(247, 236, 220, 0.3),
    inset 0 0 0 1px rgba(212, 179, 109, 0.54);
}

.shift-cell strong {
  display: block;
  font-size: 0.82rem;
  font-weight: 500;
}

.shift-cell span {
  display: block;
  margin-top: 0.12rem;
  color: var(--muted);
  font-size: 0.72rem;
}

.option-button {
  min-height: 1.9rem;
  padding: 0 0.7rem;
  border-radius: 999px;
}

.option-button.is-active,
.option-button:hover {
  color: #fff7e8;
  background: rgba(89, 57, 36, 0.55);
}

.dialogue {
  position: absolute;
  left: 4.5%;
  right: 4.5%;
  bottom: 3.7%;
  z-index: 10;
}

.nameplate {
  display: inline-flex;
  align-items: center;
  min-width: 9rem;
  min-height: 2.25rem;
  padding: 0 1.2rem;
  margin-left: 1.2rem;
  background: linear-gradient(90deg, rgba(35, 37, 56, 0.82), rgba(35, 37, 56, 0.46));
  color: #fff3e2;
  font-family: 'Yu Mincho', 'Songti SC', serif;
  clip-path: polygon(0 0, calc(100% - 1.3rem) 0, 100% 50%, calc(100% - 1.3rem) 100%, 0 100%);
  backdrop-filter: blur(8px);
}

.dialogue-strip {
  position: relative;
  width: 100%;
  min-height: 5.9rem;
  border: 0;
  padding: 1rem 1.35rem 1.05rem;
  background: linear-gradient(180deg, rgba(8, 6, 5, 0.58), rgba(8, 6, 5, 0.38));
  color: rgba(247, 236, 220, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(247, 236, 220, 0.24),
    inset 0 -1px 0 rgba(247, 236, 220, 0.18);
  backdrop-filter: blur(12px);
  text-align: left;
}

.dialogue-strip:disabled {
  cursor: default;
  opacity: 1;
}

.dialogue-page-count {
  position: absolute;
  right: 1rem;
  bottom: 0.55rem;
  color: rgba(247, 236, 220, 0.52);
  font-size: 0.7rem;
}

.dialogue-text {
  margin: 0;
  max-width: 65rem;
  font-size: 1rem;
  line-height: 1.85;
}

.has-scene-input .dialogue,
.has-scene-input :deep(.customer-dialogue-shell),
.has-scene-input :deep(.waiter-dialogue) {
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.8rem);
}

.scene-input {
  position: absolute;
  left: 4.5%;
  right: 4.5%;
  bottom: 3.7%;
  z-index: 18;
  padding: 0.72rem 0.86rem 0.82rem;
  border-top: 1px solid rgba(212, 176, 110, 0.42);
  border-bottom: 1px solid rgba(247, 236, 220, 0.18);
  background:
    linear-gradient(180deg, rgba(9, 7, 6, 0.74), rgba(9, 7, 6, 0.5)),
    radial-gradient(circle at 0 0, rgba(128, 170, 156, 0.14), transparent 30%);
  color: rgba(247, 236, 220, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.28);
}

.scene-input header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.48rem;
}

.scene-input header > div {
  min-width: 0;
}

.scene-header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}

.scene-header-actions .inline-action {
  margin-left: 0;
}

.scene-input .scene-page-count {
  display: inline-block;
  min-width: 2.9rem;
  margin: 0;
  overflow: visible;
  color: rgba(247, 236, 220, 0.58);
  font-size: 0.68rem;
  text-align: center;
  text-overflow: clip;
}

.scene-dialogue-output {
  display: grid;
  grid-template-columns: minmax(5.8rem, 9rem) minmax(0, 1fr);
  min-height: 3.8rem;
  margin-bottom: 0.56rem;
  border: 1px solid rgba(212, 176, 110, 0.28);
  background: rgba(5, 4, 3, 0.44);
}

.scene-dialogue-output b {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.62rem 0.78rem;
  border-right: 1px solid rgba(212, 176, 110, 0.28);
  color: #e2bb73;
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.scene-dialogue-output p {
  align-self: center;
  max-height: 5.4rem;
  margin: 0;
  overflow-y: auto;
  padding: 0.62rem 0.82rem;
  color: rgba(247, 236, 220, 0.92);
  font-size: 0.88rem;
  line-height: 1.65;
  white-space: pre-wrap;
  user-select: text;
}

.scene-story-reader {
  position: absolute;
  inset: 0;
  z-index: 24;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 4.5rem 5.5rem 4.2rem;
  background:
    linear-gradient(90deg, rgba(5, 4, 3, 0.94), rgba(8, 6, 5, 0.84)),
    radial-gradient(circle at 76% 14%, rgba(128, 170, 156, 0.12), transparent 36%);
  color: rgba(247, 236, 220, 0.9);
  backdrop-filter: blur(12px);
}

.scene-story-reader header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(215, 179, 109, 0.32);
}

.scene-story-reader small,
.scene-story-reader h2 {
  display: block;
  margin: 0;
}

.scene-story-reader small {
  color: rgba(247, 236, 220, 0.54);
  font-size: 0.72rem;
}

.scene-story-reader h2 {
  margin-top: 0.28rem;
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 1.45rem;
  font-weight: 500;
}

.scene-story-reader header button {
  min-width: 4rem;
  min-height: 2rem;
  border: 1px solid rgba(247, 236, 220, 0.22);
  background: rgba(247, 236, 220, 0.07);
  color: rgba(247, 236, 220, 0.82);
}

.scene-story-reader article {
  min-height: 0;
  overflow-y: auto;
  padding: 1.2rem 1rem 1rem 0;
  scrollbar-gutter: stable;
}

.scene-story-reader article p {
  max-width: 62rem;
  margin: 0 0 1rem;
  font-size: 0.96rem;
  line-height: 1.95;
  white-space: pre-wrap;
}

.scene-input strong,
.scene-input span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-input strong {
  color: #fff3e0;
  font-size: 0.96rem;
  font-weight: 500;
}

.scene-input span {
  margin-top: 0.18rem;
  color: rgba(247, 236, 220, 0.58);
  font-size: 0.76rem;
}

.scene-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.56rem;
  align-items: stretch;
}

.scene-input textarea {
  width: 100%;
  min-height: 3.15rem;
  max-height: 6.4rem;
  resize: vertical;
  border: 1px solid rgba(247, 236, 220, 0.2);
  border-radius: 0;
  padding: 0.58rem 0.72rem;
  background: rgba(5, 4, 3, 0.42);
  color: rgba(247, 236, 220, 0.92);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.58;
  outline: none;
}

.scene-input textarea:focus {
  border-color: rgba(212, 176, 110, 0.64);
  box-shadow: inset 0 0 0 1px rgba(212, 176, 110, 0.16);
}

.scene-input textarea::placeholder {
  color: rgba(247, 236, 220, 0.36);
}

.scene-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.7rem;
  min-height: 3.15rem;
  border: 1px solid rgba(212, 176, 110, 0.5);
  background: linear-gradient(180deg, rgba(88, 58, 37, 0.74), rgba(44, 31, 23, 0.66));
  color: #fff3e0;
  font-size: 0.92rem;
  backdrop-filter: blur(8px);
}

.scene-send:disabled {
  border-color: rgba(247, 236, 220, 0.18);
  background: rgba(8, 6, 5, 0.36);
  color: rgba(247, 236, 220, 0.42);
}

@media (max-width: 760px) {
  .title-screen,
  .play-screen {
    width: min(100vw, calc(100vh * 9 / 16));
    aspect-ratio: 9 / 16;
  }

  .title-screen.is-browser-fullscreen,
  .play-screen.is-browser-fullscreen {
    width: min(100vw, calc(100vh * 9 / 16));
    max-width: none;
  }

  .top-name {
    top: 1.2rem;
    left: 1.1rem;
    font-size: 0.82rem;
  }

  .shell-window-actions {
    top: 1rem;
    right: 1rem;
    gap: 0.45rem;
  }

  .title-copy {
    left: 7%;
    right: 7%;
    bottom: 42%;
  }

  h1 {
    font-size: 3.4rem;
  }

  .subtitle {
    max-width: 18rem;
    font-size: 0.82rem;
    line-height: 1.65;
  }

  .main-menu {
    top: auto;
    right: 7%;
    bottom: 7%;
    gap: 0.7rem;
  }

  .title-screen.panel-open .main-menu {
    opacity: 0;
    transform: translateY(0.8rem);
    pointer-events: none;
  }

  .menu-button {
    font-size: calc(0.95rem * var(--ui-font-scale));
  }

  .continue-pill {
    display: none;
  }

  .mode-dock,
  .floating-list,
  .save-list,
  .profile-list,
  .floating-list.is-settings {
    left: 7%;
    right: 7%;
    bottom: 17%;
    max-width: none;
    max-height: 70%;
  }

  .mode-row,
  .save-slot-grid {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .mode-ribbon {
    min-height: 4.9rem;
    padding: 0.72rem 0.9rem 0.72rem 3.8rem;
  }

  .mode-mark {
    width: 2rem;
    height: 2rem;
    font-size: 1.05rem;
  }

  .mode-ribbon h3,
  .floating-item h3 {
    font-size: calc(0.92rem * var(--ui-font-scale));
  }

  .mode-ribbon p,
  .floating-item p {
    font-size: calc(0.72rem * var(--ui-font-scale));
    line-height: 1.45;
  }

  .settings-panel {
    gap: 0.44rem;
  }

  .profile-form {
    gap: 0.56rem;
  }

  .profile-input {
    min-height: 2.15rem;
  }

  .profile-textarea {
    min-height: 8rem;
  }

  .settings-row {
    grid-template-columns: 1fr;
    gap: 0.48rem;
    padding: 0.52rem 0;
  }

  .setting-choice {
    min-height: 1.74rem;
    padding: 0.26rem 0.64rem;
    font-size: calc(0.72rem * var(--ui-font-scale));
  }

  .corner-brand {
    top: 1rem;
    left: 1rem;
  }

  .left-rail {
    top: 5.2rem;
    left: 1rem;
    width: 8.2rem;
  }

  .identity-plaque b {
    font-size: 1.7rem;
  }

  .status-slip {
    min-height: 2rem;
    font-size: 0.76rem;
  }

  .top-center {
    top: 1rem;
    left: auto;
    right: 4.2rem;
    max-width: 9rem;
    transform: none;
    font-size: 0.72rem;
  }

  .top-icons {
    top: 0.75rem;
    right: 0.8rem;
    gap: 0.4rem;
  }

  .sprite-spot {
    left: 30%;
    right: -8%;
    bottom: 16%;
  }

  .sprite-spot img {
    width: min(18rem, 120%);
  }

  .right-actions {
    top: 31%;
    right: 1rem;
    width: 8.2rem;
    gap: 0.48rem;
  }

  .action-pill {
    grid-template-columns: 1fr 2rem;
    min-height: 2.2rem;
    padding-left: 0.75rem;
    font-size: 0.78rem;
  }

  .menu-layer {
    padding: 4.5rem 0.9rem 1rem;
  }

  .mode-menu .menu-layer {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6rem;
  }

  .menu-tabs {
    display: flex;
    align-self: start;
    min-width: 0;
    max-width: 100%;
    gap: 0.45rem;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .menu-tab {
    min-width: 4.8rem;
    padding-left: 0.7rem;
    white-space: nowrap;
    font-size: 0.78rem;
  }

  .menu-tab::after {
    display: none;
  }

  .menu-head h2 {
    font-size: 1rem;
  }

  .menu-head p,
  .data-line p,
  .metric-line p {
    font-size: 0.72rem;
  }

  .data-grid.two,
  .data-grid.three {
    grid-template-columns: 1fr;
  }

  .building-board-head {
    display: grid;
    gap: 0.58rem;
  }

  .building-tree-panel {
    grid-template-columns: 1fr;
    padding-left: 0.55rem;
  }

  .building-map {
    height: 19rem;
  }

  .building-node {
    width: 7.7rem;
    min-height: 2.8rem;
    padding: 0.4rem 0.48rem;
  }

  .building-node strong {
    font-size: 0.76rem;
  }

  .building-detail {
    max-height: none;
    min-height: auto;
    border-left: 0;
    border-top: 1px dotted rgba(247, 236, 220, 0.22);
  }

  .shift-row {
    grid-template-columns: 3.7rem repeat(4, minmax(4.1rem, 1fr));
    min-width: 22rem;
  }

  .schedule {
    overflow-x: auto;
  }

  .dialogue {
    left: 3%;
    right: 3%;
    bottom: 2.6%;
  }

  .nameplate {
    min-height: 1.9rem;
    font-size: 0.9rem;
  }

  .dialogue-strip {
    min-height: 7rem;
    padding: 0.78rem 0.86rem;
  }

  .dialogue-text {
    font-size: 0.82rem;
    line-height: 1.68;
  }

  .scene-input {
    left: 4%;
    right: 4%;
    bottom: 2.6%;
    padding: 0.58rem 0.62rem 0.66rem;
  }

  .scene-input header {
    align-items: start;
    margin-bottom: 0.42rem;
  }

  .scene-header-actions {
    max-width: 58%;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .scene-story-reader {
    padding: 3.8rem 1.1rem 2.2rem;
  }

  .scene-story-reader h2 {
    font-size: 1.1rem;
  }

  .scene-story-reader article p {
    font-size: 0.8rem;
    line-height: 1.78;
  }

  .scene-input strong {
    font-size: 0.82rem;
  }

  .scene-input span {
    font-size: 0.68rem;
  }

  .scene-input-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.42rem;
  }

  .scene-input textarea {
    min-height: 2.85rem;
    max-height: 5.8rem;
    font-size: 0.78rem;
  }

  .scene-send {
    width: 4.2rem;
    min-height: 2.85rem;
    font-size: 0.78rem;
  }
}
</style>
