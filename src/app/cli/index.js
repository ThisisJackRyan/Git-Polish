#!/usr/bin/env node
import { Command } from 'commander';
import fetch from 'node-fetch';

const program = new Command();

program
  .name('myapp')
  .description('CLI tool for My Next.js app')
  .version('0.1.0');

program
  .command('ping')
  .description('Ping the running Next.js server')
  .action(async () => {
    const res = await fetch('http://localhost:3000/api/hello');
    const data = await res.json();
    console.log('Response from Next.js API:', data);
  });

program
  .command('say <msg>')
  .description('Echo a message')
  .option('-e, --excited', 'Add excitement!')
  .action((msg, options) => {
    let text = msg;
    if (options.excited) text += '!!! 🎉';
    console.log('CLI says:', text);
  });

program.parse();