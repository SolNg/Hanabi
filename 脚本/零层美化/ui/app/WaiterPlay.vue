<template>
  <section class="waiter-play-layer" :class="{ 'is-menu-open': menuOpen }" aria-label="Chế độ chơi phục vụ">
    <template v-if="!menuOpen">
      <header class="waiter-brand">
        <img class="waiter-seal" :src="TANGQUAN_LOGO_URL" alt="" aria-hidden="true" />
        <span><strong>Hoa Chưa Nở</strong><small>Dịch vụ tại tiệm</small></span>
      </header>

      <aside class="waiter-status" aria-label="Trạng thái phục vụ">
        <div class="grade-plaque">
          <b>{{ state.grade }}</b>
          <span>Đánh giá hiện tại</span>
        </div>
        <div class="status-row">
          <span>Thể lực</span><strong>{{ state.stamina }} / {{ state.maxStamina }}</strong>
        </div>
        <div class="stamina-track"><i :style="{ width: `${staminaPercent}%` }" /></div>
        <div class="status-row">
          <span>Vị trí</span><strong>{{ state.shift.area }}</strong>
        </div>
        <div class="status-row">
          <span>Số dư</span><strong>{{ yuan(state.balance) }}</strong>
        </div>
      </aside>

      <div class="waiter-clock">
        <span>{{ state.dateText }}</span>
        <b>{{ state.time }}</b>
        <span>{{ state.location }}</span>
      </div>

      <div class="waiter-sprite" aria-hidden="true">
        <img :src="spriteUrl" alt="" />
        <div class="sprite-caption">
          <strong>{{ workStatusLabel(state.workStatus) }}</strong>
          <span>{{ state.shift.name }} · Lương ngày {{ yuan(state.dailySalary) }}</span>
        </div>
      </div>

      <nav class="waiter-actions" aria-label="Thao tác nhanh phục vụ">
        <template v-if="currentAssignment">
          <button type="button" :disabled="busy" @click="$emit('continue-service')">
            <span>Tiếp tục phục vụ</span><b>›</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('finish-service')"><span>Kết thúc dịch vụ</span><b>■</b></button>
        </template>
        <template v-else>
          <button
            v-if="state.workStatus === '未上班' || state.workStatus === '休息中'"
            type="button"
            :class="{ 'tutorial-target': tutorialTarget === 'waiter-start-shift' }"
            :disabled="busy"
            @click="$emit('start-shift')"
          >
            <span>{{ state.workStatus === '休息中' ? 'Quay lại vị trí' : 'Đến vị trí' }}</span
            ><b>＋</b>
          </button>
          <button
            v-if="nextAssignment"
            type="button"
            :class="{ 'tutorial-target': tutorialTarget === 'waiter-start-service' }"
            :disabled="busy || state.workStatus === '未上班' || state.stamina < 12"
            @click="$emit('start-service', nextAssignment.id)"
          >
            <span>{{ nextAssignment.source === '指名客' ? 'Tiếp đón khách chỉ định' : 'Khách tiếp theo' }}</span
            ><b>›</b>
          </button>
          <button type="button" :disabled="busy || state.workStatus === '未上班'" @click="$emit('rest')">
            <span>Nghỉ ngơi</span><b>○</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('open-menu', 'growth')">
            <span>Trưởng thành</span><b>↗</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('open-menu', 'finance')">
            <span>Thu chi</span><b>¥</b>
          </button>
        </template>
      </nav>

      <button
        class="waiter-dialogue"
        :class="{ 'tutorial-target': tutorialTarget === 'waiter-open-menu' }"
        type="button"
        @click="$emit('open-menu', 'shift')"
      >
        <span class="dialogue-name">{{ state.dialogue.speaker }}</span>
        <span class="dialogue-body">{{ state.dialogue.text }}</span>
        <span class="dialogue-hint">Menu</span>
      </button>
    </template>

    <section v-if="menuOpen" class="waiter-menu-layer" aria-label="Menu phục vụ">
      <nav class="waiter-menu-tabs" aria-label="Danh mục menu phục vụ">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{
            'is-active': view === tab.key,
            'tutorial-target':
              (tutorialTarget === 'waiter-open-growth' && tab.key === 'growth') ||
              (tutorialTarget === 'waiter-open-log' && tab.key === 'log'),
          }"
          @click="$emit('open-menu', tab.key)"
        >
          {{ tab.title }}
        </button>
      </nav>

      <article class="waiter-menu-main">
        <header class="waiter-menu-head">
          <div>
            <small>STAFF RECORD</small>
            <h2>{{ activeTab.title }}</h2>
            <p>{{ activeTab.note }}</p>
          </div>
          <button class="line-button" type="button" @click="$emit('close-menu')">Quay lại</button>
        </header>

        <div class="waiter-menu-content">
          <template v-if="view === 'shift'">
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Ca làm</span><strong>{{ state.shift.name }}</strong>
                <p>{{ state.shift.start }} - {{ state.shift.end }}</p>
              </section>
              <section class="metric-strip">
                <span>Trạng thái làm việc</span><strong>{{ workStatusLabel(state.workStatus) }}</strong>
                <p>{{ state.location }}</p>
              </section>
              <section class="metric-strip">
                <span>Tiếp đón hôm nay</span><strong>{{ completedServices }} / {{ state.assignments.length }}</strong>
                <p>Khách chỉ định phải được hoàn thành trước.</p>
              </section>
            </div>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Ca làm hiện tại</h3>
                <span>{{ state.shift.area }}</span>
              </div>
              <p>{{ state.shiftNote }}</p>
              <div class="strip-actions">
                <button type="button" :disabled="busy || !canStartShift" @click="$emit('start-shift')">Đến vị trí</button>
                <button type="button" :disabled="busy || !canRest" @click="$emit('rest')">Nghỉ ngơi</button>
                <button type="button" :disabled="busy || !canSettle" @click="$emit('settle')">Kết toán tan ca</button>
              </div>
            </section>
            <section v-if="state.latestSettlement" class="settlement-strip">
              <small>Kết toán gần nhất · {{ state.latestSettlement.date }}</small>
              <strong>{{ signedYuan(state.latestSettlement.net) }}</strong>
              <p>
                Thu nhập {{ yuan(state.latestSettlement.income) }} · Chi tiêu {{ yuan(state.latestSettlement.expense) }} ·
                {{ state.latestSettlement.services }} lượt tiếp đón
              </p>
            </section>
          </template>

          <template v-else-if="view === 'service'">
            <section
              v-for="assignment in state.assignments"
              :key="assignment.id"
              class="assignment-strip"
              :class="{ selected: selectedAssignmentId === assignment.id, nomination: assignment.source === '指名客' }"
            >
              <div class="assignment-time">
                <b>{{ assignment.time }}</b
                ><span>{{ assignment.durationMinutes }} phút</span>
              </div>
              <div class="assignment-main">
                <div class="strip-head">
                  <h3>{{ assignment.guest }}</h3>
                  <span>{{ guestSourceLabel(assignment.source) }}</span>
                </div>
                <p v-if="state.guests[assignment.guestId]">
                  {{ state.guests[assignment.guestId].gender }} · {{ state.guests[assignment.guestId].species }} · Ngân sách
                  {{ yuan(state.guests[assignment.guestId].budget) }}
                </p>
                <p>{{ assignment.project }} · {{ assignment.area }}</p>
                <p class="assignment-opening">{{ assignment.opening }}</p>
                <small
                  >{{ assignmentStatusLabel(assignment.status)
                  }}<template v-if="assignment.nominationDays">
                    · Chỉ định {{ assignment.nominationDays }} ngày</template
                  ></small
                >
              </div>
              <div class="assignment-actions">
                <button type="button" @click="$emit('select-assignment', assignment.id)">
                  {{ selectedAssignmentId === assignment.id ? 'Đã chọn' : 'Xem' }}
                </button>
                <button
                  type="button"
                  :disabled="
                    busy ||
                    assignment.status !== '待接待' ||
                    state.workStatus === '未上班' ||
                    Boolean(state.currentService)
                  "
                  @click="$emit('start-service', assignment.id)"
                >
                  Bắt đầu
                </button>
              </div>
            </section>
          </template>

          <template v-else-if="view === 'nomination'">
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Chỉ định hiện tại</span><strong>{{ state.activeNominations.length }}</strong>
                <p>Tổng cộng nhận {{ state.evaluation.nominationCount }} lượt chỉ định.</p>
              </section>
              <section class="metric-strip">
                <span>Phí chỉ định mỗi lượt</span><strong>{{ yuan(nominationFee) }}</strong>
                <p>Toàn bộ thuộc về bạn.</p>
              </section>
              <section class="metric-strip">
                <span>Thu nhập chỉ định hôm nay</span><strong>{{ yuan(state.todayIncome.指名费) }}</strong>
                <p>Kết toán sau khi hoàn thành tiếp đón chỉ định trong ngày.</p>
              </section>
            </div>
            <div v-if="state.activeNominations.length" class="nomination-list">
              <section v-for="nomination in state.activeNominations" :key="nomination.guestId" class="focus-strip">
                <small>Chỉ định xuyên ngày hiện tại</small>
                <strong>{{ nomination.guest }}</strong>
                <p>{{ nomination.project }} · {{ nomination.area }} · Còn lại {{ nomination.remainingDays }} ngày</p>
              </section>
            </div>
            <section v-else class="data-strip">
              <div class="strip-head">
                <h3>Chưa có chỉ định xuyên ngày</h3>
                <span>Hạng {{ state.grade }}</span>
              </div>
              <p>Tiếp tục tích lũy đánh giá và khách quen, lịch chỉ định sẽ tự nhiên xuất hiện.</p>
            </section>
          </template>

          <template v-else-if="view === 'growth'">
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Hoàn thành tiêu chuẩn</span><strong>{{ state.growth.标准服务.完成次数 }}</strong>
                <p>Nguồn trưởng thành chính của lộ trình tiêu chuẩn.</p>
              </section>
              <section class="metric-strip">
                <span>Từ chối lịch sự</span><strong>{{ state.growth.标准服务.礼貌拒绝次数 }}</strong>
              </section>
              <section class="metric-strip">
                <span>Đánh giá tốt</span><strong>{{ state.growth.标准服务.好评次数 }}</strong>
                <p>Căn cứ quan trọng cho đánh giá hạng và lương ngày.</p>
              </section>
            </div>
            <section class="growth-section">
              <header>
                <h3>Độ thành thạo</h3>
                <span>Quy đổi từ số lần thực tế và đầu tư cá nhân</span>
              </header>
              <div class="skill-grid">
                <div v-for="(value, name) in state.skills" :key="name" class="skill-row">
                  <span>{{ skillLabel(name) }}</span
                  ><b>{{ value }}</b
                  ><i><em :style="{ width: `${value}%` }" /></i>
                </div>
              </div>
            </section>
            <section class="growth-section">
              <header>
                <h3>Kết quả khách quan</h3>
                <span>Chỉ ghi lại những kết quả đã xảy ra</span>
              </header>
              <div class="count-grid">
                <span
                  >Chạm ngực <b>{{ state.growth.擦边记录.胸部接触次数 }}</b></span
                >
                <span
                  >Chạm đùi <b>{{ state.growth.擦边记录.大腿接触次数 }}</b></span
                >
                <span
                  >Cọ xát qua vải <b>{{ state.growth.擦边记录.隔衣摩擦次数 }}</b></span
                >
                <span
                  >Thủ dâm bằng tay <b>{{ state.growth.性服务记录.手交次数 }}</b></span
                >
                <span
                  >Khẩu dâm <b>{{ state.growth.性服务记录.口交次数 }}</b></span
                >
                <span
                  >Giao hợp âm đạo <b>{{ state.growth.性服务记录.阴道性交次数 }}</b></span
                >
                <span
                  >Giao hợp hậu môn <b>{{ state.growth.性服务记录.肛交次数 }}</b></span
                >
                <span
                  >Phục vụ tình dục nhóm <b>{{ state.growth.性服务记录.多人性服务次数 }}</b></span
                >
              </div>
            </section>
            <section class="preserve-strip">
              <span :class="{ kept: state.growth.保持记录.未发生性服务 }">Chưa xảy ra quan hệ tình dục</span>
              <span :class="{ kept: state.growth.保持记录.阴道未插入 }">Chưa xâm nhập âm đạo</span>
              <span :class="{ kept: state.growth.保持记录.肛门未插入 }">Chưa xâm nhập hậu môn</span>
            </section>
          </template>

          <template v-else-if="view === 'finance'">
            <div class="metric-grid four">
              <section class="metric-strip">
                <span>Lương ngày</span><strong>{{ yuan(state.todayIncome.日薪 || state.dailySalary) }}</strong>
                <p>Ghi nhận khi tan ca.</p>
              </section>
              <section class="metric-strip">
                <span>Tiền boa</span><strong>{{ yuan(state.todayIncome.打赏) }}</strong>
                <p>Phát sinh từ đánh giá của khách.</p>
              </section>
              <section class="metric-strip">
                <span>Phí chỉ định</span><strong>{{ yuan(state.todayIncome.指名费) }}</strong>
                <p>Toàn bộ thuộc về cá nhân.</p>
              </section>
              <section class="metric-strip">
                <span>Thu nhập thêm</span><strong>{{ yuan(state.todayIncome.额外服务) }}</strong>
                <p>Chỉ kết toán theo kết quả đã xác nhận.</p>
              </section>
            </div>
            <section class="balance-band">
              <div>
                <small>Số dư cá nhân</small><strong>{{ yuan(state.balance) }}</strong>
              </div>
              <div>
                <small>Thu nhập hôm nay</small><strong>{{ yuan(todayIncome) }}</strong>
              </div>
              <div>
                <small>Chi tiêu hôm nay</small><strong>{{ yuan(state.todayExpense) }}</strong>
              </div>
              <div>
                <small>Chi phí sinh hoạt hàng ngày</small><strong>{{ yuan(livingCost) }}</strong>
              </div>
            </section>
            <section class="ledger-list">
              <div v-for="entry in state.ledger.slice(0, 12)" :key="entry.id" class="ledger-row">
                <span
                  ><b>{{ ledgerKindLabel(entry.kind) }}</b
                  ><small>{{ entry.note }}</small></span
                >
                <strong :class="{ expense: entry.amount < 0 }">{{ signedYuan(entry.amount) }}</strong>
              </div>
              <p v-if="state.ledger.length === 0" class="empty-note">Chưa có ghi chép thu chi cá nhân nào.</p>
            </section>
          </template>

          <template v-else-if="view === 'rating'">
            <section class="rating-focus">
              <div class="rating-letter">{{ state.grade }}</div>
              <div class="rating-copy">
                <small>Đánh giá hiện tại</small><strong>{{ state.ratingPoints }} điểm đánh giá</strong>
                <div class="rating-track"><i :style="{ width: `${gradeProgress}%` }" /></div>
                <p v-if="nextGrade">
                  Còn cách hạng {{ nextGrade }}: {{ nextRule.points }} điểm, {{ nextRule.services }} lượt đánh giá, trung bình
                  {{ nextRule.average.toFixed(1) }} điểm.
                </p>
                <p v-else>Đã đạt hạng cao nhất hiện tại.</p>
              </div>
            </section>
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Đánh giá trung bình</span><strong>{{ state.evaluation.averageScore.toFixed(2) }}</strong>
                <p>{{ state.evaluation.reviewCount }} lượt đánh giá hợp lệ.</p>
              </section>
              <section class="metric-strip">
                <span>Ghi nhận đánh giá tốt</span><strong>{{ state.evaluation.goodReviewCount }}</strong>
                <p>Từ 4.4 điểm trở lên.</p>
              </section>
              <section class="metric-strip">
                <span>Lương ngày hiện tại</span><strong>{{ yuan(state.dailySalary) }}</strong>
                <p>Tự động điều chỉnh sau khi thăng hạng.</p>
              </section>
            </div>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Lộ trình thăng hạng</h3>
                <span>Đều khả thi</span>
              </div>
              <p>
                Hoàn thành ổn định dịch vụ tiêu chuẩn, từ chối khéo léo các yêu cầu ngoài phạm vi, đạt được đánh giá tốt lâu dài, vẫn có thể đạt hạng cao nhất. Dịch vụ thêm chỉ giúp tăng nhanh thu nhập và một phần độ thành thạo.
              </p>
            </section>
          </template>

          <template v-else-if="view === 'investment'">
            <section v-for="option in investmentOptions" :key="option.key" class="investment-strip">
              <div>
                <div class="strip-head">
                  <h3>{{ option.title }}</h3>
                  <span v-if="option.kind === 'investment'"
                    >{{ state.investments[option.key as WaiterInvestmentKey] }} / {{ option.maxLevel }}</span
                  ><span v-else>Hồi phục</span>
                </div>
                <p>{{ option.description }}</p>
              </div>
              <button
                type="button"
                :disabled="busy || state.balance < optionCost(option.key) || optionAtMax(option)"
                @click="$emit('spend', option.key)"
              >
                {{ optionAtMax(option) ? 'Đã đạt cấp tối đa' : yuan(optionCost(option.key)) }}
              </button>
            </section>
          </template>

          <template v-else>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Tương tác tại chỗ</h3>
                <span>Hành động tự do</span>
              </div>
              <div class="strip-actions">
                <button type="button" :disabled="busy" @click="$emit('boss-talk')">Nói chuyện với ông chủ</button>
                <button type="button" :disabled="busy" @click="$emit('coworker-talk')">Trò chuyện với đồng nghiệp</button>
                <button
                  type="button"
                  :class="{ 'tutorial-target': tutorialTarget === 'waiter-open-save' }"
                  :disabled="busy"
                  @click="$emit('open-save')"
                >
                  Lưu game
                </button>
              </div>
            </section>
            <section v-for="(entry, index) in state.logs.slice(0, 30)" :key="`${index}-${entry}`" class="log-row">
              <span>{{ entry }}</span>
            </section>
          </template>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TANGQUAN_LOGO_URL } from './mediaCatalog';
