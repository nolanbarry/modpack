import { Modpack, selectModpack, selectVersion } from "../modpack.js"
import { eraseLines, term, title } from "../terminal.js"

export default async function upgrade() {
  title('Upgrade Modpack')
  await Modpack.loadModpacksFromDisc()
  if (Modpack.allLoaded.length === 0) {
    term.red('  No modpacks found\n')
    return
  }
  const modpack = await selectModpack()
  term.bold.italic.gray(`${modpack.name}`).styleReset(` (${modpack.loader} `).bold.underline(`v${modpack.version}`)(')\n')
  const newVersion = await selectVersion('Choose a new version:')
  eraseLines(2)
  term('\nConfirm version change from ').bold.blue(modpack.version)(' -> ').bold.blue(newVersion.version)('? (y/n) ')
  const areYouSure = await term.inputField().promise
  term('\n')
  if ((areYouSure ?? "N").toLowerCase() === 'y') {
    modpack.version = newVersion.version
    term.bold.green('\nSuccess: ')('Use ').blue.italic('modpack install')(' to reinstall different-versioned mods.')
  }
  else {
    term.bold('Operation aborted\n')
  }
}