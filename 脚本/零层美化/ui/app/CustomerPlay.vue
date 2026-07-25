<template>
  <section
    class="customer-play-layer"
    :class="{ 'is-menu-open': menuOpen, 'is-story-open': storyOpen }"
    aria-label="Chế độ chơi du khách"
  >
    <template v-if="!menuOpen && !storyOpen">
      <header class="customer-brand">
        <img class="customer-seal" :src="TANGQUAN_LOGO_URL" alt="" aria-hidden="true" />
        <span><strong>Hoa Chưa Nở</strong><small>Góc nhìn du khách</small></span>
      </header>

      <aside class="customer-status" aria-label="Trạng thái du khách">
        <div class="visit-plaque">
          <b>{{ String(state.到店次数).padStart(2, '0') }}</b>
          <span>Số lần đến quán</span>
        </div>
        <div class="status-row">
          <span>Tiền</span>
          <strong>{{ yuan(state.资金) }}</strong>
        </div>
        <div class="status-row">
          <span>Chỉ định</span>
          <strong>{{ nominationNames || 'Chưa chỉ định' }}</strong>
        </div>
        <div class="status-row">
          <span>Đặt lịch</span>
          <strong>{{ state.当前服务?.项目 || 'Chưa có' }}</strong>
        </div>
      </aside>

      <div class="customer-clock">
        <span>{{ state.日期 }}</span>
        <b>{{ state.时间 }}</b>
        <span>{{ state.地点 }}</span>
      </div>

      <div
        v-if="sceneEmployees.length"
        class="customer-sprite"
        :class="`has-${Math.min(sceneEmployees.length, 4)}`"
        aria-hidden="true"
      >
        <div v-for="employee in sceneEmployees" :key="employee.姓名" class="customer-sprite-item">
          <img :src="characterStandingUrl(employee.姓名)" alt="" />
          <div class="sprite-caption">
            <strong>{{ employee.姓名 }}</strong>
            <span>Hạng {{ employee.评级 }} · {{ relationStage(employee) }}</span>
          </div>
        </div>
      </div>

      <nav class="customer-actions" aria-label="Thao tác nhanh du khách">
        <template v-if="state.当前服务?.状态 === '进行中'">
          <button type="button" :disabled="busy" @click="$emit('talk', state.当前服务.员工)">
            <span>Tiếp tục trò chuyện</span><b>›</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('extra', state.当前服务.员工)">
            <span>Dịch vụ thêm</span><b>＋</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('finish-service')"><span>Kết thúc dịch vụ</span><b>■</b></button>
        </template>
        <template v-else>
          <button type="button" :disabled="busy" @click="$emit('open-menu', 'projects')">
            <span>Chọn dịch vụ</span><b>›</b>
          </button>
          <button
            type="button"
            :class="{ 'tutorial-target': tutorialTarget === 'customer-open-nomination' }"
            :disabled="busy"
            @click="$emit('open-menu', 'nomination')"
          >
            <span>Chỉ định</span><b>♙</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('open-menu', 'relationship')">
            <span>Quan hệ</span><b>♡</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('open-menu', 'contacts')">
            <span>Liên hệ</span><b>⌁</b>
          </button>
          <button type="button" :disabled="busy" @click="$emit('free-airp')"><span>Hành động tự do</span><b>＋</b></button>
        </template>
      </nav>

      <div class="customer-dialogue-shell">
        <button
          v-if="state.对话.台词页.length > 1"
          class="dialogue-arrow is-previous"
          type="button"
          aria-label="Câu trước"
          @click="$emit('previous-dialogue')"
        >
          ‹
        </button>
        <button class="customer-dialogue" type="button" @click="$emit('next-dialogue')">
          <span class="dialogue-name">{{ dialoguePage.speaker || state.对话.说话人 }}</span>
          <span class="dialogue-body">{{ dialoguePage.text }}</span>
          <span v-if="state.对话.台词页.length > 1" class="dialogue-count">
            {{ state.对话.当前页 + 1 }} / {{ state.对话.台词页.length }}
          </span>
        </button>
        <button
          v-if="state.对话.台词页.length > 1"
          class="dialogue-arrow is-next"
          type="button"
          aria-label="Câu tiếp theo"
          @click="$emit('next-dialogue')"
        >
          ›
        </button>
      </div>
    </template>

    <section v-if="menuOpen" class="customer-menu-layer" aria-label="Menu du khách">
      <nav class="customer-menu-tabs" aria-label="Danh mục menu du khách">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{
            'is-active': view === tab.key,
            'tutorial-target': tutorialTarget === 'customer-open-projects' && tab.key === 'projects',
          }"
          @click="$emit('open-menu', tab.key)"
        >
          {{ tab.title }}
        </button>
      </nav>

      <article class="customer-menu-main">
        <header class="customer-menu-head">
          <div>
            <small>VISITOR JOURNAL</small>
            <h2>{{ activeTab.title }}</h2>
            <p>{{ activeTab.note }}</p>
          </div>
          <button class="line-button" type="button" @click="$emit('close-menu')">Quay lại</button>
        </header>

        <div class="customer-menu-content">
          <template v-if="view === 'today'">
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Tiền hiện có</span><strong>{{ yuan(state.资金) }}</strong>
                <p>Số dư hiện có thể tự do sử dụng.</p>
              </section>
              <section class="metric-strip">
                <span>Lưu trú</span><strong>{{ stayText }}</strong>
                <p>{{ state.住宿.状态 === '住宿中' ? state.住宿.房型 : 'Có thể đến quán tạm thời để tiêu dùng' }}</p>
              </section>
              <section class="metric-strip">
                <span>Chỉ định hiện tại</span><strong>{{ nominationNames || 'Chưa chỉ định' }}</strong>
                <p>{{ nominationText }}</p>
              </section>
            </div>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Sắp xếp hôm nay</h3>
                <span>{{ state.时间 }}</span>
              </div>
              <p v-if="state.当前服务">
                {{ state.当前服务.员工 }} · {{ state.当前服务.项目 }} · {{ state.当前服务.区域 }} ·
                {{ serviceStatusLabel(state.当前服务.状态) }}
              </p>
              <p v-else>Chưa đặt lịch dịch vụ, có thể xem trước nhân viên và dự án đang phục vụ hôm nay.</p>
              <div class="strip-actions">
                <button type="button" @click="$emit('open-menu', 'projects')">Chọn dịch vụ</button>
                <button
                  v-if="state.当前服务?.状态 === '已预约'"
                  type="button"
                  :class="{ 'tutorial-target': tutorialTarget === 'customer-start-service' }"
                  @click="$emit('start-service')"
                >
                  Bắt đầu dịch vụ
                </button>
                <button type="button" @click="$emit('open-menu', 'areas')">Xem khu vực</button>
              </div>
            </section>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Nhật ký hôm nay</h3>
                <span>{{ state.今日记录.length }}</span>
              </div>
              <p v-for="(entry, index) in state.今日记录.slice(-6).reverse()" :key="`${index}-${entry}`">{{ entry }}</p>
            </section>
          </template>

          <template v-else-if="view === 'areas'">
            <section v-for="area in areas" :key="area.名称" class="data-strip">
              <div class="strip-head">
                <h3>{{ area.名称 }}</h3>
                <span>{{ area.名称 === state.地点 ? 'Vị trí hiện tại' : `${areaEmployees(area.名称).length} nhân viên` }}</span>
              </div>
              <p>{{ area.说明 }}</p>
              <p>
                Đang có mặt:{{ ' ' }}{{
                  areaEmployees(area.名称)
                    .map(item => item.姓名)
                    .join('、') || 'Chưa có'
                }}
              </p>
              <p>
                Dự án:{{ ' ' }}{{
                  areaProjects(area.名称)
                    .map(item => item.名称)
                    .join('、') || 'Chưa có'
                }}
              </p>
              <div class="strip-actions">
                <button type="button" :disabled="area.名称 === state.地点 || busy" @click="$emit('travel', area.名称)">
                  {{ area.名称 === state.地点 ? 'Đang ở đây' : 'Đến đây' }}
                </button>
              </div>
            </section>
          </template>

          <template v-else-if="view === 'projects'">
            <section
              v-for="project in projects"
              :key="project.名称"
              class="data-strip"
              :class="{ selected: selectedProject === project.名称 }"
            >
              <div class="strip-head">
                <h3>{{ project.名称 }}</h3>
                <span>{{ yuan(project.价格) }}</span>
              </div>
              <p>{{ project.区域 }} · {{ project.时长分钟 }} phút · {{ project.标签.join(' / ') }}</p>
              <p>{{ project.说明 }}</p>
              <div class="strip-actions">
                <button
                  type="button"
                  :class="{
                    'tutorial-target': tutorialTarget === 'customer-select-project' && project.名称 === '入浴休憩',
                  }"
                  :disabled="!project.开放"
                  @click="$emit('select-project', project.名称)"
                >
                  {{ selectedProject === project.名称 ? 'Đã chọn' : 'Chọn' }}
                </button>
              </div>
            </section>
            <section class="data-strip">
              <div class="strip-head">
                <h3>Chọn nhân viên</h3>
                <span>{{ availableProjectEmployees.length }} người có thể chọn</span>
              </div>
              <p v-if="availableProjectEmployees.length === 0">Hôm nay tạm thời không có nhân viên nào nhận dự án này.</p>
              <div v-else class="employee-selector">
                <button
                  v-for="employee in availableProjectEmployees"
                  :key="employee.姓名"
                  type="button"
                  :class="{
                    'is-active': selectedEmployee === employee.姓名,
                    'tutorial-target': tutorialTarget === 'customer-select-atri' && employee.姓名 === 'atri',
                  }"
                  @click="$emit('select-employee', employee.姓名)"
                >
                  {{ employee.姓名 }} · Hạng {{ employee.评级 }} · {{ employeeStatusLabel(employee.状态) }}
                </button>
              </div>
            </section>
            <section class="selection-dock">
              <div>
                <small>Lựa chọn hiện tại</small>
                <strong>{{ selectedProject || 'Chưa chọn dự án' }}</strong>
                <span>{{ selectedEmployee || 'Chưa chọn nhân viên' }}</span>
              </div>
              <button
                type="button"
                :class="{ 'tutorial-target': tutorialTarget === 'customer-book-service' }"
                :disabled="
                  busy ||
                  !selectedProject ||
                  !selectedEmployee ||
                  !availableProjectEmployees.some(employee => employee.姓名 === selectedEmployee)
                "
                @click="$emit('book-service')"
              >
                Xác nhận đặt lịch
              </button>
            </section>
          </template>

          <template v-else-if="view === 'nomination'">
            <section v-if="state.指名.length" class="current-focus nomination-focus-list">
              <small>Chỉ định hiện tại · {{ state.指名.length }} người</small>
              <article v-for="nomination in state.指名" :key="nomination.员工">
                <div>
                  <strong>{{ nomination.员工 }}</strong>
                  <p>Còn lại {{ nomination.剩余天数 }} ngày · Đã trả {{ yuan(nomination.已付费用) }}</p>
                </div>
                <button type="button" :disabled="busy" @click="$emit('end-nomination', nomination.员工)">Kết thúc</button>
              </article>
            </section>
            <section
              v-for="employee in employees"
              :key="employee.姓名"
              class="data-strip"
              :class="{ selected: selectedEmployee === employee.姓名, 'has-character-avatar': true }"
            >
              <img class="character-avatar" :src="characterAvatarUrl(employee.姓名)" alt="" />
              <div class="strip-head">
                <h3>{{ employee.姓名 }}</h3>
                <span>Hạng {{ employee.评级 }} · {{ employeeStatusLabel(employee.状态) }}</span>
              </div>
              <p>{{ employee.区域 }} · Phí chỉ định mỗi ngày {{ yuan(employee.每日指名费) }}</p>
              <p>Thiện cảm {{ employee.好感度 }} · Tin tưởng {{ employee.信任度 }} · {{ relationStage(employee) }}</p>
              <div class="strip-actions">
                <button type="button" @click="$emit('select-employee', employee.姓名)">
                  {{ selectedEmployee === employee.姓名 ? 'Đã chọn' : 'Xem' }}
                </button>
                <button
                  type="button"
                  :class="{
                    'tutorial-target': tutorialTarget === 'customer-nominate-atri' && employee.姓名 === 'atri',
                  }"
                  :disabled="busy || isNominated(employee.姓名) || !canNominate(employee)"
                  @click="$emit('nominate', employee.姓名)"
                >
                  {{ isNominated(employee.姓名) ? 'Đã chỉ định' : 'Chỉ định' }}
                </button>
              </div>
            </section>
          </template>

          <template v-else-if="view === 'relationship'">
            <section v-if="selectedEmployeeData" class="relationship-focus">
              <img class="relationship-avatar" :src="characterAvatarUrl(selectedEmployeeData.姓名)" alt="" />
              <div class="relationship-title">
                <div>
                  <small>Nhân viên hạng {{ selectedEmployeeData.评级 }}</small>
                  <h3>{{ selectedEmployeeData.姓名 }}</h3>
                </div>
                <span>{{ relationStage(selectedEmployeeData) }}</span>
              </div>
              <p v-if="selectedEmployeeData.说明">{{ selectedEmployeeData.说明 }}</p>
              <div class="relation-meter">
                <span>Thiện cảm {{ selectedEmployeeData.好感度 }}</span
                ><i :style="{ width: `${selectedEmployeeData.好感度}%` }" />
              </div>
              <div class="relation-meter trust">
                <span>Tin tưởng {{ selectedEmployeeData.信任度 }}</span
                ><i :style="{ width: `${selectedEmployeeData.信任度}%` }" />
              </div>
              <div class="relation-summary">
                <span>Liên hệ {{ contactStatusLabel(selectedEmployeeData.联系状态) }}</span>
              </div>
              <p>Thái độ của cô ấy với lời mời thêm: {{ acceptance(selectedEmployeeData).label }}.</p>
              <div class="strip-actions">
                <button type="button" @click="$emit('talk', selectedEmployeeData.姓名)">Trò chuyện</button>
                <button
                  type="button"
                  :disabled="selectedEmployeeData.联系状态 === '已添加'"
                  @click="$emit('request-contact', selectedEmployeeData.姓名)"
                >
                  Yêu cầu thông tin liên hệ
                </button>
                <button type="button" @click="$emit('extra', selectedEmployeeData.姓名)">Dịch vụ thêm</button>
                <button
                  type="button"
                  :disabled="selectedEmployeeData.联系状态 !== '已添加'"
                  @click="$emit('invite', selectedEmployeeData.姓名)"
                >
                  Hẹn riêng
                </button>
                <button type="button" @click="$emit('tip', selectedEmployeeData.姓名)">Tặng thưởng</button>
              </div>
            </section>
            <div class="employee-selector">
              <button
                v-for="employee in employees"
                :key="employee.姓名"
                type="button"
                :class="{ 'is-active': selectedEmployee === employee.姓名 }"
                @click="$emit('select-employee', employee.姓名)"
              >
                {{ employee.姓名 }}
              </button>
            </div>
          </template>

          <template v-else-if="view === 'contacts'">
            <div class="contact-layout">
              <nav class="contact-list" aria-label="Danh sách liên hệ">
                <button
                  v-for="contact in contactEmployees"
                  :key="contact.姓名"
                  type="button"
                  :class="{
                    'is-active': selectedContact === contact.姓名,
                    'is-invite-selected': inviteSelection.includes(contact.姓名),
                  }"
                  @click="$emit('select-contact', contact.姓名)"
                >
                  <img class="contact-avatar" :src="characterAvatarUrl(contact.姓名)" alt="" />
                  <span
                    ><b>{{ contact.姓名 }}</b
                    ><small>{{ onlineStatusLabel(contact.在线状态) }}</small></span
                  >
                  <em v-if="state.联系人[contact.姓名]?.未读">{{ state.联系人[contact.姓名].未读 }}</em>
                </button>
                <p v-if="contactEmployees.length === 0">Chưa có liên hệ nào. Hãy tiến triển quan hệ tại hiện trường và yêu cầu thông tin liên hệ trước.</p>
              </nav>
              <section class="message-panel">
                <template v-if="selectedContactData">
                  <header>
                    <div>
                      <strong>{{ selectedContactData.姓名 }}</strong
                      ><span>{{ onlineStatusLabel(selectedContactData.在线状态) }} · {{ relationStage(selectedContactData) }}</span>
                    </div>
                    <div class="contact-header-actions">
                      <button type="button" :disabled="busy" @click="$emit('toggle-contact-output')">
                        Chuyển chế độ chat · Hiện tại: {{ contactOutputMode === 'story' ? 'Văn bản' : 'Galgame' }}
                      </button>
                      <button type="button" :disabled="busy" @click="$emit('toggle-invite', selectedContactData.姓名)">
                        {{ inviteSelection.includes(selectedContactData.姓名) ? 'Bỏ khỏi nhóm đi cùng' : 'Thêm vào nhóm đi cùng' }}
                      </button>
                      <button
                        type="button"
                        :disabled="busy || inviteSelection.length === 0"
                        @click="$emit('invite-selected')"
                      >
                        Gửi lời mời {{ inviteSelection.length ? `(${inviteSelection.length})` : '' }}
                      </button>
                    </div>
                  </header>
                  <div class="message-history">
                    <p v-if="selectedConversationMessages.length === 0">Chưa có tin nhắn nào, hãy gửi một lời chào trước.</p>
                    <article
                      v-for="message in selectedConversationMessages"
                      :key="message.id"
                      :class="{ mine: message.发送者 === '用户' }"
                    >
                      <small>{{ message.发送者 === '用户' ? 'Bạn' : message.发送者 }} · {{ message.时间 }}</small>
                      <p>{{ message.内容 }}</p>
                    </article>
                  </div>
                  <form class="message-compose" @submit.prevent="sendMessage">
                    <input
                      v-model="messageDraft"
                      type="text"
                      maxlength="1000"
                      placeholder="Nhập tin nhắn cần gửi"
                      :disabled="busy"
                    />
                    <button type="submit" :disabled="busy || !messageDraft.trim()">Gửi</button>
                  </form>
                </template>
                <p v-else>Chọn một liên hệ ở bên trái.</p>
              </section>
            </div>
          </template>

          <template v-else-if="view === 'schedule'">
            <div class="metric-grid three">
              <section class="metric-strip">
                <span>Ngày</span><strong>Ngày thứ {{ state.日序 }}</strong>
                <p>{{ state.日期 }}</p>
              </section>
              <section class="metric-strip">
                <span>Thời gian hiện tại</span><strong>{{ state.时间 }}</strong>
                <p>{{ state.地点 }}</p>
              </section>
              <section class="metric-strip">
                <span>Lưu trú còn lại</span><strong>{{ state.住宿.剩余天数 }}</strong>
                <p>{{ state.住宿.房型 || 'Chưa lưu trú' }}</p>
              </section>
            </div>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Sắp xếp lưu trú</h3>
                <span>{{ stayStatusLabel(state.住宿.状态) }}</span>
              </div>
              <template v-if="state.住宿.状态 === '未住宿'">
                <div class="stay-options">
                  <button
                    v-for="room in roomOptions"
                    :key="room.名称"
                    type="button"
                    :class="{ 'is-active': selectedRoom === room.名称 }"
                    @click="selectedRoom = room.名称"
                  >
                    {{ room.名称 }} · {{ yuan(room.每日房费) }}
                  </button>
                </div>
                <label class="day-stepper"
                  ><span>Số ngày lưu trú</span><input v-model.number="stayDays" type="number" min="1" max="7"
                /></label>
                <div class="strip-actions">
                  <button
                    type="button"
                    :disabled="busy"
                    @click="$emit('check-in', { room: selectedRoom, days: stayDays })"
                  >
                    Làm thủ tục lưu trú
                  </button>
                </div>
              </template>
              <template v-else>
                <p>{{ state.住宿.房型 }} · Còn lại {{ state.住宿.剩余天数 }} ngày · Mỗi ngày {{ yuan(state.住宿.每日房费) }}</p>
                <div class="strip-actions">
                  <button type="button" :disabled="busy" @click="$emit('check-out')">Làm thủ tục trả phòng</button>
                </div>
              </template>
            </section>
            <section class="data-strip spaced">
              <div class="strip-head">
                <h3>Nghỉ đến ngày hôm sau</h3>
                <span>09:00</span>
              </div>
              <p>Kết thúc hành trình hôm nay, chín giờ sáng mai tiếp tục.</p>
              <div class="strip-actions">
                <button type="button" :disabled="busy" @click="$emit('rest-day')">Nghỉ ngơi</button>
              </div>
            </section>
          </template>

          <template v-else-if="view === 'wallet'">
            <section class="wallet-total">
              <small>Tiền khả dụng</small><strong>{{ yuan(state.资金) }}</strong>
              <p>Mỗi khoản chi tiêu đều được lưu lại ở đây.</p>
            </section>
            <section v-for="entry in state.消费流水.slice().reverse()" :key="entry.id" class="ledger-row">
              <div>
                <strong>{{ entry.名称 }}</strong
                ><span>{{ entry.日期 }} · {{ entry.时间 }} · {{ transactionTypeLabel(entry.类型) }}</span>
              </div>
              <div>
                <b>-{{ yuan(entry.金额) }}</b
                ><small>Số dư {{ yuan(entry.余额) }}</small>
              </div>
            </section>
            <p v-if="state.消费流水.length === 0" class="empty-note">Chưa có ghi chép chi tiêu nào.</p>
          </template>
        </div>
      </article>
    </section>

    <section v-if="storyOpen" class="customer-story-layer" aria-label="Đọc văn bản">
      <header>
        <div>
          <small>{{ state.日期 }} · {{ state.时间 }}</small>
          <h2>{{ state.地点 }}</h2>
        </div>
        <button type="button" @click="$emit('close-story')">Quay lại</button>
      </header>
      <article>
        <p v-for="(paragraph, index) in storyParagraphs" :key="index">{{ paragraph }}</p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  CUSTOMER_ROOM_OPTIONS,
  getCustomerExtraAcceptance,
  getCustomerRelationshipStage,
  listCustomerAvailableEmployees,
  type CustomerEmployee,
  type CustomerMenuView,
  type CustomerPageState,
} from './customerGame';
import { TANGQUAN_LOGO_URL, resolveCharacterAvatar, resolveCharacterStanding } from './mediaCatalog';

