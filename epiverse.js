console.log('epiverse loaded!')

var epiverse = {}

/**
 * Main global portable module.
 *
 * @namespace epiverse
 * @property {Function} getStateCodeMap - {@link epiverse.getStateCodeMap}
 * @property {Function} cPdf - {@link epiverse.cPdf}
 * @property {Function} color - {@link epiverse.color}
 * @property {Function} loadGeoCounties - {@link epiverse.loadGeoCounties}
 * @property {Function} loadScript - {@link epiverse.loadScript}
 */
 
 
/** 
* Load states dictionary from name to code
* 
* 
* @param {Object} cobject Module library object [Optional]
* 
* @example
* await epiverse.getStateCodeMap()
*/
epiverse.getStateCodeMap = async function (cobject){
    var server = (location.host=='127.0.0.1') ? `http://${location.host}/nih/modules/` : `https://${location.host}/`
    var temp = await fetch(server+'convert_state_in_codes.json')
    var states = await temp.json()
    
    if(cobject!=null && cobject!=undefined){
        cobject.state_dict = states
        var state_dict_rev = {}
        Object.keys(cobject.state_dict).forEach( el => { state_dict_rev[ cobject.state_dict[el] ] = el } )
        cobject.state_dict_reverse = state_dict_rev
    }
    
    return states
}


/** 
* Map rgb color values to a scale varying from blue to red
* 
* 
* @param {number} x Value for the red component.
* @param {number} u Value for the green component.
* @param {number} s Value for the blue component.
* 
* @example
* await epiverse.cPdf(0.2, 255, 35)
*/
epiverse.cPdf =function(x,u,s){
    u=u||0;
    s=s||1;
    return Math.round(255*(1/(s*Math.sqrt(2*Math.PI)))*(Math.exp((-Math.pow((x-u),2))/(2*Math.pow(s,2))))/(1/(s*Math.sqrt(2*Math.PI))))
}

/** 
* Map normalized context value to a rgb color
* 
* 
* @param {number} x Value for the red component.
* 
* @example
* await epiverse.color(0.2)
*/
epiverse.color =function(val){
    if(Array.isArray(val)){
        return val.map(function(v){
            return epiverse.color(v)
        })
    }
    else{
        val = val*255
        return 'rgb('+epiverse.cPdf(val,255,35)+','+epiverse.cPdf(val,0,35) +','+epiverse.cPdf(val,100,35)+')'
    }
}

/** 
* Map normalized context value to a rgb color
* 
* 
* @param {number} x Value for the red component.
* 
* @example
* await epiverse.loadGeoCounties(0.2)
*/
epiverse.loadGeoCounties = async function(cobject) {
    var server = (location.host=='127.0.0.1') ? `http://${location.host}/nih/modules/` : `https://${location.host}/`
    
    var t = ''
    
    var a = await ( fetch( server+"georef-county.zip")       // 1) fetch the url
    .then(function (response) {                       // 2) filter on 200 OK
        if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob());
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    })
    .then(JSZip.loadAsync)                            // 3) chain with the zip promise
    .then(function (zip) {
        return zip.file("georef-county.csv").async("string"); // 4) chain with the text content promise
    }) )
    
    t=a.split('\n').slice(1).map(e => e.split(';'))
    var head=a.split('\n')[0].split(';')
    var dat = {}
    t.forEach( el => {
        var state = el[4]
        
        if(state!=undefined){
            var county = el[9]
            var lats=[]
            var lons=[]
            
            if( el[1] != undefined ){
                var geo = JSON.parse( el[1].slice(1, el[1].length-1).replaceAll('""','"') )
                geo.coordinates = geo.coordinates[0].filter( e => { return !isNaN( Number(e[0]) ) && !isNaN( Number(e[1]) ) } )
                
                if( geo.coordinates.length > 0){
                    if( ! Object.keys(dat).includes(state) ){
                        dat[state]= { 'lats': [], 'lons': [], 'center': [0, 0], 'data': [] }
                    }
                    
                    var coords = geo.coordinates.map( e => { lats.push( Number(e[1]) ); lons.push( Number(e[0]) ); return { 'lat': Number(e[1]), 'lng': Number(e[0]) } } )
                    
                    //console.log(state, dat[state]['lats'].length, dat[state]['lons'].length )
                    dat[state]['lats'] = dat[state]['lats'].concat(lats)
                    dat[state]['lons'] = dat[state]['lons'].concat(lons)
                    
                    dat[state]['data'].push( { 'county': county, 'coordinates': coords } )
                }
            }
        }
    })
    
    for (var k of Object.keys(dat) ){
        //console.log(k, dat[k])
        dat[k]['center'][0] = dat[k]['lats'].reduce( (a,b) => a+b ) / dat[k]['lats'].length
        dat[k]['center'][1] = dat[k]['lons'].reduce( (a,b) => a+b ) / dat[k]['lons'].length
    }
    
    return dat
}

/** 
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* epiverse.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
epiverse.loadScript= async function(url){
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

if(typeof(JSZip)=="undefined"){
	epiverse.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')
}

