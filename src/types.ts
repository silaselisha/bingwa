export interface updateUserParams {
  dob?: Date
  image?: string
  gender?: string
  username?: string
  profession?: string
  nationality?: string
}

export interface activeUserParams {
  isActive: boolean
}

export interface tokenResetParams {
  token: string
  timestamp: string
  id: string
}

export interface passwordParams {
  password: string
  confirmPassword: string
}

export interface resetPasswordParams extends passwordParams {
  currentPassword: string
}

export interface forgotPasswordParms {
  email: string
}

export interface emailParams extends forgotPasswordParms {
  subject: string
  message: string
}

export interface signinParams {
  email: string
  password: string
}

export interface userParams {
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
