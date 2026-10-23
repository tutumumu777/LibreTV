# 精选源配置

`sources.example.json` 是一份可直接使用的源清单，格式为 LibreTV-SourceList v2，包含：

- **点播源 15 个**（Apple CMS 采集站，2026-10-22 实测可用）
- **直播源 4 个**（M3U 播放列表，2026-10-23 抽样可达率 24%–95%）

## 用法一：部署时预置（推荐）

把两个数组分别写进 `.env.local`：

```bash
DEFAULT_SOURCES=[...]        # 对应 sources 数组
DEFAULT_LIVE_SOURCES=[...]   # 对应 liveSources 数组
```

不想手抄可以用这条命令直接生成两行配置：

```bash
node -e "const c=require('./config/sources.example.json');console.log('DEFAULT_SOURCES='+JSON.stringify(c.sources));console.log('DEFAULT_LIVE_SOURCES='+JSON.stringify(c.liveSources))"
```

重启服务后，点播源会出现在「设置 → 源管理 → 点播源」，直播源出现在 `/live` 页。

## 用法二：作为数据源订阅

把本文件放到任意公网可访问的地址（本仓库的 raw 地址即可），然后：

**设置 → 源管理 → 数据源订阅 → 填入地址 → 订阅**

订阅由服务端拉取，不受浏览器 CORS 限制；首次订阅会自动勾选点播源、启用直播源，之后每 24 小时静默刷新。订阅来源的条目在界面上带「订阅」标识，单独修改会在下次同步时被覆盖。

## 注意

- 采集站和直播列表变动频繁，失效的源可以在设置里「批量测活」后移除；直播列表可用 `scripts/check-live-source.mjs` 预先抽样检测。
- 订阅按 URL 去重，重复添加不会产生重复条目。
- 本项目不存储、不制作任何视频内容，仅聚合第三方公开接口，内容合法性由对应来源负责。
