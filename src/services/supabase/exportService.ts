import { participantsCsv, teamsCsv } from '../csvExport'
import type { ExportService } from '../types'
import { supabaseAdminService } from './adminService'

export const supabaseExportService: ExportService = {
  async teamsCsv() {
    return teamsCsv(await supabaseAdminService.fetchTeams())
  },
  async participantsCsv() {
    return participantsCsv(await supabaseAdminService.fetchTeams())
  },
}
