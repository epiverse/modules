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
 *
 *
 * @object CensusCorrelation
 * @attribute {Object} chosen_metrics_description Object containing the variable identifiers from census as keys and the values is an array with the following information: metric name, filter values
 */


/** 
* Initializes the Census Correlation Analysis object
* 
*
* @param {Object} chosen_metrics_description Object containing the variable identifiers from census as keys and the values is an array with the following information: metric name, filter values
*
* @returns {Object} Census Correlation Analysis object.
* 
* @example
* let v = epiverse.CensusCorrelation({})
*/
epiverse.CensusCorrelation = function (chosen_metrics_description={}){
    var object = { chosen_metrics_description: chosen_metrics_description }
    
    return object
}

/** 
* Build the correlation matrix
* 
*
* @param {Object} corrAnalysisObj Census Correlation Analysis object
* @param {Object} censusObj Census Correlation Library object
* @param {string} scope Scope (state or county)
*
* @returns {Object} Correlation Matrix
* 
* @example
* let corr = epiverse.CensusCorrelation({ "B01001_026E-2021": ["2021","B01001_026E","SEX BY AGE", "Female|All"], })
* let vcensus = await Census()
* var corrMatrix = epiverse.vizTableInputCorrelation(corr, vcensus, state)
*/
epiverse.calculateCorrelation = async (corrAnalysis, censusObj, scope) => {
    
    var keys = Object.keys(corrAnalysis.chosen_metrics_description)
    var input = {}
    for (var k of keys){
        var year = corrAnalysis.chosen_metrics_description[k][0]
        var variable = corrAnalysis.chosen_metrics_description[k][1]
        if ( ! Object.keys(input).includes(year) ){
            input[year] = []
        }
        input[year].push(variable)
    }
    
    var years = Object.keys(input)
    
    var ids = {}
    var info = []
    if(scope=='state'){
        info = await Promise.all( years.map( async year => { 
            var temp = JSON.parse( JSON.stringify( censusObj ) )
            temp.year = year
            temp.chosen_state_metric = input[year]
            var table = await census.getDataState(temp)
            table = table.filter(e => e.id!=undefined)
            ids[year] = table.map( el => { return el.id } )
            return table
        } ) )
        
    }
    if(scope=='county'){
        info = await Promise.all( years.map( async year => { 
            var temp = JSON.parse( JSON.stringify( censusObj ) )
            temp.year = year
            temp.chosen_county_metric = input[year]
            var table = await census.getDataCounty(temp)
            table = table.filter(e => e.id!=undefined)
            ids[year] = table.map( el => { return el.id } )
            return table
        } ) )
    }
    console.log(info)
    
    var sets = []
    for (var y of years){
        sets.push( new Set( ids[y] ) )
    }
    var intersection = sets.reduce( (a, b) => new Set( [...a].filter(Set.prototype.has, b) ) )
    intersection = [...intersection]
    
    console.log(intersection)
    
    var values = {}
    var i = 0
    for (var y of years){
        for ( var v of input[y]){
            values[ v+'-'+y ] = info[i].map(el => {
                var vnumber=parseInt(el[v])
                if( intersection.includes(el['id']) && !isNaN(vnumber)){
                    return { 'id': el['id'], 'value': vnumber }
                }
            })
        }
        i+=1
    }
    
    console.log(values)
    
    var corr_matrix = {}
    keys = Object.keys(values)
    for (var k of keys){
        corr_matrix[k]={}
        for (var v of keys){
            /*var vars = {}
            vars[k]='metric'
            vars[v]='metric'
            
            var measures = []
            values[k].forEach(e => {
                var v2 = values[v].filter(el => el.id==e.id)[0]
                var temp = {}
                temp[k]=e.value
                temp[v]=v2.value
                measures.push( temp )
            })
            var st = new Statistics(measures, vars);
            corr_matrix[k][v] = st.correlationCoefficient(k, v)['correlationCoefficient']
            */
            var seq1 = []
            var seq2 = []
            values[k].forEach(e => {
                var v2 = values[v].filter(el => el.id==e.id)[0]
                seq1.push(e.value)
                seq2.push(v2.value)
            })
            corr_matrix[k][v] = jStat.corrcoeff( seq1, seq2 )
        }
    }
    
    console.log(corr_matrix)
    corrAnalysis.corrMatrix = corr_matrix
    
    return corr_matrix
}

