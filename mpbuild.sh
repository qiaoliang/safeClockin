#!/bin/bash

# 微信小程序构建脚本
# 动态获取当前脚本的绝对路径，并运行微信小程序构建命令

set -e  # 遇到错误时退出

echo "=== 开始微信小程序构建 ==="

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "脚本目录: $SCRIPT_DIR"

# 检查脚本目录是否以 'frontend' 结尾
if [[ ! "$SCRIPT_DIR" =~ /frontend$ ]]; then
    echo "错误: 脚本必须在以 'frontend' 结尾的目录下运行"
    echo "当前目录: $SCRIPT_DIR"
    echo "请确保脚本位于 frontend 目录中"
    exit 1
fi

# 设置前端项目路径
FRONTEND_PATH="$SCRIPT_DIR"
echo "前端项目路径: $FRONTEND_PATH"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "错误: 前端目录不存在: $FRONTEND_PATH"
    exit 1
fi

# 进入前端目录
cd "$FRONTEND_PATH"
echo "当前工作目录: $(pwd)"

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "错误: package.json 文件不存在"
    exit 1
fi

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 设置微信小程序 AppID
WX_APPID="wx55a59cbcd4156ce4"
echo "微信小程序 AppID: $WX_APPID"

# 运行微信小程序构建命令
echo "正在构建微信小程序..."
cli publish --platform mp-weixin --project "$FRONTEND_PATH" --appid "$WX_APPID"

echo "=== 微信小程序构建完成 ==="