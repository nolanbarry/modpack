import terminalKit from 'terminal-kit'

export const term = terminalKit.terminal

/** Erase the previous n lines (including this one) */
export function eraseLines(n: number) {
  if (n > 1) term.up(n - 1)
  term.column(0).eraseDisplayBelow().eraseLineAfter()
}