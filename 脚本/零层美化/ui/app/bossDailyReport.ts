import type {
  BossDailyReport,
  BossEmployeeDayRole,
  BossPageState,
  BossSettlement,
} from './bossEconomy';

type InjectItem = Omit<InjectionPrompt, 'id'>;

export type BossDailyProjectFact = {
  name: string;
  orders: number;
  basePrice: number;
  rating: number;
  recommendation: number;
};

export type BossDailyEmployeeFact = {
  name: string;
  grade: string;
  area: string;
  role: BossEmployeeDayRole;
  receptionSegments: number;
  dutySegments: number;
  cleaningSegments: number;
  restSegments: number;
  salary: number;
  fatigueChange: number;
  satisfactionChange: number;
  personalIncome: number;
};

export type BossDailyEventFact = {
  id: string;
  kind: 'holiday' | 'business' | 'maintenance' | 'construction' | 'nomination' | 'campaign' | 'quality';
  label: string;
  detail: string;
};

export type BossDailyReportFacts = {
  version: 1;
  businessDay: number;
  date: string;
  businessStatus: string;
  holiday: { status: string; name: string; note: string };
  traffic: number;
  areas: Array<{ name: string; guests: number }>;
  projects: BossDailyProjectFact[];
  employees: BossDailyEmployeeFact[];
  events: BossDailyEventFact[];
  settlement: BossSettlement;
  fundsBefore: number;
  fundsAfter: number;
  ratingBefore: number;
  ratingAfter: number;
  favorableRateBefore: number;
  favorableRateAfter: number;
  maintenanceBefore: number;
  maintenanceAfter: number;
};

