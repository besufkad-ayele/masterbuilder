// Form validation schemas
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return passwordRegex.test(password)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}
