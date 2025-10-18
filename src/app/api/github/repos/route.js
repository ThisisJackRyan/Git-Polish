export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'thisisjackryan';


    const res = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });
  
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch repos' }), {
        status: res.status,
      });
    }
  
    const data = await res.json();
  
    // Return only repo names
    const repoNames = data.map(repo => {return {id:repo.id, name: repo.name, description: repo.description}});

  
    return Response.json(repoNames);
  }