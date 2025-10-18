
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


