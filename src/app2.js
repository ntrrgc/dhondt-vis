$.fn.pageShow = function() {
  this.removeClass('invisible');
  return this;
}
$.fn.pageHide = function() {
  this.addClass('invisible');
  return this;
}

function router() {
  var requestedView = location.hash;
  if (requestedView == '') {
    requestedView = router.homeView;
  } else {
    // Remove leading #
    requestedView = requestedView.substr(1);
  }

  var newViewIndex = router.views.indexOf(requestedView);
  if (newViewIndex == -1) {
    // View not found, show home
    console.log('View not found');
    requestedView = router.homeView;
  }

  var willAnimate = router.localTransition;
  router.localTransition = false;

  if (router.currentView !== null) {
    // There was a previous view
    var oldViewIndex = router.views.indexOf(router.currentView);
    var $previous = $('#' + router.currentView);
    var $next = $('#' + requestedView);
    var direction = (newViewIndex > oldViewIndex ? 'left' : 'right')

    if (willAnimate) {
      animateSlide($previous, 'out', direction);
      animateSlide($next, 'in', direction);
    } else {
      $previous.pageHide();
      $next.pageShow();
    }
  } else {
    // Show first slide
    $('#' + requestedView).pageShow();
  }

  router.currentView = requestedView;
  focusNextButton();

  if (router.currentView == 'demo') {
    if (tipIndex == 0) {
      setTimeout(showTips, 600);
    }
  }
}
router.currentView = null;
router.homeView = 'titulo';
router.views = [
  'titulo',
  'introduccion',
  'ejemplo',
  'explicacion',
  'demo',
  'acerca'
];
// localTransition is set to true just before a location.hash change to
// indicate the transition was triggered by a page element and not by browser'
// back / forward buttons.
router.localTransition = false;
router.goTo = function(newHash) {
  router.localTransition = true;
  location.hash = newHash;
}
router.goBack = function() {
  var oldViewIndex = router.views.indexOf(router.currentView);
  router.goTo(router.views[oldViewIndex - 1])
}

function animateSlide(page, destination, direction) {
  var width = page.width();
  var duration = 300;
  var marginX = 5;
  var marginY = 5;

  var css = {
    'position': 'fixed',
    'width': width,
    'right': 'auto',
    'top': marginY,
    'bottom': marginY
  };

  if (destination == 'out') {
    // Initially on screen
    css['left'] = 0 + marginX;
    page.pageShow().css(css);

    var destX = (direction == 'right' ? width : -width);
    page.velocity({
      'left': destX + marginX
    }, duration, function animationEnd() {
      // Hide and reset CSS
      page
        .pageHide()
        .css({
          'position': '',
          'width': '',
          'right': '',
          'left': '',
          'top': '',
          'bottom': ''
        });
    })
  } else { // destination == 'in'
    // Initially out of screen
    css['left'] = (direction == 'right' ? -width : width);
    page.pageShow().css(css);

    page.velocity({
      'left': marginX
    }, duration, function animationEnd() {
      // Reset CSS so the content is not fixed size
      page.css({
        'position': '',
        'width': '',
        'right': '',
        'left': '',
        'top': '',
        'bottom': ''
      });
    })
  }
}

function nextPage() {
  var currentIndex = router.views.indexOf(router.currentView);
  var nextPage = router.views[currentIndex + 1];

  router.goTo('#' + nextPage);
}

function focusNextButton() {
  var view = $('#' + router.currentView);
  $('.next', view).focus();
}

var parties = [
  { name: 'Partido A', color: '#758BE2', textColor: '#5F70B6', votes: 100000, altcolor: '#1f78b4' },
  { name: 'Partido B', color: '#E4DB7A', textColor: '#A5A05C', votes:  80000, altcolor: '#a6cee3' },
  { name: 'Partido C', color: '#EA7F90', textColor: '#C57380', votes:  30000, altcolor: '#33a02c' },
  { name: 'Partido D', color: '#8DC58E', textColor: '#6A906B', votes:  20000, altcolor: '#b2df8a' }
]

