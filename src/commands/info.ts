import { Modpack, modpackDirectory, selectModpack } from "../modpack.js"
import { term, title } from "../terminal.js"

export default async function info() {
  title('Modpack Info')

  term('Modpacks path: ').italic(modpackDirectory)('\n\n')
  await Modpack.loadModpacksFromDisc()
  if (Modpack.allLoaded.length === 0) {
    term.red('No modpacks found')('. Use ').blue('modpack create')('.\n')
    return
  }
  const modpack = await selectModpack()
  term.bold.italic.blue(`${modpack.name}`).styleReset(` (${modpack.loader} v${modpack.version}`)(')\n')
  await modpack.mods.then(mods => {
    term(`\nMods (${modpack.modSlugs.length}):\n`)
    if (mods.length === 0)
      term.gray(' None yet')
    else for (let mod of mods)
      term(` - ${mod.title}\n`)

  })
}