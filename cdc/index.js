 function initCdc(){
                        
                        var ds = select_datasets.value
                        console.log(ds)
                        
                        //var lev = level_in.value
                        bfilter.value="Filtering ..."
                        bfilter.disabled=true
                        Cdc(ds).then( (val) => {
                            console.log(val)
                            cobj = val
                            
                            setTimeout( async function () { 
                                //await cdc.getDistinctValues(cobj, cobj.active_dataset.timeColumn, 'desc', 'select_year')
                                await cdc.makeFillIndicatorFilters(cobj, 'filters_context')
                                cdc.getDataGeneratePlotByQuestion(cobj, 'main_container', callback_handle_location_chosen).then( async (val) => {
                                    bfilter.value="Filter"
                                    bfilter.disabled=false
                                    
                                    cobj.chosen_location = cobj.resultsByQuestion.filter(el => el.id!=null)[0][cobj.active_dataset['locationField']]
                                    locinfo.innerHTML=cobj.chosen_location
                                    
                                    var dat = await cdc.getDataGeneratePlotByQuestionComparisonVariables(cobj, 'variable_comparison')
                                    if(Object.keys(dat).length==0){
                                        plots_comparison.style.display='none'
                                    }
                                    else{
                                        plots_comparison.style.display=''
                                    }
                                    
                                    cdc.vizFillDescriptionTable(cobj, 'filtered').then( (val) => {
                                        if(cobj.filteredDataDemographic!=null && cobj.filteredDataDemographic!=undefined){
                                            if(cobj.filteredDataDemographic['table'].length>0){
                                                area_filters.style.display=''
                                            }
                                        }
                                    })
                                } )
                            }, 500);
                        } ) 
                    }
                    
                    filterByQuestion = () => {
                        bfilter.value="Filtering ..."
                        bfilter.disabled=true
                        cdc.getDataGeneratePlotByQuestion(cobj, 'main_container', callback_handle_location_chosen).then( (val) => {
                            bfilter.value="Filter"
                            bfilter.disabled=false
                        } )
                    }
                    
                    callback_handle_location_chosen = async (data, selection) => {
                        var local=''
                        if(selection==null){
                            console.log( data.points[0])
                            local = data.points[0].text
                        }
                        else{
                            console.log( data.getValue( selection[0].row, 3) );
                            var local = data.getValue( selection[0].row, 3).split(' -> ')[0]
                        }
                        
                        if(local!=''){
                            cobj.chosen_location=local
                            locinfo.innerHTML=cobj.chosen_location
                            plots_comparison.style.display=''
                            await cdc.getDataGeneratePlotByQuestionComparisonVariables(cobj, 'variable_comparison')
                        }
                    }