import {
  getWaiterCompletedServices,
  getWaiterGradeProgress,
  getWaiterInvestmentCost,
  getWaiterLivingCost,
  getWaiterNextGrade,
  getWaiterTodayIncome,
  WAITER_GRADE_RULES,
  WAITER_INVESTMENT_OPTIONS,
  type WaiterInvestmentKey,
  type WaiterInvestmentOption,
  type WaiterMenuView,
  type WaiterPageState,
  type WaiterRecoveryKey,
} from './waiterGame';

const props = defineProps<{
  state: WaiterPageState;
  view: WaiterMenuView;
  menuOpen: boolean;
  selectedAssignmentId: string;
  spriteUrl: string;
  busy: boolean;
  tutorialTarget?: string;
}>();

defineEmits<{
  'open-menu': [view: WaiterMenuView];
  'close-menu': [];
  'select-assignment': [assignmentId: string];
  'start-shift': [];
  rest: [];
  'start-service': [assignmentId: string];
  'continue-service': [];
  'finish-service': [];
  spend: [key: WaiterInvestmentKey | WaiterRecoveryKey];
  settle: [];
  'boss-talk': [];
  'coworker-talk': [];
  'open-save': [];
}>();

const tabs: { key: WaiterMenuView; title: string; note: string }[] = [
  { key: 'shift', title: 'Ca làm', note: 'Đến vị trí, nghỉ ngơi và kết toán tan ca.' },
  { key: 'service', title: 'Tiếp đón', note: 'Khách thường, khách quen và khách chỉ định hôm nay.' },
  { key: 'nomination', title: 'Chỉ định', note: 'Xem chỉ định xuyên ngày và phí chỉ định cá nhân.' },
  { key: 'growth', title: 'Trưởng thành', note: 'Số lần khách quan, độ thành thạo và kỷ lục duy trì.' },
  { key: 'finance', title: 'Thu chi', note: 'Thu nhập cá nhân, chi tiêu, số dư và dòng tiền.' },
  { key: 'rating', title: 'Đánh giá', note: 'Ngưỡng đánh giá, lương ngày và tiến độ thăng hạng.' },
  { key: 'investment', title: 'Đầu tư', note: 'Hồi phục thể lực và nâng cao năng lực dài hạn.' },
  { key: 'log', title: 'Nhật ký', note: 'Lối vào tương tác và những việc vừa xảy ra.' },
];

