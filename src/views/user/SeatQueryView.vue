<template>
  <div class="page-wrapper">
    <div class="page-card">
      <!-- 搜索筛选 -->
      <div class="filter-section">
        <el-form :model="queryForm" inline class="query-form">
          <el-form-item label="楼栋">
            <el-input
              v-model="queryForm.building"
              placeholder="楼栋名称"
              clearable
              class="filter-input"
            />
          </el-form-item>
          <el-form-item label="自习室编号">
            <el-input
              v-model="queryForm.roomNo"
              placeholder="自习室编号"
              clearable
              class="filter-input"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="queryForm.status"
              placeholder="全部"
              clearable
              class="filter-select"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="已禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="查询日期">
            <el-date-picker
              v-model="queryForm.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              class="filter-date"
              :disabled-date="disabledQueryDate"
              @change="onDateOrSlotChange"
            />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-time-select
              v-model="queryForm.startTime"
              placeholder="开始时间"
              start="07:00"
              step="00:30"
              end="22:00"
              format="HH:mm"
              clearable
              class="filter-time"
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-time-select
              v-model="queryForm.endTime"
              placeholder="结束时间"
              start="07:30"
              step="00:30"
              end="22:00"
              :min-time="queryForm.startTime"
              format="HH:mm"
              clearable
              class="filter-time"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="btn-search" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button type="success" @click="quickBookDialogVisible = true">
              <el-icon><Ticket /></el-icon>
              一键预约
            </el-button>
            <el-button class="btn-reset" @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="roomList"
          class="custom-table"
          :header-cell-style="{
            background: '#F5F2EE',
            color: '#5D4E37',
            fontWeight: '600',
          }"
        >
          <el-table-column label="楼栋图片" width="160" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.buildingImage"
                :src="row.buildingImage"
                :preview-src-list="[row.buildingImage]"
                fit="cover"
                class="building-image"
                preview-teleported
              />
              <span v-else class="no-image">暂无图片</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="building"
            label="楼栋"
            min-width="100"
            align="center"
          />
          <el-table-column
            prop="roomNo"
            label="自习室编号"
            min-width="110"
            align="center"
          />
          <el-table-column label="座位总数" width="100" align="center">
            <template #default="{ row }">
              <span class="capacity-badge">{{ row.capacity }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="openTime"
            label="开放时间"
            width="130"
            align="center"
          />
          <el-table-column label="开放日期" width="100" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                type="info"
                plain
                @click="openCalendarDialog(row)"
                >查看</el-button
              >
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'enabled'"
                type="primary"
                size="small"
                @click="openReserveDialog(row)"
              >
                预约座位
              </el-button>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <span
                class="status-dot"
                :class="row.status === 'enabled' ? 'open' : 'closed'"
                :title="row.status === 'enabled' ? '启用' : '禁用'"
              ></span>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="!loading && roomList.length === 0"
          description="暂无自习室数据"
        />

        <!-- 分页 -->
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[5, 10, 20]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <!-- 座位预约弹窗 -->
      <el-dialog
        v-model="reserveDialogVisible"
        :title="reserveDialogTitle"
        width="580px"
        :close-on-click-modal="false"
        class="reserve-dialog"
        @close="handleReserveDialogClose"
      >
        <div v-if="reserveLoading" class="seat-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载座位数据中...</span>
        </div>
        <template v-else>
          <!-- 座位平面图 -->
          <div class="seat-grid-section">
            <div class="section-title-row">
              <span class="section-title">请选择座位</span>
              <el-button
                v-if="reserveSelectedSeatNo"
                link
                type="danger"
                size="small"
                @click="clearSeatSelection"
                >清空选择</el-button
              >
            </div>
            <div v-if="reserveSeatLoading" class="seat-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载座位中...</span>
            </div>
            <div
              v-else-if="reserveDialogSeatList.length === 0"
              class="seat-empty"
            >
              暂无可用座位
            </div>
            <div v-else class="dialog-seat-grid">
              <div
                v-for="seat in reserveDialogSeatList"
                :key="seat.id"
                class="seat-item"
                :class="{
                  available: seat._available,
                  occupied: seat._occupied,
                  disabled: seat.status !== '正常',
                  selected: reserveSelectedSeatNo === seat.seatNo,
                }"
                @click="seat._available && selectReserveSeat(seat)"
              >
                <span class="seat-no">{{ seat.seatNo }}</span>
                <span class="seat-status">
                  {{
                    seat.status !== "正常"
                      ? seat.status
                      : seat._occupied
                        ? "已占"
                        : "可选"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- 时间段选择区域（选择座位后显示，仅预约模式） -->
          <div v-if="reserveSelectedSeatNo" class="time-slot-section">
            <div class="time-header">
              <span class="section-title"
                >已选 {{ reserveSelectedSeatNo }}号座位 - 请选择预约时间</span
              >
              <div class="quick-select-btns">
                <el-button
                  size="small"
                  @click="reserveSelectTimeRange('morning')"
                  >上午</el-button
                >
                <el-button
                  size="small"
                  @click="reserveSelectTimeRange('afternoon')"
                  >下午</el-button
                >
                <el-button
                  size="small"
                  @click="reserveSelectTimeRange('evening')"
                  >晚上</el-button
                >
                <el-button size="small" text @click="clearReserveTimeSlots">
                  <el-icon><RefreshRight /></el-icon>清空
                </el-button>
              </div>
            </div>
            <div class="time-slot-grid">
              <button
                v-for="(slot, index) in reserveTimeSlots"
                :key="slot.value"
                type="button"
                class="time-slot-btn"
                :class="{
                  available: slot.available,
                  selected: slot.selected,
                  unavailable: !slot.available,
                }"
                :disabled="!slot.available"
                @click="handleReserveClick(index, slot)"
              >
                {{ slot.label }}
              </button>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="dialog-action">
            <span v-if="reserveSelectedSeatNo" class="selected-text">
              已选：<strong>{{ reserveSelectedSeatNo }}号</strong>
              <span
                v-if="reserveSelectedSlots.length > 0"
                class="selected-time"
              >
                ({{ formatSelectedTimeRange() }})
              </span>
            </span>
            <el-button @click="reserveDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="reserveSubmitLoading"
              :disabled="
                !reserveSelectedSeatNo || reserveSelectedSlots.length === 0
              "
              @click="handleReserveSubmit"
            >
              确认预约
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 一键预约弹窗 -->
      <el-dialog
        v-model="quickBookDialogVisible"
        title="一键预约"
        width="600px"
      >
        <div v-if="favoriteRooms.length === 0" class="quick-empty">
          <el-empty
            description="暂无历史预约记录，请先预约自习室积累偏好数据"
          />
        </div>
        <div v-else>
          <el-form label-width="80px">
            <el-form-item label="预约日期">
              <el-date-picker
                v-model="quickBookDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                :disabled-date="disabledQueryDate"
                style="width: 100%"
                @change="handleQuickBookDateChange"
              />
            </el-form-item>
          </el-form>

          <div class="quick-book-section">
            <div class="section-title">常去自习室</div>
            <div class="quick-cards">
              <div
                v-for="room in favoriteRooms"
                :key="'room-' + room.roomId"
                class="quick-card"
                :class="{
                  selected:
                    quickBookSelectedRoom &&
                    (quickBookSelectedRoom as any).roomId === room.roomId,
                }"
                @click="selectQuickBook(room)"
              >
                <div class="quick-card-building">{{ room.buildingName }}</div>
                <div class="quick-card-room">{{ room.roomNo }}自习室</div>
                <div class="quick-card-count">
                  预约{{ room.reservationCount }}次
                </div>
              </div>
            </div>
          </div>

          <div v-if="quickBookSelectedRoom" class="quick-book-section">
            <div class="section-title-row">
              <span class="section-title">选择座位</span>
              <el-button
                v-if="quickBookSelectedSeatNo"
                link
                type="danger"
                size="small"
                @click="clearQuickBookSeatSelection"
                >清空选择</el-button
              >
            </div>
            <div v-if="quickBookSeatLoading" class="seat-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载座位中...</span>
            </div>
            <div v-else-if="quickBookSeatList.length === 0" class="seat-empty">
              暂无可用座位
            </div>
            <div v-else class="dialog-seat-grid">
              <div
                v-for="seat in quickBookSeatList"
                :key="seat.id"
                class="seat-item"
                :class="{
                  available: seat._available,
                  occupied: seat._occupied,
                  disabled: seat.status !== '正常',
                  selected: quickBookSelectedSeatNo === seat.seatNo,
                }"
                @click="seat._available && selectQuickBookSeat(seat)"
              >
                <span class="seat-no">{{ seat.seatNo }}</span>
                <span class="seat-status">
                  {{
                    seat.status !== "正常"
                      ? seat.status
                      : seat._occupied
                        ? "已占"
                        : "可选"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- 时间段选择（30分钟粒度） -->
          <div class="quick-time-section">
            <div class="time-header">
              <span class="section-title">选择时间段</span>
              <div class="quick-select-btns">
                <el-button size="small" @click="quickSelectTimeRange('morning')"
                  >上午</el-button
                >
                <el-button
                  size="small"
                  @click="quickSelectTimeRange('afternoon')"
                  >下午</el-button
                >
                <el-button size="small" @click="quickSelectTimeRange('evening')"
                  >晚上</el-button
                >
                <el-button size="small" text @click="resetQuickBookTimeSlots">
                  <el-icon><RefreshRight /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
            <div class="time-slot-grid">
              <button
                v-for="(slot, index) in quickBookTimeSlots"
                :key="slot.value"
                type="button"
                class="time-slot-btn"
                :class="{
                  available: slot.available,
                  selected: slot.selected,
                  unavailable: !slot.available,
                }"
                :disabled="!slot.available"
                @click="handleQuickClick(index, slot)"
              >
                {{ slot.label }}
              </button>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-action">
            <span
              v-if="
                quickBookSelectedSlots.length > 0 || quickBookSelectedSeatNo
              "
              class="selected-text"
            >
              <template v-if="quickBookSelectedSeatNo">
                已选：<strong>{{ quickBookSelectedSeatNo }}号座位</strong>
              </template>
              <span
                v-if="quickBookSelectedSlots.length > 0"
                class="selected-time"
              >
                {{ quickBookSelectedSeatNo ? "，" : "已选："
                }}<strong>{{ formatQuickBookTimeRange() }}</strong>
              </span>
            </span>
          </div>
          <el-button @click="quickBookDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="quickBookLoading"
            :disabled="
              !quickBookSelectedRoom ||
              !quickBookSelectedSeatNo ||
              quickBookSelectedSlots.length === 0
            "
            @click="submitQuickBook"
          >
            确认预约
          </el-button>
        </template>
      </el-dialog>

      <!-- 开放日期挂历弹窗 -->
      <el-dialog
        v-model="calendarDialogVisible"
        :title="calendarDialogTitle"
        width="380px"
      >
        <div class="calendar-wrap">
          <div class="calendar-header">
            <span
              v-for="d in ['日', '一', '二', '三', '四', '五', '六']"
              :key="d"
              class="cal-week"
              >{{ d }}</span
            >
          </div>
          <div class="calendar-body">
            <span
              v-for="cell in calendarCells"
              :key="cell.key"
              class="cal-cell"
              :class="{
                open: cell.open,
                closed: cell.day && !cell.open,
                empty: !cell.day,
                today: cell.isToday,
              }"
              >{{ cell.day || "" }}</span
            >
          </div>
          <div class="calendar-legend">
            <span class="legend-open">■ 开放</span>
            <span class="legend-closed">■ 未开放</span>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Refresh,
  Loading,
  Ticket,
  RefreshRight,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { get, post, getPage } from "@/utils/api";

