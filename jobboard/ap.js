const Puppeteer = require('puppeteer');
const fs = require('fs');        // ADD THIS LINE
const path = require('path');    // ADD THIS LINE
function parseAmazonDate(postedDate, timeElapsed) {
    try {
        // Try to parse timeElapsed first (e.g., "2 days ago", "1 week ago")
        if (timeElapsed) {
            const match = timeElapsed.match(/(\d+)\s+(day|hour|week|month)s?\s+ago/i);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                const now = new Date();

                switch (unit) {
                    case 'hour':
                        now.setHours(now.getHours() - value);
                        break;
                    case 'day':
                        now.setDate(now.getDate() - value);
                        break;
                    case 'week':
                        now.setDate(now.getDate() - (value * 7));
                        break;
                    case 'month':
                        now.setMonth(now.getMonth() - value);
                        break;
                }
                return now.toISOString();
            }
        }

        // Try to parse postedDate if available
        if (postedDate && postedDate !== '') {
            const date = new Date(postedDate);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        // Fallback: assume posted today
        return new Date().toISOString();
    } catch (error) {
        console.warn('Date parsing failed:', error);
        return new Date().toISOString();
    }
}
async function scrapeAmazonJobs() {
    console.log('🔍 Starting Amazon job scraping...');

    const browser = await Puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const maxPages = 13;
    let allJobs = [];
    for (let offset = 0; offset < maxPages * 10; offset += 10) {
        console.log(`📄 Scraping Amazon page ${offset / 10 + 1}...`);
        try {
            await page.goto(` https://amazon.jobs/en-gb/search?offset=${offset}&result_limit=10&sort=relevant&country%5B%5D=USA&city%5B%5D=Bellevue&distanceType=Mi&radius=24km&industry_experience=less_than_1_year&industry_experience=one_to_three_years&latitude=&longitude=&loc_group_id=&loc_query=&base_query=manager&city=&country=&region=&county=&query_options=&`, {
                waitUntil: 'networkidle2',
            });

            const jobs = await page.evaluate(() => {

                const jobDivs = document.querySelectorAll('.job-tile-lists .job-tile');
                const jobsarray = Array.from(jobDivs).map(job => {
                    return {
                        title: job.querySelector('.job-link')?.innerText.trim() || '',
                        location: job.querySelector('.location-and-id li')?.innerText.trim() || '',
                        jobId: job.querySelector('.job')?.getAttribute('data-job-id') || '',
                        postedDate: job.querySelector('.posting-date')?.innerText.trim() || '',
                        timeElapsed: job.querySelector('.time-elapsed')?.innerText.trim() || '',
                        url: job.querySelector('.job-link')?.href || '',
                        // Get just the first part of qualifications
                        qualificationsPreview: job.querySelector('.qualifications-preview')?.innerText.split('\n')[0] || ''
                    };

                });
                return jobsarray;


            });
            console.log(`   Found ${jobs.length} jobs`);

            if (jobs.length === 0) {
                console.log('   No more jobs found at page', offset / 10);
            }

            allJobs = [...allJobs, ...jobs];
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Error scraping page ${offset / 10 + 1}:`, error.message);
            continue;
        }
    }
    console.log('Jobs found:', allJobs.length);
    allJobs.forEach((job) => {
        console.log(`job-details`, job);
    });
    await browser.close();


    // Transform to standard format
    const transformedJobs = allJobs.map(job => ({
        job_title: job.title,
        employer_name: 'Amazon',
        job_city: job.location.split(', ')[0] || 'Multiple',
        job_state: job.location.split(', ')[1] || 'Locations',
        job_description: job.qualificationsPreview || 'Management position at Amazon',
        job_apply_link: job.url,
        job_posted_at: parseAmazonDate(job.postedDate, job.timeElapsed),

    }));

    console.log(`🎯 Amazon scraping completed: ${transformedJobs.length} jobs found`);
    try {
        const filename = path.join(__dirname, 'amazonjobs.json');
        fs.writeFileSync(filename, JSON.stringify(transformedJobs, null, 2));
        console.log(`💾 Saved ${transformedJobs.length} jobs to ${filename}`);
        console.log(`📅 Save time: ${new Date().toLocaleString()}`);
    } catch (error) {
        console.error('❌ Error saving jobs to file:', error);
    }
}
if (require.main === module) {
    scrapeAmazonJobs();
}