console.log('epiverse loaded!')

var epiverse = {}

epiverse.cPdf=function(x,u,s){
    u=u||0;
    s=s||1;
    return Math.round(255*(1/(s*Math.sqrt(2*Math.PI)))*(Math.exp((-Math.pow((x-u),2))/(2*Math.pow(s,2))))/(1/(s*Math.sqrt(2*Math.PI))))
}

epiverse.color=function(val){
    if(Array.isArray(val)){
        return val.map(function(v){
            return census.color(v)
        })
    }
    else{
        val = val*255
        return 'rgb('+epiverse.cPdf(val,255,35)+','+epiverse.cPdf(val,0,35) +','+epiverse.cPdf(val,100,35)+')'
    }
}

epiverse.loadGeoCounties = async function(cobject) {
    var server = (location.host=='127.0.0.1') ? `http://${location.host}/nih/modules/` : `https://${location.host}/`
    
    /*
    var a=await fetch( server+'georef-county.csv')
    a=await a.text()
    */
    var t = ''
    
    var a = await ( fetch("http://127.0.0.1/nih/modules/georef-county.zip")       // 1) fetch the url
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

export { epiverse }
