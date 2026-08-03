<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">楼栋管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd"
            >新增楼栋</el-button
          >
        </div>
      </template>

      <el-form :model="queryForm" inline class="filter-bar">
        <el-form-item label="楼栋名称">
          <el-input
            v-model="queryForm.name"
            placeholder="请输入楼栋名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >查询</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="building-grid">
        <div
          v-for="building in buildingList"
          :key="building.id"
          class="building-card"
          @click="handleViewDetail(building)"
        >
          <div class="building-cover-wrap">
            <img
              v-if="building.image"
              :src="building.image"
              alt="楼栋图片"
              class="building-cover"
            />
            <div v-else class="building-letter">{{ building.name }}</div>
          </div>
          <div class="building-info">
            <div class="building-name">{{ building.name }}</div>
            <div class="building-desc">
              {{ building.description || "暂无描述" }}
            </div>
            <div class="building-time">
              创建于 {{ building.createTime?.slice(0, 10) }}
            </div>
          </div>
          <div class="building-actions" @click.stop>
            <el-button type="primary" size="small" @click="handleEdit(building)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDelete(building.id)"
              >删除</el-button
            >
          </div>
        </div>

        <div v-if="!loading && buildingList.length === 0" class="empty-tip">
          <el-empty description="暂无楼栋数据" />
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="buildingForm" label-width="90px">
        <el-form-item label="楼栋图片">
          <div class="image-upload-block">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :http-request="handleBuildingImageUpload"
              :before-upload="beforeImageUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <img
                v-if="buildingForm.image"
                :src="buildingForm.image"
                alt="楼栋图片"
                class="upload-preview building-preview"
              />
              <div v-else class="upload-placeholder building-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>上传图片</span>
              </div>
            </el-upload>
            <el-button
              v-if="buildingForm.image"
              text
              type="danger"
              @click="buildingForm.image = ''"
            >
              移除图片
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="楼栋名称">
          <el-input
            v-model="buildingForm.name"
            placeholder="请输入楼栋名称，如 A 或 图书馆1号"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="楼栋描述">
          <el-input
            v-model="buildingForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入楼栋描述（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- 楼栋详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`${currentBuilding?.name} — 详细信息`"
      size="600px"
      direction="rtl"
    >
      <template v-if="currentBuilding">
        <!-- 编辑模式开关 -->
        <div style="text-align: right; margin-bottom: 16px">
          <el-button
            v-if="!isDrawerEdit"
            type="primary"
            size="small"
            :icon="Edit"
            @click="isDrawerEdit = true"
          >
            编辑
          </el-button>
          <el-button v-else size="small" @click="cancelDrawerEdit">
            取消
          </el-button>
        </div>

        <!-- 楼栋基本信息（查看模式） -->
        <el-descriptions
          v-if="!isDrawerEdit"
          :column="2"
          border
          class="detail-desc"
        >
          <el-descriptions-item label="楼栋图片" :span="2">
            <img
              v-if="currentBuilding.image"
              :src="currentBuilding.image"
              alt="楼栋图片"
              class="detail-building-image"
            />
            <el-empty v-else description="暂无楼栋图片" :image-size="60" />
          </el-descriptions-item>
          <el-descriptions-item label="楼栋编号">{{
            currentBuilding.id
          }}</el-descriptions-item>
          <el-descriptions-item label="楼栋名称">{{
            currentBuilding.name
          }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{
            currentBuilding.createTime
          }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{
            currentBuilding.description || "暂无描述"
          }}</el-descriptions-item>
        </el-descriptions>

        <!-- 楼栋基本信息（编辑模式） -->
        <el-form
          v-else
          :model="drawerForm"
          label-width="90px"
          class="drawer-form"
        >
          <el-form-item label="楼栋图片">
            <div class="image-upload-block">
              <el-upload
                class="image-uploader"
                :show-file-list="false"
                :http-request="handleDrawerImageUpload"
                :before-upload="beforeImageUpload"
                accept="image/jpeg,image/png,image/gif,image/webp"
              >
                <img
                  v-if="drawerForm.image"
                  :src="drawerForm.image"
                  alt="楼栋图片"
                  class="upload-preview drawer-preview"
                />
                <div v-else class="upload-placeholder drawer-placeholder">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <span>上传图片</span>
                </div>
              </el-upload>
              <el-button
                v-if="drawerForm.image"
                text
                type="danger"
                @click="drawerForm.image = ''"
              >
                移除图片
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="楼栋名称">
            <el-input
              v-model="drawerForm.name"
              placeholder="请输入楼栋名称，如 A 或 图书馆 1 号"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="楼栋描述">
            <el-input
              v-model="drawerForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入楼栋描述（选填）"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="drawerSaveLoading"
              @click="handleDrawerSave"
            >
              保存
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 自习室列表 -->
        <div class="room-section">
          <div class="room-section-title">
            <el-icon><OfficeBuilding /></el-icon>
            <span>关联自习室列表</span>
            <el-tag size="small" type="info" style="margin-left: 8px"
              >共 {{ roomList.length }} 间</el-tag
            >
          </div>

          <div v-loading="roomLoading">
            <el-table
              v-if="roomList.length > 0"
              :data="roomList"
              border
              stripe
              size="small"
              style="margin-top: 12px"
            >
              <el-table-column
                prop="roomNo"
                label="自习室编号"
                width="90"
                align="center"
              />
              <el-table-column label="座位数" align="center" width="80">
                <template #default="{ row }">
                  {{ row.capacity }}
                </template>
              </el-table-column>
              <el-table-column
                prop="openTime"
                label="开放时段"
                align="center"
              />
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === 'enabled' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.status === "enabled" ? "启用" : "禁用" }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else-if="!roomLoading" description="该楼栋暂无自习室" />
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  Plus,
  OfficeBuilding,
  Edit,
  Search,
  Refresh,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import type { UploadRawFile, UploadRequestOptions } from "element-plus";

