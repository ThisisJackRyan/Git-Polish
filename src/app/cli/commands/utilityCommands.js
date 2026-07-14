import { regenReadMe } from '../../lib/ai.js';
import { generateRepoData } from '../../services/github.js';

export const geminiCommand = async () => {
  const res = await regenReadMe();
  console.log('CLI says:', res);
};

export const repodataCommand = async (owner, repo, token) => {
  try {
    const data = await generateRepoData(token, repo, owner);
    console.log('CLI says:', data?.summary);
  } catch (err) {
    console.error('README generation error:', err);
  }
};