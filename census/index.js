function initCensus(){
                        //var lev = level_in.value
                        Census().then( (val) => {
                            cobj = val
                            census.makeFillVariableSelect(cobj, 'options_main')
                            census.makeFillVariableSelect(cobj, 'options_county')
                            census.makeFillVariableSelect(cobj, 'options_xaxis')
                            census.makeFillVariableSelect(cobj, 'options_yaxis')
                            
                            setTimeout( function () { 
                                var select_st = ''
                                var names=Object.keys(cobj.state_dict)
                                var i =0
                                names.forEach(el =>{
                                    var sel = i==0 ? 'selected' : ''
                                    select_st+=`<option value="${el}" ${sel} > ${el} </option>`
                                    i+=1
                                })
                                document.getElementById('select_states').innerHTML=select_st
                                
                                getMainPlot()
                                
                                getCountyPlot()
                                
                                document.getElementById('select_states_bivar').innerHTML=select_st
                                fillCountiesBivar()
                                options_yaxis.value='B18108'
                                census.makeFiltersVariableDetail(cobj, 'B18108', 'yaxis_auxiliary_fields')
                                
                                getBivariablePlot()
                                
                            }, 2000);
                        } ) 
                    }
                    
                    fillCountiesBivar = () => {
                        var state = document.getElementById('select_states_bivar').value
                        var htmls='<option value="All" selected > Only consider state </option>'
                        cobj.dict_counties_geo[state].forEach( el => {
                            if(el.code!=null){
                                htmls+=`<option value="${el.county}" > ${el.county} </option>`
                            }
                        })
                        document.getElementById('select_county_bivar').innerHTML=htmls
                    }
                    
                    callback_handle_state_chosen = async (data) => {
                        document.getElementById('county_container').style.display=''
                        state_in.innerHTML = cobj.chosen_state
                        select_states.value = cobj.chosen_state
                        
                        var metric = options_main.value
                        options_county.value = metric
                        census.makeFiltersVariableDetail(cobj, metric, 'county_auxiliary_fields')
                        
                        var fil = []
                        var nodes_counties = document.querySelectorAll('.filter_county')
                        var i=0
                        document.querySelectorAll('.filter_main').forEach( el => { 
                            fil.push(el.value); 
                            nodes_counties[i].value = el.value; 
                            i+=1; 
                        } )
                        fil=fil.join('|')
                        await census.getCountyByStatePlot(cobj, fil, metric, 'map_county')
                    }
                    
                    getBivariablePlot =  () => {
                        document.getElementById('bivar_container').style.display=''
                        
                        var query=[]
                        
                        var metricx = options_xaxis.value
                        var fil = []
                        document.querySelectorAll('.filter_xaxis').forEach( el => { fil.push(el.value) } )
                        var variable_queryx=fil.join('|')
                        var vrbs=cobj.census_variables.filter( el => el.global_var == metricx )
                        vrbs=vrbs[0]
                        if( Object.keys(vrbs.variable_filters.retrieval_dict).includes(variable_queryx) ) {
                            query.push( vrbs.variable_filters.retrieval_dict[variable_queryx] )
                        }
                        
                        var metricy = options_yaxis.value
                        var fil = []
                        document.querySelectorAll('.filter_yaxis').forEach( el => { fil.push(el.value) } )
                        var variable_queryy=fil.join('|')
                        var vrbs=cobj.census_variables.filter( el => el.global_var == metricy )
                        vrbs=vrbs[0]
                        if( Object.keys(vrbs.variable_filters.retrieval_dict).includes(variable_queryy) ) {
                            query.push( vrbs.variable_filters.retrieval_dict[variable_queryy] )
                        }
                        
                        if( (metricx!=metricy) || ( metricx==metricy && variable_queryx!=variable_queryy ) ){
                            var title_x = metricx+' ('+variable_queryx+')'
                            var title_y = metricy+' ('+variable_queryy+')'
                            
                            var county = select_county_bivar.value
                            var res = null
                            if(county=='All'){
                                cobj.chosen_state = select_states_bivar.value
                                cobj.chosen_county_metric=query
                                res = census.getDataCountyByState(cobj)
                            }
                            else{
                                cobj.chosen_state = select_states_bivar.value
                                cobj.chosen_county = county
                                cobj.chosen_subdivision_metric=query
                                res = census.getDataSubdivisionByStateAndCounty(cobj)
                            }
                            
                            res.then( (table) => {
                                if(table.length>0){
                                    var container = 'plot_bivar'
                                    console.log(query, title_x, title_y, container)
                                    census.generateBivariablePlot(cobj, table, query, title_x, title_y, container)
                                    
                                }
                                else{
                                    alert('There is no data to plot')
                                }
                            })
                        }
                        else{
                            alert('Choose distinct variables for X and Y axis')
                        }
                    }
                    
                    getCountyPlot = () => {
                        document.getElementById('county_container').style.display=''
                        cobj.chosen_state = document.getElementById('select_states').value
                        state_in.innerHTML = cobj.chosen_state
                        
                        var metric = options_county.value
                        var fil = []
                        document.querySelectorAll('.filter_county').forEach( el => { fil.push(el.value) } )
                        fil=fil.join('|')
                        census.getCountyByStatePlot(cobj, fil, metric, 'map_county')
                    }
                    
                    getMainPlot = () => {
                        var metric = options_main.value
                        var fil = []
                        document.querySelectorAll('.filter_main').forEach( el => { fil.push(el.value) } )
                        fil=fil.join('|')
                        console.log( fil, metric)
                        census.getMainDemographyData(cobj, fil, metric, 'map_main', callback_handle_state_chosen ).then( (val) => {})
                    }
                    
                    var nodes = document.querySelectorAll('.metric_filter')
                    for (var n of nodes){
                        n.addEventListener('input', ({ target }) => {
                              const value = target.value
                              const ide = 'options_'+target.id.split('_')[0]
                              if(value.length) {
                                 census.makeFilterVariableAutocomplete(cobj, value, ide)
                              }
                        })
                    }
