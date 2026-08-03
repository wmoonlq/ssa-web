<template>
  <div class="admin-lost-found-page">
    <el-card class="filter-card" shadow="never">
      <div class="filter-title">失物招领管理</div>
      <el-form :model="queryForm" inline class="filter-form">
        <el-form-item label="类型">
          <el-select
            v-model="queryForm.itemType"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="求助" value="help" />
            <el-option label="招领" value="found" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户">
          <el-input
            v-model="queryForm.userName"
            placeholder="请输入用户名"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadList"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" @click="openPublishDialog"
            >发布招领信息</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading">
      <div v-if="list.length" class="admin-card-grid">
        <article v-for="item in list" :key="item.id" class="admin-card">
          <div class="card-image-wrap">
            <img
              v-if="item.image"
              :src="item.image"
              class="card-image"
              alt="item"
            />
            <div v-else class="card-image empty-image">暂无图片</div>
            <div class="image-overlay">
              <span class="overlay-type">{{ typeLabel(item.itemType) }}</span>
              <el-tag :type="statusType(item.status)" effect="dark" round>
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.description }}</p>
            <div class="meta-grid">
              <span>发布人：{{ item.userName || "未知用户" }}</span>
              <span>认领数：{{ item.claimCount ?? 0 }}</span>
              <span>发布时间：{{ item.createTime || "-" }}</span>
            </div>
            <div class="card-actions">
              <el-button plain @click="openClaimsDrawer(item)"
                >认领记录</el-button
              >
              <el-button type="primary" @click="openStatusDialog(item)"
                >修改状态</el-button
              >
              <el-button type="danger" plain @click="handleDelete(item)"
                >删除</el-button
              >
            </div>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无记录" />
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page.num"
        v-model:page-size="page.size"
        :total="page.total"
        layout="total, prev, pager, next"
        @current-change="loadList"
      />
    </div>

    <el-dialog v-model="statusDialogVisible" title="修改状态" width="420px">
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitStatus">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="publishDialogVisible"
      title="发布招领信息"
      width="500px"
    >
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="publishForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入物品描述、时间地点等信息"
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            action="/api/upload/image"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="publishing" @click="handlePublish">
          发布
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="claimsDrawerVisible" title="认领记录" size="480px">
      <div v-loading="claimsLoading">
        <div v-if="claimRecords.length" class="claim-record-list">
          <article
            v-for="claim in claimRecords"
            :key="claim.id"
            class="claim-record-card"
          >
            <div class="claim-top-row">
              <div class="claim-name">{{ claim.claimantName }}</div>
              <el-tag :type="claimStatusType(claim.status)" size="small">{{
                claimStatusLabel(claim.status)
              }}</el-tag>
            </div>
            <div class="claim-time">{{ claim.createTime || "-" }}</div>
            <p class="claim-note">{{ claim.claimNote || "未填写认领说明" }}</p>
            <div v-if="claim.status === 'pending'" class="claim-actions">
              <el-button
                type="success"
                size="small"
                @click="handleApproveClaim(claim)"
                >通过</el-button
              >
              <el-button
                type="danger"
                size="small"
                plain
                @click="handleRejectClaim(claim)"
                >拒绝</el-button
              >
            </div>
          </article>
        </div>
        <el-empty v-else description="暂无认领记录" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { put, del, get, getPage, post } from "@/utils/api";
import type { LostFoundClaimRecord, LostFoundItem } from "@/types/api";

const queryForm = reactive({
  itemType: "",
  status: "",
  userName: "",
});

const list = ref<LostFoundItem[]>([]);
const loading = ref(false);
const claimsLoading = ref(false);
const saving = ref(false);

const page = reactive({
  num: 1,
  size: 9,
  total: 0,
});

const statusDialogVisible = ref(false);
const claimsDrawerVisible = ref(false);
const currentItem = ref<LostFoundItem | null>(null);
const claimRecords = ref<LostFoundClaimRecord[]>([]);

const statusForm = reactive({
  id: 0,
  status: "pending",
});

const statusOptions = ref<{ label: string; value: string }[]>([]);

const publishDialogVisible = ref(false);
const publishing = ref(false);
const publishForm = reactive({
  title: "",
  description: "",
});
const uploadedImage = ref("");

const uploadHeaders = computed(() => ({
  Authorization: sessionStorage.getItem("token") ?? "",
}));

