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
          <span class="card-title">座位管理</span>
          <div style="display: flex; gap: 8px">
            <el-button
              type="warning"
              plain
              :disabled="selectedIds.length === 0"
              @click="handleBatchDisable"
              >批量禁用</el-button
            >
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              >新增座位</el-button
            >
          </div>
        </div>
      </template>

      <el-form :model="queryForm" inline>
        <el-form-item label="自习室">
          <el-select
            v-model="queryForm.roomId"
            placeholder="全部"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="r in roomOptions"
              :key="r.id"
              :label="(r.building ? r.building + ' ' : '') + r.roomNo"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" value="正常" />
            <el-option label="禁用" value="禁用" />
            <el-option label="维修中" value="维修中" />
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
        :data="seatList"
        border
        stripe
        style="margin-top: 16px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column
          prop="seatNo"
          label="座位编号"
          width="120"
          align="center"
        />
        <el-table-column
          prop="roomId"
          label="自习室"
          width="160"
          align="center"
        >
          <template #default="{ row }">
            {{ getRoomLabel(row.roomId) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="seatStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => handleSetStatus(row.id, cmd)"
            >
              <el-button size="small" plain>
                设置状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="正常"
                    :disabled="row.status === '正常'"
                    >正常</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="禁用"
                    :disabled="row.status === '禁用'"
                    >禁用</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="维修中"
                    :disabled="row.status === '维修中'"
                    >维修中</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="440px">
      <el-form :model="seatForm" label-width="90px">
        <el-form-item label="所属自习室">
          <el-select
            v-model="seatForm.roomId"
            style="width: 100%"
            placeholder="请选择自习室"
          >
            <el-option
              v-for="r in roomOptions"
              :key="r.id"
              :label="(r.building ? r.building + ' ' : '') + r.roomNo"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="座位编号">
          <el-input-number
            v-model="seatForm.seatNo"
            :min="1"
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="seatForm.status" style="width: 100%">
            <el-option label="正常" value="正常" />
            <el-option label="禁用" value="禁用" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave"
          >确认</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Plus, Search, Refresh, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";

interface Room {
  id: number;
  building: string;
  roomNo: string;
}

interface Seat {
  id: number;
  roomId: number;
  seatNo: number;
  status: string;
  isDeleted?: number;
  createTime?: string;
  updateTime?: string;
}

const roomOptions = ref<Room[]>([]);
const seatList = ref<Seat[]>([]);
const loading = ref(false);
const saveLoading = ref(false);
const selectedIds = ref<number[]>([]);

const queryForm = reactive({ roomId: null as number | null, status: "" });
const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const dialogVisible = ref(false);
const dialogTitle = ref("新增座位");
const isEdit = ref(false);
const editId = ref<number | null>(null);
const seatForm = reactive({
  roomId: null as number | null,
  seatNo: 1,
  status: "正常",
});

function getRoomLabel(roomId: number): string {
  const r = roomOptions.value.find((o) => o.id === roomId);
  if (!r) return String(roomId);
  return (r.building ? r.building + " " : "") + r.roomNo;
}

function seatStatusType(
  status: string
): "success" | "danger" | "warning" | "info" {
  if (status === "正常") return "success";
  if (status === "禁用") return "danger";
  if (status === "维修中") return "warning";
  return "info";
}

async function fetchRooms() {
  try {
    const res = await axios.get("/api/room/list", {
      params: { pageNum: 1, pageSize: 1000 },
    });
    if (res.data.code === 200) {
      roomOptions.value = res.data.data.records ?? res.data.data;
    }
  } catch {
    /* handled by interceptor */
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/seat/list", {
      params: {
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        roomId: queryForm.roomId ?? undefined,
        status: queryForm.status,
      },
    });
    if (res.data.code === 200) {
      const page = res.data.data;
      seatList.value = page.records ?? page;
      pagination.total = page.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchRooms();
  fetchList();
});

function handleSearch() {
  pagination.pageNum = 1;
  fetchList();
}

function handleReset() {
  queryForm.roomId = null;
  queryForm.status = "";
  pagination.pageNum = 1;
  fetchList();
}

function handleAdd() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "新增座位";
  Object.assign(seatForm, { roomId: null, seatNo: 1, status: "正常" });
  dialogVisible.value = true;
}

function handleEdit(row: Seat) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = "编辑座位";
  Object.assign(seatForm, {
    roomId: row.roomId,
    seatNo: row.seatNo,
    status: row.status,
  });
  dialogVisible.value = true;
}

async function handleSave() {
  if (!seatForm.roomId) {
    ElMessage.warning("请选择自习室");
    return;
  }
  saveLoading.value = true;
  try {
    let res;
    if (isEdit.value) {
      res = await axios.put("/api/seat/update", {
        id: editId.value,
        roomId: seatForm.roomId,
        seatNo: seatForm.seatNo,
        status: seatForm.status,
      });
    } else {
      res = await axios.post("/api/seat/add", {
        roomId: seatForm.roomId,
        seatNo: seatForm.seatNo,
        status: seatForm.status,
      });
    }
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? "更新成功" : "新增成功");
      dialogVisible.value = false;
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  } finally {
    saveLoading.value = false;
  }
}

async function handleSetStatus(id: number, status: string) {
  try {
    const res = await axios.put(`/api/seat/set-status/${id}`, null, {
      params: { status },
    });
    if (res.data.code === 200) {
      ElMessage.success("状态设置成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm("确认删除该座位吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    const res = await axios.delete(`/api/seat/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

async function handleBatchDisable() {
  await ElMessageBox.confirm(
    `确认批量禁用已选 ${selectedIds.value.length} 个座位吗？`,
    "提示",
    { confirmButtonText: "确认", cancelButtonText: "取消", type: "warning" }
  );
  try {
    const res = await axios.put("/api/seat/batch-disable", selectedIds.value);
    if (res.data.code === 200) {
      ElMessage.success("批量禁用成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

function handleSelectionChange(val: Seat[]) {
  selectedIds.value = val.map((s) => s.id);
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
</style>
