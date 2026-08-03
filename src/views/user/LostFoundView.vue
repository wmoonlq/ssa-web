<template>
  <!-- 失物招领页：发布求助 + 浏览广场 + 个人记录 -->
  <div class="lost-found-page">
    <!-- ====== 发布表单 ====== -->
    <el-card class="publish-card" shadow="never">
      <div class="publish-head">
        <div class="section-title">发布求助</div>
        <div class="section-subtitle">请尽可能提供联系方式</div>
      </div>
      <el-form :model="publishForm" label-width="80px" class="publish-form">
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
        <el-form-item>
          <el-button type="primary" :loading="publishing" @click="handlePublish"
            >发布</el-button
          >
          <el-button @click="resetPublishForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ====== 内容区：三个 tab ====== -->
    <el-card class="content-card" shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 失物广场：浏览所有发布 -->
        <el-tab-pane label="失物广场" name="square">
          <div class="filter-row">
            <el-radio-group v-model="squareFilter" @change="loadSquare">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="help">求助</el-radio-button>
              <el-radio-button label="found">招领</el-radio-button>
            </el-radio-group>
          </div>
          <div v-loading="squareLoading">
            <div v-if="squareList.length" class="user-card-grid">
              <article
                v-for="item in squareList"
                :key="`square-${item.id}`"
                class="user-card"
                :class="item.itemType === 'found' ? 'found-card' : 'help-card'"
              >
                <div class="card-banner">
                  <span class="card-type">{{
                    item.itemType === "found" ? "招领" : "求助"
                  }}</span>
                  <el-tag :type="statusType(item.status)" round>{{
                    statusLabel(item.status)
                  }}</el-tag>
                </div>
                <el-image
                  v-if="item.image"
                  :src="item.image"
                  fit="cover"
                  class="card-image"
                />
                <h3 class="card-title">{{ item.title }}</h3>
                <p class="card-desc">{{ item.description }}</p>
                <div class="card-meta">
                  <span>发布人：{{ item.userName || "未知用户" }}</span>
                  <span>认领记录：{{ item.claimCount ?? 0 }}</span>
                </div>
                <div class="card-meta">
                  <span>发布时间：{{ item.createTime || "-" }}</span>
                </div>
                <div v-if="item.itemType === 'found'" class="claim-admin-hint">
                  认领请联系管理员
                </div>
                <div class="card-actions">
                  <el-button
                    v-if="item.itemType === 'found'"
                    type="success"
                    :disabled="isClaimDisabled(item)"
                    @click="openClaimDialog(item)"
                  >
                    {{ item.userHasClaimed ? "已认领" : "我要认领" }}
                  </el-button>
                  <el-tag v-else type="warning">求助中</el-tag>
                </div>
              </article>
            </div>
            <el-empty v-else description="暂无可展示内容" />
          </div>
        </el-tab-pane>

        <!-- 我的发布：仅看自己发的求助 -->
        <el-tab-pane label="我的发布" name="mine">
          <div v-loading="mineLoading">
            <div v-if="myList.length" class="user-card-grid">
              <article
                v-for="item in myList"
                :key="`mine-${item.id}`"
                class="user-card mine-card"
              >
                <div class="card-banner">
                  <span class="card-type">求助</span>
                  <el-tag :type="statusType(item.status)" round>{{
                    statusLabel(item.status)
                  }}</el-tag>
                </div>
                <el-image
                  v-if="item.image"
                  :src="item.image"
                  fit="cover"
                  class="card-image"
                />
                <h3 class="card-title">{{ item.title }}</h3>
                <p class="card-desc">{{ item.description }}</p>
                <div class="card-meta">
                  <span>认领记录：{{ item.claimCount ?? 0 }}</span>
                  <span>发布时间：{{ item.createTime || "-" }}</span>
                </div>
              </article>
            </div>
            <el-empty v-else description="暂无发布记录" />
          </div>
        </el-tab-pane>

        <!-- 我的认领：已提交的认领记录及审核状态 -->
        <el-tab-pane label="我的认领" name="claims">
          <div v-loading="claimLoading">
            <div v-if="myClaims.length" class="claim-grid">
              <article
                v-for="claim in myClaims"
                :key="claim.id"
                class="claim-card"
              >
                <div class="claim-top">
                  <span class="card-type">{{
                    claim.itemType === "found" ? "招领" : "求助"
                  }}</span>
                  <el-tag
                    :type="statusType(claim.itemStatus || 'pending')"
                    round
                  >
                    {{ statusLabel(claim.itemStatus || "pending") }}
                  </el-tag>
                </div>
                <h3 class="card-title">{{ claim.itemTitle || "未知记录" }}</h3>
                <p class="claim-note">
                  {{ claim.claimNote || "未填写认领说明" }}
                </p>
                <div class="card-meta">
                  <span>认领时间：{{ claim.createTime || "-" }}</span>
                  <el-tag
                    :type="claimAuditType(claim.status)"
                    size="small"
                    style="margin-left: 8px"
                  >
                    {{ claimAuditLabel(claim.status) }}
                  </el-tag>
                </div>
              </article>
            </div>
            <el-empty v-else description="暂无认领记录" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 认领对话框 -->
    <el-dialog v-model="claimDialogVisible" title="提交认领" width="460px">
      <el-form :model="claimForm" label-width="90px">
        <el-form-item label="认领记录">
          <div class="claim-target">{{ currentClaimItem?.title }}</div>
        </el-form-item>
        <el-form-item label="认领说明">
          <el-input
            v-model="claimForm.claimNote"
            type="textarea"
            :rows="4"
            placeholder="可填写物品特征、领取说明等信息"
          />
        </el-form-item>
        <p class="claim-hint">提交后等待管理员审核</p>
      </el-form>
      <template #footer>
        <el-button @click="claimDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="claimSubmitting"
          @click="submitClaim"
          >提交认领</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { get, getPage, post } from "@/utils/api";