const props = defineProps<{
  state: CustomerPageState;
  menuOpen: boolean;
  view: CustomerMenuView;
  selectedEmployee: string;
  selectedProject: string;
  selectedContact: string;
  inviteSelection: string[];
  storyOpen: boolean;
  busy: boolean;
  spriteUrl: string;
  sceneParticipants?: string[];
  contactOutputMode: 'dialogue' | 'story';
  tutorialTarget?: string;
}>();

const emit = defineEmits<{
  'open-menu': [view: CustomerMenuView];
  'close-menu': [];
  travel: [areaName: string];
  'select-employee': [employeeName: string];
  'select-project': [projectName: string];
  nominate: [employeeName: string];
  'end-nomination': [employeeName: string];
  'book-service': [];
  'start-service': [];
  'finish-service': [];
  talk: [employeeName: string];
  'request-contact': [employeeName: string];
  extra: [employeeName: string];
  invite: [employeeName: string];
  'toggle-invite': [employeeName: string];
  'invite-selected': [];
  tip: [employeeName: string];
  'free-airp': [];
  'next-dialogue': [];
  'previous-dialogue': [];
  'select-contact': [employeeName: string];
  'send-message': [payload: { employeeName: string; text: string }];
  'toggle-contact-output': [];
  'check-in': [payload: { room: string; days: number }];
  'check-out': [];
  'rest-day': [];
  'close-story': [];
}>();

