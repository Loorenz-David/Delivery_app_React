
import type { StackComponentProps } from '@/shared/stack-manager/types'

import { pageRegistry as userPageRegistry } from '@/featuresV2/user/registry/pageRegistry'
import { pageRegistry as teamPageRegistry } from '@/featuresV2/team/registry/pageRegistry'
import { pageRegistry as integrationsPageRegistry } from '@/featuresV2/integrations/registry/pageRegistry'
import { pageRegistry as itemPageRegistry } from '@/featuresV2/itemConfigurations/registry/pageRegistry'
import { pageRegistry as vehiclePageRegistry } from '@/featuresV2/infrastructure/vehicle/registry/pageRegistry'
import { pageRegistry as warehousePageRegistry } from '@/featuresV2/infrastructure/warehouse/registry/pageRegistry'
import { pageRegistry as smsMessagePageRegistry } from '@/featuresV2/messaging/smsMessage/registry/pageRegistry'
import { pageRegistry as emailMessagePageRegistry } from '@/featuresV2/messaging/emailMessage/registry/pageRegistry'
import { pageRegistry as printDocumentPageRegistry } from '@/featuresV2/templates/printDocument/registry/pageRegistry'
import { pageRegistry as messagesPageRegistry } from '@/featuresV2/messaging/registry/pageRegistry'
import { pageRegistry as externalFormPageRegistry } from '@/featuresV2/externalForm/registry/pageRegistry'
export type SectionKey = keyof typeof sectionRegistry

type ExtractPayload<T> = T extends React.ComponentType<StackComponentProps<infer P>>
  ? P
  : never

export type SettingsSectionPayloads = {
  [K in keyof typeof sectionRegistry]: ExtractPayload<(typeof sectionRegistry)[K]>
}

const PlaceholderSection = (_: StackComponentProps<undefined>) => <div />

export const sectionRegistry = {
  ...userPageRegistry,
  ...teamPageRegistry,
  ...integrationsPageRegistry,
  'settings.configuration': PlaceholderSection,
  ...smsMessagePageRegistry,
  ...emailMessagePageRegistry,
  ...printDocumentPageRegistry,
  ...messagesPageRegistry,
  ...itemPageRegistry,
  ...vehiclePageRegistry,
  ...warehousePageRegistry,
  ...externalFormPageRegistry,
}