const BASE_URL = "/api";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface Building {
  id: number;
  name: string;
  description: string;
  image?: string;
  createTime: string;
  updateTime?: string;
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

const buildingList = ref<Building[]>([]);
const loading = ref(false);
const saveLoading = ref(false);
const queryForm = reactive({ name: "" });

// 新增/编辑弹窗
const dialogVisible = ref(false);
const dialogTitle = ref("新增楼栋");
const isEdit = ref(false);
const editId = ref<number | null>(null);
const buildingForm = reactive({ name: "", description: "", image: "" });

// 详情抽屉
const drawerVisible = ref(false);
const currentBuilding = ref<Building | null>(null);
const roomList = ref<Room[]>([]);
const roomLoading = ref(false);
const isDrawerEdit = ref(false);
const drawerForm = reactive({ id: 0, name: "", description: "", image: "" });
const drawerSaveLoading = ref(false);

async function fetchList() {
  loading.value = true;
  try {
    const res = await axios.get(`${BASE_URL}/building/list`, {
      params: {
        pageNum: 1,
        pageSize: 1000,
        name: queryForm.name.trim(),
      },
    });
    if (res.data.code === 200) {
      buildingList.value =
        res.data.data.list ?? res.data.data.records ?? res.data.data;
      }
    } catch {
  } finally {
    loading.value = false;
  }
}

async function fetchRoomsByBuilding(buildingName: string) {
  roomLoading.value = true;
  roomList.value = [];
  try {
    const res = await axios.get(`${BASE_URL}/room/list`, {
      params: { pageNum: 1, pageSize: 1000, building: buildingName },
    });
    if (res.data.code === 200) {
      roomList.value =
        res.data.data.list ?? res.data.data.records ?? res.data.data;
      }
    } catch {
  } finally {
    roomLoading.value = false;
  }
}

onMounted(() => {
  fetchList();
});

function handleSearch() {
  fetchList();
}

function handleReset() {
  queryForm.name = "";
  fetchList();
}

function handleViewDetail(building: Building) {
  currentBuilding.value = building;
  drawerVisible.value = true;
  isDrawerEdit.value = false;
  // 初始化抽屉编辑表单
  Object.assign(drawerForm, {
    id: building.id,
    name: building.name,
    description: building.description ?? "",
    image: building.image ?? "",
  });
  fetchRoomsByBuilding(building.name);
}

function cancelDrawerEdit() {
  isDrawerEdit.value = false;
  Object.assign(drawerForm, { id: 0, name: "", description: "", image: "" });
}

async function handleDrawerImageUpload(options: UploadRequestOptions) {
  try {
    const imageUrl = await uploadImage(options.file);
    drawerForm.image = imageUrl;
    ElMessage.success("楼栋图片上传成功");
    options.onSuccess?.(imageUrl as never);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const uploadError = {
      name: "UploadError",
      message: err.message || "楼栋图片上传失败",
      status: 500,
      method: "post",
      url: `${BASE_URL}/upload/image`,
    } as Parameters<NonNullable<UploadRequestOptions["onError"]>>[0];
    options.onError?.(uploadError);
  }
}

async function handleDrawerSave() {
  if (!drawerForm.name.trim()) {
    ElMessage.warning("楼栋名称不能为空");
    return;
  }
  drawerSaveLoading.value = true;
  try {
    const body = {
      id: drawerForm.id,
      name: drawerForm.name.toUpperCase(),
      description: drawerForm.description,
      image: drawerForm.image,
    };

    const res = await axios.put(`${BASE_URL}/building/update`, body);
    if (res.data.code === 200) {
      ElMessage.success("更新成功");
      isDrawerEdit.value = false;
      fetchList();
      // 更新当前抽屉显示的数据
      if (currentBuilding.value) {
        currentBuilding.value.name = drawerForm.name.toUpperCase();
        currentBuilding.value.description = drawerForm.description;
        currentBuilding.value.image = drawerForm.image;
      }
      }
    } catch { /* handled by interceptor */ } finally {
    drawerSaveLoading.value = false;
  }
}

function handleAdd() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "新增楼栋";
  Object.assign(buildingForm, { name: "", description: "", image: "" });
  dialogVisible.value = true;
}

