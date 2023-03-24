console.log('census.js loaded')

/* Initializes object with default example parameters */

/**
 * Main global portable module.
 * @namespace 
 * @property {Function} Census - {@link Census}
 *
 * @namespace census
 * @property {Function} getMainDemographyData - {@link census.getMainDemographyData}
 * @property {Function} getDataRegion - {@link census.getDataRegion}
 * @property {Function} getDataState - {@link census.getDataState}
 * @property {Function} getDataCountyByState - {@link census.getDataCountyByState}
 * @property {Function} getDataCountyAllStates - {@link census.getDataCountyAllStates}
 * @property {Function} getDataSubdivisionByStateAndCounty - {@link census.getDataSubdivisionByStateAndCounty}
 * @property {Function} getCountyByStatePlot - {@link census.getCountyByStatePlot}
 * @property {Function} generatePlotState - {@link census.generatePlotState}
 * @property {Function} generatePlotCounty - {@link census.generatePlotCounty}
 * @property {Function} generateBivariablePlot - {@link census.generateBivariablePlot}
 * @property {Function} getStates - {@link census.getStates}
 * @property {Function} getVariablesProcessed - {@link census.getVariablesProcessed}
 * @property {Function} getVariables - {@link census.getVariables}
 * @property {Function} getVariableDetails - {@link census.getVariableDetails}
 * @property {Function} makeFillVariableSelect - {@link census.makeFillVariableSelect}
 * @property {Function} makeFilterVariableAutocomplete - {@link census.makeFilterVariableAutocomplete}
 * @property {Function} makeFiltersVariableDetail - {@link census.makeFiltersVariableDetail}
 * @property {Function} loadScript - {@link census.loadScript}
 */
 
 
 /**
 *
 *
 * @object Census
 * @attribute {string} year Year for analysis.
 * @attribute {array} chosen_region_metric Region metric variable chosen by the user.
 * @attribute {string} chosen_state State id chosen by the user.
 * @attribute {array} chosen_state_metric State metric variable chosen by the user.
 * @attribute {string} chosen_county County id chosen by the user.
 * @attribute {array} chosen_county_metric County metric variable chosen by the user.
 * @attribute {array} chosen_subdivision_metric Subdivision metric variable chosen by the user.
 * @attribute {array} states States list of the USA.
 * @attribute {Object} state_dict States dictionary to map state name to abbreviated code.
 * @attribute {array} census_variables Available variables in Census API.
 * @attribute {Object} dict_counties_geo County dictionary with geo points grouped by state.
 */


/** 
* Initializes the Census Library object
* 
*
* @param {string} [year=2021] Year for analysis
*
* @returns {Object} Census library object.
* 
* @example
* let v = await Census()
*/
async function Census (year=2021){
    var object = { year: year, chosen_region_metric: [], chosen_state: '', chosen_state_metric: [], chosen_county: '', chosen_county_metric: [] }
    
    await census.getVariablesProcessed(object)
    await census.getStates(object)
    
    var server = (location.href.indexOf('/census')==-1 ) ? location.href.split('#')[0]+'census/' : location.href.split('#')[0]
    var temp = await fetch(server+'convert_state_in_codes.json')
    object.state_dict = await temp.json()
    
    var server = (location.href.indexOf('/census')==-1 ) ? location.href.split('#')[0]+'census/' : location.href.split('#')[0]
    var temp = await fetch(server+'counties_geo_info.json')
    object.dict_counties_geo = await temp.json()
    
    /*temp = await temp.text()
    temp = temp.split('\n')
    var dict_counties_geo = {}
    temp.slice(1).forEach(el => {
        var cols = el.split('\t')
        
        var state = cols[2]
        var county = cols[1]
        var lat = cols[0].split(', ')[0]
        var lon = cols[0].split(', ')[1]
        
        if( ! Object.keys(dict_counties_geo).includes(state) ){
            dict_counties_geo[state]=[]
        }
        dict_counties_geo[state].push( { 'county': county, 'lat': lat, 'lon': lon } )
    })
    object.dict_counties_geo = dict_counties_geo
    */
    
    return object
}

