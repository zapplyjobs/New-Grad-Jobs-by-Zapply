// src/utility/parseJobs.js
export const parseJobsFromReadme = (readmeContent) => {
  const jobs = [];
  
  try {
    // Split content by lines for easier processing
    const lines = readmeContent.split('\n');
    
    let currentCompany = '';
    let currentEmoji = '';
    let inJobTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for company headers (e.g., "### 🟢 **Google** (5 positions) ⭐ FAANG+")
      const companyHeaderMatch = line.match(/###\s*([^\s]+)\s*\*\*([^*]+)\*\*/);
      if (companyHeaderMatch) {
        currentEmoji = companyHeaderMatch[1];
        currentCompany = companyHeaderMatch[2].trim();
        inJobTable = false;
        continue;
      }
      
      // Check for company names in <summary> tags - Multiple patterns
      
      // Pattern 1: <summary><strong>🏢 CompanyName</strong>
      const summaryMatch1 = line.match(/<summary><strong>([^\s]+)\s+([^<]+)<\/strong>/);
      if (summaryMatch1) {
        currentEmoji = summaryMatch1[1];
        currentCompany = summaryMatch1[2].trim().replace(/\([^)]*\)/, '').trim();
        inJobTable = false;
        continue;
      }
      
      // Pattern 2: <summary><h3>🏢 <strong>CompanyName</strong>
      const summaryMatch2 = line.match(/<summary><h3>([^\s]+)\s*<strong>([^<]+)<\/strong>/);
      if (summaryMatch2) {
        currentEmoji = summaryMatch2[1];
        currentCompany = summaryMatch2[2].trim().replace(/\([^)]*\)/, '').trim();
        inJobTable = false;
        continue;
      }
      
      // Pattern 3: Any text between <strong> tags in summary
      const summaryMatch3 = line.match(/<summary>.*?<strong>([^<]+)<\/strong>/);
      if (summaryMatch3) {
        const fullText = summaryMatch3[1].trim();
        // Extract emoji and company name
        const parts = fullText.split(/\s+/);
        if (parts.length >= 2) {
          currentEmoji = parts[0];
          currentCompany = parts.slice(1).join(' ').replace(/\([^)]*\)/, '').trim();
        } else {
          currentEmoji = '🏢';
          currentCompany = fullText.replace(/\([^)]*\)/, '').trim();
        }
        inJobTable = false;
        continue;
      }
      
      // Pattern 4: Handle malformed HTML tags that might create artifacts like "<strong>CompanyName"
      const malformedMatch = line.match(/<summary>.*?<strong>([^<>]+)/);
      if (malformedMatch && !currentCompany) {
        const fullText = malformedMatch[1].trim();
        const parts = fullText.split(/\s+/);
        if (parts.length >= 2) {
          currentEmoji = parts[0];
          currentCompany = parts.slice(1).join(' ').replace(/\([^)]*\)/, '').trim();
        } else {
          currentEmoji = '🏢';
          currentCompany = fullText.replace(/\([^)]*\)/, '').trim();
        }
        inJobTable = false;
        continue;
      }
      
      // Check for table header
      if (line.includes('| Role |') && line.includes('| Location |')) {
        inJobTable = true;
        continue;
      }
      
      // Skip separator lines
      if (line.includes('|---') || line.includes('|===')) {
        continue;
      }
      
      // Parse job rows
      if (inJobTable && line.startsWith('|') && currentCompany) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        
        // Need at least 6 cells: Role, Location, Posted, Level, Category, Apply
        if (cells.length >= 6) {
          let role = cells[0] || '';
          const location = cells[1] || '';
          const posted = cells[2] || '';
          const level = cells[3] || '';
          const category = cells[4] || '';
          const applyCell = cells[5] || '';
          
          // Skip if role is empty or contains table headers
          if (!role || role.toLowerCase().includes('role') || role.includes('---')) {
            continue;
          }
          
          // Extract indicators from role
          const isRemote = role.includes('🏠') || location.toLowerCase().includes('remote');
          const isUSOnly = role.includes('🇺🇸');
          
          // Clean role title
          role = role.replace(/🏠|🇺🇸/g, '').trim();
          
          // Extract apply link
          let applyLink = '#';
          const applyLinkMatch = applyCell.match(/\[Apply\]\(([^)]+)\)/);
          if (applyLinkMatch) {
            applyLink = applyLinkMatch[1];
          }
          
          // Skip empty roles
          if (!role || role.length < 2) {
            continue;
          }
          
          jobs.push({
            company: currentCompany,
            emoji: currentEmoji,
            role: role,
            location: location,
            posted: posted,
            level: level,
            category: category,
            applyLink: applyLink,
            isRemote: isRemote,
            isUSOnly: isUSOnly
          });
        }
      }
      
      // Reset when we hit a new section or end of company section
      if (line.startsWith('---') || line.startsWith('##') && !line.startsWith('###')) {
        inJobTable = false;
        currentCompany = '';
        currentEmoji = '';
      }
    }
    
    // If no jobs found with the above method, try alternative parsing
    if (jobs.length === 0) {
      console.log('🔄 Trying alternative parsing methods...');
      return parseJobsAlternative(readmeContent);
    }
    
    // Only try collapsible sections if we found fewer than expected jobs
    // AND if the README contains <details> sections
    const hasCollapsibleSections = readmeContent.includes('<details>');
    if (hasCollapsibleSections && jobs.length < 50) { // Assuming you expect more than 50 jobs
      console.log('📂 Checking for additional jobs in collapsible sections...');
      const collapsibleJobs = parseCollapsibleSections(readmeContent);
      if (collapsibleJobs.length > 0) {
        console.log(`📂 Found ${collapsibleJobs.length} additional jobs in collapsible sections`);
        jobs.push(...collapsibleJobs);
      }
    }
    
    console.log(`Parsed ${jobs.length} jobs from README`);
    return jobs;
    
  } catch (error) {
    console.error('Error parsing jobs from README:', error);
    return [];
  }
};

