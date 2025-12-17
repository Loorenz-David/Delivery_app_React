
import { FillUserAccount } from './FillUserAccount'
import { FillMessageTemplate } from './FillMessageTemplate'
import { FillItemState } from './FillItemState'
import { FillItemPosition } from './FillItemPosition'
import { FillItemType } from './FillItemType'
import { FillItemCategory } from './FillItemCategory'
import { FillItemProperty } from './FillItemProperty'
import LocationPickerPopup from '../../../../google_maps/components/LocationPickerPopup'

export const popupMap = {
    FillUserAccount: FillUserAccount,
    FillMessageTemplate: FillMessageTemplate,
    FillItemState,
    FillItemPosition,
    FillItemType,
    FillItemCategory,
    FillItemProperty,
    MapLocationPicker: LocationPickerPopup,
}
