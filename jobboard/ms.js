const Puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeMetaJobs() {
    console.log('🔍 Starting Meta job scraping...');

    const browser = await Puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const maxPages = 10;
    let allJobs = [];

    const baseUrl = 'https://www.metacareers.com/jobs?roles[0]=Full%20time%20employment&roles[1]=Internship';

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`📄 Scraping Meta page ${pageNum}...`);

        try {
            const url = pageNum === 1 ? baseUrl : `${baseUrl}&page=${pageNum}`;

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            await page.waitForSelector('a[href*="/jobs/"]', { timeout: 3000 });

            const jobs = await page.evaluate(() => {
                // Find all job links
                const jobLinks = document.querySelectorAll('a[href*="/jobs/"]');
                const jobsArray = [];

                jobLinks.forEach(jobLink => {
                    try {
                        const titleElement = jobLink.querySelector('div._6g3g.x10lme4x.x26uert.xngnso2.x117nqv4.x1mnlqng.x1e096f4');
                        const title = titleElement ? titleElement.innerText.trim() : '';

                        if (!title) return;

                        const url = jobLink.href;

                        const locationSpans = jobLink.querySelectorAll('span.x26uert.x8xxdc5.x1jchvi3');
                        let location = '';

                        for (const span of locationSpans) {
                            const text = span.innerText.trim();
                            if (text.includes(',') && (text.includes('NY') || text.includes('CA') || text.includes('WA'))) {
                                location = text;
                                break;
                            }
                            // Handle "Remote, US" format
                            if (text.includes('Remote') || text.includes('Multiple Locations')) {
                                location = text;
                                break;
                            }
                        }

                        // Get department/category from spans
                        let department = '';
                        for (const span of locationSpans) {
                            const text = span.innerText.trim();
                            if (text.includes('Engineering') || text.includes('Software') ||
                                text.includes('Product') || text.includes('Design') ||
                                text.includes('Research') || text.includes('Machine Learning')) {
                                department = text;
                                break;
                            }
                        }

                        if (title && (
                            title.toLowerCase().includes('engineer') ||
                            title.toLowerCase().includes('developer') ||
                            title.toLowerCase().includes('product') ||
                            title.toLowerCase().includes('design') ||
                            title.toLowerCase().includes('research') ||
                            title.toLowerCase().includes('scientist')
                        )) {
                            jobsArray.push({
                                title: title,
                                location: location || 'Multiple Locations',
                                url: url,
                                department: department || 'Software Engineering',
                                postedDate: '',
                                timeElapsed: ''
                            });
                        }
                    } catch (error) {
                        console.warn('Error parsing job:', error);
                    }
                });

                return jobsArray;
            });

            console.log(`   Found ${jobs.length} jobs`);

            if (jobs.length === 0) {
                console.log('   No more jobs found, stopping...');
                break;
            }

            allJobs = [...allJobs, ...jobs];

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`❌ Error scraping page ${pageNum}:`, error.message);
            continue;
        }
    }

    console.log('Jobs found:', allJobs.length);

    // Log all job details like Amazon scraper
    allJobs.forEach((job) => {
        console.log(`job-details`, job);
    });

    await browser.close();

    // Remove duplicates based on URL
    const uniqueJobs = allJobs.filter((job, index, self) =>
        index === self.findIndex(j => j.url === job.url)
    );

    // Transform to standard format
    const transformedJobs = uniqueJobs.map(job => ({
        job_title: job.title,
        employer_name: 'Meta',
        job_city: parseLocation(job.location).city,
        job_state: parseLocation(job.location).state,
        job_description: job.department || 'Join Meta to build the future of social connection.',
        job_apply_link: job.url,
        job_posted_at: job.postedDate || 'not available',
        job_posted_at_datetime_utc: job.postedDate
    }));

    console.log(`🎯 Meta scraping completed: ${transformedJobs.length} unique jobs found`);

    // Save to JSON file
    try {
        const filename = path.join(__dirname, 'metajobs.json');
        fs.writeFileSync(filename, JSON.stringify(transformedJobs, null, 2));
        console.log(`💾 Saved ${transformedJobs.length} jobs to ${filename}`);
        console.log(`📅 Save time: ${new Date().toLocaleString()}`);
    } catch (error) {
        console.error('❌ Error saving jobs to file:', error);
    }

    return transformedJobs;
}

// Helper function to parse location
function parseLocation(locationStr) {
    if (!locationStr || locationStr === 'Multiple Locations') {
        return { city: 'Multiple', state: 'Locations' };
    }

    if (locationStr.includes('Remote')) {
        return { city: 'Remote', state: 'US' };
    }

    // Parse "City, State" format
    const parts = locationStr.split(', ');
    if (parts.length >= 2) {
        return {
            city: parts[0].trim(),
            state: parts[1].trim()
        };
    }

    return { city: locationStr, state: '' };
}

// Only run if this file is executed directly
if (require.main === module) {
    scrapeMetaJobs()
        .then(() => {
            console.log('\n✅ Meta job scraping and saving completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Meta job scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMetaJobs };