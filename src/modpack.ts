import { ModrinthV2Client, Project } from '@xmcl/modrinth'
import fs from 'fs-extra'
import zod from 'zod'
import { loaders } from './modrinth.ts'

const modrinth = new ModrinthV2Client()

const modpackSchema = zod.object({
  name: zod.string(),
  version: zod.string(),
  mods: zod.array(zod.string()),
  loader: zod.enum(loaders)
})
type ModpackData = zod.infer<typeof modpackSchema>

async function loadModpacks(): Promise<ModpackData[]> {
  await fs.ensureFile('./modpacks.json')
  let modpacks = await fs.readFile('./modpacks.json', 'utf-8').then(JSON.parse)
  let result = await zod.array(modpackSchema).safeParseAsync(modpacks)
  if (!result.success) {
    console.error('Modpacks.json file is invalid! File will be overwritten with fresh file, old file will be renamed to modpacks.json.bak.')
    await fs.move('./modpacks.json', './modpacks.json.bak')
    await fs.writeFile('./modpacks.json', '[]')
    process.exit(1)
  }
  return result.data
}

const projectCache: Record<string, Promise<Project>> = {}

export class Modpack {
  data: ModpackData
  constructor(data: ModpackData) {
    this.data = data
  }

  get name() { return this.data.name }
  get version() { return this.data.version }
  get loader() { return this.data.loader }
  get mods() {
    return Promise.all(this.data.mods.map(modId => {
      if (!projectCache[modId]) projectCache[modId] = !projectCache[modId] ? modrinth.getProject(modId) : projectCache[modId]
      return projectCache[modId]
    }))
  }
}

export class ModpackClient {
  private static instance: ModpackClient | null = null
  private packs: Record<string, Modpack>

  private constructor(modpacks: ModpackData[]) {
    this.packs = Object.fromEntries(modpacks.map(data => [data.name, new Modpack(data)]))
  }

  /** Access to the singleton and async constructor */
  static async get() {
    if (this.instance) return this.instance
    const modpacks = await loadModpacks()
    this.instance = new ModpackClient(modpacks)
  }

  /** Save the modpacks out to disk. */
  private async save() {
    const rawData = Object.values(this.packs).map(modpack => modpack.data)
    await fs.writeFile('./modpacks.json', JSON.stringify(rawData, null, 0))
  }

  /** A list of the modpacks on the system. */
  get modpacks(): Modpack[] {
    return Object.values(this.packs)
  }

  /** Remove modpack entirely */
  deletePack(modpack: Modpack) {
    delete this.packs[modpack.name]
    this.save()
  }

  /** Create a new modpack */
  createPack(name: string, version: string, loader: typeof loaders[number]) {
    if (this.packs[name]) throw new Error('Modpack already exists!')
    this.packs[name] = new Modpack({
      name,
      version,
      mods: [],
      loader
    })
    this.save()
  }

  /** Remove specific mod from pack */
  removeModFromPack(modpack: Modpack, modToRemove: Project) {
    modpack.data.mods = modpack.data.mods.filter(mod => mod !== modToRemove.id)
    this.save()
  }

  /** Add mod to pack */
  addModToPack(modpack: Modpack, modToAdd: Project) {
    if (modpack.data.mods.includes(modToAdd.id)) throw new Error('Mod already in pack!')
    modpack.data.mods.push(modToAdd.id)
    this.save()
  }
}