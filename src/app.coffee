
parties = [
  { name: 'Partido A', cssName: 'a-party', votes: 100000 },
  { name: 'Partido B', cssName: 'b-party', votes:  80000 },
  { name: 'Partido C', cssName: 'c-party', votes:  30000 },
  { name: 'Partido D', cssName: 'd-party', votes:  20000 },
  { name: 'Partido E', cssName: 'd-party', votes:  20 },
]

totalVotes = _.sum(_.pluck(parties, 'votes'))

simulatePrice = (price) ->
  _.map(parties, (p) -> Math.ceil(p.votes / price))

simulation = [simulatePrice(price) for price in [1000..totalVotes] by 1000]

width = 500
height = 300
chart = d3.select(".chart")
  .attr("width", width)
  .attr('height', height)
  .attr('font-family', 'Arial')

labelWidth = 100
scaleWidth = width - labelWidth
x = d3.scale.linear()
  .domain([0, d3.max(parties, (p) -> p.votes)])
  .range([0, scaleWidth])

y = d3.scale.ordinal()
  .domain(_.map(parties, 'name'))
  .rangeRoundBands([0, height], 0.3, 0.2)

colors = d3.scale.category10().range()

setBarText = (bar) ->
  bar
    .text((d) -> (d.votes * 100 / totalVotes).toFixed(2) + '%')
    .attr('x', (d) ->
      if x(d.votes) > 50 # big enough bar, put text inside
        labelWidth + x(d.votes) - 5
      else #small bar, put text aside
        labelWidth + x(d.votes) + 5
    )
    .attr('text-anchor', (d) ->
      if x(d.votes) > 50 # big enough bar, put text inside
        'end' # align right
      else #small bar, put text aside
        'start' # align left
    )
    .attr('fill', (d, i) ->
      if x(d.votes) > 50
        'white'
      else
        'black'
    )

build = (bar) ->
  bar = bar.append('g')
    .attr('transform', (d, i) -> "translate(0,#{y.range()[i]})")

  bar.append('rect')
    .attr('height', y.rangeBand())
    .attr('x', labelWidth)
    .style('fill', (d, i) -> colors[i])

  bar.append('text')
    .attr('class', 'ylabel')
    .attr('x', labelWidth - 10)
    .attr('y', y.rangeBand() / 2)
    .attr('text-anchor', 'end')
    .attr('dy', '.35em')
    .style('fill', 'black')
    .text((d) -> d.name)

  bar.append('text')
    .attr('class', 'text-value')
    .attr('y', y.rangeBand() / 2)
    .attr('dy', '.35em')
    .attr('opacity', 1)

update = (bar) ->
  bar.selectAll('rect')
    .transition()
      .duration(500)
      .attr('width', (d) -> x(d.votes))

  bar.selectAll('.text-value')
    .transition()
      .duration(100)
      .attr('opacity', 0)
    .transition()
      .call(setBarText)
    .transition()
      .delay(300)
      .duration(100)
      .attr('opacity', 1)
drawBarChart = ->
  sel = chart.selectAll('g')
    .data(parties, (d) -> d.name)

  sel.enter().call(build)

  sel.call(update)
  return

  completeBar(updateSet)

  insertSet = updateSet.enter()
    .append('g')
  completeBar(insertSet)

  deleteSet = updateSet.exit()
    .remove()

  return


randomize = ->
  for party in parties
    party.votes = Math.random() * 50000
  drawBarChart()

drawBarChart()
setInterval randomize, 2000
