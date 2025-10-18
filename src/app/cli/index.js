#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import fetch from 'node-fetch';
import geminiExample from '../api/gemini.js';

const program = new Command();

program
  .name('git-polish')
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

  program
  .command('gemini')
  .description('Default Gemini responce')
  .action(async () => {
    const res = await geminiExample();
    console.log('CLI says:', res);
  });

program.parse();