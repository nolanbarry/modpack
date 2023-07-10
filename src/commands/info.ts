import { Modpack, selectModpack } from "../modpack.ts"
import { eraseLines, term, title } from "../terminal.ts"

export default async function info() {
  title('Modpack Info')
  await Modpack.loadModpacksFromDisc()
  if (Modpack.allLoaded.length === 0) {
    term.red('  None found')('. Use ').blue('modpack create')('.\n')
    return
  }
  const modpack = await selectModpack()
  term.bold.italic.blue(`${modpack.name}`).styleReset(` (${modpack.loader} v${modpack.version}`)(')\n')
  await modpack.mods.then(mods => {
    term(`\nMods (${modpack.modSlugs.length}):\n`)
    if (mods.length === 0)
      term.gray(' None yet')
    else for (let mod of mods)
      term(` - ${mod.title}`)

  })
}