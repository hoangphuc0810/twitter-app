import bcrypt from 'bcrypt'

export async function hashPassword(password: string) {
  const saltRounds = 10
  const salt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

export async function checkPassword(password: string, hashedPassword: string) {
  const isMatch = await bcrypt.compare(password, hashedPassword)
  return Boolean(isMatch)
}
