import { LIMITS } from '@/config/event'
import { matchesTeam } from '@/domain/teamSearch'
import { ServiceError, type AdminService } from '../types'
import { activeTeams, clone, db } from './db'
import { delay } from './scenario'

export const mockAdminService: AdminService = {
  async getStats() {
    await delay()
    const active = activeTeams()
    return {
      registeredTeams: active.length,
      maximumTeams: db.settings.maximumTeams,
      participants: active.length * LIMITS.teamSize,
      slotsRemaining: Math.max(0, db.settings.maximumTeams - active.length),
      pendingVerification: db.teams.filter((t) => t.status === 'submitted').length,
    }
  },

  async listTeams(query = {}) {
    await delay()
    return clone(db.teams.filter((t) => matchesTeam(t, query.search ?? '', query.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  async getTeam(teamId) {
    await delay()
    const team = db.teams.find((t) => t.id === teamId)
    return team ? clone(team) : null
  },

  async updateTeamStatus(teamId, status, note) {
    await delay()
    const team = db.teams.find((t) => t.id === teamId)
    if (!team) throw new ServiceError('NOT_FOUND')
    team.status = status
    team.adminNote = status === 'rejected' ? note?.trim() || undefined : undefined
    return clone(team)
  },

  async getSettings() {
    await delay()
    return { ...db.settings, registeredTeams: activeTeams().length }
  },

  async setRegistrationOpen(open) {
    await delay()
    db.settings.registrationOpen = open
  },

  async listOrphanUploads() {
    await delay()
    return []
  },

  async removeUploads() {
    await delay()
  },
}
