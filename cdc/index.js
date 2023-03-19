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
                                cdc.getDataGeneratePlotByQuestion(cobj, 'main_container', callback_handle_location_chosen).then( (val) => {
                                    bfilter.value="Filter"
                                    bfilter.disabled=false
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
                        if(selection==null){
                            console.log( data.points[0])
                        }
                        else{
                            console.log( data.getValue( selection[0].row, 1), data.getValue( selection[0].row, 2) );
                        }
                    }
