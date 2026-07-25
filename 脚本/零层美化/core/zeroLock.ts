import { watch } from 'vue';
import { isTangquanZeroPlaceholderExtra, isTangquanZeroPlaceholderText } from '../runtime/zeroPlaceholder';
import { type ZeroSettings, type useZeroStore } from '../stores/zeroStore';

type ZeroStore = ReturnType<typeof useZeroStore>;

export type ZeroLockController = {
  mirrorNow: (reason?: string) => Promise<void>;
  toggleRevealLatest: () => void;
  hideAgain: () => void;
  applyAll: () => void;
  getUiMountElement: () => HTMLElement;
  releaseUiMountElement: () => void;
  dispose: () => void;
};

const STYLE_PREFIX = 'tangquan-zero-lock';
const VISUAL_ZERO_SELECTOR = '#chat > .mes[data-tq-visual-zero="true"]';
const UI_HOST_ID = 'tangquan-game-ui-host';

function styleId(suffix: string) {
  return `${STYLE_PREFIX}-${getScriptId().replace(/[^\w-]/g, '_')}-${suffix}`;
}

function ensureParentStyle(id: string, css: string) {
  let $style = $(`head > style#${id}`);
  if ($style.length === 0) {
    $style = $('<style>').attr('id', id).appendTo('head');
  }
  $style.text(css);
}

function removeParentStyle(id: string) {
  $(`head > style#${id}`).remove();
}

function getCurrentMessageText(message: ChatMessage | ChatMessageSwiped): string {
  const swiped = message as ChatMessageSwiped;
  const normal = message as ChatMessage;
  const swipeId = swiped.swipe_id ?? 0;
  return (normal.message ?? swiped.swipes?.[swipeId] ?? swiped.swipes?.[0] ?? '').trim();
}

function isTangquanZeroPlaceholderMessage(message: ChatMessage | ChatMessageSwiped): boolean {
  const record = message as (ChatMessage | ChatMessageSwiped) & { extra?: unknown };
  return isTangquanZeroPlaceholderText(getCurrentMessageText(message)) || isTangquanZeroPlaceholderExtra(record.extra);
}

function getMessage(messageId: number, options?: Parameters<typeof getChatMessages>[1]) {
  return (getChatMessages(messageId, options)[0] as ChatMessageSwiped | undefined) ?? null;
}

function pickMirrorSource(settings: ZeroSettings): ChatMessageSwiped | null {
  const lastId = getLastMessageId();
  if (lastId < 0) {
    return null;
  }
  if (settings.mirrorMode === 'latest_message') {
    return getMessage(lastId, { include_swipes: true });
  }
  const messages = getChatMessages(`0-${lastId}`, { role: 'assistant', include_swipes: true }) as ChatMessageSwiped[];
  return messages[messages.length - 1] ?? getMessage(0, { include_swipes: true });
}

function ensureVisualZero(sourceId?: number) {
  const $existing = $(VISUAL_ZERO_SELECTOR);
  if ($existing.length > 0) {
    $existing.slice(1).remove();
    return $existing.first().attr('data-tq-visual-zero', 'true');
  }

  const $source =
    sourceId !== undefined
      ? $(`#chat > .mes[mesid="${sourceId}"]:not([data-tq-visual-zero="true"])`).first()
      : $();
  const $template = $source.length > 0 ? $source : $('#chat > .mes:not([data-tq-visual-zero="true"])').last();
  const $visual =
    $template.length > 0
      ? $template.clone(false, false)
      : $('<div class="mes"><div class="mes_block"><div class="mes_text"></div></div></div>');

  $visual
    .removeAttr('id')
    .removeAttr('style')
    .attr('data-tq-visual-zero', 'true')
    .attr('mesid', '0')
    .appendTo('#chat');
  $visual.find('[id]').removeAttr('id');
  return $visual;
}

function removeVisualZero() {
  $(VISUAL_ZERO_SELECTOR).remove();
}

function updateVisualZeroAttributes(sourceId: number) {
  ensureVisualZero(sourceId)
    .attr('data-tq-visual-zero', 'true')
    .attr('mesid', '0')
    .attr('data-tq-source', String(sourceId))
    .attr('data-tq-mirroring', sourceId > 0 ? 'true' : 'false')
    .removeAttr('data-tq-preview');
}

function getVisualMessageText(sourceId: number) {
  const $visual = ensureVisualZero(sourceId);
  let $text = $visual.find('.mes_text').first();
  if ($text.length === 0) {
    $text = $('<div class="mes_text"></div>').appendTo($visual);
  }
  return $text;
}