import type { LostFoundClaimRecord, LostFoundItem } from "@/types/api";

// ---- 页面状态 ----
const activeTab = ref("square");
const squareFilter = ref("");
const currentUserId = ref<number | null>(null);

// ---- 发布表单 ----
const publishForm = reactive({
  title: "",
  description: "",
});
const uploadedImage = ref("");

// ---- 加载状态 ----
const publishing = ref(false);
const squareLoading = ref(false);
const mineLoading = ref(false);
const claimLoading = ref(false);
const claimSubmitting = ref(false);

// ---- 列表数据 ----
const squareList = ref<LostFoundItem[]>([]);
const myList = ref<LostFoundItem[]>([]);
const myClaims = ref<LostFoundClaimRecord[]>([]);

// ---- 认领对话框 ----
const claimDialogVisible = ref(false);
const currentClaimItem = ref<LostFoundItem | null>(null);
const claimForm = reactive({
  claimNote: "",
});

const uploadHeaders = computed(() => ({
  Authorization: sessionStorage.getItem("token") ?? "",
}));

// 从 sessionStorage 读当前登录用户 id
function initCurrentUser() {
  const raw = sessionStorage.getItem("userInfo");
  if (!raw) {
    currentUserId.value = null;
    return;
  }
  const info = JSON.parse(raw);
  currentUserId.value = info.id ?? null;
}

// ---- 图片上传 ----
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

// ---- 加载列表 ----
async function loadSquare() {
  squareLoading.value = true;
  try {
    const { list } = await getPage<LostFoundItem>("/lost-found/user/square", {
      pageNum: 1,
      pageSize: 100,
      itemType: squareFilter.value,
    });
    squareList.value = list;
  } catch {
  } finally {
    squareLoading.value = false;
  }
}

