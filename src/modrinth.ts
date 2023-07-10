import { ModrinthV2Client, Project } from '@xmcl/modrinth'

const client = new ModrinthV2Client()

export const gameVersions = client.getGameVersionTags()
export const loaders = ['quilt', 'forge', 'fabric'] as const
export const defaultMods: Record<typeof loaders[number], string[]> = {
  quilt: ['qsl'],
  forge: [],
  fabric: ['fabric-api']
}
export const compatibleLoaders: Record<typeof loaders[number], typeof loaders[number][]> = {
  quilt: ['fabric'],
  forge: [],
  fabric: []
}

const projectCache: Record<string, Project> = {}

/** Retrieve a project by id, slug, or url, returning null if it wasn't found or the url was invalid. */
export async function getProject(identifier: string) {
  const slug = /^(https:\/\/modrinth\.com\/mod\/)?([A-z0-9\-_]+)(\/.*)?$/.exec(identifier)?.[2]
  if (!slug) return null
  if (projectCache[slug]) return projectCache[slug]
  return await client.getProject(slug)
    .then(project => projectCache[project.slug] = project)
    .catch(() => null)
}

export async function getProjectFromVersionId(version: string) {
  const projectId = await client.getProjectVersion(version).then(v => v.project_id)
  return await getProject(projectId)
}

/** Retrieve the most recent version of the given project that supports the `version` on `loader` */
export async function getBestVersion(slug: string, gameVersion: string, loader: typeof loaders[number]) {
  const project = await getProject(slug)
  if (!project) throw new Error(`Project ${slug} not found on Modrinth`)
  const versions = await client.getProjectVersions(project.id, { gameVersions: [gameVersion], loaders: [loader, ...compatibleLoaders[loader]] })
  if (versions.length === 0) return null
  return versions[0]
}