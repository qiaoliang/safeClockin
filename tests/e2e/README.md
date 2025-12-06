# E2E 测试指南

本指南说明如何运行 SafeGuard 前端应用的 E2E（端到端）测试。

## 概述

E2E 测试是针对真实后端服务的集成测试，用于验证前端应用与后端 API 的交互是否正常。测试会自动检查后端服务状态，并在需要时启动后端服务。

## 环境变量

### BASE_URL_FOR_SAFEGUARD

指定后端服务的 URL，这是最重要的环境变量：

```bash
# 默认值
export BASE_URL_FOR_SAFEGUARD=http://localhost:8080

# 使用其他端口
export BASE_URL_FOR_SAFEGUARD=http://localhost:9999

# 使用远程服务器
export BASE_URL_FOR_SAFEGUARD=https://your-backend-server.com
```

## 测试命令

### 自动运行 E2E 测试（推荐）

```bash
# 自动检查并启动后端服务，然后运行所有 E2E 测试
npm run test:e2e:run
```

这个命令会：
1. 检查后端服务是否已启动
2. 如果未启动，自动启动后端服务
3. 运行所有 E2E 测试
4. 测试完成后停止后端服务（如果是我们启动的）

### 直接运行 E2E 测试

```bash
# 直接运行 E2E 测试，假设后端服务已启动
npm run test:e2e:direct

# 或者使用 vitest 直接运行
vitest run --config vitest.e2e.config.js
```

### 监视模式运行 E2E 测试

```bash
# 监视模式，文件变化时自动重新运行测试
npm run test:e2e
```

## 辅助脚本

### e2e-helper.sh

用于管理后端服务的辅助脚本：

```bash
# 检查后端服务状态
./scripts/e2e-helper.sh check

# 启动后端服务
./scripts/e2e-helper.sh start

# 停止后端服务
./scripts/e2e-helper.sh stop

# 重启后端服务
./scripts/e2e-helper.sh restart

# 显示帮助信息
./scripts/e2e-helper.sh help
```

## 自定义后端服务

如果你需要使用不同的后端配置，可以通过环境变量进行设置：

```bash
# 使用自定义端口
export BACKEND_PORT=9999
export BASE_URL_FOR_SAFEGUARD=http://localhost:9999
npm run test:e2e:run

# 使用远程服务器
export BASE_URL_FOR_SAFEGUARD=https://your-backend-server.com
npm run test:e2e:run
```

## 测试文件位置

E2E 测试文件位于 `tests/e2e/` 目录：

```
tests/e2e/
├── api-business-logic.test.js
├── phone-registration-e2e.test.js
├── phone-registration-real-backend.test.js
└── userstore-unified-storage.test.js
```

## 故障排除

### 后端服务启动失败

1. 检查 Python 虚拟环境是否正确设置
2. 检查端口是否被占用
3. 检查数据库配置是否正确

```bash
# 检查端口占用
lsof -i :8080

# 手动启动后端服务查看错误
cd ../backend
source venv_py312/bin/activate
ENV_TYPE=function python3.12 run.py 0.0.0.0 8080
```

### 测试连接失败

1. 确认后端服务 URL 正确
2. 检查防火墙设置
3. 确认后端 API 端点可用

```bash
# 测试 API 连接
curl -f http://localhost:8080/api/count
```

### 权限问题

如果脚本无法执行，请检查权限：

```bash
chmod +x frontend/scripts/e2e-helper.sh
chmod +x frontend/scripts/run-e2e-tests.sh
```

## 最佳实践

1. 在运行 E2E 测试前，确保代码已提交或暂存
2. 使用干净的开发环境，避免其他服务干扰
3. 定期运行 E2E 测试以确保前后端兼容性
4. 在 CI/CD 流程中集成 E2E 测试

## 配置文件

- `vitest.e2e.config.js`: E2E 测试的 Vitest 配置
- `tests/setup.e2e.js`: E2E 测试的设置文件，包含后端服务检查逻辑