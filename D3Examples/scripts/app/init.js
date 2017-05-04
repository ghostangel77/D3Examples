choroplethMap.draw();

$("#slider").on("slidechange", function (event, ui) {
    let values = $("#slider").slider("values");
    let options = { min: values[0], max: values[1] };
    choroplethMap.draw(options);
});