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
          <span class="card-title">自习室管理</span>
          <div style="display: flex; gap: 8px">
            <el-button
              :loading="batchCalendarLoading"
              @click="handleInitNextMonthCalendar"
              >生成下月开放日历</el-button
            >
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              >新增自习室</el-button
            >
          </div>
        </div>
      </template>

      <!-- 筛选 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="楼栋">
          <el-input
            v-model="queryForm.building"
            placeholder="楼栋名称"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="自习室名称">
          <el-input
            v-model="queryForm.roomNo"
            placeholder="如 201"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="查询日期">
          <el-date-picker
            v-model="queryForm.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
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
        :data="roomList"
        border
        stripe
        style="margin-top: 16px"
      >
        <el-table-column prop="id" label="编号" width="70" align="center" />
        <el-table-column
          prop="building"
          label="楼栋"
          width="100"
          align="center"
        />
        <el-table-column
          prop="roomNo"
          label="自习室编号"
          width="100"
          align="center"
        />
        <el-table-column
          prop="capacity"
          label="座位数"
          width="100"
          align="center"
        />
        <el-table-column
          prop="openTime"
          label="开放时间"
          width="160"
          align="center"
        />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{
              row.status === "enabled" ? "启用" : "禁用"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="openSeatManageDialog(row)"
              >管理座位</el-button
            >
            <el-button type="primary" size="small" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => handleCommand(row, cmd)"
            >
              <el-button size="small" plain>
                更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="calendar"
                    >开放日历</el-dropdown-item
                  >
                  <el-dropdown-item command="reset">重置座位</el-dropdown-item>
                  <el-dropdown-item command="toggle">
                    {{ row.status === "enabled" ? "禁用" : "启用" }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete">
                    <span style="color: #f56c6c">删除</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 开放日历弹窗 -->
    <el-dialog
      v-model="calendarDialogVisible"
      title="开放日历配置"
      width="480px"
    >
      <el-form label-width="80px" style="margin-bottom: 8px">
        <el-form-item label="年月">
          <el-date-picker
            v-model="calendarYearMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="选择年月"
            @change="fetchCalendar"
          />
        </el-form-item>
      </el-form>
      <div style="display: flex; flex-wrap: wrap; gap: 6px">
        <el-checkbox
          v-for="day in calendarDays"
          :key="day"
          v-model="calendarChecked[day]"
          :label="day + '日'"
          border
          size="small"
        />
      </div>
      <template #footer>
        <el-button @click="calendarDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="calendarSaving"
          @click="saveCalendar"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <!-- 重置座位弹窗 -->
    <el-dialog v-model="resetDialogVisible" title="重置座位" width="400px">
      <el-form label-width="100px">
        <el-form-item label="新座位数">
          <el-input-number
            v-model="resetCapacity"
            :min="1"
            :max="500"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <span style="color: #e6a23c; font-size: 13px">
            ⚠️ 重置将删除所有旧座位并重新生成，不可恢复。
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="resetLoading"
          @click="confirmResetSeats"
          >确认重置</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="roomForm" label-width="100px">
        <el-form-item label="楼栋名称">
          <el-select
            v-model="roomForm.buildingId"
            placeholder="请选择楼栋"
            style="width: 100%"
          >
            <el-option
              v-for="b in buildingOptions"
              :key="b.id"
              :label="b.name"
              :value="b.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自习室编号">
          <el-input v-model="roomForm.roomNo" placeholder="如 201" />
        </el-form-item>
        <el-form-item label="座位容量">
          <el-input-number
            v-model="roomForm.capacity"
            :min="0"
            :max="500"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开放时间">
          <TimeRangePicker v-model="roomForm.openTime" />
        </el-form-item>

        <el-form-item label="当月开放" v-if="!isEdit">
          <el-switch
            v-model="roomForm.currentMonthOpen"
            active-text="全月开放"
            inactive-text="全月关闭"
          />
        </el-form-item>

        <!-- 编辑模式下显示座位管理功能 -->
        <template v-if="isEdit">
          <el-divider>座位管理</el-divider>
          <el-form-item label="当前座位数">
            <span style="font-weight: 600; color: #303133">{{
              currentCapacity
            }}</span>
            <el-button
              type="primary"
              size="small"
              style="margin-left: 12px"
              @click="handleAddSingleSeat"
              :loading="addSeatLoading"
            >
              + 添加座位
            </el-button>
          </el-form-item>

          <!-- 座位列表 -->
          <el-form-item label="座位列表">
            <div v-loading="seatsLoading" style="width: 100%">
              <div
                v-if="seatList.length === 0"
                style="color: #909399; font-size: 13px"
              >
                暂无座位数据
              </div>
              <div
                v-else
                style="
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  max-height: 300px;
                  overflow-y: auto;
                "
              >
                <div
                  v-for="seat in seatList"
                  :key="seat.id"
                  style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 13px;
                    border: 1px solid #e4e7ed;
                  "
                  :style="{
                    backgroundColor:
                      seat.status === '正常' ? '#f0f9eb' : '#fef0f0',
                    borderColor: seat.status === '正常' ? '#e1f3d8' : '#fde2e2',
                  }"
                >
                  <span
                    :style="{
                      color: seat.status === '正常' ? '#67c23a' : '#f56c6c',
                      fontWeight: 600,
                    }"
                  >
                    {{ seat.seatNo }}号
                  </span>
                  <el-tag
                    size="small"
                    :type="seat.status === '正常' ? 'success' : 'danger'"
                  >
                    {{ seat.status }}
                  </el-tag>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    @click="handleDeleteSingleSeat(seat.id, seat.seatNo)"
                    :loading="deletingSeatId === seat.id"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- 座位管理弹窗 -->
    <el-dialog
      ref="seatDialogRef"
      v-model="seatDialogVisible"
      :title="seatDialogTitle"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div v-if="seatLoading" class="seat-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载座位中...</span>
      </div>
      <template v-else-if="seatManageList.length > 0">
        <div class="seat-grid">
          <div
            v-for="seat in seatManageList"
            :key="seat.id"
            class="seat-cell"
            :class="{
              'seat-occupied': seat._occupied,
              'seat-disabled': !seat._occupied && seat.status !== '正常',
              'seat-available': !seat._occupied && seat.status === '正常',
            }"
          >
            <div class="seat-no">{{ seat.seatNo }}</div>
            <el-select
              v-model="seat.status"
              size="small"
              style="width: 88px"
              :disabled="seat._occupied"
              @change="(val: string) => handleSetSeatStatus(seat, val)"
            >
              <el-option label="正常" value="正常" />
              <el-option label="禁用" value="禁用" />
              <el-option label="维修中" value="维修中" />
            </el-select>
          </div>
        </div>
        <div class="seat-legend" style="margin-top: 12px">
          <span class="legend-item"
            ><span class="legend-dot available"></span>空闲</span
          >
          <span class="legend-item"
            ><span class="legend-dot occupied"></span>已占用</span
          >
          <span class="legend-item"
            ><span class="legend-dot disabled"></span>禁用/维修</span
          >
        </div>
      </template>
      <div v-else class="seat-empty">暂无可用座位数据</div>
      <template #footer>
        <el-button @click="seatDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  Plus,
  Search,
  Refresh,
  Loading,
  ArrowDown,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import TimeRangePicker from "@/components/TimeRangePicker.vue";

