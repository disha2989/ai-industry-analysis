import React, { useState, useRef } from 'react';
import SunburstChart from './components/SunburstChart';
import BubbleChart from './components/BubbleChart';
import './App.css';

const data = {
  name: "AI Industry Analysis",
  children: [
    {
      name: "Job Market",
      children: [
        {
          name: "Top AI Startups",
          value: 100
        },
        {
          name: "Salaries Trends",
          value: 100
        },
        {
          name: "AI Industries",
          value: 100
        }
      ]
    },
    {
      name: "AI Global Index",
      children: [
        {
          name: "Region Specific Metrics",
          value: 100
        }
      ]
    },
    {
      name: "AI Development Costs",
      children: [
        {
          name: "Regions",
          value: 100
        }
      ]
    }
  ]
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const marketAnalysisRef = useRef(null);

  const handleRegionClick = () => {
    console.log("Region clicked, attempting to scroll"); // Debug log
    const element = document.getElementById('market-analysis-heading');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      setTimeout(() => {
        window.scrollTo({
          top: element.offsetTop - 100,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-text">AI Analytics</span>
          </div>
          
          <button className="mobile-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <a href="#home">Home</a>
            <a href="#analysis">Analysis</a>
            <a href="#insights">Insights</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1>AI Industry Analysis</h1>
          <p className="hero-subtitle">Explore the latest trends and insights in artificial intelligence</p>
        </div>
      </section>

      <main className="main-content">
        <section className="section" id="analysis">
          <div className="section-content">
          
            <div className="chart-container">
              <SunburstChart data={data} onRegionClick={handleRegionClick} />
            </div>
          </div>
        </section>

        <section className="section" id="insights">
          <div className="section-content">
            <h2 
              id="market-analysis-heading" 
              ref={marketAnalysisRef} 
              style={{ scrollMarginTop: '100px' }}
            >
             
            </h2>
            <p className="section-description">
              
            </p>
            <div className="chart-container">
              <BubbleChart />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Course Information</h3>
            <p>ECS 272: Information Visualization</p>
            <p>Fall 2024</p>
          </div>
          <div className="footer-section">
            <h3>Team Members</h3>
            <p>Disha Narayan</p>
            <p>Vaishnavi Kosuri</p>
          </div>
          <div className="footer-section">
            <h3>Course Staff</h3>
            <p><strong>Instructor:</strong> Kwan-Liu Ma</p>
            <p><strong>Teaching Assistant:</strong> Yun-Hsin Kuo</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 UC Davis ECS 272 Course Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;