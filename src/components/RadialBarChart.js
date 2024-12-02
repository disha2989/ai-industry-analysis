import React, { useEffect } from 'react';
import * as d3 from 'd3';
import csvPath from '../data/4_AI_index_db.csv';

const RadialBarChart = () => {
  useEffect(() => {
    // Load and process the CSV data
    d3.csv(csvPath).then((rawData) => {
      const data = rawData.map((d) => ({
        region: d.Region,
        talent: +d.Talent,
        government: +d['Government Strategy'],
        infrastructure: +d.Infrastructure,
        development: +d.Development,
        research: +d.Research,
      }));
      drawChart(data);
    });
  }, []);

  const drawChart = (data) => {
    const width = 800;
    const height = 800;
    const innerRadius = 150;
    const outerRadius = Math.min(width, height) / 2;

    const svg = d3
      .select('#radial-bar-chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const angleScale = d3
      .scaleBand()
      .domain(data.map((d) => d.region))
      .range([0, 2 * Math.PI])
      .padding(0.1);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => Math.max(d.talent, d.government, d.infrastructure, d.development, d.research))])
      .range([innerRadius, outerRadius]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(['talent', 'government', 'infrastructure', 'development', 'research'])
      .range(['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']);

    const metrics = ['talent', 'government', 'infrastructure', 'development', 'research'];

    // Draw bars for each category in each region
    data.forEach((d) => {
      const group = svg.append('g').attr('transform', `rotate(${(angleScale(d.region) * 180) / Math.PI - 90})`);

      metrics.forEach((metric, i) => {
        group
          .append('path')
          .attr(
            'd',
            d3.arc()({
              innerRadius: innerRadius + i * 20,
              outerRadius: radiusScale(d[metric]),
              startAngle: angleScale(d.region),
              endAngle: angleScale(d.region) + angleScale.bandwidth(),
            })
          )
          .attr('fill', colorScale(metric))
          .attr('opacity', 0.8);
      });
    });

    // Add region labels
    svg
      .selectAll('.region-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'region-label')
      .attr('x', (d) => Math.cos(angleScale(d.region) + angleScale.bandwidth() / 2 - Math.PI / 2) * (outerRadius + 20))
      .attr('y', (d) => Math.sin(angleScale(d.region) + angleScale.bandwidth() / 2 - Math.PI / 2) * (outerRadius + 20))
      .text((d) => d.region)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '10px')
      .style('fill', '#4b5563');

    // Add concentric gridlines
    const gridValues = radiusScale.ticks(5);
    const gridGroup = svg.append('g').attr('class', 'grid-lines');

    gridGroup
      .selectAll('circle')
      .data(gridValues)
      .enter()
      .append('circle')
      .attr('r', (d) => radiusScale(d))
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '4 2');

    gridGroup
      .selectAll('.grid-label')
      .data(gridValues)
      .enter()
      .append('text')
      .attr('x', 0)
      .attr('y', (d) => -radiusScale(d))
      .text((d) => d)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#6b7280');

    // Add a legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${outerRadius + 40}, ${-outerRadius / 2})`);

    metrics.forEach((metric, i) => {
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(metric));

      legend
        .append('text')
        .attr('x', 25)
        .attr('y', i * 20 + 12)
        .text(metric.charAt(0).toUpperCase() + metric.slice(1))
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
    });
  };

  return <div id="radial-bar-chart"></div>;
};

export default RadialBarChart;