interface Building {
  id: number;
  name: string;
}

interface Room {
  id: number;
  buildingId: number;
  building: string;
  roomNo: string;
  capacity: number;
  openTime: string;
  status: string;
}

const buildingOptions = ref<Building[]>([]);

async function fetchBuildings() {
  try {
    const res = await axios.get("/api/building/list", {
      params: { pageNum: 1, pageSize: 1000 },
    });
    if (res.data.code === 200) {
      buildingOptions.value = res.data.data.records ?? res.data.data;
    }
  } catch {
    /* handled by interceptor */
  }
}

const roomList = ref<Room[]>([]);
const loading = ref(false);
const saveLoading = ref(false);
const batchCalendarLoading = ref(false);

const queryForm = reactive({
  building: "",
  roomNo: "",
  status: "",
  date: getTodayStr(),
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

const dialogVisible = ref(false);
const dialogTitle = ref("新增自习室");
const isEdit = ref(false);
const editId = ref<number | null>(null);
const currentCapacity = ref(0);
const seatsLoading = ref(false);
const addSeatLoading = ref(false);
const deletingSeatId = ref<number | null>(null);
const seatList = ref<Seat[]>([]);
const roomForm = reactive({
  buildingId: null as number | null,
  roomNo: "",
  capacity: 0,
  openTime: "07:00:00-22:30:00",
  status: "enabled",
  currentMonthOpen: true,
});

interface Seat {
  id: number;
  roomId: number;
  seatNo: number;
  status: string;
}

// 重置座位弹窗相关
const resetDialogVisible = ref(false);
const resetCapacity = ref(50);
const resetLoading = ref(false);
const resetTargetRoom = ref<Room | null>(null);

// 座位管理弹窗相关
const seatDialogRef = ref<HTMLElement | null>(null);
const seatDialogVisible = ref(false);
const seatDialogTitle = ref("");
const seatLoading = ref(false);
const seatManageList = ref<SeatManageItem[]>([]);
const seatManageRoom = ref<Room | null>(null);

interface SeatManageItem {
  id: number;
  roomId: number;
  seatNo: number;
  status: string;
  _occupied: boolean;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/room/list", {
      params: {
        building: queryForm.building,
        roomNo: queryForm.roomNo,
        status: queryForm.status,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
      },
    });
    if (res.data.code === 200) {
      const pageData = res.data.data;
      roomList.value = pageData.list ?? pageData.records ?? [];
      pagination.total = pageData.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

async function handleInitNextMonthCalendar() {
  try {
    await ElMessageBox.confirm(
      "将为所有启用自习室补齐下个月开放日历，默认周末不开放；已配置过的自习室不会被覆盖。是否继续？",
      "提示",
      { confirmButtonText: "确认", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }

  batchCalendarLoading.value = true;
  try {
    const res = await axios.post("/api/room/calendar/init-next-month");
    if (res.data.code === 200) {
      const count = res.data.data ?? 0;
      ElMessage.success(`已生成 ${count} 条下月开放日历`);
    }
  } catch {
    /* handled by interceptor */
  } finally {
    batchCalendarLoading.value = false;
  }
}

onMounted(() => {
  fetchBuildings();
  fetchList();
});

function handleSearch() {
  pagination.pageNum = 1;
  fetchList();
}

function handleReset() {
  queryForm.building = "";
  queryForm.roomNo = "";
  queryForm.status = "";
  pagination.pageNum = 1;
  fetchList();
}

function handleAdd() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "新增自习室";
  Object.assign(roomForm, {
    buildingId: null,
    roomNo: "",
    capacity: 0,
    openTime: "07:00:00-22:30:00",
    currentMonthOpen: true,
  });
  dialogVisible.value = true;
}

function handleEdit(row: Room) {
  isEdit.value = true;
  editId.value = row.id;
  currentCapacity.value = row.capacity ?? 0;
  dialogTitle.value = "编辑自习室";
  const matched = buildingOptions.value.find((b) => b.name === row.building);
  Object.assign(roomForm, {
    buildingId: matched?.id ?? row.buildingId ?? null,
    roomNo: row.roomNo,
    capacity: row.capacity,
    openTime: row.openTime,
    status: row.status,
  });
  dialogVisible.value = true;
  // 加载座位列表
  fetchSeats(row.id);
}

function handleCommand(row: Room, cmd: string) {
  switch (cmd) {
    case "calendar":
      openCalendarDialog(row);
      break;
    case "reset":
      handleResetSeats(row);
      break;
    case "toggle":
      handleToggleStatus(row);
      break;
    case "delete":
      handleDelete(row.id);
      break;
  }
}

async function handleSave() {
  if (!roomForm.buildingId) {
    ElMessage.warning("请选择楼栋");
    return;
  }
  if (!roomForm.roomNo.trim()) {
    ElMessage.warning("自习室编号不能为空");
    return;
  }
  saveLoading.value = true;
  try {
    let res;
    if (isEdit.value) {
      res = await axios.put("/api/room/update", {
        id: editId.value,
        buildingId: roomForm.buildingId,
        roomNo: roomForm.roomNo,
        openTime: roomForm.openTime,
      });
    } else {
      res = await axios.post("/api/room/add", {
        buildingId: roomForm.buildingId,
        roomNo: roomForm.roomNo,
        capacity: roomForm.capacity,
        openTime: roomForm.openTime,
        status: "enabled",
        currentMonthOpen: roomForm.currentMonthOpen,
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

async function handleToggleStatus(row: Room) {
  const action = row.status === "enabled" ? "禁用" : "启用";
  await ElMessageBox.confirm(
    `确认${action}自习室「${row.building}${row.roomNo}」吗？`,
    "提示",
    { confirmButtonText: "确认", cancelButtonText: "取消", type: "warning" },
  );
  try {
    const res = await axios.put(`/api/room/toggle-status/${row.id}`);
    if (res.data.code === 200) {
      ElMessage.success(`${action}成功`);
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm("确认删除该自习室吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    const res = await axios.delete(`/api/room/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

function handleResetSeats(row: Room) {
  resetTargetRoom.value = row;
  resetCapacity.value = row.capacity ?? 50;
  resetDialogVisible.value = true;
}

async function confirmResetSeats() {
  if (!resetTargetRoom.value) return;
  resetLoading.value = true;
  try {
    const res = await axios.post("/api/room/reset-seats", {
      id: resetTargetRoom.value.id,
      newCapacity: resetCapacity.value,
    });
    if (res.data.code === 200) {
      ElMessage.success("座位重置成功");
      resetDialogVisible.value = false;
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  } finally {
    resetLoading.value = false;
  }
}

async function fetchSeats(roomId: number) {
  seatsLoading.value = true;
  try {
    const res = await axios.get("/api/seat/list-by-room", {
      params: { roomId },
    });
    if (res.data.code === 200) {
      seatList.value = res.data.data ?? [];
    }
  } catch {
    /* handled by interceptor */
  } finally {
    seatsLoading.value = false;
  }
}

async function handleAddSingleSeat() {
  if (!editId.value) return;
  addSeatLoading.value = true;
  try {
    const nextSeatNo = currentCapacity.value + 1;
    const res = await axios.post("/api/seat/add", {
      roomId: editId.value,
      seatNo: nextSeatNo,
      status: "正常",
    });
    if (res.data.code === 200) {
      ElMessage.success("座位添加成功");
      currentCapacity.value++;
      await fetchSeats(editId.value);
    }
  } catch {
    /* handled by interceptor */
  } finally {
    addSeatLoading.value = false;
  }
}

async function handleDeleteSingleSeat(seatId: number, seatNo: number) {
  if (!editId.value) return;
  await ElMessageBox.confirm(`确认删除 ${seatNo}号座位吗？`, "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  deletingSeatId.value = seatId;
  try {
    const res = await axios.delete(`/api/seat/delete/${seatId}`);
    if (res.data.code === 200) {
      ElMessage.success("座位删除成功");
      currentCapacity.value--;
      await fetchSeats(editId.value);
    }
  } catch {
    /* handled by interceptor */
  } finally {
    deletingSeatId.value = null;
  }
}

// 打开座位管理弹窗
async function openSeatManageDialog(row: Room) {
  seatManageRoom.value = row;
  seatDialogTitle.value = `${row.building} ${row.roomNo} 自习室 - 座位管理`;
  seatDialogVisible.value = true;
  await fetchSeatManageList(row);
}

// 获取座位管理列表（带占用状态）
async function fetchSeatManageList(row: Room) {
  seatLoading.value = true;
  seatManageList.value = [];
  try {
    // 使用查询表单中的日期，如果为空则默认为今天
    const date = queryForm.date || getTodayStr();
    const [seatsRes, occupiedRes] = await Promise.all([
      axios.get("/api/seat/list-by-room", { params: { roomId: row.id } }),
      axios.get("/api/seat/occupied", {
        params: {
          roomId: row.id,
          date,
          startTime: "00:00",
          endTime: "23:59",
        },
      }),
    ]);
    const seats: {
      id: number;
      roomId: number;
      seatNo: number;
      status: string;
    }[] = seatsRes.data.code === 200 ? seatsRes.data.data : [];
    const occupiedSeatNos: number[] =
      occupiedRes.data.code === 200 ? occupiedRes.data.data : [];
    const occupiedSet = new Set(occupiedSeatNos);

    seatManageList.value = seats.map((s) => ({
      ...s,
      _occupied: occupiedSet.has(s.seatNo),
    }));
  } catch {
    /* handled by interceptor */
  } finally {
    seatLoading.value = false;
  }
}

// 修改座位状态
async function handleSetSeatStatus(seat: SeatManageItem, newStatus: string) {
  const oldStatus = seat.status;
  try {
    const res = await axios.put(`/api/seat/set-status/${seat.id}`, null, {
      params: { status: newStatus },
    });
    if (res.data.code === 200) {
      ElMessage.success(`座位 ${seat.seatNo} 状态已设为「${newStatus}」`);
      if (seatManageRoom.value) {
        await fetchSeatManageList(seatManageRoom.value);
      }
    } else {
      seat.status = oldStatus;
    }
  } catch {
    seat.status = oldStatus;
    /* handled by interceptor */
  }
}

// 控制下拉框打开时禁用表格滚动
function handleSelectVisibleChange(visible: boolean) {
  // 当下拉框打开时，禁用 body 滚动，防止下拉框选项跟着滚动
  if (visible) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

function seatRowClassName({ row }: { row: SeatManageItem }): string {
  if (row.status !== "正常") return "seat-row-disabled";
  if (row._occupied) return "seat-row-occupied";
  return "";
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- 开放日历 ----
const calendarDialogVisible = ref(false);
const calendarRoomId = ref<number>(0);
const calendarYearMonth = ref<string>("");
const calendarDays = ref<number[]>([]);
const calendarChecked = ref<Record<number, boolean>>({});
const calendarSaving = ref(false);

function openCalendarDialog(row: Room) {
  calendarRoomId.value = row.id;
  const now = new Date();
  calendarYearMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  calendarDialogVisible.value = true;
  fetchCalendar();
}

async function fetchCalendar() {
  if (!calendarYearMonth.value) return;
  const parts = calendarYearMonth.value.split("-").map(Number);
  const [year, month] = [parts[0]!, parts[1]!];
  const daysInMonth = new Date(year, month, 0).getDate();
  calendarDays.value = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // 初始化全部未选
  const checked: Record<number, boolean> = {};
  calendarDays.value.forEach((d) => (checked[d] = false));
  try {
    const res = await axios.get("/api/room/calendar", {
      params: { roomId: calendarRoomId.value, year, month },
    });
    if (res.data.code === 200 && res.data.data?.openDays) {
      const bits: string = res.data.data.openDays;
      calendarDays.value.forEach((d) => {
        checked[d] = bits[d - 1] === "1";
      });
    }
  } catch {
    /* 未配置时忽略 */
  }
  calendarChecked.value = checked;
}

async function saveCalendar() {
  const parts2 = calendarYearMonth.value.split("-").map(Number);
  const [year, month] = [parts2[0]!, parts2[1]!];
  const daysInMonth = new Date(year, month, 0).getDate();
  let openDays = "";
  for (let i = 1; i <= 31; i++) {
    if (i <= daysInMonth) openDays += calendarChecked.value[i] ? "1" : "0";
    else openDays += "0";
  }
  calendarSaving.value = true;
  try {
    const res = await axios.post("/api/room/calendar", {
      roomId: calendarRoomId.value,
      year,
      month,
      openDays,
    });
    if (res.data.code === 200) {
      ElMessage.success("保存成功");
      calendarDialogVisible.value = false;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    calendarSaving.value = false;
  }
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

/* 座位管理弹窗样式 */
.seat-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
  color: #909399;
  font-size: 13px;
}
.seat-empty {
  text-align: center;
  padding: 16px 0;
  color: #c0c4cc;
  font-size: 13px;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}
.seat-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
  padding: 4px 2px;
}
.seat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1.5px solid #e4e7ed;
  width: 100px;
}
.seat-cell.seat-available {
  background: #f0fdf4;
  border-color: #67c23a;
}
.seat-cell.seat-occupied {
  background: #fff0f0;
  border-color: #f56c6c;
}
.seat-cell.seat-disabled {
  background: #f5f5f5;
  border-color: #c0c4cc;
}
.seat-no {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.seat-legend {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #606266;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.legend-dot.available {
  background: #67c23a;
}
.legend-dot.occupied {
  background: #f56c6c;
}
.legend-dot.disabled {
  background: #c0c4cc;
}
:deep(.seat-row-disabled) {
  background-color: #f5f5f5 !important;
  color: #c0c4cc;
}
:deep(.seat-row-occupied) {
  background-color: #fef0f0 !important;
}
:deep(.el-select__popper) {
  overscroll-behavior: contain;
}
</style>
