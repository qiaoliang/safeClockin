#!/bin/bash

# H5 HTTPS 启动脚本
# 使用自签名证书启动 HTTPS 服务器

set -e  # 遇到错误时退出

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 获取前端项目路径（脚本目录的优先级）
FRONTEND_PATH="$(dirname "$SCRIPT_DIR")"

# 进入前端目录
cd "$FRONTEND_PATH"

# 根据环境变量 ENV_TYPE 读取对应的配置文件（忽略大小写）
ENV_TYPE_LOWER=$(echo "$ENV_TYPE" | tr '[:upper:]' '[:lower:]')

# 设置默认值
DEFAULT_FORMAT="http"
DEFAULT_URL="localhost"
DEFAULT_PORT=8081

# 根据 ENV_TYPE 选择配置文件
case "$ENV_TYPE_LOWER" in
    uat)
        ENV_FILE=".env.uat"
        ;;
    func|function)
        ENV_FILE=".env.func"
        ;;
    prod)
        ENV_FILE=".env.prod"
        ;;
    *)
        ENV_FILE=""
        ;;
esac

# 如果找到配置文件，则读取配置
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    echo "✓ 加载配置文件: $ENV_FILE"
    
    # 读取配置文件中的变量
    while IFS='=' read -r key value; do
        # 跳过注释和空行
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # 去除值两端的空格
        value=$(echo "$value" | xargs)
        
        # 导出变量
        export "$key=$value"
    done < "$ENV_FILE"
    
    # 从配置文件中读取值，如果未设置则使用默认值
    FORMAT="${FORMAT:-$DEFAULT_FORMAT}"
    URL="${URL:-$DEFAULT_URL}"
    DEFAULT_PORT="${PORT:-$DEFAULT_PORT}"
else
    echo "⚠️  未找到配置文件: ${ENV_FILE:-.env.*}"
    echo "   使用默认配置"
    FORMAT="$DEFAULT_FORMAT"
    URL="$DEFAULT_URL"
fi

PORT="${1:-$DEFAULT_PORT}"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 检查是否已经有证书
CERT_DIR="certs"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "证书不存在，正在生成自签名证书..."
    mkdir -p "$CERT_DIR"
    
    # 生成自签名证书（有效期365天）
    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -days 365 \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=SafeGuard/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1"
    
    echo "✓ 证书已生成"
    echo "  证书文件: $CERT_FILE"
    echo "  密钥文件: $KEY_FILE"
    echo ""
    echo "⚠️  注意：这是自签名证书，浏览器会显示安全警告，这是正常的"
    echo "   可以点击'高级' -> '继续访问 localhost' 来继续"
else
    echo "✓ 证书已存在"
fi

# 启动 HTTPS 服务器
echo "=========================================="
echo "启动 H5 $FORMAT 服务器"
echo "=========================================="
echo ""
echo "环境类型: ${ENV_TYPE:-func}"
echo "访问地址："
echo "  $FORMAT://$URL:$PORT"
echo ""
if [ "$FORMAT" = "https" ]; then
    echo "⚠️  浏览器会显示安全警告（自签名证书）"
    echo "   请点击'高级' -> '继续访问 $URL' 来继续"
    echo ""
fi
echo "按 Ctrl+C 停止服务器"
echo "=========================================="
echo ""

# 使用 http-server 包启动 HTTPS 服务器
BUILD_DIR="$FRONTEND_PATH/src/unpackage/dist/build/web"

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
    echo "错误: 构建目录不存在: $BUILD_DIR"
    echo "请先运行构建命令: ./scripts/h5build.sh"
    exit 1
fi

# 检查构建目录中是否有 index.html
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "错误: 构建目录中未找到 index.html"
    echo "构建目录: $BUILD_DIR"
    exit 1
fi

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
        echo "  ./scripts/start-h5-https.sh 8082"
        exit 1
    fi
fi

echo "启动 HTTPS 服务器..."
echo "构建目录: $BUILD_DIR"
echo ""

# 检查是否安装了 http-server
if ! command -v http-server &> /dev/null; then
    echo "正在安装 http-server..."
    npm install -g http-server
fi

# 使用 http-server 启动 HTTPS 服务器
http-server "$BUILD_DIR" \
    --port $PORT \
    --ssl \
    --cert "$CERT_FILE" \
    --key "$KEY_FILE" \
    -c-1 \
    -o
