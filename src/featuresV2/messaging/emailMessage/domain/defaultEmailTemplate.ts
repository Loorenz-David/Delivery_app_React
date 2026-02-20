import { normalizeTemplateValue } from '@/featuresV2/templates/utils'
import type { EmailTemplateValue } from '../types'

const createDefaultEmailTemplate = (): EmailTemplateValue => ({
  header: normalizeTemplateValue(undefined),
  body: normalizeTemplateValue(undefined),
  footerButtons: [],
})

export const DEFAULT_EMAIL_TEMPLATE = createDefaultEmailTemplate()
