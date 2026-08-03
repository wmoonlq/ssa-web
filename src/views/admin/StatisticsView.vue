<template>
  <div class="dashboard-wrapper" v-loading="loading">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" :class="'primary'">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="28"><House /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ statCards[0].value }}</span>
            <span class="stat-label">自习室数量</span>
          </div>
        </div>
      </div>

      <div class="stat-card" :class="'success'">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ statCards[1].value }}</span>
            <span class="stat-label">预约总数</span>
          </div>
        </div>
      </div>

      <div class="stat-card" :class="'warning'">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ statCards[2].value }}</span>
            <span class="stat-label">今日预约</span>
          </div>
        </div>
      </div>

      <div class="stat-card" :class="'info'">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ statCards[3].value }}</span>
            <span class="stat-label">今日签到率</span>
            <span class="stat-tip">签到/预约</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <!-- 近一周座位预约人数折线图 -->
      <div class="chart-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><TrendCharts /></el-icon>
            <span>近一周每日自习室座位预约人数</span>
          </div>
        </div>
        <div class="card-body">
          <el-empty
            v-if="weeklySeatData.length === 0"
            description="暂无数据"
            :image-size="80"
          />
          <div v-else ref="weeklyChart" class="chart-container"></div>
        </div>
      </div>

      <!-- 本月预约状态分布饼图 -->
      <div class="chart-card">
        <div class="card-header">
          <div class="header-title">
            <el-icon><PieChart /></el-icon>
            <span>本月预约状态分布</span>
          </div>
        </div>
        <div class="card-body">
          <el-empty
            v-if="statusDistData.length === 0"
            description="暂无数据"
            :image-size="80"
          />
          <div v-else ref="pieChart" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 近一月预约趋势分析（独占一行） -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <div class="header-title">
            <el-icon><DataLine /></el-icon>
            <span>近一月预约趋势分析</span>
          </div>
          <div class="header-actions"></div>
        </div>
        <div class="card-body">
          <el-empty
            v-if="monthlyData.length === 0"
            description="暂无数据"
            :image-size="80"
          />
          <div v-else ref="monthlyChart" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import axios from "axios";
import {
  House,
  Calendar,
  Clock,
  TrendCharts,
  DataLine,
  PieChart,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";

interface DailyReservation {
  day: string;
  count: number;
}

interface StatisticsDTO {
  studyRoomCount: number;
  totalReservationCount: number;
  todayReservationCount: number;
  todayCheckinRate: number;
  weeklySeatData: DailyReservation[];
  monthlyData: DailyReservation[];
  statusDistData: StatusDist[];
}

interface StatusDist {
  label: string;
  count: number;
  percent: number;
}

const loading = ref(false);

const statCards = ref([
  { label: "自习室数量", value: 0, icon: House, theme: "primary" },
  { label: "预约总数", value: 0, icon: Calendar, theme: "success" },
  { label: "今日预约", value: 0, icon: Clock, theme: "warning" },
  { label: "今日签到率", value: "0%", icon: TrendCharts, theme: "info", tip: "签到/预约" },
]);

const weeklySeatData = ref<DailyReservation[]>([]);
const monthlyData = ref<DailyReservation[]>([]);
const statusDistData = ref<StatusDist[]>([]);

const weeklyChart = ref<HTMLElement | null>(null);
const monthlyChart = ref<HTMLElement | null>(null);
const pieChart = ref<HTMLElement | null>(null);
let weeklyChartInstance: ECharts | null = null;
let monthlyChartInstance: ECharts | null = null;
let pieChartInstance: ECharts | null = null;

// ========================
// ECharts 公共选项工厂
// ========================

const LINE_COLOR = "#0891b2";
const LINE_AREA_STOPS: [number, string][] = [
  [0, "rgba(8, 145, 178, 0.2)"],
  [1, "rgba(8, 145, 178, 0.02)"],
];

function makeLineArea(color: string, stops: [number, string][]) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops.map(([o, c]) => ({ offset: o, color: c })));
}

