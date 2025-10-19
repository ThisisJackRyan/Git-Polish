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

    return await queryGemini(prompt + readmetext);
  } catch (error) {
    throw new Error(`Error fetching readme: ${error.message}`);
  }
}

export const generateChecklistData = async (token, repo, owner) => {
  try {
    const res = await fetch('https://us-central1-gitpolish.cloudfunctions.net/generateChecklist', {
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

export const updateReadme = async (token, repo, owner, readmeContent, commitMessage = 'Update README') => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    const path = "README.md";
    
    // Step 1: Try to get existing file (to grab sha)
    const getResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    let sha = null;
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
    }

    // Step 2: PUT request with sha if updating
    const putResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(readmeContent, 'utf8').toString('base64'), // Base64 encode the content
        sha: sha || undefined,
      }),
    });

    if (!putResp.ok) {
      const errorText = await putResp.text();
      throw new Error(`Failed to update README (${putResp.status}): ${errorText}`);
    }

    const result = await putResp.json();
    return result;
  } catch (err) {
    console.error('Error updating README:', err);
    throw err;
  }
};

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
};

export const createGithubIssue = async (token, owner, repo, title, body, labels = []) => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          body: body,
          labels: labels
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create issue (${res.status}): ${text}`);
    }

    const issue = await res.json();
    return issue;

  } catch (error) {
    throw new Error(`Error creating issue: ${error.message}`);
  }
};

export const convertChecklistToReadableFormat = async (checklistContent) => {
  try {
    const prompt = `You are given raw checklist content that needs to be converted into a well-structured, readable format for GitHub issue creation. 

Please analyze the content and convert it into a clean, organized format with:
1. Clear section headers (using # or ##)
2. Well-formatted checklist items (using - [ ] format)
3. Proper organization and grouping
4. Remove any duplicates or irrelevant content
5. Ensure each task is clear and actionable

Raw checklist content:
${checklistContent}

Please respond with ONLY the formatted checklist content, no explanations or additional text. Use proper markdown formatting:

# Section Name
## Subsection (if needed)
- [ ] Clear, actionable task description
- [ ] Another task description

Format it ready for parsing into GitHub issues.`;

    const formattedContent = await queryGemini(prompt);
    return formattedContent || checklistContent; // Fallback to original if AI fails
  } catch (error) {
    console.warn('Failed to format checklist with AI:', error.message);
    return checklistContent; // Fallback to original content
  }
};

export const enhanceTaskWithAI = async (task, section, subsection) => {
  try {
    const prompt = `You are given a task from a project checklist. Please enhance this task by:
1. Providing a more detailed description
2. Breaking it down into actionable steps
3. Suggesting any potential challenges or considerations

Task: "${task}"
Section: "${section || 'General'}"
Subsection: "${subsection || 'N/A'}"

Please respond with a structured format:
**Enhanced Description:**
[Your enhanced description here]

**Action Steps:**
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

**Considerations:**
- Potential challenge or consideration
- Another consideration if applicable

Keep the response concise but helpful.`;

    const enhancedContent = await queryGemini(prompt);
    return enhancedContent || `**Task:** ${task}\n\nThis task needs to be completed as part of the project checklist.`;
  } catch (error) {
    console.warn('Failed to enhance task with AI:', error.message);
    return `**Task:** ${task}\n\nThis task needs to be completed as part of the project checklist.`;
  }
};

export const parseChecklistAndCreateIssues = async (token, owner, repo, checklistContent, enhanceWithAI = false) => {
  if (!token) {
    throw new Error('GitHub token is required');
  }

  try {
    // First, use AI to convert the checklist into a readable, well-structured format
    const formattedContent = await convertChecklistToReadableFormat(checklistContent);
    
    // Parse the formatted checklist content into individual tasks
    const lines = formattedContent.split('\n').filter(line => line.trim());
    const issues = [];
    let currentSection = '';
    let currentSubsection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a main section header (starts with #)
      if (trimmedLine.match(/^#+\s+/)) {
        const headerLevel = trimmedLine.match(/^#+/)[0].length;
        const headerText = trimmedLine.replace(/^#+\s*/, '');
        
        if (headerLevel <= 2) {
          currentSection = headerText;
          currentSubsection = '';
        } else {
          currentSubsection = headerText;
        }
        continue;
      }
      
      // Check if line is a checklist item (starts with - [ ] or - [x])
      if (trimmedLine.match(/^-\s*\[\s*[x\s]*\]\s*/)) {
        const task = trimmedLine.replace(/^-\s*\[\s*[x\s]*\]\s*/, '').trim();
        if (task) {
          // Create meaningful title
          let title = task;
          if (currentSubsection) {
            title = `[${currentSubsection}] ${task}`;
          } else if (currentSection) {
            title = `[${currentSection}] ${task}`;
          }
          
          // Create detailed body with context
          let body;
          if (enhanceWithAI) {
            body = await enhanceTaskWithAI(task, currentSection, currentSubsection);
          } else {
            body = `This task is part of the project checklist and needs to be completed.\n\n`;
            body += `**Task:** ${task}\n\n`;
            
            if (currentSection) {
              body += `**Section:** ${currentSection}\n`;
            }
            if (currentSubsection) {
              body += `**Subsection:** ${currentSubsection}\n`;
            }
            
            body += `\n**Instructions:**\n`;
            body += `- [ ] Review the task requirements\n`;
            body += `- [ ] Implement the necessary changes\n`;
            body += `- [ ] Test the implementation\n`;
            body += `- [ ] Update documentation if needed\n`;
            body += `- [ ] Mark this issue as complete\n\n`;
            body += `*This issue was automatically generated from the project checklist.*`;
          }
          
          // Determine labels based on content
          const labels = ['checklist', 'task'];
          
          // Add context-based labels
          if (currentSection) {
            labels.push(currentSection.toLowerCase().replace(/[^a-z0-9]/g, '-'));
          }
          
          // Add priority/type labels based on keywords
          const taskLower = task.toLowerCase();
          if (taskLower.includes('bug') || taskLower.includes('fix')) {
            labels.push('bug');
          } else if (taskLower.includes('feature') || taskLower.includes('add')) {
            labels.push('enhancement');
          } else if (taskLower.includes('doc') || taskLower.includes('readme')) {
            labels.push('documentation');
          } else if (taskLower.includes('test')) {
            labels.push('testing');
          }
          
          issues.push({
            title: title.length > 100 ? title.substring(0, 97) + '...' : title,
            body: body,
            labels: labels
          });
        }
      }
    }
    
    if (issues.length === 0) {
      throw new Error('No checklist items found in the provided content');
    }
    
    // Create issues in GitHub with rate limiting
    const createdIssues = [];
    const failedIssues = [];
    
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      try {
        const createdIssue = await createGithubIssue(token, owner, repo, issue.title, issue.body, issue.labels);
        createdIssues.push(createdIssue);
        
        // Add small delay to avoid rate limiting
        if (i < issues.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to create issue "${issue.title}":`, error.message);
        failedIssues.push({ issue, error: error.message });
      }
    }
    
    return {
      created: createdIssues,
      failed: failedIssues,
      total: issues.length
    };

  } catch (error) {
    throw new Error(`Error parsing checklist and creating issues: ${error.message}`);
  }
};


