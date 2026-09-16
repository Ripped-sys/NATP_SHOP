# NATP STORE / 内网穿透官方周边

使用 ArkTS + ArkUI 开发的 HarmonyOS 手机端课程项目，视觉参考 NATP 乐队官网。

## 当前功能

- 中文 / English 切换，首页、周边、购物车、个人中心。
- 17 件 Mock 商品、本地图片、分类、详情、收藏、尺码与数量选择。
- 演示登录 / 注册、收货地址、购物车结算与立即购买。
- 模拟付款成功后进入“待收货”，不产生真实扣款或发货。

目前没有数据库和真实账号认证。业务数据保存在内存中，退出登录或重启应用后不保留。
人脸功能仅包含 HTTP 接口封装及权限声明；相机 UI、录入及识别流程尚未接通，后端地址与 APP_KEY 仍为占位符。

## 运行

在 DevEco Studio 中打开项目，安装对应 SDK，启动手机模拟器后运行 entry。
项目兼容 SDK 为 6.1.0(23)，目标 SDK 配置为 26.0.0，以 build-profile.json5 为准。
本机 SDK 路径与签名配置不随仓库上传，需要在自己的开发环境配置。

Windows 默认安装路径下，也可在项目根目录 PowerShell 运行：

```powershell
.\tools\run-emulator.ps1
```

脚本会编译、安装并启动已连接的模拟器。若 DevEco Studio 不在默认目录，请修改脚本中的 studioRoot。

## 代码

- entry/src/main/ets/pages：页面
- entry/src/main/ets/components：公共组件
- entry/src/main/ets/model：商品与会话状态
- entry/src/main/ets/data/MockProducts.ets：商品数据
- entry/src/main/ets/i18n/Strings.ets：中英文文案
- entry/src/main/ets/common：尚待接入的人脸接口封装
- entry/src/main/resources/base/media：品牌与商品素材

使用 Node.js 执行 tools/check-store.cjs 可运行状态逻辑检查。测试依赖本机 DevEco SDK 中的 TypeScript，非默认路径可设置 NATP_TYPESCRIPT_PATH。

素材来自项目提供者，仅用于本项目展示；仓库未授予第三方素材的再分发或商用许可。
