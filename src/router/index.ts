import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";

// 用户端页面
import UserLayout from "@/layouts/UserLayout.vue";
import SeatQueryView from "@/views/user/SeatQueryView.vue";
import ReservationView from "@/views/user/ReservationView.vue";
import CheckinView from "@/views/user/CheckinView.vue";
import FeedbackView from "@/views/user/FeedbackView.vue";
import LostFoundView from "@/views/user/LostFoundView.vue";
import NoticeView from "@/views/user/NoticeView.vue";
import MessageView from "@/views/user/MessageView.vue";
import ProfileView from "@/views/user/ProfileView.vue";

// 管理员端页面
import AdminLayout from "@/layouts/AdminLayout.vue";
import StatisticsView from "@/views/admin/StatisticsView.vue";
import UserManageView from "@/views/admin/UserManageView.vue";
import RoomManageView from "@/views/admin/RoomManageView.vue";
import ReservationManageView from "@/views/admin/ReservationManageView.vue";
import FeedbackManageView from "@/views/admin/FeedbackManageView.vue";
import LostFoundManageView from "@/views/admin/LostFoundManageView.vue";
import NoticeManageView from "@/views/admin/NoticeManageView.vue";
import BuildingManageView from "@/views/admin/BuildingManageView.vue";
import UserMessageManageView from "@/views/admin/UserMessageManageView.vue";
import ReservationRuleView from "@/views/admin/ReservationRuleView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    // 用户端路由
    {
      path: "/user",
      component: UserLayout,
      meta: { requiresAuth: true, role: "2" },
      children: [
        { path: "", redirect: "/user/seat-query" },
        { path: "seat-query", name: "seat-query", component: SeatQueryView },
        {
          path: "reservation",
          name: "reservation",
          component: ReservationView,
        },
        { path: "checkin", name: "checkin", component: CheckinView },
        { path: "feedback", name: "feedback", component: FeedbackView },
        { path: "lost-found", name: "lost-found", component: LostFoundView },
        { path: "notice", name: "user-notice", component: NoticeView },
        { path: "message", name: "message", component: MessageView },
        { path: "profile", name: "profile", component: ProfileView },
      ],
    },
    // 管理员端路由
    {
      path: "/admin",
      component: AdminLayout,
      meta: { requiresAuth: true, role: "1" },
      children: [
        { path: "", redirect: "/admin/dashboard" },
        { path: "dashboard", name: "dashboard", component: StatisticsView },
        { path: "users", name: "users", component: UserManageView },
        { path: "rooms", name: "rooms", component: RoomManageView },
        {
          path: "reservations",
          name: "reservations",
          component: ReservationManageView,
        },
        {
          path: "feedback",
          name: "admin-feedback",
          component: FeedbackManageView,
        },
        {
          path: "lost-found",
          name: "admin-lost-found",
          component: LostFoundManageView,
        },
        { path: "notice", name: "admin-notice", component: NoticeManageView },
        { path: "buildings", name: "buildings", component: BuildingManageView },
        {
          path: "user-messages",
          name: "user-messages",
          component: UserMessageManageView,
        },
        {
          path: "reservation-rule",
          name: "reservation-rule",
          component: ReservationRuleView,
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const stored = sessionStorage.getItem("userInfo");
  const userInfo = stored ? JSON.parse(stored) : null;

  // 已登录用户访问登录页或注册页，直接跳到对应首页
  if ((to.path === "/login" || to.path === "/register") && userInfo) {
    next(userInfo.role === "1" ? "/admin" : "/user");
    return;
  }

  // 通过 matched 链检查父路由 meta，确保子路由也受保护
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRole = to.matched
    .slice()
    .reverse()
    .find((record) => record.meta.role)?.meta.role as string | undefined;

  if (requiresAuth) {
    if (!userInfo) {
      next("/login");
      return;
    }
    // 角色权限校验：角色不匹配，跳到对应角色首页
    if (requiredRole && userInfo.role !== requiredRole) {
      next(userInfo.role === "1" ? "/admin" : "/user");
      return;
    }
  }
  next();
});

export default router;
