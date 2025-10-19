import ora from 'ora';
import { regenReadMe } from '../../api/gemini.js';
import { generateRepoData, updateReadme } from '../../services/github.js';
import { loadToken } from '../tokenManager.js';
import { promptRepoDetails, promptReadmeDecision, promptRegenerationSuggestions } from '../displayUtils.js';
import { extractContentFromData, promptForFileLocation, writeFileWithDirectoryCreation } from '../utils/fileUtils.js';

// Function to commit README to repository
const commitReadmeToRepository = async (token, owner, repo, readmeContent) => {
  try {
    const result = await updateReadme(token, repo, owner, readmeContent, 'Update README via Git Polish CLI');
    return result;
  } catch (error) {
    throw new Error(`Failed to commit README: ${error.message}`);
  }
};

const handleReadmeDecision = async (token, owner, repo, fileContent, filepath) => {
  let shouldContinue = true;
  let currentContent = fileContent;
  
  while (shouldContinue) {
    const decision = await promptReadmeDecision();
    
    switch (decision) {
      case '1':
        // Accept and commit
        try {
          const commitSpinner = ora({
            text: `Committing README to ${owner}/${repo}...`,
            color: 'magenta'
          }).start();
          
          await commitReadmeToRepository(token, owner, repo, currentContent);
          
          commitSpinner.succeed(`README has been committed to ${owner}/${repo}!`);
          shouldContinue = false;
        } catch (error) {
          if (error.spinner) {
            error.spinner.fail('Failed to commit README');
          }
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
          
          const regenSpinner = ora({
            text: 'Regenerating README with your suggestions...',
            color: 'blue'
          }).start();
          
          try {
            const updatedContent = await regenReadMe(currentContent, suggestions);
            
            // Update file content and overwrite the same file
            currentContent = updatedContent;
            regenSpinner.succeed('README regenerated successfully!');
          } catch (regenError) {
            regenSpinner.fail('Failed to regenerate README');
            throw regenError;
          }
          
          const writeSuccess = await writeFileWithDirectoryCreation(filepath, currentContent);
          if (writeSuccess) {
            console.log(`📁 Updated README saved to: ${filepath}`);
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
};

export const readmeCommand = async () => {
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
    
    // Generate repo data with spinner
    const spinner = ora({
      text: `Generating README data for ${owner}/${repo}...`,
      color: 'magenta'
    }).start();
    
    let data;
    try {
      data = await generateRepoData(token, repo, owner);
      
      if (!data) {
        spinner.fail('Failed to generate README data');
        return;
      }
      
      spinner.succeed('README data generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate README data');
      throw error;
    }
    
    // Extract content from data
    const fileContent = extractContentFromData(data);
    
    // Prompt for file location
    const filepath = await promptForFileLocation(owner, repo, 'readme', 'md');
    
    // Write data to file
    const writeSuccess = await writeFileWithDirectoryCreation(filepath, fileContent);
    if (!writeSuccess) {
      return;
    }
    
    console.log(`\n✅ README data generated successfully!`);
    console.log(`📁 File saved to: ${filepath}`);
    console.log(`\n💡 Tip: Open the file in a markdown viewer to see the formatted content.`);
    
    // Handle user decision
    await handleReadmeDecision(token, owner, repo, fileContent, filepath);
    
  } catch (error) {
    console.log('❌ Failed to generate README data:', error.message);
    console.log('💡 Make sure the repository exists and you have access to it.\n');
  }
};