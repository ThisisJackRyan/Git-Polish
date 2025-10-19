import readline from 'readline';

// Text formatting utilities
export const truncateText = (text, maxLength = 200) => {
  if (!text) return 'No description';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const formatRepository = (repo, index) => {
  const title = `${index + 1}. ${repo.name}`;
  const description = truncateText(repo.description);
  const url = repo.html_url;
  const visibility = repo.visibility;
  const visibilityIcon = visibility === 'private' ? '🔒' : '🌐';
  const ownerType = repo.owner.type === 'Organization' ? '🏢' : '👤';
  
  return `
📦 ${title} ${visibilityIcon} ${visibility}
   ${description}
   ${ownerType} Owner: ${repo.owner.login} (${repo.owner.type})
   🔗 ${url}
`;
};

// Pagination utilities
export const paginateArray = (array, page = 1, pageSize = 5) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / pageSize);
  
  return {
    items,
    currentPage: page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    totalItems: array.length
  };
};

export const displayPaginationInfo = (pagination) => {
  console.log(`\n📊 Showing ${pagination.items.length} of ${pagination.totalItems} repositories`);
  console.log(`📄 Page ${pagination.currentPage} of ${pagination.totalPages}`);
};

// Interactive prompt utilities
export const createPrompt = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

export const promptUser = (rl, message) => {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
};

// Reusable pagination input handler
export const handlePaginationInput = async (rl, hasNext) => {
  if (hasNext) {
    console.log('\n💡 Press Enter for next page, or "q" to quit');
    const input = await promptUser(rl, '> ');
    
    if (input === 'q' || input === 'quit') {
      console.log('👋 Goodbye!');
      return 'quit';
    }
    
    return 'next';
  } else {
    console.log('\n✅ End of results');
    return 'end';
  }
};

// High-level display function
export const displayRepositoriesInteractively = async (repos) => {
  const pageSize = 5;
  let currentPage = 1;
  const totalPages = Math.ceil(repos.length / pageSize);
  const rl = createPrompt();
  
  try {
    while (currentPage <= totalPages) {
      // Clear screen for better UX (optional)
      console.clear();
      
      const pagination = paginateArray(repos, currentPage, pageSize);
      
      console.log('📋 Your GitHub Repositories:\n');
      
      pagination.items.forEach((repo, index) => {
        const globalIndex = (currentPage - 1) * pageSize + index;
        console.log(formatRepository(repo, globalIndex));
      });
      
      displayPaginationInfo(pagination);
      
      const action = await handlePaginationInput(rl, pagination.hasNext);
      
      if (action === 'quit') {
        break;
      } else if (action === 'next') {
        currentPage++;
      } else if (action === 'end') {
        break;
      }
    }
  } finally {
    rl.close();
  }
};

export const promptUserInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

export const promptRepoDetails = async () => {
  console.log('💡 Tip: You can use the "git-polish list" command to see your repositories and find the owner/repo names.');
  console.log('');
  
  const owner = await promptUserInput('Enter the repository owner (username/organization): ');
  const repo = await promptUserInput('Enter the repository name: ');
  
  return { owner, repo };
};

export const promptReadmeDecision = async () => {
  console.log('\n📝 What would you like to do with the generated README?');
  console.log('1. Accept and commit to repository');
  console.log('2. Regenerate with suggestions');
  console.log('3. Discard and keep existing README');
  console.log('');
  
  const choice = await promptUserInput('Enter your choice (1-3): ');
  return choice.trim();
};

export const promptRegenerationSuggestions = async () => {
  console.log('\n💡 Please provide suggestions for improving the README:');
  console.log('(e.g., "Add more technical details", "Make it more concise", "Include installation steps")');
  
  const suggestions = await promptUserInput('Your suggestions: ');
  return suggestions.trim();
};