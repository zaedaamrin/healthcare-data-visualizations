const countryColorMap = {
    "US": "#FF0000",  // Red color for USA 
    "UK": "#8a5d43",   // Brown for UK
    "GER": "#f09200",  // Orange for Germany
    "FRA": "#00b945",  // Green for France
    "JPN": "#ed8cc0",  // Light Pink for Japan
    "KOR": "#5b2c83",  // Purple for Korea
    "NZ": "#59d5f7",   // Light Blue for New Zealand
    "SWE": "#e535ab",  // Pink for Sweden
    "CAN": "#0f2080",  // Dark Blue for Canada
    "AUS": "#f5e042"   // Yellow for Australia
    };

    const gdpsvg = d3.select("#svggdp")
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("color", "white");


const tooltipGDP = d3.select("#tooltipGDP");

d3.csv("data/merged_data.csv").then(function(data) {
    data = data.filter(d => +d.GDP > 0).map(d => {
        return {
            Country: d.Country,
            Year: +d.Year,
            GDP: +d.GDP 
        };
    });

    const sumstat = d3.group(data, d => d.Country);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);
    gdpsvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text") 
        .style("font-size", "18px")
        .style("fill", "white");

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.GDP)])  
        .range([height, 0]);
    gdpsvg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text") 
        .style("font-size", "18px")
        .style("fill", "white");

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Country))
        .range(d3.schemeTableau10);

        const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.GDP))
        .defined(d => d.GDP > 0);

    gdpsvg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", d => countryColorMap[d[0]])
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
        .attr("d", d => line(d[1]));

    gdpsvg.append("g")
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.GDP))
        .attr("r", 5)
        .style("fill", function(d) { return countryColorMap[d.Country]; }) 
        .on('mouseover', function(event, d) {
            tooltipGDP.style('display', 'block')
                .html(`${d.Year}<br>${d.Country}<br>${d.GDP}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function() {
            tooltipGDP.style('display', 'none');
        });

}).catch(function(error) {
    console.log(error);
});


const avoidsvg = d3.select("#svgavoid")
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("color", "white");

const tooltipDeaths = d3.select("#tooltipDeaths");

d3.csv("data/merged_data.csv").then(function(data) {

    data = data.filter(d => +d["Avoidable Deaths per 100k"] > 0).map(d => {
        return {
            Country: d.Country,
            Year: +d.Year,
            "Avoidable Deaths per 100k": +d["Avoidable Deaths per 100k"]
        };
    });

    const sumstat = d3.group(data, d => d.Country);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([ 0, width ]);
    avoidsvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll("text") 
        .style("font-size", "18px");;

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Avoidable Deaths per 100k"])])
        .range([ height, 0]);
    avoidsvg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text") 
        .style("font-size", "18px");

    const color = d3.scaleOrdinal()
        .domain(["AUS", "CAN", "FRA", "GER", "JPN", "KOR", "NET", "NOR", "NZ", "SWE", "SWI", "UK", "US"])
        .range(d3.schemeTableau10);

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d["Avoidable Deaths per 100k"]))
        .defined(d => d["Avoidable Deaths per 100k"] > 0); 

    avoidsvg.selectAll(".line")
        .data(sumstat)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", d => countryColorMap[d[0]])
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
        .attr("d", d => line(d[1]));

    avoidsvg.append("g")
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d["Avoidable Deaths per 100k"]))
        .attr("r", 5)
        .style("fill", d => countryColorMap[d.Country])
        .on('mouseover', function(event, d) {
            tooltipDeaths.style('display', 'block')
                .html(`${d.Year}<br>${d.Country}<br>${d["Avoidable Deaths per 100k"]}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function() {
            tooltipDeaths.style('display', 'none');
        });

}).catch(function(error) {
    console.log(error);
});