// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GithubAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GithubAuthProvider();

provider.addScope("repo");
provider.addScope("read:user");

export const signInWithGitHub = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log(credential.accessToken);
    return { user, token };
  } catch (err) {
    console.error("GitHub login error:", err);
    throw err;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (err) {
    console.error("Sign out error:", err);
    throw err;
  }
};

export const signInWithGitHubViaCLI = async () => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  
  const { device_code, user_code, verification_uri, expires_in, interval } = await requestDeviceCode(clientId);
  
  displayUserInstructions(verification_uri, user_code);
  
  const accessToken = await waitForAuthorization(clientId, device_code, expires_in, interval);
  
  const user = await fetchGitHubUser(accessToken);
  
  return { user, token: accessToken };
};

const requestDeviceCode = async (clientId) => {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      scope: 'repo read:user'
    })
  });

  return await response.json();
};

const pollForAccessToken = async (clientId, deviceCode) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  });

  return await response.json();
};

const fetchGitHubUser = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${accessToken}` }
  });
  return await response.json();
};

const displayUserInstructions = (verificationUri, userCode) => {
  console.log('');
  console.log(`Go to: ${verificationUri}`);
  console.log(`Enter code: ${userCode}`);
  console.log('');
};

const waitForAuthorization = async (clientId, deviceCode, expiresIn, interval) => {
  const { default: ora } = await import('ora');
  const spinner = ora({
    text: 'Waiting for GitHub browser authentication...',
    color: 'magenta'
  }).start();
  
  const startTime = Date.now();
  
  try {
    while (Date.now() - startTime < expiresIn * 1000) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      
      const tokenData = await pollForAccessToken(clientId, deviceCode);
      
      if (tokenData.access_token) {
        spinner.succeed('GitHub authentication completed!');
        return tokenData.access_token;
      }
      
      if (tokenData.error !== 'authorization_pending') {
        spinner.fail('GitHub authentication failed');
        throw new Error(tokenData.error);
      }
    }
    
    spinner.fail('GitHub authentication timed out');
    throw new Error('Authentication timeout');
  } catch (error) {
    spinner.fail('GitHub authentication failed');
    throw error;
  }
};


