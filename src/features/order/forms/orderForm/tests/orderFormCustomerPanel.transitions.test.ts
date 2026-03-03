import {
  resolveCustomerPanelInitialView,
  resolveCustomerPanelViewAfterFormClose,
  resolveCustomerPanelViewForEdit,
  resolveDefaultCustomerLayoutMode,
  resolveExpandedCustomerLayoutMode,
  shouldShowCostumerDetailsMenu,
  shouldShowCostumerSearchBackAction,
  shouldShowCostumerSearchBar,
} from '../components/OrderFormCustomerPanel'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const runOrderFormCustomerPanelTransitionTests = () => {
  assert(
    resolveCustomerPanelInitialView(null) === 'search',
    'initial panel view should be search when no selected costumer exists',
  )

  assert(
    resolveCustomerPanelInitialView({
      client_id: 'costumer-1',
      first_name: 'Martha',
      last_name: 'Jensen',
    }) === 'details',
    'initial panel view should be details when selected costumer exists',
  )

  assert(
    resolveCustomerPanelViewForEdit({
      client_id: 'costumer-1',
      first_name: 'Martha',
      last_name: 'Jensen',
    }) === 'form-edit',
    'edit action should enter form-edit when costumer has a client_id',
  )

  assert(
    resolveCustomerPanelViewForEdit(null) === 'search',
    'edit action should fallback to search when selected costumer is missing',
  )

  assert(
    resolveExpandedCustomerLayoutMode() === 'customer-expanded',
    'create/edit action should use customer-expanded layout',
  )

  assert(
    resolveDefaultCustomerLayoutMode() === 'default',
    'save/select/close transitions should return layout to default',
  )

  assert(
    resolveCustomerPanelViewAfterFormClose({
      previousView: 'details',
      hasSelectedCostumer: true,
    }) === 'details',
    'form close should return to previous details view when selected costumer still exists',
  )

  assert(
    resolveCustomerPanelViewAfterFormClose({
      previousView: 'details',
      hasSelectedCostumer: false,
    }) === 'search',
    'form close should fallback to search when previous view was details but costumer is missing',
  )

  assert(
    shouldShowCostumerSearchBar('search'),
    'search bar should render in search state',
  )
  assert(
    !shouldShowCostumerSearchBar('details'),
    'search bar should be hidden in details state',
  )
  assert(
    !shouldShowCostumerSearchBar('form-create'),
    'search bar should be hidden while create form is open',
  )
  assert(
    !shouldShowCostumerSearchBar('form-edit'),
    'search bar should be hidden while edit form is open',
  )

  assert(
    shouldShowCostumerDetailsMenu('details'),
    'details menu should render in details state',
  )
  assert(
    !shouldShowCostumerDetailsMenu('search'),
    'details menu should be hidden in search state',
  )

  assert(
    shouldShowCostumerSearchBackAction({
      view: 'search',
      hasSelectedCostumer: true,
    }),
    'search view should show back action when a costumer is selected',
  )
  assert(
    !shouldShowCostumerSearchBackAction({
      view: 'search',
      hasSelectedCostumer: false,
    }),
    'search view should hide back action when no costumer is selected',
  )
  assert(
    !shouldShowCostumerSearchBackAction({
      view: 'details',
      hasSelectedCostumer: true,
    }),
    'back action should be hidden outside of search view',
  )
}
