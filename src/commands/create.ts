import { gameVersions, loaders } from '../modrinth.js'
import { GameVersion } from '@xmcl/modrinth'
import { eraseLines, term, title } from '../terminal.js'
import { Modpack } from '../modpack.js'

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

async function selectVersion(): Promise<GameVersion> {
  const versions = await gameVersions
  const releases = versions.filter(v => v.version_type === 'release')
  const snapshots = versions.filter(v => v.version_type === 'snapshot')
  const latestReleaseDate = new Date(releases[0].date)
  const latestSnapshotDate = new Date(snapshots[0].date)
  const recentSnapshot = latestSnapshotDate > latestReleaseDate

  term('\n').bold('Version:')
  let options = [
    `Latest Release (${releases[0].version})`,
    recentSnapshot ? `Latest Snapshot (${snapshots[0].version})` : '',
    `Other`
  ].filter(Boolean)

  let selection = await term.singleColumnMenu(options).promise
  eraseLines(options.length + 2)
  if (selection.selectedIndex === 0) return releases[0]
  if (selection.selectedIndex === 1 && recentSnapshot) return snapshots[0]

  // User chose 'Other'

  term.bold('Choose a version group:')
  const majorVersions = releases.filter(v => v.version.split('.').length === 2)
  options = [
    ...majorVersions.map(v => v.version + '.X'),
    'Snapshot'
  ]

  let majorVersionSelection = await term.gridMenu(options).promise
  eraseLines(4)
  if (majorVersionSelection.selectedText === 'Snapshot') {
    options = snapshots.map(v => v.version)
    let snapshot: GameVersion | undefined
    while (!snapshot) {
      term.bold('Choose a snapshot: ')
      let snapshotSelection = await term.inputField({ autoComplete: options }).promise
      eraseLines(1)
      snapshot = snapshots.find(v => v.version === snapshotSelection)
    }
    return snapshot
  } else {
    let majorVersion = majorVersions[majorVersionSelection.selectedIndex].version
    term.bold(`Choose a ${majorVersion} subversion:`)

    const minorVersions = releases.filter(v => v.version.startsWith(majorVersion))
    options = minorVersions.map(v => v.version)
    selection = await term.singleColumnMenu(options).promise
    eraseLines(options.length + 2)
    return minorVersions[selection.selectedIndex]
  }
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