const router = useRouter();

interface Room {
  id: number;
  buildingId?: number;
  building: string;
  buildingImage?: string;
  roomNo: string;
  capacity: number;
  openTime: string;
  status: string;
}

interface TimeSlotOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

interface TimePointOption {
  label: string;
  value: string;
}

interface SeatItem {
  id: number;
  roomId: number;
  seatNo: number;
  status: string;
  _occupied: boolean;
  _available: boolean;
}

interface FavoriteRoom {
  roomId: number;
  roomNo: string;
  buildingName: string;
  reservationCount: number;
  openTime?: string;
}

const favoriteRooms = ref<FavoriteRoom[]>([]);
const favoritesLoaded = ref(false);

const roomList = ref<Room[]>([]);
const loading = ref(false);

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const queryForm = reactive({
  building: "",
  roomNo: "",
  status: "",
  date: getTodayStr(),
  startTime: "",
  endTime: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
});

// 座位预约弹窗状态
interface ReserveTimeSlot {
  label: string;
  value: string;
  start: string;
  end: string;
  available: boolean;
  selected: boolean;
}

const reserveDialogVisible = ref(false);
const reserveDialogTitle = ref("");
const reserveLoading = ref(false);
const reserveSubmitLoading = ref(false);
const reserveDialogSeatList = ref<SeatItem[]>([]);
const reserveSelectedSeatNo = ref<number | null>(null);
const reserveSeatLoading = ref(false);
const reserveCurrentRoom = ref<Room | null>(null);
const reserveTimeSlots = ref<ReserveTimeSlot[]>([]);
const reserveSelectedSlots = ref<ReserveTimeSlot[]>([]);

