$(window).load(function() {
    init();
});

function init() {
    showVanguardStock();
}


function showVanguardStock() {
    var margin = {top: 20, right: 20, bottom:30, left: 50}
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d").parse;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line()
        .x(function(d) {return x(d.Date);})
        .y(function(d) {return y(d.Close);});

    var svg = d3.select('body').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    getStock({stock: 'VTI', startDate: '2014-01-01', endDate: '2014-10-7'}, 'historicaldata', function(err, data) {
        var quotes = data.quote;
        quotes.forEach(function(d) {
            d.Date = parseDate(d.Date);
            d.Close =+ d.Close;
        });

        x.domain(d3.extent(quotes, function(d) { return d.Date;}));
        y.domain(d3.extent(quotes, function(d) { return d.Close;}))

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Price ($)");

        svg.append("path")
            .datum(quotes)
            .attr("class", "line")
            .attr("d", line);
    });
};

function getStock(opts, type, complete) {
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
};
