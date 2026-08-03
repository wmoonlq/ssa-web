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
          <span class="card-title">公告管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd"
            >发布公告</el-button
          >
        </div>
      </template>

      <el-form :model="queryForm" inline style="margin-bottom: 16px">
        <el-form-item label="公告标题">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入标题关键字"
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

      <div v-loading="loading" class="notice-grid">
        <div
          v-for="item in noticeList"
          :key="item.id"
          class="notice-card"
          @click="handleEdit(item)"
        >
          <div class="notice-cover">
            <el-image
              v-if="item.cover"
              :src="item.cover"
              fit="cover"
              style="width: 100%; height: 100%"
            />
            <div v-else class="notice-cover-placeholder">
              <el-icon size="32" color="#c0c4cc"><Picture /></el-icon>
            </div>
          </div>
          <div class="notice-info">
            <div class="notice-title">{{ item.title }}</div>
            <div class="notice-meta">{{ item.createTime }}</div>
          </div>
          <el-button
            class="notice-delete"
            type="danger"
            size="small"
            circle
            :icon="Delete"
            @click.stop="handleDelete(item.id)"
          />
        </div>
        <el-empty
          v-if="!loading && noticeList.length === 0"
          description="暂无公告"
          style="grid-column: 1/-1"
        />
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="780px"
      destroy-on-close
    >
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            action="/api/upload/image"
            :show-file-list="false"
            accept="image/*"
            :on-success="onCoverSuccess"
            :headers="uploadHeaders"
          >
            <el-image
              v-if="noticeForm.cover"
              :src="noticeForm.cover"
              style="
                width: 120px;
                height: 80px;
                object-fit: cover;
                cursor: pointer;
              "
            />
            <el-button v-else size="small">点击上传封面</el-button>
          </el-upload>
          <el-button
            v-if="noticeForm.cover"
            link
            type="danger"
            style="margin-left: 8px"
            @click="noticeForm.cover = ''"
            >移除</el-button
          >
        </el-form-item>
        <el-form-item label="内容">
          <div style="border: 1px solid #ccc; width: 100%">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              style="border-bottom: 1px solid #ccc"
            />
            <Editor
              v-model="noticeForm.content"
              :defaultConfig="editorConfig"
              style="height: 300px; overflow-y: hidden"
              @onCreated="handleEditorCreated"
            />
          </div>
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
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  shallowRef,
} from "vue";
import {
  Plus,
  Search,
  Refresh,
  Delete,
  Picture,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
// @ts-ignore
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import type { IDomEditor } from "@wangeditor/editor";
import "@wangeditor/editor/dist/css/style.css";

interface Notice {
  id: number;
  title: string;
  cover: string;
  content: string;
  createTime: string;
}

const noticeList = ref<Notice[]>([]);
const loading = ref(false);
const saveLoading = ref(false);
const queryForm = reactive({ keyword: "" });
const pagination = reactive({ pageNum: 1, pageSize: 12, total: 0 });
const dialogVisible = ref(false);
const dialogTitle = ref("发布公告");
const isEdit = ref(false);
const editId = ref<number | null>(null);
const noticeForm = reactive({ title: "", cover: "", content: "" });

// wangEditor
const editorRef = shallowRef<IDomEditor>();
const toolbarConfig = {};
const editorConfig = {
  placeholder: "请输入公告内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: Function) {
        const formData = new FormData();
        formData.append("file", file);
        const token = sessionStorage.getItem("token") ?? "";
        const res = await axios.post("/api/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token,
          },
        });
        insertFn(res.data?.data?.url ?? res.data?.data, "", "");
      },
    },
  },
};

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

onBeforeUnmount(() => editorRef.value?.destroy());

// 上传封面时携带 token
const uploadHeaders = computed(() => {
  const token = sessionStorage.getItem("token") ?? "";
  return token ? { Authorization: token } : {};
});
onMounted(() => {
  fetchList();
});

function onCoverSuccess(res: any) {
  noticeForm.cover = res.data?.url ?? res.data ?? "";
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/announcement/admin/page", {
      params: {
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        keyword: queryForm.keyword,
      },
    });
    if (res.data.code === 200) {
      const data = res.data.data;
      noticeList.value = data.list ?? data.records ?? [];
      pagination.total = data.total ?? 0;
    }
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  fetchList();
}
function handleReset() {
  queryForm.keyword = "";
  pagination.pageNum = 1;
  fetchList();
}
function handleSizeChange(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  fetchList();
}
function handlePageChange(val: number) {
  pagination.pageNum = val;
  fetchList();
}

function handleAdd() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "发布公告";
  Object.assign(noticeForm, { title: "", cover: "", content: "" });
  dialogVisible.value = true;
}

function handleEdit(row: Notice) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = "编辑公告";
  Object.assign(noticeForm, {
    title: row.title,
    cover: row.cover ?? "",
    content: row.content,
  });
  dialogVisible.value = true;
}

async function handleSave() {
  if (!noticeForm.title.trim()) {
    ElMessage.warning("公告标题不能为空");
    return;
  }
  saveLoading.value = true;
  try {
    const payload = {
      id: editId.value,
      title: noticeForm.title,
      cover: noticeForm.cover,
      content: noticeForm.content,
    };
    const res = isEdit.value
      ? await axios.put("/api/announcement/admin/update", payload)
      : await axios.post("/api/announcement/admin/add", payload);
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? "更新成功" : "发布成功");
      dialogVisible.value = false;
      fetchList();
    }
  } catch {
    /* handled by interceptor */
  } finally {
    saveLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm("确认删除该公告吗？", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  });
  try {
    const res = await axios.delete(`/api/announcement/admin/delete/${id}`);
    if (res.data.code === 200) {
      ElMessage.success("删除成功");
      if (noticeList.value.length === 1 && pagination.pageNum > 1)
        pagination.pageNum--;
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
.notice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.notice-card {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.notice-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.notice-cover {
  width: 100%;
  height: 130px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notice-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.notice-info {
  padding: 8px 10px;
}
.notice-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.notice-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.notice-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}
.notice-card:hover .notice-delete {
  opacity: 1;
}
</style>