let census = {}

/** 
* Get demography general data
* 
* @param {Object} cobject Census library object
* @param {string} variable_query Query filter combination
* @param {string} metric High level metric to filter
* @param {string} container Container to draw plot right after data retrieval [Optional]
* @param {Function} callback_handle_state Callback to handle chosen state [Optional]
*
*
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* let callback = (data) => { console.log(data.points[0]);  }
* let dat = await census.getMainDemographyData(v, 'Female|All', 'B01001', 'map_main', callback)
*/
census.getMainDemographyData = async function(cobject, variable_query, metric, container, callback_handle_state){
    var treated = []
        
    var vrbs=cobject.census_variables.filter( el => el.global_var == metric )
    vrbs=vrbs[0]
    if( Object.keys(vrbs.variable_filters.retrieval_dict).includes(variable_query) ) {
        var query = vrbs.variable_filters.retrieval_dict[variable_query]
        
        // Reference https://www.census.gov/data/developers/data-sets/ACS-supplemental-data.html
        // **** get regions https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E,B02001_001E,B01003_001E&for=region:*  
        // **** get states https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=state:*
        
        // get county https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=county:*
        
        // get counties by states https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E,B02001_001E,B01003_001E&for=county:*&in=state:06
        
        // get subdivisions in a state https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=county%20subdivision:*&in=state:17
        // **** get subdivisions by county and state https://api.census.gov/data/2021/acs/acs1?get=NAME,B01001_001E&for=county%20subdivision:*&in=state:17&in=county:197

        // inside a state microdata
        //var res = await fetch(`https://api.census.gov/data/2021/acs/acs1/pums?get=SEX,PWGTP,SCHL,DIS,ESR,WAGP,RAC1P,MAR&for=public%20use%20microdata%20area:*&in=state:01`)
        
        //state_container.style.display='none'
        county_container.style.display='none'
        subdivision_container.style.display='none'
        
        cobject.chosen_state_metric=[query]
        
        treated = await census.getDataState(cobject)
        
        if(container!=null && container!=''){
            census.generatePlotState(cobject, treated, container, callback_handle_state)
        }
        
        /*var res = null
        var content=[]
        if(cobject.level=='region'){
            level.value=cobject.level
            treated = await census.getDataRegion(cobject)
        }
        if(cobject.level=='state'){
            level.innerHTML=cobject.level
            
            cobject.chosen_state_metric=[query]
        
            treated = await census.getDataState(cobject)
            
            if(container!=null && container!=''){
                census.generatePlotState(cobject, treated, 'map_main')
            }
        }
        if(cobject.level=='county'){
            level.innerHTML = cobject.level
            
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            var i=0
            var info=[]
            var rate=100
            var table = cobject.states
            while (i<table.length) {
                  var end = ((i+rate)<=table.length) ? i+rate : table.length
                  var temp = table.slice(i, end)
                  info = info.concat( await Promise.all( temp.map( async tab => {
                      var url = tab.link_details
                      var enrich = await fetch(`https://api.census.gov/data/2021/acs/acs1?get=NAME,${query}&for=county:*&in=state:${tab.id}&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
                      enrich = await enrich.json()
                      enrich = enrich.slice(1)
                      await sleep(300)
                      
                      return enrich
                  } )) )
                  
                  i+=rate
                  if(i>=table.length){
                      break
                  }
            }
            
            treated = []
            info.forEach( ele => {
                ele.forEach( el => {
                    treated.push( { 'id': el[3], 'name': el[0].split(', ')[0], 'name_state': el[0].split(', ')[1], 'id_state': cobject.state_dict[ el[0].split(', ')[1] ], 'result': parseInt(el[1]) } )
                } )
            })
        }*/
        
        cobject.data_demography = treated
        
    }
    else{
        alert('This combination of filters is not available for this metric')
    }
    
    return treated
}

