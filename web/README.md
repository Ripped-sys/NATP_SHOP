# NATP 乐队官网与数据库商店

本站将乐队首页、STORE、购物车与订单串联。首页素材和页面来自 NATP-band-website 的 f022691 版本；原生 HarmonyOS 工程保持不变。17 件商品复用原生工程的本地图片，必须保留仓库中的 entry/src/main/resources/base/media 目录。

## 本地启动

需要 Node.js 22.17 或更新的 22.x。使用 Node 自带 SQLite，启动时出现 ExperimentalWarning 属正常提示。

```powershell
cd web
npm ci
npm start
```

- 首页：http://localhost:3000
- 商店：http://localhost:3000/shop.html
- 健康检查：http://localhost:3000/api/health

首次启动自动创建 web/.data/store.sqlite，初始化商品。重启不覆盖库存与订单。开发环境密钥自动生成在 web/.data/encryption.key。这些文件均被 Git 忽略。

只有界面语言保存在浏览器 localStorage。购物车、收藏、地址、订单均由服务器数据库保存；服务不可用时明确报错，不回退为假成功。

## 数据与业务范围

SQLite 表包含 products、sessions、cart_items、favorites、addresses、orders、order_items、metadata。金额按分计算，订单保留名称、图片与成交单价快照。结算在事务中校验购物车、价格与库存，并扣库存、保存订单、清空购物车；立即购买保留原购物车。相同幂等键重试只生成一个订单。

目前是访客演示商城：HttpOnly Cookie 标识访客，有效期 30 天，同一浏览器刷新和服务器重启后仍能查看订单。清除 Cookie、换浏览器或到期后不能恢复原访客数据。尚无跨设备账号、管理员后台或真实支付；“付款成功”是明确标注的模拟付款，订单进入待收货，不发生扣款和物流操作。删除访客数据会删除其订单记录，但不回补库存。

收货信息采用 AES-256-GCM 加密保存。数据库不得公开下载，密钥不要提交 Git。Cookie、同源检查、CSRF 校验、数量校验、请求限流和数据库事务已实现，但这仍是课程演示项目，正式经营需要补全账号、订单运营、退款和支付服务。

## 公网部署

GitHub Pages 只能托管静态内容，无法执行本项目的 Node 服务。需要支持 Node.js 22.x 的主机、持久磁盘及 HTTPS 反向代理。运行整个站点可使首页与 STORE 保持同源；也可以保留现有乐队官网，将其 STORE 链接指向部署后的商店完整地址。

可复制 .env.example 为 .env。生产环境必须设置：

- NODE_ENV=production
- PUBLIC_ORIGIN：实际 HTTPS 域名的源地址，例如 https://shop.example.com，不包含路径。
- DATA_ENCRYPTION_KEY：自行生成的 64 位十六进制密钥，作为服务器秘密配置。
- DATABASE_PATH：持久磁盘上的数据库绝对路径。
- HOST、PORT：默认 127.0.0.1:3000，配合反向代理。

密钥生成命令：`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`。不要把生成结果写进仓库。迁移开发数据时必须保留其原密钥，不能为现有数据库更换随机密钥。

本站从域名根目录运行，API 路径为 /api/*。反向代理转发至 Node 服务；不需要启用跨域访问。运行目录要包含 web/public 和原生商品素材目录。不要将数据库放在 public 内。

备份前停止服务，将数据库及可能存在的 -wal/-shm 文件一起备份，并独立安全保管同一加密密钥；恢复时同样停止服务。不能仅复制运行中的主数据库文件。默认访客数据在到期后新建访客时清理，长期运行可另设维护任务。

## 主要代码

- server/app.mjs：HTTP 路由、安全校验和静态资源服务。
- server/store.mjs：SQLite 表、加密、购物车和订单事务。
- server/catalog-seed.mjs：首次建库商品数据；更改此文件不会覆盖已有数据库。
- public/shop.js：双语界面、API 调用及结算重试。
- tests：接口与真实浏览器端到端测试。

服务器没有第三方运行时依赖；npm 安装的依赖用于 Playwright 测试。
