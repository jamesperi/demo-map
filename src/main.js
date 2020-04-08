import * as d3 from 'd3'
import './style.css'
;(function () {
  const $map = d3.select('#svg-map')
  const { width, height } = $map.node().getBoundingClientRect()

  const mapWidth = width
  const mapHeight = height

  const projection = d3
    .geoAlbersUsa()
    .translate([mapWidth / 2, mapHeight / 2])
    .scale(mapWidth)
  const path = d3.geoPath().projection(projection)
  const $g = $map.select('#map-g').attr('width', mapWidth).attr('height', mapHeight)
  const color = d3.scaleLinear().range(['#bdd7e7', '#6baed6', '#3182bd', '#08519c'])
  const div = d3.select('#tooltip').attr('class', 'tooltip').style('opacity', 0)

  Promise.all([d3.json('assets/storePop.json'), d3.json('assets/us-states.json'), d3.json('assets/retailCities.json')]).then(
    ([storePop, usStates, retailLocs]) => {
      color.domain([0, 1, 2, 3])

      /* handle state storeCount. For state color shade */
      for (const store of storePop) {
        const {
          state: dataStateName,
          storeCount,
          fips: [_, abbr]
        } = store

        for (const [index, feature] of usStates.features.entries()) {
          const {
            properties: { name: usStateName }
          } = feature

          if (dataStateName == usStateName) {
            usStates.features[index].properties.abbr = abbr
            usStates.features[index].properties.storeCount = storeCount
            break
          }
        }
      }

      function fillColor(d) {
        // const datum = d[field];
        // return datum != undefined && datum !== 0 ? colorScale(datum) : mapNoDataColor;

        const storeCount = d.properties.storeCount

        return storeCount ? color(storeCount) : '#bdd7e7'
      }

      const $states = $g
        .select('#map-states')
        .selectAll('.map-state')
        .data(usStates.features)
        .join(enter => {
          const states = enter.append('path').attr('opacity', 0).attr('class', 'map-state map-feat')

          enter
            .append('text')
            .attr('class', 'state-label')
            .attr('x', d => {
              const abbr = d.properties.abbr || ''
              const centroid = path.centroid(d)
              if (abbr === 'FL') {
                return centroid[0] + 16
              }

              if (abbr === 'MI') {
                return centroid[0] + 8
              }

              if (abbr === 'LA') {
                return centroid[0] - 8
              }

              if (abbr === 'HI') {
                return centroid[0] + 18
              }

              if (abbr === 'CA') {
                return centroid[0] - 20
              }

              return centroid[0] || 0
            })
            .attr('y', d => {
              const abbr = d.properties.abbr || ''
              const centroid = path.centroid(d)

              if (abbr === 'MI') {
                return centroid[1] + 20
              }

              if (abbr === 'NH') {
                return centroid[1] + 10
              }

              if (abbr === 'CT') {
                return centroid[1] + 2
              }

              if (abbr === 'ID') {
                return centroid[1] + 18
              }

              if (abbr === 'HI') {
                return centroid[1] + 18
              }

              return centroid[1] || 0
            })
            .style('fill', d => {
              return d.properties.storeCount > 2 ? '#FFF' : '#000'
            })
            .text(d => d.properties.abbr || '')

          return states
        })

      $states.attr('d', path).transition().duration(0).attr('opacity', 1).style('stroke', '#fff').style('stroke-width', '1').attr('fill', fillColor)

      $g.selectAll('circle')
        .data(retailLocs)
        .enter()
        .append('circle')
        .attr('cx', d => {
          return projection([d.lon, d.lat])[0]
        })
        .attr('cy', d => {
          return projection([d.lon, d.lat])[1]
        })
        .attr('r', d => {
          return Math.sqrt(d.years) * 4
        })
        .style('fill', 'rgb(217,91,67)')
        .style('opacity', 0.85)

        // Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks"
        // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
        .on('mouseover', d => {
          div.transition().duration(200).style('opacity', 0.9)
          div
            .text(d.place)
            .style('z-index', 1)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY - 28}px`)
        })

        // fade out tooltip on mouse out
        .on('mouseout', d => {
          div.transition().duration(500).style('opacity', 0)
        })
    }
  )
})()
