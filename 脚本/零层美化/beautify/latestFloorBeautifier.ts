export type LatestFloorBeautifier = {
  applyNow: (reason?: string) => void;
  dispose: () => void;
};

const STYLE_ID = 'tangquan-latest-floor-beautifier-style';
const CURRENT_CLASS = 'tangquan-current-floor';
const VISUAL_ZERO_SELECTOR = '#chat > .mes[data-tq-visual-zero="true"]';

function ensureStyle() {
  let $style = $(`head > style#${STYLE_ID}`);
  if ($style.length === 0) {
    $style = $('<style>').attr('id', STYLE_ID).appendTo('head');
  }

  $style.text(`
/* ASSET_SLOT: scene.background.url sau này thay bằng ảnh background cảnh hiện tại */
/* ASSET_SLOT: character.standing.url sau này thay bằng ảnh minh họa nhân vật hiện tại */
/* ASSET_SLOT: ui.dialog.namebox sau này thay bằng tư liệu khung tên */
/* ASSET_SLOT: ui.dialog.textbox sau này thay bằng tư liệu hộp thoại */
body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} {
  --tq-paper: rgba(39, 32, 27, 0.78);
  --tq-line: rgba(232, 205, 155, 0.30);
  --tq-text: rgba(248, 242, 232, 0.94);
  --tq-muted: rgba(248, 242, 232, 0.66);
  --tq-accent: #e4c37f;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .mes_block {
  position: relative;
  border: 1px solid var(--tq-line);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0)),
    radial-gradient(circle at 12% 0%, rgba(228, 195, 127, 0.14), transparent 36%),
    var(--tq-paper);
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .mes_block::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(228, 195, 127, 0.20), transparent 22%, transparent 78%, rgba(143, 201, 183, 0.16)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 18px);
  opacity: 0.42;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .name_text {
  color: var(--tq-accent) !important;
  font-weight: 600;
  letter-spacing: 0;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .mes_text {
  position: relative;
  z-index: 1;
  color: var(--tq-text) !important;
  line-height: 1.82;
  letter-spacing: 0;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .mes_text em,
body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS} .mes_text i {
  color: var(--tq-muted);
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS}[data-tq-preview="user"] {
  --tq-line: rgba(143, 201, 183, 0.34);
  --tq-accent: #9fd7c7;
}

body[data-tangquan-ui-ready="true"] #chat > .mes.${CURRENT_CLASS}[data-tq-visual-zero="true"] {
  margin-top: 8px !important;
}`);
}

function removeStyle() {
  $(`head > style#${STYLE_ID}`).remove();
}

function getLatestRealMessageId(): number {
  return Math.max(0, getLastMessageId());
}

function getRealFloor(messageId: number): JQuery<HTMLElement> {
  return $(`#chat > .mes[mesid="${messageId}"]:not([data-tq-visual-zero="true"])`) as JQuery<HTMLElement>;
}

function getVisualZero(): JQuery<HTMLElement> {
  return $(VISUAL_ZERO_SELECTOR) as JQuery<HTMLElement>;
}

function shouldKeepClass($floor: JQuery<HTMLElement>, latestId: number): boolean {
  if ($floor.attr('data-tq-visual-zero') === 'true') {
    const source = Number($floor.attr('data-tq-source') ?? latestId);
    return Number.isNaN(source) || source === latestId;
  }
  return Number($floor.attr('mesid')) === latestId;
}

export function createLatestFloorBeautifier(): LatestFloorBeautifier {
  let disposed = false;
  let timer: number | undefined;
  const stopList: Array<() => void> = [];

  function applyNow(reason = 'manual') {
    if (disposed) {
      return;
    }
    ensureStyle();
    $('body').attr('data-tangquan-ui-ready', 'true');

    const latestId = getLatestRealMessageId();
    $(`#chat > .mes.${CURRENT_CLASS}`).each((_, element) => {
      const $floor = $(element) as JQuery<HTMLElement>;
      if (!shouldKeepClass($floor, latestId)) {
        $floor.removeClass(CURRENT_CLASS).removeAttr('data-tangquan-beautify-reason');
      }
    });

    const $real = getRealFloor(latestId);
    if ($real.length > 0) {
      $real.addClass(CURRENT_CLASS).attr('data-tangquan-beautify-reason', reason);
    }

    const $visual = getVisualZero();
    if ($visual.length > 0) {
      $visual.addClass(CURRENT_CLASS).attr('data-tangquan-beautify-reason', reason);
    }
  }

  function schedule(reason: string, delay = 120) {
    if (disposed) {
      return;
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => applyNow(reason), delay);
  }

  function listen<T extends EventType>(event: T, listener: ListenerType[T], last = false) {
    stopList.push((last ? eventMakeLast(event, errorCatched(listener)) : eventOn(event, errorCatched(listener))).stop);
  }

  listen(tavern_events.MESSAGE_RECEIVED, () => schedule('AI phản hồi hoàn tất'), true);
  listen(tavern_events.MESSAGE_SENT, () => schedule('người dùng nhập'), true);
  listen(tavern_events.MESSAGE_SWIPED, () => schedule('chuyển trang tin nhắn'), true);
  listen(tavern_events.MESSAGE_EDITED, () => schedule('sửa tầng'), true);
  listen(tavern_events.MESSAGE_UPDATED, () => schedule('cập nhật tầng'), true);
  listen(tavern_events.MESSAGE_DELETED, () => schedule('xóa tầng'), true);
  listen(tavern_events.CHARACTER_MESSAGE_RENDERED, () => schedule('render tầng nhân vật'), true);
  listen(tavern_events.USER_MESSAGE_RENDERED, () => schedule('render tầng người dùng'), true);
  listen(tavern_events.GENERATION_ENDED, () => schedule('sinh kết thúc'), true);
  listen(tavern_events.GENERATION_STOPPED, () => schedule('sinh dừng lại'), true);
  listen(tavern_events.CHAT_CHANGED, () => schedule('chuyển đổi chat', 260), true);

  const observer = new MutationObserver(() => schedule('DOM tầng thay đổi', 80));
  const chat = $('#chat')[0];
  if (chat) {
    observer.observe(chat, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-tq-source', 'data-tq-visual-zero'],
    });
  }

  applyNow('khởi tạo');

  return {
    applyNow,
    dispose: () => {
      disposed = true;
      window.clearTimeout(timer);
      observer.disconnect();
      stopList.forEach(stop => stop());
      $(`#chat > .mes.${CURRENT_CLASS}`).removeClass(CURRENT_CLASS).removeAttr('data-tangquan-beautify-reason');
      $('body').removeAttr('data-tangquan-ui-ready');
      removeStyle();
    },
  };
}
