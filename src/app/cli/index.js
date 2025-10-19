#!/usr/bin/env node --trace-warnings
import 'dotenv/config';
import { Command } from 'commander';
import { updateDescription } from '../services/github.js';
import { loadToken } from './tokenManager.js';
import { loginCommand, logoutCommand } from './commands/authCommands.js';
import { listCommand } from './commands/listCommand.js';
import { readmeCommand } from './commands/readmeCommand.js';
import { checklistCommand } from './commands/checklistCommand.js';
import { geminiCommand } from './commands/utilityCommands.js';

const program = new Command();

program
  .name('git-polish')
  .description('CLI tool for My Next.js app')
  .version('0.1.0');

// Authentication commands
program
  .command('login')
  .description('Login with GitHub')
  .action(loginCommand);

program
  .command('logout')
  .description('Clear stored authentication token')
  .action(logoutCommand);

// Repository commands
program
  .command('list')
  .description('List your GitHub repositories')
  .action(listCommand);

program
  .command('readme')
  .description(`Polish a repo's README`)
  .action(readmeCommand);

program
  .command('checklist')
  .description('Generate a checklist for your repository')
  .action(checklistCommand);

// Utility commands
program
  .command('gemini')
  .description('Default Gemini response')
  .action(geminiCommand);

// program
//   .command('repodata <owner> <repo> <path>')
//   .description('Fetch repo data for owner, repo and path')
//   .action(repodataCommand);

program
  .command('updatedesc <owner> <repo> <path> <desc>')
  .description('Fetch repo data for owner, repo and path')
  .action(async (owner, repo, token, desc) => {
      try {
          const token = await loadToken();
          const res = await updateDescription(token, repo, owner, desc);
          console.log('CLI says:', res);
      } catch (err) {
          console.error('Fetch error:', err);
      }
  });

program.parse();