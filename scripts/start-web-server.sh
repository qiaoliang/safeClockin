#!/bin/bash

# Web 服务启动脚本
# 用于在构建后的 web 目录启动静态文件服务器，便于 e2e 自动化测试

set -e  # 遇到错误时退出

echo "=== 启动 Web 服务器 ==="

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "脚本目录: $SCRIPT_DIR"

# 获取前端项目路径（脚本目录的上一级）
FRONTEND_PATH="$(dirname "$SCRIPT_DIR")"
echo "前端项目路径: $FRONTEND_PATH"

# 进入前端目录
cd "$FRONTEND_PATH"
echo "当前工作目录: $(pwd)"

# 设置 web 目录路径
WEB_DIST_PATH="$FRONTEND_PATH/src/unpackage/dist/build/web"

# 检查 web 目录是否存在
if [ ! -d "$WEB_DIST_PATH" ]; then
    echo "错误: Web 构建目录不存在: $WEB_DIST_PATH"
    echo "请先运行构建命令：npm run build:h5 或 ./scripts/h5build.sh"
    exit 1
fi

echo "Web 目录: $WEB_DIST_PATH"

# 设置默认端口
PORT=${WEB_PORT:-8081}
echo "服务端口: $PORT"

# 检查端口是否已被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "警告: 端口 $PORT 已被占用"
    echo "尝试终止占用端口的进程..."

    # 查找并终止占用端口的进程
    PID=$(lsof -ti :$PORT)
    if [ -n "$PID" ]; then
        echo "终止进程 PID: $PID"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi

    # 再次检查
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "错误: 无法释放端口 $PORT"
        echo "请手动终止占用端口的进程或使用其他端口："
        echo "  WEB_PORT=8082 ./scripts/start-web-server.sh"
        exit 1
    fi
fi

# 创建日志目录
LOG_DIR="$FRONTEND_PATH/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/web-server.log"

echo "日志文件: $LOG_FILE"

# 进入 web 目录
cd "$WEB_DIST_PATH"

# 启动 Python HTTP 服务器
echo "正在启动 Web 服务器..."
echo "访问地址: http://localhost:$PORT"
echo "按 Ctrl+C 停止服务器"

# 使用 Python 3 启动 HTTP 服务器
python3 -m http.server $PORT 2>&1 | tee "$LOG_FILE"