import readline from 'readline'

export function isInteractiveTTY() {
  if (process.env.FRAMEVOX_NO_PROMPT === '1') return false
  if (process.env.CI) return false
  return Boolean(process.stdout.isTTY && process.stdin.isTTY)
}

/** Yes/no prompt. Default: no. Returns false when not a TTY. */
export function confirm(question) {
  if (!isInteractiveTTY()) return Promise.resolve(false)

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(question, (answer) => {
      rl.close()
      const a = answer.trim().toLowerCase()
      if (!a) return resolve(false)
      resolve(a === 'y' || a === 'yes')
    })
  })
}
