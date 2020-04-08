import * as d3 from 'd3';
import './style.css';

(function () {
  const $map = d3.select('#svg-map');
  const {width, height} = $map.node().getBoundingClientRect();

  const mapWidth = width;
  const mapHeight = height;

  const projection = d3
    .geoAlbersUsa()
    .translate([mapWidth / 2, mapHeight / 2])
    .scale(mapWidth);
  const path = d3.geoPath().projection(projection);

  const $g = $map.select('#map-g').attr('width', mapWidth).attr('height', mapHeight);

  // Define linear scale for output
  var color = d3.scaleLinear().range(['#bdd7e7', '#6baed6', '#3182bd', '#08519c']);

  // Append Div for tooltip to SVG
  var div = d3.select('#map-legend').append('div').attr('class', 'tooltip').style('opacity', 0);

  Promise.all([
    d3.json('assets/storePop.json'),
    d3.json('assets/us-states.json'),
    d3.json('assets/retailCities.json'),
  ]).then(([storePop, usStates, retailLocs]) => {
    color.domain([0, 1, 2, 3]);

    for (var i = 0; i < storePop.length; i++) {
      // Grab State Name
      var dataState = storePop[i].state;

      // Grab data value
      var dataValue = storePop[i].visited;

      var abbr = storePop[i].fips[1];

      // Find the corresponding state inside the GeoJSON
      for (var j = 0; j < usStates.features.length; j++) {
        var jsonState = usStates.features[j].properties.name;

        if (dataState == jsonState) {
          usStates.features[j].properties.abbr = abbr;
          // Copy the data value into the JSON
          usStates.features[j].properties.visited = dataValue;

          // Stop looking through the JSON
          break;
        }
      }
    }

    function fillColor(d) {
      // const datum = d[field];
      // return datum != undefined && datum !== 0 ? colorScale(datum) : mapNoDataColor;

      var value = d.properties.visited;

      if (value) {
        //If value exists…
        return color(value);
      } else {
        //If value is undefined…
        return '#bdd7e7';
      }
    }

    // Bind the data to the SVG and create one path per GeoJSON feature
    const $states = $g
      .select('#map-states')
      .selectAll('.map-state')
      .data(usStates.features)
      .join((enter) => {
        const states = enter.append('path').attr('opacity', 0).attr('class', 'map-state map-feat');

        enter
          .append('text')
          .attr('class', 'state-label')
          .attr('x', (d) => {
            const abbr = d.properties.abbr || '';
            const centroid = path.centroid(d);
            if (abbr === 'FL') {
              return centroid[0] + 8;
            }

            if (abbr === 'MI') {
              return centroid[0] + 8;
            }

            if (abbr === 'LA') {
              return centroid[0] - 8;
            }
            return centroid[0] || 0;
          })
          .attr('y', (d) => {
            const abbr = d.properties.abbr || '';
            const centroid = path.centroid(d);

            if (abbr === 'MI') {
              return centroid[1] + 20;
            }

            return centroid[1] || 0;
          })
          .attr('text-anchor', 'middle')
          // .attr('font-size', '10px')
          // .attr('fill', '#000')
          .text((d) => d.properties.abbr || '');

        return states;
      });

    /* states are the paths in the dom */
    $states
      .attr('d', path)
      .transition()
      .duration(0)
      .attr('opacity', 1)
      .style('stroke', '#fff')
      .style('stroke-width', '1')
      .attr('fill', fillColor);

    /*  */
    $g.selectAll('circle')
      .data(retailLocs)
      .enter()
      .append('circle')
      .attr('cx', (d) => {
        return projection([d.lon, d.lat])[0];
      })
      .attr('cy', (d) => {
        return projection([d.lon, d.lat])[1];
      })
      .attr('r', (d) => {
        return Math.sqrt(d.years) * 4;
      })
      .style('fill', 'rgb(217,91,67)')
      .style('opacity', 0.85)

      // Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks"
      // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
      .on('mouseover', (d) => {
        div.transition().duration(200).style('opacity', 0.9);
        div
          .text(d.place)
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY - 28 + 'px');
      })

      // fade out tooltip on mouse out
      .on('mouseout', (d) => {
        div.transition().duration(500).style('opacity', 0);
      });

    // Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
    // var legend = d3
    //   .select('body')
    //   .append('svg')
    //   .attr('class', 'legend')
    //   .attr('width', 140)
    //   .attr('height', 200)
    //   .selectAll('g')
    //   .data(color.domain().slice().reverse())
    //   .enter()
    //   .append('g')
    //   .attr('transform', function (d, i) {
    //     return 'translate(0,' + i * 20 + ')';
    //   });

    // legend.append('rect').attr('width', 18).attr('height', 18).style('fill', color);

    // legend
    //   .append('text')
    //   .data(legendText)
    //   .attr('x', 24)
    //   .attr('y', 9)
    //   .attr('dy', '.35em')
    //   .text((d) => {
    //     return d;
    //   });
  });
})();
