#!/usr/bin/env node
import { program } from 'commander'
import add from './commands/add.js'
import create from './commands/create.js'
import deleteModpack from './commands/delete-modpack.js'
import info from './commands/info.js'
import install from './commands/install.js'
import list from './commands/list.js'
import remove from './commands/remove.js'
import { term } from './terminal.js'
import upgrade from './commands/upgrade.js'

const exitAfter = (action: () => any) => {
  // commander passes command args as list in first parameter
  return async () => {
    await action()
    term.processExit(0)
  }
}

/** Allow killing with Ctrl c */
term.on('key', (name: string) => {
  if (name === 'CTRL_C') {
    term.processExit(0)
  }
})

program.command('create')
  .alias('c')
  .alias('new')
  .description('Create a new modpack')
  .action(exitAfter(create))

program.command('list')
  .alias('ls')
  .description('List all modpacks')
  .action(exitAfter(list))

program.command('info')
  .description('Get details on a modpack and the mods it contains')
  .action(exitAfter(info))

program.command('add')
  .alias('+')
  .description('Add mods to a modpack')
  .action(exitAfter(add))

program.command('delete-modpack')
  .description('Delete a modpack')
  .action(exitAfter(deleteModpack))

program.command('install')
  .alias('i')
  .description('Install a modpack')
  .action(exitAfter(install))

program.command('remove')
  .alias('rm')
  .description('Remove mods from a modpack')
  .action(exitAfter(remove))

program.command('upgrade')
  .description('Change the version of a modpack')
  .action(exitAfter(upgrade))

program.parse()