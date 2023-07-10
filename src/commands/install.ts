import fs from "fs-extra"
import { Modpack, selectModpack } from "../modpack.ts"
import { eraseLines, term, title } from "../terminal.ts"
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import path from 'path'
import { homedir } from 'os'

async function storeExistingMods(minecraftFolder: string) {
  // place all items in modFolder into a backup folder
  await fs.ensureDir(path.join(minecraftFolder, 'mods.backup'))
  await fs.copy(path.join(minecraftFolder, 'mods'), path.join(minecraftFolder, 'mods.backup'))
  await fs.emptyDir(path.join(minecraftFolder, 'mods'))
}

export default async function install() {
  title('Install Modpack')
  await Modpack.loadModpacksFromDisc()

  const modpack = await selectModpack()
  let minecraftPath = {
    'darwin': `~/Library/Application Support/minecraft`,
    'linux': '~/.minecraft',
    'windows': '%appdata%\\.minecraft'
  }[process.platform as 'darwin' | 'linux' | 'windows']
  term(`Where is your .minecraft folder? (${minecraftPath}) `)
  const input = await term.inputField().promise
  if (input) minecraftPath = input
  minecraftPath = minecraftPath.replace('~', homedir())
  eraseLines(1)
  term('Minecraft path: ').italic(minecraftPath)('\n')

  const modPath = path.join(minecraftPath, 'mods')

  await fs.ensureDir(modPath)
  const existingMods = await fs.readdir(modPath)
  if (existingMods.length !== 0) {
    term('What should I do with existing contents of the mods folder?\n')
    const result = await term.singleRowMenu(['Replace', 'Keep', 'Cancel']).promise.then(res => res.selectedText)
    eraseLines(2)
    switch (result) {
      case 'Replace':
        term('Deleting existing mods\n')
        await fs.emptyDir(modPath)
        break
      case 'Keep':
        await storeExistingMods(minecraftPath)
        term('Existing mods were placed in mods.backup\n')
        break
      case 'Cancel':
        term.bold('Operation aborted\n')
        return
    }
  }
  term('\n')
  term('Assembling dependencies\n')
  const dependencies = await modpack.fullModList()
  term(`Omitting ${dependencies.omitted.length} mods that do not have a support version.\n\n`)
  const mods = dependencies.results
  const progress = term.progressBar({
    title: 'Downloading files...',
    items: mods.length
  })
  await Promise.all(mods.map(mod => {
    return mod.files.slice(0, 1).map(async file => {
      progress.startItem(file.filename)
      const response = await fetch(file.url)
      if (response.body) {
        const destination = path.join(modPath, file.filename)
        const writeStream = fs.createWriteStream(destination)
        await finished(Readable.fromWeb(response.body as any).pipe(writeStream))
      }
      progress.itemDone(file.filename)
    })
  }).flat())
  progress.stop()

  term.green.bold('\n\nSuccess!\n')
}