const activeTab = computed(() => tabs.find(tab => tab.key === props.view) ?? tabs[0]);
const currentAssignment = computed(() =>
  props.state.currentService
    ? (props.state.assignments.find(item => item.id === props.state.currentService?.assignmentId) ?? null)
    : null,
);
const nextAssignment = computed(() => {
  const pending = props.state.assignments.filter(item => item.status === '待接待');
  return pending.find(item => item.source === '指名客') ?? pending[0] ?? null;
});
const selectedAssignmentId = computed(() => props.selectedAssignmentId);
const staminaPercent = computed(() => Math.round((props.state.stamina / Math.max(1, props.state.maxStamina)) * 100));
const completedServices = computed(() => getWaiterCompletedServices(props.state));
const todayIncome = computed(() => getWaiterTodayIncome(props.state));
const livingCost = computed(() => getWaiterLivingCost(props.state));
const nominationFee = computed(() => WAITER_GRADE_RULES[props.state.grade].nominationFee);
const gradeProgress = computed(() => getWaiterGradeProgress(props.state));
const nextGrade = computed(() => getWaiterNextGrade(props.state));
const nextRule = computed(() => WAITER_GRADE_RULES[nextGrade.value ?? props.state.grade]);
const investmentOptions = WAITER_INVESTMENT_OPTIONS;
const canStartShift = computed(() => ['未上班', '休息中'].includes(props.state.workStatus));
const canRest = computed(
  () =>
    !props.state.currentService && !props.state.freeRestUsed && !['未上班', '已下班'].includes(props.state.workStatus),
);
const canSettle = computed(
  () =>
    !props.state.currentService &&
    !['未上班', '已下班'].includes(props.state.workStatus) &&
    !props.state.assignments.some(item => item.source === '指名客' && item.status === '待接待'),
);

