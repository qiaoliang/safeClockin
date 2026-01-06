<template>
  <view class="map-location-picker">
    <!-- 搜索框 -->
    <view class="search-bar">
      <input
        v-model="searchKeyword"
        class="search-input"
        placeholder="搜索地址"
        @confirm="handleSearch"
      />
      <button
        v-if="searchKeyword"
        class="clear-btn"
        @click="clearSearch"
      >
        ✕
      </button>
    </view>

    <!-- 地图组件 -->
    <map
      id="communityMap"
      class="map-container"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="mapScale"
      :show-location="true"
      :enable-traffic="false"
      :markers="markers"
      @tap="handleMapTap"
      @markertap="handleMarkerTap"
    />

    <!-- 选点标记 -->
    <view class="marker-center">
      <view class="marker-icon" />
    </view>

    <!-- 地址信息卡片 -->
    <view class="address-card">
      <view class="address-info">
        <text class="address-text">{{ selectedAddress || '请在地图上选择位置' }}</text>
        <text
          v-if="administrativeInfo"
          class="administrative-text"
        >
          {{ administrativeInfo }}
        </text>
      </view>
      <button
        class="confirm-btn"
        :disabled="!selectedAddress"
        @click="handleConfirm"
      >
        确认选择
      </button>
    </view>

    <!-- 搜索结果列表 -->
    <view
      v-if="searchResults.length > 0"
      class="search-results"
    >
      <view
        v-for="(item, index) in searchResults"
        :key="index"
        class="result-item"
        @click="selectSearchResult(item)"
      >
        <text class="result-name">{{ item.title }}</text>
        <text class="result-address">{{ item.address }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
  initialLocation: {
    type: Object,
    default: () => ({
      latitude: 39.9042,
      longitude: 116.4074
    })
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel'])

// 状态
const searchKeyword = ref('')
const mapCenter = ref({
  latitude: props.initialLocation.latitude,
  longitude: props.initialLocation.longitude
})
const mapScale = ref(16)
const markers = ref([])
const selectedLocation = ref(null)
const selectedAddress = ref('')
const administrativeInfo = ref('')
const searchResults = ref([])

// 初始化地图
onMounted(() => {
  // 获取当前位置
  getCurrentLocation()
})

// 获取当前位置
const getCurrentLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      mapCenter.value = {
        latitude: res.latitude,
        longitude: res.longitude
      }
      // 获取详细地址
      reverseGeocode(res.latitude, res.longitude)
    },
    fail: (err) => {
      console.error('获取位置失败:', err)
      uni.showModal({
        title: '定位权限说明',
        content: '需要获取您的位置信息以便选择地址。请在设置中允许应用访问您的位置信息。',
        showCancel: false,
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  // 用户已授权，重新获取位置
                  getCurrentLocation()
                }
              }
            })
          }
        }
      })
    }
  })
}

// 地图点击事件
const handleMapTap = (e) => {
  const { latitude, longitude } = e.detail
  selectedLocation.value = { latitude, longitude }

  // 更新标记
  markers.value = [
    {
      id: 1,
      latitude,
      longitude,
      iconPath: '/static/marker.png',
      width: 30,
      height: 30,
      callout: {
        content: '选中位置',
        color: '#333',
        fontSize: 12,
        borderRadius: 5,
        bgColor: '#fff',
        padding: 5
      }
    }
  ]

  // 逆地理编码获取地址
  reverseGeocode(latitude, longitude)
}

// 标记点击事件
const handleMarkerTap = (e) => {
  console.log('Marker tapped:', e.detail.markerId)
}