var defaultVotes = _.map(parties, 'votes');
function resetToDefaultVotes() {
  _.each(parties, function(d, i) {
    d.votes = defaultVotes[i];
  })
}

var colorblindMode = false;

var partiesColors;
updatePartiesColors();

function updatePartiesColors() {
  partiesColors = _.zipObject(
    _.map(parties, 'name'),
    _.map(parties, function(p) {
      if (!colorblindMode) {
        return {
          normal: p.color,
          textColor: p.textColor,
          lighter: d3.rgb(p.color).brighter(1)
        };
      } else {
        return {
          normal: p.altcolor,
          textColor: '#000',
          lighter: d3.rgb(p.altcolor).brighter(1)
        };
      }
    }))
}

// Sort in descending order
parties.sort(function(a, b) {
  return a.votes < b.votes;
})

function calcNumSeatsByPrice(price) {
  var seats = 0;
  for (var i = 0; i < parties.length; i++) {
    var party = parties[i];
    seats += Math.floor(party.votes / price)
  }
  return seats;
}

function findDiscontinuityLeft(outputFn, plainValue, boundMin, boundMax, limit) {
  if (boundMax == boundMin) {
    throw new Error("Could not find discontinuity");
  }

  if (Math.abs(boundMax - boundMin) <= limit) {
    if (outputFn(boundMax) != outputFn(boundMin)) {
      return boundMax;
    } else {
      throw new Error("Could not find discontinuity");
    }
  }

  var median = Math.round(boundMin + (boundMax - boundMin) / 2);
  var value = outputFn(median);

  if (value == plainValue) {
    // Keep searching on the left
    return findDiscontinuityLeft(outputFn, plainValue, boundMin, median, limit);
  } else {
    // Keep searching on the right
    return findDiscontinuityLeft(outputFn, plainValue, median, boundMax, limit);
  }
}

function simulatePrice(price) {
  var table = [];
  var seatsAccum = 0;
  for (var i = parties.length - 1; i >= 0; i--) {
    var p = parties[i];

    var seats = Math.floor(p.votes / price)
    var row = {
      party: p.name,
      seats: seats,
      seatsAccumBase: seatsAccum
    };
    seatsAccum += seats;
    table.push(row);
  }
  return table;
}

function calcDistribution(maxSeats) {
  var minPrice = 1;
  var maxPrice = _.max(parties, 'votes').votes;
  var totalVotes = _.sum(_.pluck(parties, 'votes'))
  var distribution = [];

  var currentPrice = maxPrice;
  while (true) {
    var seats = calcNumSeatsByPrice(currentPrice);
    if (maxSeats && seats > maxSeats) {
      break
    }

    if (seats != totalVotes) {
      var sameSeatsUntilPrice = findDiscontinuityLeft(calcNumSeatsByPrice, seats, minPrice, currentPrice, 1)

      var newEntry = {
        seats: seats,
        priceMin: sameSeatsUntilPrice,
        priceMax: currentPrice,
        distribution: simulatePrice(currentPrice)
      }
      distribution.push(newEntry);

      currentPrice = sameSeatsUntilPrice - 1;
    } else {
      // limit case: 1 seat per vote. We are at the end of the function
      currentPrice = minPrice
      distribution.push({
        seats: seats,
        priceMin: minPrice,
        priceMax: minPrice,
        distribution: simulatePrice(currentPrice)
      });
      break;
    }
  }
  return distribution;
}

var ES = d3.locale({
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["€"],
  "dateTime": "%A, %e %B %Y г. %X",
  "date": "%d.%m.%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  "months": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  "shortMonths": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
})

var maxSeats = 20;
var distribution = calcDistribution(maxSeats);
var xMode = 'price';

