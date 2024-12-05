import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SankeyChart = () => {
  const svgRef = useRef(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [pieData, setPieData] = useState({ 
    risk: [], 
    adoption: [],
    skills: [] 
  });
  const [data, setData] = useState(null);

  const nodeColors = {
    'Entertainment': '#8968CD',
    'Technology': '#8968CD',
    'Education': '#8968CD',
    'Finance': '#8968CD',
    'Retail': '#8968CD',
    'Transportation': '#8968CD',
    'Telecommunications': '#8968CD',
    'Manufacturing': '#8968CD',
    'Healthcare': '#8968CD',
    'Energy': '#8968CD',
    'Tokyo': '#8968CD',
    'Singapore': '#8968CD',
    'San Francisco': '#8968CD',
    'Berlin': '#8968CD',
    'Dubai': '#8968CD',
    'London': '#8968CD',
    'Paris': '#8968CD',
    'Sydney': '#8968CD',
    'New York': '#8968CD',
    'Toronto': '#8968CD',
    'High': '#8968CD',
    'Medium': '#8968CD',
    'Low': '#8968CD'
  };

  const riskColors = {
    'High': '#644B9B',
    'Medium': '#8968CD',
    'Low': '#B19CD9'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csvData = await d3.csv('/2_ai_job_market_insights.csv');
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data) return;

    const renderSankeyChart = () => {
      const width = 800;
      const height = 667;
      const margin = { top: 40, right: 100, bottom: 40, left: 100 };

      const nodes = [
        ...Array.from(new Set(data.map(d => d.Industry))).map(name => ({
          name,
          category: 'industry'
        })),
        ...Array.from(new Set(data.map(d => d.Location))).map(name => ({
          name,
          category: 'location'
        })),
        ...Array.from(new Set(data.map(d => d.AI_Adoption_Level))).map(name => ({
          name,
          category: 'adoption'
        }))
      ];

      const nodeMap = {};
      nodes.forEach((node, i) => {
        nodeMap[`${node.category}-${node.name}`] = i;
      });

      const links = [];
      
      const industryLocationCounts = {};
      data.forEach(d => {
        const key = `${d.Industry}-${d.Location}`;
        industryLocationCounts[key] = (industryLocationCounts[key] || 0) + 1;
      });

      Object.entries(industryLocationCounts).forEach(([key, value]) => {
        const [industry, location] = key.split('-');
        links.push({ 
          source: nodeMap[`industry-${industry}`], 
          target: nodeMap[`location-${location}`], 
          value 
        });
      });

      const locationAdoptionCounts = {};
      data.forEach(d => {
        const key = `${d.Location}-${d.AI_Adoption_Level}`;
        locationAdoptionCounts[key] = (locationAdoptionCounts[key] || 0) + 1;
      });

      Object.entries(locationAdoptionCounts).forEach(([key, value]) => {
        const [location, adoption] = key.split('-');
        links.push({ 
          source: nodeMap[`location-${location}`], 
          target: nodeMap[`adoption-${adoption}`], 
          value 
        });
      });

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      svg.attr("width", width)
         .attr("height", height);

      const sankeyLayout = sankey()
        .nodeWidth(15)
        .nodePadding(8)
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

      const sankeyData = sankeyLayout({
        nodes: nodes.map((d, i) => ({ ...d })),
        links: links
      });

      const linkColor = () => '#8968CD';

      const link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(sankeyData.links)
        .join("path")
        .attr("d", sankeyLinkHorizontal())
        .style("fill", "none")
        .style("stroke-width", d => Math.max(1, d.width))
        .style("stroke", linkColor)
        .style("opacity", 0.4);

      link.on("mouseover", function(event, d) {
        d3.select(this)
          .style("opacity", 0.8)
          .style("stroke-width", d => Math.max(2, d.width));
        node.style("opacity", n => (n === d.source || n === d.target) ? 1.0 : 0.3);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("opacity", 0.4)
          .style("stroke-width", d => Math.max(1, d.width));
        node.style("opacity", 1.0);
      });

      const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(sankeyData.nodes)
        .join("g");

      node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => nodeColors[d.name])
        .style("opacity", 0.85)
        .style("cursor", d => d.category === 'industry' ? 'pointer' : 'default')
        .on("click", (event, d) => {
          if (d.category === 'industry') {
            const industryData = data.filter(item => item.Industry === d.name);
            
            const riskData = d3.rollup(industryData, 
              v => v.length,
              d => d.Automation_Risk
            );
            
            const adoptionData = d3.rollup(industryData,
              v => v.length,
              d => d.AI_Adoption_Level
            );

            const skillsData = d3.rollup(industryData, 
              v => v.length, 
              d => d.Required_Skills
            );

            setPieData({
              risk: Array.from(riskData, ([name, value]) => ({
                name,
                value
              })),
              adoption: Array.from(adoptionData, ([name, value]) => ({
                name,
                value
              })),
              skills: Array.from(skillsData, ([name, value]) => ({
                name,
                value
              })).sort((a, b) => b.value - a.value)
            });
            setSelectedIndustry(d.name);
          }
        })
        .on("mouseover", function(event, d) {
          d3.select(this).style("opacity", 1);
          link
            .style("opacity", l => (l.source === d || l.target === d) ? 0.8 : 0.1)
            .style("stroke-width", l => (l.source === d || l.target === d) ? 
              Math.max(2, l.width) : Math.max(1, l.width));
        })
        .on("mouseout", function() {
          d3.select(this).style("opacity", 0.85);
          link
            .style("opacity", 0.4)
            .style("stroke-width", d => Math.max(1, d.width));
        });

      node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => `${d.name} (${d.value})`)
        .style("font-size", "10px")
        .style("font-weight", "500");

      const columns = [
        { title: "Industries", x: margin.left + 100 },
        { title: "Locations", x: width / 2 },
        { title: "AI Adoption", x: width - margin.right - 50 }
      ];

      svg.append("g")
        .selectAll("text")
        .data(columns)
        .join("text")
        .attr("x", d => d.x)
        .attr("y", margin.top - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(d => d.title);
    };

    renderSankeyChart();
  }, [data, selectedIndustry]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          AI Job Market Flow Analysis
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Explore how AI jobs flow through different industries, locations, and adoption levels
        </p>

        {selectedIndustry ? (
          <>
            <button
              onClick={() => setSelectedIndustry(null)}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Overview
            </button>
            
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
              {selectedIndustry} Analysis
            </h3>
            <div className="flex flex-wrap justify-center gap-8">
              {/* AI Adoption Levels Pie Chart */}
              <div className="w-1/3 max-w-[300px]">
                <h4 className="text-lg font-semibold mb-2 text-center">AI Adoption Levels</h4>
                <PieChart width={300} height={250}>
                  <Pie
                    data={pieData.adoption}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 0.6 * outerRadius;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text 
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={20}
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {pieData.adoption.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.name === 'High' ? '#644B9B' : 
                              entry.name === 'Medium' ? '#8968CD' : '#B19CD9'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              {/* Risk Levels Pie Chart */}
              <div className="w-1/3 max-w-[300px]">
                <h4 className="text-lg font-semibold mb-2 text-center">Risk Levels</h4>
                <PieChart width={300} height={250}>
                  <Pie
                    data={pieData.risk}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 0.6 * outerRadius;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text 
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={20}
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {pieData.risk.map((entry, index) => (
                      <Cell key={index} fill={riskColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              {/* Bar Chart */}
              <div className="w-full mt-8">
                <h4 className="text-lg font-semibold mb-2 text-center">Required Skills</h4>
                <div className="flex justify-center">
                  <BarChart 
                    width={800} 
                    height={400} 
                    data={pieData.skills}
                    margin={{
                      top: 20,
                      right: 50,
                      left: 50,
                      bottom: 100
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{fontSize: 12}}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8968CD">
                      {pieData.skills.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#8968CD" />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            </div>
          </>
        ) : (
          <svg ref={svgRef} className="mx-auto" />
        )}
      </div>
    </div>
  );
};

export default SankeyChart;