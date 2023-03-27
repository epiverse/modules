function filterData(){
    var lat = latitude.value
    var lon = longitude.value
    var rad = radius.value
    
    info1.style.display='none'
    Gmaps(lat, lon, rad).then( (val) => {
        console.log(val)
        cobj = val
        setTimeout( function () {
            info1.style.display='block'
            
            gmaps.plotSummaryCategories(val, 'container_plots'); 
        }, 5000);
     })
}

function init(){
    filterData()
}

setTimeout( function () { 
    init()
}, 2000);