export type BossDailyReportApplyResult = {
  ok: boolean;
  report: BossDailyReport;
  issues: string[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function makeBossDailyEvents(before: BossPageState, settled: BossPageState): BossDailyEventFact[] {
  const events: BossDailyEventFact[] = [];
  if (before.节假日.状态 !== '平日') {
    events.push({
      id: 'holiday',
      kind: 'holiday',
      label: before.节假日.名称,
      detail: before.节假日.说明,
    });
  }
  if (before.营业状态 !== '营业中') {
    events.push({
      id: 'business-status',
      kind: 'business',
      label: before.营业状态,
      detail: before.营业状态 === '今日停业' ? 'Hôm nay không có doanh thu kinh doanh, nhưng vẫn giữ lại chi phí cơ bản.' : 'Hôm nay tạm ngừng nhận thêm khách.',
    });
  }
  events.push({
    id: 'maintenance',
    kind: 'maintenance',
    label: 'Bảo trì cơ sở vật chất',
    detail: `Độ bảo trì thay đổi từ ${before.基建.维护度} thành ${settled.基建.维护度}, chi phí bảo trì trong ngày là ${settled.结算.支出明细.设施维护}.`,
  });
  before.工程.forEach((project, index) => {
    const after = settled.工程.find(item => item.id === project.id);
    events.push({
      id: `construction-${index + 1}`,
      kind: 'construction',
      label: project.名称,
      detail: `${project.状态}, tiêu hao trong ngày ${project.每日消耗}; sau khi kết toán là ${after?.状态 ?? project.状态}, còn lại ${after?.剩余天数 ?? project.剩余天数} ngày.`,
    });
  });
  before.指名.forEach((nomination, index) => {
    events.push({
      id: `nomination-${index + 1}`,
      kind: 'nomination',
      label: `${nomination.客人} chỉ định ${nomination.员工}`,
      detail: `${nomination.区域}, phí chỉ định hàng ngày ${nomination.每日指名费}, tiền boa dự kiến ${nomination.预计小费}.`,
    });
  });
  before.宣传活动.forEach((campaign, index) => {
    events.push({
      id: `campaign-${index + 1}`,
      kind: 'campaign',
      label: campaign.名称,
      detail: campaign.说明,
    });
  });
  before.品质投入.forEach((boost, index) => {
    events.push({
      id: `quality-${index + 1}`,
      kind: 'quality',
      label: `Đầu tư chất lượng ${boost.项目}`,
      detail: boost.说明,
    });
  });
  return events;
}

export function makeBossDailyReportFacts(before: BossPageState, settled: BossPageState): BossDailyReportFacts {
  const employeeReports = new Map(settled.结算.员工日结.map(report => [report.员工, report]));
  return {
    version: 1,
    businessDay: settled.结算.营业日,
    date: before.日期,
    businessStatus: before.营业状态,
    holiday: {
      status: before.节假日.状态,
      name: before.节假日.名称,
      note: before.节假日.说明,
    },
    traffic: before.营业状态 === '今日停业' ? 0 : before.客流,
    areas: before.区域.filter(area => area.客人 > 0).map(area => ({ name: area.名称, guests: area.客人 })),
    projects: before.项目
      .filter(project => project.今日订单 > 0)
      .map(project => ({
        name: project.名称,
        orders: project.今日订单,
        basePrice: project.基础价格,
        rating: project.评分,
        recommendation: project.推荐值,
      })),
    employees: before.员工.map(employee => {
      const report = employeeReports.get(employee.姓名);
      const after = settled.员工.find(item => item.姓名 === employee.姓名);
      return {
        name: employee.姓名,
        grade: employee.评级,
        area: employee.区域,
        role: report?.角色 ?? '休息',
        receptionSegments: report?.接待段 ?? 0,
        dutySegments: report?.值班段 ?? 0,
        cleaningSegments: report?.清洁段 ?? 0,
        restSegments: report?.休息段 ?? 0,
        salary: report?.工资 ?? 0,
        fatigueChange: report?.疲劳变化 ?? 0,
        satisfactionChange: report?.满意变化 ?? 0,
        personalIncome: after?.个人收入 ?? 0,
      };
    }),
    events: makeBossDailyEvents(before, settled),
    settlement: clone(settled.结算),
    fundsBefore: before.资金,
    fundsAfter: settled.资金,
    ratingBefore: before.店铺评分,
    ratingAfter: settled.店铺评分,
    favorableRateBefore: before.好评率,
    favorableRateAfter: settled.好评率,
    maintenanceBefore: before.基建.维护度,
    maintenanceAfter: settled.基建.维护度,
  };
}

export function makeBossDailyReportInjects(facts: BossDailyReportFacts): InjectItem[] {
  const projectLines = facts.projects.map(project => [
    `    <project>`,
    `      <name>${escapeXml(project.name)}</name>`,
    `      <orders>${project.orders}</orders>`,
    `      <base_price>${project.basePrice}</base_price>`,
    `      <rating>${project.rating}</rating>`,
    `      <recommendation>${project.recommendation}</recommendation>`,
    `    </project>`,
  ].join('\n')).join('\n');
  const employeeLines = facts.employees.map(employee => [
    `    <employee>`,
    `      <name>${escapeXml(employee.name)}</name>`,
    `      <grade>${escapeXml(employee.grade)}</grade>`,
    `      <area>${escapeXml(employee.area)}</area>`,
    `      <role>${escapeXml(employee.role)}</role>`,
    `      <reception_segments>${employee.receptionSegments}</reception_segments>`,
    `      <duty_segments>${employee.dutySegments}</duty_segments>`,
    `      <cleaning_segments>${employee.cleaningSegments}</cleaning_segments>`,
    `      <rest_segments>${employee.restSegments}</rest_segments>`,
    `      <salary>${employee.salary}</salary>`,
    `      <personal_income>${employee.personalIncome}</personal_income>`,
    `    </employee>`,
  ].join('\n')).join('\n');
  const areaLines = facts.areas.map(area => [
    `    <area>`,
    `      <name>${escapeXml(area.name)}</name>`,
    `      <guests>${area.guests}</guests>`,
    `    </area>`,
  ].join('\n')).join('\n');
  const eventLines = facts.events.map(event => [
    `    <event>`,
    `      <id>${escapeXml(event.id)}</id>`,
    `      <kind>${escapeXml(event.kind)}</kind>`,
    `      <label>${escapeXml(event.label)}</label>`,
    `      <detail>${escapeXml(event.detail)}</detail>`,
    `    </event>`,
  ].join('\n')).join('\n');
  const settlement = facts.settlement;
  const content = [
    `<boss_report_input>`,
    `  <schema_version>1</schema_version>`,
    `  <readonly>true</readonly>`,
    `  <business_day>${facts.businessDay}</business_day>`,
    `  <date>${escapeXml(facts.date)}</date>`,
    `  <business_status>${escapeXml(facts.businessStatus)}</business_status>`,
    `  <holiday_status>${escapeXml(facts.holiday.status)}</holiday_status>`,
    `  <holiday_name>${escapeXml(facts.holiday.name)}</holiday_name>`,
    `  <holiday_note>${escapeXml(facts.holiday.note)}</holiday_note>`,
    `  <traffic>${facts.traffic}</traffic>`,
    `  <areas>`,
    areaLines,
    `  </areas>`,
    `  <projects>`,
    projectLines,
    `  </projects>`,
    `  <employees>`,
    employeeLines,
    `  </employees>`,
    `  <settlement>`,
    `    <income>${settlement.收入}</income>`,
    `    <income_visit>${settlement.店铺收入明细.到店消费}</income_visit>`,
    `    <income_projects>${settlement.店铺收入明细.项目消费}</income_projects>`,
    `    <income_lodging>${settlement.店铺收入明细.住宿包场}</income_lodging>`,
    `    <income_packages>${settlement.店铺收入明细.活动套餐}</income_packages>`,
    `    <expense>${settlement.支出}</expense>`,
    `    <expense_salary>${settlement.支出明细.日薪}</expense_salary>`,
    `    <expense_operations>${settlement.支出明细.固定运营}</expense_operations>`,
    `    <expense_maintenance>${settlement.支出明细.设施维护}</expense_maintenance>`,
    `    <expense_service>${settlement.支出明细.服务准备}</expense_service>`,
    `    <expense_construction>${settlement.支出明细.工程消耗}</expense_construction>`,
    `    <expense_investment>${settlement.支出明细.投资}</expense_investment>`,
    `    <gross_profit>${settlement.毛利}</gross_profit>`,
    `    <funds_before>${facts.fundsBefore}</funds_before>`,
    `    <funds_after>${facts.fundsAfter}</funds_after>`,
    `  </settlement>`,
    `  <ratings>`,
    `    <shop_before>${facts.ratingBefore}</shop_before>`,
    `    <shop_after>${facts.ratingAfter}</shop_after>`,
    `    <favorable_before>${facts.favorableRateBefore}</favorable_before>`,
    `    <favorable_after>${facts.favorableRateAfter}</favorable_after>`,
    `  </ratings>`,
    `  <maintenance>`,
    `    <before>${facts.maintenanceBefore}</before>`,
    `    <after>${facts.maintenanceAfter}</after>`,
    `  </maintenance>`,
    `  <events>`,
    eventLines,
    `  </events>`,
    `</boss_report_input>`,
  ].join('\n');
  return [{ position: 'in_chat', depth: 1, role: 'system', content, should_scan: false }];
}

function directChildren(element: Element, tagName?: string): Element[] {
  return Array.from(element.childNodes)
    .filter((child): child is Element => child.nodeType === 1)
    .filter(child => !tagName || child.tagName === tagName);
}

function assertNoAttributesInTree(root: Element, issues: string[]) {
  const elements = [root, ...Array.from(root.getElementsByTagName('*'))];
  elements.forEach(element => {
    if (element.attributes.length > 0) {
      issues.push(`${element.tagName} không được chứa thuộc tính`);
    }
  });
}

function assertExactChildNames(element: Element, expected: string[], context: string, issues: string[]) {
  const actual = directChildren(element).map(child => child.tagName);
  const expectedCounts = new Map(expected.map(name => [name, expected.filter(item => item === name).length]));
  const actualCounts = new Map(actual.map(name => [name, actual.filter(item => item === name).length]));
  const names = new Set([...expectedCounts.keys(), ...actualCounts.keys()]);
  names.forEach(name => {
    if ((expectedCounts.get(name) ?? 0) !== (actualCounts.get(name) ?? 0)) {
      issues.push(`${context} trường ${name} phải xuất hiện đúng ${expectedCounts.get(name) ?? 0} lần`);
    }
  });
}

function readSingleElement(parent: Element, tagName: string, context: string, issues: string[]): Element | null {
  const matches = directChildren(parent, tagName);
  if (matches.length !== 1) {
    issues.push(`${context}.${tagName} phải xuất hiện đúng một lần`);
    return null;
  }
  return matches[0];
}

function readText(parent: Element, tagName: string, context: string, issues: string[]): string {
  const element = readSingleElement(parent, tagName, context, issues);
  if (element && directChildren(element).length > 0) {
    issues.push(`${context}.${tagName} chỉ được chứa văn bản thuần`);
  }
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function readInteger(parent: Element, tagName: string, context: string, issues: string[]): number {
  const value = readText(parent, tagName, context, issues);
  if (!/^-?\d+$/.test(value)) {
    issues.push(`${context}.${tagName} phải là số nguyên`);
    return 0;
  }
  return Number(value);
}

function parseBossDailyRoot(raw: string, issues: string[]): Element | null {
  const openMatches = Array.from(raw.matchAll(/<boss_daily_report(?=[\s>])[^>]*>/g));
  const closeMatches = Array.from(raw.matchAll(/<\/boss_daily_report\s*>/g));
  if (openMatches.length !== 1 || closeMatches.length !== 1) {
    issues.push('Phải có đúng một khối dữ liệu <boss_daily_report>');
    return null;
  }
  const openMatch = openMatches[0];
  const closeMatch = closeMatches[0];
  if (openMatch[0] !== '<boss_daily_report>') {
    issues.push('Thẻ gốc boss_daily_report không được chứa thuộc tính');
    return null;
  }
  if (closeMatch.index < openMatch.index) {
    issues.push('<boss_daily_report> không phải là XML hợp lệ');
    return null;
  }
  const candidate = raw.slice(openMatch.index, closeMatch.index + closeMatch[0].length);
  const document = new DOMParser().parseFromString(candidate, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0 || document.documentElement.tagName !== 'boss_daily_report') {
    issues.push('<boss_daily_report> không phải là XML hợp lệ');
    return null;
  }
  return document.documentElement;
}

function sameStringSet(actual: string[], expected: string[], context: string, issues: string[]) {
  if (actual.length !== expected.length || new Set(actual).size !== actual.length) {
    issues.push(`${context} sai số lượng hoặc không đảm bảo tính duy nhất`);
    return;
  }
  const expectedSet = new Set(expected);
  actual.forEach(value => {
    if (!expectedSet.has(value)) issues.push(`${context} chứa giá trị không xác định ${value}`);
  });
}

function validateNarrative(value: string, field: string, maxLength: number, issues: string[]) {
  if (!value || value.length > maxLength) issues.push(`${field} phải dài từ 1 đến ${maxLength} ký tự`);
  if (/[0-9¥￥$€₫]|tiền tệ|\d+\s*đồng/.test(value)) issues.push(`${field} không được nhắc lại hoặc tự bịa số tiền`);
}

export function makeLocalBossDailyReport(facts: BossDailyReportFacts, issues: string[] = []): BossDailyReport {
  const profitableProjects = facts.projects.map(project => project.name).join('、');
  const activeAreas = facts.areas.map(area => area.name).join('、');
  const profitText = facts.settlement.毛利 >= 0 ? 'Doanh thu trong ngày đã bù đắp đủ lương và chi phí vận hành.' : 'Doanh thu trong ngày chưa bù đắp đủ toàn bộ chi phí vận hành.';
  const ratingDirection = facts.ratingAfter >= facts.ratingBefore ? 'Đánh giá cửa hàng giữ ổn định hoặc có cải thiện.' : 'Đánh giá cửa hàng chịu ảnh hưởng bởi áp lực kinh doanh trong ngày.';
  return {
    version: 1,
    营业日: facts.businessDay,
    日期: facts.date,
    来源: 'fallback',
    标题: `Nhật ký kinh doanh ${facts.date}`,
    客人概况: facts.traffic > 0
      ? `Hôm nay có tổng cộng ${facts.traffic} vị khách đến quán, tập trung chủ yếu ở ${activeAreas || 'khu vực đang mở'}.`
      : 'Hôm nay không có lượt khách nào đến quán.',
    收入说明: profitableProjects ? `${profitableProjects} đã phát sinh đơn hàng dự án trong ngày. ${profitText}` : profitText,
    评价说明: ratingDirection,
    项目日结: facts.projects.map(project => ({
      项目: project.name,
      订单: project.orders,
      纪要: `${project.name} đã hoàn thành ${project.orders} đơn hàng.`,
    })),
    员工纪要: facts.employees.map(employee => ({
      员工: employee.name,
      角色: employee.role,
      纪要: `${employee.name} hôm nay chủ yếu phụ trách ${employee.role}.`,
    })),
    事件纪要: facts.events.map(event => ({ id: event.id, 纪要: `${event.label}: ${event.detail}` })),
    收束: 'Sự việc kinh doanh trong ngày đã được niêm phong, cửa hàng bước sang ngày kinh doanh tiếp theo.',
    问题: issues.slice(0, 12),
  };
}

export function applyBossDailyReport(raw: string, facts: BossDailyReportFacts): BossDailyReportApplyResult {
  const issues: string[] = [];
  const fallback = makeLocalBossDailyReport(facts);
  const root = parseBossDailyRoot(raw, issues);
  if (!root) return { ok: false, report: { ...fallback, 问题: issues }, issues };
  assertNoAttributesInTree(root, issues);
  assertExactChildNames(
    root,
    ['business_day', 'date', 'headline', 'guest_summary', 'revenue_summary', 'rating_summary', 'projects', 'employees', 'events', 'closing'],
    'boss_daily_report',
    issues,
  );
  const projectsElement = readSingleElement(root, 'projects', 'boss_daily_report', issues);
  const employeesElement = readSingleElement(root, 'employees', 'boss_daily_report', issues);
  const eventsElement = readSingleElement(root, 'events', 'boss_daily_report', issues);
  const projectElements = projectsElement ? directChildren(projectsElement, 'project') : [];
  const employeeElements = employeesElement ? directChildren(employeesElement, 'employee') : [];
  const eventElements = eventsElement ? directChildren(eventsElement, 'event') : [];
  if (projectsElement && directChildren(projectsElement).length !== projectElements.length) issues.push('projects chỉ được chứa project');
  if (employeesElement && directChildren(employeesElement).length !== employeeElements.length) issues.push('employees chỉ được chứa employee');
  if (eventsElement && directChildren(eventsElement).length !== eventElements.length) issues.push('events chỉ được chứa event');
  const projects = projectElements.map((element, index) => {
    const context = `projects.project[${index}]`;
    assertExactChildNames(element, ['name', 'orders', 'note'], context, issues);
    return {
      项目: readText(element, 'name', context, issues),
      订单: readInteger(element, 'orders', context, issues),
      纪要: readText(element, 'note', context, issues),
    };
  });
  const employees = employeeElements.map((element, index) => {
    const context = `employees.employee[${index}]`;
    assertExactChildNames(element, ['name', 'role', 'note'], context, issues);
    return {
      员工: readText(element, 'name', context, issues),
      角色: readText(element, 'role', context, issues) as BossEmployeeDayRole,
      纪要: readText(element, 'note', context, issues),
    };
  });
  const events = eventElements.map((element, index) => {
    const context = `events.event[${index}]`;
    assertExactChildNames(element, ['id', 'note'], context, issues);
    return { id: readText(element, 'id', context, issues), 纪要: readText(element, 'note', context, issues) };
  });
  const businessDay = readInteger(root, 'business_day', 'boss_daily_report', issues);
  const date = readText(root, 'date', 'boss_daily_report', issues);
  const headline = readText(root, 'headline', 'boss_daily_report', issues);
  const guestSummary = readText(root, 'guest_summary', 'boss_daily_report', issues);
  const revenueSummary = readText(root, 'revenue_summary', 'boss_daily_report', issues);
  const ratingSummary = readText(root, 'rating_summary', 'boss_daily_report', issues);
  const closing = readText(root, 'closing', 'boss_daily_report', issues);
  if (businessDay !== facts.businessDay) issues.push('business_day không khớp với sự kiện đã đóng băng');
  if (date !== facts.date) issues.push('date không khớp với sự kiện đã đóng băng');
  sameStringSet(projects.map(item => item.项目), facts.projects.map(item => item.name), 'Nhật ký dự án', issues);
  sameStringSet(employees.map(item => item.员工), facts.employees.map(item => item.name), 'Nhật ký nhân viên', issues);
  sameStringSet(events.map(item => item.id), facts.events.map(item => item.id), 'Nhật ký sự kiện', issues);
  const projectFacts = new Map(facts.projects.map(item => [item.name, item]));
  projects.forEach(item => {
    if (item.订单 !== projectFacts.get(item.项目)?.orders) issues.push(`Đơn hàng của dự án ${item.项目} đã bị sửa đổi`);
    validateNarrative(item.纪要, `Nhật ký dự án ${item.项目}`, 180, issues);
  });
  const employeeFacts = new Map(facts.employees.map(item => [item.name, item]));
  employees.forEach(item => {
    if (item.角色 !== employeeFacts.get(item.员工)?.role) issues.push(`Vai trò của nhân viên ${item.员工} đã bị sửa đổi`);
    validateNarrative(item.纪要, `Nhật ký nhân viên ${item.员工}`, 180, issues);
  });
  events.forEach(item => validateNarrative(item.纪要, `Nhật ký sự kiện ${item.id}`, 180, issues));
  validateNarrative(headline, 'headline', 60, issues);
  validateNarrative(guestSummary, 'guest_summary', 300, issues);
  validateNarrative(revenueSummary, 'revenue_summary', 300, issues);
  validateNarrative(ratingSummary, 'rating_summary', 240, issues);
  validateNarrative(closing, 'closing', 180, issues);
  if (issues.length > 0) return { ok: false, report: { ...fallback, 问题: issues }, issues };
  return {
    ok: true,
    issues: [],
    report: {
      version: 1,
      营业日: facts.businessDay,
      日期: facts.date,
      来源: 'ai',
      标题: headline,
      客人概况: guestSummary,
      收入说明: revenueSummary,
      评价说明: ratingSummary,
      项目日结: projects,
      员工纪要: employees,
      事件纪要: events,
      收束: closing,
      问题: [],
    },
  };
}

export function attachBossDailyReport(state: BossPageState, report: BossDailyReport): BossPageState {
  const next = clone(state);
  next.结算.经营纪要 = clone(report);
  return next;
}