const tabs: { key: CustomerMenuView; title: string; note: string }[] = [
  { key: 'today', title: 'Hôm nay', note: 'Sắp xếp hiện tại, lưu trú và các hành động chính có thể tiếp tục.' },
  { key: 'areas', title: 'Khu vực', note: 'Đến các khu vực khác nhau trong quán, xem nhân viên và dự án đang phục vụ.' },
  { key: 'projects', title: 'Dịch vụ', note: 'Chọn dự án và nhân viên, xác nhận rồi vào hiện trường dịch vụ.' },
  { key: 'nomination', title: 'Chỉ định', note: 'Hoàn thành chỉ định theo số ngày lưu trú còn lại hoặc trong ngày.' },
  { key: 'relationship', title: 'Quan hệ', note: 'Xem thiện cảm, tin tưởng và các lối vào quan hệ khả dụng.' },
  { key: 'contacts', title: 'Liên hệ', note: 'Trò chuyện trực tuyến, tin nhắn chưa đọc và hẹn riêng.' },
  { key: 'schedule', title: 'Lịch trình', note: 'Lưu trú, thời gian hôm nay và sắp xếp xuyên ngày.' },
  { key: 'wallet', title: 'Tiền bạc', note: 'Số dư duy nhất và toàn bộ ghi chép chi tiêu.' },
];

