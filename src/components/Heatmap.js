import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import rawData from '../data/4_AI_index_db.csv';

const Heatmap = () => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    // Function to resize the heatmap based on the container's size
    const renderHeatmap = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerWidth * 0.6; // Maintain aspect ratio
      const margin = { top: 10, right: 30, bottom: 80, left: 125 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      // Remove any existing SVG elements (to prevent duplicates)
      d3.select(svgRef.current).selectAll('*').remove();

      // Load and process data
      d3.csv(rawData).then(data => {
        const processedData = data.flatMap(d => [
          { metric: 'Talent', Region: d.Region, value: +d.Talent },
          { metric: 'Infrastructure', Region: d.Region, value: +d.Infrastructure },
          {
            metric: 'Operating Environment',
            Region: d.Region,
            value: +d['Operating Environment'],
          },
          { metric: 'Research', Region: d.Region, value: +d.Research },
          { metric: 'Development', Region: d.Region, value: +d.Development },
          {
            metric: 'Government Strategy',
            Region: d.Region,
            value: +d['Government Strategy'],
          },
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

        const colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([0, 100]);

        const xScale = d3
          .scaleBand()
          .domain(regions)
          .range([0, width])
          .padding(0.1);

        const yScale = d3
          .scaleBand()
          .domain(metrics)
          .range([0, height])
          .padding(0.1);

        const svg = d3
          .select(svgRef.current)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        // Draw heatmap cells
        svg
          .selectAll('rect')
          .data(processedData)
          .join('rect')
          .attr('x', d => xScale(d.Region))
          .attr('y', d => yScale(d.metric))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', d => colorScale(d.value));

        // Add X Axis
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(xScale))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');

        // Add Y Axis
        svg.append('g').call(d3.axisLeft(yScale));

        // Add a legend
        const legendWidth = 150;
        const legendHeight = 10;

        const legendScale = d3
          .scaleLinear()
          .domain([0, 100])
          .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale).ticks(5);

        const legendGroup = svg
          .append('g')
          .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${height + 60})`);

        legendGroup.call(legendAxis);

        legendGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', -legendHeight)
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#gradient)');

        // Add gradient definition
        const defs = svg.append('defs');
        const gradient = defs
          .append('linearGradient')
          .attr('id', 'gradient');

        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d3.interpolateBlues(0));
        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d3.interpolateBlues(1));
      });
    };

    // Initial render
    renderHeatmap();

    // Re-render on window resize
    window.addEventListener('resize', renderHeatmap);
    return () => window.removeEventListener('resize', renderHeatmap);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Heatmap;
