const companies = ['Kaiser Permanente', 'Aetna', 'Anthem', 'UnitedHealth Group'];
var main = d3.select("main");
var scrolly = main.select("#scrolly");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");

var scroller = scrollama();

function handleResize() {
    var stepH = Math.floor(window.innerHeight * 0.75);
    step.style("height", stepH + "px");
    
    var figureHeight = window.innerHeight / 1.4;
    var figureMarginTop = (window.innerHeight - figureHeight) / 2;
    figure
        .style("height", figureHeight + "px")
        .style("top", figureMarginTop + "px");

    scroller.resize();
}

function handleStepEnter(response) {
    updateChart(companies[response.index]);
}

function init() {
    handleResize();

    scroller
        .setup({
            step: "#scrolly article .step",
            offset: 0.33,
            debug: false
        })
        .onStepEnter(handleStepEnter);
}

init();

function updateChart(selectedCompany) {
    const selectedData = revClaimsData.find(d => d.Company === selectedCompany);

    const circleSize = 20; 
    const circleSpacing = 5; 
    const rowHeight = circleSize + 5; 
    const circlesPerRow = 3; 
    const deniedValue = +selectedData["Denied Claims"]; 
    const totalCircles = Math.ceil(deniedValue * 100);
    const totalRows = Math.ceil(totalCircles / circlesPerRow);
    const xStart = xScale("Denied Claims") + (xScale.bandwidth() - (circlesPerRow * (circleSize + circleSpacing))) / 2;

    bararea.select(".bar-revenue")
        .attr("x", xScale("Revenue (USD)"))
        .attr("width", xScale.bandwidth())
        .transition()
        .duration(500)
        .attr("y", yScaleRevenue(+selectedData["Revenue (USD)"]))
        .attr("height", barChartHeight - yScaleRevenue(+selectedData["Revenue (USD)"]));

    const existingCircles = bararea.selectAll(".circle-denied").size();

    if (existingCircles < totalCircles) {
        for (let i = existingCircles; i < totalCircles; i++) {
            const rowIndex = Math.floor(i / circlesPerRow);
            const columnIndex = i % circlesPerRow;

            const finalYPosition = barChartHeight - rowHeight * (rowIndex + 1); 

            bararea.append("image")
                .attr("class", "circle-denied")
                .attr("xlink:href", "images/denied.svg")
                .attr("x", xStart + columnIndex * (circleSize + circleSpacing))
                .attr("y", 0) 
                .attr("width", circleSize)
                .attr("height", circleSize)
                .attr("opacity", 0) 
                .transition()
                .duration(500)
                .delay((i - existingCircles) * 50) 
                .attr("y", finalYPosition) 
                .attr("opacity", 1); 
        }
    }

    if (existingCircles > totalCircles) {
        bararea.selectAll(".circle-denied")
            .filter((_, i) => i >= totalCircles) 
            .transition()
            .duration(500)
            .attr("opacity", 0) 
            .remove(); 
    }

    d3.select(".label-revenue")
        .transition()
        .duration(500)
        .attr("y", yScaleRevenue(+selectedData["Revenue (USD)"]) - 10)
        .attr("x", 238)
        .text(`$${(+selectedData["Revenue (USD)"] / 1e9).toFixed(1)}B`) 
        .style("fill", "white")
        .style("font-size", "1.2rem");

    d3.select(".label-denied-claims")
        .transition()
        .duration(500)
        .attr("y", barChartHeight - rowHeight * totalRows - 10) 
        .text(`${Math.round(deniedValue * 100)}%`) 
        .style("fill", "white")
        .style("font-size", "1.2rem");
}

let revClaimsData, bararea, xScale, yScaleRevenue, yScaleDeniedClaims, barChartHeight;

const requestBarData = async function() {
    revClaimsData = await d3.csv('data/insurance_claims_revenue.csv');
        
    const barmargin = {top:20, right:20, bottom:285, left:20};
    const barChartWidth = 960 - margin.left - margin.right;
    barChartHeight = 500 - margin.top - margin.bottom;

    const barsvg = d3.select('.graph[data-graph-type="bar"] svg')
        .attr('viewBox', `0 0 ${width + barmargin.left + barmargin.right} ${height + barmargin.top + barmargin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width + barmargin.left + barmargin.right} ${height + barmargin.top + barmargin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    bararea = barsvg.append("g")
                    .attr("transform", "translate("+barmargin.left+","+barmargin.top+")");

    xScale = d3.scaleBand()
        .domain(["Revenue (USD)", "Denied Claims"])
        .range([0, barChartWidth])
        .padding(0.7);

    yScaleRevenue = d3.scaleLinear()
        .domain([0, 400000000000])
        .range([barChartHeight, 0]);

    yScaleDeniedClaims = d3.scaleLinear()
        .domain([0, .5])
        .range([barChartHeight, 0]);

    bararea.append("g").attr("class", "y-axis-revenue")
            .attr("transform", `translate(100, -5)`);
    bararea.append("g").attr("class", "y-axis-denied-claims")
            .attr("transform", `translate(${barChartWidth-90}, -5)`);

    bararea.append("rect").attr("class", "bar-revenue").attr("fill", "crimson");
    bararea.append("rect").attr("class", "bar-revenue").attr("fill", "crimson");

    bararea.append("text")
        .attr("class", "label-revenue")
        .attr("x", xScale("Revenue (USD)") + xScale.bandwidth() / 2)
        .attr("y", yScaleRevenue(300000000000) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("$300B"); 

    bararea.append("text")
        .attr("class", "label-denied-claims")
        .attr("x", xScale("Denied Claims") + xScale.bandwidth() / 2)
        .attr("y", yScaleDeniedClaims(0.5) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("50%");

    barsvg.append("image")
        .attr("xlink:href", "images/scale-ba.svg") 
        .attr("x", barChartWidth / 4) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 2 -70))
        .attr("height", 100)
        .attr("transform", `translate(55, -3)`);

    barsvg.append("image")
        .attr("xlink:href", "images/scale_stick_3.svg") 
        .attr("x", barChartWidth / 4) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 2))
        .attr("height", 310)
        .attr("transform", `translate(20, -35)`);

    barsvg.append("image")
        .attr("xlink:href", "images/scale_plate1_5.svg") 
        .attr("x", barChartWidth / 4) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 6))
        .attr("height", 220)
        .attr("transform", `translate(7, -75)`);

    barsvg.append("image")
        .attr("xlink:href", "images/scale_plate2_4.svg") 
        .attr("x", barChartWidth / 4) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 6))
        .attr("height", 220)
        .attr("transform", `translate(290, -75)`);

    barsvg.append("image")
        .attr("x", barChartWidth / 10) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 1.75))
        .attr("transform", `translate(-240, 35)`)
        .style('overflow', 'default');

    barsvg.append("image")
        .attr("x", barChartWidth / 10) 
        .attr("y", barChartHeight + barmargin.top + 10) 
        .attr("width", (barChartWidth / 1.75))
        .attr("transform", `translate(545, -510)`)
        .style('overflow', 'visible');

    updateChart(revClaimsData[8].Company);

    d3.select("#companyDropdown").on("change", function () {
        const selectedCompany = d3.select(this).property("value");
        updateChart(selectedCompany);
    });
}

requestBarData();