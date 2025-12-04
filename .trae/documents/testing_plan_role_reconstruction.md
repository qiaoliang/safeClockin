# 打卡应用角色重构测试计划

## 1. 测试目标
验证角色体系重构后的功能完整性、数据安全性和性能稳定性，确保多对多监护关系正确实现。

## 2. 测试范围

### 2.1 功能测试
- 用户双重身份切换
- 监护关系建立与解除
- 微信邀请流程
- 权限控制验证
- 时间选择组件

### 2.2 性能测试
- 并发监护关系建立
- 大数据量查询性能
- 微信API调用响应时间

### 2.3 安全测试
- 数据权限边界验证
- 越权访问防护
- SQL注入防护

## 3. 测试用例设计

### 3.1 单元测试

#### 用户服务层测试
```javascript
// 测试用户双重身份
describe('UserService', () => {
  test('should create user with dual identity by default', async () => {
    const user = await userService.create({
      wechat_openid: 'test_openid',
      wechat_name: '测试用户'
    });
    
    expect(user.roles).toContain('checker');
    expect(user.roles).toContain('guardian');
  });
  
  test('should handle multiple guardian relationships', async () => {
    const userId = 'user123';
    const rules = ['rule1', 'rule2', 'rule3'];
    const guardianId = 'guardian123';
    
    const result = await guardianshipService.createMultiple({
      userId,
      ruleIds: rules,
      guardianId
    });
    
    expect(result.success).toBe(true);
    expect(result.relationships).toHaveLength(3);
  });
});
```

#### 权限控制测试
```javascript
// 测试数据权限过滤
describe('PermissionService', () => {
  test('should filter rules based on user permissions', async () => {
    const userId = 'user123';
    const accessibleRules = await permissionService.getAccessibleRules(userId);
    
    // 验证只能访问自己的规则或作为监护人的规则
    accessibleRules.forEach(rule => {
      const hasPermission = rule.owner_id === userId || 
                           rule.guardians.includes(userId);
      expect(hasPermission).toBe(true);
    });
  });
  
  test('should prevent unauthorized access to checkin data', async () => {
    const unauthorizedUser = 'user999';
    const targetRule = 'rule123';
    
    await expect(
      checkinService.getCheckinData(unauthorizedUser, targetRule)
    ).rejects.toThrow('Permission denied');
  });
});
```

### 3.2 集成测试

#### 微信邀请流程测试
```javascript
describe('WeChat Integration', () => {
  test('should complete invitation workflow', async () => {
    // 模拟微信用户选择器
    const mockWechatUsers = [
      { openid: 'friend1', name: '好友1' },
      { openid: 'friend2', name: '好友2' }
    ];
    
    // 选择多个规则
    const selectedRules = ['rule1', 'rule2'];
    
    // 发送邀请
    const invitation = await invitationService.sendWechatInvitation({
      inviterId: 'user123',
      ruleIds: selectedRules,
      wechatUsers: mockWechatUsers
    });
    
    expect(invitation.status).toBe('sent');
    expect(invitation.invitationCode).toBeDefined();
    
    // 验证接收方
    const receiverInvitations = await invitationService.getReceivedInvitations('friend1');
    expect(receiverInvitations).toHaveLength(2); // 两个规则邀请
  });
});
```

#### 多规则多监护人场景测试
```javascript
describe('Complex Relationship Scenarios', () => {
  test('should handle multiple guardians per rule', async () => {
    const ruleId = 'rule123';
    const guardians = ['guardian1', 'guardian2', 'guardian3'];
    
    // 为单个规则添加多个监护人
    for (const guardianId of guardians) {
      await guardianshipService.create({
        ruleId,
        guardianId,
        status: 'accepted'
      });
    }
    
    const ruleGuardians = await ruleService.getGuardians(ruleId);
    expect(ruleGuardians).toHaveLength(3);
  });
  
  test('should handle user as both checker and guardian', async () => {
    const userId = 'user123';
    
    // 用户创建规则
    const myRule = await ruleService.create({
      userId,
      name: '我的打卡规则',
      checkTime: '08:00'
    });
    
    // 用户同时是其他规则的监护人
    const otherRule = 'rule456';
    await guardianshipService.create({
      ruleId: otherRule,
      guardianId: userId,
      status: 'accepted'
    });
    
    // 验证双重身份
    const myRules = await ruleService.getMyRules(userId);
    const guardianRules = await guardianshipService.getGuardianRules(userId);
    
    expect(myRules).toHaveLength(1);
    expect(guardianRules).toHaveLength(1);
  });
});
```

