#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { regenReadMe } from '../api/gemini.js';
import { signInWithGitHubViaCLI } from '../services/firebase.js';
import { fetchGithubRepos, generateRepoData, getUpdatedDescriptionBasedOnReadMe, updateDescription } from '../services/github.js';
import { saveToken, loadToken, clearToken, getTokenFilePath } from './tokenManager.js';
import { displayRepositoriesInteractively, promptRepoDetails, promptReadmeDecision, promptRegenerationSuggestions, promptUserInput } from './displayUtils.js';

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
      console.log('💡 Try running "git-polish login" again.\n');
    }
  });

program
  .command('logout')
  .description('Clear stored authentication token')
  .action(async () => {
    await clearToken();
    console.log('✅ Successfully logged out');
  });

// Placeholder functions for future implementation
const commitReadmeToRepository = async (token, owner, repo, readmeContent) => {
  console.log(`🔄 [PLACEHOLDER] Committing README to ${owner}/${repo}...`);
  // TODO: Implement actual commit functionality
  console.log('✅ README successfully committed to repository!');
};

program
  .command('readme')
  .description(`Polish a repo's README`)
  .action(async () => {
    const token = await loadToken();
    if (!token) {
      return;
    }
    
    try {
      // Prompt user for repository details
      const { owner, repo } = await promptRepoDetails();
      
      if (!owner || !repo) {
        console.log('❌ Owner and repository name are required.\n');
        return;
      }
      
      console.log(`\n🔄 Generating README data for ${owner}/${repo}...`);
      
      // Generate repo data
      let data = await generateRepoData(token, repo, owner);
      
      if (!data) {
        console.log('❌ Failed to generate README data.\n');
        return;
      }
      
      // Extract content from data
      let fileContent = '';
      if (typeof data === 'string') {
        fileContent = data;
      } else if (data.summary) {
        fileContent = data.summary;
      } else {
        fileContent = JSON.stringify(data, null, 2);
      }
      
      // Create filename without timestamp
      const filename = `${owner}-${repo}-readme.md`;
      
      // Prompt for file location
      console.log('\n📁 Where would you like to save the README file?');
      console.log('1. Current directory (default)');
      console.log('2. Custom location (relative to current directory)');
      
      const locationChoice = await promptUserInput('Enter your choice (1-2, default is 1): ');
      
      let filepath;
      if (locationChoice.trim() === '2') {
        const customPath = await promptUserInput('Enter relative path (e.g., "docs", "output/readmes"): ');
        if (customPath.trim()) {
          filepath = join(process.cwd(), customPath.trim(), filename);
        } else {
          filepath = join(process.cwd(), filename);
        }
      } else {
        filepath = join(process.cwd(), filename);
      }
      
      // Write data to file
      try {
        // Create directory if it doesn't exist
        await mkdir(dirname(filepath), { recursive: true });
        await writeFile(filepath, fileContent, 'utf8');
      } catch (error) {
        console.log('❌ Failed to create directory or write file:', error.message);
        return;
      }
      
      console.log(`\n✅ README data generated successfully!`);
      console.log(`📁 File saved to: ${filepath}`);
      console.log(`\n💡 Tip: Open the file in a markdown viewer to see the formatted content.`);
      
      // Decision tree
      let shouldContinue = true;
      while (shouldContinue) {
        const decision = await promptReadmeDecision();
        
        switch (decision) {
          case '1':
            // Accept and commit
            try {
              await commitReadmeToRepository(token, owner, repo, fileContent);
              console.log(`\n🎉 README has been committed to ${owner}/${repo}!`);
              shouldContinue = false;
            } catch (error) {
              console.log('❌ Failed to commit README:', error.message);
            }
            break;
            
          case '2':
            // Regenerate with suggestions
            try {
              const suggestions = await promptRegenerationSuggestions();
              
              if (!suggestions) {
                console.log('❌ No suggestions provided. Please try again.\n');
                continue;
              }
              
              console.log(`\n🔄 Regenerating README with your suggestions...`);
              const updatedContent = await regenReadMe(fileContent, suggestions);
              
              // Update file content and overwrite the same file
              fileContent = updatedContent;
              
              try {
                // Create directory if it doesn't exist
                await mkdir(dirname(filepath), { recursive: true });
                await writeFile(filepath, fileContent, 'utf8');
                console.log(`📁 Updated README saved to: ${filepath}`);
              } catch (error) {
                console.log('❌ Failed to write updated file:', error.message);
              }
              
            } catch (error) {
              console.log('❌ Failed to regenerate README:', error.message);
            }
            break;
            
          case '3':
            // Discard
            console.log('\n🗑️  README generation discarded.');
            console.log('📝 Your existing README will remain unchanged.');
            console.log(`📁 Generated file is still available at: ${filepath}`);
            shouldContinue = false;
            break;
            
          default:
            console.log('❌ Invalid choice. Please enter 1, 2, or 3.\n');
            break;
        }
      }
      
    } catch (error) {
      console.log('❌ Failed to generate README data:', error.message);
      console.log('💡 Make sure the repository exists and you have access to it.\n');
    }
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
        try {
              const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/readmeGen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubtoken: token, repo: repo, owner: owner })
              });

              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Request failed (${res.status}): ${text}`);
              }

              const data = await res.json();
              console.log('CLI says:', data.summary);
          } catch (err) {
              console.error('Fetch error:', err);
          }
        });

program
    .command('checklist <owner> <repo> <path>')
    .description('Fetch repo data for owner, repo and path')
    .action(async (owner, repo, token) => {
        try {
            const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/generateChecklist', {
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
            console.log('CLI says:', data.checklist);
        } catch (err) {
            console.error('Fetch error:', err);
        }
      });

program
    .command('getreadme <owner> <repo> <path>')
    .description('Fetch repo data for owner, repo and path')
    .action(async (owner, repo, token) => {
        try {
            const res = await getUpdatedDescriptionBasedOnReadMe(token, repo, owner);
            console.log('CLI says:', res);
        } catch (err) {
            console.error('Fetch error:', err);
        }
      });

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