import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, 
  ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from 'recharts';

const SalaryDrillDown = () => {
  const [data, setData] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  const colors = {
    bars: '#CEA2FD',
    experience: {
      EN: '#E5CBFE',
      MI: '#CEA2FD',
      SE: '#B77FE7',
      EX: '#9B5CD1'
    },
    companySize: '#CEA2FD'
  };

  useEffect(() => {
    d3.csv("/3_salaries.csv")
      .then((csvData) => {
        const processedData = csvData.map(d => ({
          ...d,
          salary_in_usd: +d.salary_in_usd,
        })).filter(d => d.salary_in_usd > 0);
        setData(processedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  }, []);

  const StatCard = ({ title, value }) => (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <h3 className="text-lg text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  const ExperienceLevelOverview = () => {
    const expSummary = d3.rollup(data,
      v => ({
        avg_salary: d3.mean(v, d => d.salary_in_usd),
        count: v.length,
        min_salary: d3.min(v, d => d.salary_in_usd),
        max_salary: d3.max(v, d => d.salary_in_usd)
      }),
      d => d.experience_level
    );

    const chartData = Array.from(expSummary, ([level, stats]) => ({
      experience_level: level,
      ...stats
    })).sort((a, b) => b.avg_salary - a.avg_salary);

    const experienceLevelNames = {
      EN: 'Entry Level',
      MI: 'Mid Level',
      SE: 'Senior',
      EX: 'Executive'
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-2 text-center">AI Role Salary Analysis</h2>
        <p className="text-gray-600 mb-8 text-center">
          Salary trends across different experience levels
        </p>
        <div className="flex justify-center">
          <BarChart
            layout="vertical"
            width={900}
            height={400}
            data={chartData}
            margin={{ top: 20, right: 30, left: 120, bottom: 40 }}
            barGap={0}
            onClick={(data) => data && setSelectedExperience(data.activeLabel)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => `$${Math.round(value/1000)}K`}
              domain={[0, 240000]}
              ticks={[0, 65000, 130000, 185000, 240000]}
              label={{
                value: 'Salary in USD',
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle' }
              }}
            />
            <YAxis
              type="category"
              dataKey="experience_level"
              width={100}
              interval={0}
              tickFormatter={(value) => experienceLevelNames[value]}
              tick={{ 
                fontSize: 12,
                fontWeight: 500
              }}
              label={{
                value: 'Experience Levels',
                angle: -90,
                position: 'insideLeft',
                offset: -90,
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              labelFormatter={(value) => experienceLevelNames[value]}
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
            />
            <Bar
              dataKey="avg_salary"
              cursor="pointer"
              barSize={25}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.experience[entry.experience_level]} />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>
    );
  };

  const ExperienceDetail = ({ experienceLevel }) => {
    const experienceData = data.filter(d => d.experience_level === experienceLevel);
    
    // Calculate overall statistics for this experience level
    const totalPositions = experienceData.length;
    const averageSalary = d3.mean(experienceData, d => d.salary_in_usd);

    const jobData = d3.rollup(experienceData,
      v => ({
        avg_salary: d3.mean(v, d => d.salary_in_usd),
        count: v.length,
        salary_std: d3.deviation(v, d => d.salary_in_usd) || 0
      }),
      d => d.job_title
    );

    const bubbleData = Array.from(jobData, ([title, stats]) => ({
      name: title,
      x: stats.avg_salary,
      y: stats.count,
      z: stats.salary_std,
      count: stats.count,
      salary: stats.avg_salary
    })).sort((a, b) => b.count - a.count).slice(0, 20);

    const sizeData = d3.rollup(experienceData,
      v => ({
        avg_salary: d3.mean(v, d => d.salary_in_usd),
        count: v.length
      }),
      d => d.company_size
    );

    const sizeChart = Array.from(sizeData, ([size, stats]) => ({
      company_size: size,
      ...stats
    })).sort((a, b) => b.avg_salary - a.avg_salary);

    const experienceLevelNames = {
      EN: 'Entry Level',
      MI: 'Mid Level',
      SE: 'Senior',
      EX: 'Executive'
    };

    const companySizeNames = {
      S: 'Small',
      M: 'Medium',
      L: 'Large'
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {experienceLevelNames[experienceLevel]} Salary Analysis
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Role Distribution Analysis</h3>
            <div style={{ height: '600px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 70, left: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    dataKey="x"
                    name="Salary"
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    label={{ 
                      value: 'Salary in USD', 
                      position: 'bottom',
                      offset: 50
                    }}
                  />
                  <YAxis 
                    type="number"
                    dataKey="y"
                    name="Positions"
                    label={{ 
                      value: 'Number of Positions', 
                      angle: -90,
                      position: 'left',
                      offset: 50
                    }}
                  />
                  <ZAxis 
                    type="number"
                    dataKey="z"
                    range={[200, 2000]}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded shadow">
                          <p className="font-bold">{data.name}</p>
                          <p>Salary: ${Math.round(data.salary).toLocaleString()}</p>
                          <p>Positions: {data.count}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={bubbleData}
                    fill={colors.experience[experienceLevel]}
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 text-sm text-gray-600">
              Bubble size represents salary variation, position shows count vs salary
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Salary by Company Size</h3>
            <BarChart
              width={800}
              height={300}
              data={sizeChart}
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              barGap={2}
              barCategoryGap={20}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="category"
                dataKey="company_size"
                tickFormatter={(value) => companySizeNames[value]}
              />
              <YAxis
                type="number"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                label={{ 
                  value: 'Salary in USD', 
                  angle: -90,
                  position: 'left',
                  offset: 10
                }}
              />
              <Tooltip
                formatter={(value) => `$${value.toLocaleString()}`}
                labelFormatter={(value) => companySizeNames[value]}
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
              />
              <Bar
                dataKey="avg_salary"
                fill={colors.companySize}
                barSize={30}
              />
            </BarChart>
          </div>

          {/* Summary Statistics Section */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <StatCard 
              title="Total Positions" 
              value={totalPositions.toLocaleString()}
            />
            <StatCard 
              title="Average Salary" 
              value={`$${Math.round(averageSalary).toLocaleString()}`}
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => setSelectedExperience(null)}
              className="px-6 py-2 bg-gray-300 text-white font-semibold rounded-full"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-12">
        {loading ? (
          <p>Loading data...</p>
        ) : selectedExperience ? (
          <ExperienceDetail experienceLevel={selectedExperience} />
        ) : (
          <ExperienceLevelOverview />
        )}
      </div>
    </div>
  );
};

export default SalaryDrillDown;