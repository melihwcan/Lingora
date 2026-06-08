export const MASCOT_POPPED_KEY = 'lingora_mascot_popped'

export const clearMascotPoppedStorage = () => {
  try {
    sessionStorage.removeItem(MASCOT_POPPED_KEY)
    localStorage.removeItem(MASCOT_POPPED_KEY)
  } catch {
    /* ignore */
  }
}

export const isMascotPopped = () => {
  try {
    return sessionStorage.getItem(MASCOT_POPPED_KEY) === '1'
  } catch {
    return false
  }
}

export const setMascotPopped = () => {
  try {
    sessionStorage.setItem(MASCOT_POPPED_KEY, '1')
  } catch {
    /* ignore */
  }
}

export const migrateMascotStorage = () => {
  try {
    localStorage.removeItem(MASCOT_POPPED_KEY)
  } catch {
    /* ignore */
  }
}