const messageDraft = ref('');
const pendingMessage = ref<{ employeeName: string; text: string; beforeCount: number } | null>(null);
const selectedRoom = ref(CUSTOMER_ROOM_OPTIONS[0].名称);
const stayDays = ref(1);
const roomOptions = CUSTOMER_ROOM_OPTIONS;
const activeTab = computed(() => tabs.find(tab => tab.key === props.view) ?? tabs[0]);
const allEmployees = computed(() => Object.values(props.state.员工));
const employees = computed(() => {
  const names = [...props.state.今日员工];
  const nominatedName = props.state.当前指名?.员工;
  if (nominatedName && !names.includes(nominatedName)) names.push(nominatedName);
  return names
    .map(name => props.state.员工[name])
    .filter((employee): employee is CustomerEmployee => Boolean(employee));
});
const projects = computed(() => Object.values(props.state.项目).filter(project => project.开放));
const areas = computed(() => Object.values(props.state.区域).filter(area => area.开放));
const availableProjectEmployees = computed(() =>
  props.selectedProject ? listCustomerAvailableEmployees(props.state, props.selectedProject) : [],
);
const selectedEmployeeData = computed(() => props.state.员工[props.selectedEmployee] ?? employees.value[0] ?? null);
const currentEmployee = computed(() => {
  const preferredName = props.state.当前服务?.员工 ?? props.state.当前指名?.员工;
  const preferred = preferredName ? props.state.员工[preferredName] : null;
  if (preferred?.区域 === props.state.地点 && preferred.状态 !== '休息') return preferred;
  return employees.value.find(employee => employee.区域 === props.state.地点 && employee.状态 !== '休息') ?? null;
});
const sceneEmployees = computed(() => {
  const participants = (props.sceneParticipants ?? [])
    .map(name => props.state.员工[name])
    .filter((employee): employee is CustomerEmployee => Boolean(employee));
  const uniqueParticipants = [...new Map(participants.map(employee => [employee.姓名, employee])).values()];
  if (uniqueParticipants.length > 0) return uniqueParticipants.slice(0, 4);
  return currentEmployee.value ? [currentEmployee.value] : [];
});
const dialoguePage = computed(
  () =>
    props.state.对话.台词页[props.state.对话.当前页] ?? {
      speaker: props.state.对话.说话人,
      text: 'Hơi nước tỏa dần dọc theo hành lang gỗ.',
    },
);
const stayText = computed(() => (props.state.住宿.状态 === '住宿中' ? `${props.state.住宿.剩余天数} ngày` : 'Đến quán tạm thời'));
const nominationText = computed(() =>
  props.state.指名.length ? `${props.state.指名.length} nhân viên` : 'Có thể chọn nhân viên tại trang chỉ định',
);
const nominationNames = computed(() => props.state.指名.map(item => item.员工).join('、'));
const contactEmployees = computed(() => allEmployees.value.filter(employee => employee.联系状态 === '已添加'));
const selectedContactData = computed(
  () => props.state.员工[props.selectedContact] ?? contactEmployees.value[0] ?? null,
);
const selectedConversationMessages = computed(() =>
  selectedContactData.value ? (props.state.联系人[selectedContactData.value.姓名]?.消息 ?? []) : [],
);
const storyParagraphs = computed(() =>
  props.state.对话.最近正文
    .split(/\r?\n+/)
    .map(item => item.trim())
    .filter(Boolean),
);