// 逆地理编码（坐标转地址）
const reverseGeocode = (latitude, longitude) => {
  // 使用腾讯地图逆地理编码 API
  // 注意：需要在 manifest.json 中配置腾讯地图 SDK key
  uni.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/',
    data: {
      location: `${latitude},${longitude}`,
      key: 'YOUR_TENCENT_MAP_KEY', // 需要替换为实际的腾讯地图 key
      get_poi: 1
    },
    success: (res) => {
      if (res.data.status === 0) {
        const result = res.data.result

        // 兼容新旧两种API响应格式
        if (typeof result.address === 'string') {
          // 旧格式：result.address 是字符串
          selectedAddress.value = result.address
        } else if (result.formatted_addresses && result.formatted_addresses.recommend) {
          // 新格式：result.address 是对象，地址在 formatted_addresses.recommend
          selectedAddress.value = result.formatted_addresses.recommend
        } else if (result.address_component) {
          // 备用方案：组合地址组件
          selectedAddress.value = `${result.address_component.province}${result.address_component.city}${result.address_component.district}${result.address_component.street || ''}${result.address_component.street_number || ''}`
        }

        // 提取行政区划信息
        if (result.address_component) {
          administrativeInfo.value = `${result.address_component.province}${result.address_component.city}${result.address_component.district}`
        }
      }
    },
    fail: () => {
      uni.showToast({
        title: '获取地址失败',
        icon: 'none'
      })
    }
  })
}

// 地址搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  // 使用腾讯地图地点搜索 API
  uni.request({
    url: 'https://apis.map.qq.com/ws/place/v1/search',
    data: {
      keyword: searchKeyword.value,
      boundary: 'nearby(' +
        `${mapCenter.value.latitude},${mapCenter.value.longitude},10000` +
        ')',
      key: 'YOUR_TENCENT_MAP_KEY', // 需要替换为实际的腾讯地图 key
      page_size: 10
    },
    success: (res) => {
      if (res.data.status === 0) {
        searchResults.value = res.data.data.map(item => ({
          title: item.title,
          address: item.address,
          location: {
            latitude: item.location.lat,
            longitude: item.location.lng
          },
          ad_info: item.ad_info
        }))
      }
    },
    fail: () => {
      uni.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  })
}

// 选择搜索结果
const selectSearchResult = (item) => {
  selectedLocation.value = item.location
  selectedAddress.value = item.address
  administrativeInfo.value = `${item.ad_info.province}${item.ad_info.city}${item.ad_info.district}`

  // 更新地图中心
  mapCenter.value = item.location
  mapScale.value = 17

  // 更新标记
  markers.value = [
    {
      id: 1,
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      iconPath: '/static/marker.png',
      width: 30,
      height: 30
    }
  ]

  // 清空搜索结果
  searchResults.value = []
  searchKeyword.value = ''
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 确认选择
const handleConfirm = () => {
  if (!selectedLocation.value || !selectedAddress.value) {
    uni.showToast({
      title: '请先选择位置',
      icon: 'none'
    })
    return
  }

  // 解析行政区划信息
  const province = administrativeInfo.value.substring(0, 3)
  const city = administrativeInfo.value.substring(3, 6)
  const district = administrativeInfo.value.substring(6, 9)
  const street = selectedAddress.value.replace(administrativeInfo.value, '')

  emit('confirm', {
    location: selectedAddress.value,
    location_lat: selectedLocation.value.latitude,
    location_lon: selectedLocation.value.longitude,
    province,
    city,
    district,
    street
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.map-location-picker {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.search-bar {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  z-index: 100;
  display: flex;
  align-items: center;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  padding: 0 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
}

.clear-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-lg;
  color: $uni-text-grey;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

.map-container {
  flex: 1;
  width: 100%;
}

.marker-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  pointer-events: none;
}

.marker-icon {
  width: 40rpx;
  height: 40rpx;
  background: $uni-color-primary;
  border-radius: 50%;
  border: 4rpx solid $uni-bg-color-white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.address-card {
  position: absolute;
  bottom: 40rpx;
  left: 20rpx;
  right: 20rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
  padding: 24rpx;
  z-index: 100;
}

.address-info {
  margin-bottom: 24rpx;
}

.address-text {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-text-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 12rpx;
}

.administrative-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-grey;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  @include btn-primary;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;

  &:disabled {
    opacity: 0.5;
  }
}

.search-results {
  position: absolute;
  top: 120rpx;
  left: 20rpx;
  right: 20rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-base;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  max-height: 600rpx;
  overflow-y: auto;
  z-index: 100;
}

.result-item {
  padding: 24rpx;
  border-bottom: 1rpx solid $uni-border-color;

  &:last-child {
    border-bottom: none;
  }
}

.result-name {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.result-address {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-grey;
}
</style>