/** 
* Get and treat data from api census level region
* 
* @param {Object} cobject Census library object
*
* 
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_region_metric=['B01001_026E']
* await census.getDataRegion(v)
*/
census.getDataRegion = async function (cobject){
    var query = cobject.chosen_region_metric
    var res = await fetch(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=region:*&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
    content=await res.json()
    content=content.slice(1)
    var treated = []
    content.forEach( el => {
        var final_index = el.length-1
        var obj = {'id': el[final_index], 'name': el[0], 'result': parseInt(el[1]) }
        var temp = el.slice(1, el.length-1)
        var i=0
        for (var c of query){
            obj[c]=temp[i]
            i+=1
        }
        treated.push( obj )
    })
    
    return treated
}

/** 
* Get and treat data from api census level state
* 
* @param {Object} cobject Census library object
*
* 
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_state_metric=['B01001_026E']
* let dat = await census.getDataState(v)
*/
census.getDataState = async function (cobject){
    var query = cobject.chosen_state_metric
    var res = await fetch(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=state:*&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
    var content=await res.json()
    content=content.slice(1)
    var treated = []
    content.forEach( el => {
        var final_index = el.length-1
        var obj = { 'id': cobject.state_dict[ el[0] ], 'number_code': el[final_index], 'name': el[0], 'result': parseInt(el[1]) } 
        if( ! isNaN(obj.result) ){
            var temp = el.slice(1, el.length-1)
            var i=0
            for (var c of query){
                obj[c]=temp[i]
                i+=1
            }
            treated.push( obj )
        }
    })
    
    return treated
}

/** 
* Get and treat data from api census level County by State
* 
* @param {Object} cobject Census library object
*
* 
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_state = 'California'
* v.chosen_county_metric=['B01001_026E']
* let dat = await census.getDataCountyByState(v)
*/
census.getDataCountyByState = async function (cobject){
    var query = cobject.chosen_county_metric
    var state = cobject.chosen_state
    var state_id = cobject.states.filter(el => el.name==state )[0].id
    var res = await fetch(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=county:*&in=state:${state_id}&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
    var content=await res.json()
    content=content.slice(1)
    var treated = []
    content.forEach( el => {
        var final_index = el.length-1
        var obj = { 'id': el[final_index], 'name': el[0].split(', ')[0], 'name_state': el[0].split(', ')[1], 'id_state': cobject.state_dict[ el[0].split(', ')[1] ], 'result': parseInt(el[1]) } 
        if( ! isNaN(obj.result) ){
            var temp = el.slice(1, el.length-2)
            var i=0
            for (var c of query){
                obj[c]=temp[i]
                i+=1
            }
            treated.push( obj )
        }
    })
    
    return treated
}

/** 
* Get and treat data from api census level county
* 
* @param {Object} cobject Census library object
*
* 
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_county_metric=['B01001_026E']
* let dat = await census.getDataCountyAllStates(v)
*/
census.getDataCountyAllStates = async function (cobject){
    var query = cobject.chosen_county_metric
    
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    var i=0
    var info=[]
    var rate=100
    var table = cobject.states
    while (i<table.length) {
          var end = ((i+rate)<=table.length) ? i+rate : table.length
          var temp = table.slice(i, end)
          info = info.concat( await Promise.all( temp.map( async tab => {
              var url = tab.link_details
              var enrich = await fetch(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=county:*&in=state:${tab.id}&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
              enrich = await enrich.json()
              enrich = enrich.slice(1)
              await sleep(300)
              
              return enrich
          } )) )
          
          i+=rate
          if(i>=table.length){
              break
          }
    }
    
    var treated = []
    info.forEach( ele => {
        ele.forEach( el => {
        var final_index = el.length-1
            var obj = { 'id': el[final_index], 'name': el[0].split(', ')[0], 'name_state': el[0].split(', ')[1], 'id_state': cobject.state_dict[ el[0].split(', ')[1] ], 'result': parseInt(el[1]) }
            var temp = el.slice(1, el.length-2)
            var i=0
            for (var c of query){
                obj[c]=temp[i]
                i+=1
            }
            treated.push( obj )
        } )
    })
    
    return treated
}

/** 
* Get and treat data from api census level Subdivision by State and county
* 
* @param {Object} cobject Census library object
*
* 
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_state = 'California'
* v.chosen_county = 'Sacramento County'
* v.chosen_subdivision_metric=['B01001_026E']
* let dat = await census.getDataSubdivisionByStateAndCounty(v)
*/
census.getDataSubdivisionByStateAndCounty = async function (cobject){
    var query = cobject.chosen_subdivision_metric
    var state = cobject.chosen_state
    var county = cobject.chosen_county
    var state_id = cobject.states.filter(el => el.name==state )[0].id
    var county_id = cobject.dict_counties_geo[state].filter(el => el.county==county )[0].code
    console.log(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=county%20subdivision:*&in=state:${state_id}&in=county:${county_id}&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
    var res = await fetch(`https://api.census.gov/data/${cobject.year}/acs/acs1?get=NAME,${query.join(',')}&for=county%20subdivision:*&in=state:${state_id}&in=county:${county_id}&key=46df0956f737ca4c3911fdf48b8e3dc3133d32fc`)
    var content=await res.json()
    content=content.slice(1)
    var treated = []
    content.forEach( el => {
        var final_index = el.length-1
        var obj = { 'id': el[final_index], 'name': el[0], 'result': parseInt(el[1]) } 
        if( ! isNaN(obj.result) ){
            var temp = el.slice(1, el.length-3)
            var i=0
            for (var c of query){
                obj[c]=temp[i]
                i+=1
            }
            treated.push( obj )
        }
    })
    
    return treated
}

/** 
* Generate bivariable plot
* 
* @param {Object} cobject Census library object
* @param {array} table Data table retrieved from the census api
* @param {array} query Census variable ids
* @param {string} title_x Title for X axis
* @param {string} title_y Title for Y axis
* @param {string} container Container to draw plot right after data retrieval [Optional]
*
*
* 
* @example
* let v = await Census()
* v.chosen_state = 'California'
* v.chosen_county_metric=['B01001_026E', 'B18108_011E']
* let dat = await census.getDataCountyByState(v)
* let dat = await census.generateBivariablePlot(v, dat, ['B01001_026E', 'B18108_011E'], 'SEX BY AGE (Female|All)', 'AGE BY NUMBER OF DISABILITIES (18 to 34 years|With one type of disability)', 'plot_bivar')
*/
census.generateBivariablePlot = function (cobj, table, query, title_x, title_y, container){
    var x = []
    var y = []
    table.forEach(el => {
        x.push( el[query[0]] )
        y.push( el[query[1]] )
    })

    var trace1 = {
        x: x,
        y: y,
        mode: 'markers',
        name: 'points',
        marker: {
            color: 'rgb(102,0,0)',
            size: 2,
            opacity: 0.4
        },
        type: 'scatter'
    };

    var trace2 = {
        x: x,
        y: y,
        name: 'density',
        ncontours: 20,
        colorscale: 'Hot',
        reversescale: true,
        showscale: false,
        type: 'histogram2dcontour'
    };

    var trace3 = {
        x: x,
        name: 'x density',
        marker: {color: 'rgb(102,0,0)'},
        yaxis: 'y2',
        type: 'histogram'
    };

    var trace4 = {
        y: y,
        name: 'y density',
        marker: {color: 'rgb(102,0,0)'},
        xaxis: 'x2',
        type: 'histogram'
    };

    var data = [trace1, trace2, trace3, trace4];

    var layout = {
        showlegend: false,
        autosize: false,
        width: 900,
        height: 650,
        margin: {l: 80, b: 80, t: 90},
        hovermode: 'closest',
        bargap: 0,
        xaxis: {
            title: title_x,
            domain: [0, 0.85],
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            title: title_y,
            domain: [0, 0.85],
            showgrid: false,
            zeroline: false
        },
        xaxis2: {
            domain: [0.85, 1],
            showgrid: false,
            zeroline: false
        },
        yaxis2: {
            domain: [0.85, 1],
            showgrid: false,
            zeroline: false
        },
        title: 'Bivariate Histogram 2D Contour Map'
    };

    Plotly.newPlot(container, data,layout);
}

/** 
* Get county data by state and plot
* 
* @param {Object} cobject Census library object
* @param {string} variable_query Query filter combination
* @param {string} metric High level metric to filter
* @param {string} container Container to draw plot right after data retrieval [Optional]
*
*
* @returns {array} Data table with data retrieved from Census API
* 
* @example
* let v = await Census()
* v.chosen_state = 'California'
* let dat = await census.getCountyByStatePlot(v, 'Female|All', 'B01001', 'map_main')
*/
census.getCountyByStatePlot = async function (cobject, variable_query, metric, container){
    var treated = []
        
    var vrbs=cobject.census_variables.filter( el => el.global_var == metric )
    vrbs=vrbs[0]
    if( Object.keys(vrbs.variable_filters.retrieval_dict).includes(variable_query) ) {
        var query = vrbs.variable_filters.retrieval_dict[variable_query]
        
        cobject.chosen_county_metric=[query]
        
        treated = await census.getDataCountyByState(cobject)
        
        if(container!=null && container!='' && treated.length>0){
            census.generatePlotCounty(cobject, treated, container)
        }
    }
}

/** 
* Generate plot in the state scope of the cloropleth map
* 
* @param {Object} cobject Census library object
* @param {array} table Data table retrieved from the census api
* @param {string} container COntainer identifier to draw the plot
* @param {Function} callback_handle_state Callback to handle chosen state [Optional]
*
* 
* @example
* let v = await Census()
* v.chosen_state_metric=['B01001_026E']
* let dat = await census.getDataState(v)
* let callback = (data) => { console.log(data.points[0]);  }
* await census.generatePlotState(v, dat, 'map_main', callback)
*/
census.generatePlotState = async function (cobject, table, container, callback_handle_state){
    var map = document.getElementById(container)
    let normalize = (val, arr) => { return ( val - Math.min.apply(null, arr))/(Math.max.apply(null, arr) - Math.min.apply(null, arr)) }
    
    if(table.length>0){
        var locations = table.map( el => { return el['id'] } )
        var captions = table.map( el => { return el['name']+' - Value: '+el['result']  } )
        var y = table.map( el => { return isNaN(el['result']) ? 0 : el['result'] } )
        var normy = y.map(el => { return normalize(el, y) })
        
        var data = [{
              type: 'choropleth',
              locationmode: 'USA-states',
              locations: locations,
              z: normy,
              text: captions,
              colorbar: {
                  thickness: 0.2
              },
              marker: {
                  line:{
                      color: 'rgb(255,255,255)',
                      width: 2
                  }
              }
          }];


          var layout = {
              geo:{
                  scope: 'usa',
                  showlakes: true,
                  lakecolor: 'rgb(255,255,255)'
              }
          };
          
          var ide = container.split('_')[1]
          document.getElementById(ide+'_plot').style.display=''
          
          Plotly.newPlot(container, data, layout, {showLink: false})
          .then( gd => {
             gd.on('plotly_click', async function(data){
                cobject.chosen_state = data.points[0].text.split(' - ')[0]
                
                if(callback_handle_state!=null && callback_handle_state!=undefined){
                    await callback_handle_state(data)
                }
                
                /*for(var i=0; i < data.points.length; i++){
                    pts = 'x = '+data.points[i].x +'\ny = '+
                        data.points[i].y.toPrecision(4) + '\n\n';
                }
                alert('Closest point clicked:\n\n'+pts);
                */
            });
         })
     }
     else{
        alert('There is no data to plot for this filter!')
     }
}

/** 
* Generate plot in the county scope of the google geo chart
* 
* @param {Object} cobject Census library object
* @param {array} table Data table retrieved from the census api
* @param {string} container COntainer identifier to draw the plot
*
* 
* @example
* let v = await Census()
* v.chosen_county_metric=['B01001_026E']
* let dat = await census.getDataCounty(v)
* await census.generatePlotCounty(v, dat, 'map_county')
*/
census.generatePlotCounty = async function (cobject, table, container){
    var ide = container.split('_')[1]
    var map = document.getElementById(container)
    
    if(table.length>0){
        var subset = cobject.dict_counties_geo[cobject.chosen_state]
        var dat_plot = [ ['lat', 'lng', 'Metric', {role: 'tooltip', p:{html:true}} ] ]
        table.forEach(e => {
            var aux = subset.filter(el => e.name==el.county )[0]
            dat_plot.push( [ Number(aux.lat), Number(aux.lon), e.result, `${aux.county}<br /> ${cobject.chosen_county_metric}: ${e.result}` ] )
        })
        
        var dat_plot_2 = [ ['County', 'Metric'] ]
        table.forEach(e => {
            var aux = subset.filter(el => e.name==el.county )[0]
            dat_plot_2.push( [ aux.county, e.result ] )
        })
        //console.log(dat_plot)
        var state_abv = cobject.state_dict[cobject.chosen_state]
        
        google.charts.load('current', {
            callback: function (){
                var data = google.visualization.arrayToDataTable( dat_plot )
                
                var view = new google.visualization.DataView(data);
                //view.setColumns([0, 1, 2, 3]);

                var options = {
                    tooltip: {trigger: focus},
                    region: "US-"+state_abv,
                    resolution: "provinces",
                    tooltip: {
                        isHtml: true
                    }
                };
                
                var cont = document.getElementById(container)
                var chart = new google.visualization.GeoChart(cont);
                
                google.visualization.events.addListener(chart, 'select', function () {
                  var selection = chart.getSelection();
                  if (selection.length > 0) {
                    cobject.chosen_county = data.getValue( selection[0].row, 3).split('<br />')[0]
                    console.log( data.getValue( selection[0].row, 3).split('<br />')[0] );
                    //window.open('http://' + data.getValue(selection[0].row, 2), '_blank');
                  }
                });

                chart.draw(view, options);
                
                document.getElementById(ide+'_container').style.display=''
            },
            'packages': ['geochart'],
            'mapsApiKey': 'AIzaSyAHcL7uevM0muUusWOkucO1zY3O5CpS5VE'
        });
    }
    else{
        alert('There is no data to plot for this filter!')
    }
    
}

/** 
* Get USA states identifiers
* 
* @param {Object} cobject Census library object
*
*
* @returns {array} Data table with data cotaining id, state abbreviation and name
* 
* @example
* let v = await Census()
* let dat = await census.getStates(v)
*/
census.getStates = async function (cobject){
    var a=await fetch('https://api.census.gov/data/2021/acs/acs1?get=NAME&for=state:*')
    var text =await a.json()
    var treated=[]
    text.slice(1).forEach( el => {
        treated.push( { 'id': el[1], 'name': el[0] } )
    })
    cobject.states = treated
    
    return treated
}

/** 
* Get Census Variables and details stored in local json
* 
* @param {Object} cobject Census library object
*
*
* @returns {array} Data table with data containing high level variable metadata: id global, description, link for variable filter options and variable details object
* 
* @example
* let v = await Census()
* let dat = await census.getVariablesProcessed(v)
*/
census.getVariablesProcessed = async function (cobject){
    var server = (location.href.indexOf('/census')==-1 ) ? location.href.split('#')[0]+'census/' : location.href.split('#')[0]
    var table = await fetch(server+'treated_census_variables.json')
    table = await table.json()
    cobject.census_variables = table
    
    return table
}

/** 
* Get Census Variables and details updated directly from the Census API
* 
* @param {Object} cobject Census library object
*
*
* @returns {array} Data table with data containing high level variable metadata: id global, description, link for variable filter options and variable details object
* 
* @example
* let v = await Census()
* let dat = await census.getVariables(v)
*/
census.getVariables = async function (cobject){
    var a=await fetch('https://api.census.gov/data/2021/acs/acs1/groups.html')
    var text =await a.text()
    text=text.split('\n')
    var table=[]
    for (var l of text){
        if(l.indexOf('</td><td>')!=-1){
            var aux = l.split('</td><td>')
            var link = aux[2].split('href="')[1].split('"')[0]
            var id_ = aux[0].replace('<td>','')
            //var details = census.getVariableDetails(link)
            table.push( { 'global_var': id_, 'description': aux[1], 'link_details': link, 'variable_filters': null } )
        }
    }
    
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    var i=0
    var info=[]
    var rate=100
    while (i<table.length) {
          var end = ((i+rate)<=table.length) ? i+rate : table.length
          var temp = table.slice(i, end)
          info = info.concat( await Promise.all( temp.map( async tab => {
              var url = tab.link_details
              var enrich = await census.getVariableDetails(url)
              tab.variable_filters = enrich
              await sleep(300)
              
              return tab
          } )) )
          
          i+=rate
          if(i>=table.length){
              break
          }
    }
    
    info = info.filter( el => el.variable_filters!=null )
    
    cobject.census_variables = info
    
    return info
}

/** 
* Get Census Variables details and filtering options updated directly from the Census API
* 
* @param {string} link Link to the variable details and filters
*
*
* @returns {array} Data table with data containing filter options for the chosen high level variable metadata: details data of each option available in the variable context, dictionary of legible options to the corresponding id to query in census, columns with options names, array of the sam elength as columns contianing the unique values to fill each filter select separately
* 
* @example
* let v = await Census()
* let dat = await census.getVariableDetails('https://api.census.gov/data/2021/acs/acs1/groups/B19001.html')
*/
census.getVariableDetails = async function (link){
    link = link.replace('http:','https:')
    var a=await fetch(link)
    var text =await a.text()
    text=text.split('\n')
    
    var table=[]
    var retrieval_dict = {}
    var unique_col_values=[]
    var cols=[]
    var j=0
    for (var l of text){
        if(l.indexOf('</td><td>')!=-1 && l.indexOf('Estimate!!Total:')!=-1 && l.indexOf('Annotation of ')==-1 ){
            var aux = l.split('</td><td>')
            var id_=aux[0].replace('<td>','').split('>')[1].split('<')[0]
            
            cols = aux[2].split(' BY ')
            if(j==0){
                cols.forEach( el => {
                    unique_col_values.push([])
                } )
            }
            
            var values = aux[1].split(':')
            if( values.length>=2 ){
                var temp_vals=[]
                var filters={}
                var j = 1
                for (var c of cols){
                    var v = 'All'
                    if( values[j]!=undefined && values[j]!='' ){
                        v=values[j].replace('!!','')
                    }
                    filters[c]=v
                    temp_vals.push(v)
                    j+=1
                }
                
                var id_dict = temp_vals.join('|')
                retrieval_dict[id_dict] = id_
                
                var cnt=0
                for(var c of cols){
                    if (! unique_col_values[cnt].includes(filters[c]) ) { 
                        unique_col_values[cnt].push( filters[c] )
                    }
                    cnt+=1
                }
                table.push( { 'filter_id': id_, 'filters_dict': filters } )
            }
            j+=1
        }
    }
    
    var result = null
    if(table.length>0){
        result    = { 'details_data': table, 'retrieval_dict': retrieval_dict, 'columns': cols, 'viz_unique_col_values': unique_col_values }
    }
    return result
}

/** 
* Fill select options with all available years
* 
* @param {Object} cobject Census library object
* @param {string} container Container to the select tag to be filled
*
*
* @example
* let v = await Census()
* let dat = census.makeFillYearSelect(v, 'select_year')
*/
census.makeFillYearSelect = async function (container){
    var ide = container.split('_')[1]
    
    var htmls=""
    var j=0
    for(var i = 2021; i>=2005; i--){
        var sel= (j==0) ? 'selected' : ''
        if(i != 2020){
            htmls+=`<option value="${i}" ${sel} > ${i} </option>`
        }
        j+=1
    }
    
    document.getElementById(container).innerHTML=htmls
}

/** 
* Fill select options with all available variables
* 
* @param {Object} cobject Census library object
* @param {string} container Container to the select tag to be filled
*
*
* @example
* let v = await Census()
* let dat = await census.makeFillVariableSelect(v, 'options_main')
*/
census.makeFillVariableSelect = async function (cobject, container){
    var ide = container.split('_')[1]
    //var aux = cobject.census_variables.filter( el => el.globalvar==id_ )
    var aux = cobject.census_variables
    var htmls = ""
    var i=0
    var first=''
    aux.forEach( el => {
        sel=''
        if(i==0){
            first=el.global_var
            sel='selected'
        }
        htmls+=`<option value="${el.global_var}" ${sel} > ${el.description} </option>`
        i+=1
    })
    document.getElementById(container).innerHTML=htmls
    census.makeFiltersVariableDetail(cobject, first, ide+'_auxiliary_fields')
}

/** 
* Filter options of available variables according to keyword typed in search field
* 
* @param {Object} cobject Census library object
* @param {string} cobject Keyword to search among the available metrics
* @param {string} container Container to the select tag to be filled
*
*
* @example
* let v = await Census()
* let dat = await census.makeFilterVariableAutocomplete(v, 'income', 'options_main')
*/
census.makeFilterVariableAutocomplete = async function (cobject, value, container){
    var ide = container.split('_')[1]
    var aux = cobject.census_variables.filter( el => el.description.toLowerCase().includes(value.toLowerCase()) )
    var htmls = ""
    var first
    var i=0
    aux.forEach( el => {
        if(i==0){
            first=el.global_var
        }
        htmls+=`<option value="${el.global_var}"> ${el.description} </option>`
        i+=1
    })
    
    if(htmls!=""){
        document.getElementById(container).innerHTML=htmls
        census.makeFiltersVariableDetail(cobject, first, ide+'_auxiliary_fields')
    }
}

/** 
* Generate and fill select tags with each filter option for the chosen metric
* 
* @param {Object} cobject Census library object
* @param {string} container Container to the select tag to be filled
*
*
* @example
* let v = await Census()
* let dat = await census.makeFiltersVariableDetail(v, 'main_auxiliary_fields')
*/
census.makeFiltersVariableDetail = async function (cobject, id_metric, container){
    var ide = container.split('_')[0]
    var aux = cobject.census_variables.filter( el => el.global_var==id_metric )
    var tab = aux[0].variable_filters
    var htmls=""
    var i=0
    for (var c of tab.columns){
        var content = tab.viz_unique_col_values[i]
        
        var options = ""
        content.forEach(el => {
            options+=`<option value="${el}"> ${el} </option>`
        })
        
        htmls+=`
            <div style="display: inline-block;" >
                <label class="fields mr-2" style="text-align: right;" > ${c} filter options:</label>
                <select id="filter_${ide}_${i}" class="filter_${ide} form-control mr-3 fields" > ${options} </select>
            </div>
        `
        i+=1
    }
    document.getElementById(container).innerHTML=htmls
}


/** 
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* census.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
census.loadScript= async function(url){
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
	census.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}
