import queryGemini from "../api/gemini.js";

export const fetchGithubRepos = async (token, page=null, perPage=null) => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    let allRepos = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const res = await fetch(
        `https://api.github.com/user/repos?page=${currentPage}&per_page=100&sort=updated`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch repositories: ${res.status}`);
      }

      const data = await res.json();
      allRepos = allRepos.concat(data);

      hasMorePages = data.length === 100;
      currentPage++;
    }


    if (page != null && perPage != null) {
      // Apply pagination to the complete dataset
      const startIndex = (page - 1) * perPage
      const endIndex = startIndex + perPage
      allRepos = allRepos.slice(startIndex, endIndex)
    }

    const repoData = allRepos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      html_url: repo.html_url,
      description: repo.description,
      visibility: repo.private ? 'private' : 'public',
      owner: {
        login: repo.owner.login,
        type: repo.owner.type,
        avatar_url: repo.owner.avatar_url,
      },
    }));

    const totalRepos = allRepos.length
    const totalPages = Math.ceil(totalRepos / perPage)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return { allRepos:repoData, totalRepos:totalRepos, totalPages:totalPages, hasNextPage:hasNextPage, hasPrevPage:hasPrevPage};

  } catch (error) {
    throw new Error(`Error fetching repositories: ${error.message}`);
  }
};

export const generateRepoData = async (token, repo, owner) => {
  try {
    const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/readmeGen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubtoken: token, repo: repo, owner: owner })
    });

    if (!res.ok) {
      // prefer to inspect body on error
      const text = await res.text();
      throw new Error(`Request failed (${res.status}): ${text}`);
    }

    const data = await res.json(); // parse JSON body

    return data;
  } catch (err) {
  console.error('Fetch error:', err);
  }
}

export const getUpdatedDescriptionBasedOnReadMe = async(token, repo, owner) => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch readme (${res.status}): ${text}`);
    }

    const data = await res.json(); // parse JSON body

    const prompt = "You are fed a README.md file below. You are to summarize the README in 2 sentences max. This is for the description of a GitHub repository.\n\n";
  
    // decode base64 README content to string
    const readmetext = Buffer.from(data.content, 'base64').toString('utf8')

    console.log(prompt + readmetext);

    return await queryGemini(prompt + readmetext);
  } catch (error) {
    throw new Error(`Error fetching readme: ${error.message}`);
  }
}

export const updateDescription = async(token, repo, owner, desc) => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ description: desc })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed update description (${res.status}): ${text}`);
    }

    return res;

  } catch(error) {
    throw new Error(`Error pushing description: ${error.message}`);
  }
}

