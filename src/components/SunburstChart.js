import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SunburstChart = ({
  data,
  onRegionClick,
  onRegionSpecificMetricsClick,
  title = "Industry Overview",
  description = "Discover how AI is transforming different sectors through our interactive visualizations. Click on segments to zoom in and explore details.",
}) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) return;

    // Clear any existing SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = 928;
    const height = width;
    const radius = width / 2.2;

    // Create the color scale
    const color = d3
      .scaleOrdinal()
      .domain(data.children.map((d) => d.name))
      .range([
        '#743089',
        '#2c7bb6',
        '#FF6B6B',
        '#A865B5',
        '#9E7BB5',
        '#b6b5d8',
        '#f29e2e',
        '#e76818',
        '#d7191c',
      ]);

    // Create partition layout
    const partition = (data) => {
      const root = d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value);
      return d3
        .partition()
        .size([2 * Math.PI, root.height + 1])(root);
    };

    const root = partition(data);
    root.each((d) => (d.current = d));

    // Create arc generator
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => (d.y0 * radius) / 3)
      .outerRadius((d) => Math.max((d.y0 * radius) / 3, (d.y1 * radius) / 3 - 1))
      .cornerRadius(2);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "12px Inter, sans-serif")
      .style("background", "transparent");

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .style("opacity", 0);

    // Function to handle clicks
    function clicked(event, p) {
      if (
        p.data.name === "Regions" &&
        p.parent &&
        p.parent.data.name === "AI Development Costs"
      ) {
        event.stopPropagation();
        onRegionClick();
        return;
      } else if (
        p.data.name === "Region Specific Metrics" &&
        p.parent &&
        p.parent.data.name === "AI Global Index"
      ) {
        event.stopPropagation();
        onRegionSpecificMetricsClick();
        return;
      }

      parent.datum(p.parent || root);

      root.each(
        (d) =>
          (d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          })
      );

      const t = svg.transition().duration(750).ease(d3.easeQuadInOut);

      path
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => (d.current = i(t));
        })
        .filter(function (d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill", (d) => {
          if (d.parent && d.parent.data.name === "Job Market") {
            // Assign specific colors for "Job Market" subcategories
            if (d.data.name === "Top AI Startups") {
              return "#8968CD"; // SUNSET PURPLE
            } else if (d.data.name === "Salaries Trends") {
              return "#CEA2FD"; // HEATHER
            } else if (d.data.name === "AI Industries") {
              return "#B6B5D8"; // EARLY BIRD
            }
          }
        
          // For all other nodes, use the original color logic
          while (d.depth > 1) d = d.parent;
          return color(d.data.name);
        })
        
        
        
        .attrTween("d", (d) => () => arc(d.current));

      label
        .filter(function (d) {
          return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        })
        .transition(t)
        .attr("fill-opacity", (d) => +labelVisible(d.target))
        .attrTween("transform", (d) => () => labelTransform(d.current));
    }

    // Create the paths (arcs)
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) => {
        // Apply specific colors to subcategories under "Job Market"
        if (d.parent && d.parent.data.name === "Job Market") {
          if (d.data.name === "Top AI Startups") {
            return "#8968CD"; // SUNSET PURPLE
          } else if (d.data.name === "Salaries Trends") {
            return "#CEA2FD"; // HEATHER
          } else if (d.data.name === "AI Industries") {
            return "#B6B5D8"; // EARLY BIRD
          }
        }
    
        // Default color for all other nodes
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr("fill-opacity", (d) =>
        arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
      )
      .attr("d", (d) => arc(d.current))
      .style("cursor", "pointer")
      .on("click", clicked);

    path
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(d.data.name)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Add labels
    const label = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d) => +labelVisible(d.current))
      .attr("transform", (d) => labelTransform(d.current))
      .text((d) => d.data.name);

    // Add center circle
    const parent = svg
      .append("circle")
      .datum(root)
      .attr("r", radius / 3)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
      const x = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius / 3;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    return () => {
      d3.select("body").selectAll(".chart-tooltip").remove();
    };
  }, [data, onRegionClick, onRegionSpecificMetricsClick]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-600 max-w-2xl text-center mb-4">{description}</p>
      <svg ref={svgRef} className="sunburst-chart" />
    </div>
  );
};

export default SunburstChart;
