console.log('gmaps.js loaded')

/* Initializes object with default example parameters */

/**
 * Main global portable module.
 * @namespace 
 * @property {Function} Gmaps - {@link Gmaps}
 *
 * @namespace gmaps
 * @property {Function} getPlacesData - {@link gmaps.getPlacesData}
 * @property {Function} plotSummaryCategories - {@link gmaps.plotSummaryCategories}
 * @property {Function} plotSummaryTypes - {@link gmaps.plotSummaryTypes}
 * @property {Function} loadScript - {@link iarc.loadScript}
 */


 /**
 *
 *
 * @object Gmaps
 * @attribute {number} latitude Location latitude.
 * @attribute {number} longitude Location longitude.
 * @attribute {number} radius Coverage radius to search for places.
 * @attribute {Object} location Google location object.
 * @attribute {Object} place_categories PLace categories.
 * @attribute {Object} data_places All data gathered from the categories and types of places for the provided location.
 */

/** 
* Initializes the Gmaps Library object
* 
* @param {number} latitude Location latitude.
* @param {number} longitude Location longitude.
* @param {number} radius Coverage radius to search for places.
*
*
* @returns {Object} Gmaps library object.
* 
* @example
* let v = await Gmaps(39.086437,  -77.161263, 5000)
*/
async function Gmaps (latitude, longitude, radius){
    var object = { latitude: latitude, longitude: longitude, radius: radius }
    //object.location = new google.maps.LatLng(latitude, longitude)
    object.place_categories = { "Leisure": ["amusement_park", "aquarium", "art_gallery", "bowling_alley", "church", "gym", "hindu_temple", "library", "mosque", "movie_theater", "museum", "park", "synagogue", "zoo"], "HealthCare": ["dentist", "doctor", "drugstore", "hospital", "pharmacy", "physiotherapist"], "Security": ["police"], "Education": ["primary_school", "school", "secondary_school", "university"], "Access to Fresh Food": ["supermarket", "restaurant"] }
    await gmaps.getPlacesData(object)
    
    return object
}

let gmaps={}

/** 
* Get places data by category and type
* 
* @param {Object} gobject Gmaps object library
*
*
* @returns {Object} Data table with places with their category and types.
* 
* @example
* let v = await Gmaps(39.086437,  -77.161263, 5000)
* var data = await gmaps.getPlacesData(v)
*/
gmaps.getPlacesData = async (gobject) => {

    var container = document.getElementById("map")
    if(container==null){
        var s = document.createElement('div')
        s.id="map"
        document.body.appendChild(s)
        container = document.getElementById("map")
    }
    
    if(gobject.location==null){
        gobject.location = new google.maps.LatLng(gobject.latitude, gobject.longitude)
    }
    
    if(gobject.map==null){
        gobject.map = new google.maps.Map( container, {
            center: gobject.location,
            zoom: 15,
          });
    }
    
    let service = new google.maps.places.PlacesService(gobject.map);
    
    var categories = Object.keys(gobject.place_categories)
    
    var revmap={}
    for (var cat of categories ){
        for (var type of gobject.place_categories[cat] ){
            if(type.split('-')>1){
                type=type.split('-')[0]
            }
            revmap[type]=cat
        }
    }
    
    gobject.data_places = []
    var types = Object.keys(revmap).filter( e => e.split('-').length==1 )
    console.log(types)
    var request = {
        location: gobject.location,
        radius: ''+gobject.radius,
        type: types
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(results)
            results.forEach( el => { 
                var t = el.types
                for (it of t){
                    if( types.includes(it) ){
                        gobject.data_places.push( { "category": revmap[it], "type": it, "place": el } ) 
                    }
                }
            })
        }
    });
    
    /*
    for (var cat of categories ){
        for (var type of gobject.place_categories[cat] ){
            
            var request = {
                location: gobject.location,
                radius: ''+gobject.radius,
                type: [type]
            };
            if(type.split('-').length>1){
                request.type = [ type.split('-')[0] ]
                request.keyword=type.split('-')[1]
            }
    
            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    results.forEach( el => { 
                        var t = el.types
                        for (it of t){
                            if( Object.keys(revmap).includes(it) ){
                                gobject.data_places.push( { "category": revmap[it], "type": it, "place": el } ) 
                            }
                        }
                    })
                }
            });
        }
    }*/
    
    return gobject.data_places
}

/** 
* Generates summary plot of places by category
* 
* @param {Object} gobject Gmaps object library
* @param {string} container Container identifier to render the plots
*
*
* @example
* let v = await Gmaps(39.086437,  -77.161263, 5000)
* var data = await gmaps.plotSummaryCategories(v)
*/
gmaps.plotSummaryCategories = async (gobject, container) => {
    eval(container).style.display='none'
    
    eval(container).innerHTML = `
    <div class="col-12" >
        <div class="col-6" >
            <h4 id="info_cats" style="display: none"> Places by Categories (click in the bar to see the distribution of places by types): </h4>
            <div class="col-12"  id="summary_plot_cats"> </div>
        </div>
        
        <div class="col-6" >
            <h4 id="info_types" style="display: none" > Places by Types <span id='catn' > </span>: </h4>
            <div class="col-12"  id="topics_plot_types"> </div>
            <div class="col-12"  id="summary_plot_types"> </div>
        </div>
    </div>
    `
    var bar = document.getElementById('summary_plot_cats');
    
    var x = []
    var y = []
    var categories = Object.keys(gobject.place_categories)
    for (var cat of categories){
        var count = gobject.data_places.filter( el => el.category==cat ).length
        if(count>0){
            x.push(cat)
            y.push(count)
        }
    }
    
    if( x.length>0 ){
        eval(container).style.display=''
        
        var data = []
        var trace = {
          x: x,
          y: y,
          name: 'Places available by category',
          type: 'bar'
        }
        data.push(trace)

        var layout = {
            xaxis: {
                title: {
                  text: 'Categories',
                }
            },
            yaxis: {
                title: {
                  text: 'Number of Places',
                }
            }
        };
        
        info_cats.style.display=''
        Plotly.newPlot('summary_plot_cats', data, layout);
        
        bar.on('plotly_click', function(data){
            gmaps.plotSummaryTypes(gobject, data.points[0].label)
        });
    }
    else{
        alert('No data to plot!')
    }
}

/** 
* Generates summary plot of places by type given a category
* 
* @param {Object} gobject Gmaps object library
* @param {string} category Places category
*
*
* @example
* let v = await Gmaps(39.086437,  -77.161263, 5000)
* var data = await gmaps.plotSummaryTypes(v, 'Education')
*/
gmaps.plotSummaryTypes = async (gobject, category) => {
    info_types.style.display=''
    
    var bar = document.getElementById('summary_plot_types');
    
    var x = []
    var y = []
    var categories = Object.keys(gobject.place_categories)
    if( categories.includes(category) ){
        for (var type of gobject.place_categories[category] ){
            var count = gobject.data_places.filter( el => el.type==type ).length
            if(count>0){
                x.push(type)
                y.push(count)
            }
        }
        
        if( x.length>0 ){
            var htmls='<ul>'
            for (var type of gobject.place_categories[category] ){
                var content = gobject.data_places.filter( el => el.type==type ).map(el => { return el.place.name } )
                if(content.length>0){
                    content = content.join(', ')
                    htmls+=`<li> <b>${type}:</b> ${content} </li>`
                }
            }
            htmls+=`</ul>`
            topics_plot_types.innerHTML=htmls
        
            if(x.length > 2){
                var data = []
                var trace = {
                  x: x,
                  y: y,
                  name: 'Places available by category',
                  type: 'bar'
                }
                data.push(trace)

                var layout = {
                    xaxis: {
                        title: {
                          text: 'Types',
                        }
                    },
                    yaxis: {
                        title: {
                          text: 'Number of Places',
                        }
                    }
                };

                Plotly.newPlot('summary_plot_types', data, layout);
                
                bar.on('plotly_click', function(data){
                    var places = gobject.data_places.filter( el => el.category==category&&el.type==data.points[0].label )
                    console.log(places)
                    //searchShowPlacesTable(data.points[0].label)
                });
            }
        }
        else{
            alert('No data to plot')
        }
    }
    else{
        alert('This category does not exist!')
    }
}

/** 
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* gmaps.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
gmaps.loadScript= async function(url){
	console.log(`${url} loaded`)
    async function asyncScript(url){
        let load = new Promise((resolve,regect)=>{
            let s = document.createElement('script')
            s.src=url
            s.onload=resolve
            document.head.appendChild(s)
        })
        await load
    }
    // satisfy dependencies
    await asyncScript(url)
}

if(typeof(Plotly)=="undefined"){
	gmaps.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}

initMap = function() {}
window.initMap = initMap;
