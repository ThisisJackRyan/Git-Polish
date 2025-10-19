import ora from 'ora';
import { getUpdatedDescriptionBasedOnReadMe, updateDescription } from '../../services/github.js';
import { loadToken } from '../tokenManager.js';
import { promptRepoDetails, promptUserInput } from '../displayUtils.js';

const promptDescriptionDecision = async () => {
  console.log('\n📝 What would you like to do with the generated description?');
  console.log('1. Accept and update repository description');
  console.log('2. Regenerate description');
  console.log('3. Discard and keep existing description');
  console.log('');
  
  const choice = await promptUserInput('Enter your choice (1-3): ');
  return choice.trim();
};

const handleDescriptionDecision = async (token, owner, repo) => {
  let shouldContinue = true;
  
  while (shouldContinue) {
    // Generate description with spinner
    const spinner = ora({
      text: `Generating description for ${owner}/${repo} based on README...`,
      color: 'magenta'
    }).start();
    
    let generatedDescription;
    try {
      generatedDescription = await getUpdatedDescriptionBasedOnReadMe(token, repo, owner);
      
      if (!generatedDescription) {
        spinner.fail('Failed to generate description');
        return;
      }
      
      spinner.succeed('Description generated successfully!');
    } catch (error) {
      spinner.fail('Failed to generate description');
      throw error;
    }
    
    // Display the generated description
    console.log(`\n📋 Generated Description:`);
    console.log(`"${generatedDescription}"`);
    
    const decision = await promptDescriptionDecision();
    
    switch (decision) {
      case '1':
        // Accept and update
        try {
          const updateSpinner = ora({
            text: `Updating description for ${owner}/${repo}...`,
            color: 'blue'
          }).start();
          
          await updateDescription(token, repo, owner, generatedDescription);
          
          updateSpinner.succeed(`Repository description updated successfully!`);
          console.log(`\n🎉 Description for ${owner}/${repo} has been updated!`);
          shouldContinue = false;
        } catch (error) {
          console.log('❌ Failed to update description:', error.message);
        }
        break;
        
      case '2':
        // Regenerate - loop will continue
        console.log('\n🔄 Regenerating description...');
        break;
        
      case '3':
        // Discard
        console.log('\n🗑️  Description generation discarded.');
        console.log('📝 Your existing repository description will remain unchanged.');
        shouldContinue = false;
        break;
        
      default:
        console.log('❌ Invalid choice. Please enter 1, 2, or 3.\n');
        break;
    }
  }
};

export const descriptionCommand = async () => {
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
    
    // Handle the description generation and decision workflow
    await handleDescriptionDecision(token, owner, repo);
    
  } catch (error) {
    console.log('❌ Failed to process description:', error.message);
    console.log('💡 Make sure the repository exists and has a README file.\n');
  }
};