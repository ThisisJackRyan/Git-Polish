import fetch from 'node-fetch';
import { fetchGithubRepos } from "@/app/services/github";

const GITHUB_API = 'https://api.github.com';

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const page = parseInt(searchParams.get('page')) || 1
    const perPage = parseInt(searchParams.get('per_page')) || 30
  
    if (!token) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
      })
    }
  
    try {
      const {allRepos, totalRepos, totalPages, hasNextPage, hasPrevPage } = await fetchGithubRepos(token, page, perPage)
  
      return Response.json({
        repos: allRepos,
        pagination: {
          currentPage: page,
          totalPages,
          totalRepos,
          perPage,
          hasNextPage,
          hasPrevPage,
        },
      })
    } catch (error) {
      console.error('Error fetching repositories:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
      })
    }
  }
  

// owner is github username
// repo is repo name
// token is github oauth token
export async function fetchRepoFiles(owner, repo, token) {
  const headers = { Authorization: `token ${token}` };

  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers });
  const { tree } = await treeRes.json();

  const files = await Promise.all(tree
    .filter(f => f.type === 'blob' && !f.path.includes('node_modules'))
    .map(async f => {
      const contentRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${f.path}`, { headers });
      const contentJson = await contentRes.json();
      return {
        path: f.path,
        content: Buffer.from(contentJson.content, 'base64').toString('utf8'),
      };
    })
  );

  return files;
}
