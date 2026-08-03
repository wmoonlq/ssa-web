<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span class="card-title">我的预约</span>
      </template>

      <!-- 筛选 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="预约编号">
          <el-input
            v-model="queryForm.id"
            placeholder="请输入预约编号"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="楼栋">
          <el-select
            v-model="queryForm.buildingName"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="b in buildingOptions"
              :key="b"
              :label="b"
              :value="b"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自习室">
          <el-input
            v-model="queryForm.roomNo"
            placeholder="请输入自习室号"
            clearable
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker
            v-model="queryForm.reserveDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="预约状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部"
            clearable
            style="width: 130px"
          >
            <el-option label="待签到" value="pending" />
            <el-option label="已签到" value="checked_in" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="退座" value="withdrawn" />
            <el-option label="违约超时" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="reservationList"
        border
        stripe
        style="margin-top: 16px"
      >
        <el-table-column prop="id" label="预约编号" width="90" align="center" />
        <el-table-column label="楼栋" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.buildingName ? row.buildingName + "栋" : "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="roomNo" label="自习室" width="90" align="center">
          <template #default="{ row }">{{ row.roomNo || "-" }}</template>
        </el-table-column>
        <el-table-column prop="seatNo" label="座位" width="70" align="center">
          <template #default="{ row }">{{
            row.seatNo != null ? row.seatNo + "号" : "-"
          }}</template>
        </el-table-column>
        <el-table-column
          prop="reserveDate"
          label="预约日期"
          width="120"
          align="center"
        />
        <el-table-column label="时间段" width="150" align="center">
          <template #default="{ row }">
            {{ row.startTime }} ~ {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="预约时间"
          width="180"
          align="center"
        />
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button
              type="warning"
              size="small"
              plain
              :disabled="row.status !== 'pending'"
              @click="handleCancel(row.id)"
              >取消预约</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && reservationList.length === 0"
        description="暂无预约记录"
      />

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          style="margin-top: 16px"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getPage, put, get } from "@/utils/api";
import type { Reservation } from "@/types/api";

const reservationList = ref<Reservation[]>([]);
const loading = ref(false);
const buildingOptions = ref<string[]>([]);
const queryForm = reactive({
  id: "",
  buildingName: "",
  roomNo: "",
  reserveDate: "",
  status: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

async function fetchList() {
  const stored = sessionStorage.getItem("userInfo");
  const userInfo = stored ? JSON.parse(stored) : null;
  if (!userInfo?.id) return;

  loading.value = true;
  try {
    const result = await getPage<Reservation>("/reservation/user/list", {
      userId: userInfo.id,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      id: queryForm.id || undefined,
      status: queryForm.status || undefined,
      startDate: queryForm.reserveDate || undefined,
      endDate: queryForm.reserveDate || undefined,
      roomNo: queryForm.roomNo || undefined,
      buildingName: queryForm.buildingName || undefined,
    });
    reservationList.value = result.list;
    pagination.total = result.total || 0;
  } catch { /* handled by interceptor */ } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchList();
  loadBuildingOptions();
});

async function loadBuildingOptions() {
  try {
    const res = await get<any>("/building/list", {
      pageNum: 1,
      pageSize: 100,
    });
    const records = (res as any)?.records ?? (res as any)?.list ?? [];
    buildingOptions.value = records.map((b: any) => b.name);
  } catch { /* ignore */ }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchList();
}
function handleReset() {
  queryForm.id = "";
  queryForm.buildingName = "";
  queryForm.roomNo = "";
  queryForm.reserveDate = "";
  queryForm.status = "";
  pagination.pageNum = 1;
  fetchList();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchList();
}

function handleCurrentChange(page: number) {
  pagination.pageNum = page;
  fetchList();
}

async function handleCancel(id: number) {
  await ElMessageBox.confirm("确认取消该预约吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    await put(`/reservation/user/cancel/${id}`);
    ElMessage.success("取消成功");
    fetchList();
  } catch { /* handled by interceptor */ }
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "待签到",
    checked_in: "已签到",
    cancelled: "已取消",
    withdrawn: "退座",
    overdue: "违约超时",
  };
  return map[s] || "未知";
}

function statusType(s: string): "warning" | "success" | "info" | "danger" {
  const map: Record<string, "warning" | "success" | "info" | "danger"> = {
    pending: "warning",
    checked_in: "success",
    cancelled: "info",
    withdrawn: "info",
    overdue: "danger",
  };
  return map[s] || "info";
}
</script>

<style scoped>
.page-card {
  min-height: calc(100vh - 120px);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
}
.building-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.building-thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.building-no-img {
  width: 48px;
  height: 36px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.building-name-text {
  font-size: 12px;
  line-height: 1;
}

.countdown-body {
  text-align: center;
  padding: 8px 0;
}
.countdown-time {
  font-size: 48px;
  font-weight: 700;
  color: #6366f1;
  letter-spacing: 2px;
}
.countdown-label {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}
.countdown-tip {
  margin-top: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 14px;
  text-align: left;
}
.countdown-tip p {
  margin: 2px 0;
  font-size: 13px;
  color: #92400e;
}
.countdown-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
