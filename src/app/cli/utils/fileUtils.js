import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { promptUserInput } from '../displayUtils.js';

export const extractContentFromData = (data, contentKey = 'summary') => {
  if (typeof data === 'string') {
    return data;
  } else if (data[contentKey]) {
    return data[contentKey];
  } else {
    return JSON.stringify(data, null, 2);
  }
};

export const promptForFileLocation = async (owner, repo, fileType = 'readme', extension = 'md') => {
  const filename = `${owner}-${repo}-${fileType}.${extension}`;
  
  console.log(`\n📁 Where would you like to save the ${fileType.toUpperCase()} file?`);
  console.log('1. Current directory (default)');
  console.log('2. Custom location (relative to current directory)');
  console.log('')
  
  const locationChoice = await promptUserInput('Enter your choice (1-2, default is 1): ');
  
  let filepath;
  if (locationChoice.trim() === '2') {
    const customPath = await promptUserInput(`Enter relative path (e.g., "docs", "output/${fileType}s"): `);
    if (customPath.trim()) {
      filepath = join(process.cwd(), customPath.trim(), filename);
    } else {
      filepath = join(process.cwd(), filename);
    }
  } else {
    filepath = join(process.cwd(), filename);
  }
  
  return filepath;
};

export const writeFileWithDirectoryCreation = async (filepath, content) => {
  try {
    await mkdir(dirname(filepath), { recursive: true });
    await writeFile(filepath, content, 'utf8');
    return true;
  } catch (error) {
    console.log('❌ Failed to create directory or write file:', error.message);
    return false;
  }
};