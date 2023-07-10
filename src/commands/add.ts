import { Modpack, selectModpack } from "../modpack.js"
import { getBestVersion, getProject } from "../modrinth.js"
import { eraseLines, term, title } from "../terminal.js"

export default async function add() {
  title('Expand Modpack')
  await Modpack.loadModpacksFromDisc()
  const modpack = await selectModpack()

  term.bold('Modifying ').bold.italic.blue(modpack.name)('\n\n\n')

  while (true) {
    term.gray.bold('Add a mod by id, url, or slug (empty to exit):\n')
    const input = await term.inputField().promise
    if (input === '' || input == undefined) break
    const mod = await getProject(input)
    eraseLines(3)
    if (!mod) {
      term.red('Mod not found\n')
      continue
    }
    const bestVersion = await getBestVersion(mod.slug, modpack.version, modpack.loader)
    if (!bestVersion) {
      term.red(`No compatible versions of ${mod.slug} found for ${modpack.loader} ${modpack.version}.\nContinue anyway? (y/n) `)
      const response = await term.inputField().promise
      eraseLines(2)
      if ((response ?? "N").toLowerCase() !== 'y') continue
    }
    if (modpack.modSlugs.includes(mod.slug)) {
      term.green.italic(mod.slug).green(' already added\n')
      continue
    }
    term(`Added `).green.bold(mod.title)('\n')
    modpack.addMod(mod.slug)
  }
  term('\nAll done!\n')
}