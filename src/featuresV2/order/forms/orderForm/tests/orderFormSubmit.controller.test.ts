import type { Item } from '@/featuresV2/order/item'

import type { OrderFormState } from '../OrderForm.types'
import {
  executeOrderFormSubmit,
  type OrderFormSubmitCommand,
} from '../orderFormSubmit.controller'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const okResult = <T>(data: T) => ({
  data,
  warnings: [] as string[],
  status: 200,
})

const buildBaseFormState = (): OrderFormState => ({
  client_id: 'order-client-1',
  order_plan_objective: 'local_delivery',
  reference_number: 'REF-100',
  external_source: '',
  tracking_number: '',
  tracking_link: '',
  client_first_name: 'John',
  client_last_name: 'Doe',
  client_email: 'john@doe.com',
  client_primary_phone: { prefix: '+1', number: '3051112233' },
  client_secondary_phone: { prefix: '+1', number: '' },
  client_address: {
    street_address: '123 Main St',
    city: 'Miami',
    country: 'US',
    postal_code: '33101',
    coordinates: { lat: 25.7617, lng: -80.1918 },
  },
  earliest_delivery_date: '2026-02-23T00:00:00.000Z',
  latest_delivery_date: '2026-02-23T23:59:59.999Z',
  preferred_time_start: '08:00',
  preferred_time_end: '18:00',
  delivery_plan_id: 10,
})

const buildItem = (overrides?: Partial<Item>): Item => ({
  client_id: 'item-client-1',
  article_number: 'A-1',
  item_type: 'box',
  order_id: 200,
  quantity: 1,
  ...overrides,
})

const buildBaseCommand = (): OrderFormSubmitCommand => {
  const formState = buildBaseFormState()

  return {
    mode: 'edit',
    order: { id: 200, client_id: 'order-client-1' },
    orderServerId: 200,
    formState,
    validateForm: () => true,
    initialFormRef: { current: formState },
    itemDraftController: {
      getCreatedItems: () => [],
      getUpdatedItems: () => [],
      getDeletedItems: () => [],
      reset: () => undefined,
    },
    itemInitialByClientId: {},
  }
}

export const runOrderFormSubmitControllerTests = async () => {
  {
    const result = await executeOrderFormSubmit(
      {
        saveOrder: async () => true,
        createItemApi: async () => okResult({} as never),
        updateItemApi: async () => okResult({} as never),
        deleteItemApi: async () => okResult({} as never),
        loadItemsByOrderId: async () => null,
        validateOrderFields: () => true,
      },
      buildBaseCommand(),
    )

    assert(result.status === 'no_changes', 'edit mode with no diffs should return no_changes')
  }

  {
    const command = buildBaseCommand()
    command.validateForm = () => false

    const result = await executeOrderFormSubmit(
      {
        saveOrder: async () => true,
        createItemApi: async () => okResult({} as never),
        updateItemApi: async () => okResult({} as never),
        deleteItemApi: async () => okResult({} as never),
        loadItemsByOrderId: async () => null,
        validateOrderFields: () => true,
      },
      command,
    )

    assert(result.status === 'validation_error', 'invalid form should return validation_error')
  }

  {
    const command = buildBaseCommand()
    command.itemDraftController = {
      ...command.itemDraftController,
      getUpdatedItems: () => [buildItem({ client_id: 'item-updated-1', id: undefined })],
    }

    const result = await executeOrderFormSubmit(
      {
        saveOrder: async () => true,
        createItemApi: async () => okResult({} as never),
        updateItemApi: async () => okResult({} as never),
        deleteItemApi: async () => okResult({} as never),
        loadItemsByOrderId: async () => null,
        validateOrderFields: () => true,
      },
      command,
    )

    assert(
      result.status === 'dependency_error',
      'missing item id resolution should return dependency_error',
    )
  }

  {
    let saveOrderCalls = 0

    const formState = buildBaseFormState()
    const command: OrderFormSubmitCommand = {
      mode: 'create',
      order: { client_id: 'order-client-1' },
      orderServerId: null,
      formState,
      validateForm: () => true,
      initialFormRef: { current: formState },
      itemDraftController: {
        getCreatedItems: () => [buildItem({ client_id: 'created-item-1' })],
        getUpdatedItems: () => [],
        getDeletedItems: () => [],
        reset: () => undefined,
      },
      itemInitialByClientId: {},
    }

    const result = await executeOrderFormSubmit(
      {
        saveOrder: async () => {
          saveOrderCalls += 1
          return true
        },
        createItemApi: async () => okResult({} as never),
        updateItemApi: async () => okResult({} as never),
        deleteItemApi: async () => okResult({} as never),
        loadItemsByOrderId: async () => null,
        validateOrderFields: () => true,
      },
      command,
    )

    assert(result.status === 'success_create', 'create submit should return success_create')
    assert(saveOrderCalls === 1, 'create submit should call saveOrder once')
  }

  {
    let saveOrderCalls = 0

    const initialState = buildBaseFormState()
    const formState = {
      ...initialState,
      tracking_number: 'NEW-TRACKING',
    }

    const command: OrderFormSubmitCommand = {
      mode: 'edit',
      order: { id: 200, client_id: 'order-client-1' },
      orderServerId: 200,
      formState,
      validateForm: () => true,
      initialFormRef: { current: initialState },
      itemDraftController: {
        getCreatedItems: () => [],
        getUpdatedItems: () => [],
        getDeletedItems: () => [],
        reset: () => undefined,
      },
      itemInitialByClientId: {},
    }

    const result = await executeOrderFormSubmit(
      {
        saveOrder: async () => {
          saveOrderCalls += 1
          return true
        },
        createItemApi: async () => okResult({} as never),
        updateItemApi: async () => okResult({} as never),
        deleteItemApi: async () => okResult({} as never),
        loadItemsByOrderId: async () => null,
        validateOrderFields: () => true,
      },
      command,
    )

    assert(result.status === 'success_edit', 'edit submit should return success_edit')
    assert(saveOrderCalls === 1, 'edit submit should call saveOrder once')
  }
}
