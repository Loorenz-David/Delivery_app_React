export { costumerApi } from './api/costumerApi'
export { useCostumerController } from './controllers/costumer.controller'

export type {
  Costumer,
  CostumerAddress,
  CostumerPhone,
  CostumerOperatingHours,
  CostumerMap,
  CostumerStats,
  CostumerPagination,
  CostumerQueryFilters,
  CostumerCreateFields,
  CostumerCreatePayload,
  CostumerUpdateFields,
  CostumerUpdateTargetPayload,
  CostumerDeletePayload,
  CostumerListResponse,
  CostumerDetailResponse,
  CostumerCreateResponse,
  CostumerUpdateResponse,
  CostumerDeleteResponse,
} from './dto/costumer.dto'

export {
  useCostumerStore,
  clearCostumers,
} from './store/costumer.store'

export {
  useCostumers,
  useVisibleCostumers,
  useCostumerByClientId,
  useCostumerByServerId,
  selectAllCostumers,
  selectVisibleCostumers,
  selectCostumerByClientId,
  selectCostumerByServerId,
} from './store/costumer.selectors'

export {
  patchCostumerByClientId,
  patchCostumersByClientIds,
  setVisibleCostumerIds,
} from './store/costumer.patchers'

export {
  setCostumer,
  setCostumers,
  upsertCostumer,
  upsertCostumers,
  updateCostumerByClientId,
  removeCostumerByClientId,
} from './store/costumer.upserters'

export {
  useCostumerListStore,
  selectCostumerListStats,
  selectCostumerListPagination,
  selectCostumerListQuery,
  selectCostumerListLoading,
  selectCostumerListError,
  setCostumerListResult,
  setCostumerListLoading,
  setCostumerListError,
  clearCostumerList,
} from './store/costumerList.store'
