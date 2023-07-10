import { Modpack, selectModpack } from "../modpack.ts"
import { term, title } from "../terminal.ts"

export default async function () {
  title('Delete Modpack')
  await Modpack.loadModpacksFromDisc()
  if (Modpack.allLoaded.length === 0) {
    term.red('  No modpacks found\n')
    return
  }
  const modpack = await selectModpack()
  const areYouSure = await term.italic('Are you sure you want to delete ').red.bold(modpack.name)('? (y/n) ').inputField().promise
  term('\n')
  if ((areYouSure ?? "N").toLowerCase() === 'y') {
    modpack.delete()
    term('Deleted ').bold(modpack.name)('\n')
  } else {
    term.bold('Operation aborted\n')
  }
}