const WORK_STATUS_LABELS: Record<string, string> = {
  未上班: 'Chưa vào ca',
  待岗: 'Đang chờ trực',
  休息中: 'Đang nghỉ',
  接客中: 'Đang tiếp khách',
  被指名: 'Đang được chỉ định',
  已下班: 'Đã tan ca',
};
const GUEST_SOURCE_LABELS: Record<string, string> = {
  普通客: 'Khách thường',
  回头客: 'Khách quen',
  指名客: 'Khách chỉ định',
};
const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  待接待: 'Chờ tiếp đón',
  进行中: 'Đang diễn ra',
  已完成: 'Đã hoàn thành',
  已错过: 'Đã bỏ lỡ',
};
const SKILL_LABELS: Record<string, string> = {
  标准服务: 'Dịch vụ tiêu chuẩn',
  沟通应对: 'Giao tiếp ứng biến',
  手部服务: 'Dịch vụ bằng tay',
  口部服务: 'Dịch vụ bằng miệng',
  阴道服务: 'Dịch vụ âm đạo',
  肛门服务: 'Dịch vụ hậu môn',
  多人服务: 'Dịch vụ nhóm',
};
const LEDGER_KIND_LABELS: Record<string, string> = {
  日薪: 'Lương ngày',
  打赏: 'Tiền boa',
  指名费: 'Phí chỉ định',
  额外服务: 'Dịch vụ thêm',
  生活费: 'Chi phí sinh hoạt',
  恢复: 'Hồi phục',
  个人投入: 'Đầu tư cá nhân',
};

