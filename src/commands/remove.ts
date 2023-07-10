import { Project } from "@xmcl/modrinth"
import { Modpack, selectModpack } from "../modpack.js"
import { term, title } from "../terminal.js"

async function selectMod(mod: Project[]) {
  const modNames = mod.map(m => m.title)
  term.saveCursor()
  const selection = await term.gridMenu([...modNames, 'FINISH'], { style: term.blue }).promise
  term.restoreCursor().eraseDisplayBelow().eraseLineAfter()
  if (selection.selectedIndex === mod.length) return null
  const selectedMod = mod[selection.selectedIndex]
  return selectedMod
}

export default async function remove() {
  title('Modify modpack')
  await Modpack.loadModpacksFromDisc()

  const modpack = await selectModpack()
  term.bold.italic.blue(`${modpack.name}`).styleReset(` (${modpack.loader} v${modpack.version}`)(')\n')
  while (true) {
    const mods = await modpack.mods
    const mod = await selectMod(mods)
    if (!mod) break
    term('Removed ').italic.red.bold(mod.title)('\n')
    modpack.removeMod(mod.slug)
  }

  term('\nAll done!\n')
}