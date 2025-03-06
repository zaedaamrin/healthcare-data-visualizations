var main = d3.select("#intromain");
var scrolly = main.select("#scrollyintro");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");

var stepImages = [
    'images/landing-page.png',  
    'images/image1.png',                  
    'images/image2.png',               
    'images/image3.png',                  
    'images/image4.png',
    'images/image5.png',   
    'images/image6.png',
    'images/imageblank.png'
];

var scroller = scrollama();

function handleResize() {
    var stepH = Math.floor(window.innerHeight * 0.75);
    step.style("height", stepH + "px");

    var figureHeight = window.innerHeight / 2;
    var figureMarginTop = (window.innerHeight - figureHeight) / 2;

    figure
        .style("height", figureHeight + "px")
        .style("top", figureMarginTop + "px");

    scroller.resize();
}

function handleStepEnter(response) {
    var img = document.getElementById("introimg"); 
    if (response.index === 1 && response.direction != 'up') {
        img.style.opacity = 0;
            setTimeout(() => {
                img.src = stepImages[response.index]; 
                img.style.opacity = 1;
            }, 900);
    } else {
        img.src = stepImages[response.index]; 
    }
}

function init() {
    handleResize();
    scroller
        .setup({
            step: "#scrollyintro article .step",
            offset: 0.33,
            debug: false
        })
        .onStepEnter(handleStepEnter);
}

init();