function workStatusLabel(status: string): string {
  return WORK_STATUS_LABELS[status] ?? status;
}

function guestSourceLabel(source: string): string {
  return GUEST_SOURCE_LABELS[source] ?? source;
}

function assignmentStatusLabel(status: string): string {
  return ASSIGNMENT_STATUS_LABELS[status] ?? status;
}

function skillLabel(name: string): string {
  return SKILL_LABELS[name] ?? name;
}

function ledgerKindLabel(kind: string): string {
  return LEDGER_KIND_LABELS[kind] ?? kind;
}

function yuan(value: number): string {
  return `¥${Math.round(value).toLocaleString('vi-VN')}`;
}

function signedYuan(value: number): string {
  return `${value >= 0 ? '+' : '-'}¥${Math.abs(Math.round(value)).toLocaleString('vi-VN')}`;
}

function optionCost(key: WaiterInvestmentKey | WaiterRecoveryKey): number {
  return getWaiterInvestmentCost(props.state, key);
}

function optionAtMax(option: WaiterInvestmentOption): boolean {
  return (
    option.kind === 'investment' && props.state.investments[option.key as WaiterInvestmentKey] >= (option.maxLevel ?? 0)
  );
}
</script>

<style scoped>
.waiter-play-layer {
  position: absolute;
  inset: 0;
  z-index: 12;
  color: #f5ecdf;
  font-family: inherit;
  letter-spacing: 0;
}

