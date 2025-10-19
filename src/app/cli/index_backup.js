#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { regenReadMe } from '../api/gemini.js';
import { signInWithGitHubViaCLI } from '../services/firebase.js';
import { fetchGithubRepos, generateRepoData } from '../services/github.js';
import { saveToken, loadToken, clearToken, getTokenFilePath } from './tokenManager.js';
import { displayRepositoriesInteractively, promptRepoDetails, promptReadmeDecision, promptRegenerationSuggestions } from './displayUtils.js';

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

const regenerateReadmeWithSuggestions = async (token, owner, repo, originalReadme, suggestions) => {
  console.log(`🔄 [PLACEHOLDER] Regenerating README with suggestions: "${suggestions}"`);
  // TODO: Implement actual regeneration functionality
  console.log('✅ README regenerated with your suggestions!');
  return `${originalReadme}\n\n<!-- Updated with suggestions: ${suggestions} -->`;
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
      
      // FOR TESTING: Use existing file instead of generating new one
      const testFilepath = 'C:\\Users\\bento\\OneDrive\\Desktop\\Git-Polish\\CEOFYEAST-FactorioProductionCalculator-readme-2025-10-19T00-38-25-471Z.md';
      
      console.log(`\n� Using existing README file for testing: ${testFilepath}`);
      
      // Read content from existing file
      let fileContent = '';
      try {
        fileContent = await readFile(testFilepath, 'utf8');
        console.log('✅ Test file loaded successfully!');
      } catch (error) {
        console.log('❌ Failed to read test file:', error.message);
        return;
      }
      
      // ORIGINAL CODE (commented out for testing):
      /*
      console.log(`\n�🔄 Generating README data for ${owner}/${repo}...`);
      
      // Generate repo data
      let data = await generateRepoData(token, repo, owner);
      
      if (!data) {
        console.log('❌ Failed to generate README data.\n');
        return;
      }
      
      // Extract content from data
      if (typeof data === 'string') {
        fileContent = data;
      } else if (data.summary) {
        fileContent = data.summary;
      } else {
        fileContent = JSON.stringify(data, null, 2);
      }
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${owner}-${repo}-readme-${timestamp}.md`;
      const filepath = join(process.cwd(), filename);
      
      // Write data to file
      await writeFile(filepath, fileContent, 'utf8');
      
      console.log(`\n✅ README data generated successfully!`);
      console.log(`📁 File saved to: ${filepath}`);
      */
      
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
              
              // Update file content and write back to the test file
              fileContent = updatedContent;
              await writeFile(testFilepath, fileContent, 'utf8');
              console.log(`📁 Updated README saved to: ${testFilepath}`);
              
            } catch (error) {
              console.log('❌ Failed to regenerate README:', error.message);
            }
            break;
            
          case '3':
            // Discard
            console.log('\n🗑️  README generation discarded.');
            console.log('📝 Your existing README will remain unchanged.');
            console.log(`📁 Test file is still available at: ${testFilepath}`);
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

// ...existing code...

// ...existing code...

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