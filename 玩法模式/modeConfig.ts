import type { GameplayMode, GameplayModeProfile } from './types';

export const defaultGameplayModeProfiles: Record<GameplayMode, GameplayModeProfile> = {
  店长: {
    mode: '店长',
    frontendEntry: 'frontend-preview.html',
    worldbook: {
      modeEntry: '店长玩法_入口占位',
      variableRuleEntry: '店长玩法_变量规则占位',
      initialVariableEntry: '店长玩法_初始变量占位',
    },
    initialVariables: {
      玩法模式: '店长',
      当前状态: '待初始化',
    },
    storyPlaceholders: [
      {
        slot: '首页台词',
        shouldProvide: ['Trạng thái nhà tắm hiện tại', 'Danh sách nhân vật tại chỗ', 'Nhân vật đang nói hiện tại', 'Câu thoại hoặc lời ngắn tiếp theo'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
      {
        slot: '正文剧情',
        shouldProvide: ['Thao tác kinh doanh hiện tại', 'Context đơn hàng hoặc nhân viên', 'Danh sách người tham gia', 'Nhãn cảnh', 'Kết quả tiếp nhận chính văn'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
    ],
  },
  客人: {
    mode: '客人',
    frontendEntry: 'frontend-customer-preview.html',
    worldbook: {
      modeEntry: '客人玩法_入口占位',
      variableRuleEntry: '客人玩法_变量规则占位',
      initialVariableEntry: '客人玩法_初始变量占位',
    },
    initialVariables: {
      玩法模式: '客人',
      当前状态: '待初始化',
    },
    storyPlaceholders: [
      {
        slot: '首页台词',
        shouldProvide: ['Tóm tắt đặt lịch hiện tại', 'Danh sách nhân viên tại chỗ', 'Nhân vật đang nói hiện tại', 'Lời ngắn trước khi bắt đầu dịch vụ'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
      {
        slot: '正文剧情',
        shouldProvide: ['Dự án đã chọn', 'Nhân viên được chỉ định', 'Context ví tiền/quyết toán', 'Danh sách người tham gia', 'Kết quả tiếp nhận chính văn dịch vụ'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
    ],
  },
  服务员: {
    mode: '服务员',
    frontendEntry: 'frontend-waiter-preview.html',
    worldbook: {
      modeEntry: '服务员玩法_入口占位',
      variableRuleEntry: '服务员玩法_变量规则占位',
      initialVariableEntry: '服务员玩法_初始变量占位',
    },
    initialVariables: {
      玩法模式: '服务员',
      当前状态: '待初始化',
    },
    storyPlaceholders: [
      {
        slot: '首页台词',
        shouldProvide: ['Ca trực hiện tại', 'Khu vực vị trí', 'Danh sách nhân vật tại chỗ', 'Nhân vật đang nói hiện tại', 'Lời ngắn trong lúc làm việc'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
      {
        slot: '正文剧情',
        shouldProvide: ['Thao tác công việc hiện tại', 'Context khách/chủ tiệm/đồng nghiệp', 'Vị trí và dự án dịch vụ', 'Context thu nhập đánh giá', 'Kết quả tiếp nhận chính văn'],
        promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định',
      },
    ],
  },
};
