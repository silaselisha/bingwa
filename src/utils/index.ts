import bcrypt from 'bcryptjs'

const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

const decryptPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export { decryptPassword, encryptPassword }
