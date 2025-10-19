import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { parseChecklistAndCreateIssues } from '../../services/github.js';
import { loadToken } from '../tokenManager.js';
import { promptRepoDetails, promptUserInput } from '../displayUtils.js';

const promptFilePath = async () => {
  console.log('\n📄 Please provide the path to your checklist file:');
  const filePath = await promptUserInput('Enter file path: ');
  return filePath.trim();
};

const validateAndReadFile = async (filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    if (!content.trim()) {
      throw new Error('File is empty');
    }
    
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    } else if (error.code === 'EACCES') {
      throw new Error('Permission denied - cannot read file');
    } else {
      throw new Error(`Error reading file: ${error.message}`);
    }
  }
};

export const issuesCommand = async () => {
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
    
    // Prompt for file path
    const filePath = await promptFilePath();
    
    if (!filePath) {
      console.log('❌ File path is required.\n');
      return;
    }
    
    // Validate and read the checklist file
    let checklistContent;
    try {
      checklistContent = await validateAndReadFile(filePath);
    } catch (error) {
      console.log(`❌ ${error.message}\n`);
      return;
    }
    
    console.log(`✅ Successfully read checklist from: ${path.resolve(filePath)}`);
    
    // Ask for confirmation before parsing and creating issues
    console.log('\n📊 Ready to parse checklist and create GitHub issues.');
    console.log('⚠️  This will create new issues in your repository.');
    console.log('');
    
    const confirm = await promptUserInput('Do you want to proceed? (y/N): ');
    const shouldProceed = confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes';
    
    if (!shouldProceed) {
      console.log('� Issue creation cancelled.\n');
      return;
    }
    
    console.log('');
    const enhance = await promptUserInput('Would you like to enhance issues with AI descriptions? (y/N): ');
    const shouldEnhance = enhance.toLowerCase() === 'y' || enhance.toLowerCase() === 'yes';
    
    // Create issues with spinner
    const spinnerText = shouldEnhance 
      ? `Converting checklist with AI, parsing, and creating enhanced GitHub issues for ${owner}/${repo}...`
      : `Converting checklist with AI, parsing, and creating GitHub issues for ${owner}/${repo}...`;
      
    const spinner = ora({
      text: spinnerText,
      color: 'blue'
    }).start();
    
    try {
      const result = await parseChecklistAndCreateIssues(token, owner, repo, checklistContent, shouldEnhance);
      
      if (result.created.length === 0) {
        spinner.fail('Failed to create any issues');
        if (result.failed.length > 0) {
          console.log('\n❌ Errors encountered:');
          result.failed.slice(0, 3).forEach(failure => {
            console.log(`   • ${failure.issue.title}: ${failure.error}`);
          });
        }
        return;
      }
      
      spinner.succeed(`Successfully created ${result.created.length} GitHub issues!`);
      
      console.log(`\n🎉 Issues created successfully for ${owner}/${repo}!`);
      console.log(`📊 Created ${result.created.length} out of ${result.total} possible issues.`);
      
      if (result.failed.length > 0) {
        console.log(`⚠️  ${result.failed.length} issues failed to create.`);
      }
      
      console.log(`🔗 View them at: https://github.com/${owner}/${repo}/issues`);
      
      // Show first few issue URLs
      if (result.created.length > 0) {
        console.log('\n📝 Created issues:');
        result.created.slice(0, 5).forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.title} (#${issue.number})`);
        });
        
        if (result.created.length > 5) {
          console.log(`   ... and ${result.created.length - 5} more`);
        }
      }
      
    } catch (error) {
      spinner.fail('Failed to create issues');
      throw error;
    }
    
  } catch (error) {
    console.log('❌ Failed to create issues:', error.message);
    console.log('💡 Make sure the repository exists, you have write access, and the checklist file is properly formatted.\n');
  }
};