const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  空闲: 'Rảnh',
  指名待命: 'Chờ chỉ định',
  服务中: 'Đang phục vụ',
  被其他客人指名: 'Đang được khách khác chỉ định',
  休息: 'Nghỉ ngơi',
};
const CONTACT_STATUS_LABELS: Record<string, string> = {
  未添加: 'Chưa thêm',
  可请求: 'Có thể yêu cầu',
  已添加: 'Đã thêm',
};
const ONLINE_STATUS_LABELS: Record<string, string> = {
  在线: 'Trực tuyến',
  忙碌: 'Bận',
  离线: 'Ngoại tuyến',
};
const STAY_STATUS_LABELS: Record<string, string> = {
  未住宿: 'Chưa lưu trú',
  住宿中: 'Đang lưu trú',
};
const SERVICE_STATUS_LABELS: Record<string, string> = {
  已预约: 'Đã đặt lịch',
  进行中: 'Đang diễn ra',
};
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  住宿: 'Lưu trú',
  指名: 'Chỉ định',
  项目: 'Dự án',
  打赏: 'Tặng thưởng',
};

function employeeStatusLabel(status: string) {
  return EMPLOYEE_STATUS_LABELS[status] ?? status;
}

function contactStatusLabel(status: string) {
  return CONTACT_STATUS_LABELS[status] ?? status;
}

function onlineStatusLabel(status: string) {
  return ONLINE_STATUS_LABELS[status] ?? status;
}

function stayStatusLabel(status: string) {
  return STAY_STATUS_LABELS[status] ?? status;
}

function serviceStatusLabel(status: string) {
  return SERVICE_STATUS_LABELS[status] ?? status;
}

function transactionTypeLabel(type: string) {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

function yuan(value: number) {
  return `¥${Math.round(value).toLocaleString('vi-VN')}`;
}

function relationStage(employee: CustomerEmployee) {
  return getCustomerRelationshipStage(employee);
}

function acceptance(employee: CustomerEmployee) {
  return getCustomerExtraAcceptance(employee);
}

function characterAvatarUrl(name: string) {
  return resolveCharacterAvatar(name);
}

function characterStandingUrl(name: string) {
  const resolved = resolveCharacterStanding(name);
  if (resolved) return resolved;
  return sceneEmployees.value.length === 1 ? props.spriteUrl : resolveCharacterAvatar(name);
}

function canNominate(employee: CustomerEmployee) {
  return employee.状态 === '空闲' || employee.状态 === '指名待命';
}

function isNominated(employeeName: string) {
  return props.state.指名.some(nomination => nomination.员工 === employeeName);
}

function areaEmployees(areaName: string) {
  return employees.value.filter(employee => employee.区域 === areaName && employee.状态 !== '休息');
}

function areaProjects(areaName: string) {
  return projects.value.filter(project => project.区域 === areaName);
}

function sendMessage() {
  const text = messageDraft.value.trim();
  const employeeName = selectedContactData.value?.姓名 ?? '';
  if (!text || !employeeName) return;
  pendingMessage.value = {
    employeeName,
    text,
    beforeCount: props.state.联系人[employeeName]?.消息.length ?? 0,
  };
  emit('send-message', { employeeName, text });
}

watch(
  () => props.busy,
  (isBusy, wasBusy) => {
    const pending = pendingMessage.value;
    if (isBusy || !wasBusy || !pending) return;
    const messages = props.state.联系人[pending.employeeName]?.消息 ?? [];
    const sent = messages
      .slice(pending.beforeCount)
      .some(message => message.发送者 === '用户' && message.内容 === pending.text);
    if (sent && messageDraft.value.trim() === pending.text) {
      messageDraft.value = '';
    }
    pendingMessage.value = null;
  },
);
</script>

<style scoped>
.customer-play-layer {
  --c-text: #f7ecdc;
  --c-muted: rgba(247, 236, 220, 0.64);
  --c-line: rgba(247, 236, 220, 0.2);
  --c-gold: #d7b36d;
  --c-tea: #80aa9c;
  position: absolute;
  inset: 0;
  z-index: 8;
  color: var(--c-text);
  pointer-events: none;
}

button,
input {
  color: inherit;
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.42;
}

.customer-brand,
.customer-status,
.customer-clock,
.customer-sprite,
.customer-actions,
.customer-dialogue-shell,
.customer-menu-layer,
.customer-story-layer {
  pointer-events: auto;
}

.customer-brand {
  position: absolute;
  top: 4.7%;
  left: 3.1%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.76);
}

.customer-seal {
  display: block;
  width: 2.2rem;
  height: 2.2rem;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.46));
}

.customer-brand strong,
.customer-brand small {
  display: block;
}

.customer-brand strong {
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 1rem;
  font-weight: 500;
}

.customer-brand small {
  margin-top: 0.12rem;
  color: var(--c-muted);
  font-size: 0.68rem;
}

.customer-status {
  position: absolute;
  top: 18%;
  left: 2.8%;
  width: 13.8rem;
  display: grid;
  gap: 0.72rem;
}

.visit-plaque {
  width: 11rem;
  padding: 0.82rem 0 0.9rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(35, 28, 49, 0.78), rgba(20, 16, 27, 0.48));
  clip-path: polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
}

.visit-plaque b,
.visit-plaque span {
  display: block;
}

.visit-plaque b {
  font-family: 'Yu Mincho', serif;
  font-size: 2rem;
  font-weight: 500;
}

.visit-plaque span {
  color: var(--c-muted);
  font-size: 0.72rem;
}

.status-row {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  align-items: center;
  min-height: 2.25rem;
  padding: 0 0.78rem;
  border: 1px solid var(--c-line);
  background: rgba(8, 6, 5, 0.34);
  backdrop-filter: blur(8px);
}

.status-row span {
  color: var(--c-muted);
  font-size: 0.7rem;
}

.status-row strong {
  overflow: hidden;
  color: #fff3e0;
  font-size: 0.86rem;
  font-weight: 500;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-clock {
  position: absolute;
  top: 4.5%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.72rem;
  color: rgba(247, 236, 220, 0.76);
  font-size: 0.7rem;
  transform: translateX(-50%);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.72);
}

.customer-clock b {
  padding: 0 0.68rem;
  border-right: 1px solid rgba(215, 179, 109, 0.48);
  border-left: 1px solid rgba(215, 179, 109, 0.48);
  color: #fff3e0;
  font-size: 0.82rem;
  font-weight: 500;
}

.customer-sprite {
  position: absolute;
  left: 35%;
  right: 24%;
  bottom: 15%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.customer-sprite-item {
  position: relative;
  display: grid;
  min-width: 0;
  max-width: 25rem;
  height: 34rem;
  flex: 1 1 0;
  place-items: end center;
}

.customer-sprite-item img {
  width: min(25rem, 100%);
  max-height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 22px 32px rgba(0, 0, 0, 0.42));
}

.customer-sprite.has-2 {
  left: 29%;
  right: 19%;
}

.customer-sprite.has-2 .customer-sprite-item {
  max-width: 20rem;
}

.customer-sprite.has-3,
.customer-sprite.has-4 {
  left: 25%;
  right: 18%;
  bottom: 22%;
}

