import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import rawData from '../data/4_AI_index_db.csv';

const Heatmap = () => {
  const svgRef = useRef();
  const scatterPlotRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const renderHeatmap = () => {
      const containerWidth = containerRef.current.offsetWidth * 0.8;
      const containerHeight = containerWidth * 0.6;
      const margin = { top: 10, right: 30, bottom: 100, left: 125 };
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      d3.select(svgRef.current).selectAll('*').remove();
      d3.select(scatterPlotRef.current).selectAll('*').remove();

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
          .on('click', (event, d) => {
            if (d.metric === 'Government Strategy') {
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

        // Heatmap Legend
        const legendWidth = 150;
        const legendHeight = 10;

        const legendScale = d3.scaleLinear().domain([0, 100]).range([0, legendWidth]);

        const legendGroup = svg
          .append('g')
          .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${height + 60})`);

        legendGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', -legendHeight)
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#gradient)');

        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient').attr('id', 'gradient');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateBlues(0));
        gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateBlues(1));

        legendGroup.append('g').call(d3.axisBottom(legendScale).ticks(5));
      });
    };

    const renderScatterPlot = (region) => {
      const containerWidth = containerRef.current.offsetWidth * 0.9;
      const containerHeight = containerWidth * 0.4;
      const margin = { top: 20, right: 30, bottom: 100, left: 50 };
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
            d3.symbolSquare,
            d3.symbolTriangle,
            d3.symbolDiamond,
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
    
        // Draw shapes
        svg.selectAll('path')
          .data(regionData)
          .join('path')
          .attr('d', d => d3.symbol().type(shapeScale(d['Political regime']))())
          .attr('transform', d => 
            `translate(${xScale(d.Country) + xScale.bandwidth() / 2},${yScale(+d['Government Strategy'])})`
          )
          .attr('fill', 'steelblue');
    
        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(xScale))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');
    
        svg.append('g').call(d3.axisLeft(yScale));
    
        // Scatter Plot Legend
        const legend = svg.append('g').attr('transform', `translate(${width - 100},${20})`);
    
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
      <div style={{ marginBottom: '20px' }}>
        <svg ref={svgRef}></svg>
      </div>
      <div>
        <svg ref={scatterPlotRef}></svg>
      </div>
    </div>
  );
};

export default Heatmap;
