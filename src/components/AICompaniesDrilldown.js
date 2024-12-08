import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';

const AICompaniesOverview = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const BAR_COLOR = "#B6B5D8";
  const DETAIL_BAR_COLOR = "#B6B5D8";

  const parseHourlyRate = (rateString) => {
    if (rateString === "Undisclosed") return 0;
    const cleanedRate = rateString.replace('/ hr', '').trim();

    if (cleanedRate.includes(' - ')) {
      const [min, max] = cleanedRate.split(' - ').map(r => {
        const numericValue = parseFloat(r.replace('$', ''));
        return isNaN(numericValue) ? 0 : numericValue;
      });
      return (min + max) / 2;
    }

    if (cleanedRate.startsWith('<')) {
      return parseFloat(cleanedRate.replace('< $', '')) / 2;
    }

    if (cleanedRate.startsWith('>')) {
      return parseFloat(cleanedRate.replace('> $', '')) * 1.5;
    }

    return parseFloat(cleanedRate.replace('$', '')) || 0;
  };

  useEffect(() => {
    d3.csv("/1_AI_Companies.csv")
      .then((csvData) => {
        const processedData = csvData
          .filter(d =>
            d.Company_Name &&
            d["Percent AI Service Focus"]
          )
          .map(d => ({
            ...d,
            "Percent AI Service Focus": parseFloat(d["Percent AI Service Focus"]) || 0,
            "Hourly Wage": parseHourlyRate(d["Average Hourly Rate"])
          }));
        setData(processedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      });
  }, []);

  const focusRanges = {
    "High Focus (>70%)": d => d["Percent AI Service Focus"] > 70,
    "Medium Focus (30-70%)": d => d["Percent AI Service Focus"] > 30 && d["Percent AI Service Focus"] <= 70,
    "Low Focus (<30%)": d => d["Percent AI Service Focus"] <= 30,
  };

  const getTop5Companies = (categoryFilter) => {
    return data
      .filter(focusRanges[categoryFilter])
      .sort((a, b) => b["Percent AI Service Focus"] - a["Percent AI Service Focus"])
      .filter(company => company["Hourly Wage"] > 0)
      .slice(0, 5)
      .map(company => ({
        name: company.Company_Name,
        value: company["Hourly Wage"]
      }));
  };

  const calculateCategoryAverage = (category) => {
    const companiesInCategory = data
      .filter(focusRanges[category])
      .filter(company => company["Hourly Wage"] > 0);

    const totalWages = companiesInCategory.reduce(
      (sum, company) => sum + company["Hourly Wage"], 
      0
    );

    return {
      average: totalWages / companiesInCategory.length,
      totalCompanies: companiesInCategory.length
    };
  };

  const Overview = () => {
    const groupedData = Object.entries(focusRanges).map(([name, filter]) => ({
      name,
      count: data.filter(filter).length,
    }));

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-2 text-center">Top AI Companies Overview</h2>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Analysis of companies based on their AI service focus
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={groupedData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 50, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              label={{ 
                value: 'Number of Companies', 
                position: 'bottom',
                offset: 0,
                dy: 25,
                style: { fontSize: '16px' }
              }}
              style={{ fontSize: '14px' }}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              label={{ 
                value: 'AI Service Focus Category', 
                angle: -90,
                position: 'insideLeft',
                dx: -30,
                style: { fontSize: '16px' }
              }}
              style={{ fontSize: '14px' }}
            />
            <Tooltip contentStyle={{ fontSize: '14px' }} />
            <Bar 
              dataKey="count" 
              fill={BAR_COLOR} 
              cursor="pointer"
              onClick={(data) => data && setSelectedCategory(data.name)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const CategoryDetail = ({ category }) => {
    const companiesData = getTop5Companies(category);
    const { average, totalCompanies } = calculateCategoryAverage(category);

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 relative">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Top 5 Startups and their Average Hourly Rates {category}
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={companiesData}
              layout="vertical"
              margin={{ top: 20, right: 20, left: 150, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                label={{ 
                  value: 'Hourly Rate ($)', 
                  position: 'bottom',
                  style: { fontSize: '16px' }
                }}
                style={{ fontSize: '14px' }}
                domain={[0, 'dataMax + 20']}
              />
              <YAxis 
                type="category" 
                dataKey="name"
                width={140}
                style={{ fontSize: '14px' }}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}/hr`, 'Hourly Rate']}
                contentStyle={{ fontSize: '14px' }}
                cursor={{ fill: 'rgba(155, 92, 209, 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                fill={DETAIL_BAR_COLOR}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-600 text-base">Category Average Hourly Rate</p>
              <p className="text-3xl font-bold text-purple-800">
                ${average.toFixed(2)}/hr
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedCategory(null)}
            className="absolute bottom-6 right-6 bg-indigo-300 hover:bg-indigo-400 text-black px-4 py-2 rounded flex items-center gap-2 text-lg"
          >
             RESET
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="w-full h-60 flex items-center justify-center text-lg">Loading data...</div>;
  }

  if (error) {
    return <div className="w-full h-60 flex items-center justify-center text-red-600 text-lg">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {selectedCategory ? 
        <CategoryDetail category={selectedCategory} /> : 
        <Overview />
      }
    </div>
  );
};

export default AICompaniesOverview;