.customer-sprite.has-3 .customer-sprite-item,
.customer-sprite.has-4 .customer-sprite-item {
  max-width: 16rem;
  height: 30rem;
}

.customer-sprite.has-3 .customer-sprite-item + .customer-sprite-item,
.customer-sprite.has-4 .customer-sprite-item + .customer-sprite-item {
  margin-left: -2.5rem;
}

.customer-sprite.has-4 .customer-sprite-item {
  height: 27rem;
}

.customer-sprite.has-3 .sprite-caption,
.customer-sprite.has-4 .sprite-caption {
  display: none;
}

.sprite-caption {
  position: absolute;
  right: -1rem;
  bottom: 7rem;
  padding: 0.45rem 0.65rem 0.45rem 0.85rem;
  border-left: 2px solid var(--c-gold);
  background: linear-gradient(90deg, rgba(8, 6, 5, 0.54), transparent);
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.7);
}

.sprite-caption strong,
.sprite-caption span {
  display: block;
}

.sprite-caption strong {
  font-size: 0.9rem;
  font-weight: 500;
}
.sprite-caption span {
  margin-top: 0.12rem;
  color: var(--c-muted);
  font-size: 0.68rem;
}

.customer-actions {
  position: absolute;
  top: 29%;
  right: 3.1%;
  display: grid;
  width: 12.2rem;
  gap: 0.58rem;
}

.customer-actions button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.5rem;
  align-items: center;
  min-height: 2.45rem;
  padding: 0 0 0 1.1rem;
  border: 1px solid rgba(247, 236, 220, 0.08);
  border-right: 0;
  background: linear-gradient(90deg, rgba(8, 6, 5, 0.62), rgba(8, 6, 5, 0.3));
  color: rgba(247, 236, 220, 0.76);
  text-align: left;
  backdrop-filter: blur(8px);
}

.customer-actions button:hover {
  color: #fff4e2;
  border-color: rgba(215, 179, 109, 0.4);
  transform: translateX(-0.25rem);
}

.customer-actions b {
  display: grid;
  height: 100%;
  place-items: center;
  border-left: 1px solid rgba(247, 236, 220, 0.12);
  color: var(--c-gold);
  font-size: 1rem;
  font-weight: 400;
}

.customer-dialogue-shell {
  position: absolute;
  left: 4.5%;
  right: 4.5%;
  bottom: 3.7%;
}

.customer-dialogue {
  position: relative;
  width: 100%;
  min-height: 7rem;
  padding: 1.65rem 1.35rem 0.9rem;
  border-top: 1px solid rgba(247, 236, 220, 0.24);
  border-bottom: 1px solid rgba(247, 236, 220, 0.18);
  background: linear-gradient(180deg, rgba(8, 6, 5, 0.62), rgba(8, 6, 5, 0.38));
  color: rgba(247, 236, 220, 0.92);
  text-align: left;
  backdrop-filter: blur(12px);
}

.dialogue-arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 2rem;
  height: 2.8rem;
  place-items: center;
  border: 1px solid rgba(215, 179, 109, 0.3);
  background: rgba(8, 6, 5, 0.74);
  color: var(--c-gold);
  font-size: 1.45rem;
  transform: translateY(-50%);
  backdrop-filter: blur(8px);
}

.dialogue-arrow.is-previous {
  left: -2.65rem;
}

.dialogue-arrow.is-next {
  right: -2.65rem;
}

.dialogue-name {
  position: absolute;
  top: -2.1rem;
  left: 1.2rem;
  display: flex;
  min-width: 9rem;
  min-height: 2.15rem;
  align-items: center;
  padding: 0 1.2rem;
  background: linear-gradient(90deg, rgba(35, 37, 56, 0.86), rgba(35, 37, 56, 0.42));
  clip-path: polygon(0 0, calc(100% - 1.3rem) 0, 100% 50%, calc(100% - 1.3rem) 100%, 0 100%);
  font-family: 'Yu Mincho', 'Songti SC', serif;
}

.dialogue-body {
  display: block;
  max-width: 66rem;
  font-size: 0.96rem;
  line-height: 1.8;
}

.dialogue-count {
  position: absolute;
  right: 1rem;
  bottom: 0.55rem;
  color: var(--c-muted);
  font-size: 0.68rem;
}

.customer-menu-layer,
.customer-story-layer {
  position: absolute;
  inset: 0;
  z-index: 15;
  background: linear-gradient(90deg, rgba(6, 4, 3, 0.86), rgba(6, 4, 3, 0.34) 62%, rgba(6, 4, 3, 0.66));
  backdrop-filter: blur(7px);
}

.customer-menu-layer {
  display: grid;
  grid-template-columns: 10.5rem minmax(0, 1fr);
  gap: 2rem;
  padding: 5.3rem 4.5rem 4rem;
}

.customer-menu-tabs {
  align-self: center;
  display: grid;
  gap: 0.68rem;
}

.customer-menu-tabs button {
  position: relative;
  min-height: 2rem;
  padding-left: 1rem;
  background: transparent;
  color: rgba(247, 236, 220, 0.56);
  text-align: left;
}

.customer-menu-tabs button::before {
  content: '';
  position: absolute;
  top: 0.36rem;
  bottom: 0.36rem;
  left: 0;
  width: 3px;
  background: var(--c-tea);
  opacity: 0.3;
}

.customer-menu-tabs button::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  left: 4.8rem;
  border-top: 1px dotted rgba(247, 236, 220, 0.2);
}

.customer-menu-tabs button:hover,
.customer-menu-tabs button.is-active {
  color: #fff5e5;
}

.customer-menu-tabs button.is-active::before {
  opacity: 1;
}

.customer-menu-main {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.customer-menu-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.22);
}

.customer-menu-head small {
  color: var(--c-gold);
  font-size: 0.62rem;
}
.customer-menu-head h2 {
  margin: 0.18rem 0 0;
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 1.55rem;
  font-weight: 500;
}
.customer-menu-head p {
  margin: 0.25rem 0 0;
  color: var(--c-muted);
  font-size: 0.76rem;
}

.line-button,
.strip-actions button,
.current-focus button,
.selection-dock button,
.message-panel header button,
.message-compose button,
.customer-story-layer header button {
  min-height: 2rem;
  padding: 0 0.78rem;
  border: 1px solid rgba(247, 236, 220, 0.22);
  background: rgba(8, 6, 5, 0.32);
  color: rgba(247, 236, 220, 0.76);
  backdrop-filter: blur(8px);
}

.line-button:hover,
.strip-actions button:hover,
.current-focus button:hover,
.selection-dock button:hover,
.message-panel header button:hover,
.message-compose button:hover,
.customer-story-layer header button:hover {
  border-color: rgba(215, 179, 109, 0.56);
  color: #fff5e5;
}

.customer-menu-content {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.9rem 0.6rem 0.2rem 0;
  scrollbar-gutter: stable;
}

.customer-menu-content::-webkit-scrollbar,
.message-history::-webkit-scrollbar,
.customer-story-layer article::-webkit-scrollbar {
  width: 0.32rem;
}
.customer-menu-content::-webkit-scrollbar-thumb,
.message-history::-webkit-scrollbar-thumb,
.customer-story-layer article::-webkit-scrollbar-thumb {
  background: rgba(247, 236, 220, 0.2);
}

