#!/bin/bash

# Android 构建脚本
# 1. 检查/启动模拟器
# 2. 构建 H5 资源
# 3. 复制到 Android 项目
# 4. 替换 localhost 为 10.0.2.2 (Android 模拟器访问宿主机)
# 5. 准备 launcher 图标
# 6. 使用 gradle 打包并安装到模拟器

set -e  # 遇到错误时退出

echo "=== 开始 Android 构建 ==="

# 检查模拟器
echo ">>> 检查模拟器状态..."

# 可用的模拟器列表
AVD_LIST=("Pixel" "Pixel_ARM64" "Medium_Phone_API_36.1")
ANDROID_SDK="$HOME/Library/Android/sdk"

# 检查 adb devices 是否有模拟器运行
if adb devices | grep -q "device$"; then
    echo "✓ 模拟器已运行"
else
    echo "模拟器未运行，正在启动..."
    SIMULATOR_STARTED=false

    for AVD in "${AVD_LIST[@]}"; do
        echo "尝试启动: $AVD"

        # 检查是否有相同 AVD 的进程在运行，如果有则先关闭
        EMULATOR_PID=$(pgrep -f "emulator.*$AVD" 2>/dev/null || true)
        if [ -n "$EMULATOR_PID" ]; then
            echo "  发现旧进程正在运行，关闭..."
            kill $EMULATOR_PID 2>/dev/null || true
            sleep 3
        fi

        # 启动模拟器（使用 -read-only 避免冲突）
        if "$ANDROID_SDK/emulator/emulator" -avd "$AVD" -read-only &
        then
            echo "等待模拟器启动..."
            sleep 30

            # 等待 adb 连接
            MAX_WAIT=120
            WAIT_TIME=0
            while [ $WAIT_TIME -lt $MAX_WAIT ]; do
                if adb devices | grep -q "device$"; then
                    echo "✓ 模拟器已启动: $AVD"
                    SIMULATOR_STARTED=true
                    break
                fi
                sleep 5
                WAIT_TIME=$((WAIT_TIME + 5))
                echo "  等待中... ($WAIT_TIME/$MAX_WAIT)s"
            done

            if [ "$SIMULATOR_STARTED" = true ]; then
                break
            fi
        fi
    done

    if [ "$SIMULATOR_STARTED" = false ]; then
        echo ""
        echo "=========================================="
        echo "错误: 模拟器启动失败"
        echo ""
        echo "请手动启动模拟器："
        echo "1. 打开 Android Studio"
        echo "2. Device Manager -> 点击启动按钮"
        echo "3. 然后重新运行此脚本"
        echo "=========================================="
        exit 1
    fi
fi

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

# 3. 替换 Android 模拟器中的 localhost 为宿主机的 IP (仅开发环境)
if [ "$ENV_TYPE" = "func" ] || [ "$ENV_TYPE" = "unit" ]; then
    echo ""
    echo ">>> 步骤 3: 替换 URL (Android 模拟器需要 10.0.2.2 替代 localhost)..."

    # Android 模拟器访问宿主机的特殊 IP
    find "$WWW_DEST_PATH" -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i '' 's/localhost:9999/10.0.2.2:9999/g' {} \;
    find "$WWW_DEST_PATH" -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i '' 's/127\.0\.0\.1:9999/10.0.2.2:9999/g' {} \;

    echo "✓ URL 已替换为 10.0.2.2:9999 (Android 模拟器访问开发机的地址)"
else
    echo ""
    echo ">>> 步骤 3: 跳过 URL 替换 ($ENV_TYPE 环境使用真实域名)"
fi

# 4. 准备 launcher 图标
echo ""
echo ">>> 步骤 4: 准备 launcher 图标..."

RES_PATH="$ANDROID_PROJECT_PATH/src/main/res"
ICON_SOURCE="$RES_PATH/drawable/icon.png"

if [ -f "$ICON_SOURCE" ]; then
    # 创建 mipmap 目录（如果不存在）
    for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi; do
        mkdir -p "$RES_PATH/$dir"
        cp "$ICON_SOURCE" "$RES_PATH/$dir/icon.png"
    done
    echo "✓ Launcher 图标已准备"
else
    echo "警告: 未找到图标文件 $ICON_SOURCE"
fi

# 5. 使用 gradle 打包并安装
echo ""
echo ">>> 步骤 5: 构建并安装 APK..."

cd "$ANDROID_PROJECT_PATH"

# 检查 gradle 命令
GRADLE_CMD=""
if command -v gradle &> /dev/null; then
    GRADLE_CMD="gradle"
elif [ -n "$ANDROID_SDK_ROOT" ] && [ -x "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/gradle" ]; then
    GRADLE_CMD="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/gradle"
else
    echo "错误: 未找到 gradle 命令"
    echo "请确保已安装 Android SDK 或配置 ANDROID_SDK_ROOT"
    exit 1
fi

echo "使用 gradle: $GRADLE_CMD"

# 构建 debug APK 并安装到模拟器
$GRADLE_CMD assembleDebug installDebug

# 启动应用
echo ""
echo "启动应用..."
adb shell am start -n com.leadagile.safeguard/io.dcloud.PandoraEntry

echo ""
echo "=== Android 构建完成 ==="
