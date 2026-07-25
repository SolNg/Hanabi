import type { TangquanLogger } from '../debug/logger';
import { resolveTangquanBackground } from './app/mediaCatalog';

export type LoadingOverlayState = {
  visible: boolean;
  title: string;
  detail: string;
  percent: number;
};

export type TangquanLoadingOverlay = {
  show: (title?: string, detail?: string) => void;
  update: (percent: number, title?: string, detail?: string) => void;
  hide: () => void;
  run: <T>(title: string, task: (overlay: TangquanLoadingOverlay) => Promise<T>) => Promise<T>;
  getState: () => LoadingOverlayState;
  dispose: () => void;
};

const OVERLAY_ID = 'tangquan-loading-overlay';
const STYLE_ID = 'tangquan-loading-overlay-style';
const BODY_BUSY_ATTR = 'data-tangquan-loading';

function clampPercent(percent: number): number {
  return _.clamp(Math.round(percent), 0, 100);
}

function ensureStyle() {
  let $style = $(`head > style#${STYLE_ID}`);
  if ($style.length === 0) {
    $style = $('<style>').attr('id', STYLE_ID).appendTo('head');
  }

  const loadingBackground = resolveTangquanBackground('loading-background');
  $style.text(`
#${OVERLAY_ID} {
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(28, 24, 20, 0.78), rgba(10, 12, 14, 0.86)),
    url("${loadingBackground}") center / cover no-repeat,
    rgba(12, 13, 14, 0.72);
  color: #f6efe2;
  pointer-events: auto;
  font-family: "Noto Serif SC", "Microsoft YaHei", serif;
  user-select: none;
}

#${OVERLAY_ID}[data-visible="false"] {
  display: none;
}

#${OVERLAY_ID} .tq-loading-card {
  width: min(460px, calc(100vw - 48px));
  border: 1px solid rgba(231, 203, 146, 0.36);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)),
    rgba(36, 31, 27, 0.84);
  box-shadow:
    0 24px 72px rgba(0, 0, 0, 0.46),
    0 0 42px rgba(228, 195, 127, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 28px 30px 26px;
  transform: translateY(-2px);
  animation: tqLoadingCard 1.6s ease-in-out infinite alternate;
}

#${OVERLAY_ID} .tq-loading-kicker {
  font-size: 12px;
  letter-spacing: 0.16em;
  color: rgba(231, 203, 146, 0.78);
}

#${OVERLAY_ID} .tq-loading-title {
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 600;
}

#${OVERLAY_ID} .tq-loading-dots {
  display: inline-flex;
  gap: 4px;
  margin-left: 5px;
  vertical-align: 0.08em;
}

#${OVERLAY_ID} .tq-loading-dots span {
  display: inline-block;
  animation: tqDotJump 0.86s ease-in-out infinite;
}

#${OVERLAY_ID} .tq-loading-dots span:nth-child(2) {
  animation-delay: 0.12s;
}

#${OVERLAY_ID} .tq-loading-dots span:nth-child(3) {
  animation-delay: 0.24s;
}

#${OVERLAY_ID} .tq-loading-detail {
  margin-top: 10px;
  min-height: 22px;
  font-size: 14px;
  line-height: 1.65;
  color: rgba(246, 239, 226, 0.76);
}

#${OVERLAY_ID} .tq-loading-track {
  margin-top: 22px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

#${OVERLAY_ID} .tq-loading-bar {
  width: 0%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c98f5a, #e6c381, #8fc9b7);
  transition: width 180ms ease;
}

#${OVERLAY_ID} .tq-loading-percent {
  margin-top: 16px;
  text-align: right;
  font-size: 42px;
  line-height: 1;
  font-weight: 700;
  color: rgba(246, 239, 226, 0.92);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 6px 20px rgba(0, 0, 0, 0.42);
}

#${OVERLAY_ID} .tq-loading-emergency {
  margin-top: 18px;
  min-height: 32px;
  padding: 0 18px;
  border: 1px solid rgba(246, 239, 226, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(246, 239, 226, 0.68);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

#${OVERLAY_ID} .tq-loading-emergency:hover {
  border-color: rgba(246, 239, 226, 0.46);
  color: #fff7e8;
}

#${OVERLAY_ID} .tq-loading-warning {
  position: fixed;
  right: 22px;
  bottom: 18px;
  max-width: min(360px, calc(100vw - 44px));
  color: rgba(246, 239, 226, 0.72);
  font-size: 12px;
  line-height: 1.65;
  text-align: right;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.72);
}

body[${BODY_BUSY_ATTR}="true"] {
  pointer-events: none;
}

body[${BODY_BUSY_ATTR}="true"] #${OVERLAY_ID} {
  pointer-events: auto;
}

@keyframes tqLoadingCard {
  from {
    transform: translateY(2px);
    filter: brightness(0.98);
  }
  to {
    transform: translateY(-4px);
    filter: brightness(1.04);
  }
}

@keyframes tqDotJump {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.48;
  }
  35% {
    transform: translateY(-5px);
    opacity: 1;
  }
}`);
}

