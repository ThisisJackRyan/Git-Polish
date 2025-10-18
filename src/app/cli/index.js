#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import fetch from 'node-fetch';
import geminiExample from '../api/gemini.js';
import getRepoData from '../api/gemini.js';


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

program
    .command('repodata <owner> <repo> <path>')
    .description('Fetch repo data for owner, repo and path')
    .action(async (owner, repo, token) => {
        //try {
            // ...existing code...
          try {
              const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/readmeGen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubtoken: token, repo: repo, owner: owner })
              });

              if (!res.ok) {
                // prefer to inspect body on error
                const text = await res.text();
                throw new Error(`Request failed (${res.status}): ${text}`);
              }

              const data = await res.json(); // parse JSON body
              console.log('CLI says:', data.summary);
          } catch (err) {
              console.error('Fetch error:', err);
          }
          // ...existing code...
        //} catch (err) {
          //  console.error('Error fetching repo data:', err.message || err);
            //process.exitCode = 1;
        });

program.parse();