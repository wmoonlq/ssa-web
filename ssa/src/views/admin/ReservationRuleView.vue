<template>
  <div class="rule-layout">
    <el-card class="section-card rule-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">预约规则管理</span>
          <el-button type="primary" :icon="Check" :loading="saving" @click="handleSave"
            >保存</el-button
          >
        </div>
      </template>
      <el-form
        :model="form"
        label-width="160px"
        style="max-width: 500px"
        v-loading="loading"
      >
        <el-form-item label="每人同时预约数">
          <el-input-number
            v-model="form.maxConcurrentReservations"
            :min="1"
            :max="10"
          />
        </el-form-item>
        <el-form-item label="每人每日最多预约">
          <el-input-number
            v-model="form.maxDailyReservations"
            :min="1"
            :max="20"
          />
        </el-form-item>
        <el-form-item label="单次最长时长（小时）">
          <el-input-number v-model="form.maxDurationHours" :min="1" :max="12" />
        </el-form-item>
        <el-form-item label="违约次数上限">
          <el-input-number
            v-model="form.maxViolationCount"
            :min="1"
            :max="20"
          />
        </el-form-item>
        <el-form-item label="最多提前预约天数">
          <el-input-number v-model="form.maxAdvanceDays" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="签到时间窗口（分钟）">
          <el-input-number
            v-model="form.checkinWindowMinutes"
            :min="1"
            :max="60"
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch
            v-model="form.isEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card task-card">
      <template #header>
        <span class="card-title">定时任务管理</span>
      </template>
      <div class="task-list">
        <div v-for="task in scheduleTasks" :key="task.code" class="task-item">
          <div class="task-content">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-desc">{{ task.description }}</div>
          </div>
          <el-button
            class="task-primary-button"
            type="primary"
            plain
            :loading="runningTask === task.code"
            @click="handleRunTask(task)"
          >
            立即执行
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Check } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import axios from "axios";

const loading = ref(false);
const saving = ref(false);
const runningTask = ref("");

interface ReservationRuleForm {
  maxAdvanceDays: number;
  maxDurationHours: number;
  maxViolationCount: number;
  maxConcurrentReservations: number;
  maxDailyReservations: number;
  checkinWindowMinutes: number;
  isEnabled: number;
}

const form = reactive<ReservationRuleForm>({
  maxAdvanceDays: 7,
  maxDurationHours: 4,
  maxViolationCount: 3,
  maxConcurrentReservations: 2,
  maxDailyReservations: 3,
  checkinWindowMinutes: 10,
  isEnabled: 1,
});

interface ScheduleTask {
  code: string;
  title: string;
  description: string;
  endpoint: string;
  countLabel: string;
}

interface ScheduleTaskRunResult {
  processedCount?: number;
}

const scheduleTasks: ScheduleTask[] = [
  {
    code: "reminder",
    title: "签到提醒任务",
    description: "扫描即将开始的 pending 预约，并推送签到提醒。",
    endpoint: "/api/reservation/rule/admin/run-reminder",
    countLabel: "新推送提醒",
  },
  {
    code: "overdue",
    title: "超时未签到处理任务",
    description: "扫描已超过签到截止时间的 pending 预约，标记为逾期并记录违约。",
    endpoint: "/api/reservation/rule/admin/run-overdue",
    countLabel: "处理逾期预约",
  },
  {
    code: "violation",
    title: "违约封号任务",
    description: "扫描违约次数达标的用户，自动封禁账号并推送通知。",
    endpoint: "/api/reservation/rule/admin/run-violation",
    countLabel: "封禁用户",
  },
  {
    code: "generate-calendar",
    title: "生成下月开放日历",
    description: "为所有启用自习室生成下月默认开放日历，工作日开放、周末关闭，已有配置的不覆盖。",
    endpoint: "/api/reservation/rule/admin/run-generate-calendar",
    countLabel: "新生成日历",
  },
];

function applyRule(data: Partial<ReservationRuleForm>) {
  Object.assign(form, {
    maxAdvanceDays: data.maxAdvanceDays ?? form.maxAdvanceDays,
    maxDurationHours: data.maxDurationHours ?? form.maxDurationHours,
    maxViolationCount: data.maxViolationCount ?? form.maxViolationCount,
    maxConcurrentReservations:
      data.maxConcurrentReservations ?? form.maxConcurrentReservations,
    maxDailyReservations: data.maxDailyReservations ?? form.maxDailyReservations,
    checkinWindowMinutes: data.checkinWindowMinutes ?? form.checkinWindowMinutes,
    isEnabled: data.isEnabled ?? form.isEnabled,
  });
}

async function fetchRule() {
  loading.value = true;
  try {
    const res = await axios.get("/api/reservation/rule");
    if (res.data.code === 200 && res.data.data) {
      applyRule(res.data.data);
    }
  } catch {
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const res = await axios.put("/api/reservation/rule", form);
    if (res.data.code === 200) {
      ElMessage.success("保存成功");
    }
  } catch {
    /* interceptor handles toast */
  } finally {
    saving.value = false;
  }
}

async function handleRunTask(task: ScheduleTask) {
  runningTask.value = task.code;
  try {
    const res = await axios.post(task.endpoint);
    if (res.data.code === 200) {
      const data: ScheduleTaskRunResult = res.data.data || {};
      ElMessage.success(
        `${task.title}执行完成：${task.countLabel} ${data.processedCount ?? 0} 条`
      );
    }
  } catch {
    /* interceptor handles toast */
  } finally {
    runningTask.value = "";
  }
}

onMounted(() => fetchRule());
</script>

<style scoped>
.rule-layout {
  display: grid;
  grid-template-columns: minmax(620px, 1fr) minmax(300px, 360px);
  gap: 16px;
  align-items: start;
}
.section-card {
  min-width: 0;
}
.task-card {
  position: sticky;
  top: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.card-title {
  font-weight: 600;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.task-content {
  min-width: 0;
}
.task-title {
  margin-bottom: 6px;
  font-weight: 600;
  color: #303133;
}
.task-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}
.task-primary-button {
  min-width: 104px;
  color: #fff !important;
  border-color: #4f46e5 !important;
  background: linear-gradient(135deg, #5b5cf6 0%, #4338ca 100%) !important;
  box-shadow: 0 10px 22px rgba(67, 56, 202, 0.24);
}
.task-primary-button:hover,
.task-primary-button:focus {
  color: #fff !important;
  border-color: #3730a3 !important;
  background: linear-gradient(135deg, #6366f1 0%, #3730a3 100%) !important;
}
.task-primary-button :deep(span) {
  color: #fff !important;
}
@media (max-width: 640px) {
  .rule-layout {
    grid-template-columns: 1fr;
  }
  .task-card {
    position: static;
  }
  .task-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