## 4. 性能测试方案

### 4.1 并发测试
```javascript
// 模拟1000+并发监护关系建立
describe('Performance Tests', () => {
  test('should handle 1000 concurrent guardianship creations', async () => {
    const concurrentRequests = 1000;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        guardianshipService.create({
          ruleId: `rule${i % 100}`,
          guardianId: `guardian${i % 200}`,
          status: 'pending'
        })
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const avgResponseTime = (endTime - startTime) / concurrentRequests;
    
    expect(successCount).toBeGreaterThan(950); // 成功率>95%
    expect(avgResponseTime).toBeLessThan(100); // 平均响应时间<100ms
  });
});
```

### 4.2 大数据量查询测试
```javascript
test('should handle large dataset queries efficiently', async () => {
  // 模拟10万条打卡记录
  const mockCheckins = generateMockCheckins(100000);
  await db.checkins.insertMany(mockCheckins);
  
  const userId = 'user123';
  const startTime = Date.now();
  
  // 查询用户所有打卡记录
  const results = await checkinService.getUserCheckins(userId, {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    limit: 1000
  });
  
  const queryTime = Date.now() - startTime;
  
  expect(results.data).toHaveLength(1000);
  expect(queryTime).toBeLessThan(500); // 查询时间<500ms
  expect(results.totalCount).toBeGreaterThan(0);
});
```

## 5. 安全测试

### 5.1 权限边界测试
```javascript
describe('Security Tests', () => {
  test('should prevent SQL injection in rule queries', async () => {
    const maliciousInput = "'; DROP TABLE rules; --";
    
    await expect(
      ruleService.getRulesByName(maliciousInput)
    ).resolves.not.toThrow();
    
    // 验证数据库完整性
    const tableExists = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rules')"
    );
    expect(tableExists.rows[0].exists).toBe(true);
  });
  
  test('should enforce data access boundaries', async () => {
    const user1 = 'user123';
    const user2 = 'user456';
    
    // user1创建私有规则
    const privateRule = await ruleService.create({
      userId: user1,
      name: '私有规则',
      checkTime: '08:00'
    });
    
    // user2尝试访问
    const accessibleRules = await permissionService.getAccessibleRules(user2);
    const hasAccess = accessibleRules.some(rule => rule.id === privateRule.id);
    
    expect(hasAccess).toBe(false);
  });
});
```

## 6. 测试里程碑

### 第一阶段：基础功能验证（2周）
- [ ] 数据库重构验证
- [ ] API接口测试
- [ ] 基本监护关系功能测试
- [ ] 单元测试覆盖率>80%

### 第二阶段：集成与性能（1.5周）
- [ ] 微信邀请流程测试
- [ ] 界面改造验证
- [ ] 并发性能测试
- [ ] 集成测试通过率>95%

### 第三阶段：安全与优化（1周）
- [ ] 权限控制系统测试
- [ ] 安全漏洞扫描
- [ ] 性能优化验证
- [ ] 整体回归测试

## 7. 测试环境配置

### 7.1 开发环境
- 本地Supabase实例
- 微信开发者工具
- Jest测试框架
- Artillery性能测试工具

### 7.2 预生产环境
- 线上Supabase服务
- 微信小程序测试号
- 自动化CI/CD流水线
- 监控告警系统

## 8. 验收标准

### 功能验收
- 所有核心功能正常运行
- 微信邀请成功率>90%
- 监护关系建立无数据错误
- 权限控制严格有效

### 性能验收
- API响应时间<200ms
- 并发处理能力>1000请求/秒
- 数据库查询优化有效
- 内存使用合理

### 安全验收
- 无SQL注入漏洞
- 权限边界清晰
- 数据加密传输
- 用户隐私保护合规