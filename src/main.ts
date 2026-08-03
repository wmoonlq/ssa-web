import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./styles/variables.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import axios from "axios";
import { APP_ICON, APP_NAME } from "./branding";

axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.set("Authorization", token);
  }
  return config;
});

const app = createApp(App);

const favicon =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = APP_ICON;
if (!favicon.parentNode) {
  document.head.appendChild(favicon);
}

document.title = APP_NAME;
router.afterEach(() => {
  document.title = APP_NAME;
});

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router);
app.use(ElementPlus);
app.mount("#app");