// Parse jobs from collapsible <details> sections
const parseCollapsibleSections = (readmeContent) => {
  const jobs = [];
  
  // Find all <details> sections
  const detailsRegex = /<details>(.*?)<\/details>/gs;
  let detailsMatch;
  
  while ((detailsMatch = detailsRegex.exec(readmeContent)) !== null) {
    const detailsContent = detailsMatch[1];
    
    // Extract company name from <summary>
    let company = 'Unknown Company';
    let emoji = '🏢';
    
    // Pattern 1: <summary><strong>🏢 CompanyName</strong>
    const summaryMatch1 = detailsContent.match(/<summary><strong>([^\s]+)\s+([^<]+)<\/strong>/);
    if (summaryMatch1) {
      emoji = summaryMatch1[1];
      company = summaryMatch1[2].trim().replace(/\([^)]*\)/, '').trim();
    }
    
    // Pattern 2: <summary><h3>🏢 <strong>CompanyName</strong>
    if (company === 'Unknown Company') {
      const summaryMatch2 = detailsContent.match(/<summary><h3>([^\s]+)\s*<strong>([^<]+)<\/strong>/);
      if (summaryMatch2) {
        emoji = summaryMatch2[1];
        company = summaryMatch2[2].trim().replace(/\([^)]*\)/, '').trim();
      }
    }
    
    // Pattern 3: Any <strong> content in summary
    if (company === 'Unknown Company') {
      const summaryMatch3 = detailsContent.match(/<summary>.*?<strong>([^<]+)<\/strong>/);
      if (summaryMatch3) {
        const fullText = summaryMatch3[1].trim();
        const parts = fullText.split(/\s+/);
        if (parts.length >= 2) {
          emoji = parts[0];
          company = parts.slice(1).join(' ').replace(/\([^)]*\)/, '').trim();
        } else {
          emoji = '🏢';
          company = fullText.replace(/\([^)]*\)/, '').trim();
        }
      }
    }
    
    // Find table rows in this details section
    const tableRows = detailsContent.split('\n').filter(line => 
      line.trim().startsWith('|') && 
      !line.includes('Role |') && 
      !line.includes('---|')
    );
    
    for (const row of tableRows) {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 6) {
        let role = cells[0] || '';
        const location = cells[1] || '';
        const posted = cells[2] || '';
        const level = cells[3] || '';
        const category = cells[4] || '';
        const applyCell = cells[5] || '';
        
        // Skip empty or header rows
        if (!role || role.toLowerCase().includes('role') || role.includes('---')) {
          continue;
        }
        
        // Extract indicators
        const isRemote = role.includes('🏠') || location.toLowerCase().includes('remote');
        const isUSOnly = role.includes('🇺🇸');
        role = role.replace(/🏠|🇺🇸/g, '').trim();
        
        // Extract apply link
        let applyLink = '#';
        const applyLinkMatch = applyCell.match(/\[Apply\]\(([^)]+)\)/);
        if (applyLinkMatch) {
          applyLink = applyLinkMatch[1];
        }
        
        if (role && role.length > 2) {
          jobs.push({
            company,
            emoji,
            role,
            location,
            posted,
            level,
            category,
            applyLink,
            isRemote,
            isUSOnly
          });
        }
      }
    }
  }
  
  return jobs;
};

