export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')


    if (!token){
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
            status: res.status,
        });
    }

    const res = await fetch(`https://api.github.com/user/repos`, {
      headers: {
        Authorization: `token ${token}`,
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