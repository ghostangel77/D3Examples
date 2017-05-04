let summaryBar = (function () {
    function draw(data, color, svg) {
        let x = d3.scaleLinear()
            .domain([data.range.min, data.range.max]) //Summary bar -> split schema
            .rangeRound([data.position.xStart, data.position.xEnd]);  //Summary bar -> position x

        let bar = svg.append("g")
            .attr("class", "key")
            .attr("transform", ("translate(0," + data.position.y + ")"));//Summary bar -> position (top->40)

        bar.selectAll("rect")
            .data(color.range().map(function (d) {
                d = color.invertExtent(d);
                if (d[0] == null) d[0] = x.domain()[0];
                if (d[1] == null) d[1] = x.domain()[1];
                return d;
            }))
            .enter().append("rect")
            .attr("height", data.height)
            .attr("x", function (d) { return x(d[0]); })
            .attr("width", function (d) { return x(d[1]) - x(d[0]); })
            .attr("fill", function (d) { return color(d[0]); });

        bar.append("text")
            .attr("class", "caption")
            .attr("x", data.position.xStart)
            .attr("y", -6)
            //.attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.legend);

        bar.append("text")
            .attr("x", data.position.xEnd)
            .attr("y", 24)
            //.attr("fill", "#000")
            .attr("text-anchor", "end")
            .text(data.range.max.toString());

        bar.append("text")
            .attr("x", data.position.xStart)
            .attr("y", 24)
            //.attr("fill", "#000")
            .attr("text-anchor", "start")
            .text(data.range.min.toString());

        //bar.call(d3.axisBottom(x)
        //    .tickSize(data.tick.size)
        //    .tickFormat(data.tick.format)
        //    .tickValues(color.domain()))
        //    .select(".domain")
        //    .remove();
    }

    return {
        draw
    }
})();