function hasUiMountElement() {
  return $(`#${UI_HOST_ID}`).length > 0;
}

function scrollToMessage(messageId: number) {
  const element = $(`#chat > .mes[mesid="${messageId}"]:not([data-tq-visual-zero="true"])`)[0];
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function scrollToVisualZero(behavior: ScrollBehavior = 'auto') {
  const element = $(VISUAL_ZERO_SELECTOR)[0];
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior, block: 'start' });
}

export function createZeroLockController(store: ZeroStore): ZeroLockController {
  let disposed = false;
  let applyingMirror = false;
  let uiMountActive = false;
  let mirrorTimer: number | undefined;
  let currentChatId = String(SillyTavern.getCurrentChatId() ?? '');
  const stopList: Array<() => void> = [];
  const hideStyleId = styleId('hide');
  const customStyleId = styleId('custom');

  function shouldHideRealFloors() {
    return (
      store.settings.enabled &&
      store.settings.hideNonZero &&
      !store.settings.debugShowHidden &&
      !store.status.manualReveal
    );
  }

  function applyBaseStyle() {
    ensureParentStyle(
      hideStyleId,
      `#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes:not([data-tq-visual-zero="true"]) {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"] {
  display: block !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

#chat.tangquan-zero-lock[data-tq-hide="true"] > .mes[data-tq-visual-zero="true"][data-tq-placeholder="true"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

#chat.tangquan-zero-lock[data-tq-hide="true"] #show_more_messages,
#chat.tangquan-zero-lock[data-tq-hide="true"] .show_more_messages,
#chat.tangquan-zero-lock[data-tq-hide="true"] [id*="show_more"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [class*="show_more"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [id*="load_more"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [class*="load_more"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [id*="more_messages"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [class*="more_messages"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [title*="Show more"],
#chat.tangquan-zero-lock[data-tq-hide="true"] [aria-label*="Show more"],
body[data-tangquan-zero-lock-hide="true"] #show_more_messages,
body[data-tangquan-zero-lock-hide="true"] .show_more_messages,
body[data-tangquan-zero-lock-hide="true"] [id*="show_more"],
body[data-tangquan-zero-lock-hide="true"] [class*="show_more"],
body[data-tangquan-zero-lock-hide="true"] [id*="load_more"],
body[data-tangquan-zero-lock-hide="true"] [class*="load_more"],
body[data-tangquan-zero-lock-hide="true"] [id*="more_messages"],
body[data-tangquan-zero-lock-hide="true"] [class*="more_messages"],
body[data-tangquan-zero-lock-hide="true"] [title*="Show more"],
body[data-tangquan-zero-lock-hide="true"] [aria-label*="Show more"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}`,
    );
  }

  function applyCustomStyle() {
    ensureParentStyle(customStyleId, shouldHideRealFloors() ? store.settings.customCss : '');
  }

  function applyVisibility() {
    const shouldHide = shouldHideRealFloors();
    const $chat = $('#chat');
    if ($chat.hasClass('tangquan-zero-lock') !== shouldHide) {
      $chat.toggleClass('tangquan-zero-lock', shouldHide);
    }
    const nextHide = shouldHide ? 'true' : 'false';
    if ($chat.attr('data-tq-hide') !== nextHide) {
      $chat.attr('data-tq-hide', nextHide);
    }
    $('body').attr('data-tangquan-zero-lock-hide', nextHide);
    if (!shouldHide) {
      removeVisualZero();
    }

    store.markStatus({
      ready: true,
      totalFloors: Math.max(0, getLastMessageId() + 1),
    });
  }

  function applyAll() {
    if (disposed) {
      return;
    }
    applyBaseStyle();
    applyCustomStyle();
    applyVisibility();
  }

  function queueMirror(reason: string, delay = store.settings.mirrorDelayMs) {
    if (disposed || !store.settings.enabled || store.status.manualReveal) {
      return;
    }
    window.clearTimeout(mirrorTimer);
    mirrorTimer = window.setTimeout(() => {
      void mirrorNow(reason);
    }, delay);
  }

  async function mirrorNow(reason = 'manual') {
    if (disposed || !store.settings.enabled || applyingMirror) {
      return;
    }
    if (store.status.manualReveal) {
      applyVisibility();
      return;
    }

    if (uiMountActive || hasUiMountElement()) {
      applyVisibility();
      store.markStatus({ lastReason: `${reason}: giao diện game đang hiển thị` });
      return;
    }

    const source = pickMirrorSource(store.settings);
    if (!source) {
      applyVisibility();
      store.markStatus({ lastReason: 'Không có tầng nào để mirror' });
      return;
    }

    const sourceId = source.message_id;
    const isPlaceholder = isTangquanZeroPlaceholderMessage(source);
    applyingMirror = true;
    try {
      const $visual = ensureVisualZero(sourceId);
      await refreshOneMessage(sourceId, $visual);
      if (uiMountActive || hasUiMountElement()) {
        $visual.removeAttr('data-tq-placeholder').attr('data-tq-ui-mounted', 'true');
        store.markStatus({ lastReason: `${reason}: giao diện game đang hiển thị` });
        return;
      }
      updateVisualZeroAttributes(sourceId);
      if (isPlaceholder) {
        $visual.attr('data-tq-placeholder', 'true');
        getVisualMessageText(sourceId).empty();
      } else {
        $visual.removeAttr('data-tq-placeholder data-tq-ui-mounted');
      }
      store.markStatus({
        lastMirroredId: sourceId,
        lastMirrorRole: source.role,
        lastMirrorAt: new Date().toLocaleTimeString(),
        lastReason: reason,
        lastError: '',
      });
    } catch (error) {
      store.markStatus({ lastError: String(error), lastReason: `${reason} thất bại` });
      console.error('[Làm đẹp tầng 0 Suối nước nóng] Mirror hình ảnh thất bại:', error);
    } finally {
      applyingMirror = false;
      applyAll();
    }
  }

  function renderStreamToZero(text: string) {
    if (!store.settings.enabled || store.status.manualReveal || !store.settings.streamPreview || !text.trim()) {
      return;
    }
    const sourceId = Math.max(0, getLastMessageId());
    try {
      getVisualMessageText(sourceId).html(formatAsDisplayedMessage(text, { message_id: sourceId }));
      updateVisualZeroAttributes(sourceId);
      applyVisibility();
    } catch {
      getVisualMessageText(sourceId).text(text);
    }
  }

  function previewUserMessageToZero(messageId: number) {
    if (!store.settings.enabled || store.status.manualReveal || !store.settings.previewUserInput || messageId < 1) {
      return;
    }
    const message = getMessage(messageId, { role: 'user', include_swipes: true });
    if (!message) {
      return;
    }
    const text = getCurrentMessageText(message);
    if (!text) {
      return;
    }
    try {
      getVisualMessageText(messageId).html(formatAsDisplayedMessage(text, { message_id: messageId }));
    } catch {
      getVisualMessageText(messageId).text(text);
    }
    ensureVisualZero(messageId)
      .attr('mesid', '0')
      .attr('data-tq-visual-zero', 'true')
      .attr('data-tq-source', String(messageId))
      .attr('data-tq-mirroring', 'false')
      .attr('data-tq-preview', 'user');
    store.markStatus({
      lastMirroredId: messageId,
      lastMirrorRole: 'user',
      lastMirrorAt: new Date().toLocaleTimeString(),
      lastReason: 'Đang hiển thị input người dùng',
      lastError: '',
    });
    applyVisibility();
  }

  function toggleRevealLatest() {
    if (store.status.manualReveal) {
      hideAgain();
      return;
    }
    window.clearTimeout(mirrorTimer);
    store.markStatus({
      manualReveal: true,
      lastReason: 'Đã gỡ ẩn và nhảy tới tầng mới nhất',
    });
    applyAll();
    scrollToMessage(getLastMessageId());
  }

  function hideAgain() {
    store.markStatus({ manualReveal: false, lastReason: 'Đã khôi phục khóa hình ảnh' });
    void mirrorNow('Đồng bộ sau khi khôi phục khóa').finally(() => {
      scrollToVisualZero();
    });
  }

  function getUiMountElement(): HTMLElement {
    uiMountActive = true;
    window.clearTimeout(mirrorTimer);
    const source = pickMirrorSource(store.settings);
    const sourceId = source?.message_id ?? Math.max(0, getLastMessageId());
    const $visual = ensureVisualZero(sourceId);
    updateVisualZeroAttributes(sourceId);
    $visual.removeAttr('data-tq-placeholder').attr('data-tq-ui-mounted', 'true');

    const $text = getVisualMessageText(sourceId);
    let $host = $text.children(`#${UI_HOST_ID}`).first();
    if ($host.length === 0) {
      $text.empty();
      $host = $('<div></div>')
        .attr('id', UI_HOST_ID)
        .css({
          width: 'min(100%, 1366px)',
          margin: '0 auto',
          overflow: 'hidden',
          background: '#100b08',
        })
        .appendTo($text);
    }

    applyAll();
    scrollToVisualZero('smooth');
    return $host[0] as HTMLElement;
  }

  function releaseUiMountElement() {
    uiMountActive = false;
    $(`${VISUAL_ZERO_SELECTOR}[data-tq-ui-mounted="true"]`).removeAttr('data-tq-ui-mounted');
    queueMirror('Đồng bộ sau khi đóng giao diện game', 0);
  }

  function listen<T extends EventType>(event: T, listener: ListenerType[T], last = false) {
    stopList.push((last ? eventMakeLast(event, errorCatched(listener)) : eventOn(event, errorCatched(listener))).stop);
  }

  listen(tavern_events.MESSAGE_SENT, messageId => {
    store.markStatus({ isGenerating: true, lastReason: 'Tin nhắn người dùng đã gửi, chờ phản hồi' });
    window.setTimeout(() => {
      previewUserMessageToZero(messageId);
    }, 0);
  }, true);

  listen(tavern_events.MESSAGE_RECEIVED, (_messageId, type) => {
    if (type === 'quiet' || type === 'command' || type === 'extension') {
      applyVisibility();
      return;
    }
    store.markStatus({ isGenerating: false });
    queueMirror('AI phản hồi hoàn tất');
  }, true);

  listen(tavern_events.GENERATION_STARTED, () => {
    store.markStatus({ isGenerating: true, lastReason: 'Bắt đầu sinh nội dung' });
    applyVisibility();
  }, true);

  listen(tavern_events.GENERATION_STOPPED, () => {
    store.markStatus({ isGenerating: false, lastReason: 'Sinh nội dung dừng lại' });
    queueMirror('Đồng bộ sau khi dừng sinh nội dung', 100);
  }, true);

  listen(tavern_events.GENERATION_ENDED, () => {
    store.markStatus({ isGenerating: false });
    queueMirror('Sinh nội dung kết thúc');
  }, true);

  listen(tavern_events.STREAM_TOKEN_RECEIVED, text => {
    renderStreamToZero(text);
  });

  listen(tavern_events.MESSAGE_SWIPED, () => {
    queueMirror('Chuyển trang tin nhắn', 200);
  }, true);

  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_UPDATED, tavern_events.MESSAGE_DELETED].forEach(event => {
    listen(event, () => {
      queueMirror('Tầng thay đổi', 250);
    }, true);
  });

  [tavern_events.USER_MESSAGE_RENDERED, tavern_events.CHARACTER_MESSAGE_RENDERED].forEach(event => {
    listen(event, () => {
      applyVisibility();
    }, true);
  });

  listen(tavern_events.CHAT_CHANGED, chatId => {
    const nextChatId = String(chatId || SillyTavern.getCurrentChatId());
    if (nextChatId === currentChatId) {
      applyAll();
      return;
    }
    currentChatId = nextChatId;
    window.clearTimeout(mirrorTimer);
    removeVisualZero();
    store.markStatus({
      isGenerating: false,
      lastMirroredId: null,
      lastMirrorRole: null,
      lastMirrorAt: '',
      lastReason: 'Chuyển đổi chat',
      lastError: '',
      manualReveal: false,
    });
    queueMirror('Đồng bộ sau khi chuyển chat', 300);
  }, true);

  const observer = new MutationObserver(() => {
    applyVisibility();
  });
  const chat = $('#chat')[0];
  if (chat) {
    observer.observe(chat, { childList: true, subtree: false });
  }

  const stopWatch = watch(
    () => ({ ...store.settings }),
    (_settings, oldSettings) => {
      applyAll();
      if (!store.settings.enabled && oldSettings?.enabled) {
        removeVisualZero();
      } else if (store.settings.enabled) {
        queueMirror('Setting cập nhật', 100);
      }
    },
    { deep: true },
  );

  applyBaseStyle();
  applyCustomStyle();
  void mirrorNow('Đồng bộ khởi tạo');

  return {
    mirrorNow,
    toggleRevealLatest,
    hideAgain,
    applyAll,
    getUiMountElement,
    releaseUiMountElement,
    dispose: () => {
      disposed = true;
      uiMountActive = false;
      window.clearTimeout(mirrorTimer);
      observer.disconnect();
      stopWatch();
      stopList.forEach(stop => stop());
      removeVisualZero();
      $('#chat').removeClass('tangquan-zero-lock').removeAttr('data-tq-hide');
      $('body').removeAttr('data-tangquan-zero-lock-hide');
      removeParentStyle(hideStyleId);
      removeParentStyle(customStyleId);
    },
  };
}
