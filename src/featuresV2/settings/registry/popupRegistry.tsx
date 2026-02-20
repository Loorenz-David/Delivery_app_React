import type { StackComponentProps } from '@/shared/stack-manager/types'

import { UserEdit } from '@/featuresV2/user/popups/UserEdit/UserEdit'
import { InviteMember } from '@/featuresV2/team/popups/InviteMember/InviteMember'
import { IntegrationConfig } from '@/featuresV2/integrations/popups/IntegrationConfig/IntegrationConfig'
import { ItemTypeForm } from '@/featuresV2/itemConfigurations/popups/ItemTypeForm/ItemTypeForm'
import { ItemPropertyForm } from '@/featuresV2/itemConfigurations/popups/ItemPropertyForm/ItemPropertyForm'
import { ItemPositionForm } from '@/featuresV2/itemConfigurations/popups/ItemPositionForm/ItemPositionForm'
import { ItemStateForm } from '@/featuresV2/itemConfigurations/popups/ItemStateForm/ItemStateForm'
import { VehicleForm } from '@/featuresV2/infrastructure/vehicle/popups/VehicleForm/VehicleForm'
import { WarehouseForm } from '@/featuresV2/infrastructure/warehouse/popups/WarehouseForm/WarehouseForm'

export type SectionKey = keyof typeof popupRegistry

type ExtractPayload<T> =
  T extends React.ComponentType<StackComponentProps<infer P>>
    ? P
    : never

export type SettingsPopupsPayloads = {
  [K in keyof typeof popupRegistry]: ExtractPayload<(typeof popupRegistry)[K]>
}

const PlaceholderPopup = (_: StackComponentProps<undefined>) => <div />

export const popupRegistry = {
  'user.edit': UserEdit,
  'team.invite.create': InviteMember,
  'integrations.config': IntegrationConfig,
  'item.type.form': ItemTypeForm,
  'item.property.form': ItemPropertyForm,
  'item.position.form': ItemPositionForm,
  'item.state.form': ItemStateForm,
  'vehicle.form': VehicleForm,
  'warehouse.form': WarehouseForm,
  'settings.placeholder': PlaceholderPopup,
}
