<template>
  <section
    v-if="open"
    ref="layerRef"
    class="time-picker-layer"
    aria-label="Chọn thời gian game"
    tabindex="-1"
    @keydown.esc="emit('cancel')"
  >
    <button class="time-picker-backdrop" type="button" aria-label="Hủy chọn thời gian" @click="emit('cancel')" />
    <div class="time-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="time-picker-title">
      <header>
        <small>Hoa Chưa Nở · {{ mode }}</small>
        <h2 id="time-picker-title">Đẩy thời gian game</h2>
        <p>Chỉ đẩy về phía trước; khi mục tiêu sớm hơn thời gian hiện tại, sẽ hoàn thành quy trình qua ngày trước.</p>
      </header>

      <div class="time-picker-summary">
        <span>Thời gian hiện tại<strong>{{ normalizedCurrentTime }}</strong></span>
        <span class="time-picker-arrow" aria-hidden="true">→</span>
        <span>Thời gian mục tiêu<strong>{{ targetTime }}</strong></span>
      </div>

      <div class="time-picker-wheels" aria-label="Bánh xe chọn giờ và phút">
        <div class="time-picker-wheel-group">
          <span>Giờ</span>
          <div ref="hourWheelRef" class="time-picker-wheel" role="listbox" aria-label="Giờ">
            <button
              v-for="hour in hours"
              :key="hour"
              :data-time-value="hour"
              class="time-picker-option"
              :class="{ 'is-selected': selectedHour === hour }"
              type="button"
              role="option"
              :aria-selected="selectedHour === hour"
              @click="selectHour(hour)"
            >
              {{ hour }}
            </button>
          </div>
        </div>
        <span class="time-picker-colon" aria-hidden="true">:</span>
        <div class="time-picker-wheel-group">
          <span>Phút</span>
          <div ref="minuteWheelRef" class="time-picker-wheel" role="listbox" aria-label="Phút">
            <button
              v-for="minute in minutes"
              :key="minute"
              :data-time-value="minute"
              class="time-picker-option"
              :class="{ 'is-selected': selectedMinute === minute }"
              type="button"
              role="option"
              :aria-selected="selectedMinute === minute"
              @click="selectMinute(minute)"
            >
              {{ minute }}
            </button>
          </div>
        </div>
      </div>

      <p class="time-picker-impact" :class="{ 'is-cross-day': plan.ok && plan.crossesMidnight }">
        {{ impactText }}
      </p>

      <div class="time-picker-actions">
        <button type="button" @click="emit('cancel')">Hủy</button>
        <button class="is-primary" type="button" :disabled="!plan.ok" @click="confirmSelection">Xác nhận đẩy</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { normalizeTangquanClock, planTangquanTimeTravel } from './timeTravel';

const props = defineProps<{
  open: boolean;
  currentTime: string;
  mode: '老板' | '游客' | '服务员';
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [payload: { targetTime: string; crossesMidnight: boolean }];
}>();

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const selectedHour = ref('00');
const selectedMinute = ref('00');
const layerRef = ref<HTMLElement | null>(null);
const hourWheelRef = ref<HTMLElement | null>(null);
const minuteWheelRef = ref<HTMLElement | null>(null);
const normalizedCurrentTime = computed(() => normalizeTangquanClock(props.currentTime) ?? '--:--');
const targetTime = computed(() => `${selectedHour.value}:${selectedMinute.value}`);
const plan = computed(() => planTangquanTimeTravel(props.currentTime, targetTime.value));
const impactText = computed(() => {
  if (!plan.value.ok) return plan.value.reason;
  if (plan.value.crossesMidnight) {
    return `Sẽ đẩy ${plan.value.advanceMinutes} phút, và hoàn thành quyết toán hôm nay cùng sắp xếp ngày hôm sau trước.`;
  }
  return `Sẽ đẩy về phía trước ${plan.value.advanceMinutes} phút trong ngày, không kích hoạt quyết toán qua ngày.`;
});

function scrollSelected(wheel: HTMLElement | null, value: string) {
  wheel?.querySelector<HTMLElement>(`[data-time-value="${value}"]`)?.scrollIntoView({ block: 'center' });
}

function selectHour(value: string) {
  selectedHour.value = value;
  scrollSelected(hourWheelRef.value, value);
}

function selectMinute(value: string) {
  selectedMinute.value = value;
  scrollSelected(minuteWheelRef.value, value);
}

function confirmSelection() {
  if (!plan.value.ok) return;
  emit('confirm', { targetTime: plan.value.targetTime, crossesMidnight: plan.value.crossesMidnight });
}

