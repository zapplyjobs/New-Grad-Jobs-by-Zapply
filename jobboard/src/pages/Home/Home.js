import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import CompanyCard from '../../components/CompanyCard/CompanyCard';
import FeatureCard from '../../components/FeatureCard/FeatureCard';
import StatCard from '../../components/StatCard/StatCard';
import TypingEffect from '../../components/TypingEffect/TypingEffect';
import './Home.css';
import { fetchGitHubStats } from '../../utility/githubStats';
import JobTable from '../../components/JobTables/jobtable';
import { parseJobsFromReadme, validateAndCleanJobs } from '../../utility/parseJobs';

const Home = () => {
  const [stats, setStats] = useState([
    { number: '825', label: 'Active Jobs' },
    { number: '82', label: 'Companies' },
    { number: '15', label: 'FAANG+ Roles' },
    { number: '24h', label: 'Update Cycle' }
  ]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Starting to load job data...');
        
        // Fetch GitHub stats first
        console.log('📊 Fetching GitHub stats...');
        const githubStats = await fetchGitHubStats();
        
        setStats([
          { number: githubStats.activeJobs.toString(), label: 'Active Jobs' },
          { number: githubStats.companies.toString(), label: 'Companies' },
          { number: githubStats.faangJobs.toString(), label: 'FAANG+ Roles' },
          { number: '24h', label: 'Update Cycle' }
        ]);
        setIsLoadingStats(false);
        
        // Fetch README content
        console.log('📄 Fetching README content...');
        const response = await fetch('https://raw.githubusercontent.com/zapplyjobs/New-Grad-Jobs-by-Zapply/main/README.md');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
        }
        
        const readmeContent = await response.text();
        console.log(`📝 README content length: ${readmeContent.length} characters`);
        
        // Debug: Show a sample of the README content
        const sampleContent = readmeContent.substring(0, 1000);
        console.log('📋 README sample:', sampleContent);
        setDebugInfo(`README loaded: ${readmeContent.length} chars`);
        
        // Parse jobs from README
        console.log('🔧 Parsing jobs from README...');
        let parsedJobs = parseJobsFromReadme(readmeContent);
        console.log(`✅ Initial parsing found ${parsedJobs.length} jobs`);
        
        // Show companies found before cleaning
        const rawCompanies = [...new Set(parsedJobs.map(job => job.company))];
        console.log('🏢 Raw companies found:', rawCompanies);
        
        // Clean and validate jobs
        parsedJobs = validateAndCleanJobs(parsedJobs);
        console.log(`🧹 After cleaning: ${parsedJobs.length} valid jobs`);
        
        // Show final companies
        const finalCompanies = [...new Set(parsedJobs.map(job => job.company))];
        console.log('🏆 Final companies:', finalCompanies);
        
        // Debug: Show sample jobs
        if (parsedJobs.length > 0) {
          console.log('📋 Sample jobs:', parsedJobs.slice(0, 3));
          setDebugInfo(`Found ${parsedJobs.length} jobs from ${finalCompanies.length} companies: ${finalCompanies.slice(0, 5).join(', ')}${finalCompanies.length > 5 ? '...' : ''}`);
        } else {
          console.warn('⚠️ No jobs found in README');
          setDebugInfo('No jobs found in README');
          
          // Try to find table structures
          const tableCount = (readmeContent.match(/\|.*\|.*\|.*\|/g) || []).length;
          const companyHeaders = (readmeContent.match(/###.*\*\*.*\*\*/g) || []).length;
          const summaryTags = (readmeContent.match(/<summary>/g) || []).length;
          console.log(`🔍 Debug: Found ${tableCount} table rows, ${companyHeaders} company headers, ${summaryTags} summary tags`);
          setDebugInfo(`Debug: ${tableCount} table rows, ${companyHeaders} company headers, ${summaryTags} summary tags found`);
        }
        
        setJobs(parsedJobs);
        
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        setDebugInfo(`Error: ${error.message}`);
        // Keep default stats if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Scroll and animation effects
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el);
    });

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const nav = document.querySelector('.nav');
      const currentScrollY = window.scrollY;

      if (nav) {
        if (currentScrollY > 100) {
          nav.style.background = 'rgba(255, 255, 255, 0.95)';
          nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
          nav.style.background = 'rgba(255, 255, 255, 0.8)';
          nav.style.boxShadow = 'none';
        }

        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          nav.style.transform = 'translateY(-100%)';
        } else {
          nav.style.transform = 'translateY(0)';
        }
      }

      lastScrollY = currentScrollY;
    };

    const handleParallax = () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.2}px)`;
      }
    };

    const combinedScrollHandler = () => {
      handleScroll();
      handleParallax();
    };

    window.addEventListener('scroll', combinedScrollHandler);

    return () => {
      window.removeEventListener('scroll', combinedScrollHandler);
      observer.disconnect();
    };
  }, []);

  const companies = [
    { name: 'Google', icon: '🟢', link: 'https://careers.google.com/' },
    { name: 'Apple', icon: '🍎', link: 'https://jobs.apple.com/' },
    { name: 'Meta', icon: '🔵', link: 'https://careers.meta.com/' },
    { name: 'Amazon', icon: '📦', link: 'https://amazon.jobs/' },
    { name: 'Netflix', icon: '🎬', link: 'https://jobs.netflix.com/' },
    { name: 'OpenAI', icon: '🤖', link: 'https://openai.com/careers/' },
    { name: 'Stripe', icon: '💳', link: 'https://stripe.com/jobs/' },
    { name: 'Figma', icon: '🎨', link: 'https://figma.com/careers/' },
    { name: 'Airbnb', icon: '🏠', link: 'https://careers.airbnb.com/' },
    { name: 'Palantir', icon: '👁️', link: 'https://palantir.com/careers/' },
    { name: 'Tesla', icon: '⚡', link: 'https://tesla.com/careers/' },
    { name: 'Nvidia', icon: '🎮', link: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/' }
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Real-time updates',
      description: 'Jobs are scraped directly from company APIs every 24 hours. No outdated listings, ever.'
    },
    {
      icon: '🎯',
      title: 'Elite companies only',
      description: 'Curated list of top-tier tech companies, unicorns, and high-growth startups.'
    },
    {
      icon: '🔗',
      title: 'Direct application',
      description: 'Apply directly on company websites. No middleman, no delays, no extra steps.'
    }
  ];

  const discordIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );

  // Get the first stat (active jobs) for the hero badge
  const activeJobsCount = stats[0]?.number || '825';

  // Helper function to scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="home">
      <Navbar />

      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>🔥</span>
              <span>{activeJobsCount}+ Live Positions</span>
            </div>

            <h1 className="hero-title">
              Elite Tech Jobs
              <br />
              for <TypingEffect />
            </h1>

            <p className="hero-subtitle">
              Curated opportunities from top tech companies.
              <br />
              No fluff. Just real jobs. Updated daily.
            </p>

            <div className="hero-actions">
              <Button
                onClick={() => scrollToSection('jobs')}
                variant="primary"
                size="large"
              >
                Explore Jobs
              </Button>
              <Button
                href="https://discord.gg/yKWw28q7Yq"
                variant="discord"
                size="large"
                target="_blank"
                rel="noopener noreferrer"
                icon={discordIcon}
              >
                Join Discord
              </Button>
              <Button
                href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply"
                variant="secondary"
                size="large"
                target="_blank"
                rel="noopener noreferrer"
              >
                ⭐ Star on GitHub
              </Button>
            </div>

            <div className="stats">
              {isLoadingStats ? (
                <div className="stats-loading">Loading stats...</div>
              ) : (
                stats.map((stat, index) => (
                  <StatCard key={index} number={stat.number} label={stat.label} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="companies" className="companies scroll-reveal">
        <div className="companies-header">
          <div className="container">
            <h2 className="section-title">Trusted by the best</h2>
            <p className="section-subtitle">
              Direct access to opportunities from the world&apos;s most innovative companies
            </p>
          </div>
        </div>
        <div className="container">
          <div className="companies-grid">
            {companies.map((company, index) => (
              <CompanyCard key={index} {...company} />
            ))}
          </div>
        </div>
      </section>
      
      <section id="jobs" className="job-listings scroll-reveal">
        <div className="container">
          <h2 className="section-title">Current Job Openings</h2>
          <p className="section-subtitle">
            Filter and browse through the latest opportunities from elite tech companies
          </p>
          
          {isLoading ? (
            <div className="loading-jobs">
              <div className="loading-spinner"></div>
              <p>Loading job opportunities from README...</p>
            </div>
          ) : jobs.length > 0 ? (
            <JobTable jobs={jobs} />
          ) : (
            <div className="no-jobs-found">
              <h3>No jobs found in README</h3>
              <p>This could be due to:</p>
              <ul>
                <li>The README format has changed</li>
                <li>No jobs are currently available</li>
                <li>Parsing error with the README structure</li>
              </ul>
              <Button
                href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply"
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </Button>
            </div>
          )}
        </div>
      </section>

      <section id="features" className="features scroll-reveal">
        <div className="container">
          <h2 className="section-title">Why developers choose Zapply</h2>
          <p className="section-subtitle">
            We do the heavy lifting so you can focus on what matters—landing your dream job
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="community" className="cta">
        <div className="container">
          <h2 className="cta-title">Join the community?</h2>
          <p className="cta-subtitle">
            Join thousands of developers who&apos;ve found their next opportunity through Zapply
          </p>
          <div className="cta-actions">
            <Button
              onClick={() => scrollToSection('jobs')}
              variant="white"
              size="large"
            >
              Browse Jobs
            </Button>
            <Button
              href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply"
              variant="outline"
              size="large"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star Project
            </Button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-stats">
            {stats[0]?.number || '825'} opportunities from {stats[1]?.number || '82'} companies
          </div>
          <div className="footer-note">
            Updated {stats[3]?.number.toLowerCase().includes('loading') ? 'daily at 9 AM UTC' : stats[3]?.number}
          </div>
          <div className="footer-links">
            <a href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply" className="footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply/issues" className="footer-link" target="_blank" rel="noopener noreferrer">Issues</a>
            <a href="https://github.com/zapplyjobs/New-Grad-Jobs-by-Zapply#readme" className="footer-link" target="_blank" rel="noopener noreferrer">About</a>
          </div>
          <div className="footer-meta">
            Built with ❤️ for new grads
            <br />
            Not affiliated with listed companies
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;