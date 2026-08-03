<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span class="card-title">预约管理</span>
        </div>
      </template>

      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.userName"
            placeholder="请输入用户名"
            clearable
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="状态">
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
        <el-table-column
          prop="id"
          label="预约编号"
          width="100"
          align="center"
        />
        <el-table-column
          prop="userName"
          label="用户名"
          width="120"
          align="center"
        />
        <el-table-column
          prop="roomNo"
          label="自习室编号"
          width="100"
          align="center"
        />
        <el-table-column label="座位" width="90" align="center">
          <template #default="{ row }">
            {{ row.seatNo != null ? row.seatNo + '号' : '-' }}
          </template>
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
        <el-table-column prop="status" label="状态" width="110" align="center">
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
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="warning"
              size="small"
              plain
              :disabled="row.status !== 'pending'"
              @click="handleCancel(row)"
              >取消预约</el-button
            >
            <el-button
              type="danger"
              size="small"
              plain
              @click="openDeleteDialog(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="deleteDialogVisible" title="删除预约" width="460px">
      <div style="margin-bottom: 12px">
        <span
          >用户：<b>{{ deleteTarget?.userName }}</b
          >，自习室：<b>{{ deleteTarget?.roomNo }}</b></span
        ><br />
        <span
          >时段：{{ deleteTarget?.reserveDate }}
          {{ deleteTarget?.startTime }}~{{ deleteTarget?.endTime }}</span
        >
      </div>
      <el-form-item label="删除原因">
        <el-input
          v-model="deleteReason"
          type="textarea"
          :rows="3"
          placeholder="可选填，将通过站内信通知用户"
        />
      </el-form-item>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";

interface Reservation {
  id: number;
  userId: number;
  userName: string;
  avatar?: string;
  roomId: number;
  roomNo: string;
  buildingName?: string;
  seatId?: number;
  seatNo?: number;
  reserveDate: string;
  startTime: string;
  endTime: string;
  status: string;
  checkinTime: string;
  createTime: string;
}

const reservationList = ref<Reservation[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const deleteDialogVisible = ref(false);
const deleteTarget = ref<Reservation | null>(null);
const deleteReason = ref("");

const queryForm = reactive({
  userName: "",
  dateRange: null as [string, string] | null,
  status: "",
});

async function fetchList() {
  loading.value = true;
  try {
    const [startDate, endDate] = queryForm.dateRange ?? ["", ""];
    const res = await axios.get("/api/reservation/admin/page", {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        userName: queryForm.userName,
        status: queryForm.status,
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      },
    });
    if (res.data.code === 200) {
      reservationList.value = res.data.data.list ?? res.data.data.records ?? [];
      total.value = res.data.data.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchList());

function handleSearch() {
  pageNum.value = 1;
  fetchList();
}

function handleReset() {
  queryForm.userName = "";
  queryForm.dateRange = null;
  queryForm.status = "";
  pageNum.value = 1;
  fetchList();
}

function handleSizeChange(val: number) {
  pageSize.value = val;
  pageNum.value = 1;
  fetchList();
}

async function handleCancel(row: Reservation) {
  try {
    await ElMessageBox.confirm(
      `确认取消用户「${row.userName}」的预约（${row.reserveDate} ${row.startTime}~${row.endTime}）吗？`,
      "提示",
      { confirmButtonText: "确认", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }

  try {
    const res = await axios.put(`/api/reservation/admin/cancel/${row.id}`);
    if (res.data.code === 200) {
      ElMessage.success("取消成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

function openDeleteDialog(row: Reservation) {
  deleteTarget.value = row;
  deleteReason.value = "";
  deleteDialogVisible.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  try {
    const res = await axios.delete(
      `/api/reservation/admin/delete/${deleteTarget.value.id}`,
      { params: { reason: deleteReason.value || undefined } },
    );
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      deleteDialogVisible.value = false;
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
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
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
