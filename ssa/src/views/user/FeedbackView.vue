<template>
  <div class="feedback-page">
    <el-tabs v-model="activeTab" type="card" class="mode-tabs">
      <el-tab-pane label="意见反馈" name="feedback" />
      <el-tab-pane label="报修" name="repair" />
    </el-tabs>

    <!-- ========== 意见反馈 ========== -->
    <template v-if="activeTab === 'feedback'">
      <el-card class="page-card submit-card">
        <template #header>
          <span class="card-title">提交意见反馈</span>
        </template>
        <el-form :model="feedbackForm" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="feedbackForm.title" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="feedbackForm.content"
              type="textarea"
              :rows="5"
              placeholder="请详细描述您的意见或问题"
            />
          </el-form-item>
          <el-form-item label="图片">
            <el-upload
              :action="`/api/upload/image`"
              :headers="uploadHeaders"
              list-type="picture-card"
              :limit="1"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :on-remove="handleUploadRemove"
              accept="image/*"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="feedbackSubmitting"
              @click="handleFeedbackSubmit"
              >提交</el-button
            >
            <el-button @click="handleFeedbackReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="thread-list" v-loading="feedbackLoading">
        <div class="thread-list-header">
          <span class="card-title">我的反馈</span>
        </div>

        <el-empty
          v-if="!feedbackLoading && feedbackList.length === 0"
          description="暂无反馈记录"
        />

        <div v-for="item in feedbackList" :key="item.id" class="thread-card">
          <div class="thread-original">
            <div class="thread-header">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="thread-meta">
                <span class="thread-author">我</span>
                <span class="thread-time">{{ item.createTime }}</span>
              </div>
              <el-tag
                :type="statusType(item.status)"
                size="small"
                class="status-tag"
              >
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
            <div class="thread-title">{{ item.title }}</div>
            <div class="thread-content">{{ item.content }}</div>
            <div v-if="item.images" class="thread-image">
              <el-image
                :src="item.images.split(',')[0]"
                :preview-src-list="[item.images.split(',')[0]]"
                style="
                  width: 120px;
                  height: 120px;
                  object-fit: cover;
                  border-radius: 8px;
                  cursor: pointer;
                "
                fit="cover"
                preview-teleported
              />
            </div>
          </div>

          <div v-if="item.remark" class="reply-section">
            <div class="reply-bubble admin-reply">
              <div class="reply-header">
                <el-avatar
                  :size="32"
                  icon="UserFilled"
                  style="background: #409eff"
                />
                <span class="reply-author">管理员回复</span>
                <span class="reply-time">{{ item.updateTime }}</span>
              </div>
              <div class="reply-content">{{ item.remark }}</div>
            </div>
          </div>

          <div
            v-if="!item.remark && item.status === 'pending'"
            class="reply-pending-hint"
          >
            <el-icon style="color: #909399; margin-right: 4px"
              ><Clock
            /></el-icon>
            <span>等待管理员回复中...</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 报修 ========== -->
    <template v-if="activeTab === 'repair'">
      <el-card class="page-card submit-card">
        <template #header>
          <span class="card-title">提交报修</span>
        </template>
        <el-form :model="repairForm" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="repairForm.title" placeholder="请输入报修标题" />
          </el-form-item>
          <el-form-item label="故障描述">
            <el-input
              v-model="repairForm.content"
              type="textarea"
              :rows="5"
              placeholder="请详细描述故障情况"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="repairSubmitting"
              @click="handleRepairSubmit"
              >提交</el-button
            >
            <el-button @click="handleRepairReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="thread-list" v-loading="repairLoading">
        <div class="thread-list-header">
          <span class="card-title">我的报修记录</span>
        </div>

        <el-empty
          v-if="!repairLoading && repairList.length === 0"
          description="暂无报修记录"
        />

        <div v-for="item in repairList" :key="item.id" class="thread-card">
          <div class="thread-original">
            <div class="thread-header">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="thread-meta">
                <span class="thread-author">我</span>
                <span class="thread-time">{{ item.createTime }}</span>
              </div>
              <el-tag
                :type="statusType(item.status)"
                size="small"
                class="status-tag"
              >
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
            <div class="thread-title">{{ item.title }}</div>
            <div class="thread-content">{{ item.content }}</div>
          </div>

          <div v-if="item.remark" class="reply-section">
            <div class="reply-bubble admin-reply">
              <div class="reply-header">
                <el-avatar
                  :size="32"
                  icon="UserFilled"
                  style="background: #409eff"
                />
                <span class="reply-author">管理员回复</span>
                <span class="reply-time">{{ item.updateTime }}</span>
              </div>
              <div class="reply-content">{{ item.remark }}</div>
            </div>
          </div>

          <div
            v-if="!item.remark && item.status === 'pending'"
            class="reply-pending-hint"
          >
            <el-icon style="color: #909399; margin-right: 4px"
              ><Clock
            /></el-icon>
            <span>等待管理员回复中...</span>
          </div>

          <div class="thread-actions">
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleRepairDelete(item.id)"
              >删除</el-button
            >
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Clock } from "@element-plus/icons-vue";
import { getPage, post, del } from "@/utils/api";
import type { Feedback } from "@/types/api";

