import { useContext } from 'react'

import { LocalDeliveryContext } from './LocalDeliveryContext'

export const useLocalDeliveryContext = () => {
  const context = useContext(LocalDeliveryContext)
  if (!context) {
    throw new Error('useLocalDeliveryContext must be used within LocalDeliveryProvider')
  }
  return context
}
