$(window).load(function() {
    init();
});

function init() {
    showGraph();
};

var svg;
var line;
var path;
var currentSymbol
var today = new Date();
var oneMonthAgo = today.getMonth() == 1 ?
    new Date(today.getFullYear() - 1, 11, today.getDate()) :
    new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
var sixMonthsAgo = today.getMonth() > 4 ?
    new Date(today.getFullYear(), (today.getMonth() + 1) - 6, today.getDate()) :
    new Date(today.getFullYear() - 1, (11 - (4 - today.getMonth())), today.getDate());
var oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var x = d3.time.scale()
    .domain([oneYearAgo, today])
    .range([0, width]);

var y = d3.scale
    .linear()
    .domain([0, 200])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-width);

function showGraph() {
    svg = d3.select("#graph").append("svg")
        .attr("class", "center-block")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

}

function getStockBySymbol(evt) {
    var parseDate = d3.time.format("%Y-%m-%d").parse;
    currentSymbol = evt.target.attributes.symbol.value;

    getStockInfo({stock: currentSymbol, startDate: formatDate(oneYearAgo), endDate: formatDate(today)}, 'historicaldata', function(err, data) {
        var quotes = data.quote;
        quotes.reverse();
        quotes.forEach(function(d) {
            d.Date = parseDate(d.Date);
            d.Close =+ d.Close;
        });
        redrawGraphLine(quotes);
    });
}

function updateTimeSpan(evt) {
    var timeSpan = evt.target.attributes.timeSpan.value;

    if(timeSpan == "1-month") {
        x.domain([oneMonthAgo, today])
    } else if (timeSpan == "6-months") {
        x.domain([sixMonthsAgo, today])
    } else if (timeSpan == "1-year") {
        x.domain([oneYearAgo, today])
    }

    var svgTrans = d3.select("body").transition();
    svgTrans.select(".x.axis").duration(750).call(xAxis);

    var p = svg.select("path.line");
    p.attr("d", line);
    var totalLength = p.node().getTotalLength();
    p.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .attr("stroke-dashoffset", 0);
}

function redrawGraphLine(quotes) {
    $('path').remove();
    line = d3.svg.line()
        .x(function(d) {return x(d.Date)})
        .y(function(d) {return y(d.Close)})
        .interpolate("linear");

    y.domain(d3.extent(quotes, function(d) { return d.Close;}))
    var svgTrans = d3.select("body").transition();
    svgTrans.select(".y.axis").duration(750).call(yAxis);

    path = svg.append('path')
        .datum(quotes)
        .attr('class', 'line')
        .attr('d', line)
        .attr("clip-path", "url(#clip)");

    var totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .attr("stroke-dashoffset", 0);
}

function formatDate(date) {
    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    ].join('-');
}

function getStockInfo(opts, type, complete) {
    var defs = {
        desc: false,
        baseURL: 'http://query.yahooapis.com/v1/public/yql?q=',
        query: {
            quotes: 'select * from yahoo.finance.quotes where symbol = "{stock}" | sort(field="{sortBy}", descending="{desc}")',
            historicaldata: 'select * from yahoo.finance.historicaldata where symbol = "{stock}" and startDate = "{startDate}" and endDate = "{endDate}"'
        },
        suffixURL: {
            quotes: '&env=store://datatables.org/alltableswithkeys&format=json&callback=?',
            historicaldata: '&env=store://datatables.org/alltableswithkeys&format=json&callback=?'
        }
    };

    opts = opts || {};

    if (!opts.stock) {
        complete('No stock defined');
        return;
    }

    var query = defs.query[type]
        .replace('{stock}', opts.stock)
        .replace('{sortBy}', defs.sortBy)
        .replace('{desc}', defs.desc)
        .replace('{startDate}', opts.startDate)
        .replace('{endDate}', opts.endDate)

    var url = defs.baseURL + query + (defs.suffixURL[type] || '');
    $.getJSON(url, function(data) {
        var err = null;
        if (!data || !data.query) {
            err = true;
        }
        complete(err, !err && data.query.results);
    });
}