.waiter-brand {
  position: absolute;
  top: clamp(24px, 4vh, 48px);
  left: clamp(24px, 4vw, 58px);
  display: flex;
  align-items: center;
  gap: 12px;
}

.waiter-seal {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.46));
}

.waiter-brand strong,
.waiter-brand small {
  display: block;
}

.waiter-brand strong {
  font-family: serif;
  font-size: 17px;
  font-weight: 500;
}

.waiter-brand small {
  margin-top: 3px;
  color: rgba(245, 236, 223, 0.58);
  font-size: 10px;
}

.waiter-status {
  position: absolute;
  top: 18%;
  left: clamp(24px, 4vw, 58px);
  width: min(182px, 19vw);
}

.grade-plaque {
  display: flex;
  align-items: end;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(229, 195, 132, 0.46);
}

.grade-plaque b {
  color: #e7be72;
  font-family: serif;
  font-size: clamp(38px, 4.6vw, 66px);
  font-weight: 400;
  line-height: 0.9;
}

.grade-plaque span,
.status-row span {
  color: rgba(245, 236, 223, 0.58);
  font-size: 10px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0 8px;
  border-bottom: 1px solid rgba(245, 236, 223, 0.14);
}

.status-row strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stamina-track {
  height: 3px;
  margin-top: -4px;
  background: rgba(255, 255, 255, 0.11);
}

.stamina-track i {
  display: block;
  height: 100%;
  background: #75a69e;
}

.waiter-clock {
  position: absolute;
  top: clamp(28px, 4.5vh, 52px);
  left: 50%;
  display: flex;
  align-items: baseline;
  gap: 14px;
  transform: translateX(-50%);
  text-shadow: 0 2px 10px #000;
}

.waiter-clock span {
  color: rgba(245, 236, 223, 0.63);
  font-size: 10px;
}

.waiter-clock b {
  font-family: serif;
  font-size: 20px;
  font-weight: 500;
}

.waiter-sprite {
  position: absolute;
  inset: 8% 17% 12% 25%;
  pointer-events: none;
}

.waiter-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.44));
}

.sprite-caption {
  position: absolute;
  right: 8%;
  bottom: 10%;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-left: 2px solid #d8a85d;
  background: rgba(17, 15, 13, 0.64);
}

.sprite-caption strong {
  font-size: 13px;
}

.sprite-caption span {
  margin-top: 3px;
  color: rgba(245, 236, 223, 0.65);
  font-size: 9px;
}

.waiter-actions {
  position: absolute;
  top: 20%;
  right: clamp(24px, 4vw, 58px);
  display: flex;
  width: min(178px, 18vw);
  flex-direction: column;
}

.waiter-actions button {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-bottom: 1px solid rgba(245, 236, 223, 0.2);
  background: transparent;
  color: #f5ecdf;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.waiter-actions button b {
  color: #dcb86e;
  font-family: serif;
  font-size: 18px;
  font-weight: 400;
}

.waiter-actions button:hover:not(:disabled) {
  padding-left: 6px;
  border-color: #dcb86e;
}

.waiter-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.34;
}

.waiter-dialogue {
  position: absolute;
  right: 5%;
  bottom: 4%;
  left: 5%;
  display: grid;
  min-height: 108px;
  grid-template-columns: minmax(92px, 14%) 1fr auto;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(235, 211, 172, 0.36);
  border-radius: 2px;
  background: rgba(16, 14, 12, 0.76);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
  color: #f5ecdf;
  cursor: pointer;
  text-align: left;
}

.dialogue-name {
  display: grid;
  place-items: center;
  border-right: 1px solid rgba(229, 195, 132, 0.32);
  color: #e2bb73;
  font-family: serif;
  font-size: 18px;
}

.dialogue-body {
  align-self: center;
  padding: 22px 28px;
  font-size: 13px;
  line-height: 1.8;
}

.dialogue-hint {
  align-self: end;
  padding: 0 16px 14px;
  color: rgba(245, 236, 223, 0.45);
  font-size: 9px;
}

.waiter-menu-layer {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(118px, 15%) 1fr;
  background: rgba(18, 17, 15, 0.72);
  backdrop-filter: blur(18px) saturate(0.86);
}

.waiter-menu-tabs {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8vh 0 8vh clamp(20px, 3vw, 46px);
  border-right: 1px solid rgba(235, 211, 172, 0.16);
}

.waiter-menu-tabs button {
  min-height: 43px;
  padding: 0 10px;
  border: 0;
  border-bottom: 1px solid rgba(245, 236, 223, 0.12);
  background: transparent;
  color: rgba(245, 236, 223, 0.54);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  text-align: left;
}

