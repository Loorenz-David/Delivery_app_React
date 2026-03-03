import { runCostumerQueryFlow } from '../costumerQuery.flow'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const runCostumerQueryFlowTests = async () => {
  let loadingValue: boolean | null = null
  let errorValue: string | undefined
  let resultPayload: unknown = null
  let upsertPayload: unknown = null
  let messagePayload: unknown = null

  const queryCostumers = runCostumerQueryFlow({
    listCostumersApi: async () => ({
      data: {
        costumer: [
          {
            client_id: 'costumer-1',
            first_name: 'Martha',
            last_name: 'Jensen',
          },
        ],
        costumer_stats: {
          total_costumers: 1,
          total_with_orders: 1,
          total_without_orders: 0,
        },
        costumer_pagination: {
          has_more: false,
          next_cursor: null,
          prev_cursor: null,
        },
      },
      warnings: [],
    }),
    setCostumerListLoading: (loading) => {
      loadingValue = loading
    },
    setCostumerListError: (error) => {
      errorValue = error
    },
    setCostumerListResult: (payload) => {
      resultPayload = payload
    },
    upsertCostumerBatch: (payload) => {
      upsertPayload = payload
    },
    showMessage: (payload) => {
      messagePayload = payload
    },
  })

  const successResult = await queryCostumers({ q: 'martha' })

  assert(loadingValue === true, 'Flow should set list loading true before query')
  assert(!errorValue, 'Flow should not set list error on success')
  assert(Boolean(resultPayload), 'Flow should set list result metadata on success')
  assert(Boolean(upsertPayload), 'Flow should upsert costumers in batch on success')
  assert(!messagePayload, 'Flow should not emit error message on success')
  assert(Boolean(successResult?.byClientId['costumer-1']), 'Flow should return normalized costumer map')

  let errorMessage: string | undefined
  let showMessageCalled = false

  const queryMissingCostumers = runCostumerQueryFlow({
    listCostumersApi: async () =>
      ({
        data: undefined,
        warnings: [],
      }) as never,
    setCostumerListLoading: () => undefined,
    setCostumerListError: (error) => {
      errorMessage = error
    },
    setCostumerListResult: () => undefined,
    upsertCostumerBatch: () => undefined,
    showMessage: () => {
      showMessageCalled = true
    },
  })

  const nullResult = await queryMissingCostumers({ q: 'missing' })

  assert(nullResult === null, 'Flow should return null when response payload is missing')
  assert(errorMessage === 'Missing costumers response.', 'Flow should set missing response error')
  assert(!showMessageCalled, 'Missing payload should not emit message handler error')
}
