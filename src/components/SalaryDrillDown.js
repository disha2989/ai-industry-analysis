import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const SalaryDrillDown = () => {
  const [data, setData] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  const colors = {
    bars: "#CEA2FD",
    experience: {
      EN: "#E5CBFE", // Lighter purple
      MI: "#CEA2FD", // Base purple
      SE: "#B77FE7", // Slightly darker
      EX: "#9B5CD1", // Darkest purple
    },
    companySize: "#CEA2FD", // Single color for company size bars
  };

  useEffect(() => {
    d3.csv("/3_salaries.csv")
      .then((csvData) => {
        const processedData = csvData
          .map((d) => ({
            ...d,
            salary_in_usd: +d.salary_in_usd,
          }))
          .filter((d) => d.salary_in_usd > 0);
        setData(processedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  }, []);

  const ExperienceLevelOverview = () => {
    const expSummary = d3.rollup(
      data,
      (v) => ({
        avg_salary: d3.mean(v, (d) => d.salary_in_usd),
        count: v.length,
        min_salary: d3.min(v, (d) => d.salary_in_usd),
        max_salary: d3.max(v, (d) => d.salary_in_usd),
      }),
      (d) => d.experience_level
    );

    const chartData = Array.from(expSummary, ([level, stats]) => ({
      experience_level: level,
      ...stats,
    })).sort((a, b) => b.avg_salary - a.avg_salary);

    const experienceLevelNames = {
      EN: "Entry Level",
      MI: "Mid Level",
      SE: "Senior",
      EX: "Executive",
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-2 text-center">
          AI Role Salary Analysis
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          Explore salary distributions and trends across different AI roles and
          experience levels
        </p>
        <h3 className="text-2xl font-bold mb-6 text-center">
          Salary Distribution by Experience Level
        </h3>
        <div className="flex justify-center">
          <BarChart
            layout="vertical"
            width={900}
            height={400}
            data={chartData}
            margin={{
              top: 20,
              right: 120,
              left: 120,
              bottom: 20,
            }}
            onClick={(data) =>
              data && setSelectedExperience(data.activeLabel)
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
              domain={[0, "dataMax + 50000"]}
            />
            <YAxis
              type="category"
              dataKey="experience_level"
              width={100}
              interval={0}
              tickFormatter={(value) => experienceLevelNames[value]}
              tick={{
                fontSize: 12,
                fontWeight: 500,
              }}
            />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              labelFormatter={(value) => experienceLevelNames[value]}
              contentStyle={{ backgroundColor: "white", borderRadius: "8px" }}
            />
            <Bar dataKey="avg_salary" cursor="pointer" barSize={30}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors.experience[entry.experience_level]}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
        <div className="text-center mt-6 text-gray-600">
          Click on any bar to see detailed analysis
        </div>
      </div>
    );
  };

  const ExperienceDetail = ({ experienceLevel }) => {
    const experienceData = data.filter(
      (d) => d.experience_level === experienceLevel
    );

    const jobData = d3.rollup(
      experienceData,
      (v) => ({
        avg_salary: d3.mean(v, (d) => d.salary_in_usd),
        count: v.length,
        salary_std: d3.deviation(v, (d) => d.salary_in_usd) || 0,
      }),
      (d) => d.job_title
    );

    const bubbleData = Array.from(jobData, ([title, stats]) => ({
      name: title,
      x: stats.avg_salary,
      y: stats.count,
      z: stats.salary_std,
      count: stats.count,
      salary: stats.avg_salary,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <button
          onClick={() => setSelectedExperience(null)}
          className="mb-4 text-purple-600 hover:text-purple-800"
        >
          ← Back to Overview
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">
          {experienceLevel} Salary Analysis
        </h2>

        <div className="space-y-8">
          {/* Bubble Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Role Distribution Analysis
            </h3>
            <div style={{ height: "600px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 70, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Salary"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Positions"
                    label={{
                      value: "Number of Positions",
                      angle: -90,
                      position: "left",
                      offset: 50,
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[200, 2000]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
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
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-60 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {selectedExperience ? (
        <ExperienceDetail experienceLevel={selectedExperience} />
      ) : (
        <ExperienceLevelOverview />
      )}
    </div>
  );
};

export default SalaryDrillDown;
