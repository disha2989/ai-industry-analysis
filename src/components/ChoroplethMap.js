import React, { useEffect, useRef, useState } from 'react';

const readCSVFile = async (filePath) => {
  try {
    // Read file as Uint8Array
    const fileContent = await window.fs.readFile(filePath);
    // Convert Uint8Array to string
    const text = new TextDecoder().decode(fileContent);
    
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    
    const parsedData = rows.slice(1)
      .filter(row => row.trim())
      .map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });
      
    return parsedData;
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Error reading file: ${error.message}`);
  }
};

const ChoroplethMap = () => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dimensions] = useState({
    width: 960,
    height: 500,
    margin: { top: 20, right: 20, bottom: 20, left: 20 }
  });

  // Helper function to calculate mean
  const calculateMean = (arr, key) => {
    const sum = arr.reduce((acc, curr) => acc + parseFloat(curr[key] || 0), 0);
    return arr.length ? sum / arr.length : 0;
  };

  // Helper function to group data
  const groupByRegion = (dataArray) => {
    return dataArray.reduce((acc, curr) => {
      const region = curr.Region;
      if (!acc[region]) acc[region] = [];
      acc[region].push(curr);
      return acc;
    }, {});
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load...');
        const parsedData = await readCSVFile('4_AI_index_db.csv');
        console.log('Data parsed successfully:', parsedData.length, 'rows');
        setData(parsedData);
      } catch (error) {
        console.error('Load error:', error);
        setError(error.message);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    try {
      console.log('Starting visualization...');
      const svg = svgRef.current;
      
      // Clear existing content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      // Create SVG namespace elements
      const regionGroups = groupByRegion(data);
      const regionLocations = {
        'Americas': { x: 200, y: 250 },
        'Europe': { x: 480, y: 150 },
        'Asia-Pacific': { x: 700, y: 250 },
        'Middle East': { x: 550, y: 250 },
        'Africa': { x: 480, y: 300 }
      };

      // Set SVG attributes
      svg.setAttribute('width', dimensions.width);
      svg.setAttribute('height', dimensions.height);
      svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

      // Helper function for color interpolation
      const getColor = (score) => {
        const normalizedScore = score / 100;
        const r = Math.round(247 + (8 - 247) * normalizedScore);
        const g = Math.round(251 + (48 - 251) * normalizedScore);
        const b = Math.round(255 + (107 - 255) * normalizedScore);
        return `rgb(${r},${g},${b})`;
      };

      // Create group elements for each region
      Object.entries(regionGroups).forEach(([region, countries]) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const location = regionLocations[region];
        
        if (!location) return;

        group.setAttribute('transform', `translate(${location.x},${location.y})`);

        // Create circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const avgScore = calculateMean(countries, 'Total score');
        const radius = Math.sqrt(countries.length) * 20;

        circle.setAttribute('r', radius);
        circle.setAttribute('fill', getColor(avgScore));
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('opacity', '0.7');

        // Add event listeners
        circle.addEventListener('mouseover', () => {
          circle.setAttribute('opacity', '1');
          circle.setAttribute('stroke-width', '3');
          
          const tooltip = tooltipRef.current;
          if (tooltip) {
            tooltip.style.visibility = 'visible';
            tooltip.innerHTML = `
              <div class="bg-white shadow-lg rounded-lg p-4">
                <h3 class="font-bold text-lg mb-2">${region}</h3>
                <p>Average Score: ${avgScore.toFixed(1)}</p>
                <p>Countries: ${countries.length}</p>
                <p class="text-sm mt-2">Top Countries:</p>
                ${countries
                  .sort((a, b) => parseFloat(b['Total score']) - parseFloat(a['Total score']))
                  .slice(0, 3)
                  .map(c => `<div class="text-sm">${c.Country}: ${parseFloat(c['Total score']).toFixed(1)}</div>`)
                  .join('')}
              </div>
            `;
          }
        });

        circle.addEventListener('mousemove', (event) => {
          const tooltip = tooltipRef.current;
          if (tooltip) {
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY - 10) + 'px';
          }
        });

        circle.addEventListener('mouseout', () => {
          circle.setAttribute('opacity', '0.7');
          circle.setAttribute('stroke-width', '2');
          
          const tooltip = tooltipRef.current;
          if (tooltip) {
            tooltip.style.visibility = 'hidden';
          }
        });

        // Add text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.textContent = region;
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '0.35em');
        text.setAttribute('class', 'font-bold text-sm');
        text.style.pointerEvents = 'none';

        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
      });

      console.log('Visualization completed');
    } catch (error) {
      console.error('Visualization error:', error);
      setError(`Failed to create visualization: ${error.message || 'Unknown error'}`);
    }
  }, [data, dimensions]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading visualization...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-2">Interactive 3D Globe</h2>
      <p className="text-center text-gray-600 mb-6">Explore AI trends across regions with our interactive globe.</p>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <svg ref={svgRef} className="w-full h-auto" />
        <div 
          ref={tooltipRef} 
          className="absolute invisible bg-white p-2 rounded shadow-lg"
          style={{pointerEvents: 'none'}}
        />
      </div>
      
      {/* Statistics Panel */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-2">Top Performing Countries</h3>
          <div className="space-y-2">
            {data
              .sort((a, b) => parseFloat(b['Total score']) - parseFloat(a['Total score']))
              .slice(0, 5)
              .map(country => (
                <div key={country.Country} className="flex justify-between items-center">
                  <span>{country.Country}</span>
                  <span className="font-bold">{parseFloat(country['Total score']).toFixed(1)}</span>
                </div>
              ))
            }
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-2">Regional Overview</h3>
          <div className="space-y-2">
            {Object.entries(groupByRegion(data)).map(([region, countries]) => {
              const avgScore = calculateMean(countries, 'Total score');
              return (
                <div key={region} className="flex justify-between items-center">
                  <span>{region}</span>
                  <span className="font-bold">{avgScore.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoroplethMap;