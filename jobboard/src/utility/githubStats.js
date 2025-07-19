// utils/githubStats.js
export const fetchGitHubStats = async () => {
  try {
    const repo = 'zapplyjobs/New-Grad-Jobs-by-Zapply'; // Your repo
    const response = await fetch(
      `https://raw.githubusercontent.com/${repo}/main/README.md`
    );
    const readmeText = await response.text();

    // Updated regex patterns to match your README structure
    const activeJobs = parseInt(readmeText.match(/🔥 Active Positions\*\*: (\d+)/)?.[1] || '0');
    const companies = parseInt(readmeText.match(/🏢 Companies\*\*: (\d+)/)?.[1] || '0');
    const faangJobs = parseInt(readmeText.match(/⭐ FAANG\+ Jobs\*\*: (\d+)/)?.[1] || '0');
    const lastUpdated = readmeText.match(/📅 Last Updated\*\*: (.+?)(\n|$)/)?.[1] || 'N/A';

    return {
      activeJobs,
      companies,
      faangJobs,
      lastUpdated
    };
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    return {
      activeJobs: 0,
      companies: 0,
      faangJobs: 0,
      lastUpdated: 'Error fetching data'
    };
  }
};