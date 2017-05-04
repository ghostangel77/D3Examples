let choroplethMap = (function () {
    let drawSlider = true;
    let additionalInfo = {};
    let min = 0;
    let max = 0;
    let svg = d3.select("svg");
    let path = d3.geoPath();
    let unemployment = d3.map();
    let width = +svg.attr("width");
    let height = +svg.attr("height");
    let legendText;

    function draw() {
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
                min = min < result ? min : Math.floor(result);
                max = max > result ? max : Math.ceil(result);
            })
            .await(start);
    }

    function start(error, us) {
        if (error) throw error;

        var range = { min: min, max: max };
        var scheme = d3.schemeBlues[9];

        var color = d3.scaleQuantile()//scaleQuantile()//.scaleThreshold()
            .domain(d3.range(range.min, range.max))//min and max value
            .range(scheme);

        var summaryBarData = {
            range: {
                min: range.min,
                max: range.max
            },
            position: {
                xStart: width - 300,
                xEnd: width - 100,
                y: 40,
            },
            legend: legendText,
            tick: {
                size: 13,//height+3
                format: function (x, i) {
                    return '';//i ? x : x + "%";
                }
            },
            height: 10
        };

        fillMap(color, us);
        summaryBar.draw(summaryBarData, color, svg);
        addSlider(error, us, range);
    }

    function addSlider(error, us, range) {
        if (drawSlider) {
            $("#slider").slider({ range: true, min: range.min, max: range.max, values: [range.min, range.max] });
            $("#slider").on("slidechange", function () {
                let values = $("#slider").slider("values");
                min = values[0];
                max = values[1];
                start(error, us);
            });
        }

        drawSlider = false;
    }

    function fillMap(color, us) {
        var notFound = [];
        $('g.key').remove();
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

    return { draw }
})();