#!/bin/bash

# Android 构建脚本
# 1. 构建 H5 资源
# 2. 复制到 Android 项目
# 3. 使用 gradlew 打包并安装到模拟器

set -e  # 遇到错误时退出

echo "=== 开始 Android 构建 ==="

# 解析命令行参数
for arg in "$@"; do
    if [[ $arg =~ ^ENV_TYPE=(.+)$ ]]; then
        ENV_TYPE="${BASH_REMATCH[1]}"
    fi
done

# 验证并设置默认环境类型
VALID_ENVS=("unit" "func" "uat" "prod")

if [ -z "$ENV_TYPE" ]; then
    echo "未指定环境类型，使用默认值: func"
    ENV_TYPE="func"
else
    if [[ ! " ${VALID_ENVS[@]} " =~ " ${ENV_TYPE} " ]]; then
        echo "错误: 无效的环境类型 '$ENV_TYPE'"
        echo "支持的环境类型: ${VALID_ENVS[*]}"
        echo "使用方法: $0 ENV_TYPE=<unit|func|uat|prod>"
        exit 1
    fi
    echo "使用环境类型: $ENV_TYPE"
fi

export ENV_TYPE

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PATH="$(dirname "$SCRIPT_DIR")"

# Android 项目路径
ANDROID_PROJECT_PATH="$FRONTEND_PATH/HBuilder-Integrate-AS/simpleDemo"
WWW_DEST_PATH="$ANDROID_PROJECT_PATH/src/main/assets/apps/__UNI__AA79EBE/www"

echo "前端项目路径: $FRONTEND_PATH"
echo "Android 项目路径: $ANDROID_PROJECT_PATH"
echo "目标 www 路径: $WWW_DEST_PATH"

# 1. 构建 H5 资源
echo ""
echo ">>> 步骤 1: 构建 H5 资源..."
"$SCRIPT_DIR/h5build.sh" ENV_TYPE=$ENV_TYPE

# 2. 复制到 Android 项目
echo ""
echo ">>> 步骤 2: 复制 H5 资源到 Android 项目..."

H5_SOURCE_PATH="$FRONTEND_PATH/src/unpackage/dist/build/web"

if [ ! -d "$H5_SOURCE_PATH" ]; then
    echo "错误: H5 构建输出不存在: $H5_SOURCE_PATH"
    exit 1
fi

# 清空目标目录（保留 .gitkeep）
rm -rf "$WWW_DEST_PATH"/*
cp -R "$H5_SOURCE_PATH"/* "$WWW_DEST_PATH/"

echo "✓ H5 资源已复制到: $WWW_DEST_PATH"

# 3. 使用 gradlew 打包并安装
echo ""
echo ">>> 步骤 3: 构建并安装 APK..."

cd "$ANDROID_PROJECT_PATH"

# 检查 gradlew 权限
if [ ! -x "./gradlew" ]; then
    chmod +x ./gradlew
fi

# 构建 debug APK 并安装到模拟器
./gradlew assembleDebug installDebug

echo ""
echo "=== Android 构建完成 ==="
echo "APK 已安装到模拟器"
