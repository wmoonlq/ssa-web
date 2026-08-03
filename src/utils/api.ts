/**
 * 统一的 API 请求处理工具
 * 解决分页数据字段不统一问题（list/records）
 */

import axios, { type AxiosResponse } from "axios";
import { ElMessage } from "element-plus";

/**
 * 基础响应结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页数据结果
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

/**
 * 提取分页数据
 * 后端统一使用 records 字段
 */
export function extractPageData<T>(response: AxiosResponse): PageResult<T> {
  const data = response?.data?.data;

  if (!data) {
    return {
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      pages: 0,
    };
  }

  // 后端统一返回 records 字段
  return {
    list: data.records ?? [],
    total: data.total ?? 0,
    pageNum: data.pageNum ?? 1,
    pageSize: data.pageSize ?? 10,
    pages: data.pages ?? 0,
  };
}

/**
 * 提取非分页数据
 */
export function extractData<T>(response: AxiosResponse): T | null {
  return response?.data?.data ?? null;
}

/**
 * 检查响应是否成功
 */
export function isSuccess(response: AxiosResponse): boolean {
  return response?.data?.code === 200;
}

/**
 * 获取错误消息
 */
export function getErrorMessage(response: AxiosResponse): string {
  return response?.data?.message ?? "操作失败";
}

// 基础请求配置
const request = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.set("Authorization", token);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器 - 统一提取后端错误信息并弹窗
request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.code !== 200) {
      ElMessage.error(data.message || "操作失败");
      return Promise.reject(new Error(data.message || "操作失败"));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const msg = error.response.data?.message;
      switch (error.response.status) {
        case 401:
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("userInfo");
          window.location.href = "/login";
          return Promise.reject(error);
        case 403:
          ElMessage.error(msg || "权限不足");
          break;
        default:
          ElMessage.error(msg || "服务器内部错误");
          break;
      }
    } else if (error.code === "ECONNABORTED") {
      ElMessage.error("请求超时，请稍后重试");
    } else {
      ElMessage.error("网络连接失败，请检查网络");
    }
    return Promise.reject(error);
  },
);

/**
 * GET 请求 - 分页
 */
export async function getPage<T = any>(
  url: string,
  params?: object,
): Promise<PageResult<T>> {
  const response = await request.get(url, { params });
  if (!isSuccess(response)) {
    throw new Error(getErrorMessage(response));
  }
  return extractPageData<T>(response);
}

/**
 * GET 请求 - 非分页
 */
export async function get<T = any>(
  url: string,
  params?: object,
): Promise<T | null> {
  const response = await request.get(url, { params });
  if (!isSuccess(response)) {
    throw new Error(getErrorMessage(response));
  }
  return extractData<T>(response);
}

/**
 * POST 请求
 */
export async function post<T = any>(
  url: string,
  data?: object,
): Promise<T | null> {
  const response = await request.post(url, data);
  if (!isSuccess(response)) {
    throw new Error(getErrorMessage(response));
  }
  return extractData<T>(response);
}

/**
 * PUT 请求
 */
export async function put<T = any>(
  url: string,
  data?: object,
): Promise<T | null> {
  const response = await request.put(url, data);
  if (!isSuccess(response)) {
    throw new Error(getErrorMessage(response));
  }
  return extractData<T>(response);
}

/**
 * DELETE 请求
 */
export async function del<T = any>(
  url: string,
  params?: object,
): Promise<T | null> {
  const response = await request.delete(url, { params });
  if (!isSuccess(response)) {
    throw new Error(getErrorMessage(response));
  }
  return extractData<T>(response);
}

export default request;
