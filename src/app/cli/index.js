#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import geminiExample from '../api/gemini.js';
import { signInWithGitHubViaCLI } from '../services/firebase.js';
import { fetchGithubRepos } from '../services/github.js';
import { saveToken, loadToken, clearToken, getTokenFilePath } from './tokenManager.js';
import { displayRepositoriesInteractively } from './displayUtils.js';

const program = new Command();

program
  .name('git-polish')
  .description('CLI tool for My Next.js app')
  .version('0.1.0');

program
  .command('login')
  .action(async () => {
    const { user, token } = await signInWithGitHubViaCLI();
    await saveToken(token);
    console.log(`✅ Successfully logged in as ${user.login}`);
    console.log(`🔑 Token saved to ${getTokenFilePath()}`);
  });

program
  .command('list')
  .action(async () => {
    const token = await loadToken();
    if (!token) {
      console.log('❌ No token found. Please run "git-polish login" first.');
      return;
    }
    
    try {
      const reposResponse = await fetchGithubRepos(token);
      
      if (reposResponse.allRepos.length === 0) {
        console.log('📋 No repositories found.'); 
        return;
      }
      
      await displayRepositoriesInteractively(reposResponse.allRepos);
      
    } catch (error) {
      console.log('❌ Failed to fetch repositories. Token may be invalid.');
      console.log('💡 Try running "git-polish login" again.');
    }
  });

program
  .command('logout')
  .description('Clear stored authentication token')
  .action(async () => {
    await clearToken();
    console.log('✅ Successfully logged out');
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