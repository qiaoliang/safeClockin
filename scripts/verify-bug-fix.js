/**
 * Bug修复验证脚本
 *
 * Bug: "我发起的邀请"显示"未知用户"和"全部规则"
 * 根本原因: 前端使用了错误的字段名 solo_user 和 rule
 * 修复: 改为使用正确的字段名 invitee_info 和 rule_info
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const supervisorManageFile = join(process.cwd(), 'src/pages/supervisor-manage/supervisor-manage.vue');

console.log('🔍 验证 Bug 修复...\n');

// 读取文件内容
const content = readFileSync(supervisorManageFile, 'utf-8');

// 检查是否使用了正确的字段
const checks = {
  hasInviteeInfo: content.includes('inv.invitee_info?.nickname'),
  hasRuleInfo: content.includes('inv.rule_info?.rule_name'),
  hasInviteeAvatar: content.includes('inv.invitee_info?.avatar_url'),
  hasCreatedAt: content.includes('formatTime(inv.created_at)'),
  noSoloUser: !content.includes('inv.solo_user'),
  noOldRule: !content.includes('inv.rule?.rule_name'),
  noOldCreateTime: !content.includes('formatTime(inv.create_time)')
};

console.log('✅ 修复验证结果:\n');

Object.entries(checks).forEach(([check, passed]) => {
  const status = passed ? '✅' : '❌';
  console.log(`  ${status} ${check}`);
});

const allChecksPassed = Object.values(checks).every(v => v);

console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('✅ Bug 修复验证成功！');
  console.log('\n修复内容:');
  console.log('  - 将 inv.solo_user?.nickname 改为 inv.invitee_info?.nickname');
  console.log('  - 将 inv.rule?.rule_name 改为 inv.rule_info?.rule_name');
  console.log('  - 将 inv.solo_user?.avatar_url 改为 inv.invitee_info?.avatar_url');
  console.log('  - 将 inv.create_time 改为 inv.created_at');
  console.log('\n现在"我发起的邀请"将正确显示:');
  console.log('  - 被邀请人的昵称（而不是"未知用户"）');
  console.log('  - 选定的规则名称（而不是"全部规则"）');
  process.exit(0);
} else {
  console.log('❌ Bug 修复验证失败！');
  process.exit(1);
}