const activeTab = ref("feedback");

interface Record {
  id: number;
  title: string;
  content: string;
  images?: string;
  status: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

// ==================== 意见反馈 ====================
const uploadedImages = ref<string[]>([]);
const uploadHeaders = computed(() => ({
  Authorization: sessionStorage.getItem("token"),
}));

function handleUploadSuccess(res: any) {
  if (res.code === 200) uploadedImages.value.push(res.data);
}
function handleUploadError(err: any) {
  console.error("上传失败:", err);
  ElMessage.error("图片上传失败: " + (err.message || "未知错误"));
}
function handleUploadRemove(_file: any, fileList: any[]) {
  uploadedImages.value = fileList.map((f) => f.response?.data).filter(Boolean);
}

const feedbackForm = reactive({ title: "", content: "" });
const feedbackList = ref<Record[]>([]);
const feedbackSubmitting = ref(false);
const feedbackLoading = ref(false);

async function loadFeedbackList() {
  feedbackLoading.value = true;
  try {
    const { list } = await getPage<Feedback>("/feedback/user/list", {
      pageNum: 1,
      pageSize: 1000,
    });
    feedbackList.value = list;
  } catch {
    /* handled by interceptor */
  } finally {
    feedbackLoading.value = false;
  }
}

async function handleFeedbackSubmit() {
  if (!feedbackForm.title.trim()) {
    ElMessage.warning("请填写标题");
    return;
  }
  if (!feedbackForm.content.trim()) {
    ElMessage.warning("请填写内容");
    return;
  }
  feedbackSubmitting.value = true;
  try {
    await post("/feedback/user/add", {
      title: feedbackForm.title,
      content: feedbackForm.content,
      images: uploadedImages.value.join(","),
    });
    ElMessage.success("提交成功");
    handleFeedbackReset();
    loadFeedbackList();
  } catch {
    /* handled by interceptor */
  } finally {
    feedbackSubmitting.value = false;
  }
}

function handleFeedbackReset() {
  feedbackForm.title = "";
  feedbackForm.content = "";
  uploadedImages.value = [];
}

// ==================== 报修 ====================
const repairForm = reactive({ title: "", content: "" });
const repairList = ref<Record[]>([]);
const repairSubmitting = ref(false);
const repairLoading = ref(false);

async function loadRepairList() {
  repairLoading.value = true;
  try {
    const { list } = await getPage<Record>("/repair/user/list", {
      pageNum: 1,
      pageSize: 1000,
    });
    repairList.value = list;
  } catch {
    /* handled by interceptor */
  } finally {
    repairLoading.value = false;
  }
}

async function handleRepairSubmit() {
  if (!repairForm.title.trim()) {
    ElMessage.warning("请填写标题");
    return;
  }
  if (!repairForm.content.trim()) {
    ElMessage.warning("请填写故障描述");
    return;
  }
  repairSubmitting.value = true;
  try {
    await post("/repair/user/add", {
      title: repairForm.title,
      content: repairForm.content,
    });
    ElMessage.success("提交成功");
    handleRepairReset();
    loadRepairList();
  } catch {
    /* handled by interceptor */
  } finally {
    repairSubmitting.value = false;
  }
}

function handleRepairReset() {
  repairForm.title = "";
  repairForm.content = "";
}

async function handleRepairDelete(id: number) {
  await ElMessageBox.confirm("确认删除该报修记录吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    await del(`/repair/user/delete/${id}`);
    ElMessage.success("删除成功");
    loadRepairList();
  } catch {
    /* handled by interceptor */
  }
}

// ==================== 公共工具 ====================
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    resolved: "已处理",
  };
  return map[s] ?? s;
}

function statusType(s: string): "info" | "warning" | "success" {
  const map: Record<string, "info" | "warning" | "success"> = {
    pending: "info",
    processing: "warning",
    resolved: "success",
  };
  return map[s] ?? "info";
}

onMounted(() => {
  loadFeedbackList();
  loadRepairList();
});
</script>

<style scoped>
.feedback-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-card {
  width: 100%;
}

.submit-card {
  flex-shrink: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.thread-list-header {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 4px;
}

.thread-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.thread-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 20px;
  margin-top: 16px;
  transition: box-shadow 0.2s;
}

.thread-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.thread-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.thread-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.thread-author {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.thread-time {
  font-size: 12px;
  color: #909399;
}

.status-tag {
  flex-shrink: 0;
}

.thread-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 52px;
}

.thread-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  padding-left: 52px;
  margin-bottom: 10px;
}

.thread-image {
  padding-left: 52px;
}

/* ---- 回复区域 ---- */
.reply-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;
  padding-left: 52px;
}

.reply-bubble {
  background: #f0f9eb;
  border-radius: 10px;
  padding: 14px 16px;
  position: relative;
}

.reply-bubble::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 24px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #f0f9eb;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-author {
  font-weight: 600;
  font-size: 13px;
  color: #409eff;
}

.reply-time {
  font-size: 12px;
  color: #909399;
}

.reply-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-pending-hint {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
  padding-left: 52px;
}

.thread-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
  padding-left: 52px;
}
</style>