.metric-grid {
  display: grid;
  gap: 0.8rem;
}
.metric-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-strip,
.data-strip {
  position: relative;
  padding: 0.72rem 0.25rem 0.76rem 0.86rem;
  border-top: 1px dotted rgba(247, 236, 220, 0.24);
}

.data-strip.has-character-avatar {
  min-height: 7.1rem;
  padding-left: 5.25rem;
}

.character-avatar {
  position: absolute;
  top: 0.72rem;
  left: 0.86rem;
  width: 3.6rem;
  aspect-ratio: 7 / 10;
  border: 1px solid rgba(215, 179, 109, 0.32);
  background: rgba(0, 0, 0, 0.2);
  object-fit: cover;
  object-position: center top;
  box-shadow: 0 0.65rem 1.4rem rgba(0, 0, 0, 0.28);
}

.metric-strip::before,
.data-strip::before {
  content: '';
  position: absolute;
  top: 0.88rem;
  bottom: 0.88rem;
  left: 0;
  width: 3px;
  background: var(--c-gold);
  opacity: 0.62;
}

.data-strip.selected::before {
  background: var(--c-tea);
  opacity: 1;
}
.data-strip.spaced {
  margin-top: 0.82rem;
}
.metric-strip span {
  color: var(--c-muted);
  font-size: 0.72rem;
}
.metric-strip strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1.35rem;
  font-weight: 500;
}
.metric-strip p,
.data-strip p {
  margin: 0.32rem 0 0;
  color: var(--c-muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.strip-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
}

.strip-head h3 {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 500;
}
.strip-head span {
  color: var(--c-muted);
  font-size: 0.72rem;
}
.strip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-top: 0.58rem;
}
.strip-actions button {
  min-height: 1.8rem;
  font-size: 0.74rem;
}

.selection-dock,
.current-focus,
.wallet-total {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.8rem;
  padding: 0.85rem 0.95rem;
  border-top: 1px solid rgba(215, 179, 109, 0.4);
  background: rgba(10, 7, 5, 0.84);
  backdrop-filter: blur(12px);
}

.selection-dock small,
.selection-dock strong,
.selection-dock span,
.current-focus small,
.current-focus strong,
.current-focus p,
.wallet-total small,
.wallet-total strong,
.wallet-total p {
  display: block;
}
.selection-dock small,
.current-focus small,
.wallet-total small {
  color: var(--c-muted);
  font-size: 0.66rem;
}
.selection-dock strong,
.current-focus strong {
  margin-top: 0.12rem;
  font-size: 0.94rem;
  font-weight: 500;
}
.selection-dock span,
.current-focus p {
  margin-top: 0.12rem;
  color: var(--c-muted);
  font-size: 0.72rem;
}

.current-focus {
  position: relative;
  margin-top: 0;
  margin-bottom: 0.6rem;
}

.relationship-focus {
  position: relative;
  min-height: 8.8rem;
  padding: 0.9rem 0 0.5rem 6rem;
}
.relationship-avatar {
  position: absolute;
  top: 0.9rem;
  left: 0.2rem;
  width: 4.8rem;
  aspect-ratio: 7 / 10;
  border: 1px solid rgba(215, 179, 109, 0.34);
  background: rgba(0, 0, 0, 0.22);
  object-fit: cover;
  object-position: center top;
}
.relationship-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.18);
  padding-bottom: 0.62rem;
}
.relationship-title small {
  color: var(--c-muted);
  font-size: 0.68rem;
}
.relationship-title h3 {
  margin: 0.12rem 0 0;
  font-family: 'Yu Mincho', serif;
  font-size: 1.5rem;
  font-weight: 500;
}
.relationship-title > span {
  color: var(--c-gold);
  font-size: 0.8rem;
}
.relationship-focus > p {
  color: var(--c-muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.relation-meter {
  position: relative;
  height: 1.8rem;
  margin-top: 0.55rem;
  overflow: hidden;
  border: 1px solid rgba(247, 236, 220, 0.14);
  background: rgba(247, 236, 220, 0.05);
}
.relation-meter span {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  align-items: center;
  padding-left: 0.65rem;
  font-size: 0.72rem;
}
.relation-meter i {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, rgba(199, 136, 117, 0.48), rgba(215, 179, 109, 0.56));
}
.relation-meter.trust i {
  background: linear-gradient(90deg, rgba(128, 170, 156, 0.5), rgba(136, 169, 180, 0.58));
}
.relation-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
  margin-top: 0.65rem;
}
.relation-summary span {
  padding: 0.42rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.16);
  color: var(--c-muted);
  font-size: 0.7rem;
  text-align: center;
}

.employee-selector,
.stay-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-top: 0.8rem;
}
.employee-selector button,
.stay-options button {
  min-height: 1.9rem;
  padding: 0 0.7rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.18);
  background: transparent;
  color: var(--c-muted);
}
.employee-selector button.is-active,
.stay-options button.is-active {
  border-color: var(--c-gold);
  color: #fff4e2;
}

.contact-layout {
  display: grid;
  min-height: 24rem;
  grid-template-columns: 12rem minmax(0, 1fr);
  border-top: 1px solid rgba(247, 236, 220, 0.18);
}
.contact-list {
  padding-right: 0.7rem;
  border-right: 1px solid rgba(247, 236, 220, 0.16);
}
.contact-list > p {
  color: var(--c-muted);
  font-size: 0.74rem;
  line-height: 1.5;
}
.contact-list button {
  display: flex;
  width: 100%;
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.12);
  background: transparent;
  text-align: left;
}
.contact-avatar {
  width: 2.35rem;
  flex: 0 0 auto;
  aspect-ratio: 7 / 10;
  border: 1px solid rgba(247, 236, 220, 0.16);
  object-fit: cover;
  object-position: center top;
}
.contact-list button > span {
  min-width: 0;
  flex: 1;
}
.contact-list button.is-active {
  background: linear-gradient(90deg, rgba(128, 170, 156, 0.18), transparent);
}
.contact-list b,
.contact-list small {
  display: block;
}
.contact-list b {
  font-size: 0.8rem;
  font-weight: 500;
}
.contact-list small {
  margin-top: 0.1rem;
  color: var(--c-muted);
  font-size: 0.62rem;
}
.contact-list em {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  border-radius: 50%;
  background: var(--c-gold);
  color: #25170e;
  font-size: 0.62rem;
  font-style: normal;
}

