#!/bin/bash

# Playwright E2E 测试运行脚本
# 用于运行端到端自动化测试

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PATH="$(dirname "$SCRIPT_DIR")"

# 进入前端目录
cd "$FRONTEND_PATH"

echo "=== 开始运行 Playwright E2E 测试 ==="

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    log_info "正在安装依赖..."
    npm install
fi

# 检查 Playwright 浏览器是否已安装
if [ ! -d "node_modules/.playwright" ]; then
    log_info "正在安装 Playwright 浏览器..."
    npx playwright install chromium
fi

# 构建 H5 应用（确保构建就绪）
log_info "开始构建 H5 应用..."
./scripts/h5build.sh

# 验证构建结果
if [ ! -d "$FRONTEND_PATH/src/unpackage/dist/build/web" ]; then
    log_error "H5 构建失败：构建目录不存在"
    exit 1
fi
log_info "✅ H5 应用构建完成"

# 设置环境变量
export BASE_URL=${BASE_URL:-"https://localhost:8081"}
export BASE_URL_FOR_SAFEGUARD=${BASE_URL_FOR_SAFEGUARD:-"http://localhost:9999"}

log_info "配置信息:"
log_info "  Web URL: $BASE_URL"
log_info "  API URL: $BASE_URL_FOR_SAFEGUARD"

# 检查后端服务是否运行
log_info "检查后端服务..."
if ! curl -s -f "$BASE_URL_FOR_SAFEGUARD/api/count" > /dev/null 2>&1; then
    log_warn "后端服务未运行，请先启动后端服务"
    log_warn "启动命令: cd backend && ./localrun.sh"
    exit 1
fi

log_info "✅ 后端服务已运行"

# 检查 Web 服务器是否运行
log_info "检查 Web 服务器..."
if ! curl -s -k -f "$BASE_URL" > /dev/null 2>&1; then
    log_warn "Web 服务器未运行，正在启动..."

    # 启动 HTTPS Web 服务器
    ./scripts/start-h5-https.sh 8081 > /dev/null 2>&1 &
    WEB_SERVER_PID=$!

    # 等待 Web 服务器启动
    log_info "等待 Web 服务器启动..."
    sleep 5

    # 再次检查（使用 -k 忽略自签名证书警告）
    if ! curl -s -k -f "$BASE_URL" > /dev/null 2>&1; then
        log_error "Web 服务器启动失败"
        exit 1
    fi

    log_info "✅ Web 服务器已启动 (PID: $WEB_SERVER_PID)"
else
    log_info "✅ Web 服务器已运行"
fi

# 运行测试
log_info "开始运行 Playwright E2E 测试..."

# 根据参数选择运行模式
if [ "$1" = "--ui" ]; then
    # UI 模式
    log_info "使用 UI 模式运行测试"
    npx playwright test --ui
elif [ "$1" = "--debug" ]; then
    # 调试模式
    log_info "使用调试模式运行测试"
    npx playwright test --debug
elif [ "$1" = "--headed" ]; then
    # 有头模式（显示浏览器窗口）
    log_info "使用有头模式运行测试"
    npx playwright test --headed
else
    # 默认模式（无头模式）
    log_info "使用无头模式运行测试"
    npx playwright test
fi

# 检查测试结果
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    log_info "✅ 所有测试通过"
    
    # 显示测试报告
    log_info "测试报告: playwright-report/index.html"
    log_info "查看报告: npx playwright show-report"
else
    log_error "❌ 测试失败"
    
    # 显示测试报告
    log_info "测试报告: playwright-report/index.html"
    log_info "查看报告: npx playwright show-report"
fi

# 清理（如果脚本启动了 Web 服务器）
if [ ! -z "$WEB_SERVER_PID" ]; then
    log_info "停止 Web 服务器..."
    kill $WEB_SERVER_PID 2>/dev/null || true
fi

exit $TEST_RESULT