async function loadMine() {
  mineLoading.value = true;
  try {
    const { list } = await getPage<LostFoundItem>("/lost-found/user/my-page", {
      pageNum: 1,
      pageSize: 100,
    });
    myList.value = list;
  } catch {
  } finally {
    mineLoading.value = false;
  }
}

async function loadMyClaims() {
  claimLoading.value = true;
  try {
    myClaims.value =
      (await get<LostFoundClaimRecord[]>("/lost-found/user/my-claims")) ?? [];
  } catch {
  } finally {
    claimLoading.value = false;
  }
}

// ---- 发布求助 ----
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
    await post("/lost-found/user/add", {
      title: publishForm.title,
      description: publishForm.description,
      image: uploadedImage.value || undefined,
    });
    ElMessage.success("发布成功");
    resetPublishForm();
    await Promise.all([loadSquare(), loadMine()]);
  } catch {
  } finally {
    publishing.value = false;
  }
}

function resetPublishForm() {
  publishForm.title = "";
  publishForm.description = "";
  uploadedImage.value = "";
}

// ---- 认领流程 ----
function openClaimDialog(item: LostFoundItem) {
  currentClaimItem.value = item;
  claimForm.claimNote = "";
  claimDialogVisible.value = true;
}

async function submitClaim() {
  if (!currentClaimItem.value) {
    return;
  }

  claimSubmitting.value = true;
  try {
    await post("/lost-found/user/claim", {
      itemId: currentClaimItem.value.id,
      claimNote: claimForm.claimNote,
    });
    ElMessage.success("认领提交成功");
    claimDialogVisible.value = false;
    await Promise.all([loadSquare(), loadMyClaims()]);
  } catch {
  } finally {
    claimSubmitting.value = false;
  }
}

// 不可认领的情况：已解决 / 已认领过 / 自己发布的
function isClaimDisabled(item: LostFoundItem): boolean {
  return (
    item.status !== "pending" ||
    item.userHasClaimed === true ||
    item.userId === currentUserId.value
  );
}

// ---- 状态辅助函数 ----
function statusLabel(status: string): string {
  return status === "resolved" ? "已解决" : "待处理";
}

function statusType(status: string): "success" | "warning" | "info" {
  return status === "resolved" ? "info" : "success";
}

function claimAuditLabel(status?: string): string {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已拒绝";
  return "待审核";
}

function claimAuditType(status?: string): "success" | "danger" | "warning" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

// ---- 初始化 ----
onMounted(() => {
  initCurrentUser();
  loadSquare();
  loadMine();
  loadMyClaims();
});
</script>

<style scoped>
.lost-found-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.publish-card,
.content-card {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.publish-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.section-subtitle {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 13px;
}

.upload-tip {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.claim-hint {
  margin-top: -6px;
  padding-left: 90px;
  color: #94a3b8;
  font-size: 12px;
}

.filter-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.user-card-grid,
.claim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.user-card,
.claim-card {
  border-radius: 22px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.user-card.help-card {
  border-left: 4px solid #f59e0b;
}

.user-card.found-card {
  border-left: 4px solid #10b981;
}

.mine-card {
  border-left-color: #f59e0b;
}

.card-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.card-type {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6366f1;
}

.card-image {
  width: 100%;
  height: 180px;
  border-radius: 16px;
  margin-bottom: 14px;
  background: #f1f5f9;
}

.card-title {
  margin: 0 0 8px;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.card-desc {
  min-height: 44px;
  margin: 0 0 12px;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 4px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.claim-admin-hint {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.claim-card {
  border-left: 4px solid #6366f1;
}

.claim-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.claim-note {
  min-height: 36px;
  margin: 0 0 12px;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.claim-target {
  color: #111827;
  font-weight: 600;
  line-height: 1.6;
}

.publish-form {
  margin-top: 8px;
}

.claim-hint {
  margin-top: -6px;
  padding-left: 90px;
  color: #94a3b8;
  font-size: 12px;
}
</style>