function Chart(extendFn) {
  this.margin = {
    left: 40, right: 40,
    top: 20, bottom: 20
  }

  this.canvasWidth = 700;
  this.canvasHeight = 300;
  this.chart = null;
  this.dataRegion = null;
  this.chartSelector = '.chart';
  this.x = null;
  this.y = null;
  this.xAxis = null;
  this.yAxis = null;

  if (extendFn) {
    extendFn.call(this);
  }
}
_.assign(Chart.prototype, {
  initCanvas: function() {
    this.chart = d3.select(this.chartSelector)
      .attr('width', this.width() + this.margin.left + this.margin.right)
      .attr('height', this.height() + this.margin.top + this.margin.bottom)
      .append('g')
        .attr('transform', 'translate(' +
              this.margin.left + ',' +
              this.margin.top + ')');
  },
  initScales: function() {
    this.x = d3.scale.linear()
      .range([0, this.width()])

    this.y = d3.scale.linear()
      .range([this.height(), 0])
  },
  initAxes: function() {
    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient('bottom')

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient('left')
  },
  appendAxes: function() {
    this.chart.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height() + ')')
      .call(this.xAxis)

    this.chart.append('g')
      .attr('class', 'y axis')
      .call(this.yAxis)
  },
  appendGridLines: function() {
    var self = this;
    this.chart.append('g')
      .attr('class', 'grid-lines')
        .selectAll('line')
      .data(this.y.ticks(this.yAxis.ticks())).enter()
        .append('line')
        .attr({
          'x1': 0,
          'x2': this.width(),
          'y1': function(d) {
            return self.y(d);
          },
          'y2': function(d) {
            return self.y(d);
          }
        });
  },
  appendDataRegion: function() {
    this.dataRegion = this.chart.append('g')
      .attr('class', 'data-region')
  },
  update: function() { },
  width: function() {
    return this.canvasWidth - this.margin.left - this.margin.right;
  },
  height: function() {
    return this.canvasHeight - this.margin.top - this.margin.bottom;
  }
})


function VotesChart(opts) {
  opts = opts || {}
  Chart.call(this, function() {
    this.chartSelector = opts.chartSelector || '.chart-votes'
  });

  this.margin = {
    left: 70, right: 100,
    top: 50, bottom: 0
  };
  this.canvasWidth = 460;
  this.canvasHeight = 150;
  this.maxVotes = 150000;
  this.interactive = opts.interactive;

  this.initCanvas()
  this.initScales()
  this.initAxes()
  this.update()
  this.appendAxes()
};
VotesChart.prototype = Object.create(Chart.prototype);
_.assign(VotesChart.prototype, {
  initScales: function() {
    this.x = d3.scale.linear()
      .domain([0, this.maxVotes])
      .range([0, this.width()])

    this.y = d3.scale.ordinal()
      .domain(_.pluck(parties, 'name'))
      .rangeRoundBands([0, this.height()], 0.1, 0.3)
  },

  initAxes: function() {
    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient('top')
      .ticks(5)
      .tickFormat(ES.numberFormat(','))

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .ticks(5)
      .orient('left')

    this.chart.append('text')
      .attr('y', -30)
      .attr('x', halfScale(this.x))
      .attr('class', 'axis-label')
      .style('text-anchor', 'middle')
      .text('Votos')
  },

  updateInteractive: function(interactive) {
    this.interactive = interactive;

    if (interactive) {
      var c = 'bar-rect interactive';
    } else {
      var c = 'bar-rect';
    }

    this.chart.selectAll('.bar-rect')
      .attr('class', c);
  },

  updateColors: function() {
    this.chart.selectAll('rect')
      .data(parties)
    .style('fill', function(d) {
      return partiesColors[d.name].normal;
    })
  },

  update: function() {
    var self = this;

    var barGroup = this.chart.selectAll('g')
      .data(parties)

    var newBarGroup = barGroup
      .enter().append('g')

    newBarGroup.append('rect')
      .attr('x', 0)
      .attr('y', function(d) {
        return self.y(d.name);
      })
      .attr('height', function(d) {
        return self.y.rangeBand();
      })
      .call(function() {
        if (self.interactive) {
          this
            .on('mousedown', function(d) {
              d3.event.preventDefault()
              startDraggingBar(this, d)
            })
            .on('touchstart', function(d) {
              d3.event.preventDefault()
              startDraggingBar(this, d)
            })
        }
      })

    barGroup.select('rect')
      .attr('class', function() {
        if (self.interactive) {
          return 'bar-rect interactive';
        } else {
          return 'bar-rect';
        }
      })
      .style('fill', function(d) {
        return partiesColors[d.name].normal;
      })
      .attr('width', function(d) {
        return self.x(d.votes);
      })

    function startDraggingBar(bar, d) {
      var initialDragPos = d3.event.pageX;
      var initialWidth = parseFloat(bar.getAttribute('width'));
      var maxWidth = self.x(self.maxVotes);

      if (!self.interactive) {
        return;
      }

      $(document)
        .mousemove(onMove)
        .on('touchmove', onMove)
        .mouseup(onRelease)
        .on('touchend', onRelease)
      $('body, .bar-rect')
        .css('cursor', 'pointer')

      function onMove(e) {
        e.preventDefault(); // disable dragging
        var posX = e.pageX || e.originalEvent.changedTouches[0].pageX
        var offset = posX - initialDragPos;
        var newWidth = initialWidth + offset;
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
        }
        if (newWidth > 0) {
          bar.setAttribute('width', newWidth);
          d.votes = Math.floor(self.x.invert(newWidth))

          // Update everything
          barGroup
            .selectAll('.bar-text')
            .call(updateBarText)
          distribution = calcDistribution(maxSeats)
          seatsChart.update()
          seatsProportionChart.update()
        }
      }

      function onRelease(e) {
        $(document)
          .unbind('mousemove', onMove)
          .unbind('mouseup', onRelease)
          .unbind('touchmove', onMove)
          .unbind('touchend', onRelease)
        $('body, .bar-rect')
          .css('cursor', '')
      }
    }

    newBarGroup.append('text')
      .attr('class', 'bar-text')
      .attr('dy', '.35em')

    barGroup.select('text')
      .style('fill', function(d,i) {
        return partiesColors[d.name].textColor;
      })
      .attr('y', function(d) {
        return self.y(d.name) + self.y.rangeBand() / 2;
      })
      .call(updateBarText)

    function updateBarText(bar) {
      bar
        .attr('x', function(d,i) {
          return self.x(d.votes) + 5;
        })
        .text(function(d) {
          return ES.numberFormat(',')(d.votes);
        })
    }
  },

  appendAxes: function() {
    var self = this
    self.chart.append('g')
      .attr('class', 'x axis')
      .call(self.xAxis)

    self.chart.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)')
      .call(self.yAxis)
      .selectAll('.tick line, .domain')
        .style('display', 'none')
  }
})

