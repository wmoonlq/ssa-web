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
          <span class="card-title">用户管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd"
            >新增用户</el-button
          >
        </div>
      </template>

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

      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        style="margin-top: 16px"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="头像" width="100" align="center">
          <template #default="{ row }">
            <el-avatar :size="44" :src="row.avatar || undefined" fit="cover">
              {{ row.name?.slice(0, 1) || "U" }}
            </el-avatar>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="210" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              plain
              @click="handleToggleStatus(row)"
              >{{ row.status === "active" ? "禁用" : "启用" }}</el-button
            >
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
      <el-form :model="userForm" label-width="90px">
        <el-form-item label="用户头像">
          <div class="image-upload-block">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :http-request="handleAvatarUpload"
              :before-upload="beforeImageUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <img
                v-if="userForm.avatar"
                :src="userForm.avatar"
                alt="头像"
                class="upload-preview avatar-preview"
              />
              <div v-else class="upload-placeholder avatar-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>上传头像</span>
              </div>
            </el-upload>
            <el-button
              v-if="userForm.avatar"
              text
              type="danger"
              @click="userForm.avatar = ''"
            >
              移除图片
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="userForm.name"
            placeholder="请输入用户名"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="管理员" value="1" />
            <el-option label="普通用户" value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Plus, Search, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
import type {
  UploadRequestOptions,
  UploadRawFile,
} from "element-plus";

const BASE_URL = "/api";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface User {
  id: number;
  name: string;
  role: string;
  violationCount: number;
  status: string;
  createTime: string;
  avatar?: string;
}

const userList = ref<User[]>([]);
const loading = ref(false);
const saveLoading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const queryForm = reactive({ name: "", role: "" });

const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const isEdit = ref(false);
const editId = ref<number | null>(null);
const userForm = reactive({ name: "", password: "", role: "2", avatar: "" });

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

onMounted(() => fetchList());

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

function handleSizeChange(val: number) {
  pageSize.value = val;
  pageNum.value = 1;
  fetchList();
}

function handleAdd() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "新增用户";
  Object.assign(userForm, { name: "", password: "", role: "2", avatar: "" });
  dialogVisible.value = true;
}

function handleEdit(row: User) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = "编辑用户";
  Object.assign(userForm, {
    name: row.name,
    password: "",
    role: row.role,
    avatar: row.avatar || "",
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

async function handleAvatarUpload(options: UploadRequestOptions) {
  try {
    const imageUrl = await uploadImage(options.file);
    userForm.avatar = imageUrl;
    ElMessage.success("头像上传成功");
    options.onSuccess?.(imageUrl as never);
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || "头像上传失败");
    const uploadError = {
      name: "UploadError",
      message: err.message || "头像上传失败",
      status: 500,
      method: "post",
      url: `${BASE_URL}/upload/image`,
    } as Parameters<NonNullable<UploadRequestOptions["onError"]>>[0];
    options.onError?.(uploadError);
  }
}

async function handleSave() {
  if (!userForm.name.trim()) {
    ElMessage.warning("用户名不能为空");
    return;
  }
  if (!isEdit.value && !userForm.password.trim()) {
    ElMessage.warning("密码不能为空");
    return;
  }
  saveLoading.value = true;
  try {
    let res;
    if (isEdit.value) {
      res = await axios.put("/api/user/admin/update", {
        id: editId.value,
        role: userForm.role,
        avatar: userForm.avatar,
      });
    } else {
      res = await axios.post("/api/user/admin/add", {
        name: userForm.name,
        password: userForm.password,
        role: userForm.role,
        avatar: userForm.avatar,
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

async function handleToggleStatus(row: User) {
  const action = row.status === "active" ? "禁用" : "启用";
  try {
    await ElMessageBox.confirm(`确认${action}用户「${row.name}」吗？`, "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    // 用户点击取消，不做任何操作
    return;
  }
  try {
    const res = await axios.put(`/api/user/admin/toggle-status/${row.id}`);
    if (res.data.code === 200) {
      ElMessage.success(`${action}成功`);
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该用户吗？", "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    // 用户点击取消，不做任何操作
    return;
  }
  try {
    const res = await axios.delete(`/api/user/admin/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      fetchList();
    }
  } catch {
    /* handled by interceptor */
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
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.image-upload-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-preview {
  display: block;
  object-fit: cover;
}

.avatar-preview {
  width: 84px;
  height: 84px;
  border-radius: 50%;
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
}

.avatar-placeholder {
  width: 84px;
  height: 84px;
  border-radius: 50%;
}

.upload-icon {
  font-size: 20px;
}
</style>
