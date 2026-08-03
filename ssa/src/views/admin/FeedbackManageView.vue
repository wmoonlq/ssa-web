<template>
  <div>
    <el-tabs v-model="activeTab" type="card" class="mode-tabs">
      <el-tab-pane label="意见反馈" name="feedback" />
      <el-tab-pane label="报修" name="repair" />
    </el-tabs>

    <!-- ========== 意见反馈管理 ========== -->
    <el-card v-if="activeTab === 'feedback'" class="page-card">
      <template #header>
        <span class="card-title">意见反馈处理</span>
      </template>

      <el-form :model="fbQuery" inline>
        <el-form-item label="处理状态">
          <el-select v-model="fbQuery.status" placeholder="全部" clearable style="width:130px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="fbQuery.userName" placeholder="请输入用户名" style="width:150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadFeedbackList">查询</el-button>
          <el-button :icon="Refresh" @click="resetFeedbackQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="feedbackList" border stripe style="margin-top:16px" v-loading="fbLoading">
        <el-table-column prop="id" label="编号" width="70" align="center" />
        <el-table-column prop="userName" label="提交用户" width="120" align="center" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <el-image v-if="row.images" :src="row.images.split(',')[0]" :preview-src-list="[row.images.split(',')[0]]" style="width:48px;height:48px;object-fit:cover;cursor:pointer" fit="cover" preview-teleported />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="160" align="center" />
        <el-table-column prop="remark" label="回复内容" min-width="140" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="处理时间" width="160" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleFeedbackProcess(row)" :disabled="row.status === 'resolved'">处理</el-button>
            <el-button type="danger" size="small" plain @click="handleFeedbackDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="fbPage.num" v-model:page-size="fbPage.size" :total="fbPage.total" layout="total, prev, pager, next" @current-change="loadFeedbackList" />
      </div>
    </el-card>

    <!-- ========== 报修管理 ========== -->
    <el-card v-if="activeTab === 'repair'" class="page-card">
      <template #header>
        <span class="card-title">报修管理</span>
      </template>

      <el-form :model="rpQuery" inline>
        <el-form-item label="处理状态">
          <el-select v-model="rpQuery.status" placeholder="全部" clearable style="width:130px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="rpQuery.userName" placeholder="请输入用户名" style="width:150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadRepairList">查询</el-button>
          <el-button :icon="Refresh" @click="resetRepairQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="repairList" border stripe style="margin-top:16px" v-loading="rpLoading">
        <el-table-column prop="id" label="编号" width="70" align="center" />
        <el-table-column prop="userName" label="报修用户" width="120" align="center" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="故障描述" show-overflow-tooltip />
        <el-table-column prop="createTime" label="报修时间" width="160" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="处理备注" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleRepairProcess(row)" :disabled="row.status === 'resolved'">处理</el-button>
            <el-button type="danger" size="small" plain @click="handleRepairDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="rpPage.num" v-model:page-size="rpPage.size" :total="rpPage.total" layout="total, prev, pager, next" @current-change="loadRepairList" />
      </div>
    </el-card>

    <!-- ========== 反馈处理弹窗 ========== -->
    <el-dialog v-model="fbDialogVisible" title="处理反馈" width="600px">
      <div class="conversation-view">
        <div class="msg-row user-msg">
          <div class="msg-avatar">
            <el-avatar :size="36" icon="UserFilled" />
          </div>
          <div class="msg-bubble">
            <div class="msg-author">{{ fbCurrentRow?.userName || '用户' }}</div>
            <div class="msg-title">{{ fbCurrentRow?.title }}</div>
            <div class="msg-text">{{ fbCurrentRow?.content }}</div>
            <div v-if="fbCurrentRow?.images" class="msg-image">
              <el-image :src="fbCurrentRow.images.split(',')[0]" :preview-src-list="[fbCurrentRow.images.split(',')[0]]" style="width:80px;height:80px;object-fit:cover;border-radius:6px;cursor:pointer" fit="cover" preview-teleported />
            </div>
            <div class="msg-time">{{ fbCurrentRow?.createTime }}</div>
          </div>
        </div>

        <div v-if="fbCurrentRow?.remark" class="msg-row admin-msg">
          <div class="msg-avatar">
            <el-avatar :size="36" icon="UserFilled" style="background:#409eff" />
          </div>
          <div class="msg-bubble admin-bubble">
            <div class="msg-author" style="color:#409eff">管理员回复</div>
            <div class="msg-text">{{ fbCurrentRow.remark }}</div>
            <div class="msg-time">{{ fbCurrentRow.updateTime }}</div>
          </div>
        </div>
      </div>

      <el-divider style="margin:12px 0" />

      <el-form :model="fbProcessForm" label-width="90px">
        <el-form-item label="处理状态">
          <el-select v-model="fbProcessForm.status" style="width:100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="fbProcessForm.remark" type="textarea" :rows="4" placeholder="请输入回复内容（将作为回复展示给用户）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fbDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="fbProcessing" @click="submitFeedbackProcess">提交处理</el-button>
      </template>
    </el-dialog>

    <!-- ========== 报修处理弹窗 ========== -->
    <el-dialog v-model="rpDialogVisible" title="处理报修" width="500px">
      <el-form :model="rpProcessForm" label-width="90px">
        <el-form-item label="报修标题">
          <span class="info-text">{{ rpCurrentRow?.title }}</span>
        </el-form-item>
        <el-form-item label="故障描述">
          <span class="info-text">{{ rpCurrentRow?.content }}</span>
        </el-form-item>
        <el-form-item label="报修用户">
          <span class="info-text">{{ rpCurrentRow?.userName }}</span>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="rpProcessForm.status" style="width:100%">
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="rpProcessForm.remark" type="textarea" :rows="3" placeholder="请输入处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="rpProcessing" @click="submitRepairProcess">提交处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh } from "@element-plus/icons-vue";
import { getPage, put, del } from "@/utils/api";

