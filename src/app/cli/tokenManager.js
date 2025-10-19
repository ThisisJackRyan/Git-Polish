import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const TOKEN_FILE = path.join(os.homedir(), '.git-polish-token');

export const saveToken = async (token) => {
  await fs.writeFile(TOKEN_FILE, token, { mode: 0o600 });
};

export const loadToken = async () => {
  try {
    const token = await fs.readFile(TOKEN_FILE, 'utf8');
    if (!token) { 
      console.log('❌ No token found. Please run "git-polish login" first.');
      return null;
    } 
    return token;
  } catch (error) {
    console.log('❌ Error occurred when loading token. Please run "git-polish login" first.');
    return null;
  }
};

export const clearToken = async () => {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch (error) {
    // File might not exist, which is fine
  }
};

export const getTokenFilePath = () => {
  return TOKEN_FILE;
};