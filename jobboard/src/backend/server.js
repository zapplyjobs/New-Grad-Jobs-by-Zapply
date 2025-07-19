// server.js - Express API Server
const express = require('express');
const cors = require('cors');
const { fetchAllRealJobs } = require('../utility/real-career-scraper');

const app = express();
const PORT = process.env.PORT || 3001;

// Load comprehensive company database
const fs = require('fs');
const companies = JSON.parse(fs.readFileSync('../utility/companies.json', 'utf8'));

// Flatten all companies for easy access
const ALL_COMPANIES = Object.values(companies).flat();
const COMPANY_BY_NAME = {};
ALL_COMPANIES.forEach(company => {
    COMPANY_BY_NAME[company.name.toLowerCase()] = company;
    company.api_names.forEach(name => {
        COMPANY_BY_NAME[name.toLowerCase()] = company;
    });
});

// Middleware
app.use(cors());
app.use(express.json());

// Cache for jobs data to avoid refetching too frequently
let jobsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// Utility functions (same as your existing ones)
function normalizeCompanyName(companyName) {
    const company = COMPANY_BY_NAME[companyName.toLowerCase()];
    return company ? company.name : companyName;
}

function getCompanyEmoji(companyName) {
    const company = COMPANY_BY_NAME[companyName.toLowerCase()];
    return company ? company.emoji : '🏢';
}

