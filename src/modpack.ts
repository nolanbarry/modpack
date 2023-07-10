import { ModrinthV2Client, Project, ProjectVersion } from '@xmcl/modrinth'
import { randomBytes } from 'crypto'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import zod from 'zod'
import { defaultMods, getBestVersion, getProject, getProjectFromVersionId, loaders } from './modrinth.ts'
import { eraseLines, term } from './terminal.ts'

const modpackDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'modpacks')

const modpackSchema = zod.object({
  name: zod.string(),
  version: zod.string(),
  mods: zod.array(zod.string()),
  loader: zod.enum(loaders)
})
type ModpackData = zod.infer<typeof modpackSchema>

export class Modpack {
  static allLoaded: Modpack[] = []
  data: ModpackData
  filename: string
  private constructor(filename: string, data: ModpackData) {
    this.data = data
    this.filename = filename

    if (Modpack.allLoaded.find(modpack => modpack.filename === filename))
      throw new Error(`Modpack ${filename} already loaded!`)
    Modpack.allLoaded.push(this)
  }

  set name(name: string) {
    this.data.name = name
    this.save()
  }
  get name() { return this.data.name }

  set version(version: string) {
    this.data.version = version
    this.save()
  }
  get version() { return this.data.version }

  set loader(loader: typeof loaders[number]) {
    this.data.loader = loader
    this.save()
  }
  get loader() { return this.data.loader }

  async addMod(slug: string) {
    if (!await getProject(slug)) throw new Error(`Mod ${slug} not found on Modrinth`)
    this.data.mods.push(slug)
    this.save()
  }
  removeMod(slug: string) {
    this.data.mods = this.data.mods.filter(existingMod => existingMod !== slug)
    this.save()
  }
  get modSlugs() { return this.data.mods }

  /** The projects that have been explicitly added to this  */
  get mods() {
    return Promise.all(this.data.mods.map(slug => getProject(slug))).then(mods => mods.filter(mod => mod !== null) as Project[])
  }

  /** Return a list of project versions - the actual files that are associated with this modpack, including dependencies. */
  async fullModList(): Promise<{ omitted: Project[], results: ProjectVersion[] }> {
    const finalVersions: Record<string, ProjectVersion> = {}
    const omitted: Project[] = []

    // perform bread-first search to find all dependencies
    let queue = this.modSlugs
    while (queue.length > 0) {
      queue = await Promise.all(queue.map(async modSlug => {
        const project = await getProject(modSlug)
        if (!project) return null
        const modVersion = await getBestVersion(modSlug, this.data.version, this.data.loader)
        // already have this mod
        if (finalVersions[modSlug]) return null
        // no version is compatible with this version of the game
        if (!modVersion) return omitted.push(project), null
        finalVersions[modSlug] = modVersion
        return await Promise.all(modVersion.dependencies
          // TODO: look at incompatibilities?
          .filter(dependency => dependency.dependency_type === 'required')
          .map(async dependency => {
            const dependencyProject = dependency.project_id ? await getProject(dependency.project_id) : await getProjectFromVersionId(dependency.version_id!)
            if (!dependencyProject) return null

            // qfapi is a drop in replacement for fabric on quilt
            if (dependencyProject.slug === 'fabric-api' && this.loader == 'quilt') return 'qfapi'
            
            return dependencyProject.slug
          }))
      })).then(nextDependencyLayer => Array.from(new Set(nextDependencyLayer.flat().filter(Boolean))) as string[])
    }

    return { omitted, results: Object.values(finalVersions) }
  }

  /** Delete this modpack and its file. */
  delete() {
    fs.remove(this.filename)
    Modpack.allLoaded = Modpack.allLoaded.filter(modpack => modpack.filename !== this.filename)
  }

  private save() {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 0))
  }

  /** Load modpacks into memory. Modpacks already loaded are not read. */
  static async loadModpacksFromDisc() {
    await fs.ensureDir(modpackDirectory)
    const modpackFiles = await fs.readdir(modpackDirectory)
    await Promise.all(modpackFiles.map(async file => {
      const modpackPath = path.join(modpackDirectory, file)
      // invalid modpacks are ignored
      await Modpack.load(modpackPath).catch((e) => null)
    }))
  }

  /** Load a modpack from a given filepath. */
  static async load(filepath: string) {
    const alreadyLoaded = Modpack.allLoaded.find(modpack => modpack.filename === filepath)
    if (alreadyLoaded) return alreadyLoaded
    const fileContents = await fs.readFile(filepath, 'utf-8')
    const parsed = JSON.parse(fileContents)
    const verified = modpackSchema.parse(parsed)
    return new Modpack(filepath, verified)
  }

  /** Create a modpack and save it to disk. */
  static async create(name: string, version: string, loader: typeof loaders[number]) {
    let filename = ""
    do {
      filename = randomBytes(8).toString('hex') + '.json'
    } while (await fs.pathExists(path.join(modpackDirectory, filename)))
    const filepath = path.join(modpackDirectory, filename)
    const modpack = new Modpack(filepath, {
      name,
      version,
      loader,
      mods: []
    })
    for (let defaultMod of defaultMods[loader]) {
      await modpack.addMod(defaultMod)
    }
    return modpack
  }
}

export async function selectModpack() {
  if (Modpack.allLoaded.length === 1) return Modpack.allLoaded[0]
  const options = Modpack.allLoaded.map(modpack => `${modpack.name} (v${modpack.version}, ${modpack.loader})`)
  term.bold('Select a modpack:')
  const chosenIndex = await term.singleColumnMenu(options).promise.then(res => res.selectedIndex)
  eraseLines(options.length + 1)
  return Modpack.allLoaded[chosenIndex]
}