const activeTab = ref("feedback");

interface Record {
  id: number;
  userId?: number;
  userName: string;
  title: string;
  content: string;
  images?: string;
  status: string;
  remark?: string;
  createTime: string;
  updateTime?: string;
}

// ==================== 意见反馈 ====================
const fbQuery = reactive({ userName: "", status: "" });
const feedbackList = ref<Record[]>([]);
const fbLoading = ref(false);
const fbPage = reactive({ num: 1, size: 10, total: 0 });

const fbDialogVisible = ref(false);
const fbProcessing = ref(false);
const fbProcessForm = reactive({ id: 0, status: "processing", remark: "" });
const fbCurrentRow = ref<Record | null>(null);

async function loadFeedbackList() {
  fbLoading.value = true;
  try {
    const { list, total } = await getPage<Record>("/feedback/admin/page", {
      pageNum: fbPage.num, pageSize: fbPage.size,
      userName: fbQuery.userName, status: fbQuery.status,
    });
    feedbackList.value = list;
    fbPage.total = total;
  } catch {
    /* handled by interceptor */
  } finally {
    fbLoading.value = false;
  }
}

function resetFeedbackQuery() {
  fbQuery.userName = "";
  fbQuery.status = "";
  fbPage.num = 1;
  loadFeedbackList();
}

function handleFeedbackProcess(row: Record) {
  fbCurrentRow.value = row;
  fbProcessForm.id = row.id;
  fbProcessForm.status = "processing";
  fbProcessForm.remark = row.remark || "";
  fbDialogVisible.value = true;
}

async function submitFeedbackProcess() {
  fbProcessing.value = true;
  try {
    await put("/feedback/admin/update-status", {
      id: fbProcessForm.id, status: fbProcessForm.status, remark: fbProcessForm.remark,
    });
    ElMessage.success("处理成功");
    fbDialogVisible.value = false;
    loadFeedbackList();
  } catch {
    /* handled by interceptor */
  } finally {
    fbProcessing.value = false;
  }
}