/** 
* Plot the correlation matrix
* 
*
* @param {Object} corrAnalysisObj Census Correlation Analysis object
* @param {string} container Container identifier to plot the heatmap
*
* 
* @example
* let corr = epiverse.CensusCorrelation({ "B01001_026E-2021": ["2021","B01001_026E","SEX BY AGE", "Female|All"], })
* let vcensus = await Census()
* var corrMatrix = epiverse.vizTableInputCorrelation(corr, vcensus, state)
* epiverse.vizTableInputCorrelation(corr, vcensus, state)
* epiverse.plotCorrelationMatrix(corr, 'results_corr')
*/
epiverse.plotCorrelationMatrix = async (corrAnalysis, container) => {
    if( corrAnalysis.corrMatrix==null || corrAnalysis.corrMatrix==undefined){
        alert('You must calculate the correlation matrix first.')
    }
    else{
        var x = Object.keys(corrAnalysis.corrMatrix)
        var z = []
        for (var k of x){
            var aux = []
            for (var v of x){
                aux.push( corrAnalysis.corrMatrix[k][v] )
            }
            z.push(aux)
        }
        
        var data = [
          {
            z: z,
            x: x,
            y: x,
            type: 'heatmap',
            hoverongaps: false
          }
        ];

        Plotly.newPlot(container, data);
    } 
}

/** 
* Build the table to inform the user the chosne metrics for correlation
* 
*
* @param {Object} corrAnalysisObj Census Correlation Analysis object
* @param {string} container Container identifier
*
* 
* @example
* let v = epiverse.CensusCorrelation({})
* epiverse.vizTableInputCorrelation(v, 'table_variables_chosen')
*/
epiverse.vizTableInputCorrelation = function (corrAnalysisObj, container){
    var keys = Object.keys(corrAnalysisObj.chosen_metrics_description)
    
    if(keys.length>0){
        var cols=['Year', 'Variable Identifier', 'Metric name', 'Filter values', 'Action']
        var head = ''
        for(var c of cols){
            head+=`<th> ${c} </th>`
        }
        
        var aux=''
        for (var k of keys){
            aux += '<tr>'
            //var cols = [k].concat( corrAnalysisObj.chosen_metrics_description[k] )
            var cols = corrAnalysisObj.chosen_metrics_description[k] 
            for(var c of cols){
                aux+=`<td> ${c} </td>`
            }
            aux+=`<td> <button type="button" class="btn btn-danger btn-sm" onClick="epiverse.vizRemoveInputCorrelation(corrAnalysis, '${k}', '${container}' )" > Remove </button> </td>`
            aux+='</tr>'
        }
        
        var table = `
            <table class="table table-striped mt-3" > 
                <thead id="tableHeader" > 
                    <tr>
                        ${head}
                    </tr>
                </thead>
                
                <tbody id="tableBody" > 
                    ${aux}
                </tbody>
            </table>
        `;
        eval(container).innerHTML=table
    }
    else{
        console.log('Error: There are no chosen metrics to build the table')
    }
}

/** 
* Remove variable from input correlation
* 
*
* @param {Object} corrAnalysisObj Census Correlation Analysis object
* @param {string} variable Variable identifier
* @param {string} container Container identifier
*
* 
* @example
* let v = epiverse.CensusCorrelation({'B01001_001E': ['SEX BY AGE','All|All'] })
* epiverse.vizTableInputCorrelation(v, 'B01001_001E', 'table_variables_chosen')
*/
epiverse.vizRemoveInputCorrelation = function (corrAnalysisObj, variable, container){
    var keys = Object.keys(corrAnalysisObj.chosen_metrics_description)
    if(keys.includes(variable)){
        delete corrAnalysisObj.chosen_metrics_description[variable]
        epiverse.vizTableInputCorrelation(corrAnalysisObj, container)
    }
    else{
        console.log('This key does not exist in the chosen variables from object')
    }
} 
 
/** 
* Load states dictionary from name to code
* 
* 
* @param {Object} cobject Module library object [Optional]
* 
* @returns {Object} Object containing the sates map forom abbreviation to name
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
* @returns {number} Color scale from red to blue
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
* @param {number} val Nomralized value from the data to be mapped to a rgb color
* 
* @returns {string} rgb color
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
* @param {number} cobject Census library object
* 
* @returns {Object} Object conntaining the polygons of the counties grouped by state
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
if(typeof(jStat)=="undefined"){
    epiverse.loadScript('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js')
}
if(typeof(Plotly)=="undefined"){
	epiverse.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}
