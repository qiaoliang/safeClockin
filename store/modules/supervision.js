import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'

export const useSupervisionStore = defineStore('supervision', {
  state: () => ({
    mySupervised: [],
    myGuardians: [],
    receivedInvitations: [],
    sentInvitations: [],
    loading: false
  }),
  actions: {
    async fetchMySupervised() {
      this.loading = true
      const res = await authApi.getMySupervisedUsers()
      if (res.code === 1) this.mySupervised = res.data.supervised_users || []
      this.loading = false
    },
    async fetchMyGuardians() {
      this.loading = true
      const res = await authApi.getMyGuardians()
      if (res.code === 1) this.myGuardians = res.data.guardians || []
      this.loading = false
    },
    async fetchInvitations(type = 'received') {
      const res = await authApi.getSupervisionInvitations({ type })
      if (res.code === 1) {
        if (type === 'received') this.receivedInvitations = res.data.invitations || []
        else this.sentInvitations = res.data.invitations || []
      }
    },
    async acceptInvitation(relation_id) {
      return authApi.acceptSupervisionInvitation({ relation_id })
    },
    async rejectInvitation(relation_id) {
      return authApi.rejectSupervisionInvitation({ relation_id })
    },
    async inviteSupervisor(target_openid, rule_ids = []) {
      return authApi.inviteSupervisor({ target_openid, rule_ids })
    },
    async searchUsers(nickname, limit = 10) {
      return authApi.searchUsers({ nickname, limit })
    }
  }
})