async function handleFeedbackDelete(row: Record) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, "提示", {
      confirmButtonText: "确认", cancelButtonText: "取消", type: "warning",
    });
    await del(`/feedback/admin/delete/${row.id}`);
    ElMessage.success("删除成功");
    loadFeedbackList();
  } catch { /* 取消 */ }
}

// ==================== 报修 ====================
const rpQuery = reactive({ userName: "", status: "" });
const repairList = ref<Record[]>([]);
const rpLoading = ref(false);
const rpPage = reactive({ num: 1, size: 10, total: 0 });

const rpDialogVisible = ref(false);
const rpProcessing = ref(false);
const rpProcessForm = reactive({ id: 0, status: "processing", remark: "" });
const rpCurrentRow = ref<Record | null>(null);

async function loadRepairList() {
  rpLoading.value = true;
  try {
    const { list, total } = await getPage<Record>("/repair/admin/page", {
      pageNum: rpPage.num, pageSize: rpPage.size,
      userName: rpQuery.userName, status: rpQuery.status,
    });
    repairList.value = list;
    rpPage.total = total;
  } catch {
    /* handled by interceptor */
  } finally {
    rpLoading.value = false;
  }
}

function resetRepairQuery() {
  rpQuery.userName = "";
  rpQuery.status = "";
  rpPage.num = 1;
  loadRepairList();
}

function handleRepairProcess(row: Record) {
  rpCurrentRow.value = row;
  rpProcessForm.id = row.id;
  rpProcessForm.status = "processing";
  rpProcessForm.remark = row.remark || "";
  rpDialogVisible.value = true;
}

async function submitRepairProcess() {
  rpProcessing.value = true;
  try {
    await put("/repair/admin/update-status", {
      id: rpProcessForm.id, status: rpProcessForm.status, remark: rpProcessForm.remark,
    });
    ElMessage.success("处理成功");
    rpDialogVisible.value = false;
    loadRepairList();
  } catch {
    /* handled by interceptor */
  } finally {
    rpProcessing.value = false;
  }
}

async function handleRepairDelete(row: Record) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, "提示", {
      confirmButtonText: "确认", cancelButtonText: "取消", type: "warning",
    });
    await del(`/repair/admin/delete/${row.id}`);
    ElMessage.success("删除成功");
    loadRepairList();
  } catch { /* 取消 */ }
}

// ==================== 公共工具 ====================
function statusLabel(s: string): string {
  const map: Record<string, string> = { pending: "待处理", processing: "处理中", resolved: "已处理" };
  return map[s] ?? s;
}

function statusType(s: string): "danger" | "warning" | "success" {
  const map: Record<string, "danger" | "warning" | "success"> = { pending: "danger", processing: "warning", resolved: "success" };
  return map[s] ?? "danger";
}

onMounted(() => {
  loadFeedbackList();
  loadRepairList();
});
</script>

<style scoped>
.mode-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-card {
  min-height: calc(100vh - 180px);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.conversation-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.msg-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.msg-avatar {
  flex-shrink: 0;
}

.msg-bubble {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 12px 16px;
  flex: 1;
  position: relative;
}

.msg-bubble::before {
  content: "";
  position: absolute;
  top: 12px;
  left: -8px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #f5f7fa;
}

.admin-msg .msg-bubble::before {
  left: auto;
  right: -8px;
  border-right: none;
  border-left: 8px solid #ecf5ff;
}

.admin-bubble {
  background: #ecf5ff;
}

.admin-msg {
  flex-direction: row-reverse;
}

.msg-author {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.msg-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.msg-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.msg-image {
  margin-top: 8px;
}

.msg-time {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.admin-msg .msg-bubble {
  text-align: left;
}

.info-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