.message-panel {
  display: grid;
  min-width: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding-left: 0.8rem;
}
.message-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.16);
}
.message-panel header strong,
.message-panel header span {
  display: block;
}
.message-panel header strong {
  font-size: 0.9rem;
  font-weight: 500;
}
.message-panel header span {
  margin-top: 0.12rem;
  color: var(--c-muted);
  font-size: 0.66rem;
}
.message-history {
  min-height: 0;
  max-height: 19rem;
  overflow-y: auto;
  padding: 0.65rem 0.2rem;
}
.message-history > p {
  color: var(--c-muted);
  font-size: 0.75rem;
}
.message-history article {
  max-width: 76%;
  margin-bottom: 0.55rem;
  padding-left: 0.65rem;
  border-left: 2px solid rgba(128, 170, 156, 0.6);
}
.message-history article.mine {
  margin-left: auto;
  border-right: 2px solid rgba(215, 179, 109, 0.68);
  border-left: 0;
  padding-right: 0.65rem;
  padding-left: 0;
  text-align: right;
}
.message-history small {
  color: var(--c-muted);
  font-size: 0.6rem;
}
.message-history p {
  margin: 0.15rem 0 0;
  font-size: 0.76rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
.message-compose {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.6rem;
  gap: 0.45rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(247, 236, 220, 0.16);
}
.message-compose input {
  min-width: 0;
  height: 2.3rem;
  padding: 0 0.65rem;
  border: 1px solid rgba(247, 236, 220, 0.18);
  border-radius: 0;
  outline: none;
  background: rgba(5, 4, 3, 0.38);
}
.message-compose input:focus {
  border-color: rgba(215, 179, 109, 0.56);
}

.day-stepper {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.65rem;
  color: var(--c-muted);
  font-size: 0.72rem;
}
.day-stepper input {
  width: 4rem;
  min-height: 1.9rem;
  border: 1px solid rgba(247, 236, 220, 0.18);
  border-radius: 0;
  background: rgba(5, 4, 3, 0.38);
  text-align: center;
}

.wallet-total {
  position: relative;
  display: block;
  margin-top: 0;
}
.wallet-total strong {
  margin-top: 0.15rem;
  font-family: 'Yu Mincho', serif;
  font-size: 2rem;
  font-weight: 500;
}
.wallet-total p {
  color: var(--c-muted);
  font-size: 0.72rem;
}
.ledger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.3rem;
  border-bottom: 1px dotted rgba(247, 236, 220, 0.16);
}
.ledger-row strong,
.ledger-row span,
.ledger-row b,
.ledger-row small {
  display: block;
}
.ledger-row strong {
  font-size: 0.8rem;
  font-weight: 500;
}
.ledger-row span,
.ledger-row small {
  margin-top: 0.1rem;
  color: var(--c-muted);
  font-size: 0.62rem;
}
.ledger-row > div:last-child {
  text-align: right;
}
.ledger-row b {
  color: #e1b49f;
  font-size: 0.78rem;
  font-weight: 500;
}
.empty-note {
  color: var(--c-muted);
  font-size: 0.76rem;
}

.customer-story-layer {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 5rem 8% 4rem;
}
.customer-story-layer header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(247, 236, 220, 0.24);
}
.customer-story-layer header small {
  color: var(--c-muted);
  font-size: 0.68rem;
}
.customer-story-layer h2 {
  margin: 0.2rem 0 0;
  font-family: 'Yu Mincho', serif;
  font-size: 1.55rem;
  font-weight: 500;
}
.customer-story-layer article {
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1rem 10rem 0;
}
.customer-story-layer article p {
  max-width: 58rem;
  margin: 0 0 0.9rem;
  color: rgba(247, 236, 220, 0.88);
  font-family: 'Yu Mincho', 'Songti SC', serif;
  font-size: 0.96rem;
  line-height: 1.9;
  white-space: pre-wrap;
}

@media (max-width: 760px) {
  .customer-brand {
    top: 0.8rem;
    left: 0.8rem;
    gap: 0.46rem;
  }
  .customer-seal {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.76rem;
  }
  .customer-brand strong {
    font-size: 0.82rem;
  }
  .customer-brand small {
    font-size: 0.56rem;
  }
  .customer-status {
    top: 6.4rem;
    left: 0.9rem;
    width: 7.6rem;
    gap: 0.45rem;
  }
  .visit-plaque {
    width: 7.4rem;
  }
  .visit-plaque b {
    font-size: 1.6rem;
  }
  .status-row {
    grid-template-columns: 2.4rem minmax(0, 1fr);
    min-height: 2rem;
    padding: 0 0.48rem;
  }
  .status-row span {
    font-size: 0.62rem;
  }
  .status-row strong {
    font-size: 0.7rem;
  }
  .customer-clock {
    top: 4.35rem;
    left: 0.9rem;
    width: auto;
    justify-content: flex-start;
    gap: 0.34rem;
    font-size: 0.6rem;
    transform: none;
  }
  .customer-clock span:first-child {
    display: none;
  }
  .customer-clock b {
    padding: 0 0.42rem;
    font-size: 0.7rem;
  }
  .customer-sprite {
    left: 24%;
    right: -9%;
    bottom: 17%;
  }
  .customer-sprite-item img {
    width: min(18rem, 110%);
  }
  .sprite-caption {
    display: none;
  }
  .customer-actions {
    top: 32%;
    right: 0.8rem;
    width: 8.4rem;
    gap: 0.42rem;
  }
  .customer-actions button {
    grid-template-columns: minmax(0, 1fr) 2rem;
    min-height: 2.1rem;
    padding-left: 0.65rem;
    font-size: 0.72rem;
  }
  .customer-dialogue-shell {
    left: 3%;
    right: 3%;
    bottom: 2.6%;
  }
  .customer-dialogue {
    min-height: 7.2rem;
    padding: 1.4rem 0.8rem 0.7rem;
  }
  .dialogue-arrow {
    width: 1.7rem;
    height: 2.4rem;
  }
  .dialogue-arrow.is-previous {
    left: -0.25rem;
  }
  .dialogue-arrow.is-next {
    right: -0.25rem;
  }
  .dialogue-name {
    top: -1.8rem;
    min-width: 7rem;
    min-height: 1.85rem;
    font-size: 0.8rem;
  }
  .dialogue-body {
    font-size: 0.78rem;
    line-height: 1.65;
  }
  .customer-menu-layer {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6rem;
    padding: 4.4rem 0.9rem 1rem;
  }
  .customer-menu-tabs {
    display: flex;
    align-self: start;
    gap: 0.36rem;
    overflow-x: auto;
  }
  .customer-menu-tabs button {
    min-width: 4rem;
    padding: 0 0.45rem;
    white-space: nowrap;
    font-size: 0.72rem;
    text-align: center;
  }
  .customer-menu-tabs button::before,
  .customer-menu-tabs button::after {
    display: none;
  }
  .customer-menu-tabs button.is-active {
    border-bottom: 2px solid var(--c-tea);
  }
  .customer-menu-head h2 {
    font-size: 1.05rem;
  }
  .customer-menu-head p {
    max-width: 14rem;
    font-size: 0.66rem;
  }
  .metric-grid.three {
    grid-template-columns: 1fr;
  }
  .metric-strip strong {
    font-size: 1rem;
  }
  .contact-layout {
    min-height: 32rem;
    grid-template-columns: 6.4rem minmax(0, 1fr);
  }
  .contact-list button {
    padding: 0.35rem;
  }
  .contact-list b {
    font-size: 0.7rem;
  }
  .message-history {
    max-height: 25rem;
  }
  .message-history article {
    max-width: 88%;
  }
  .message-compose {
    grid-template-columns: minmax(0, 1fr) 3.8rem;
  }
  .relation-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .customer-story-layer {
    padding: 4.4rem 1rem 1rem;
  }
  .customer-story-layer article p {
    font-size: 0.8rem;
    line-height: 1.75;
  }
}
</style>
