# 前端构建脚本环境配置说明

## 环境配置规则

| 构建脚本 | ENV_TYPE | baseURL | 说明 |
|---------|----------|---------|------|
| **h5build.sh** | func/function | `http://localhost:9999` | 本地 H5 开发 |
| **h5build.sh** | prod | `https://www.leadagile.cn` | H5 生产环境 |
| **mpbuild.sh** | func/function | `http://localhost:9999` | 本地微信小程序开发 |
| **mpbuild.sh** | prod | `https://www.leadagile.cn` | 微信小程序生产环境 |
| **adrbuild-local.sh** | func/function | `10.0.2.2:9999` | Android 模拟器访问宿主机 |
| **adrbuild-local.sh** | prod | `https://www.leadagile.cn` | Android 生产环境 |

## 使用方法

```bash
# H5 构建
export ENV_TYPE=prod && ./scripts/h5build.sh

# 微信小程序构建
export ENV_TYPE=prod && ./scripts/mpbuild.sh

# Android 本地构建
export ENV_TYPE=prod && ./scripts/adrbuild-local.sh
```

## 关键说明

1. **h5build.sh 和 mpbuild.sh** 使用 `localhost` 访问本地开发服务器
2. **adrbuild-local.sh** 在 func/function 环境使用 `10.0.2.2`（Android 模拟器访问宿主机的特殊 IP）
3. 所有脚本在 prod 环境时，baseURL 都是 `https://www.leadagile.cn`（无端口号）
