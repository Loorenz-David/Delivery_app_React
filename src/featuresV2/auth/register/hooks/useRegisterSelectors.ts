import {
  selectAuthRegisterError,
  selectAuthRegisterLoading,
  useAuthRegisterStore,
} from '@/featuresV2/auth/register/store/authRegisterStore'

export const useRegisterLoading = () => useAuthRegisterStore(selectAuthRegisterLoading)

export const useRegisterError = () => useAuthRegisterStore(selectAuthRegisterError)
