﻿var svg = d3.select("svg");
var path = d3.geoPath();
var unemployment = d3.map();

var width = +svg.attr("width");
var height = +svg.attr("height");

var additionalInfo = {};
var min = 0;
var max = 0;

var legendText;

d3.queue()
    .defer(d3.json, "../scripts/lib/us-10m.v1.json")
    .defer(d3.csv, "../data/Total TAT-ReportLevel.csv", function (d) {
        let keys = Object.keys(d);
        legendText = keys[3];
        let resultProp = keys[3];
        let idProp = keys[0];
        let countyStateProp = keys[2];

        let result = +(d[resultProp].replace(/\,/g, '')) || 0;
        let id = zeroFill(d[idProp], 5);

        unemployment.set(id, Math.floor(result));

        additionalInfo[+id] = { result: d[resultProp], county: d[countyStateProp] };
        min = min < result ? min : Math.floor(result)
        max = 20000;//max > result ? max : Math.ceil(result);
    })
    .await(start);

function zeroFill(number, width) {
    width -= number.toString().length;
    if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
    }
    return number.toString();
}

function start(error, us) {
    if (error) throw error;

    var range = { min: min, max: max };
    var scheme = d3.schemeBlues[9];

    //var summaryBarData = {
    //    range: {
    //        min: range.min,
    //        max: range.max
    //    },
    //    position: {
    //        xStart: width - 300,
    //        xEnd: width - 100,
    //        y: 40,
    //    },
    //    legend: {
    //        text: legendText,
    //        x: width - 200,
    //        y: -6
    //    },
    //    tick: {
    //        size: 13,//height+3
    //        format: function (x, i) { return i ? x : x + "%"; }
    //    },
    //    height: 10
    //};

    //var x = d3.scaleLinear()
    //    .domain([summaryBarData.range.min, summaryBarData.range.max]) //Summary bar -> split schema
    //    .rangeRound([summaryBarData.position.xStart, summaryBarData.position.xEnd]);  //Summary bar -> position x

    var color = d3.scaleQuantile()//scaleQuantile()//.scaleThreshold()
        .domain(d3.range(range.min, range.max))//min and max value
        .range(scheme);

    //var summaryBar = svg.append("g")
    //    .attr("class", "key")
    //    .attr("transform", ("translate(0," + summaryBarData.position.y + ")"));//Summary bar -> position (top->40)

    //summaryBar.selectAll("rect")
    //    .data(color.range().map(function (d) {
    //        d = color.invertExtent(d);
    //        if (d[0] == null) d[0] = x.domain()[0];
    //        if (d[1] == null) d[1] = x.domain()[1];
    //        return d;
    //    }))
    //    .enter().append("rect")
    //    .attr("height", summaryBarData.height)
    //    .attr("x", function (d) { return x(d[0]); })
    //    .attr("width", function (d) { return x(d[1]) - x(d[0]); })
    //    .attr("fill", function (d) { return color(d[0]); });

    //summaryBar.append("text")
    //    .attr("class", "caption")
    //    .attr("x", summaryBarData.legend.x)
    //    .attr("y", summaryBarData.legend.y)
    //    .attr("fill", "#000")
    //    .attr("text-anchor", "start")
    //    .attr("font-weight", "bold")
    //    .text(summaryBarData.legend.text);

    //summaryBar.call(d3.axisBottom(x)
    //    .tickSize(summaryBarData.tick.size)
    //    .tickFormat(summaryBarData.tick.format)
    //    .tickValues(color.domain()))
    //    .select(".domain")
    //    .remove();

    ready(color, error, us);
}


function ready(color, error, us) {
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
            var info = additionalInfo[+d.id];
            return "County: " + (info ? info.county : '') + "\r\n" +
                "Result: " + d.rate;// (info ? info.result : d.rate);
        });

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
        .attr("class", "states")
        //.style("stroke", "#f00")
        .attr("d", path);
}
//});