function ensureOverlay() {
  let $overlay = $(`#${OVERLAY_ID}`);
  if ($overlay.length > 0) {
    return $overlay;
  }

  $overlay = $(`
<div id="${OVERLAY_ID}" data-visible="false" aria-live="polite">
  <div class="tq-loading-card">
    <div class="tq-loading-kicker">Hoa Chưa Nở</div>
    <div class="tq-loading-title"><span class="tq-loading-title-text"></span><span class="tq-loading-dots"><span>·</span><span>·</span><span>·</span></span></div>
    <div class="tq-loading-detail"></div>
    <div class="tq-loading-track"><div class="tq-loading-bar"></div></div>
    <div class="tq-loading-percent">0%</div>
    <button class="tq-loading-emergency" type="button">Thu gọn giao diện</button>
  </div>
  <div class="tq-loading-warning">Đang xử lý save, vui lòng không refresh trình duyệt, chuyển chat hoặc đóng trang.</div>
</div>`);
  $overlay.find('.tq-loading-emergency').on('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const parentWindow = window.parent as Window & {
      tangquanZeroLayerEmergencyDisable?: () => void;
    };
    parentWindow.tangquanZeroLayerEmergencyDisable?.();
  });
  $overlay.appendTo('body');
  return $overlay;
}

export function createTangquanLoadingOverlay(log?: TangquanLogger): TangquanLoadingOverlay {
  const state: LoadingOverlayState = {
    visible: false,
    title: 'Đang đọc',
    detail: '',
    percent: 0,
  };
  let beforeUnloadBound = false;
  let activeRuns = 0;
  let runFailure: { title: string; error: string } | null = null;
  let hideTimer = 0;
  let disposed = false;

  function beforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = 'Save đang xử lý, vui lòng không refresh trình duyệt hoặc đóng trang.';
    return event.returnValue;
  }

  function syncBlocking() {
    $('body').attr(BODY_BUSY_ATTR, state.visible ? 'true' : 'false');
    if (state.visible && !beforeUnloadBound) {
      beforeUnloadBound = true;
      window.addEventListener('beforeunload', beforeUnload);
    } else if (!state.visible && beforeUnloadBound) {
      beforeUnloadBound = false;
      window.removeEventListener('beforeunload', beforeUnload);
    }
  }

  function render() {
    if (disposed) return;
    ensureStyle();
    const $overlay = ensureOverlay();
    $overlay.attr('data-visible', state.visible ? 'true' : 'false');
    $overlay.find('.tq-loading-title-text').text(state.title);
    $overlay.find('.tq-loading-detail').text(state.detail);
    $overlay.find('.tq-loading-bar').css('width', `${state.percent}%`);
    $overlay.find('.tq-loading-percent').text(`${state.percent}%`);
    syncBlocking();
  }

  function show(title = 'Đang đọc', detail = '') {
    if (disposed) return;
    window.clearTimeout(hideTimer);
    state.visible = true;
    state.title = title;
    state.detail = detail;
    state.percent = 0;
    log?.info('Lớp phủ loading', 'Hiển thị', { title, detail });
    render();
  }

  function update(percent: number, title?: string, detail?: string) {
    if (disposed) return;
    window.clearTimeout(hideTimer);
    state.visible = true;
    state.percent = clampPercent(percent);
    if (title !== undefined) {
      state.title = title;
    }
    if (detail !== undefined) {
      state.detail = detail;
    }
    log?.debug('Lớp phủ loading', 'Cập nhật tiến độ', {
      percent: state.percent,
      title: state.title,
      detail: state.detail,
    });
    render();
  }

  function hide() {
    if (disposed) return;
    state.visible = false;
    log?.info('Lớp phủ loading', 'Ẩn', { title: state.title, percent: state.percent });
    render();
  }

  async function run<T>(title: string, task: (overlay: TangquanLoadingOverlay) => Promise<T>): Promise<T> {
    if (disposed) {
      throw new Error('Loading overlay has been disposed');
    }
    const isFirstRun = activeRuns === 0;
    activeRuns += 1;
    if (isFirstRun) {
      runFailure = null;
      show(title);
    } else {
      update(state.percent, title, state.detail);
    }
    try {
      return await task(api);
    } catch (error) {
      const message = String(error);
      runFailure ??= { title, error: message };
      update(state.percent, 'Đọc thất bại', message);
      log?.error('Lớp phủ loading', 'Task thất bại', { title, error: String(error) });
      throw error;
    } finally {
      activeRuns = Math.max(0, activeRuns - 1);
      if (activeRuns === 0) {
        if (runFailure) {
          update(state.percent, 'Đọc thất bại', runFailure.error);
          hideTimer = window.setTimeout(hide, 1600);
        } else {
          update(100, title, 'Hoàn thành');
          hideTimer = window.setTimeout(hide, 180);
        }
      }
    }
  }

  function getState(): LoadingOverlayState {
    return { ...state };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    state.visible = false;
    log?.info('Lớp phủ loading', 'Gỡ cài đặt');
    window.clearTimeout(hideTimer);
    $(`#${OVERLAY_ID}`).remove();
    $(`head > style#${STYLE_ID}`).remove();
    $('body').removeAttr(BODY_BUSY_ATTR);
    if (beforeUnloadBound) {
      beforeUnloadBound = false;
      window.removeEventListener('beforeunload', beforeUnload);
    }
  }

  const api: TangquanLoadingOverlay = {
    show,
    update,
    hide,
    run,
    getState,
    dispose,
  };

  return api;
}