// Alternative parsing method for different README formats
const parseJobsAlternative = (readmeContent) => {
  const jobs = [];
  
  // Try to find any job tables in the content
  const tableRegex = /\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*Apply[^|]*\|/g;
  const matches = readmeContent.match(tableRegex);
  
  if (!matches) return jobs;
  
  // Look for company context before each table
  const lines = readmeContent.split('\n');
  
  matches.forEach(match => {
    const cells = match.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    if (cells.length >= 6) {
      // Try to find company context
      let company = 'Unknown Company';
      let emoji = '🏢';
      
      // Look for nearby company headers or summary tags
      const matchIndex = readmeContent.indexOf(match);
      const beforeContent = readmeContent.substring(Math.max(0, matchIndex - 2000), matchIndex);
      const recentLines = beforeContent.split('\n').slice(-20);
      
      for (const line of recentLines.reverse()) {
        // Check for ### headers
        const companyMatch = line.match(/([^\s]+)\s*\*\*([^*]+)\*\*/);
        if (companyMatch) {
          emoji = companyMatch[1];
          company = companyMatch[2].trim();
          break;
        }
        
        // Check for <summary> tags - Pattern 1
        const summaryMatch1 = line.match(/<summary><strong>([^\s]+)\s+([^<]+)<\/strong>/);
        if (summaryMatch1) {
          emoji = summaryMatch1[1];
          company = summaryMatch1[2].trim().replace(/\([^)]*\)/, '').trim();
          break;
        }
        
        // Check for <summary> tags - Pattern 2
        const summaryMatch2 = line.match(/<summary><h3>([^\s]+)\s*<strong>([^<]+)<\/strong>/);
        if (summaryMatch2) {
          emoji = summaryMatch2[1];
          company = summaryMatch2[2].trim().replace(/\([^)]*\)/, '').trim();
          break;
        }
        
        // Check for <summary> tags - Pattern 3
        const summaryMatch3 = line.match(/<summary>.*?<strong>([^<]+)<\/strong>/);
        if (summaryMatch3) {
          const fullText = summaryMatch3[1].trim();
          const parts = fullText.split(/\s+/);
          if (parts.length >= 2) {
            emoji = parts[0];
            company = parts.slice(1).join(' ').replace(/\([^)]*\)/, '').trim();
          } else {
            emoji = '🏢';
            company = fullText.replace(/\([^)]*\)/, '').trim();
          }
          break;
        }
      }
      
      let role = cells[0] || '';
      const location = cells[1] || '';
      const posted = cells[2] || '';
      const level = cells[3] || '';
      const category = cells[4] || '';
      const applyCell = cells[5] || '';
      
      // Skip header rows
      if (role.toLowerCase().includes('role') || role.includes('---')) {
        return;
      }
      
      // Extract indicators
      const isRemote = role.includes('🏠') || location.toLowerCase().includes('remote');
      const isUSOnly = role.includes('🇺🇸');
      role = role.replace(/🏠|🇺🇸/g, '').trim();
      
      // Extract apply link
      let applyLink = '#';
      const applyLinkMatch = applyCell.match(/\[Apply\]\(([^)]+)\)/);
      if (applyLinkMatch) {
        applyLink = applyLinkMatch[1];
      }
      
      if (role && role.length > 2) {
        jobs.push({
          company,
          emoji,
          role,
          location,
          posted,
          level,
          category,
          applyLink,
          isRemote,
          isUSOnly
        });
      }
    }
  });
  
  console.log(`Alternative parsing found ${jobs.length} jobs`);
  return jobs;
};

