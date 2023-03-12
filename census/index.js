function initCensus(){
                        //var lev = level_in.value
                        Census().then( (val) => {
                            cobj = val
                            census.makeFillVariableSelect(cobj, 'options_main')
                            census.makeFillVariableSelect(cobj, 'options_county')
                            
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
                            }, 2000);
                        } ) 
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
