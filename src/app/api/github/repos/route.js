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
      // Fetch all repositories using pagination
      let allRepos = []
      let currentPage = 1
      let hasMorePages = true
  
      while (hasMorePages) {
        const res = await fetch(
          `https://api.github.com/user/repos?page=${currentPage}&per_page=100&sort=updated`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github+json',
            },
          }
        )
  
        if (!res.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch repos' }),
            {
              status: res.status,
            }
          )
        }
  
        const data = await res.json()
        allRepos = allRepos.concat(data)
  
        // Check if there are more pages
        hasMorePages = data.length === 100
        currentPage++
      }
  
      // Apply pagination to the complete dataset
      const startIndex = (page - 1) * perPage
      const endIndex = startIndex + perPage
      const paginatedRepos = allRepos.slice(startIndex, endIndex)
  
      // Return comprehensive repo data including visibility and owner info
      const repoData = paginatedRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
        visibility: repo.private ? 'private' : 'public',
        owner: {
          login: repo.owner.login,
          type: repo.owner.type, // 'User' or 'Organization'
          avatar_url: repo.owner.avatar_url,
        },
      }))
  
      // Calculate pagination metadata
      const totalRepos = allRepos.length
      const totalPages = Math.ceil(totalRepos / perPage)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1
  
      return Response.json({
        repos: repoData,
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
  