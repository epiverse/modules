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
    object.location = new google.maps.LatLng(latitude, longitude)
    object.place_categories = { "Leisure": ["amusement_park", "aquarium", "art_gallery", "bowling_alley", "church", "gym", "hindu_temple", "library", "mosque", "movie_theater", "museum", "park", "synagogue"], "HealthCare": ["dentist", "doctor", "drugstore", "hospital", "pharmacy", "physiotherapist", "zoo"], "Security": ["police"], "Education": ["primary_school", "school", "secondary_school", "university"], "Access to Fresh Food": ["supermarket", "restaurant-health"] }
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
    }
    
    return gobject.data_places
}

/** 
* Generates summary plot of places by category
* 
* @param {Object} gobject Gmaps object library
*
*
* @example
* let v = await Gmaps(39.086437,  -77.161263, 5000)
* var data = await gmaps.plotSummaryCategories(v)
*/
gmaps.plotSummaryCategories = async (gobject) => {
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
* iarc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
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

/*

let map;
let service;
let infowindow;

function initMap() {
  const ny = new google.maps.LatLng(40.730610, -73.935242);

  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: ny,
    zoom: 15,
  });

  service = new google.maps.places.PlacesService(map);
  var request = {
    query: "Parks",
    fields: ["name", "geometry"],
  };
  
  service.findPlaceFromQuery(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        console.log(results)
      for (let i = 0; i < results.length; i++) {
        createMarker(results[i]);
      }

      //map.setCenter(results[0].geometry.location);
    }
  });
  
  request = {
    location: ny,
    radius: '1500',
    type: ['park']
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        console.log(results)
      for (let i = 0; i < results.length; i++) {
        createMarker(results[i]);
      }
      //map.setCenter(results[0].geometry.location);
    }
  });
}

function createMarker(place) {
  if (!place.geometry || !place.geometry.location) return;

  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
  });

  google.maps.event.addListener(marker, "click", () => {
    infowindow.setContent(place.name || "");
    infowindow.open(map);
  });
}
*/
initMap = function() {}
window.initMap = initMap;
