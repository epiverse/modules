// Study case 1
function initCorrelation(){
    action_corr.value='Loading ...'
    
    census.makeFillYearSelect('select_year_corr')
    var year = select_year_corr.value
    
    var example = { "B01001H_017E-2021": [ "2021","B01001H_017E","SEX BY AGE (WHITE ALONE, NOT HISPANIC OR LATINO)","Female|All"], "B07010_045E-2021": [ "2021", "B07010_045E", "GEOGRAPHICAL MOBILITY IN THE PAST YEAR BY INDIVIDUAL INCOME IN THE PAST 12 MONTHS (IN 2021 INFLATION-ADJUSTED DOLLARS) FOR CURRENT RESIDENCE IN THE UNITED STATES", "Moved from different state|All" ] }
    corrAnalysis = epiverse.CensusCorrelation(example);
    epiverse.vizTableInputCorrelation(corrAnalysis, 'table_variables_chosen')
    
    //var lev = level_in.value
    Census(year).then( (val) => {
        corrObj = val
        
        census.makeFillVariableSelect(corrObj, 'options_multi', 'multi_auxiliary_fields')
        action_corr.value='Add to Correlation'
        
        setTimeout( async function () { 
            await calculatePlotCorrelation()
        }, 2000);
    })
}

removeAllVariables = () => {
    corrAnalysis.chosen_metrics_description = {}
    epiverse.vizTableInputCorrelation(corrAnalysis, 'table_variables_chosen')
    corr_remove_all.style.display='none'
    corr_calc.style.display='none'
}     
                    
addVariable = () => {
    var year = select_year_corr.value
    var metric = options_multi.value
    
    var variable_query = []
    document.querySelectorAll('.filter_multi_auxiliary_fields').forEach( el => { variable_query.push(el.value) } )
    variable_query = variable_query.join('|')
    
    var vrbs=corrObj.census_variables.filter( el => el.global_var == metric )
    vrbs=vrbs[0]
    if( Object.keys(vrbs.variable_filters.retrieval_dict).includes(variable_query) ) {
        var query = vrbs.variable_filters.retrieval_dict[variable_query]
        metric = vrbs.description
        var keys = Object.keys(corrAnalysis.chosen_metrics_description)
        if( ! keys.includes(query+'-'+year) ){
            corrAnalysis.chosen_metrics_description[query+'-'+year] = [year, query, metric, variable_query]
            epiverse.vizTableInputCorrelation(corrAnalysis, 'table_variables_chosen')
            corr_remove_all.style.display=''
            
            if( keys.length+1 > 1){
                corr_calc.style.display=''
            }
        }
        else{
            alert('You already added this variable for this year')
        }
    }
}

calculatePlotCorrelation = async () => {
    corr_calc.value="Loading ..."
    var scope = select_scope_corr.value
    var corr_matrix = []
    await epiverse.calculateCorrelation(corrAnalysis, corrObj, scope).then( (val) => {
        corr_matrix = val
        epiverse.plotCorrelationMatrix(corrAnalysis, 'results_corr')
        corr_calc.value="Calculate Correlation"
    })
}

// Study case 2
function initCensus(){
                    county_filter.value="Loading ..."
                    
                        census.makeFillYearSelect('select_year')
                        var year = select_year.value
                        
                        //var lev = level_in.value
                        Census(year).then( (val) => {
                            cobj = val
                            
                            census.makeFillVariableSelect(cobj, 'options_county', 'county_auxiliary_fields')
                            
                            setTimeout( function () { 
                                
                                county_filter.value="Send"
                    
                                var select_st = ''
                                var names=Object.keys(cobj.state_dict)
                                var i =0
                                names.forEach(el =>{
                                    var sel = i==0 ? 'selected' : ''
                                    select_st+=`<option value="${el}" ${sel} > ${el} </option>`
                                    i+=1
                                })
                                document.getElementById('select_states').innerHTML=select_st
                                
                                getCountyPlot()
                            }, 2000);
                        } ) 
                    }
                                 
                    changeYear = () => {
                        var year = select_year.value
                        cobj.year=year
                    }
                    
                    getCountyPlot = () => {
                        infol_county.style.display=''
                        document.getElementById('county_container').style.display=''
                        cobj.chosen_state = document.getElementById('select_states').value
                        
                        var metric = options_county.value
                        var fil = []
                        document.querySelectorAll('.filter_county_auxiliary_fields').forEach( el => { fil.push(el.value) } )
                        fil=fil.join('|')
                        
                        var callback = (place, sel) => { console.log(place) }
                        //census.getCountyByStatePlot(cobj, fil, metric, 'map_county_container', 'geochart' ).then( (v) => { } )
                        census.getCountyByStatePlot(cobj, fil, metric, 'map_county_container', 'polygonmap', callback_handle_location).then( (v) => {
                            document.getElementById('county_plot').style.display=''
                            infol_county.style.display='none'
                        })
                        
                    }
                    
                    callback_handle_location = (place, sel) => {
                        location_plot.style.display = ''
                        location_name.innerHTML = place.formatted_address
                        
                        var lat = Number(place.point.lat)
                        var lon = Number(place.point.lng)
                        var rad = 20000
                        console.log(place, lat, lon)
                        Gmaps(lat, lon, rad).then( (val) => {
                            gobj=val
                            
                            setTimeout( function () {   
                                console.log(gobj.data_places)
                                gmaps.plotSummaryCategories(val, 'places_plot'); 
                            }, 5000);
                            
                         })
                    }
                    
                    var nodes = document.querySelectorAll('.metric_filter')
                    for (var n of nodes){
                        n.addEventListener('input', ({ target }) => {
                              const value = target.value
                              const ide = 'options_'+target.id.split('_')[0]
                              const ide_div = target.id.split('_')[0]+'_auxiliary_fields'
                              if(value.length) {
                                 census.makeFilterVariableAutocomplete(cobj, value, ide, ide_div)
                              }
                        })
                    }
