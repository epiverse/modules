function initCensus(){
                        census.makeFillYearSelect('select_year')
                        var year = select_year.value
                        
                        //var lev = level_in.value
                        Census(year).then( (val) => {
                            cobj = val
                            
                            census.makeFillVariableSelect(cobj, 'options_county', 'county_auxiliary_fields')
                            
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
