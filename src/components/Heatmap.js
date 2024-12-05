import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import rawData from '../data/4_AI_index_db.csv';

const Heatmap = () => {
  const svgRef = useRef();
  const scatterPlotRef = useRef();
  const containerRef = useRef();
  const [showScatterPlot, setShowScatterPlot] = useState(false); // State to manage scatterplot visibility
  

  useEffect(() => {
    const renderHeatmap = () => {
      const containerWidth = containerRef.current.offsetWidth * 0.8;
      const containerHeight = containerWidth * 0.6;
      const margin = { top: 10, right: 150, bottom: 100, left: 125 }; // Increased right margin for legend
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;
      
    
      d3.select(svgRef.current).selectAll('*').remove();
    
      d3.csv(rawData).then(data => {
        const processedData = data.flatMap(d => [
          { metric: 'Talent', Region: d.Region, value: +d.Talent },
          { metric: 'Infrastructure', Region: d.Region, value: +d.Infrastructure },
          { metric: 'Operating Environment', Region: d.Region, value: +d['Operating Environment'] },
          { metric: 'Research', Region: d.Region, value: +d.Research },
          { metric: 'Development', Region: d.Region, value: +d.Development },
          { metric: 'Government Strategy', Region: d.Region, value: +d['Government Strategy'] },
          { metric: 'Commercial', Region: d.Region, value: +d.Commercial },
        ]);
    
        const metrics = [
          'Talent',
          'Infrastructure',
          'Operating Environment',
          'Research',
          'Development',
          'Government Strategy',
          'Commercial',
        ];
        const regions = [...new Set(data.map(d => d.Region))];
    
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 100]);
        const xScale = d3.scaleBand().domain(regions).range([0, width]).padding(0.1);
        const yScale = d3.scaleBand().domain(metrics).range([0, height]).padding(0.1);
    
        const svg = d3
          .select(svgRef.current)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
    
        svg
          .selectAll('rect')
          .data(processedData)
          .join('rect')
          .attr('x', d => xScale(d.Region))
          .attr('y', d => yScale(d.metric))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', d => colorScale(d.value))
          .style('cursor', d => (d.metric === 'Government Strategy' ? 'pointer' : 'default'))
          .on('click', (event, d) => {
            if (d.metric === 'Government Strategy') {
              setShowScatterPlot(true); // Show scatterplot
              renderScatterPlot(d.Region);
            }
          });
    
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(xScale))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');
    
        svg.append('g').call(d3.axisLeft(yScale));
    
        // Heatmap Vertical Legend
        const legendHeight = 150; // Legend height
        const legendWidth = 10; // Legend width (narrow bar)
    
        const legendScale = d3.scaleLinear().domain([0, 100]).range([legendHeight, 0]); // Vertical scale
    
        const legendGroup = svg
          .append('g')
          .attr('transform', `translate(${width + 20}, ${height / 2 - legendHeight / 2})`); // Centered vertically on the right
    
        // Gradient bar
        legendGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#gradient)');
    
        // Gradient definition
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
          .attr('id', 'gradient')
          .attr('gradientTransform', 'rotate(90)'); // Rotates the gradient vertically
        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateBlues(1)); // Top color
        gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateBlues(0)); // Bottom color
    
        // Legend axis
        legendGroup
          .append('g')
          .call(d3.axisRight(legendScale).ticks(5)) // Vertical axis
          .attr('transform', `translate(${legendWidth}, 0)`); // Move axis to the right of the bar
      });
    };
    
    

    const renderScatterPlot = (region) => {
      const containerWidth = containerRef.current.offsetWidth * 0.9;
      const containerHeight = containerWidth * 0.4;
      const margin = { top: 20, right: 150, bottom: 100, left: 50 }; // Increased right margin for legend
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;
    
      d3.select(scatterPlotRef.current).selectAll('*').remove();
    
      d3.csv(rawData).then(data => {
        const regionData = data.filter(d => d.Region === region);
    
        const xScale = d3.scaleBand()
          .domain(regionData.map(d => d.Country))
          .range([0, width])
          .padding(0.1);
        const yScale = d3.scaleLinear()
          .domain([0, d3.max(regionData, d => +d['Government Strategy'])])
          .range([height, 0]);
    
        // Define unique shapes for each political regime
        const politicalRegimes = [...new Set(regionData.map(d => d['Political regime']))];
        const shapeScale = d3.scaleOrdinal()
          .domain(politicalRegimes)
          .range([
            d3.symbolCircle,
            d3.symbolTriangle,
            d3.symbolDiamond,
            d3.symbolSquare,
            d3.symbolCross,
            d3.symbolStar
          ]);
    
        const svg = d3
          .select(scatterPlotRef.current)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
    
        // Gridlines
        svg.append('g')
          .attr('class', 'grid')
          .selectAll('line')
          .data(yScale.ticks())
          .join('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', d => yScale(d))
          .attr('y2', d => yScale(d))
          .attr('stroke', '#ccc')
          .attr('stroke-dasharray', '2 2');
        svg.append('g')
  .attr('class', 'grid')
  .selectAll('line')
  .data(xScale.domain())
  .join('line')
  .attr('x1', d => xScale(d) + xScale.bandwidth() / 2)
  .attr('x2', d => xScale(d) + xScale.bandwidth() / 2)
  .attr('y1', 0)
  .attr('y2', height)
  .attr('stroke', '#ccc')
  .attr('stroke-dasharray', '2 2');

  

    
        // Draw shapes with animation
        const shapes = svg.selectAll('path')
          .data(regionData)
          .join('path')
          .attr('d', d => d3.symbol().type(shapeScale(d['Political regime']))())
          .attr('transform', d => 
            `translate(${xScale(d.Country) + xScale.bandwidth() / 2},${yScale(+d['Government Strategy'])})`
          )
          .attr('opacity', 0) // Initially hidden
          .attr('fill', 'steelblue');
    
        // Sequentially animate shapes
        politicalRegimes.forEach((regime, i) => {
          shapes
            .filter(d => d['Political regime'] === regime)
            .transition()
            .delay(i * 1200) // Delay based on the regime order
            .duration(500) // Animation duration for each group
            .attr('opacity', 1); // Fade-in effect
        });
    
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(xScale))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');
    
        svg.append('g').call(d3.axisLeft(yScale));
    
        // Scatter Plot Legend
        const legend = svg.append('g').attr('transform', `translate(${width + 20}, 20)`);
    
        politicalRegimes.forEach((regime, i) => {
          legend
            .append('path')
            .attr('d', d3.symbol().type(shapeScale(regime)).size(100)())
            .attr('transform', `translate(0, ${i * 20})`)
            .attr('fill', 'steelblue');
    
          legend
            .append('text')
            .attr('x', 15)
            .attr('y', i * 20 + 5)
            .text(regime)
            .style('alignment-baseline', 'middle');
        });
      });
    };
    
    
    

    renderHeatmap();

    window.addEventListener('resize', renderHeatmap);
    return () => window.removeEventListener('resize', renderHeatmap);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <div style={{ marginBottom: '20px'}}>
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
        AI Regional Trends Heatmap
      </h2>
      <p className="text-sm text-gray-600 text-center mb-6" style={{ marginBottom: '50px' }}>
        Explore how different regions perform across various AI metrics such as Talent, Research, Development, and Government Strategy. 
        Click on "Government Strategy" to drill down into country-level analysis using a scatterplot.


      </p>
        <svg ref={svgRef}></svg>
      </div>
      {showScatterPlot && (
        <div>
          <h2 className="text-xl font-bold mb-2 text-center text-gray-800">
          Country-Level AI Government Strategy Analysis
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6" style={{ marginBottom: '20px' }}>
          This scatterplot visualizes country-level performance in "Government Strategy" metrics, with shapes indicating the type of political regime. 
          Use the "Reset" button to return to the Heatmap.
        </p>
          <svg ref={scatterPlotRef}></svg>
          <button
            onClick={() => setShowScatterPlot(false)} // Reset scatterplot view
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#3281bd',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
