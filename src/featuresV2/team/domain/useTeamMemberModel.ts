import { normalizeEntityMap } from '@/lib/utils/entities/normalizeEntityMap'
import type { TeamMember, TeamMemberMap } from '@/featuresV2/team/members/types/teamMember'

export const useTeamMemberModel = () => ({
  normalizeTeamMember: (payload: TeamMemberMap | TeamMember | null | undefined) =>
    normalizeEntityMap<TeamMember>(payload ?? null),
})
