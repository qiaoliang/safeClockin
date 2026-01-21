<!-- pages/about/about.vue -->
<template>
  <view class="about-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text
          class="back-btn"
          @click="goBack"
        >
          ←
        </text>
        <text class="header-title">
          关于我们
        </text>
      </view>
    </view>

    <!-- Logo 和名称 -->
    <view class="logo-section">
      <view class="logo-icon">
        🛡️
      </view>
      <text class="app-name">
        安全守护
      </text>
      <text class="app-slogan">
        关爱独居老人，守护生命安全
      </text>
    </view>

    <!-- 版本信息 -->
    <view class="version-section">
      <view class="version-item">
        <text class="version-label">
          当前版本
        </text>
        <text class="version-value">
          1.0.0
        </text>
      </view>
    </view>

    <!-- 应用介绍 -->
    <view class="info-section">
      <view class="section-title">
        应用介绍
      </view>
      <view class="info-content">
        <text class="info-text">
          安全守护是一款专为独居老人设计的安全监护应用，通过智能打卡、社区关怀和紧急求助等功能，为独居老人提供全方位的安全保障。
        </text>
      </view>
    </view>

    <!-- 核心功能 -->
    <view class="features-section">
      <view class="section-title">
        核心功能
      </view>
      <view class="feature-list">
        <view class="feature-item">
          <view class="feature-icon">
            ⏰
          </view>
          <view class="feature-info">
            <text class="feature-name">
              智能打卡
            </text>
            <text class="feature-desc">
              定时打卡确认安全，异常自动提醒
            </text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">
            👥
          </view>
          <view class="feature-info">
            <text class="feature-name">
              社区关怀
            </text>
            <text class="feature-desc">
              社区工作人员实时关注，及时响应
            </text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">
            🆘
          </view>
          <view class="feature-info">
            <text class="feature-name">
              紧急求助
            </text>
            <text class="feature-desc">
              一键求助功能，快速获得帮助
            </text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">
            👨‍👩‍👧
          </view>
          <view class="feature-info">
            <text class="feature-name">
              监护管理
            </text>
            <text class="feature-desc">
              家人可监督打卡状态，时刻关注
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="contact-section">
      <view class="section-title">
        联系我们
      </view>
      <view class="contact-list">
        <view class="contact-item">
          <text class="contact-label">
            客服电话
          </text>
          <text class="contact-value">
            400-123-4567
          </text>
        </view>
        <view class="contact-item">
          <text class="contact-label">
            客服邮箱
          </text>
          <text class="contact-value">
            support@anka.com
          </text>
        </view>
        <view class="contact-item">
          <text class="contact-label">
            工作时间
          </text>
          <text class="contact-value">
            周一至周日 8:00-20:00
          </text>
        </view>
      </view>
    </view>

    <!-- 法律信息 -->
    <view class="legal-section">
      <view
        class="legal-link"
        @click="showPrivacyPolicy"
      >
        隐私政策
      </view>
      <view
        class="legal-link"
        @click="showTerms"
      >
        服务条款
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="footer-section">
      <text class="copyright">
        © 2026 安全守护 All Rights Reserved
      </text>
    </view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack();
};

const showPrivacyPolicy = () => {
  uni.showModal({
    title: "隐私政策",
    content: "我们重视您的隐私保护，仅收集必要的信息以提供服务。详细内容请访问我们的官网查看完整隐私政策。",
    showCancel: false,
  });
};

const showTerms = () => {
  uni.showModal({
    title: "服务条款",
    content: "使用本应用即表示您同意我们的服务条款。请合理使用应用功能，遵守相关法律法规。",
    showCancel: false,
  });
};
</script>

<style lang="scss" scoped>
.about-container {
  min-height: 100vh;
  background-color: #FAE9DB;
  padding-bottom: 40rpx;
}

.header-section {
  padding: 20rpx 30rpx;
  background-color: #FAE9DB;
}

.header-content {
  display: flex;
  align-items: center;
  position: relative;
  height: 44rpx;
}

.back-btn {
  font-size: 36rpx;
  color: #624731;
  padding: 0 10rpx;
}

.header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: bold;
  color: #624731;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx 40rpx;
}

.logo-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 10rpx;
}

.app-slogan {
  font-size: 26rpx;
  color: #9E8A7A;
}

.version-section {
  margin: 0 30rpx 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-label {
  font-size: 28rpx;
  color: #624731;
}

.version-value {
  font-size: 28rpx;
  color: #9E8A7A;
}

.info-section,
.features-section,
.contact-section {
  margin: 0 30rpx 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 20rpx;
}

.info-content {
  line-height: 1.8;
}

.info-text {
  font-size: 28rpx;
  color: #624731;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
}

.feature-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.feature-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.feature-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #624731;
}

.feature-desc {
  font-size: 24rpx;
  color: #9E8A7A;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-label {
  font-size: 28rpx;
  color: #624731;
}

.contact-value {
  font-size: 28rpx;
  color: #F48224;
}

.legal-section {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin: 0 30rpx 30rpx;
}

.legal-link {
  font-size: 26rpx;
  color: #F48224;
  text-decoration: underline;
}

.footer-section {
  display: flex;
  justify-content: center;
  padding: 30rpx;
}

.copyright {
  font-size: 24rpx;
  color: #9E8A7A;
}
</style>
