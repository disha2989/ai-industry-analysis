import React, { useState, useEffect } from "react";
import * as d3 from "d3";

const BubbleChart = () => {
  const [data, setData] = useState([]);
  const [hoveredDomain, setHoveredDomain] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainDetails, setDomainDetails] = useState([]);
  const [filterType, setFilterType] = useState("top5"); // Default filter: Top 5
  const width = 800;
  const height = 600;

  useEffect(() => {
    d3.csv("/5_artificial-intelligence-training-computation.csv")
      .then((csvData) => {
        const groupedData = d3.group(csvData, (d) => d.Domain);
        const processedData = Array.from(groupedData, ([domain, entries]) => ({
          domain,
          value: d3.sum(entries, (d) => {
            const computationValue = parseFloat(
              d["Training computation (petaFLOP)"]
            );
            return isNaN(computationValue) ? 0 : computationValue;
          }),
        })).filter((d) => d.value > 0 && d.domain);
        processedData.sort((a, b) => b.value - a.value);
        setData(processedData);
      })
      .catch((error) => {
        console.error("Error loading the data:", error);
        setData([]);
      });
  }, []);
  

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);

    d3.csv("/5_artificial-intelligence-training-computation.csv")
      .then((csvData) => {
        const domainData = csvData.filter((d) => d.Domain === domain);
        const entityData = d3.group(domainData, (d) => d.Entity);

        const details = Array.from(entityData, ([entity, entries]) => ({
          entity,
          value: d3.sum(entries, (d) => {
            const computationValue = parseFloat(
              d["Training computation (petaFLOP)"]
            );
            return isNaN(computationValue) ? 0 : computationValue;
          }),
        })).filter((d) => d.value >= 0.1); // Exclude entities with value 0.0

        details.sort((a, b) => b.value - a.value);
        setDomainDetails(details);
      })
      .catch((error) => {
        console.error("Error loading domain details:", error);
        setDomainDetails([]);
      });
  };

  const formatValue = (value) => {
    if (!value && value !== 0) return "0";
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(1);
  };

  const renderBarChart = () => {
    if (domainDetails.length === 0) return null;
  
    const limit = parseInt(filterType.match(/\d+/)[0], 10);
    const type = filterType.startsWith("top") ? "top" : "least";
  
    const filteredData =
      type === "top"
        ? domainDetails.slice(0, limit)
        : domainDetails.slice(-limit).reverse();
  
    const barWidth = width / 2 - 180; // Increased space for labels
    const barHeight = 24;
    const chartHeight = filteredData.length * (barHeight + 8);
  
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.value)])
      .range([0, barWidth]);
  
    return (
      <svg width={width / 2} height={chartHeight} className="mx-auto">
        {filteredData.map((d, i) => (
          <g
            key={i}
            transform={`translate(160, ${i * (barHeight + 8) + 8})`} // Adjusted left margin
            className="transition-all duration-200 hover:opacity-80"
          >
            <rect
              x="0"
              y="0"
              width={xScale(d.value)}
              height={barHeight}
              fill="#FF6B6B"
              rx="2"
              className="transition-all duration-200"
            >
              {/* Add a title element for the tooltip */}
              <title>{`${d.entity}: ${formatValue(d.value)} petaFLOP`}</title>
            </rect>
            <text
              x={-10} // Increased space
              y={barHeight / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#FF6B6B"
              fontSize="12px"
              className="font-medium"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "140px", // Adjusted maxWidth
              }}
            >
              {d.entity.length > 15
                ? `${d.entity.substring(0, 15)}...` // Truncate long labels
                : d.entity}
            </text>
          </g>
        ))}
      </svg>
    );
  };
  

  if (data.length === 0) {
    return (
      <div className="w-full h-60 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading data...</div>
      </div>
    );
  }

  const hierarchy = d3
    .hierarchy({ children: data })
    .sum((d) => Math.sqrt(d.value))
    .sort((a, b) => b.value - a.value);

  const pack = d3
    .pack()
    .size([width - 40, height - 40])
    .padding(3);

  const root = pack(hierarchy);

  

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Bubble Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
            AI Domain Computation Distribution
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Bubble size represents total computation requirements in petaFLOPs
          </p>

          <div className="relative mb-6">
            <svg width={width} height={height} className="mx-auto">
              <g transform={`translate(20, 20)`}>
                {root.leaves().map((leaf, i) => (
                  <g
                    key={i}
                    transform={`translate(${leaf.x},${leaf.y})`}
                    onMouseEnter={() => setHoveredDomain(leaf.data.domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                    onClick={() => handleDomainClick(leaf.data.domain)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <circle
                      r={leaf.r}
                      fill="#FF6B6B"
                      opacity={
                        hoveredDomain === null || hoveredDomain === leaf.data.domain
                          ? 0.8
                          : 0.3
                      }
                      stroke="#fff"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer", transition: "opacity 0.3s" }}
                    >
                      <title>{`${leaf.data.domain}: ${formatValue(
                        leaf.data.value
                      )} petaFLOP`}</title>
                    </circle>
                    {leaf.r > 30 && (
                      <>
                        <text
                          textAnchor="middle"
                          dy="-0.5em"
                          fill="#333"
                          style={{ fontSize: Math.min(leaf.r / 4, 16) }}
                        >
                          {leaf.data.domain}
                        </text>
                        <text
                          textAnchor="middle"
                          dy="1em"
                          fill="#666"
                          style={{ fontSize: Math.min(leaf.r / 5, 14) }}
                        >
                          {formatValue(leaf.data.value)}
                        </text>
                      </>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-center text-gray-800">
            {selectedDomain
              ? `Entity Contributions in ${selectedDomain}`
              : "Click a Domain"}
          </h2>
          <div className="flex justify-center gap-3 mb-4">
            {[{ type: "top5", label: "Top 5", icon: "⬆️" }, { type: "least5", label: "Least 5", icon: "⬇️" }].map(
              ({ type, label, icon }) => (
                <button
                  key={type}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium text-base transition-all duration-200 transform hover:scale-105 shadow-sm focus:outline-none ${
                    filterType === type
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300"
                  }`}
                  onClick={() => setFilterType(type)}
                >
                  <span className="mr-2">{icon}</span>
                  {label}
                </button>
              )
            )}
          </div>
          {selectedDomain && domainDetails.length > 0 ? (
            renderBarChart()
          ) : (
            <p className="text-sm text-gray-600 text-center">
              Select a domain to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BubbleChart;
