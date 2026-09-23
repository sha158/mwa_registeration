import { participantsCsv, teamsCsv } from '../csvExport'
import type { ExportService } from '../types'
import { db } from './db'
import { delay } from './scenario'

export const mockExportService: ExportService = {
  async teamsCsv() {
    await delay()
    return teamsCsv(db.teams)
  },
  async participantsCsv() {
    await delay()
    return participantsCsv(db.teams)
  },
}