// Utility function to clean and validate jobs
export const validateAndCleanJobs = (jobs) => {
  console.log('🧹 Cleaning and validating jobs...');
  console.log('📊 Raw job companies found:', [...new Set(jobs.map(job => job.company))]);
  
  // Debug: Show companies that contain HTML
  const htmlCompanies = jobs.filter(job => 
    job.company.includes('<') || job.company.includes('>') || job.company.toLowerCase().includes('strong')
  ).map(job => job.company);
  
  if (htmlCompanies.length > 0) {
    console.log('🚨 Companies with HTML detected:', htmlCompanies);
  }
  
  const cleanedJobs = jobs.filter(job => {
    // Remove invalid jobs
    if (!job.role || !job.company) return false;
    if (job.role.length < 2) return false;
    if (job.company.length < 2) return false;
    if (job.role.toLowerCase().includes('no current openings')) return false;
    if (job.company.toLowerCase().includes('more companies')) return false;
    if (job.company.toLowerCase().includes('archived')) return false;
    if (job.company.includes('<') || job.company.includes('>')) return false; // Filter HTML remnants
    if (job.company.toLowerCase().includes('strong')) return false; // Filter HTML tag names
    if (job.company.toLowerCase().includes('summary')) return false; // Filter HTML tag names
    if (job.company.toLowerCase().includes('details')) return false; // Filter HTML tag names
    if (/^[<>&"'\s]*$/.test(job.company)) return false; // Filter companies that are just HTML artifacts
    
    return true;
  }).map(job => ({
    ...job,
    // Normalize data and clean HTML tags
    company: job.company
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/[^\w\s&.\-]/g, '') // More selective character removal, keep hyphens and periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim(),
    role: job.role
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/[^\w\s&.\-]/g, '') // More selective character removal
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim(),
    emoji: job.emoji && job.emoji.length <= 2 && /[\u{1F600}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F300}-\u{1F5FF}]/u.test(job.emoji) 
      ? job.emoji 
      : '🏢', // Default emoji if invalid
    location: job.location || 'Not specified',
    posted: job.posted || 'Recently',
    level: job.level || 'Not specified',
    category: job.category || 'Software Engineering',
    applyLink: job.applyLink || '#'
  }));

  // Remove duplicates based on company + role + location combination
  const uniqueJobs = [];
  const seen = new Set();
  
  for (const job of cleanedJobs) {
    const key = `${job.company.toLowerCase()}|${job.role.toLowerCase()}|${job.location.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueJobs.push(job);
    } else {
      console.log(`🔄 Removed duplicate: ${job.company} - ${job.role}`);
    }
  }
  
  console.log('✅ Final cleaned companies:', [...new Set(uniqueJobs.map(job => job.company))]);
  console.log(`📈 Jobs: ${jobs.length} → ${cleanedJobs.length} after cleaning → ${uniqueJobs.length} after deduplication`);
  
  return uniqueJobs;
};