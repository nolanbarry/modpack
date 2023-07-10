import { gameVersions, loaders } from '../modrinth.js'
import { GameVersion } from '@xmcl/modrinth'
import { eraseLines, term, title } from '../terminal.js'
import { Modpack, selectVersion } from '../modpack.js'

async function getName(): Promise<string> {
  await Modpack.loadModpacksFromDisc()
  const takenNames = new Set(Modpack.allLoaded.map(m => m.name.toLowerCase()))
  let name: string | undefined
  while (!name || takenNames.has(name as string)) {
    if (takenNames.has((name ?? "").toLowerCase())) term.bold('Modpack already exists with that name: ')
    else term.bold('Name: ')
    name = await term.inputField().promise
    eraseLines(1)
  }
  return name
}

async function selectLoader(version: GameVersion): Promise<typeof loaders[number]> {
  term('\n').bold('Loader: ')
  const loader = await term.singleLineMenu(loaders).promise.then(s => loaders[s.selectedIndex])
  eraseLines(2)
  return loader
}

export default async function create() {
  title('Create Modpack')
  const name = await getName()
  term.bold('Name: ').green(name)

  const version = await selectVersion()
  term.bold('Version: ').green(version.version)

  const loader = await selectLoader(version)
  term.bold('Loader: ').green(loader)

  const modpack = await Modpack.create(name, version.version, loader)
  term('\n\nCreated modpack ').bold.italic.green(name)(`, initialized with ${modpack.modSlugs.length} mod(s).\n`)
}