const quickBookDialogVisible = ref(false);
const quickBookLoading = ref(false);
const quickBookDate = ref(getTodayStr());
const quickBookSelectedRoom = ref<FavoriteRoom | null>(null);
const quickBookTimeSlots = ref<QuickBookTimeSlot[]>([]);
const quickBookSelectedSlots = ref<QuickBookTimeSlot[]>([]);
const quickBookSeatList = ref<SeatItem[]>([]);
const quickBookSelectedSeatNo = ref<number | null>(null);
const quickBookSeatLoading = ref(false);

// 点击连续选中状态（预约弹窗）
const clickSelectionMode = ref(false);
const clickStartIndex = ref(-1);

// 点击连续选中状态（一键预约弹窗）
const quickClickSelectionMode = ref(false);
const quickClickStartIndex = ref(-1);

interface QuickBookTimeSlot {
  label: string;
  value: string;
  start: string;
  end: string;
  available: boolean;
  selected: boolean;
}

// 默认开放时间（用于动态生成小时时段）
const DEFAULT_OPEN_TIME = "07:00";
const DEFAULT_CLOSE_TIME = "22:00";
const FULL_DAY_CLOSE_TIME = "23:59";
const FULL_DAY_DISPLAY_END_TIME = "24:00";

function normalizeTimeText(time: string | undefined, fallback: string): string {
  if (!time) return fallback;

  const parts = time.trim().split(":");
  const hour = Number.parseInt(parts[0] ?? "", 10);
  const minute = Number.parseInt(parts[1] ?? "", 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return fallback;
  }
  if (hour >= 24 || (hour === 23 && minute >= 59)) {
    return FULL_DAY_CLOSE_TIME;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function resolveRoomOpenRange(openTime?: string) {
  const [startPart, endPart] = (openTime ?? "").split("-");
  return {
    start: normalizeTimeText(startPart, DEFAULT_OPEN_TIME),
    end: normalizeTimeText(endPart, DEFAULT_CLOSE_TIME),
  };
}

function formatSlotRangeText(slots: Array<{ label: string }>): string {
  if (slots.length === 0) return "";

  const first = slots[0]!.label.split("-")[0];
  const last = slots[slots.length - 1]!.label.split("-")[1];
  return `${first} - ${last ?? ""}`;
}

function timeToComparableMinutes(time: string): number {
  const normalized = normalizeTimeText(time, "00:00");
  if (normalized === FULL_DAY_CLOSE_TIME) {
    return 24 * 60;
  }

  const [hour, minute] = normalized
    .split(":")
    .map((part) => parseInt(part, 10));
  return hour * 60 + minute;
}

function generateTimePointOptions(
  openTime: string = DEFAULT_OPEN_TIME,
  closeTime: string = DEFAULT_CLOSE_TIME,
): TimePointOption[] {
  const slots = generate30MinSlots(openTime, closeTime);
  if (slots.length === 0) {
    return [];
  }

  const points: TimePointOption[] = [
    {
      label: slots[0]!.label.split("-")[0] ?? openTime,
      value: slots[0]!.start.slice(0, 5),
    },
  ];

  slots.forEach((slot) => {
    const endLabel = slot.label.split("-")[1] ?? slot.end.slice(0, 5);
    points.push({
      label: endLabel,
      value: slot.end.slice(0, 5),
    });
  });

  return points;
}

/**
 * 根据开放时间动态生成小时时段
 * 根据开放时间动态生成小时时段
 * @param openTime 自习室开放时间，如 "07:00"
 * @param closeTime 自习室关闭时间，如 "22:00"
 * @returns 时段选项数组
 */
/**
 * 生成30分钟时段列表（用于列表查询显示）
 * @param openTime 开放时间
 * @param closeTime 关闭时间
 */
function generate30MinSlotOptions(
  openTime: string = DEFAULT_OPEN_TIME,
  closeTime: string = DEFAULT_CLOSE_TIME,
): TimeSlotOption[] {
  const slots: TimeSlotOption[] = [];
  const openHour = parseInt(openTime.split(":")[0]);
  const openMin = parseInt(openTime.split(":")[1] || "0");
  const closeHour = parseInt(closeTime.split(":")[0]);
  const closeMin = parseInt(closeTime.split(":")[1] || "0");

  let currentSlotHour = openHour;
  let currentSlotMin = openMin;

  while (
    currentSlotHour < closeHour ||
    (currentSlotHour === closeHour && currentSlotMin < closeMin)
  ) {
    const startHour = currentSlotHour.toString().padStart(2, "0");
    const startMinStr = currentSlotMin.toString().padStart(2, "0");

    let endHour = currentSlotHour;
    let endMin = currentSlotMin + 30;
    if (endMin >= 60) {
      endMin = 0;
      endHour += 1;
    }

    if (endHour > closeHour || (endHour === closeHour && endMin > closeMin)) {
      endHour = closeHour;
      endMin = closeMin;
    }

    const endHourStr = endHour.toString().padStart(2, "0");
    const endMinStr = endMin.toString().padStart(2, "0");

    const start = `${startHour}:${startMinStr}`;
    const end = `${endHourStr}:${endMinStr}`;

    let periodLabel = "";
    const hour = currentSlotHour;
    if (hour >= 7 && hour < 12) periodLabel = "上午 ";
    else if (hour >= 12 && hour < 18) periodLabel = "下午 ";
    else periodLabel = "晚上 ";

    slots.push({
      label: `${periodLabel}${start}-${end}`,
      value: `${start}-${end}`,
      start,
      end,
    });

    currentSlotHour = endHour;
    currentSlotMin = endMin;
  }

  return slots;
}

const displayTimeSlots = generate30MinSlotOptions();

function disabledQueryDate(time: Date) {
  return time.getTime() < Date.now() - 86400000;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await get<any>("/room/list", {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      building: queryForm.building,
      roomNo: queryForm.roomNo,
      status: queryForm.status,
      startTime: queryForm.startTime,
      endTime: queryForm.endTime,
    });
    if (res) {
      const pageData = res as any;
      roomList.value = pageData.records ?? pageData.list ?? [];
      pagination.total = pageData.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchList();
});

// 一键预约弹窗打开时初始化数据
watch(quickBookDialogVisible, (val) => {
  if (val) {
    if (!favoritesLoaded.value) {
      fetchUserFavorites();
    }
    if (quickBookSelectedRoom.value) {
      quickBookSelectedSeatNo.value = null;
      quickBookSelectedSlots.value = [];
      initQuickBookTimeSlots();
      fetchQuickBookSeatList(quickBookSelectedRoom.value.roomId);
    }
  }
});

async function fetchUserFavorites() {
  try {
    const roomsRes = await get<any>("/statistics/user/favorite-rooms", {
      limit: 3,
    });
    if (roomsRes) {
      favoriteRooms.value = (roomsRes as any) ?? [];
    }
    favoritesLoaded.value = true;

    if (favoriteRooms.value && favoriteRooms.value.length > 0) {
      const sortedRooms = [...favoriteRooms.value].sort(
        (a, b) => b.reservationCount - a.reservationCount,
      );
      quickBookSelectedRoom.value = sortedRooms[0];
    }
  } catch {
    // 静默失败，不影响主流程
  }
}

function selectQuickBook(item: FavoriteRoom) {
  quickBookSelectedRoom.value = item;
  quickBookSelectedSeatNo.value = null;
  quickBookSelectedSlots.value = [];
  quickBookTimeSlots.value = [];
  quickBookSeatList.value = [];
  initQuickBookTimeSlots();
  fetchQuickBookSeatList(item.roomId);
}

async function fetchSeatsWithOccupied(
  roomId: number,
  date: string,
  startTime: string,
  endTime: string,
): Promise<SeatItem[]> {
  const [seatsRes, occupiedRes] = await Promise.all([
    get<any>("/seat/list-by-room", { roomId }),
    get<any>("/seat/occupied", { roomId, date, startTime, endTime }),
  ]);
  const seats: SeatItem[] = seatsRes ?? [];
  const occupiedSet = new Set<number>(occupiedRes ?? []);
  return seats.map((s) => ({
    ...s,
    _occupied: occupiedSet.has(s.seatNo),
    _available: s.status === "正常" && !occupiedSet.has(s.seatNo),
  }));
}

// 加载一键预约的座位列表
async function fetchQuickBookSeatList(roomId: number) {
  const date = quickBookDate.value;
  if (!date || !roomId) return;

  quickBookSeatLoading.value = true;
  quickBookSeatList.value = [];
  try {
    quickBookSeatList.value = await fetchSeatsWithOccupied(
      roomId,
      date,
      "00:00",
      "23:59",
    );
  } catch {
    /* handled by interceptor */
  } finally {
    quickBookSeatLoading.value = false;
  }
}

// 选择一键预约的座位
async function selectQuickBookSeat(seat: SeatItem) {
  if (quickBookSelectedSeatNo.value === seat.seatNo) {
    clearQuickBookSeatSelection();
    return;
  }

  quickBookSelectedSeatNo.value = seat.seatNo;
  quickBookSelectedSlots.value = [];

  // 重新生成时间段并加载该座位的占用情况
  initQuickBookTimeSlots();
  await loadQuickBookSeatOccupiedSlots(seat.seatNo);
}

// 清除一键预约的座位选择
function clearQuickBookSeatSelection() {
  quickBookSelectedSeatNo.value = null;
  quickBookSelectedSlots.value = [];
  quickBookTimeSlots.value.forEach((s) => (s.selected = false));
}

// 加载一键预约特定座位的时间段占用情况
async function loadQuickBookSeatOccupiedSlots(seatNo: number) {
  if (!quickBookSelectedRoom.value || !quickBookDate.value) return;

  const seat = quickBookSeatList.value.find((s) => s.seatNo === seatNo);
  if (!seat) return;

  try {
    const res = await get<any>("/reservation/user/list-by-seat", {
      seatId: seat.id,
      date: quickBookDate.value,
    });
    if (res) {
      const reservations: Array<{ startTime: string; endTime: string }> =
        (res as any) || [];

      quickBookTimeSlots.value = quickBookTimeSlots.value.map((slot) => {
        const slotStart = slot.start;
        const slotEnd = slot.end;
        const conflicted = reservations.some(
          (r) => r.startTime < slotEnd && r.endTime > slotStart,
        );
        return { ...slot, available: slot.available && !conflicted };
      });
    }
  } catch (e) {
    console.error("加载座位占用时间段失败:", e);
  }
}

// 初始化一键预约的时间段列表（30 分钟粒度，以自习室开放时间为基准）
function initQuickBookTimeSlots() {
  const { start, end } = resolveRoomOpenRange(
    quickBookSelectedRoom.value?.openTime,
  );
  quickBookTimeSlots.value = generate30MinSlots(
    start,
    end,
    quickBookDate.value,
  );
  quickBookSelectedSlots.value = [];
  // 重置点击选择模式
  quickClickSelectionMode.value = false;
  quickClickStartIndex.value = -1;
}

// 一键预约日期变更处理
function handleQuickBookDateChange() {
  quickBookSelectedSeatNo.value = null;
  quickBookSelectedSlots.value = [];
  if (quickBookSelectedRoom.value) {
    initQuickBookTimeSlots();
    fetchQuickBookSeatList(quickBookSelectedRoom.value.roomId);
  }
}

// 格式化一键预约的已选时间范围
function formatQuickBookTimeRange(): string {
  return formatSlotRangeText(quickBookSelectedSlots.value);
}

// 清空一键预约的时间段选择
function resetQuickBookTimeSlots() {
  quickBookTimeSlots.value.forEach((s) => (s.selected = false));
  quickBookSelectedSlots.value = [];
  // 重置点击选择模式
  quickClickSelectionMode.value = false;
  quickClickStartIndex.value = -1;
}

// 快速选择时间段（上午/下午/晚上/全天）
function quickSelectTimeRange(range: string) {
  const allSlots = quickBookTimeSlots.value;

  // 清空当前选择
  allSlots.forEach((s) => (s.selected = false));

  // 根据范围选择时段
  let startHour = 0;
  let endHour = 24;

  if (range === "morning") {
    startHour = 7;
    endHour = 12;
  } else if (range === "afternoon") {
    startHour = 12;
    endHour = 18;
  } else if (range === "evening") {
    startHour = 18;
    endHour = 22;
  }

  allSlots.forEach((slot) => {
    const hour = parseInt(slot.start.split(":")[0]);
    if (hour >= startHour && hour < endHour) {
      slot.selected = true;
    }
  });

  quickBookSelectedSlots.value = allSlots
    .filter((s) => s.selected)
    .sort((a, b) => a.start.localeCompare(b.start));
}

async function submitQuickBook() {
  if (!quickBookSelectedRoom.value) {
    ElMessage.warning("请选择要预约的自习室");
    return;
  }

  if (!quickBookSelectedSeatNo.value) {
    ElMessage.warning("请选择座位");
    return;
  }

  if (quickBookSelectedSlots.value.length === 0) {
    ElMessage.warning("请选择时间段");
    return;
  }

  await loadReservationRule();

  // 检查待签到预约数量限制
  const canReserve = await checkPendingReservationLimit();
  if (!canReserve) {
    return;
  }

  // 查找选中座位的 ID
  const selectedSeat = quickBookSeatList.value.find(
    (s) => s.seatNo === quickBookSelectedSeatNo.value,
  );
  if (!selectedSeat) {
    ElMessage.error("座位信息错误");
    return;
  }

  quickBookLoading.value = true;
  try {
    const room = quickBookSelectedRoom.value as FavoriteRoom;
    const firstSlot = quickBookSelectedSlots.value[0];
    const lastSlot =
      quickBookSelectedSlots.value[quickBookSelectedSlots.value.length - 1];

    const res = await post<any>("/reservation/user/add", {
      roomId: room.roomId,
      seatId: selectedSeat.id,
      reserveDate: quickBookDate.value,
      startTime: firstSlot.start,
      endTime: lastSlot.end,
    });

    if (res) {
      ElMessage.success("预约成功");
      quickBookDialogVisible.value = false;
      quickBookSelectedSeatNo.value = null;
      quickBookSelectedSlots.value = [];
      quickBookTimeSlots.value = [];
      quickBookSeatList.value = [];

      ElMessageBox.confirm("预约成功！是否继续预约其他时间段？", "提示", {
        confirmButtonText: "继续预约",
        cancelButtonText: "查看我的预约",
        type: "success",
      }).catch(() => {
        router.push("/user/reservation");
      });
    }
  } catch {
    /* handled by interceptor */
  } finally {
    quickBookLoading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchList();
}

function handleReset() {
  queryForm.building = "";
  queryForm.roomNo = "";
  queryForm.status = "";
  queryForm.date = getTodayStr();
  queryForm.startTime = "";
  queryForm.endTime = "";
  pagination.pageNum = 1;
  fetchList();
}

function onDateOrSlotChange() {
  fetchList();
}

function handlePageChange(page: number) {
  pagination.pageNum = page;
  fetchList();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchList();
}

// ---- 座位预约弹窗相关函数 ----

/**
 * 生成时间段列表（30 分钟粒度）
 * @param openTime 开放时间
 * @param closeTime 关闭时间
 * @param checkDate 检查的日期（如果是今天，需要将过去的时间段置灰）
 */
function generate30MinSlots(
  openTime: string = DEFAULT_OPEN_TIME,
  closeTime: string = DEFAULT_CLOSE_TIME,
  checkDate?: string,
): ReserveTimeSlot[] {
  const slots: ReserveTimeSlot[] = [];
  const normalizedOpenTime = normalizeTimeText(openTime, DEFAULT_OPEN_TIME);
  const normalizedCloseTime = normalizeTimeText(closeTime, DEFAULT_CLOSE_TIME);
  const openHour = parseInt(normalizedOpenTime.split(":")[0]);
  const openMin = parseInt(normalizedOpenTime.split(":")[1] || "0");
  const closeHour = parseInt(normalizedCloseTime.split(":")[0]);
  const closeMin = parseInt(normalizedCloseTime.split(":")[1] || "0");
  const isFullDayClose = normalizedCloseTime === FULL_DAY_CLOSE_TIME;

  // 获取当前时间（仅当检查日期为今天时）
  const isToday = checkDate === getTodayStr();
  const now = isToday ? new Date() : null;
  const currentHour = now ? now.getHours() : -1;
  const currentMinute = now ? now.getMinutes() : -1;

  // 从开放时间到关闭时间，每 30 分钟一个时段
  let currentSlotHour = openHour;
  let currentSlotMin = openMin;

  while (
    currentSlotHour < closeHour ||
    (currentSlotHour === closeHour && currentSlotMin < closeMin)
  ) {
    const startHour = currentSlotHour.toString().padStart(2, "0");
    const startMinStr = currentSlotMin.toString().padStart(2, "0");

    // 计算结束时间（+30 分钟）
    let endHour = currentSlotHour;
    let endMin = currentSlotMin + 30;
    if (endMin >= 60) {
      endMin = 0;
      endHour += 1;
    }

    // 如果结束时间超过关闭时间，调整为关闭时间
    if (endHour > closeHour || (endHour === closeHour && endMin > closeMin)) {
      endHour = closeHour;
      endMin = closeMin;
    }

    const endHourStr = endHour.toString().padStart(2, "0");
    const endMinStr = endMin.toString().padStart(2, "0");
    const displayEnd =
      isFullDayClose && endHourStr === "23" && endMinStr === "59"
        ? FULL_DAY_DISPLAY_END_TIME
        : `${endHourStr}:${endMinStr}`;

    // 判断该时间段是否已过（仅今天需要判断）
    let isPast = false;
    if (isToday && now) {
      // 如果时间段的结束时间早于当前时间，则置灰
      if (
        endHour < currentHour ||
        (endHour === currentHour && endMin <= currentMinute)
      ) {
        isPast = true;
      }
    }

    slots.push({
      label: `${startHour}:${startMinStr}-${displayEnd}`,
      value: `${startHour}:${startMinStr}-${displayEnd}`,
      start: `${startHour}:${startMinStr}`,
      end: `${endHourStr}:${endMinStr}`,
      available: !isPast,
      selected: false,
    });

    // 移动到下一个 30 分钟
    currentSlotHour = endHour;
    currentSlotMin = endMin;
  }

  return slots;
}

/**
 * 打开座位预约弹窗
 */
async function openReserveDialog(row: Room) {
  if (!queryForm.date) {
    ElMessage.warning("请先选择日期");
    return;
  }

  await loadReservationRule();

  reserveCurrentRoom.value = row;
  reserveDialogTitle.value = `${row.building} ${row.roomNo} 自习室`;
  reserveSelectedSeatNo.value = null;
  reserveSelectedSlots.value = [];
  reserveDialogVisible.value = true;

  // 生成时间段列表
  const { start, end } = resolveRoomOpenRange(row.openTime);
  reserveTimeSlots.value = generate30MinSlots(start, end, queryForm.date);

  // 如果主页筛选了时间段，预选匹配的时间段
  applySlotPreselection();

  await fetchReserveSeatList(
    row,
    queryForm.startTime || undefined,
    queryForm.endTime || undefined,
  );
}

async function fetchReserveSeatList(
  row: Room,
  filterStart?: string,
  filterEnd?: string,
) {
  const date = queryForm.date;
  if (!date) return;

  reserveSeatLoading.value = true;
  reserveDialogSeatList.value = [];
  try {
    reserveDialogSeatList.value = await fetchSeatsWithOccupied(
      row.id,
      date,
      filterStart || "00:00",
      filterEnd || "23:59",
    );
  } catch {
    /* handled by interceptor */
  } finally {
    reserveSeatLoading.value = false;
  }
}

/**
 * 选中座位
 */
async function selectReserveSeat(seat: SeatItem) {
  if (reserveSelectedSeatNo.value === seat.seatNo) {
    // 取消选择
    reserveSelectedSeatNo.value = null;
    reserveSelectedSlots.value = [];
    return;
  }

  // 选择新座位
  reserveSelectedSeatNo.value = seat.seatNo;
  reserveSelectedSlots.value = [];

  // 生成新的时间段列表
  if (reserveCurrentRoom.value) {
    const { start, end } = resolveRoomOpenRange(
      reserveCurrentRoom.value.openTime,
    );
    reserveTimeSlots.value = generate30MinSlots(start, end, queryForm.date);

    // 获取该座位在当天的预约情况，标记不可用时段
    await loadSeatOccupiedTimeSlots(seat.seatNo);

    // 重新应用主页面筛选时间段预选
    applySlotPreselection();
  }
}

/**
 * 加载座位在各时间段的占用情况
 */
async function loadSeatOccupiedTimeSlots(seatNo: number) {
  if (!reserveCurrentRoom.value || !queryForm.date) return;

  try {
    // 查找座位的ID
    const seat = reserveDialogSeatList.value.find((s) => s.seatNo === seatNo);
    if (!seat) return;

    // 查询该座位在当天的所有预约
    const res = await get<any>("/reservation/user/list-by-seat", {
      seatId: seat.id,
      date: queryForm.date,
    });

    if (res) {
      const reservations: { startTime: string; endTime: string }[] =
        (res as any) || [];

      const occupiedSet = new Set<string>();

      for (const resv of reservations) {
        // 后端返回的时间格式是 HH:mm，转换为小时数用于匹配
        const startFull =
          resv.startTime.length <= 5 ? `${resv.startTime}:00` : resv.startTime;
        const endFull =
          resv.endTime.length <= 5 ? `${resv.endTime}:00` : resv.endTime;

        // 标记所有与被占用时间段有重叠的30分钟时段为不可用
        for (const ts of reserveTimeSlots.value) {
          // 检查时间是否重叠：新时段开始 < 已占用结束 && 新时段结束 > 已占用开始
          if (ts.start < endFull && ts.end > startFull) {
            occupiedSet.add(`${ts.start}-${ts.end}`);
          }
        }
      }

      // 标记不可用时段（保留已过期时段的不可用状态）
      reserveTimeSlots.value = reserveTimeSlots.value.map((slot) => ({
        ...slot,
        available:
          slot.available && !occupiedSet.has(`${slot.start}-${slot.end}`),
      }));
    }
  } catch {
    /* handled by interceptor */
  }
}

/**
 * 格式化已选时间范围
 */
function formatSelectedTimeRange(): string {
  return formatSlotRangeText(reserveSelectedSlots.value);
}

/**
 * 根据主页面筛选的时间段预选预约对话框中的 slots
 * 会裁剪到自习室开放时间及预约规则（最长时长）
 */
function applySlotPreselection() {
  if (!queryForm.startTime || !queryForm.endTime) return;
  if (!reserveCurrentRoom.value) return;

  const { start, end } = resolveRoomOpenRange(
    reserveCurrentRoom.value.openTime,
  );

  const filterStart = queryForm.startTime;
  const filterEnd = queryForm.endTime;

  const effectiveStart =
    timeToComparableMinutes(filterStart) > timeToComparableMinutes(start)
      ? filterStart
      : start;
  const effectiveEnd =
    timeToComparableMinutes(filterEnd) < timeToComparableMinutes(end)
      ? filterEnd
      : end;

  const filterDurationMinutes =
    timeToComparableMinutes(effectiveEnd) -
    timeToComparableMinutes(effectiveStart);
  let finalEnd = effectiveEnd;
  if (filterDurationMinutes > maxDurationHours.value * 60) {
    const maxEndMinutes =
      timeToComparableMinutes(effectiveStart) + maxDurationHours.value * 60;
    const maxEndHour = Math.floor(maxEndMinutes / 60);
    const maxEndMin = maxEndMinutes % 60;
    finalEnd = `${String(maxEndHour).padStart(2, "0")}:${String(maxEndMin).padStart(2, "0")}`;
    ElMessage.warning(
      `预约时长不能超过 ${maxDurationHours.value} 小时，已自动调整`,
    );
  }

  const effectiveStartMin = timeToComparableMinutes(effectiveStart);
  const finalEndMin = timeToComparableMinutes(finalEnd);

  reserveTimeSlots.value.forEach((slot) => {
    const slotStartMin = timeToComparableMinutes(slot.start);
    const slotEndMin = timeToComparableMinutes(slot.end);
    if (
      slot.available &&
      slotStartMin >= effectiveStartMin &&
      slotEndMin <= finalEndMin
    ) {
      slot.selected = true;
    }
  });
  reserveSelectedSlots.value = reserveTimeSlots.value
    .filter((s) => s.selected)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * 检查用户待签到预约数量是否超过限制
 */
const maxConcurrentLimit = ref(2);
const maxDurationHours = ref(4);
const ruleLoaded = ref(false);

async function loadReservationRule() {
  if (ruleLoaded.value) return;
  try {
    const res = await get<any>("/reservation/rule");
    if (res) {
      maxConcurrentLimit.value = (res as any).maxConcurrentReservations ?? 2;
      maxDurationHours.value = (res as any).maxDurationHours ?? 4;
    }
    ruleLoaded.value = true;
  } catch {
    /* ignore */
  }
}

async function checkPendingReservationLimit(): Promise<boolean> {
  try {
    const res = await getPage<any>("/reservation/user/pending", {
      pageNum: 1,
      pageSize: 100,
    });
    const pendingCount = res.total;
    const limit = maxConcurrentLimit.value;
    if (pendingCount >= limit) {
      ElMessage.warning(
        "您有 " +
          pendingCount +
          " 个待签到的预约，请先完成签到或取消其他预约后再预约（上限 " +
          limit +
          " 个）",
      );
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * 提交预约
 */
async function handleReserveSubmit() {
  if (!reserveSelectedSeatNo.value || reserveSelectedSlots.value.length === 0) {
    ElMessage.warning("请选择座位和时间段");
    return;
  }

  const date = queryForm.date;
  if (!date || !reserveCurrentRoom.value) {
    ElMessage.warning("请先选择日期");
    return;
  }

  // 检查待签到预约数量限制
  const canReserve = await checkPendingReservationLimit();
  if (!canReserve) {
    return;
  }

  // 查找选中座位的 ID
  const selectedSeat = reserveDialogSeatList.value.find(
    (s) => s.seatNo === reserveSelectedSeatNo.value,
  );
  if (!selectedSeat) {
    ElMessage.error("座位信息错误");
    return;
  }

  // 合并时间段，计算整体开始和结束时间
  const firstSlot = reserveSelectedSlots.value[0];
  const lastSlot =
    reserveSelectedSlots.value[reserveSelectedSlots.value.length - 1];

  reserveSubmitLoading.value = true;
  try {
    await post<any>("/reservation/user/add", {
      roomId: reserveCurrentRoom.value.id,
      seatId: selectedSeat.id,
      reserveDate: date,
      startTime: firstSlot.start,
      endTime: lastSlot.end,
    });

    ElMessage.success("预约成功！");
    reserveDialogVisible.value = false;
    reserveSelectedSeatNo.value = null;
    reserveSelectedSlots.value = [];
    ElMessageBox.confirm("预约成功！是否继续预约其他时间段？", "提示", {
      confirmButtonText: "继续预约",
      cancelButtonText: "查看我的预约",
      type: "success",
    }).catch(() => {
      router.push("/user/reservation");
    });
  } catch {
    /* handled by interceptor */
  } finally {
    reserveSubmitLoading.value = false;
  }
}

/**
 * 关闭预约弹窗
 */
function handleReserveDialogClose() {
  reserveCurrentRoom.value = null;
  reserveDialogSeatList.value = [];
  reserveSelectedSeatNo.value = null;
  reserveSelectedSlots.value = [];
  reserveTimeSlots.value = [];
}

function clearSeatSelection() {
  reserveSelectedSeatNo.value = null;
  reserveSelectedSlots.value = [];
  reserveTimeSlots.value = [];
  // 重置点击选择模式
  clickSelectionMode.value = false;
  clickStartIndex.value = -1;
}

function clearReserveTimeSlots() {
  reserveTimeSlots.value.forEach((s) => (s.selected = false));
  reserveSelectedSlots.value = [];
  // 重置点击选择模式
  clickSelectionMode.value = false;
  clickStartIndex.value = -1;
}

// 挂历弹窗状态
const calendarDialogVisible = ref(false);
const calendarDialogTitle = ref("");
const calendarCells = ref<
  { key: string; day: number | null; open: boolean; isToday: boolean }[]
>([]);

function openCalendarDialog(row: Room) {
  calendarDialogTitle.value = `${row.building} ${row.roomNo} - 本月开放日期`;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  const today = now.getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=日
  const daysInMonth = new Date(year, month, 0).getDate();

  // 调用接口获取当月开放日期
  get<any>("/room/calendar", { roomId: row.id, year, month })
    .then((res) => {
      const openDays = (res as any)?.openDays ? (res as any).openDays : "";
      const cells: typeof calendarCells.value = [];
      for (let i = 0; i < firstDay; i++) {
        cells.push({ key: `e${i}`, day: null, open: false, isToday: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
          key: `d${d}`,
          day: d,
          open: openDays[d - 1] === "1",
          isToday: d === today,
        });
      }
      calendarCells.value = cells;
    })
    .catch(() => {
      const cells: typeof calendarCells.value = [];
      for (let i = 0; i < firstDay; i++) {
        cells.push({ key: `e${i}`, day: null, open: false, isToday: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
          key: `d${d}`,
          day: d,
          open: false,
          isToday: d === today,
        });
      }
      calendarCells.value = cells;
    });

  calendarDialogVisible.value = true;
}

/**
 * 将31位0/1字符串解析为本月开放日期列表，如 "1,3,5,15"
 */
function parseOpenDates(openDays: string): string {
  if (!openDays) return "-";
  const days: number[] = [];
  for (let i = 0; i < openDays.length; i++) {
    if (openDays[i] === "1") days.push(i + 1);
  }
  return days.length > 0 ? days.join(", ") + " 日" : "暂无开放日";
}

function reserveSelectTimeRange(range: string) {
  reserveTimeSlots.value.forEach((s) => (s.selected = false));
  let startHour = 0,
    endHour = 24;
  if (range === "morning") {
    startHour = 7;
    endHour = 12;
  } else if (range === "afternoon") {
    startHour = 12;
    endHour = 18;
  } else if (range === "evening") {
    startHour = 18;
    endHour = 22;
  }
  reserveTimeSlots.value.forEach((slot) => {
    const hour = parseInt(slot.start.split(":")[0]!);
    if (slot.available && hour >= startHour && hour < endHour)
      slot.selected = true;
  });
  reserveSelectedSlots.value = reserveTimeSlots.value
    .filter((s) => s.selected)
    .sort((a, b) => a.start.localeCompare(b.start));
}

// 点击连续选中 - 预约弹窗（替换拖拽）
// 灵活逻辑：点击已选区间中间则清空重设，点击其他位置则扩展选中范围
function handleReserveClick(index: number, slot: ReserveTimeSlot) {
  if (!slot.available) return;

  // 如果点击的是已选中的区间，直接重置为新的起点
  if (slot.selected) {
    clickSelectionMode.value = true;
    clickStartIndex.value = index;
    // 清除其他选中，只选中当前点击的作为新起点
    reserveTimeSlots.value.forEach((s) => (s.selected = false));
    reserveTimeSlots.value[index]!.selected = true;
    reserveSelectedSlots.value = [reserveTimeSlots.value[index]!];
    return;
  }

  // 第一次点击或起点已选：设置起点
  if (!clickSelectionMode.value) {
    clickSelectionMode.value = true;
    clickStartIndex.value = index;
    // 清除其他选中，只选中当前点击的
    reserveTimeSlots.value.forEach((s) => (s.selected = false));
    reserveTimeSlots.value[index]!.selected = true;
    reserveSelectedSlots.value = [reserveTimeSlots.value[index]!];
  } else {
    // 第二次点击：选中从起点到终点的连续区间
    const start = Math.min(clickStartIndex.value, index);
    const end = Math.max(clickStartIndex.value, index);
    reserveTimeSlots.value.forEach((s, i) => {
      // 只有可选的才能选中
      if (i >= start && i <= end && s.available) {
        s.selected = true;
      }
    });
    reserveSelectedSlots.value = reserveTimeSlots.value
      .filter((s) => s.selected)
      .sort((a, b) => a.start.localeCompare(b.start));
    // 完成一次选择后，重置点击模式，但保留已选中的时间段
    clickSelectionMode.value = false;
    clickStartIndex.value = -1;
  }
}

// 点击连续选中 - 一键预约弹窗
// 灵活逻辑：点击已选区间中间则清空重设，点击其他位置则扩展选中范围
function handleQuickClick(index: number, slot: QuickBookTimeSlot) {
  if (!slot.available) return;

  // 如果点击的是已选中的区间，直接重置为新的起点
  if (slot.selected) {
    quickClickSelectionMode.value = true;
    quickClickStartIndex.value = index;
    // 清除其他选中，只选中当前点击的作为新起点
    quickBookTimeSlots.value.forEach((s) => (s.selected = false));
    quickBookTimeSlots.value[index]!.selected = true;
    quickBookSelectedSlots.value = [quickBookTimeSlots.value[index]!];
    return;
  }

  // 第一次点击或起点已选：设置起点
  if (!quickClickSelectionMode.value) {
    quickClickSelectionMode.value = true;
    quickClickStartIndex.value = index;
    // 清除其他选中，只选中当前点击的
    quickBookTimeSlots.value.forEach((s) => (s.selected = false));
    quickBookTimeSlots.value[index]!.selected = true;
    quickBookSelectedSlots.value = [quickBookTimeSlots.value[index]!];
  } else {
    // 第二次点击：选中从起点到终点的连续区间
    const start = Math.min(quickClickStartIndex.value, index);
    const end = Math.max(quickClickStartIndex.value, index);
    quickBookTimeSlots.value.forEach((s, i) => {
      // 只有可选的才能选中
      if (i >= start && i <= end && s.available) {
        s.selected = true;
      }
    });
    quickBookSelectedSlots.value = quickBookTimeSlots.value
      .filter((s) => s.selected)
      .sort((a, b) => a.start.localeCompare(b.start));
    // 完成一次选择后，重置点击模式，但保留已选中的时间段
    quickClickSelectionMode.value = false;
    quickClickStartIndex.value = -1;
  }
}
</script>

<style scoped>
/* 页面布局 */
.page-wrapper {
  min-height: 100%;
}
.page-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(14, 116, 144, 0.08);
  overflow: hidden;
}

/* 筛选 */
.filter-section {
  padding: 20px 28px;
  background: #fafcfd;
  border-bottom: 1px solid rgba(14, 116, 144, 0.06);
}
.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.query-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}
.query-form :deep(.el-form-item__label) {
  color: #475569;
  font-weight: 500;
}
.filter-input {
  width: 130px;
}
.filter-select {
  width: 120px;
}
.filter-date {
  width: 150px;
}
.filter-time {
  width: 120px;
}
.btn-search {
  background: linear-gradient(135deg, #0891b2, #0e7490);
  border: none;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.25);
}
.btn-reset {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

/* 表格 */
.table-section {
  padding: 20px 28px 28px;
}
.custom-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(14, 116, 144, 0.1);
}
.custom-table :deep(.el-table__row) {
  transition: background 0.2s;
}
.custom-table :deep(.el-table__row:hover > td) {
  background: #f0fdfa !important;
}
.building-image {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  cursor: pointer;
}
.no-image {
  font-size: 12px;
  color: #94a3b8;
}
.capacity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 8px;
  background: rgba(14, 116, 144, 0.1);
  color: #0891b2;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
}
.text-muted {
  color: #94a3b8;
  font-weight: 600;
}
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.2s;
}
.status-dot.open {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
.status-dot.closed {
  background: #64748b;
  box-shadow: 0 0 6px rgba(100, 116, 139, 0.5);
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 挂历 */
.calendar-wrap {
  padding: 4px 0;
}
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 6px;
}
.cal-week {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 4px 0;
}
.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
.cal-cell.open {
  background: rgba(8, 145, 178, 0.15);
  color: #0891b2;
}
.cal-cell.closed {
  background: #f1f5f9;
  color: #cbd5e1;
}
.cal-cell.empty {
  background: transparent;
}
.cal-cell.today {
  outline: 2px solid #0891b2;
  font-weight: 700;
}
.calendar-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
}
.legend-open {
  color: #0891b2;
}
.legend-closed {
  color: #cbd5e1;
}
.text-hint {
  color: #94a3b8;
  font-size: 12px;
}

/* 弹窗：座位 */
.dialog-seat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}
.seat-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #64748b;
}
.seat-empty {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
}
.seat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: default;
}
.seat-item.available {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  cursor: pointer;
}
.seat-item.available:hover {
  background: rgba(34, 197, 94, 0.2);
  transform: translateY(-2px);
}
.seat-item.occupied {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}
.seat-item.disabled {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.2);
}
.seat-item.selected {
  background: rgba(8, 145, 178, 0.15);
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.2);
}
.seat-no {
  font-size: 15px;
  font-weight: 600;
  color: #164e63;
}
.seat-status {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.seat-item.available .seat-status {
  color: #22c55e;
}
.seat-item.occupied .seat-status {
  color: #ef4444;
}
.seat-item.disabled .seat-status {
  color: #94a3b8;
}

/* 弹窗：标题行 & 时间段 */
.section-title-row,
.time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title-row .section-title,
.time-header .section-title {
  margin-bottom: 0;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #164e63;
  margin-bottom: 12px;
}
.quick-select-btns {
  display: flex;
  gap: 8px;
  align-items: center;
}
.time-slot-section {
  margin-bottom: 20px;
}
.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.time-slot-btn {
  padding: 10px 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.time-slot-btn:hover:not(:disabled) {
  border-color: #0891b2;
  background: #f0fdfa;
}
.time-slot-btn.selected {
  background: linear-gradient(135deg, #0891b2, #22d3ee);
  border-color: #0891b2;
  color: #fff;
}
.time-slot-btn.unavailable {
  background: #f1f5f9;
  color: #cbd5e1;
  cursor: not-allowed;
  border-color: #e2e8f0;
}
.time-slot-btn:disabled {
  cursor: not-allowed;
}

/* 弹窗：选中信息 */
.selected-text {
  font-size: 13px;
  color: #164e63;
}
.selected-time {
  color: #64748b;
}
.dialog-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 座位预约弹窗 */
:deep(.reserve-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px 20px;
}
.seat-grid-section {
  margin-bottom: 12px;
}
/* 一键预约弹窗 */
.quick-empty {
  padding: 40px 0;
}
.quick-book-section {
  margin: 0 0 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.quick-time-section {
  margin: 0 0 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.quick-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.quick-card {
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}
.quick-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transform: translateY(-2px);
}
.quick-card.selected {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
}
.quick-card-building {
  font-size: 12px;
  color: #64748b;
}
.quick-card-room {
  font-size: 14px;
  font-weight: 600;
  color: #164e63;
  margin: 4px 0;
}
.quick-card-count {
  font-size: 11px;
  color: #10b981;
}
</style>