function SeatsChart(extendFn) {
  Chart.call(this, function() {
    this.chartSelector = '.chart-seats'
    this.xMode = 'price'

    this.margin = {
      left: 70, right: 40,
      top: 20, bottom: 50
    }
    this.yAxisName = 'Número de escaños';
    this.yLabelMargin = 50;

    if (extendFn) {
      extendFn.call(this);
    }
  });

  this.initCanvas()
  this.initScales()
  this.initAxes()
  this.updateXMode()

  this.appendGridLines()
  this.appendDataRegion()
  this.appendAxes()
  this.update()
}
SeatsChart.prototype = Object.create(Chart.prototype)
_.assign(SeatsChart.prototype, {
  updateXMode: function(mode) {
    if (mode) {
      this.xMode = mode;
    }

    if (this.xMode == 'price') {
      var maxPrice = _.max(parties, 'votes').votes;
      var minPrice = distribution[distribution.length - 1].priceMin;

      this.x.domain([maxPrice, minPrice])
      this.xAxis.ticks(10)
    } else if (this.xMode == 'seats') {
      this.x.domain([1, maxSeats + 1])
      this.xAxis.ticks(maxSeats)
    } else {
      throw new Error('Invalid mode')
    }
  },

  initScales: function() {
    Chart.prototype.initScales.call(this)
    this.y.domain([0, maxSeats])
  },

  initAxes: function() {
    Chart.prototype.initAxes.call(this)
    this.xAxis
      .tickFormat(ES.numberFormat(','))

    var label = this.chart.append('text')
      .attr('class', 'y axis-label')
      .attr('x', -this.yLabelMargin)
      .attr('y', halfScale(this.y))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('transform', 'rotate(-90,' + (-this.yLabelMargin).toString()
            + ',' + halfScale(this.y).toString() + ')')
      .text(this.yAxisName)
  },

  setXMode: function(mode) {
    this.updateXMode(mode)
    this.update(true)
  },

  updateXAxis: function () {
    this.updateXMode()
    this.chart.select('.x.axis')
      .call(this.xAxis)

      if (this.xMode == 'seats') {
        // Labels between ticks
        var offset = (this.x(2) - this.x(1)) / 2
        this.chart.selectAll('.x.axis text')
          .attr('transform', 'translate('+offset+',0)')
        // Remove extra number
        this.chart.selectAll('.x.axis .tick:last-of-type text')
          .style('display', 'none')
      }
  },

  update: function(xModeChanged) {
    var self = this;

    this.updateXAxis()

    var xAxisLabelData = [
      this.xMode == 'price' ?
      'Precio de un escaño en votos' :
      'Número de escaños'
    ];

    var xAxisLabel = this.chart.selectAll('.x.axis-label')
      .data(xAxisLabelData);

    xAxisLabel.enter().append('text')
      .attr('class', 'x axis-label')
      .attr('y', this.height() + 40)
      .attr('x', halfScale(this.x))
      .style('text-anchor', 'middle')

    xAxisLabel
      .text(function(d) {
        return d;
      })

    // Select columns (piles of data for an allocation of seats)
    this.column = this.dataRegion
      .selectAll('g.column')
      .data(distribution, function(d,i) {
        return d.seats.toString();
      })

    // column: ENTER
    this.column.enter().append('g')
      .attr('class', 'column')
      .attr('data-seats', function(d,i) {
        return d.seats;
      })
      .each(function(d) {
        // console.log('entra %d', d.seats);
      })
      /*
      .style('opacity', 0)
      .transition('fado')
        .duration(800)
        .style('opacity', 1)
       */

    // column: ENTER + UPDATE
    // Select boxes (each of the rects showing how many seats got a party
    // on a particular allocation)
    this.box = this.column
      .selectAll('rect')
        .data(function(d) {
          return d.distribution; // parties and seats
        }, function(d) {
          return d.party; // party name
        })

    // box: ENTER
    this.box.enter().append('rect')
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(300)
          .style('fill', partiesColors[d.party].lighter)
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .transition()
          .duration(300)
          .style('fill', partiesColors[d.party].normal)
      })

    // box: EXIT
    this.box.exit().remove()

    // box: ENTER + UPDATE
    var boxTransitionSeatMode;
    if (this.xMode == 'seats') {
      boxTransitionSeatMode = this.box
        .transition()
        .duration(80)
    } else {
      boxTransitionSeatMode = this.box
    }
    boxTransitionSeatMode
      .attr('y', function(d) {
        return self.boxY.call(this, self, d);
      })
      .attr('height', function(d) {
        return self.boxHeight.call(this, self, d)
      })

    var boxTransitionScaleChange;
    if (xModeChanged) {
      boxTransitionScaleChange = this.box
        .transition()
        .duration(750)
    } else {
      boxTransitionScaleChange = this.box
    }
    boxTransitionScaleChange
      .style('fill', function(d,i) {
        return partiesColors[d.party].normal;
      })
      .attr('x', function() {
        var d = d3.select(this.parentNode).datum();
        if (self.xMode == 'price') {
          return self.x(d.priceMax);
        } else if (self.xMode == 'seats') {
          return self.x(d.seats);
        }
      })
      .attr('width', function() {
        var d = d3.select(this.parentNode).datum();
        if (self.xMode == 'price') {
          // Add 0.5 to eliminate seams
          return self.x(d.priceMin) - self.x(d.priceMax) + 0.5;
        } else if (self.xMode == 'seats') {
          return self.x(2) - self.x(1);
        }
      })

    // column: EXIT
    this.column.exit()
      .selectAll('rect')
      /*
      .each(function(d) {
        // console.log('sale %d', d.seats);
      })
      .transition('fade')
      .duration(800)
        .style('opacity', function(d,i) {
          return 0;
        }) */
      .remove()
  },

  boxY: function(self, d) {
    var parent = d3.select(this.parentNode).datum();
    var fillFactor = (maxSeats / parent.seats);

    return self.y(d.seatsAccumBase + d.seats);
  },

  boxHeight: function(self, d) {
    var parent = d3.select(this.parentNode).datum();
    return self.height() - self.y(d.seats);
  }

})