function getCompanyCareerUrl(companyName) {
    const company = COMPANY_BY_NAME[companyName.toLowerCase()];
    return company ? company.career_url : '#';
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return '1d ago';
        if (diffInDays < 7) return `${diffInDays}d ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
        return `${Math.floor(diffInDays / 30)}mo ago`;
    }
}

function isJobOlderThanWeek(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    return diffInDays >= 7;
}

function isUSOnlyJob(job) {
    const country = (job.job_country || '').toLowerCase().trim();
    const state = (job.job_state || '').toLowerCase().trim();
    const city = (job.job_city || '').toLowerCase().trim();
    
    // Exclude jobs explicitly in non-US countries
    const nonUSCountries = [
        'estonia', 'canada', 'uk', 'united kingdom', 'germany', 'france', 'netherlands', 
        'sweden', 'norway', 'denmark', 'finland', 'australia', 'india', 'singapore',
        'japan', 'south korea', 'brazil', 'mexico', 'spain', 'italy', 'poland',
        'ireland', 'israel', 'switzerland', 'austria', 'belgium', 'czech republic'
    ];
    
    if (nonUSCountries.includes(country)) return false;
    
    const nonUSCities = [
        'toronto', 'vancouver', 'montreal', 'london', 'berlin', 'amsterdam', 'stockholm',
        'copenhagen', 'helsinki', 'oslo', 'sydney', 'melbourne', 'bangalore', 'mumbai',
        'delhi', 'hyderabad', 'pune', 'singapore', 'tokyo', 'seoul', 'tel aviv',
        'zurich', 'geneva', 'dublin', 'tallinn', 'riga', 'vilnius', 'prague', 'budapest'
    ];
    
    if (nonUSCities.includes(city)) return false;
    
    return true; // Default to include US jobs
}

function getExperienceLevel(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('sr.') || text.includes('lead') || 
        text.includes('principal') || text.includes('staff') || text.includes('architect')) {
        return 'Senior';
    }
    
    if (text.includes('entry') || text.includes('junior') || text.includes('jr.') || 
        text.includes('new grad') || text.includes('graduate') || text.includes('university grad') ||
        text.includes('college grad') || text.includes(' grad ') || text.includes('recent grad') ||
        text.includes('intern') || text.includes('associate') || text.includes('level 1') || 
        text.includes('l1') || text.includes('campus') || text.includes('student') ||
        text.includes('early career') || text.includes('0-2 years')) {
        return 'Entry-Level';
    }
    
    return 'Mid-Level';
}

function getJobCategory(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('ios') || text.includes('android') || text.includes('mobile') || text.includes('react native')) {
        return 'Mobile Development';
    }
    if (text.includes('frontend') || text.includes('front-end') || text.includes('react') || text.includes('vue') || text.includes('ui')) {
        return 'Frontend Development'; 
    }
    if (text.includes('backend') || text.includes('back-end') || text.includes('api') || text.includes('server')) {
        return 'Backend Development';
    }
    if (text.includes('machine learning') || text.includes('ml ') || text.includes('ai ') || text.includes('artificial intelligence') || text.includes('deep learning')) {
        return 'Machine Learning & AI';
    }
    if (text.includes('data scientist') || text.includes('data analyst') || text.includes('analytics') || text.includes('data engineer')) {
        return 'Data Science & Analytics';
    }
    if (text.includes('devops') || text.includes('infrastructure') || text.includes('cloud') || text.includes('platform')) {
        return 'DevOps & Infrastructure';
    }
    if (text.includes('security') || text.includes('cybersecurity') || text.includes('infosec')) {
        return 'Security Engineering';
    }
    if (text.includes('product manager') || text.includes('product owner') || text.includes('pm ')) {
        return 'Product Management';
    }
    if (text.includes('design') || text.includes('ux') || text.includes('ui')) {
        return 'Design';
    }
    if (text.includes('full stack') || text.includes('fullstack')) {
        return 'Full Stack Development';
    }
    
    return 'Software Engineering';
}

function formatLocation(city, state) {
    if (!city && !state) return 'Remote';
    if (!city) return state;
    if (!state) return city;
    if (city.toLowerCase() === 'remote') return 'Remote';
    return `${city}, ${state}`;
}

function generateCompanyStats(jobs) {
    const stats = {
        byCategory: {},
        byLevel: { 'Entry-Level': 0, 'Mid-Level': 0, 'Senior': 0 },
        byLocation: {},
        totalByCompany: {}
    };
    
    jobs.forEach(job => {
        // Category stats
        const category = getJobCategory(job.job_title, job.job_description);
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        // Level stats
        const level = getExperienceLevel(job.job_title, job.job_description);
        stats.byLevel[level]++;
        
        // Location stats
        const location = formatLocation(job.job_city, job.job_state);
        stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
        
        // Company stats
        stats.totalByCompany[job.employer_name] = (stats.totalByCompany[job.employer_name] || 0) + 1;
    });
    
    return stats;
}

// Enhanced filtering with better company matching
function filterTargetCompanyJobs(jobs) {
    console.log('🎯 Filtering for target companies...');
    
    const targetJobs = jobs.filter(job => {
        const companyName = (job.employer_name || '').toLowerCase();
        
        // Check against our comprehensive company list
        const isTargetCompany = COMPANY_BY_NAME[companyName] !== undefined;
        
        if (isTargetCompany) {
            // Normalize company name for consistency
            job.employer_name = normalizeCompanyName(job.employer_name);
            return true;
        }
        
        // Additional fuzzy matching for variations
        for (const company of ALL_COMPANIES) {
            for (const apiName of company.api_names) {
                if (companyName.includes(apiName.toLowerCase()) && apiName.length > 3) {
                    job.employer_name = company.name;
                    return true;
                }
            }
        }
        
        return false;
    });
    
    console.log(`✨ Filtered to ${targetJobs.length} target company jobs`);
    
    // Remove duplicates more intelligently
    const uniqueJobs = targetJobs.filter((job, index, self) => {
        return index === self.findIndex(j => 
            j.job_title === job.job_title && 
            j.employer_name === job.employer_name &&
            j.job_city === job.job_city
        );
    });
    
    console.log(`🧹 After deduplication: ${uniqueJobs.length} unique jobs`);
    
    // Sort by company tier and recency
    uniqueJobs.sort((a, b) => {
        // Prioritize FAANG+ companies
        const aIsFAANG = companies.faang_plus.some(c => c.name === a.employer_name);
        const bIsFAANG = companies.faang_plus.some(c => c.name === b.employer_name);
        
        if (aIsFAANG && !bIsFAANG) return -1;
        if (!aIsFAANG && bIsFAANG) return 1;
        
        // Then by recency
        const aDate = new Date(a.job_posted_at_datetime_utc || 0);
        const bDate = new Date(b.job_posted_at_datetime_utc || 0);
        return bDate - aDate;
    });
    
    return uniqueJobs;
}

// Generate structured job data for frontend
function generateJobsData(currentJobs, archivedJobs = []) {
    const currentDate = new Date().toISOString();
    const stats = generateCompanyStats(currentJobs);
    
    // Enhance jobs with additional metadata
    const enhancedCurrentJobs = currentJobs.map(job => ({
        ...job,
        company_emoji: getCompanyEmoji(job.employer_name),
        company_career_url: getCompanyCareerUrl(job.employer_name),
        experience_level: getExperienceLevel(job.job_title, job.job_description),
        job_category: getJobCategory(job.job_title, job.job_description),
        formatted_location: formatLocation(job.job_city, job.job_state),
        time_ago: formatTimeAgo(job.job_posted_at_datetime_utc),
        is_remote: (job.job_city || '').toLowerCase().includes('remote') || 
                  (job.job_description || '').toLowerCase().includes('remote'),
        requires_us_auth: (job.job_description || '').toLowerCase().includes('no sponsorship') || 
                         (job.job_description || '').toLowerCase().includes('us citizen'),
        is_faang: companies.faang_plus.some(c => c.name === job.employer_name)
    }));

    const enhancedArchivedJobs = archivedJobs.map(job => ({
        ...job,
        company_emoji: getCompanyEmoji(job.employer_name),
        company_career_url: getCompanyCareerUrl(job.employer_name),
        experience_level: getExperienceLevel(job.job_title, job.job_description),
        job_category: getJobCategory(job.job_title, job.job_description),
        formatted_location: formatLocation(job.job_city, job.job_state),
        time_ago: formatTimeAgo(job.job_posted_at_datetime_utc),
        is_remote: (job.job_city || '').toLowerCase().includes('remote') || 
                  (job.job_description || '').toLowerCase().includes('remote'),
        requires_us_auth: (job.job_description || '').toLowerCase().includes('no sponsorship') || 
                         (job.job_description || '').toLowerCase().includes('us citizen'),
        is_faang: companies.faang_plus.some(c => c.name === job.employer_name)
    }));

    return {
        metadata: {
            lastUpdated: currentDate,
            totalJobs: currentJobs.length,
            archivedJobs: archivedJobs.length,
            totalCompanies: Object.keys(stats.totalByCompany).length,
            faangJobs: currentJobs.filter(job => 
                companies.faang_plus.some(c => c.name === job.employer_name)
            ).length,
            updateFrequency: 'Real-time',
            nextUpdate: 'On demand'
        },
        stats: {
            byLevel: stats.byLevel,
            byCategory: stats.byCategory,
            byLocation: stats.byLocation,
            byCompany: stats.totalByCompany
        },
        companies: {
            faang_plus: companies.faang_plus,
            unicorn_startups: companies.unicorn_startups,
            fintech: companies.fintech,
            gaming: companies.gaming,
            media_entertainment: companies.media_entertainment,
            top_tech: companies.top_tech,
            enterprise_saas: companies.enterprise_saas
        },
        jobs: {
            current: enhancedCurrentJobs,
            archived: enhancedArchivedJobs
        }
    };
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        cache: lastFetchTime ? {
            lastFetch: lastFetchTime,
            cacheAge: Date.now() - lastFetchTime,
            isCached: (Date.now() - lastFetchTime) < CACHE_DURATION
        } : null
    });
});

// Get jobs endpoint
app.get('/api/jobs', async (req, res) => {
    try {
        console.log('📡 API request received for jobs data');
        
        // Check if we have cached data that's still fresh
        const now = Date.now();
        const isCacheValid = jobsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION;
        
        if (isCacheValid) {
            console.log('⚡ Serving cached data');
            return res.json({
                ...jobsCache,
                metadata: {
                    ...jobsCache.metadata,
                    servedFromCache: true,
                    cacheAge: now - lastFetchTime
                }
            });
        }
        
        console.log('🔍 Fetching fresh job data...');
        
        // Fetch fresh data
        const allJobs = await fetchAllRealJobs();
        
        if (allJobs.length === 0) {
            return res.status(503).json({ 
                error: 'No jobs found', 
                message: 'Unable to fetch job data at this time' 
            });
        }
        
        // Filter US-only jobs
        const usJobs = allJobs.filter(job => isUSOnlyJob(job));
        
        // Filter target company jobs
        const targetJobs = filterTargetCompanyJobs(usJobs);
        
        // Separate current and archived jobs
        const currentJobs = targetJobs.filter(job => !isJobOlderThanWeek(job.job_posted_at_datetime_utc));
        const archivedJobs = targetJobs.filter(job => isJobOlderThanWeek(job.job_posted_at_datetime_utc));
        
        // Generate structured data
        const jobsData = generateJobsData(currentJobs, archivedJobs);
        
        // Cache the results
        jobsCache = jobsData;
        lastFetchTime = now;
        
        console.log(`✅ Successfully fetched ${currentJobs.length} current jobs from ${Object.keys(jobsData.stats.totalByCompany).length} companies`);
        
        res.json(jobsData);
        
    } catch (error) {
        console.error('❌ Error fetching jobs:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Unable to fetch job data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Force refresh endpoint (clears cache)
app.post('/api/jobs/refresh', async (req, res) => {
    try {
        console.log('🔄 Force refresh requested');
        
        // Clear cache
        jobsCache = null;
        lastFetchTime = null;
        
        // Fetch fresh data
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/jobs`);
        const data = await response.json();
        
        res.json({
            message: 'Data refreshed successfully',
            data: data
        });
        
    } catch (error) {
        console.error('❌ Error during force refresh:', error);
        res.status(500).json({ 
            error: 'Refresh failed', 
            message: error.message 
        });
    }
});

// Get companies endpoint
app.get('/api/companies', (req, res) => {
    res.json({
        faang_plus: companies.faang_plus,
        unicorn_startups: companies.unicorn_startups,
        fintech: companies.fintech,
        gaming: companies.gaming,
        media_entertainment: companies.media_entertainment,
        top_tech: companies.top_tech,
        enterprise_saas: companies.enterprise_saas,
        total_companies: ALL_COMPANIES.length
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Zapply Jobs API Server running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  /api/jobs - Fetch all jobs`);
    console.log(`   POST /api/jobs/refresh - Force refresh`);
    console.log(`   GET  /api/companies - Get companies`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`🔄 Cache duration: ${CACHE_DURATION / 1000 / 60} minutes`);
});

module.exports = app;