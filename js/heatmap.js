const heatwidth = 900;
const heatheight = 400;
const heatmargin = {top:20, right:20, bottom:20, left:20};
const mapWidth = heatwidth - heatmargin.left - heatmargin.right;
const mapHeight = heatheight - heatmargin.top - heatmargin.bottom;

const heatsvg = d3.selectAll('div#heatmapdiv').append('svg')
        .attr('viewBox', `0 0 ${heatwidth + heatmargin.left + heatmargin.right} ${heatheight + heatmargin.top + heatmargin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append("g")
        .attr("transform", `translate(${heatmargin.left},${heatmargin.top})`);
        
const map = heatsvg.append("g")
                    .attr("transform", "translate("+heatmargin.left+","+heatmargin.top+")");

const requestHeatData = async function() {
    const us = await d3.json("../us-smaller.json");
    var states = topojson.feature(us, us.objects.states);
    var statesMesh = topojson.mesh(us, us.objects.states);
    var projection = d3.geoAlbersUsa().fitSize([mapWidth, mapHeight], states);
    var path = d3.geoPath().projection(projection);

    let graticule = d3.geoGraticule10();
    
    map.append("path").attr("class", "graticule").attr("d", path(graticule));

    let statePaths = map.selectAll("path.state").data(states.features)
                        .join("path")
                        .attr("class", "state")
                        .attr("note", d => d.id)
                        .attr("d", path)
                        .on("mouseover", mouseEntersState)
                        .on("mouseout", mouseLeavesState);

    map.append("path").datum(statesMesh)
        .attr("class", "outline")
        .attr("d", path);

    const oldDebtData = await d3.csv("data/med_debt_landscape_state.csv", d3.autoType);
    const nationalData = await d3.csv("data/changing_med_debt_landscape_national.csv", d3.autoType);
    let debtData = [];
    oldDebtData.forEach( d => {
        if (d.year != 2023) {
            debtData.push(d);
        }
    });

    const minMax = d3.extent(debtData, d => d.median_medical_debt);
    const colorScale = d3.scaleQuantize().domain(minMax).range(d3.schemeReds[9]);

    function updateHeatMap(yearKey) {
        let yearDebt = []
        debtData.forEach( d=> {
            if (d.year == yearKey) {
                yearDebt.push(d);
            }
        });

        var yearDict = {};
        yearDebt.forEach( d => {
            yearDict[d.state_fips] = d;
        });

        statePaths.each(function(d) {
            id = d.id;
            if (yearDict[id]) {
                d.properties.median_medical_debt = yearDict[id].median_medical_debt;
                d.properties.state_abbreviation = yearDict[id].state_abbreviation;
            }
        });
        
        map.selectAll(".state")
            .transition()
            .duration(350)
            .ease(d3.easeLinear)
            .style("fill", d => colorScale(d.properties.median_medical_debt));
    }

    updateHeatMap(2011);
    
    drawLegend("#colorLegend", colorScale);

    let tooltipWidth = 70;
    let tooltipHeight = 40;

    let momesh = map.append("path")
                    .attr("class", "mouseover outline")
                    .style("stroke", "black")
                    .style("stroke-width", 3)
                    .attr("d", "");
    
    let tooltip = map.append("g")
                        .attr("class", "tooltip")
                        .attr("visibility", "hidden");

    tooltip.append("rect")
            .attr("fill", "white")
            .attr("opacity", 1)
            .attr("x", -tooltipWidth / 2.0)
            .attr("y", 0)
            .attr("width", tooltipWidth)
            .attr("height", tooltipHeight)
            .style("border", "1px solid #000")
            .style("border-radius", "5px")
            .style("padding", "10px");
    
    let txt = tooltip.append("text")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("alignment-baseline", "hanging")
                        .attr("x", 0)
                        .attr("y", 8);

    let txt2 = tooltip.append("text")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("alignment-baseline", "hanging")
                        .attr("x", 0)
                        .attr("y", 22);
    
    function mouseEntersState(event, d) {
        tooltip.style("visibility", "visible");

        let state = d3.select(this);
        let updatedText = "$" + d.properties.median_medical_debt;
        txt.text(d.properties.state_abbreviation);
        txt2.text(updatedText);

        let bounds = path.bounds(state.datum());
        let xPos = (bounds[0][0]+bounds[1][0])/2.0;
        let yPos = bounds[1][1]-10;
        tooltip.attr("transform", `translate(${xPos},${yPos})`);
    }

    function mouseLeavesState(event, d) {
        tooltip.style("visibility", "hidden");
        momesh.attr("d", "");
    }

    function drawLegend(legendSelector, legendColorScale) {
        const offsets = { width: 20, 
                            top: 2,
                            bottom: 40
        };
        const stepSize = 4;
        const minMaxExtendPercent = 0;

        const legend = d3.select(legendSelector);
        const legendHeight = legend.attr("height");
        const legendBarWidth = legend.attr("width") - (offsets.width * 2);
        const legendMinMax = d3.extent(legendColorScale.domain()); 

        const minMaxExtension = (legendMinMax[1] - legendMinMax[0]) * minMaxExtendPercent;
        const barHeight = legendHeight - offsets.top - offsets.bottom;

        let barScale = d3.scaleLinear().domain([legendMinMax[0]-minMaxExtension, legendMinMax[1]+minMaxExtension])
                                        .range([0,legendBarWidth]);
        let barAxis = d3.axisBottom(barScale);

        let bar = legend.append("g")
                        .attr("class", "legend colorbar")
                        .attr("transform", `translate(${offsets.width},${offsets.top})`);
        
        if (legendColorScale.hasOwnProperty('thresholds') || legendColorScale.hasOwnProperty('quantiles')) {
            let thresholds = [];
            if (legendColorScale.hasOwnProperty('thresholds')) { 
                thresholds = legendColorScale.thresholds();
            }
            else { 
                thresholds = legendColorScale.quantiles();
            }

            const barThresholds = [legendMinMax[0], ...thresholds, legendMinMax[1]];

            barAxis.tickValues(barThresholds);
            
            for (let i=0; i<barThresholds.length-1; i++) {
                let dataStart = barThresholds[i];
                let dataEnd = barThresholds[i+1];
                let pixelStart = barAxis.scale()(dataStart);
                let pixelEnd = barAxis.scale()(dataEnd);
                
                bar.append("rect")
                    .attr("x", pixelStart)
                    .attr("y", 0)
                    .attr("width", pixelEnd - pixelStart )
                    .attr("height", barHeight)
                    .style("fill", legendColorScale( (dataStart + dataEnd) / 2.0 ) ); 
            }
        }
        
        legend.append("g")
                .attr("class", "legend axis")
                .attr("transform",`translate(${offsets.width},${offsets.top+barHeight+5})`)
                .style("color", "orange")
                .call(barAxis);
    }

    const slider = document.getElementById('slider');
    const output = document.getElementById('output');
    const ticksContainer = document.getElementById('slider-ticks');
    const labelsContainer = document.getElementById('slider-labels');

    const years = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

    years.forEach(year => {

        const tick = document.createElement('div');
        tick.className = 'slider-tick';
        ticksContainer.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'slider-label';
        label.textContent = year;
        labelsContainer.appendChild(label);
    });

    slider.addEventListener('input', () => {
        output.textContent = slider.value;
        updateHeatMap(slider.value);
        let yearValue = slider.value;

        nationalData.forEach ( d => {
            if (d['Year'] == slider.value) {
                national.textContent = d.nation_median_debt;
            }
        })
    });
}

requestHeatData();