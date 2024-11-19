import React from 'react';
import SunburstChart from './components/SunburstChart';
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
  return (
    <div className="app">
      <h1>AI Industry Analysis</h1>
      <div className="chart-container">
        <SunburstChart data={data} />
      </div>
    </div>
  );
}

export default App;