function makeLineOption(days: string[], counts: number[], seriesName: string, rotateLabels = false) {
  return {
    tooltip: { trigger: "axis" as const, formatter: (p: any) => `${p[0].name}: ${p[0].value} 人` },
    grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category" as const,
      data: days,
      axisLine: { lineStyle: { color: "#ddd" } },
      axisLabel: { color: "#666", rotate: rotateLabels ? 45 : 0 },
    },
    yAxis: {
      type: "value" as const,
      minInterval: 1,
      axisLine: { show: false },
      axisLabel: { color: "#666" },
      splitLine: { lineStyle: { color: "#eee" } },
    },
    series: [
      {
        name: seriesName,
        type: "line" as const,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: LINE_COLOR },
        itemStyle: { color: LINE_COLOR },
        areaStyle: { color: makeLineArea(LINE_COLOR, LINE_AREA_STOPS) },
        data: counts,
      },
    ],
  };
}

function makePieOption(data: { name: string; value: number }[]) {
  return {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "horizontal" as const, bottom: "bottom", textStyle: { color: "#666" } },
    series: [
      {
        name: "预约状态",
        type: "pie" as const,
        radius: "60%",
        data,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.5)" } },
        label: { formatter: "{b}: {d}%" },
      },
    ],
  };
}

/** 安全初始化 ECharts：先销毁旧实例再创建新实例并设置 option */
function safeInitChart(el: HTMLElement | null, prev: ECharts | null, option: object): ECharts | null {
  if (!el) return null;
  if (prev) prev.dispose();
  const instance = echarts.init(el);
  instance.setOption(option);
  return instance;
}

// ========================
// 图表初始化
// ========================

function initWeeklyChart() {
  if (weeklySeatData.value.length === 0) return;
  const days = weeklySeatData.value.map((d) => d.day);
  const counts = weeklySeatData.value.map((d) => d.count);
  weeklyChartInstance = safeInitChart(weeklyChart.value, weeklyChartInstance, makeLineOption(days, counts, "预约人数"));
}

function initMonthlyChart() {
  if (monthlyData.value.length === 0) return;
  const days = monthlyData.value.map((d) => d.day);
  const counts = monthlyData.value.map((d) => d.count);
  monthlyChartInstance = safeInitChart(monthlyChart.value, monthlyChartInstance, makeLineOption(days, counts, "本月", true));
}

function initPieChart() {
  if (statusDistData.value.length === 0) return;
  const pieData = statusDistData.value.map((it) => ({ name: it.label, value: it.count }));
  pieChartInstance = safeInitChart(pieChart.value, pieChartInstance, makePieOption(pieData));
}

// ========================
// 响应式联动 + 数据加载
// ========================

watch(weeklySeatData, () => nextTick(initWeeklyChart));
watch(monthlyData, () => nextTick(initMonthlyChart));
watch(statusDistData, () => nextTick(initPieChart));

async function loadDashboard() {
  loading.value = true;
  try {
    const res = await axios.get<{ code: number; data: StatisticsDTO }>("/api/statistics/dashboard");
    if (res.data.code !== 200) return;

    const d = res.data.data;
    statCards.value[0].value = d.studyRoomCount ?? 0;
    statCards.value[1].value = d.totalReservationCount ?? 0;
    statCards.value[2].value = d.todayReservationCount ?? 0;
    statCards.value[3].value = `${d.todayCheckinRate ?? 0}%`;

    weeklySeatData.value = d.weeklySeatData ?? [];
    monthlyData.value = d.monthlyData ?? [];
    statusDistData.value = d.statusDistData ?? [];

    nextTick(() => {
      initWeeklyChart();
      initMonthlyChart();
      initPieChart();
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100%;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
}

.stat-card.primary .stat-icon {
  background: #0891b2;
}
.stat-card.success .stat-icon {
  background: #10b981;
}
.stat-card.warning .stat-icon {
  background: #f59e0b;
}
.stat-card.info .stat-icon {
  background: #6366f1;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  color: #333;
}

.stat-card.primary .stat-value {
  color: #0891b2;
}
.stat-card.success .stat-value {
  color: #10b981;
}
.stat-card.warning .stat-value {
  color: #f59e0b;
}
.stat-card.info .stat-value {
  color: #6366f1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.stat-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 图表卡片 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.header-title .el-icon {
  color: #0891b2;
}

.header-badge {
  font-size: 12px;
  padding: 4px 10px;
  background: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-body {
  padding: 20px 24px;
}

.chart-container {
  width: 100%;
  height: 320px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
