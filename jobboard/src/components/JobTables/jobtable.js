// src/components/JobTables/JobTable.js
import React, { useState, useEffect } from 'react';
import './JobTable.css';

const JobTable = ({ jobs }) => {
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    location: '',
    posted: '',
    level: '',
    category: '',
    remote: '',
    sponsorship: ''
  });
  const [sortBy, setSortBy] = useState('posted');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // Extract unique values for filters
  const companies = [...new Set(jobs.map(job => job.company))].sort();
  const locations = [...new Set(jobs.map(job => job.location))].sort();
  const levels = [...new Set(jobs.map(job => job.level))].sort();
  const categories = [...new Set(jobs.map(job => job.category))].sort();

  // Apply filters when they change
  useEffect(() => {
    let result = [...jobs];
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(job => 
        job.role.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm) ||
        job.category.toLowerCase().includes(searchTerm)
      );
    }
    
    // Company filter
    if (filters.company) {
      result = result.filter(job => job.company === filters.company);
    }
    
    // Location filter
    if (filters.location) {
      result = result.filter(job => job.location === filters.location);
    }
    
    // Posted filter
    if (filters.posted) {
      const days = parseInt(filters.posted);
      result = result.filter(job => {
        if (!job.posted) return true;
        
        // Parse posted date (e.g., "2h ago", "1d ago", "1w ago")
        let hoursAgo = 0;
        const posted = job.posted.toLowerCase();
        
        if (posted.includes('today') || posted.includes('just now')) {
          hoursAgo = 0;
        } else if (posted.includes('yesterday')) {
          hoursAgo = 24;
        } else if (posted.includes('h ago')) {
          hoursAgo = parseInt(posted);
        } else if (posted.includes('d ago')) {
          hoursAgo = parseInt(posted) * 24;
        } else if (posted.includes('w ago')) {
          hoursAgo = parseInt(posted) * 24 * 7;
        } else if (posted.includes('mo ago')) {
          hoursAgo = parseInt(posted) * 24 * 30;
        }
        
        const daysAgo = hoursAgo / 24;
        return daysAgo <= days;
      });
    }
    
    // Level filter
    if (filters.level) {
      result = result.filter(job => job.level === filters.level);
    }
    
    // Category filter
    if (filters.category) {
      result = result.filter(job => job.category === filters.category);
    }
    
    // Remote filter
    if (filters.remote === 'Yes') {
      result = result.filter(job => job.isRemote);
    } else if (filters.remote === 'No') {
      result = result.filter(job => !job.isRemote);
    }
    
    // Sponsorship filter
    if (filters.sponsorship === 'Yes') {
      result = result.filter(job => !job.isUSOnly);
    } else if (filters.sponsorship === 'No') {
      result = result.filter(job => job.isUSOnly);
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'level':
          const levelOrder = { 'Entry-Level': 1, 'Mid-Level': 2, 'Senior': 3 };
          comparison = (levelOrder[a.level] || 2) - (levelOrder[b.level] || 2);
          break;
        case 'posted':
        default:
          // Sort by posted date (most recent first)
          const getTimeValue = (posted) => {
            if (!posted) return 0;
            const p = posted.toLowerCase();
            if (p.includes('today') || p.includes('just now')) return 1000;
            if (p.includes('yesterday')) return 500;
            if (p.includes('h ago')) return 100 - parseInt(p);
            if (p.includes('d ago')) return 50 - parseInt(p);
            if (p.includes('w ago')) return 20 - parseInt(p);
            if (p.includes('mo ago')) return 10 - parseInt(p);
            return 0;
          };
          comparison = getTimeValue(b.posted) - getTimeValue(a.posted);
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    setFilteredJobs(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, jobs, sortBy, sortOrder]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      company: '',
      location: '',
      posted: '',
      level: '',
      category: '',
      remote: '',
      sponsorship: ''
    });
    setCurrentPage(1);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    document.querySelector('.job-table-container')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        if (totalPages > 5) pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="job-table-container">
      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search roles, companies, locations..."
          className="search-input"
        />
      </div>

      {/* Filters */}
      <div className="job-filters">
        <div className="filter-row">
          <select 
            name="company" 
            value={filters.company}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Companies</option>
            {companies.map((company, i) => (
              <option key={i} value={company}>{company}</option>
            ))}
          </select>
          
          <select 
            name="location" 
            value={filters.location}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Locations</option>
            {locations.map((loc, i) => (
              <option key={i} value={loc}>{loc}</option>
            ))}
          </select>
          
          <select 
            name="posted" 
            value={filters.posted}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Any Time</option>
            <option value="1">Last 24 hours</option>
            <option value="3">Last 3 days</option>
            <option value="7">Last week</option>
            <option value="30">Last month</option>
          </select>
          
          <select 
            name="level" 
            value={filters.level}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Levels</option>
            {levels.map((level, i) => (
              <option key={i} value={level}>{level}</option>
            ))}
          </select>
          
          <select 
            name="category" 
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Categories</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            name="remote" 
            value={filters.remote}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Mode</option>
            <option value="Yes">Remote Only</option>
            <option value="No">On-site Only</option>
          </select>
          
          <select 
            name="sponsorship" 
            value={filters.sponsorship}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Visa Status</option>
            <option value="Yes">Sponsorship Available</option>
            <option value="No">US Citizens Only</option>
          </select>
          
          <button onClick={resetFilters} className="reset-filters">
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="results-summary">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length} jobs
          {filteredJobs.length !== jobs.length && ` (filtered from ${jobs.length} total)`}
        </span>
      </div>
      
      {/* Job Table */}
      <div className="job-table-wrapper">
        <table className="job-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('company')} className="sortable">
                Company {getSortIcon('company')}
              </th>
              <th onClick={() => handleSort('role')} className="sortable">
                Role {getSortIcon('role')}
              </th>
              <th onClick={() => handleSort('location')} className="sortable">
                Location {getSortIcon('location')}
              </th>
              <th onClick={() => handleSort('posted')} className="sortable">
                Posted {getSortIcon('posted')}
              </th>
              <th onClick={() => handleSort('level')} className="sortable">
                Level {getSortIcon('level')}
              </th>
              <th>Category</th>
              <th>Apply</th>
            </tr>
          </thead>
          <tbody>
            {currentJobs.length > 0 ? (
              currentJobs.map((job, index) => (
                <tr key={index} className="job-row">
                  <td>
                    <div className="company-cell">
                      <span className="company-emoji">{job.emoji}</span>
                      <span className="company-name">{job.company}</span>
                    </div>
                  </td>
                  <td>
                    <div className="role-cell">
                      <span className="role-title">{job.role}</span>
                      <div className="role-badges">
                        {job.isRemote && <span className="badge remote">🏠 Remote</span>}
                        {job.isUSOnly && <span className="badge us-only">🇺🇸 US Only</span>}
                      </div>
                    </div>
                  </td>
                  <td className="location-cell">{job.location}</td>
                  <td className="posted-cell">{job.posted}</td>
                  <td>
                    <span className={`level-badge level-${job.level.toLowerCase().replace(/[^a-z]/g, '')}`}>
                      {job.level}
                    </span>
                  </td>
                  <td className="category-cell">{job.category}</td>
                  <td>
                    <a 
                      href={job.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="apply-button"
                    >
                      Apply
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-jobs">
                  <div className="no-results">
                    <h3>No jobs match your filters</h3>
                    <p>Try adjusting your search criteria or clearing some filters.</p>
                    <button onClick={resetFilters} className="clear-filters-btn">
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn pagination-prev"
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                className={`pagination-number ${
                  currentPage === page ? 'active' : ''
                } ${typeof page !== 'number' ? 'dots' : ''}`}
                disabled={typeof page !== 'number'}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn pagination-next"
          >
            Next →
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="job-table-footer">
        <div className="footer-stats">
          <span className="job-count">
            Page {currentPage} of {totalPages} • {filteredJobs.length} total jobs
          </span>
          <span className="separator">•</span>
          <span className="companies-count">
            {companies.length} companies
          </span>
        </div>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default JobTable;