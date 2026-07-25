import { teleportStyle } from '@util/script';
import { createApp, type App as VueApplication } from 'vue';
import { createPinia } from 'pinia';
import TangquanApp from './App.vue';
import './mobileLandscape.scss';
import { classifyTangquanViewport, readTangquanViewportMetrics } from './mobileViewport';
import type { TangquanGameUiController, TangquanGameUiServices } from './types';

export type { TangquanGameUiController } from './types';

type TangquanAppExposed = Pick<TangquanGameUiController, 'inspectAutoSave' | 'markAutoSaveDirty' | 'requestAutoSave'>;

function syncInlineFrameSize(iframe: HTMLIFrameElement, host: HTMLElement): () => void {
  let disposed = false;
  const browserWindow = window.parent;

  const applyViewport = () => {
    if (disposed) {
      return;
    }
    if (iframe.dataset.tqBrowserViewportExpanded === 'true' || iframe.ownerDocument.fullscreenElement === iframe) {
      return;
    }
    const viewport = readTangquanViewportMetrics(browserWindow);
    const viewportMode = classifyTangquanViewport(viewport);
    const hostWidth = host.getBoundingClientRect().width || host.clientWidth || 960;
    const width = Math.min(hostWidth, viewport.width, 1366);
    const height =
      viewportMode === 'mobile-landscape'
        ? Math.round(viewport.height)
        : viewportMode === 'mobile-portrait'
          ? Math.min(viewport.height, Math.round((width * 16) / 9))
          : Math.round((width * 9) / 16);

    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.aspectRatio = viewportMode === 'desktop' ? '16 / 9' : 'auto';
    iframe.dataset.viewportMode = viewportMode;
    host.dataset.viewportMode = viewportMode;
  };

  const observer = new ResizeObserver(applyViewport);
  observer.observe(host);
  browserWindow.addEventListener('resize', applyViewport);
  browserWindow.addEventListener('orientationchange', applyViewport);
  browserWindow.visualViewport?.addEventListener('resize', applyViewport);
  browserWindow.visualViewport?.addEventListener('scroll', applyViewport);
  applyViewport();

  return () => {
    disposed = true;
    observer.disconnect();
    browserWindow.removeEventListener('resize', applyViewport);
    browserWindow.removeEventListener('orientationchange', applyViewport);
    browserWindow.visualViewport?.removeEventListener('resize', applyViewport);
    browserWindow.visualViewport?.removeEventListener('scroll', applyViewport);
  };
}

