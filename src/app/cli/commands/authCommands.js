import { signInWithGitHubViaCLI } from '../../services/firebase.js';
import { saveToken, clearToken, getTokenFilePath } from '../tokenManager.js';

export const loginCommand = async () => {
  try {
    const { user, token } = await signInWithGitHubViaCLI();
    await saveToken(token);
    
    console.log(`✅ Successfully logged in as ${user.login}`);
    console.log(`🔑 Token saved to ${getTokenFilePath()}`);
    console.log('');
  } catch (error) {
    console.log('❌ Failed to authenticate with GitHub');
    console.log('');
    throw error;
  }
};

export const logoutCommand = async () => {
  await clearToken();
  console.log('✅ Successfully logged out');
  console.log('');
};