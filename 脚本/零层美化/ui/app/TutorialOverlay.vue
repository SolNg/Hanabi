<template>
  <aside
    v-if="active && step"
    ref="panel"
    class="tutorial-panel"
    :data-placement="step.placement ?? 'right'"
    :style="panelStyle"
    aria-live="polite"
  >
    <header>
      <small>Hướng dẫn người mới · {{ index + 1 }} / {{ total }}</small>
      <button type="button" @click="$emit('skip')">Bỏ qua hướng dẫn</button>
    </header>
    <div class="tutorial-progress"><i :style="{ width: `${progress}%` }" /></div>
    <h2>{{ step.title }}</h2>
    <p>{{ step.text }}</p>
    <footer>
      <span v-if="step.action">Bấm vào vị trí highlight để tiếp tục</span>
      <button v-else type="button" @click="$emit('next')">{{ step.buttonLabel || 'Bước tiếp theo' }}</button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { TutorialStep } from './tutorial';

const props = defineProps<{
  active: boolean;
  step: TutorialStep | null;
  index: number;
  total: number;
}>();

defineEmits<{
  next: [];
  skip: [];
}>();

const progress = computed(() => Math.round(((props.index + 1) / Math.max(1, props.total)) * 100));
const panel = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});
let panelWindow: Window | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function positionPanel() {
  const element = panel.value;
  if (!element || !props.active || !props.step?.action) {
    panelStyle.value = {};
    return;
  }

  const ownerDocument = element.ownerDocument;
  const target = ownerDocument.querySelector<HTMLElement>('.tutorial-target');
  if (!target) {
    panelStyle.value = {};
    return;
  }

  const margin = 18;
  const gap = 22;
  const targetRect = target.getBoundingClientRect();
  const panelRect = element.getBoundingClientRect();
  const viewportWidth = ownerDocument.documentElement.clientWidth;
  const viewportHeight = ownerDocument.documentElement.clientHeight;
  const rightSpace = viewportWidth - targetRect.right - margin;
  const leftSpace = targetRect.left - margin;
  const preferRight = props.step.placement === 'left';
  let left: number;
  let top = targetRect.top + targetRect.height / 2 - panelRect.height / 2;

  if ((preferRight && rightSpace >= panelRect.width + gap) || leftSpace < panelRect.width + gap) {
    left = targetRect.right + gap;
  } else {
    left = targetRect.left - panelRect.width - gap;
  }

  if (left < margin || left + panelRect.width > viewportWidth - margin) {
    left = targetRect.left + targetRect.width / 2 - panelRect.width / 2;
    const below = targetRect.bottom + gap;
    const above = targetRect.top - panelRect.height - gap;
    top = below + panelRect.height <= viewportHeight - margin ? below : above;
  }

  panelStyle.value = {
    left: `${Math.round(clamp(left, margin, viewportWidth - panelRect.width - margin))}px`,
    right: 'auto',
    top: `${Math.round(clamp(top, margin, viewportHeight - panelRect.height - margin))}px`,
    transform: 'none',
  };
}

async function queuePositionPanel() {
  await nextTick();
  requestAnimationFrame(positionPanel);
}

watch(() => [props.active, props.index, props.step?.action], queuePositionPanel, { immediate: true, flush: 'post' });
onMounted(() => {
  panelWindow = panel.value?.ownerDocument.defaultView ?? null;
  panelWindow?.addEventListener('resize', positionPanel);
});
onBeforeUnmount(() => panelWindow?.removeEventListener('resize', positionPanel));
</script>

<style scoped>
.tutorial-panel {
  position: fixed;
  z-index: 75;
  top: 50%;
  width: min(360px, calc(100vw - 48px));
  padding: 22px 24px 20px;
  border: 1px solid rgba(215, 179, 109, 0.62);
  background: rgba(13, 11, 9, 0.96);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.54);
  color: #f7ecdc;
  transform: translateY(-50%);
  pointer-events: none;
}

.tutorial-panel[data-placement='left'] {
  left: clamp(24px, 5vw, 72px);
}

.tutorial-panel[data-placement='right'] {
  right: clamp(24px, 5vw, 72px);
}

.tutorial-panel[data-placement='center'] {
  left: 50%;
  transform: translate(-50%, -50%);
}

header,
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

header small,
footer span {
  color: rgba(247, 236, 220, 0.56);
  font-size: 11px;
}

button {
  padding: 7px 12px;
  border: 1px solid rgba(247, 236, 220, 0.24);
  background: transparent;
  color: #f7ecdc;
  cursor: pointer;
  font: inherit;
  pointer-events: auto;
}

.tutorial-progress {
  height: 2px;
  margin: 15px 0 20px;
  background: rgba(247, 236, 220, 0.12);
}

.tutorial-progress i {
  display: block;
  height: 100%;
  background: #d7b36d;
  transition: width 180ms ease;
}

h2 {
  margin: 0;
  font-family: serif;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0;
}

p {
  margin: 14px 0 22px;
  color: rgba(247, 236, 220, 0.78);
  font-size: 13px;
  line-height: 1.75;
}

footer {
  justify-content: flex-end;
}

footer button {
  min-width: 112px;
  border-color: rgba(215, 179, 109, 0.7);
}
</style>
