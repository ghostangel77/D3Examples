var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var unemployment = d3.map();

var path = d3.geoPath();
var range = { min: 0, max: 10 };
var scheme = d3.schemeBlues[9];

var summaryBarData = {
    range: {
        min: range.min,
        max: range.max
    },
    position: {
        xStart: width - 200,
        xEnd: width - 100,
        y: 40,
    },
    legend: {
        text: 'Unemployment rate',
        x: width - 200,
        y: -6
    },
    tick: {
        size: 13,//height+3
        format: function (x, i) { return i ? x : x + "%"; }
    },
    height: 10
};

var x = d3.scaleLinear()
    .domain([summaryBarData.range.min, summaryBarData.range.max]) //Summary bar -> split schema
    .rangeRound([summaryBarData.position.xStart, summaryBarData.position.xEnd]);  //Summary bar -> position x

var color = d3.scaleQuantile()
    .domain(d3.range(range.min, range.max))//min and max value
    .range(scheme);

var summaryBar = svg.append("g")
    .attr("class", "key")
    .attr("transform", ("translate(0," + summaryBarData.position.y + ")"));//Summary bar -> position (top->40)

summaryBar.selectAll("rect")
    .data(color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter().append("rect")
    .attr("height", summaryBarData.height)
    .attr("x", function (d) { return x(d[0]); })
    .attr("width", function (d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function (d) { return color(d[0]); });

summaryBar.append("text")
    .attr("class", "caption")
    .attr("x", summaryBarData.legend.x)
    .attr("y", summaryBarData.legend.y)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text(summaryBarData.legend.text);

summaryBar.call(d3.axisBottom(x)
    .tickSize(summaryBarData.tick.size)
    .tickFormat(summaryBarData.tick.format)
    .tickValues(color.domain()))
    .select(".domain")
    .remove();


$.when(
    //$.getJSON("../scripts/lib/us-10m.v1.json"),
    $.getJSON("../data/counties.json")
).then(function (/*geometryResponse,*/ countiesResponse) {
    var counties = countiesResponse;
    //var geometry = geometryResponse[0];
    //var countyArray = geometry.objects.counties.geometries;
    //$.each(countyArray, function (i, e) {
    //    var county = _.find(counties, function (c) {
    //        return c.id == e.id;
    //    });
    //    e.data = county;
    //    if (county)
    //        counties.pop(county);
    //});

    d3.queue()
        .defer(d3.json, "../scripts/lib/us-10m.v1.json")
        .defer(d3.tsv, "../data/unemployment.tsv", function (d) {
            //console.info(d.id + ":" + d.rate);
            unemployment.set(d.id, +d.rate);
        })
        .await(ready);

    //var legend = d3.select('#legend')
    //    .append('ul')
    //    .attr('class', 'list-inline');

    //var keys = legend.selectAll('li.key');
    //    //.data(colors.range());

    //keys.enter().append('li')
    //    .attr('class', 'key')
    //    .style('border-top-color', String)
    //    .text(function (d) {
    //        var r = colors.invertExtent(d);
    //        return formats.percent(r[0]);
    //    });

    //d3.select(window).on('resize', resize);

    //function resize() {
    //    // adjust things when the window size changes
    //   var width = parseInt(d3.select('#map').style('width'));
    //    width = width - margin.left - margin.right;
    //  var  height = width * mapRatio;

    //    // update projection
    //    projection
    //        .translate([width / 2, height / 2])
    //        .scale(width);

    //    // resize the map container
    //    map
    //        .style('width', width + 'px')
    //        .style('height', height + 'px');

    //    // resize the map
    //    map.select('.land').attr('d', path);
    //    map.selectAll('.state').attr('d', path);
    //}

    function ready(error, us) {
        if (error) throw error;

        var notFound = [];

        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties).features)
            .enter()
            .append("path")
            .attr("fill", function (d) { return color(d.rate = unemployment.get(d.id)); })
            //.attr("stroke", "#f00")
            .attr("d", path)
            .append("title")
            .text(function (d) {
                var county = _.find(counties, function (c) {
                    return c.id == d.id;
                });

                //if (county)
                //    counties.pop(county);
                //else
                //    notFound.push(d.id);

                //return "ID: " + d.id + "\r\n" +
                return "State: " + (county ? county.state : '') + "\r\n" +
                    "County: " + (county ? county.countyName : '') + "\r\n" +
                    "Rate: " + d.rate + "%";
            });

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "states")
            //.style("stroke", "#f00")
            .attr("d", path);
    }
});