.waiter-menu-tabs button.is-active {
  padding-left: 18px;
  border-color: #d6ad68;
  color: #f5ecdf;
}

.waiter-menu-main {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto 1fr;
  padding: clamp(28px, 5vh, 58px) clamp(30px, 5vw, 74px) 5vh;
  overflow: hidden;
}

.waiter-menu-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(235, 211, 172, 0.22);
}

.waiter-menu-head small {
  color: #78aaa1;
  font-size: 9px;
}

.waiter-menu-head h2 {
  margin: 7px 0 4px;
  font-family: serif;
  font-size: clamp(24px, 2.4vw, 36px);
  font-weight: 400;
}

.waiter-menu-head p,
.data-strip p,
.assignment-strip p,
.metric-strip p,
.investment-strip p,
.settlement-strip p,
.focus-strip p,
.rating-focus p {
  margin: 0;
  color: rgba(245, 236, 223, 0.56);
  font-size: 10px;
  line-height: 1.6;
}

.assignment-strip .assignment-opening {
  margin-top: 4px;
  color: rgba(245, 236, 223, 0.72);
}

.line-button,
.strip-actions button,
.assignment-actions button,
.investment-strip button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(222, 184, 111, 0.42);
  border-radius: 2px;
  background: rgba(19, 17, 15, 0.34);
  color: #f5ecdf;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
}

.line-button:hover:not(:disabled),
.strip-actions button:hover:not(:disabled),
.assignment-actions button:hover:not(:disabled),
.investment-strip button:hover:not(:disabled) {
  border-color: #dfb76d;
  background: rgba(128, 89, 45, 0.23);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.waiter-menu-content {
  min-height: 0;
  padding-top: 18px;
  overflow: auto;
  scrollbar-color: rgba(219, 181, 108, 0.44) transparent;
}

.metric-grid {
  display: grid;
  gap: 1px;
  background: rgba(245, 236, 223, 0.12);
}

.metric-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-grid.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-strip {
  min-width: 0;
  padding: 16px 18px;
  background: rgba(17, 15, 13, 0.68);
}

.metric-strip span,
.settlement-strip small,
.focus-strip small,
.rating-copy small {
  color: rgba(245, 236, 223, 0.48);
  font-size: 9px;
}

.metric-strip strong {
  display: block;
  margin: 7px 0 5px;
  overflow: hidden;
  color: #edcf94;
  font-family: serif;
  font-size: clamp(18px, 2vw, 28px);
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-strip,
.assignment-strip,
.investment-strip,
.growth-section,
.settlement-strip,
.focus-strip,
.rating-focus,
.balance-band,
.ledger-list,
.preserve-strip {
  margin-top: 12px;
  border-top: 1px solid rgba(245, 236, 223, 0.14);
  border-bottom: 1px solid rgba(245, 236, 223, 0.1);
  background: rgba(16, 15, 13, 0.42);
}

.data-strip,
.investment-strip,
.growth-section,
.settlement-strip,
.focus-strip {
  padding: 16px 18px;
}

.nomination-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.data-strip.spaced p {
  margin-top: 8px;
}

.strip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.strip-head h3,
.growth-section h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.strip-head span,
.growth-section header span,
.assignment-strip small {
  color: #76a79e;
  font-size: 9px;
}

.strip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
}

.assignment-strip {
  display: grid;
  grid-template-columns: 74px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 13px 16px;
}

.assignment-strip.selected {
  border-color: rgba(217, 176, 98, 0.64);
}

.assignment-strip.nomination {
  box-shadow: inset 3px 0 #a86d78;
}

.assignment-time {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(245, 236, 223, 0.14);
}

.assignment-time b {
  color: #e4c17f;
  font-family: serif;
  font-size: 20px;
  font-weight: 400;
}

.assignment-time span {
  color: rgba(245, 236, 223, 0.4);
  font-size: 8px;
}

.assignment-actions {
  display: flex;
  gap: 7px;
}

.settlement-strip strong,
.focus-strip strong {
  display: block;
  margin: 7px 0;
  color: #e6c17d;
  font-family: serif;
  font-size: 24px;
  font-weight: 400;
}

.growth-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 13px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 24px;
}

.skill-row {
  display: grid;
  grid-template-columns: 84px 28px 1fr;
  align-items: center;
  gap: 8px;
  font-size: 9px;
}

.skill-row b {
  color: #e4c17f;
  font-weight: 500;
  text-align: right;
}

.skill-row i,
.rating-track {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.skill-row em,
.rating-track i {
  display: block;
  height: 100%;
  background: #74a69c;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: rgba(245, 236, 223, 0.1);
}

.count-grid span {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background: rgba(16, 15, 13, 0.74);
  color: rgba(245, 236, 223, 0.64);
  font-size: 9px;
}

.count-grid b {
  color: #e2bd76;
  font-size: 12px;
}

.preserve-strip {
  display: flex;
  gap: 1px;
  background: rgba(245, 236, 223, 0.1);
}

.preserve-strip span {
  flex: 1;
  padding: 12px;
  background: rgba(16, 15, 13, 0.74);
  color: rgba(245, 236, 223, 0.34);
  font-size: 9px;
  text-align: center;
}

.preserve-strip span.kept {
  color: #91bcae;
}

.balance-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: rgba(245, 236, 223, 0.1);
}

