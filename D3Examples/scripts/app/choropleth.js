let choroplethMap = (function () {
    let drawSlider = true;
    let additionalInfo = { keys: [], values: [] };
    let min = 0;
    let max = 0;
    let svg = d3.select("svg");
    let path = d3.geoPath();
    let report = d3.map();
    let width = +svg.attr("width");
    let height = +svg.attr("height");
    let legendText;

    function draw() {
        $.when(
            $.getJSON("../data/reports.json")
        ).then(function (info) {
            //TODO: Validate d.results.keys.length >= 2
            let keys = info.results.keys;
            let idFieldName = keys[0];
            let valueFieldName = keys[1];
            legendText = valueFieldName;

            additionalInfo.keys.push(idFieldName);
            additionalInfo.keys.push(valueFieldName);
            if (keys.length > 2) {
                for (let i = 2; i < keys.length; i++) {
                    additionalInfo.keys.push(keys[i]);
                }
            }

            let data = info.results.data;
            data.forEach(function (element) {
                if (!element[0])
                    return;

                let id = zeroFill(element[0], 5);
                let value = element[1];
                let numericValue = (typeof value === 'string' || value instanceof String) ? +(value.replace(/\,/g, '')) : value;

                report.set(id, Math.floor(numericValue));

                let currentItem = [id, value]
                if (keys.length > 2) {
                    for (let i = 2; i < keys.length; i++) {
                        currentItem.push(element[i]);
                    }
                }
                additionalInfo.values.push(currentItem);

                min = min < value ? min : Math.floor(value);
                max = max > value ? max : Math.ceil(value);
            });
            d3.queue()
                .defer(d3.json, "../scripts/lib/us-10m.v1.json")
                .await(start);
        });
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
            .attr("fill", function (d3Data) { return color(d3Data.rate = report.get(d3Data.id)); })
            //.attr("stroke", "#f00")
            .attr("d", path)
            .append("title")
            .text(function (d3Data) {
                let keys = additionalInfo.keys;
                var info = _.find(additionalInfo.values, function (arr) { return arr[0] === d3Data.id; });
                if (!info)
                    return '';

                let tooltipText = '';
                for (let i = 1; i < info.length; i++) {
                    tooltipText += keys[i] + ': ' + (info[i] || '');
                    if (i < info.length - 1)
                        tooltipText += "\r\n";
                }
                return tooltipText;
            });

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "states")
            //.style("stroke", "#f00")
            .attr("d", path);
    }

    return { draw }
})();