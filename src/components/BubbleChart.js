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
        })).filter((d) => d.value > 0); // Exclude entities with value 0.0

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

    // Determine filter limits
    const limit = parseInt(filterType.match(/\d+/)[0], 10);
    const type = filterType.startsWith("top") ? "top" : "least";

    const filteredData =
      type === "top"
        ? domainDetails.slice(0, limit)
        : domainDetails.slice(-limit).reverse();

        const barWidth = width / 2 - 140; // Increased left margin for longer text
        const barHeight = 24; // Increased bar height
        const chartHeight = filteredData.length * (barHeight + 8); // Increased spacing

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.value)])
      .range([0, barWidth]);

    return (
      <svg width={width / 2} height={chartHeight} className="mx-auto">
        {filteredData.map((d, i) => (
          <g
            key={i}
            transform={`translate(120, ${i * (barHeight + 8) + 8})`}
            className="transition-all duration-200 hover:opacity-80"
          >
            <rect
              x="0"
              y="0"
              width={xScale(d.value)}
              height={barHeight}
              fill="#4ECDC4"
              rx="2"
              className="transition-all duration-200"
            />
            <text
              x={-8}
              y={barHeight / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#333"
              fontSize="13px"
              className="font-medium"
              style={{
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {d.entity}
            </text>
            <text
              x={xScale(d.value) + 8}
              y={barHeight / 2}
              alignmentBaseline="middle"
              fill="#666"
              fontSize="13px"
              className="font-medium"
            >
              {formatValue(d.value)}
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

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.domain))
    .range([
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEEAD",
      "#D4A5A5",
      "#9B59B6",
      "#3498DB",
    ]);

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
  fill={color(leaf.data.domain)} // Dynamic colors
  opacity={hoveredDomain === null || hoveredDomain === leaf.data.domain ? 0.8 : 0.3} // Highlight hover
  stroke="#fff" // White border
  strokeWidth="1.5"
  style={{ cursor: "pointer", transition: "opacity 0.3s, transform 0.2s" }}
  onMouseEnter={() => setHoveredDomain(leaf.data.domain)}
  onMouseLeave={() => setHoveredDomain(null)}
  onClick={() => handleDomainClick(leaf.data.domain)}
>
  <title>{`${leaf.data.domain}: ${formatValue(leaf.data.value)} petaFLOP`}</title>
</circle>


                    {leaf.r > 30 && (
                      <>
                        <text
                          textAnchor="middle"
                          dy="-0.5em"
                          fill="#333"
                          className="pointer-events-none font-semibold"
                          style={{ fontSize: Math.min(leaf.r / 4, 16) }}
                        >
                          {leaf.data.domain}
                        </text>
                        <text
                          textAnchor="middle"
                          dy="1em"
                          fill="#666"
                          className="pointer-events-none"
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
          <div className="flex flex-wrap justify-center gap-2 mb-4">
  {["top5", "least5"].map((type) => (
    <button
      key={type}
      className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  filterType === type
                    ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
      onClick={() => setFilterType(type)}
    >
      {type.replace(/(\d+)/, " $1").replace("top", "Top").replace("least", "Least")}
    </button>
  ))}
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