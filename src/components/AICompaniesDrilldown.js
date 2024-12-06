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
        <h2 className="text-3xl font-bold mb-2 text-center">AI Companies Overview</h2>
        <p className="text-gray-600 mb-8 text-center">
          Analysis of companies based on their AI service focus
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={groupedData}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 50, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Bar 
              dataKey="count" 
              fill={BAR_COLOR} 
              cursor="pointer"
              onClick={(data) => data && setSelectedCategory(data.name)}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center mt-6 text-gray-600">
          Click on any bar to see top companies and their hourly rates
        </div>
      </div>
    );
  };

  const CategoryDetail = ({ category }) => {
    const companiesData = getTop5Companies(category);
    const { average, totalCompanies } = calculateCategoryAverage(category);

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className="mb-6 text-purple-600 hover:text-purple-800 flex items-center gap-2"
        >
          ← Back to Overview
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center">
          Top 5 Companies and their Avg Hourly Rates  {category}
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
                label={{ value: 'Hourly Rate ($)', position: 'bottom' }}
                domain={[0, 'dataMax + 20']}
              />
              <YAxis 
                type="category" 
                dataKey="name"
                width={140}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}/hr`, 'Hourly Rate']}
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
              <p className="text-gray-600 text-sm">Category Average Hourly Rate</p>
              <p className="text-2xl font-bold text-purple-800">
                ${average.toFixed(2)}/hr
              </p>
              <p className="text-sm text-gray-600 mt-2">
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="w-full h-60 flex items-center justify-center">Loading data...</div>;
  }

  if (error) {
    return <div className="w-full h-60 flex items-center justify-center text-red-600">{error}</div>;
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