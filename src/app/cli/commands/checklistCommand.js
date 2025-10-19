
import ora from 'ora';
import { generateChecklistData } from '../../services/github.js';
import { loadToken } from '../tokenManager.js';
import { promptRepoDetails } from '../displayUtils.js';
import { extractContentFromData, promptForFileLocation, writeFileWithDirectoryCreation } from '../utils/fileUtils.js';

export const checklistCommand = async () => {
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
    
    // Generate checklist data with spinner
    const spinner = ora({
      text: `Generating checklist for ${owner}/${repo}...`,
      color: 'magenta'
    }).start();
    
    let data;
    try {
      data = await generateChecklistData(token, repo, owner);
      
      if (!data) {
        spinner.fail('Failed to generate checklist data');
        return;
      }
      
      spinner.succeed('Checklist data generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate checklist data');
      throw error;
    }
    
    // Extract content from data (looking for 'checklist' key instead of 'summary')
    const fileContent = extractContentFromData(data, 'checklist');
    
    // Prompt for file location
    const filepath = await promptForFileLocation(owner, repo, 'checklist', 'md');
    
    // Write data to file
    const writeSuccess = await writeFileWithDirectoryCreation(filepath, fileContent);
    if (!writeSuccess) {
      return;
    }
    
    console.log(`\n✅ Checklist generated successfully!`);
    console.log(`📁 File saved to: ${filepath}`);
    console.log(`\n💡 Tip: Open the file in a markdown viewer to see the formatted checklist.`);
    
  } catch (error) {
    console.log('❌ Failed to generate checklist:', error.message);
    console.log('💡 Make sure the repository exists and you have access to it.\n');
  }
};