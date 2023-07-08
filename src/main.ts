import { program } from 'commander'
import create from './commands/create.ts'
import list from './commands/list.ts'
import { term } from './terminal.ts'

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
  .action(create)

program.command('list')
  .alias('ls')
  .description('List all modpacks')
  .action(list)

program.parse()