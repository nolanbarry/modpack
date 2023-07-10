import { Modpack } from "../modpack.ts"
import { term, title } from "../terminal.ts"

export default async function list() {
  title('List Modpacks')
  await Modpack.loadModpacksFromDisc()

  if (Modpack.allLoaded.length === 0) {
    term.red('  None found')('. Use ').blue('modpack create')('.\n')
    return
  }
  Modpack.allLoaded.forEach(modpack => {
    const info = ` (${modpack.loader} v${modpack.version}, ${modpack.modSlugs.length} mod${modpack.modSlugs.length == 1 ? '' : 's'})\n`
    term.bold.italic.blue(modpack.name).styleReset(info)
  })

  term('\nTotal: ').green(Modpack.allLoaded.length.toString())('\n')
  term('Use ').blue.italic('modpack create')(' to create a new modpack.\n')
  term('Use ').blue.italic('modpack info')(' for more info on a specific modpack.\n')
}