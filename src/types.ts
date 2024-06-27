export interface UpdateUserParams {
  dob?: Date
  image?: string
  gender?: string
  username?: string
  profession?: string
  nationality?: string
}

export interface ActiveUserParams {
  isActive: boolean
}

export interface TokenResetParams {
  token: string
  timestamp: string
  id: string
}

export interface PasswordParams {
  password: string
  confirmPassword: string
}

export interface ForgotPasswordParams {
  email: string
}

export interface SigningParams {
  email: string
  password: string
}

export interface UserParams {
  username: string
  email: string
  lastName: string
  firstName: string
  gender?: string
  password: string
  confirmPassword: string
  profile?: string
  phone: string
  nationalID: number
  nationality?: string
  profession?: string
  dob?: Date
}

export interface ResetPasswordParams extends PasswordParams {
  currentPassword: string
}

export interface EmailParams extends ForgotPasswordParams {
  subject: string
  message: string
}