.balance-band div {
  padding: 14px 16px;
  background: rgba(16, 15, 13, 0.7);
}

.balance-band small,
.ledger-row small {
  display: block;
  color: rgba(245, 236, 223, 0.42);
  font-size: 8px;
}

.balance-band strong {
  display: block;
  margin-top: 5px;
  color: #e4c17f;
  font-size: 15px;
}

.ledger-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(245, 236, 223, 0.08);
}

.ledger-row b {
  display: block;
  font-size: 10px;
  font-weight: 500;
}

.ledger-row > strong {
  color: #7fb1a6;
  font-size: 11px;
}

.ledger-row > strong.expense {
  color: #c98e91;
}

.empty-note {
  padding: 18px;
  color: rgba(245, 236, 223, 0.45);
  font-size: 10px;
}

.rating-focus {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  gap: 24px;
  padding: 18px;
}

.rating-letter {
  display: grid;
  height: 92px;
  place-items: center;
  border-right: 1px solid rgba(229, 195, 132, 0.28);
  color: #e5bb70;
  font-family: serif;
  font-size: 68px;
}

.rating-copy strong {
  display: block;
  margin: 6px 0 10px;
  font-size: 18px;
}

.rating-copy p {
  margin-top: 10px;
}

.investment-strip {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 20px;
}

.investment-strip p {
  margin-top: 7px;
}

.investment-strip button {
  min-width: 82px;
}

.log-row {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(245, 236, 223, 0.08);
  color: rgba(245, 236, 223, 0.62);
  font-size: 9px;
}

@media (max-width: 820px) {
  .waiter-status {
    top: 15%;
    width: 142px;
  }

  .waiter-sprite {
    inset: 10% 9% 15% 13%;
  }

  .waiter-actions {
    top: auto;
    right: 4%;
    bottom: 21%;
    width: 145px;
  }

  .waiter-clock span:first-child {
    display: none;
  }

  .waiter-dialogue {
    right: 3%;
    bottom: 2.5%;
    left: 3%;
    min-height: 96px;
    grid-template-columns: 82px 1fr;
  }

  .dialogue-hint {
    display: none;
  }

  .waiter-menu-layer {
    grid-template-columns: 94px 1fr;
  }

  .waiter-menu-tabs {
    padding-left: 10px;
  }

  .waiter-menu-main {
    padding: 24px 22px 24px;
  }

  .metric-grid.three,
  .metric-grid.four,
  .balance-band {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .count-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skill-grid {
    grid-template-columns: 1fr;
  }

  .assignment-strip {
    grid-template-columns: 58px 1fr;
  }

  .assignment-actions {
    grid-column: 2;
  }
}

@media (max-width: 560px) {
  .waiter-brand,
  .waiter-status {
    left: 16px;
  }

  .waiter-brand {
    top: 18px;
  }

  .waiter-status {
    top: 92px;
    width: 126px;
  }

  .waiter-clock {
    top: 22px;
    left: auto;
    right: 18px;
    transform: none;
  }

  .waiter-clock span:last-child {
    display: none;
  }

  .waiter-sprite {
    inset: 15% -14% 17% 18%;
  }

  .waiter-actions {
    right: 14px;
    bottom: 22%;
    width: 132px;
  }

  .waiter-dialogue {
    grid-template-columns: 72px 1fr;
  }

  .dialogue-body {
    padding: 16px;
    font-size: 11px;
  }

  .waiter-menu-layer {
    grid-template-columns: 1fr;
    grid-template-rows: 80px minmax(0, 1fr);
  }

  .waiter-menu-tabs {
    display: grid;
    overflow: hidden;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    padding: 0;
    border-right: 0;
    border-bottom: 1px solid rgba(235, 211, 172, 0.16);
  }

  .waiter-menu-tabs button {
    min-width: 0;
    min-height: 0;
    padding: 0 4px;
    border-right: 1px solid rgba(245, 236, 223, 0.08);
    border-bottom: 0;
    text-align: center;
  }

  .waiter-menu-tabs button.is-active {
    padding-left: 4px;
    box-shadow: inset 0 -2px #d6ad68;
  }

  .waiter-menu-main {
    padding: 18px 14px 18px;
  }

  .waiter-menu-head h2 {
    font-size: 23px;
  }

  .waiter-menu-head p {
    display: none;
  }

  .metric-grid.three,
  .metric-grid.four,
  .balance-band {
    grid-template-columns: 1fr 1fr;
  }

  .assignment-strip {
    grid-template-columns: 52px 1fr;
    gap: 10px;
    padding: 12px 10px;
  }

  .rating-focus {
    grid-template-columns: 72px 1fr;
    gap: 12px;
  }

  .rating-letter {
    height: 72px;
    font-size: 50px;
  }
}
</style>
