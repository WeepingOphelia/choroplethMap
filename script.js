
const countyjson = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
const edujson = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'

const WIDTH = 1000
const HEIGHT = 650;
const PAD = 50
const chart = {
  w: WIDTH - 2 * PAD,
  h: HEIGHT - 2 * PAD,
  origin: { x: PAD, y: HEIGHT - PAD},
  max: {x: WIDTH - PAD, y: PAD},
  svg: null,
}

const colors = ['#8fbc8f', '#6aa68b', '#4c8f85', '#38777b', '#2f5f6c', '#2a4858']

const legend = {
  svg: null,
  boxw: 50,
  w: 50 * colors.length,
  h: 20,
}

chart.svg = d3.select('#chartbox')
  .append('svg')
  .attr('height', HEIGHT)
  .attr('width', WIDTH)
  .style('background-color','#202020')

const tooltip = d3.select('#chartbox')
  .append('div')
  .attr('id','tooltip')
  .style('display','none')

legend.svg = d3.select('#legendbox')
  .append('svg')
  .attr('height', legend.h * 2)
  .attr('width', legend.w + (legend.boxw * 2))
  .attr('id','legend')

const path = d3.geoPath();

Promise.all([d3.json(countyjson), d3.json(edujson)])
  .then(ref => {
    
    const us = ref[0];
    const edu = ref[1];
    const eduDomain = [d3.min(edu, d => d.bachelorsOrHigher), d3.max(edu, d => d.bachelorsOrHigher)]

    const colorScale = d3.scaleQuantize()
      .domain(eduDomain)
      .range(colors)


    const getInfo = id => edu.filter(county => id == county.fips)[0]
    const getEdu = id => getInfo(id).bachelorsOrHigher

    const map = chart.svg
      .append('g')
      .attr('transform', 'translate(50,20)')
      .attr('class', 'counties')

    map.selectAll('path')
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('data-fips', d => d.id)
      .attr('data-education', d => getEdu(d.id))
      .attr('fill', d => colorScale(getEdu(d.id)))
      .attr('d', path)
      .on('mouseover', (event, d) => {

        county = getInfo(d.id)

        tooltip
          .attr('data-education', getEdu(d.id))
          .style('display', '')
          .style('top', event.pageY - 25 + 'px')
          .html(`
          ${county.area_name}, ${county.state}: ${county.bachelorsOrHigher}%
          `)

        if (event.pageX <= window.innerWidth / 2) {
          tooltip
            .style('right', 'auto')
            .style('left', event.pageX + 20 + 'px')
        } else {
          tooltip
            .style('left', 'auto')
            .style('right', (window.innerWidth - event.pageX + 20) + 'px')
        }
        })
      .on('mouseout', () => {

          tooltip.style('display', 'none');

        })
      
      
      const legendScale = d3.scaleLinear()
        .domain(eduDomain)
        .range([0, legend.w])


      const legendAxis = d3.axisBottom(legendScale)
        .tickValues([eduDomain[0], ...colorScale.thresholds(), eduDomain[1]])

      legend.svg
        .selectAll('rect')
        .data(['black',...colors, 'black'])
        .enter()
        .append('rect')
        .attr('width', legend.boxw)
        .attr('height',legend.h)
        .attr('fill', d => d)
        .attr('x', (d, i) => i * legend.boxw)

      legend.svg
        .append('g')
        .attr('transform','translate(' + legend.boxw + ',' + legend.h + ')')
        .attr('fill','grey')
        .call(legendAxis)


  })