function SeatProportionChart() {
  SeatsChart.call(this, function() {
    this.chartSelector = '.chart-seats-proportion'
    this.yAxisName = 'Escaños'
    this.yLabelMargin = 70;
    this.canvasHeight = 150;
  })
}
SeatProportionChart.prototype = Object.create(SeatsChart.prototype)
_.assign(SeatProportionChart.prototype, {

  initScales: function() {
    SeatsChart.prototype.initScales.call(this)
    this.y
      .domain([0, 1])
  },

  initAxes: function() {
    SeatsChart.prototype.initAxes.call(this)
    this.yAxis
      .ticks(5)
      .tickFormat(ES.numberFormat('%'))
  },

  boxY: function(self, d) {
    var parent = d3.select(this.parentNode).datum();
    return self.y((d.seatsAccumBase + d.seats) / parent.seats);
  },

  boxHeight: function(self, d) {
    var parent = d3.select(this.parentNode).datum();
    return self.height() - self.y(d.seats / parent.seats);
  }

})

function toggleXMode() {
  if (seatsChart.xMode == 'seats') {
    seatsChart.setXMode('price')
    seatsProportionChart.setXMode('price')
  } else {
    seatsChart.setXMode('seats')
    seatsProportionChart.setXMode('seats')
  }
}

