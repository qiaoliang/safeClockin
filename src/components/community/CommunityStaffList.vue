<template>
  <view class="community-staff-list">
    <view class="section-header">
      <text class="section-title">
        社区专员列表
      </text>
      <text class="section-subtitle">
        管理社区的工作人员
      </text>
    </view>

    <!-- 搜索和筛选 -->
    <view class="search-filter-bar">
      <uni-easyinput
        v-model="searchKeyword"
        placeholder="搜索专员姓名"
        prefix-icon="search"
        clearable
      />
      <view class="filter-buttons">
        <button
          v-for="filter in filters"
          :key="filter.value"
          :class="[
            'filter-btn',
            activeFilter === filter.value ? 'filter-btn-active' : '',
          ]"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </view>
    </view>

    <!-- 专员列表 -->
    <view class="staff-list">
      <view
        v-for="staff in filteredStaff"
        :key="staff.id"
        class="staff-item"
      >
        <view class="staff-avatar">
          <image
            v-if="staff.avatar"
            :src="staff.avatar"
            class="avatar-image"
          />
          <text
            v-else
            class="avatar-placeholder"
          >
            {{ getInitials(staff.name) }}
          </text>
        </view>

        <view class="staff-info">
          <text class="staff-name">
            {{ staff.nickname }}
          </text>
          <text class="staff-role">
            {{ getRoleLabel(staff.role) }}
          </text>
        </view>
        <view class="staff-actions">
          <button
            v-if="hasEditPermission"
            class="action-btn"
            @click="editStaff(staff)"
          >
            编辑
          </button>
          <button
            v-if="hasEditPermission"
            class="action-btn remove-btn"
            @click="removeStaff(staff)"
          >
            移除
          </button>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        v-if="filteredStaff.length === 0"
        class="empty-state"
      >
        <text class="empty-text">
          {{ searchKeyword ? "未找到匹配的专员" : "暂无专员" }}
        </text>
        <button
          v-if="hasEditPermission && !searchKeyword"
          class="add-btn"
          @click="addStaff"
        >
          添加专员
        </button>
      </view>
    </view>

    <!-- 添加专员按钮 -->
    <view
      v-if="hasEditPermission && filteredStaff.length > 0"
      class="floating-add-btn"
      @click="addStaff"
    >
      <text class="add-icon">
        +
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "@/store/modules/user";

const props = defineProps({
  communityId: {
    type: [String, Number],
    required: true,
  },
});

const userStore = useUserStore();

// 数据状态
const staffList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");
const activeFilter = ref("all");

// 筛选选项
const filters = [
  { label: "全部", value: "all" },
  { label: "主管", value: "manager" },
  { label: "专员", value: "staff" },
];

// 权限检查
const hasEditPermission = computed(() => {
  // 超级管理员或社区主管可以编辑
  return userStore.isSuperAdmin || userStore.isCommunityManager;
});

// 过滤后的专员列表
const filteredStaff = computed(() => {
  let list = staffList.value;

  // 角色筛选
  if (activeFilter.value !== "all") {
    list = list.filter((staff) => staff.role === activeFilter.value);
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(
      (staff) =>
        staff.name.toLowerCase().includes(keyword) ||
        (staff.phone && staff.phone.includes(keyword))
    );
  }

  return list;
});

// 获取角色标签
const getRoleLabel = (role) => {
  const roleMap = {
    manager: "社区主管",
    staff: "社区专员",
  };
  return roleMap[role] || role;
};

// 获取姓名首字母
const getInitials = (name) => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

// 加载专员列表
const loadStaffList = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    // 这里应该调用API获取专员列表
    // 暂时使用模拟数据
    staffList.value = [
      {
        id: 1,
        name: "张三",
        role: "manager",
        phone: "13800138000",
        avatar: null,
      },
      {
        id: 2,
        name: "李四",
        role: "staff",
        phone: "13800138001",
        avatar: null,
      },
      {
        id: 3,
        name: "王五",
        role: "staff",
        phone: "13800138002",
        avatar: null,
      },
    ];
  } catch (error) {
    console.error("加载专员列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 设置筛选
const setFilter = (filter) => {
  activeFilter.value = filter;
};

// 添加专员
const addStaff = () => {
  uni.showToast({
    title: "添加专员功能开发中",
    icon: "none",
  });
};

// 编辑专员
const editStaff = (staff) => {
  uni.showToast({
    title: `编辑专员: ${staff.name}`,
    icon: "none",
  });
};

// 移除专员
const removeStaff = (staff) => {
  uni.showModal({
    title: "确认移除",
    content: `确定要移除专员"${staff.name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        // 调用API移除专员
        console.log("移除专员:", staff.id);
        uni.showToast({
          title: "移除成功",
          icon: "success",
        });
      }
    },
  });
};

onMounted(() => {
  loadStaffList();
});
</script>

<style lang="scss" scoped>
.community-staff-list {
  padding: 16px;
}

.section-header {
  margin-bottom: 20px;

  .section-title {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .section-subtitle {
    font-size: 14px;
    color: #666;
  }
}

.search-filter-bar {
  margin-bottom: 20px;

  .filter-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;

    .filter-btn {
      flex: 1;
      background-color: #f5f5f5;
      color: #666;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;

      &.filter-btn-active {
        background-color: #409eff;
        color: white;
      }
    }
  }
}

.staff-list {
  .staff-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .staff-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;

      .avatar-image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }

      .avatar-placeholder {
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
      }
    }

    .staff-info {
      flex: 1;

      .staff-name {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .staff-role {
        display: block;
        font-size: 14px;
        color: #409eff;
        margin-bottom: 2px;
      }

      .staff-phone {
        display: block;
        font-size: 12px;
        color: #666;
      }
    }

    .staff-actions {
      display: flex;
      gap: 8px;

      .action-btn {
        padding: 6px 12px;
        border: 1px solid #409eff;
        background-color: white;
        color: #409eff;
        border-radius: 4px;
        font-size: 12px;

        &.remove-btn {
          border-color: #f56c6c;
          color: #f56c6c;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;

  .empty-text {
    display: block;
    color: #999;
    margin-bottom: 20px;
  }

  .add-btn {
    background-color: #409eff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
  }
}

.floating-add-btn {
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 56px;
  height: 56px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

  .add-icon {
    font-size: 28px;
    color: white;
    font-weight: bold;
  }
}
</style>