async function loadList() {
  loading.value = true;
  try {
    const { list: records, total } = await getPage<LostFoundItem>(
      "/lost-found/admin/page",
      {
        pageNum: page.num,
        pageSize: page.size,
        itemType: queryForm.itemType,
        status: queryForm.status,
        userName: queryForm.userName,
      },
    );
    list.value = records;
    page.total = total;
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  queryForm.itemType = "";
  queryForm.status = "";
  queryForm.userName = "";
  page.num = 1;
  loadList();
}

function openStatusDialog(item: LostFoundItem) {
  currentItem.value = item;
  statusForm.id = item.id;
  statusForm.status = item.status;
  statusOptions.value = [
    { label: "待处理", value: "pending" },
    { label: "已解决", value: "resolved" },
  ];
  statusDialogVisible.value = true;
}

async function submitStatus() {
  saving.value = true;
  try {
    await put("/lost-found/admin/update-status", {
      id: statusForm.id,
      status: statusForm.status,
    });
    ElMessage.success("状态更新成功");
    statusDialogVisible.value = false;
    loadList();
  } catch {
    /* handled by interceptor */
  } finally {
    saving.value = false;
  }
}

async function openClaimsDrawer(item: LostFoundItem) {
  currentItem.value = item;
  claimsDrawerVisible.value = true;
  claimsLoading.value = true;
  try {
    claimRecords.value =
      (await get<LostFoundClaimRecord[]>(
        `/lost-found/admin/claims/${item.id}`,
      )) ?? [];
  } catch {
    /* handled by interceptor */
  } finally {
    claimsLoading.value = false;
  }
}

async function handleDelete(item: LostFoundItem) {
  try {
    await ElMessageBox.confirm(`确认删除“${item.title}”吗？`, "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
    await del(`/lost-found/admin/delete/${item.id}`);
    ElMessage.success("删除成功");
    loadList();
  } catch {
    // ignore cancel
  }
}

async function handleApproveClaim(claim: LostFoundClaimRecord) {
  try {
    await put(`/lost-found/admin/claims/approve/${claim.id}`);
    ElMessage.success("已通过");
    claim.status = "approved";
  } catch {
    /* handled by interceptor */
  }
}

async function handleRejectClaim(claim: LostFoundClaimRecord) {
  try {
    await put(`/lost-found/admin/claims/reject/${claim.id}`);
    ElMessage.success("已拒绝");
    claim.status = "rejected";
  } catch {
    /* handled by interceptor */
  }
}

function handleUploadSuccess(res: { code: number; data: string }) {
  if (res.code === 200) {
    uploadedImage.value = res.data;
    ElMessage.success("图片上传成功");
  } else {
    ElMessage.error("图片上传失败");
  }
}

function handleUploadRemove() {
  uploadedImage.value = "";
}

function openPublishDialog() {
  publishForm.title = "";
  publishForm.description = "";
  uploadedImage.value = "";
  publishDialogVisible.value = true;
}

async function handlePublish() {
  if (!publishForm.title.trim()) {
    ElMessage.warning("请填写标题");
    return;
  }
  if (!publishForm.description.trim()) {
    ElMessage.warning("请填写描述");
    return;
  }
  publishing.value = true;
  try {
    await post("/lost-found/admin/add", {
      title: publishForm.title,
      description: publishForm.description,
      image: uploadedImage.value || undefined,
    });
    ElMessage.success("发布成功");
    publishDialogVisible.value = false;
    loadList();
  } catch {
  } finally {
    publishing.value = false;
  }
}

function typeLabel(type: string): string {
  return type === "found" ? "招领" : "求助";
}

function statusLabel(status: string): string {
  if (status === "resolved") return "已解决";
  return "待处理";
}

function statusType(status: string): "success" | "warning" | "info" {
  if (status === "resolved") return "info";
  return "success";
}

function claimStatusLabel(status?: string): string {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已拒绝";
  return "待审核";
}

function claimStatusType(status?: string): "success" | "danger" | "warning" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

onMounted(() => {
  loadList();
});
</script>

<style scoped>
.admin-lost-found-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-card {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.filter-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14px;
}

.filter-form {
  margin-bottom: -18px;
}

.admin-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.admin-card {
  overflow: hidden;
  border-radius: 24px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.card-image-wrap {
  position: relative;
  height: 220px;
  background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%);
}

.card-image,
.empty-image {
  width: 100%;
  height: 100%;
}

.card-image {
  object-fit: cover;
  display: block;
}

.empty-image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 600;
}

.image-overlay {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overlay-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.62);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.card-body {
  padding: 20px;
}

.card-title {
  margin: 0 0 10px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.card-desc {
  min-height: 72px;
  margin: 0;
  color: #475569;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.meta-grid {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  color: #64748b;
  font-size: 13px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
}

.claim-record-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.claim-record-card {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 16px;
  background: #fff;
}

.claim-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.claim-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.claim-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.claim-time {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.claim-note {
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
