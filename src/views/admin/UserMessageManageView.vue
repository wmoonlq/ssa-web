<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户信息与消息管理</span>
        </div>
      </template>

      <!-- 用户搜索 -->
      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.name"
            placeholder="请输入用户名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="queryForm.role"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="管理员" value="1" />
            <el-option label="普通用户" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        style="margin-top: 16px"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="用户名" width="140" />
        <el-table-column prop="role" label="角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === '1' ? 'danger' : 'success'">{{
              row.role === "1" ? "管理员" : "普通用户"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="violationCount"
          label="违约次数"
          width="100"
          align="center"
        />
        <el-table-column
          prop="status"
          label="账号状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === "active" ? "正常" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="注册时间"
          width="180"
          align="center"
        />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="handleViewMessages(row)"
              >查看消息</el-button
            >
            <el-button
              type="success"
              size="small"
              @click.stop="handleSendMessage(row)"
              >发送消息</el-button
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

    <!-- 用户消息列表弹窗 -->
    <el-dialog
      v-model="messageDialogVisible"
      :title="`用户「${currentUser?.name}」的消息列表`"
      width="900px"
      top="5vh"
    >
      <div style="margin-bottom: 16px; display: flex; gap: 10px">
        <el-button
          type="success"
          :icon="Message"
          @click="handleSendMessageFromDialog"
          >发送新消息</el-button
        >
      </div>

      <el-table
        :data="messageList"
        border
        stripe
        v-loading="messageLoading"
        max-height="500px"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="title" label="标题" width="150" />
        <el-table-column
          prop="content"
          label="内容"
          show-overflow-tooltip
          min-width="200"
        />
        <el-table-column prop="isRead" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead === 0 ? 'warning' : 'success'">{{
              row.isRead === 0 ? "未读" : "已读"
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="发送时间"
          width="160"
          align="center"
        />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDeleteMessage(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="messagePage.num"
          v-model:page-size="messagePage.size"
          :total="messagePage.total"
          layout="total, prev, pager, next"
          @current-change="fetchMessages"
        />
      </div>
    </el-dialog>

    <!-- 发送消息弹窗 -->
    <el-dialog
      v-model="sendDialogVisible"
      :title="`向用户「${currentUser?.name}」发送消息`"
      width="500px"
    >
      <el-form :model="messageForm" label-width="80px">
        <el-form-item label="消息标题">
          <el-input v-model="messageForm.title" placeholder="请输入消息标题" />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="messageForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入消息内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="sendLoading"
          @click="handleSubmitMessage"
          >发送</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh, Message } from "@element-plus/icons-vue";
import axios from "axios";

interface User {
  id: number;
  name: string;
  role: string;
  violationCount: number;
  status: string;
  createTime: string;
}

interface UserNotification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: number;
  createTime: string;
  reservationId?: number;
}

const queryForm = reactive({
  name: "",
  role: "",
});

const userList = ref<User[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const messageDialogVisible = ref(false);
const currentUser = ref<User | null>(null);
const messageList = ref<UserNotification[]>([]);
const messageLoading = ref(false);
const messagePage = reactive({ num: 1, size: 10, total: 0 });

const sendDialogVisible = ref(false);
const sendLoading = ref(false);
const messageForm = reactive({
  title: "",
  content: "",
});

onMounted(() => {
  fetchList();
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/user/admin/page", {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        name: queryForm.name,
        role: queryForm.role,
      },
    });
    if (res.data.code === 200) {
      userList.value = res.data.data.list ?? res.data.data.records ?? [];
      total.value = res.data.data.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pageNum.value = 1;
  fetchList();
}

function handleReset() {
  queryForm.name = "";
  queryForm.role = "";
  pageNum.value = 1;
  fetchList();
}

function handleSizeChange() {
  pageNum.value = 1;
  fetchList();
}

function handleRowClick(row: User) {
  handleViewMessages(row);
}

async function handleViewMessages(row: User) {
  currentUser.value = row;
  messagePage.num = 1;
  messageDialogVisible.value = true;
  await fetchMessages();
}

async function fetchMessages() {
  if (!currentUser.value) return;
  messageLoading.value = true;
  try {
    const res = await axios.get("/api/notification/admin/list", {
      params: {
        userId: currentUser.value.id,
        pageNum: messagePage.num,
        pageSize: messagePage.size,
      },
    });
    if (res.data.code === 200) {
      messageList.value = res.data.data.records;
      messagePage.total = res.data.data.total;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    messageLoading.value = false;
  }
}

function handleSendMessage(row: User) {
  currentUser.value = row;
  messageForm.title = "";
  messageForm.content = "";
  sendDialogVisible.value = true;
}

function handleSendMessageFromDialog() {
  messageForm.title = "";
  messageForm.content = "";
  sendDialogVisible.value = true;
}

async function handleSubmitMessage() {
  if (!currentUser.value) return;
  if (!messageForm.title.trim()) {
    ElMessage.warning("请输入消息标题");
    return;
  }
  if (!messageForm.content.trim()) {
    ElMessage.warning("请输入消息内容");
    return;
  }

  sendLoading.value = true;
  try {
    const res = await axios.post("/api/notification/admin/send", {
      userId: currentUser.value.id,
      title: messageForm.title,
      content: messageForm.content,
    });
    if (res.data.code === 200) {
      ElMessage.success("发送成功");
      sendDialogVisible.value = false;
      if (messageDialogVisible.value) {
        await fetchMessages();
      }
    }
  } catch {
    /* handled by interceptor */
  } finally {
    sendLoading.value = false;
  }
}

async function handleDeleteMessage(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该消息吗？", "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
    const res = await axios.delete(`/api/notification/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      await fetchMessages();
    }
  } catch {
    // 取消删除，忽略
  }
}
</script>

<style scoped>
.page-card {
  min-height: calc(100vh - 120px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
