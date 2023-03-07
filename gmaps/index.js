function filterData(){
    var lat = latitude.value
    var lon = longitude.value
    var rad = radius.value
    Gmaps(lat, lon, rad).then( (val) => {
        console.log(val)
        setTimeout( function () { 
            gmaps.plotSummaryCategories(val); 
        }, 5000);
     })
}

function init(){
    filterData()
}

setTimeout( function () { 
    init()
}, 2000);
