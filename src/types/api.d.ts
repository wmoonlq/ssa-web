/**
 * API 类型定义
 * 统一前后端数据契约
 */

// ==================== 基础类型 ====================

/**
 * 通用响应结构
 */
export interface ApiResult<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
  [key: string]: any;
}

// ==================== 业务类型 ====================

// --- 用户相关 ---
export interface User {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  status?: string;
  createTime?: string;
  violationCount?: number;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

// --- 楼栋相关 ---
export interface Building {
  id: number;
  name: string;
  description?: string;
  image?: string;
  createTime?: string;
  updateTime?: string;
}

// --- 自习室相关 ---
export interface Room {
  id: number;
  buildingId: number;
  building?: string;
  buildingImage?: string;
  roomNo: string;
  capacity: number;
  openTime: string;
  status: string;
}

// --- 预约相关 ---
export interface Reservation {
  id: number;
  userId: number;
  userName?: string;
  avatar?: string;
  roomId: number;
  roomNo?: string;
  buildingName?: string;
  seatId?: number;
  seatNo?: number;
  reserveDate: string;
  startTime: string;
  endTime: string;
  status: string;
  checkinTime?: string;
  createTime?: string;
}

// --- 座位相关 ---
export interface Seat {
  id: number;
  roomId: number;
  seatNo: number;
  status: string;
  isDeleted?: number;
  createTime?: string;
  updateTime?: string;
}

// --- 反馈相关 ---
export interface Feedback {
  id: number;
  userId?: number;
  userName?: string;
  title: string;
  content: string;
  images?: string;
  status: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

// --- 报修相关 ---
export interface Repair {
  id: number;
  userId?: number;
  userName?: string;
  title: string;
  content: string;
  status: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

// --- 公告相关 ---
export interface LostFoundItem {
  id: number;
  userId?: number;
  userName?: string;
  itemType: string;
  title: string;
  description: string;
  image?: string;
  status: string;
  claimCount?: number;
  userHasClaimed?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface LostFoundClaimRecord {
  id: number;
  itemId: number;
  claimantUserId: number;
  claimantName: string;
  claimNote?: string;
  status?: string;
  itemTitle?: string;
  itemType?: string;
  itemStatus?: string;
  createTime?: string;
}

export interface Announcement {
  id: number;
  title: string;
  cover?: string;
  content: string;
  createTime?: string;
}

// --- 消息通知相关 ---
export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: number;
  createTime?: string;
  reservationId?: number;
}

// ==================== DTO/参数类型 ====================

// --- 创建预约 ---
export interface CreateReservationDTO {
  roomId: number;
  reserveDate: string;
  startTime: string;
  endTime: string;
  seatId?: number;
}

// --- 创建反馈 ---
export interface CreateFeedbackDTO {
  title: string;
  content: string;
}

// --- 创建报修 ---
export interface CreateRepairDTO {
  title: string;
  content: string;
}

// --- 创建公告 ---
export interface CreateAnnouncementDTO {
  title: string;
  content: string;
}

// --- 用户更新 ---
export interface UpdateUserDTO {
  name?: string;
  avatar?: string;
  password?: string;
}

// --- 修改密码 ---
export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

// ==================== 分页查询参数 ====================

/**
 * 通用分页参数
 */
export interface PageParams {
  pageNum?: number;
  pageSize?: number;
  [key: string]: any;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams extends PageParams {
  name?: string;
  role?: string;
  status?: string;
}

/**
 * 预约查询参数
 */
export interface ReservationQueryParams extends PageParams {
  userName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 自习室查询参数
 */
export interface RoomQueryParams extends PageParams {
  building?: string;
  roomNo?: string;
  status?: string;
}

/**
 * 反馈查询参数
 */
export interface FeedbackQueryParams extends PageParams {
  userName?: string;
  status?: string;
}

/**
 * 公告查询参数
 */
export interface AnnouncementQueryParams extends PageParams {
  keyword?: string;
}

// --- 预约规则 ---
export interface ReservationRule {
  id: number;
  maxAdvanceDays?: number;
  maxDurationHours?: number;
  maxViolationCount?: number;
  maxConcurrentReservations?: number;
  maxDailyReservations?: number;
  checkinWindowMinutes?: number;
  isEnabled?: number;
  updateTime?: string;
}

// --- 开放日历 ---
export interface RoomOpenCalendar {
  id: number;
  roomId: number;
  year: number;
  month: number;
  openDays: string;
}
