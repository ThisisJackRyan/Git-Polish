import ora from 'ora';
import { loadToken } from '../tokenManager.js';
import { fetchGithubRepos } from '../../services/github.js';
import { displayRepositoriesInteractively } from '../displayUtils.js';

export const listCommand = async () => {
  const token = await loadToken();
  if (!token) {
    return;
  }
  
  console.log('')

  const spinner = ora({
    text: 'Fetching your GitHub repositories...',
    color: 'blue'
  }).start();
  
  try {
    const reposResponse = await fetchGithubRepos(token);
    
    if (reposResponse.allRepos.length === 0) {
      spinner.warn('No repositories found');
      return;
    }
    
    spinner.succeed(`Found ${reposResponse.allRepos.length} repositories`);
    await displayRepositoriesInteractively(reposResponse.allRepos);
    
  } catch (error) {
    spinner.fail('Failed to fetch repositories. Token may be invalid.');
    console.log('💡 Try running "git-polish login" again.\n');
  }
};