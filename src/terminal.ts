import terminalKit from 'terminal-kit'

export const term = terminalKit.terminal

export function title(text: string) {
  term.scrollDown(term.height)
  term.clear().bold.bgColorRgbHex('#FF6700')(` * ${text} * \n\n`).styleReset()
}

/** Erase the previous n lines (including this one) */
export function eraseLines(n: number) {
  if (n > 1) term.up(n - 1)
  term.column(0).eraseDisplayBelow().eraseLineAfter()
}