function halfScale(scale) {
  return (scale.range()[0] + scale.range()[1]) / 2;
}

function defineTip(name, chart, posFn) {
  var ret = {name: name, chart: chart, posFn: posFn};
  var widget = $('.tip-' + name);
  ret.width = widget.outerWidth();
  ret.height = widget.outerHeight();
  return ret;
}

var tips;
var tipIndex = 0;

function showTip(chart) {
  if (tipIndex >= tips.length) {
    return;
  }

  var tipInfo = tips[tipIndex];
  var widget = $('.tip-' + tipInfo.name);

  var width = tipInfo.width;
  var height = tipInfo.height;
  var tipHeight = 16;
  var anchor = widget.attr('data-anchor') || 'bottom';

  var chart = tipInfo.chart;
  if (chart instanceof Chart) {
    var mx = chart.margin.left;
    var my = chart.margin.top;
  } else {
    mx = my = 0;
  }

  var pos = tipInfo.posFn(chart);
  var x = pos[0] + mx;
  var y = pos[1] + my;

  var yEndAnim;
  if (anchor == 'bottom') {
    yEndAnim = y - height - tipHeight;
  } else if (anchor == 'top') {
    // If the root element is a button, place the tip below it
    var buttonHeight = 0;
    if ('outerHeight' in chart) {
      buttonHeight = chart.outerHeight();
    }
    yEndAnim = y + buttonHeight + tipHeight;
  }
  var yStartAnim = yEndAnim - 30;

  function nextTip() {
    unbind();
    // Hide this tip
    widget.fadeOut();

    // Show next tip
    tipIndex++;
    updateEnabledButtons()
    if (tipIndex < tips.length) {
      setTimeout(function() {
        showTip(chart);
      }, 600);
    }
  }

  function skipTips() {
    unbind();
    widget.fadeOut();
    tipIndex = tips.length;

    updateEnabledButtons()
  }

  widget
    .css({
      display: 'block',
      position: 'absolute',
      left: x - width / 2,
      top: yStartAnim,
      opacity: 0
    })
    .animate({
      opacity: 1,
      top: yEndAnim
    }, 600)
    .click(nextTip)

  var skipHandler;
  $('.skip-tutorial').click(skipHandler = function(e) {
    e.preventDefault();
    skipTips();
  })
  var nextTipHandler;
  $('.next-tip').click(nextTipHandler = function(e) {
    e.preventDefault();
    nextTip();
  }).focus()

  var keyHandler;
  $(document).keydown(keyHandler = function (e) {
    if (e.which == 27 /* esc */) {
      e.preventDefault();
      skipTips();
    }
  })

  function unbind() {
    widget.unbind('click', nextTip);
    $(document).unbind('keydown', keyHandler);
    $('.next-tip').unbind('click', nextTipHandler);
    $('.skip-tutorial').unbind('click', skipHandler);
  }
}

