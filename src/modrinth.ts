import { ModrinthV2Client } from '@xmcl/modrinth'

const client = new ModrinthV2Client()

export const gameVersions = client.getGameVersionTags()
export const loaders = ['quilt', 'forge', 'fabric'] as const