watch(
  () => [props.open, props.currentTime] as const,
  async ([open]) => {
    if (!open) return;
    const current = normalizeTangquanClock(props.currentTime) ?? '00:00';
    [selectedHour.value, selectedMinute.value] = current.split(':');
    await nextTick();
    scrollSelected(hourWheelRef.value, selectedHour.value);
    scrollSelected(minuteWheelRef.value, selectedMinute.value);
    layerRef.value?.focus();
  },
  { immediate: true },
);
</script>

<style scoped>
.time-picker-layer {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 24px;
  color: #f7ecdc;
  outline: none;
}

.time-picker-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: rgba(12, 8, 6, 0.76);
  backdrop-filter: blur(8px);
}

.time-picker-dialog {
  position: relative;
  width: min(440px, 100%);
  overflow: hidden;
  border: 1px solid rgba(222, 188, 137, 0.5);
  border-radius: 22px;
  background:
    linear-gradient(160deg, rgba(73, 48, 35, 0.98), rgba(27, 20, 17, 0.99)),
    #241914;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55), inset 0 1px rgba(255, 255, 255, 0.06);
}

header {
  padding: 24px 26px 16px;
  text-align: center;
}

header small {
  color: #d8b881;
  letter-spacing: 0.16em;
}

header h2 {
  margin: 7px 0 5px;
  font-family: "Noto Serif SC", serif;
  font-size: 25px;
  font-weight: 600;
}

header p,
.time-picker-impact {
  margin: 0;
  color: rgba(247, 236, 220, 0.68);
  font-size: 13px;
  line-height: 1.65;
}

.time-picker-summary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin: 0 26px;
  padding: 13px 18px;
  border: 1px solid rgba(222, 188, 137, 0.22);
  border-radius: 14px;
  background: rgba(10, 7, 5, 0.22);
  text-align: center;
}

.time-picker-summary span:not(.time-picker-arrow) {
  display: grid;
  gap: 3px;
  color: rgba(247, 236, 220, 0.58);
  font-size: 12px;
}

.time-picker-summary strong {
  color: #f7ecdc;
  font-size: 21px;
  font-variant-numeric: tabular-nums;
}

.time-picker-arrow {
  color: #c99c5f;
  font-size: 22px;
}

.time-picker-wheels {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  width: min(292px, calc(100% - 52px));
  margin: 20px auto 16px;
}

.time-picker-wheel-group {
  display: grid;
  gap: 8px;
  text-align: center;
}

.time-picker-wheel-group > span {
  color: rgba(247, 236, 220, 0.52);
  font-size: 12px;
  letter-spacing: 0.2em;
}

.time-picker-wheel {
  height: 190px;
  overflow-y: auto;
  padding-block: 70px;
  border: 1px solid rgba(222, 188, 137, 0.22);
  border-radius: 16px;
  background: linear-gradient(rgba(18, 12, 9, 0.86), rgba(57, 37, 27, 0.7), rgba(18, 12, 9, 0.86));
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.time-picker-wheel::-webkit-scrollbar {
  display: none;
}

.time-picker-option {
  display: block;
  width: calc(100% - 14px);
  height: 42px;
  margin: 0 7px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(247, 236, 220, 0.42);
  font: 18px/1 ui-monospace, "SFMono-Regular", Consolas, monospace;
  font-variant-numeric: tabular-nums;
  scroll-snap-align: center;
  cursor: pointer;
  transition: 0.16s ease;
}

.time-picker-option:hover {
  color: #f7ecdc;
  background: rgba(255, 255, 255, 0.05);
}

.time-picker-option.is-selected {
  color: #291a12;
  background: linear-gradient(135deg, #efd5a8, #c99c5f);
  box-shadow: 0 5px 18px rgba(201, 156, 95, 0.25);
  font-weight: 700;
}

.time-picker-colon {
  margin-top: 20px;
  color: #d8b881;
  font-size: 26px;
}

.time-picker-impact {
  min-height: 42px;
  margin: 0 26px;
  padding: 10px 13px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  text-align: center;
}

.time-picker-impact.is-cross-day {
  color: #f1c98f;
  background: rgba(154, 92, 48, 0.18);
}

.time-picker-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 20px 26px 25px;
}

.time-picker-actions button {
  min-height: 44px;
  border: 1px solid rgba(222, 188, 137, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.045);
  color: #f7ecdc;
  cursor: pointer;
}

.time-picker-actions button.is-primary {
  border-color: transparent;
  background: linear-gradient(135deg, #e8c58e, #b97e42);
  color: #24150e;
  font-weight: 700;
}

.time-picker-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (max-height: 620px) {
  .time-picker-layer {
    align-items: start;
    overflow-y: auto;
    padding-block: 12px;
  }

  .time-picker-wheel {
    height: 150px;
    padding-block: 50px;
  }
}
</style>
