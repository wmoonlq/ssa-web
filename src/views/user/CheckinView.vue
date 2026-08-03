<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span class="card-title">预约签到</span>
      </template>

      <el-alert
        :title="'签到窗口为预约开始前后各 ' + checkinWindow + ' 分钟，超时未签到将自动释放座位并记录违约'"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />

      <div v-loading="loading">
        <div v-if="checkinList.length > 0" class="grid-container">
          <div v-for="row in checkinList" :key="row.id" class="grid-card">
            <div class="grid-seat">
              <span class="seat-icon">🪑</span>
              <span class="seat-no">{{
                row.seatNo != null ? row.seatNo + "号" : "-"
              }}</span>
            </div>
            <div class="grid-info">
              <div class="info-row">
                <span class="label">楼栋</span>
                <span>{{
                  row.buildingName ? row.buildingName + "栋" : "-"
                }}</span>
              </div>
              <div class="info-row">
                <span class="label">自习室</span>
                <span>{{ row.roomNo || "-" }}</span>
              </div>
              <div class="info-row">
                <span class="label">日期</span>
                <span>{{ row.reserveDate }}</span>
              </div>
              <div class="info-row">
                <span class="label">时段</span>
                <span>{{ row.startTime }} ~ {{ row.endTime }}</span>
              </div>
            </div>
            <div class="grid-footer">
              <el-tag type="warning" size="small">待签到</el-tag>
              <div class="card-actions">
                <template v-if="canCheckin(row)">
                  <el-button
                    type="success"
                    size="small"
                    :loading="actionLoading === row.id"
                    @click="handleCheckin(row.id)"
                    >签到</el-button
                  >
                </template>
                <span v-else-if="isFuture(row)" class="future-tip">签到未开放</span>
                <span v-else class="future-tip">签到已截止</span>
                <el-button
                  type="danger"
                  size="small"
                  plain
                  :loading="actionLoading === row.id"
                  @click="handleVacate(row.id)"
                  >退座</el-button
                >
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无待签到预约" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getPage, put, get } from "@/utils/api";

interface Reservation {
  id: number;
  roomNo: string;
  buildingName: string;
  seatNo: number | null;
  reserveDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

const currentUser = JSON.parse(
  sessionStorage.getItem("userInfo") || sessionStorage.getItem("user") || "{}",
);

const checkinList = ref<Reservation[]>([]);
const loading = ref(false);
const actionLoading = ref<number | null>(null);
const checkinWindow = ref(10);

async function loadRule() {
  try {
    const res = await get<any>("/reservation/rule");
    if (res) {
      checkinWindow.value = (res as any).checkinWindowMinutes ?? 10;
    }
  } catch { /* ignore */ }
}

async function loadList() {
  if (!currentUser.id) return;
  loading.value = true;
  try {
    const { list } = await getPage<Reservation>("/reservation/user/pending", {
      userId: currentUser.id,
      pageNum: 1,
      pageSize: 1000,
    });
    checkinList.value = list;
  } catch { /* handled by interceptor */ } finally {
    loading.value = false;
  }
}

async function handleCheckin(id: number) {
  actionLoading.value = id;
  try {
    await put(`/reservation/user/checkin/${id}`);
    ElMessage.success("签到成功！");
    loadList();
  } catch { /* handled by interceptor */ } finally {
    actionLoading.value = null;
  }
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseTimeMinutes(t: string): number {
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function canCheckin(row: Reservation): boolean {
  if (row.reserveDate !== todayStr()) return false;
  const startMin = parseTimeMinutes(row.startTime);
  const nowMin = nowMinutes();
  const win = checkinWindow.value;
  return nowMin >= startMin - win && nowMin <= startMin + win;
}

function isFuture(row: Reservation): boolean {
  if (row.reserveDate !== todayStr()) return row.reserveDate > todayStr();
  const startMin = parseTimeMinutes(row.startTime);
  const win = checkinWindow.value;
  return nowMinutes() < startMin - win;
}

async function handleVacate(id: number) {
  await ElMessageBox.confirm("确认退座？退座后该预约将释放座位。", "提示", {
    confirmButtonText: "确认退座",
    cancelButtonText: "取消",
    type: "warning",
  });
  actionLoading.value = id;
  try {
    await put(`/reservation/user/vacate/${id}`);
    ElMessage.success("退座成功");
    loadList();
  } catch { /* handled by interceptor */ } finally {
    actionLoading.value = null;
  }
}

onMounted(() => {
  loadList();
  loadRule();
});
</script>

<style scoped>
.page-card {
  min-height: calc(100vh - 120px);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 4px 0 16px;
}
.grid-card {
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  position: relative;
}
.grid-card:hover {
  border-color: #a0cfff;
}
.grid-seat {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.seat-icon {
  font-size: 24px;
}
.seat-no {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.grid-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}
.label {
  color: #909399;
}
.grid-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.card-actions {
  display: flex;
  gap: 6px;
}
.future-tip {
  font-size: 12px;
  color: #909399;
}
</style>