function waitTips(callback) {
  var correctWidth = 250;
  var tipsHaveCorrectWidth = true;

  $('.tip').each(function(i, tip) {
    if ($(tip).outerWidth() != correctWidth) {
      tipsHaveCorrectWidth = false;
    }
  });

  if (tipsHaveCorrectWidth) {
    callback();
  } else {
    setTimeout(function() {
      waitTips(callback);
    }, 10);
  }
}

function showTips() {
  // Let tips reflow
  waitTips(function() {
    tips = [
      defineTip('intro', seatsChart, function(c) {
       return [c.x(85000), c.y(1)];
      }),
      defineTip('reducing', seatsChart, function(c) {
        return [c.x(65000), c.y(2)];
      }),
      defineTip('repeat', seatsChart, function(c) {
        return [c.x(25800), c.y(7)];
      }),
      defineTip('unfair', seatsChart, function(c) {
        return [c.x(20000), c.y(8)];
      }),
      defineTip('proportion', seatsProportionChart, function(c) {
        return [c.x(55000), c.y(1)];
      }),
      defineTip('votes', votesChart, function(c) {
        return [c.x(70000), c.y('Partido A')];
      }),
      defineTip('seats-view', $('.toggle-x-mode'), function(c) {
        return [c.outerWidth() / 2, 0];
      }),

    ];
    updateEnabledButtons()
    showTip(seatsChart);
  });
}

function updateEnabledButtons() {
  var enableChangeVotes = false;
  var enableXMode = false;
  var enableTips = false;

  if (tipIndex >= 5) { /* votes */
    enableChangeVotes = true;
  }
  if (tipIndex >= 6) {
    enableXMode = true;
  }
  if (tipIndex >= tips.length) {
    enableTips = true;
  }

  $('.toggle-x-mode').toggleClass('disabled', !enableXMode);
  $('.show-tutorial').toggleClass('disabled', !enableTips);
  votesChart.updateInteractive(enableChangeVotes);
}

function restartDemo() {
  resetToDefaultVotes();
  distribution = calcDistribution(maxSeats)

  seatsChart.update()
  seatsProportionChart.update()
  votesChart.update()

  tipIndex = 0;
  showTip();
  updateEnabledButtons()
}

var votesChartFixed;
var votesChart;
var seatsChart;
var seatsProportionChart;

$(function() {
  $(window).on('hashchange', router);
  $('.page').pageHide();
  $('button.next').click(nextPage);
  $('.toggle-x-mode').click(function(e) {
    e.preventDefault();
    if (!$(this).hasClass('disabled')) {
      toggleXMode();
    }
  });
  $('.prev').click(function(e) {
    e.preventDefault();
    router.goBack();
  })
  $('.colorblind').click(function(e) {
    e.preventDefault()
    colorblindMode = !colorblindMode

    updatePartiesColors()
    votesChart.updateColors()
    votesChartFixed.updateColors()
    seatsChart.update()
    seatsProportionChart.update()
  })
  $('.show-tutorial').click(function(e) {
    e.preventDefault()
    restartDemo()
  })
  $('.show-about').click(function(e) {
    e.preventDefault()
    router.goTo('acerca')
  })
  $('.return-to-demo').click(function(e) {
    e.preventDefault()
    router.goTo('demo')
  })

  votesChartFixed = new VotesChart({ chartSelector: '.chart-votes-fixed', interactive: false });
  votesChart = new VotesChart({ interactive: true });
  seatsChart = new SeatsChart();
  seatsProportionChart = new SeatProportionChart();

  router();
});