function handleEdit(row: Building) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = "编辑楼栋";
  Object.assign(buildingForm, {
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
  });
  dialogVisible.value = true;
}

function beforeImageUpload(file: UploadRawFile) {
  const isValidType = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ].includes(file.type);
  if (!isValidType) {
    ElMessage.error("仅支持 JPG、PNG、GIF、WEBP 图片");
    return false;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    ElMessage.error("图片大小不能超过 5MB");
    return false;
  }
  return true;
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${BASE_URL}/upload/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res.data.code !== 200) {
    throw new Error(res.data.message || "上传失败");
  }
  return res.data.data as string;
}

async function handleBuildingImageUpload(options: UploadRequestOptions) {
  try {
    const imageUrl = await uploadImage(options.file);
    buildingForm.image = imageUrl;
    ElMessage.success("楼栋图片上传成功");
    options.onSuccess?.(imageUrl as never);
  } catch (error: unknown) {
    const err = error as { message?: string };
    const uploadError = {
      name: "UploadError",
      message: err.message || "楼栋图片上传失败",
      status: 500,
      method: "post",
      url: `${BASE_URL}/upload/image`,
    } as Parameters<NonNullable<UploadRequestOptions["onError"]>>[0];
    options.onError?.(uploadError);
  }
}

async function handleSave() {
  if (!buildingForm.name.trim()) {
    ElMessage.warning("楼栋名称不能为空");
    return;
  }
  saveLoading.value = true;
  try {
    const body = isEdit.value
      ? {
          id: editId.value,
          name: buildingForm.name.toUpperCase(),
          description: buildingForm.description,
          image: buildingForm.image,
        }
      : {
          name: buildingForm.name.toUpperCase(),
          description: buildingForm.description,
          image: buildingForm.image,
        };

    const res = isEdit.value
      ? await axios.put(`${BASE_URL}/building/update`, body)
      : await axios.post(`${BASE_URL}/building/add`, body);

    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? "更新成功" : "新增成功");
      dialogVisible.value = false;
      fetchList();
    }
  } catch {
  } finally {
    saveLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(
    "确认删除该楼栋吗？该楼栋下的所有自习室、座位及预约数据将被一并删除，此操作不可撤销。",
    "提示",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    },
  );
  try {
    const res = await axios.delete(`${BASE_URL}/building/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      fetchList();
      }
    } catch {
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

/* 行列式网格 */
.filter-bar {
  margin-bottom: 16px;
}

.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 8px 0;
}

.building-card {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 20px 18px 14px;
  cursor: pointer;
  transition:
    box-shadow 0.25s,
    border-color 0.25s,
    transform 0.15s;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.building-cover-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}

.building-cover {
  width: 100%;
  height: 140px;
  border-radius: 12px;
  object-fit: cover;
}

.building-card:hover {
  box-shadow: 0 4px 18px rgba(64, 158, 255, 0.18);
  border-color: #409eff;
  transform: translateY(-2px);
}

.building-letter {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: #fff;
  font-size: 30px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.image-upload-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-preview {
  display: block;
  object-fit: cover;
  border-radius: 12px;
}

.building-preview {
  width: 180px;
  height: 112px;
}

.upload-placeholder {
  border: 1px dashed #cdd0d6;
  color: #8c8f99;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
}

.building-placeholder {
  width: 180px;
  height: 112px;
}

.upload-icon {
  font-size: 20px;
}

.detail-building-image {
  width: 100%;
  max-width: 360px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

.building-info {
  text-align: center;
  width: 100%;
}
.building-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.building-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  margin: 0 auto;
}
.building-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.building-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.empty-tip {
  grid-column: 1 / -1;
  padding: 40px 0;
  text-align: center;
}

/* 抽屉内容 */
.detail-desc {
  margin-bottom: 24px;
}

.drawer-form {
  margin-bottom: 24px;
}

.drawer-preview {
  width: 180px;
  height: 112px;
}

.drawer-placeholder {
  width: 180px;
  height: 112px;
}

.room-section {
  margin-top: 8px;
}
.room-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}
</style>
