document.addEventListener('DOMContentLoaded', function() {
    const svg = d3.select("svg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const projection = d3.geoMercator();
    const path = d3.geoPath().projection(projection);

    d3.json("data/wahlspr.json").then(data => {
        const features = data.features.filter(feature => feature.properties.WSP === "513");

        // Calculate bounds
        const bounds = path.bounds({ type: "FeatureCollection", features: features });
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = 0.9 / Math.max(dx / width, dy / height);
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        console.log("Bounds:", bounds);
        console.log("Scale:", scale);
        console.log("Translate:", translate);

        projection.scale(scale * 1000).translate(translate);

        svg.selectAll("path")
            .data(features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "feature");
    });
});