export function createTangquanGameUi(services: TangquanGameUiServices): TangquanGameUiController {
  let app: VueApplication<Element> | null = null;
  let appExposed: TangquanAppExposed | null = null;
  let iframeElement: HTMLIFrameElement | null = null;
  let hostElement: HTMLElement | null = null;
  let destroyStyle: (() => void) | null = null;
  let destroyFrameSize: (() => void) | null = null;
  let attachObserver: MutationObserver | null = null;
  let attachGuardTimer = 0;
  let loading = false;
  let uiMemorySnapshot: Record<string, unknown> | null = null;
  const uiMemory = {
    read: () => uiMemorySnapshot,
    write: (snapshot: Record<string, unknown>) => {
      uiMemorySnapshot = snapshot;
    },
    clear: () => {
      uiMemorySnapshot = null;
    },
  };
  const appServices: TangquanGameUiServices = { ...services, uiMemory };

  function styleHost(host: HTMLElement) {
    host.style.display = 'grid';
    host.style.placeItems = 'center';
    host.style.width = 'min(100%, 1366px)';
    host.style.margin = '0 auto';
    host.style.overflow = 'hidden';
    host.style.background = '#100b08';
  }

  function ensureFrameAttached() {
    if (!iframeElement) {
      return;
    }
    const host = services.zeroLock.getUiMountElement();
    styleHost(host);
    if (hostElement !== host) {
      destroyFrameSize?.();
      destroyFrameSize = null;
      hostElement = host;
    }
    if (!host.contains(iframeElement)) {
      host.innerHTML = '';
      host.appendChild(iframeElement);
    }
    if (!destroyFrameSize) {
      destroyFrameSize = syncInlineFrameSize(iframeElement, host);
    }
  }

  function shouldRepairFrameAttachment() {
    return Boolean(iframeElement && !iframeElement.isConnected);
  }

  function runAttachGuard() {
    if (!shouldRepairFrameAttachment()) {
      return;
    }
    services.log.warn('Frontend chính thức', 'Phát hiện giao diện game tách khỏi tầng, đang gắn lại tầng 0');
    ensureFrameAttached();
  }

  function startAttachGuard() {
    if (attachObserver || attachGuardTimer) {
      return;
    }

    const chat = window.parent.document.querySelector('#chat');
    if (chat) {
      attachObserver = new MutationObserver(runAttachGuard);
      attachObserver.observe(chat, { childList: true, subtree: true });
    }
    attachGuardTimer = window.setInterval(runAttachGuard, 1000);
  }

  function stopAttachGuard() {
    attachObserver?.disconnect();
    attachObserver = null;
    window.clearInterval(attachGuardTimer);
    attachGuardTimer = 0;
  }

  function queueAttachGuards() {
    window.requestAnimationFrame(ensureFrameAttached);
    window.setTimeout(ensureFrameAttached, 80);
    window.setTimeout(ensureFrameAttached, 300);
    startAttachGuard();
  }

  function mount() {
    if (iframeElement || loading) {
      return;
    }

    loading = true;
    services.log.info('Frontend chính thức', 'Bắt đầu gắn giao diện Vue vào tầng 0');
    const host = services.zeroLock.getUiMountElement();
    host.innerHTML = '';
    styleHost(host);
    hostElement = host;

    const iframe = window.parent.document.createElement('iframe');
    iframe.setAttribute('script_id', getScriptId());
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('title', 'Hoa Chưa Nở');
    iframe.setAttribute('allow', 'fullscreen');
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;border:0;background:#100b08;';
    iframe.srcdoc =
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body></body></html>';

    iframe.addEventListener('load', () => {
      app?.unmount();
      app = null;
      appExposed = null;
      destroyStyle?.();
      destroyStyle = null;
      const iframeDocument = iframe.contentDocument;
      if (!iframeDocument) {
        services.log.error('Frontend chính thức', 'Gắn giao diện Vue thất bại: không truy cập được tài liệu iframe');
        loading = false;
        return;
      }

      iframeDocument.documentElement.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
      iframeDocument.body.style.cssText =
        'display:grid;place-items:center;width:100%;height:100%;margin:0;overflow:hidden;background:#100b08;';
      destroyStyle = teleportStyle(iframeDocument.head).destroy;
      app = createApp(TangquanApp, {
        services: appServices,
        onClose: close,
      }).use(createPinia());
      appExposed = app.mount(iframeDocument.body) as unknown as TangquanAppExposed;
      loading = false;
      queueAttachGuards();
      services.log.info('Frontend chính thức', 'Gắn giao diện Vue hoàn thành');
    });

    host.appendChild(iframe);
    iframeElement = iframe;
    destroyFrameSize = syncInlineFrameSize(iframe, host);
    queueAttachGuards();
  }

  function open() {
    if (!iframeElement) {
      mount();
      return;
    }
    iframeElement.style.display = 'block';
    if (hostElement) {
      hostElement.style.display = 'grid';
    }
    startAttachGuard();
    ensureFrameAttached();
    services.zeroLock.applyAll();
    services.log.info('Frontend chính thức', 'Mở giao diện Vue');
  }

  function close() {
    if (!iframeElement) {
      return;
    }
    stopAttachGuard();
    destroyFrameSize?.();
    destroyFrameSize = null;
    iframeElement.style.display = 'none';
    if (hostElement) {
      hostElement.style.display = 'none';
    }
    services.zeroLock.applyAll();
    services.log.info('Frontend chính thức', 'Thu gọn giao diện Vue');
  }

  function isVisible() {
    return iframeElement !== null && iframeElement.style.display !== 'none';
  }

  function inspectAutoSave() {
    return appExposed?.inspectAutoSave() ?? null;
  }

  function markAutoSaveDirty(reason: string) {
    if (!appExposed) return false;
    appExposed.markAutoSaveDirty(reason);
    return true;
  }

  function requestAutoSave(reason: string, force = false) {
    return appExposed?.requestAutoSave(reason, force) ?? Promise.resolve(null);
  }

  function toggle() {
    if (isVisible()) {
      close();
    } else {
      open();
    }
  }

  function dispose() {
    services.log.info('Frontend chính thức', 'Gỡ giao diện Vue');
    app?.unmount();
    app = null;
    appExposed = null;
    destroyStyle?.();
    destroyStyle = null;
    destroyFrameSize?.();
    destroyFrameSize = null;
    stopAttachGuard();
    iframeElement?.remove();
    iframeElement = null;
    hostElement?.remove();
    hostElement = null;
    uiMemory.clear();
    services.zeroLock.releaseUiMountElement();
    loading = false;
  }

  return {
    open,
    close,
    toggle,
    isVisible,
    inspectAutoSave,
    markAutoSaveDirty,
    requestAutoSave,
    dispose,
  };
}
