console.log('cdc.js loaded')

/* Initializes object with default example parameters */

/**
 * Main global portable module.
 * @namespace 
 * @property {Function} Cdc - {@link Cdc}
 *
 * @namespace cdc
 * @property {Function} getStateCodeMap - {@link cdc.getStateCodeMap}
 * @property {Function} getDatasets - {@link cdc.getDatasets}
 * @property {Function} makeFillSelectDatasets - {@link cdc.makeFillSelectDatasets}
 * @property {Function} getDistinctValues - {@link cdc.getDistinctValues}
 * @property {Function} getIndicatorValues - {@link cdc.getIndicatorValues}
 * @property {Function} changeIndicatorSelect - {@link cdc.changeIndicatorSelect}
 * @property {Function} makeFillIndicatorFilters - {@link cdc.makeFillIndicatorFilters}
 * @property {Function} getDataGeneratePlotByQuestion - {@link cdc.getDataGeneratePlotByQuestion}
 * @property {Function} filterDataWithQuestionByState - {@link cdc.filterDataWithQuestionByState}
 * @property {Function} generatePlotState - {@link cdc.generatePlotState}
 * @property {Function} generatePlotByCoordinate - {@link cdc.generatePlotByCoordinate}
 * @property {Function} loadScript - {@link cdc.loadScript}
 */
 
 
 /**
 *
 *
 * @object Cdc
 * @attribute {string} datasetId CDC Dataset identifier for analysis.
 * @attribute {string} chosen_location Chosen location for analysis
 * @attribute {number} year Chosen year for analysis
 * @attribute {array} datasets List of available Datasets.
 * @attribute {object} active_dataset Object with chosen dataset's information.
 * @attribute {Object} state_dict States dictionary to map state name to abbreviated code.
 * @attribute {Object} state_dict_reverse States dictionary to map state abbreviated code to name.
 */


/** 
* Initializes the Cdc Library object
* 
*
* @param {string} [dataset=pttf-ck53] Dataset for analysis
*
* @returns {Object} Cdc library object.
* 
* @example
* let v = await Cdc('hn4x-zwk7')
*/
async function Cdc (datasetId){
    var object = { datasetId: datasetId, chosen_location: ''}
    //var dt = await cdc.getDatasets()
    //await cdc.getIndicatorValues(object)
    var temp = await Promise.all( [ cdc.getDatasets(object), cdc.getIndicatorValues(object), cdc.getStateCodeMap(object) ] )
    var state_dict_rev = {}
    Object.keys(object.state_dict).forEach( el => { state_dict_rev[ object.state_dict[el] ] = el } )
    object.state_dict_reverse = state_dict_rev
    
    /*
    var dt = temp[0]
    object.datasets = dt
    object.active_dataset = dt.filter( el => el.resourceId==datasetId )[0]
    */
    
    return object
}

let cdc = {}

// https://chronicdata.cdc.gov/resource/pttf-ck53.json?$select=distinct%20Question,%20Topic,%20Response&$order=Question&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO

// https://chronicdata.cdc.gov/resource/hn4x-zwk7.json?$select=distinct%20LocationDesc,YearStart,%20question,%20StratificationCategory1,%20Stratification1,%20Data_Value&$where=LocationDesc=%27Alaska%27%20and%20StratificationCategory1=%27Total%27&$order=YearStart&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO


/** 
* Load states dictionary from name to code
* 
* 
* @param {Object} cobject Cdc library object.
* 
* @example
* await cdc.getDatasets()
*/
cdc.getStateCodeMap = async function (cobject){
    var server = (location.href.indexOf('/cdc')==-1 ) ? location.href.split('#')[0]+'cdc/' : location.href.split('#')[0]
    var temp = await fetch(server+'convert_state_in_codes.json')
    cobject.state_dict = await temp.json()
    
    return cobject.state_dict
}

/** 
* Load datasets
* 
* 
* @returns {object} Chosen dataset object
* 
* @example
* await cdc.getDatasets()
*/
cdc.getDatasets = async function (cobject){
    var dat = await fetch(location.href.split('#')[0]+'selected_datasets.json')
    dat = await dat.json()
    if(cobject!=null){
        cobject.datasets = dat
        cobject.active_dataset = dat.filter( el => el.resourceId==cobject.datasetId )[0]
    }
    
    return dat
}

/** 
* Get names of available datasets for demonstration and fill select
* 
* @param {string} container Container identifier
*
* 
* @returns {array} Data table with data retrieved from Cdc API
* 
* @example
* await cdc.makeFillSelectDatasets('select_datasets')
*/
cdc.makeFillSelectDatasets = async function (container){
    var dat = await cdc.getDatasets(null)
    
    var htmls = ''
    dat.forEach( el => { htmls+=`<option value="${el.resourceId}" > ${el.name} </option>` } )
    document.getElementById(container).innerHTML = htmls
}


/** 
* Get distinct values of variables to fill filter selections
* 
* @param {Object} cobject Cdc library object.
* @param {string} field Field name
* @param {string} orderType Order type (asc or desc)
* @param {string} container Container identifier
*
* 
* @returns {array} List of values of chosen column
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.getDistinctValues(v, 'Year', 'desc', 'select_year')
*/
cdc.getDistinctValues = async function (cobject, field, orderType, container){
    var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${field}&$order=${field} ${orderType}&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    content=await res.json()
    
    var treated = []
    var htmls=''
    var i=0
    content.forEach( el => {
        treated.push( el[field] )
        var sel = (i==0) ? 'selected' : ''
        htmls+=`<option value="${el[field]}" ${sel} >${el[field]}</option>`
        i+=1
    })
    
    document.getElementById(container).innerHTML=htmls
    
    return treated
}

/** 
* Get and organize Indicator variable values
* 
* @param {Object} cobject Cdc library object.
*
* 
* @returns {array} Indicator, measure and questions from CDC dataset
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.getIndicatorValues(v)
*/
cdc.getIndicatorValues = async function (cobject){
    if(cobject.active_dataset==undefined){
        await cdc.getDatasets(cobject)
    }

    var cols=["organizationTopic", "organizationQuestion", "organizationResponse", "organizationYear"]
    var mapCols=[]
    for (var c of cols){
        var mapped = cobject.active_dataset[ c ]
        if( mapped != ""){
            mapCols.push(mapped)
        }
    }
    var field = mapCols.join(',')
    var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${field}&$order=${mapCols[0]} asc,${mapCols[mapCols.length-1]} desc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    var content=await res.json()
    
    var treated = content.filter( el => Object.keys(el).length>0 )
    cobject.dtIndicators=treated
    
    return treated
}

/** 
* Filter questions/measures and responses collected from CDC and returns the values for the category
* 
* @param {Object} cobject Cdc library object.
* @param {string} search Search value to filter
* @param {string} searchColumn Search Column corresponding to the search value
* @param {string} targetColumn Target Column to generate the option values
* @param {string} container Target container identifier to fill a select with the values options
*
* 
* @returns {string} HTML content with the options
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.changeIndicatorSelect(v, 'Age', 'Topic', 'Question', 'selectQuestion')
*/
cdc.changeIndicatorSelect = function (cobject, search, searchColumn, targetColumn, container){
    var dt=[]; 
    cobject.dtIndicators.filter(el => el[searchColumn]==search).forEach( e => { if( ! dt.includes(e[targetColumn]) ){ dt.push(e[targetColumn]) } } )
    
    var htmls = ''
    dt.forEach(el => {
        if(el!=undefined){
            htmls+=`<option value="${el}" > ${el.replace(' (variable calculated from one or more BRFSS questions)','')} </option>`
        }
    })
    
    if(htmls==''){
        htmls+='<option value="All" >All</option>'
    }
    
    if(container!=null){
        document.getElementById(container).innerHTML=htmls
    }   
    
    return htmls
}

/** 
* Build the form section containing the topics, questions/measures and responses collected from CDC and returns the values for the category
* 
* @param {Object} cobject Cdc library object.
* @param {string} container Container identifier to fill a select with the values options
*
* 
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.makeFillIndicatorFilters(v, 'filters_context')
*/
cdc.makeFillIndicatorFilters = function (cobject, container){
    document.getElementById(container).innerHTML='Loading ...'

    var revmap={}
    var cols=["organizationTopic", "organizationQuestion", "organizationResponse", "organizationYear"]
    for (var c of cols){
        var mapped = cobject.active_dataset[ c ]
        if( mapped != ""){
            revmap[mapped]=c
        }
    }
    
    var htmls=""
    var keys = Object.keys(revmap)
    var i =0
    var contents={}
    var ant = ""
    for (var k of keys){
        var aux = ant
        
        var label = revmap[k].replace('organization','')
        
        var values = []
        cobject.dtIndicators.forEach( el => { if( ! values.includes( el[keys[i]] ) ) { values.push( el[keys[i]] ) } })
        
        if(aux==''){
            values.forEach(el => {
                aux+=`<option value="${el}" > ${el} </option>`
            })   
        }
           
        var actions=[]
        if(i != keys.length-1){
            var nextLabel = revmap[ keys[i+1] ].replace('organization','')
            
            var j = i
            while( j<= keys.length-2){
                var curLabel = revmap[ keys[j] ].replace('organization','')
                var auxLabel = revmap[ keys[j+1] ].replace('organization','')
                actions.push( `cdc.changeIndicatorSelect(cobj, select${curLabel}.value, '${keys[j]}', '${keys[j+1]}', 'select${auxLabel}')` )
                j+=1    
            }
            
        } 
        var action = actions.length==0 ? "" : `onChange="${actions.join(';')};"`
        
        if(aux!=''){
            htmls += `
                <div style="display: inline-block;" >
                    <label class="fields mr-2" style="text-align: right;" >${label}:</label>
                    <select class="form-control mr-3" id="select${label}" ${action} > ${aux} </select>
                </div>
            `
        }
        
        if(i != keys.length-1){
            ant = cdc.changeIndicatorSelect(cobject, values[0], k, keys[i+1], null)
         }
         
        //contents['select'+nextLabel] = ant
        
        i+=1
    }
    document.getElementById(container).innerHTML=htmls
}

/** 
* Get data and Generate plot by question
* 
* @param {Object} cobject Cdc library object
* @param {string} container COntainer identifier to draw the plot
* @param {Function} callback_handle Callback to handle chosen location [Optional]
*
* 
* @example
* let v = await Cdc()
* let callback = (data) => { console.log(data.points[0]);  }
* await cdc.getDataGeneratePlotByQuestion(v, 'main_container', callback)
*/
cdc.getDataGeneratePlotByQuestion = async function (cobject, container, callback_handle){
    var dat = await cdc.filterDataWithQuestionByState(cobject)
    
    var flagCoordinate = dat[0]
    if (flagCoordinate){
        await cdc.generatePlotByCoordinate(cobject, container, dat[1][0], callback_handle)
    }
    else{
        await cdc.generatePlotState(cobject, container, callback_handle)
    }
}

/** 
* Get data and Generate plot by question comparing variables 
* 
* @param {Object} cobject Cdc library object
* @param {string} container Container identifier to draw the plot
*
* 
* @example
* let v = await Cdc()
* await cdc.getDataGeneratePlotByQuestionComparisonVariables(v, 'variable_comparison')
*/
cdc.getDataGeneratePlotByQuestionComparisonVariables = async function (cobject, container){
    var comparison_variables_data = await cdc.filterDataWithQuestionComparisonVariables(cobject)
    
    if ( Object.keys(comparison_variables_data).length>0){
        cdc.generatePlotErrorBarComparisonVariable(cobject, comparison_variables_data, container)
    }
}

/** 
* Get data from cdc according to topics, questions and responses by state/location considering the overall statistics of demographic variables (age, gender, race, income, education, etc)
* 
* @param {Object} cobject Cdc library object.
*
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.filterDataWithQuestionByState(v)
*/
cdc.filterDataWithQuestionByState = async function(cobject){
    var cols=["organizationTopic", "organizationQuestion", "organizationResponse", "organizationYear"]
    var mapCols=[]
    var whereValue=[]
    // whereValue.push( `${cobject.active_dataset['timeColumn']}='${cobject.year}'` )
    for (var c of cols){
        var mapped = cobject.active_dataset[ c ]
        if( mapped != ""){
            var label = c.replace('organization','')
            mapCols.push(mapped)
            var value = eval('select'+label).value.replace('+','%2b')
            if(value!="All"){
                whereValue.push(`${mapped}='${ value }'`)
            }
        }
    }
    if(cobject.active_dataset['filter_total']!=""){
        var field=''
        if( cobject.active_dataset['filter_general']!='' ){
            field=cobject.active_dataset['filter_general']
            whereValue.push(`${field}='${cobject.active_dataset['filter_total']}'`)
        }
        else{
            if( cobject.active_dataset['filters_available'].length > 0 ){
                var i =0
                for (var c of cobject.active_dataset['filters_available']){
                    whereValue.push(`${c}='${ cobject.active_dataset['filters_mask_total'][i] }'`)
                    i+=1
                }
            }
        }
    }
    whereValue = whereValue.join(' and ')
    
    var flagCoordinate=false
    var selectValue=[ cobject.active_dataset['locationField'], cobject.active_dataset['yValue'], cobject.active_dataset['lowLimit'], cobject.active_dataset['highLimit'] ]
    if( cobject.active_dataset['geo'] != ""){
        selectValue.push( cobject.active_dataset['geo'].split(':')[0] )
        if( cobject.active_dataset['stateField'] != "" && cobject.active_dataset['stateField'] != cobject.active_dataset['locationField'] ){
            selectValue.push( cobject.active_dataset['stateField'] ) 
        }
        flagCoordinate = true
    }
    selectValue = selectValue.join(',')
    
    console.log(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${whereValue}&$order=${cobject.active_dataset['locationField']} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    
    var field = mapCols.join(',')
    var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${whereValue}&$order=${cobject.active_dataset['locationField']} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    var content=await res.json()
    content = content.filter( el => Object.keys(el).length>1 )
    
    var states = []
    var treated=[]
    content.forEach( el => {
        var aux = el
        var flag = true
        if( Object.keys(el).length == selectValue.split(',').length ){
            if( cobject.active_dataset['geo'] != ""){
                var geof = cobject.active_dataset['geo'].split(':')[0]
                if( cobject.active_dataset['geo'].indexOf('coordinate')!=-1 ){
                    aux['lat'] = Number(el[geof]['coordinates'][1])
                    aux['lon'] = Number(el[geof]['coordinates'][0])
                }
                if( cobject.active_dataset['geo'].indexOf('latitude')!=-1 ){
                    aux['lat'] = Number(el[geof]['latitude'])
                    aux['lon'] = Number(el[geof]['longitude'])
                }
                
                if( cobject.active_dataset['stateField'] != ""){
                    var state = el[cobject.active_dataset['stateField']]
                    if( Object.keys( cobject.state_dict ).includes(state) ){
                        aux['id'] = cobject.state_dict[ state ]
                        aux['name'] = el[ cobject.active_dataset['locationField'] ]
                        aux['result'] = Number(el[ cobject.active_dataset['yValue'] ])
                        aux['result_min'] = Number(el[ cobject.active_dataset['lowLimit'] ])
                        aux['result_max'] = Number(el[ cobject.active_dataset['highLimit'] ])
                        aux['infoTooltip'] = `${el[ cobject.active_dataset['locationField'] ]} -> ${aux['name']}: ${aux['result']}% <br /> <strong>Min: </strong>${aux['result_min']}% - <strong>Max: </strong>${aux['result_max']}%`
                        if( ! states.includes(aux['id']) ){
                            states.push( aux['id'] )
                        }
                    }
                    else{
                        flag=false
                    }
                }
                else{
                    aux['id'] = el[ cobject.active_dataset['locationField'] ].split(' ')[1]
                    aux['name'] = el[ cobject.active_dataset['locationField'] ].split(' ')[0].replace(',', '')
                    aux['result'] = Number(el[ cobject.active_dataset['yValue'] ])
                    aux['result_min'] = Number(el[ cobject.active_dataset['lowLimit'] ])
                    aux['result_max'] = Number(el[ cobject.active_dataset['highLimit'] ])
                    aux['infoTooltip'] = `${el[ cobject.active_dataset['locationField'] ]} -> ${aux['name']}: ${aux['result']}% <br /> <strong>Min: </strong>${aux['result_min']}% - <strong>Max: </strong>${aux['result_max']}%`
                    if( ! states.includes(aux['id']) ){
                        states.push( aux['id'] )
                    }
                }
            }
            else{
                var state = el[cobject.active_dataset['locationField']]
                if( Object.keys( cobject.state_dict ).includes(state) ){
                    aux['id'] = cobject.state_dict[ state ]
                    aux['name'] = el[ cobject.active_dataset['locationField'] ]
                    aux['result'] = Number(el[ cobject.active_dataset['yValue'] ])
                    aux['result_min'] = Number(el[ cobject.active_dataset['lowLimit'] ])
                    aux['result_max'] = Number(el[ cobject.active_dataset['highLimit'] ])
                }
                else{
                    flag=false
                }
            }
        }
        else{
            flag=false
        }
        
        if(flag){
            treated.push(aux)
        }
    })
    var treated = content.filter( el => Object.keys(el).length>1 )
    cobject.resultsByQuestion=treated
    cobject.statesByQuestion=states
    
    return [flagCoordinate, states, treated]
}

/** 
* Get data from cdc according to topics, questions and responses by state/location with comparison across demographic variables (age, gender, race, income, education, etc)
* 
* @param {Object} cobject Cdc library object.
*
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* var comparison_variables_data = await cdc.filterDataWithQuestionComparisonVariables(v)
*/
cdc.filterDataWithQuestionComparisonVariables = async function(cobject){
    var cols=["organizationTopic", "organizationQuestion", "organizationResponse", "organizationYear"]
    var mapCols=[]
    var whereValue=[]
    // whereValue.push( `${cobject.active_dataset['timeColumn']}='${cobject.year}'` )
    for (var c of cols){
        var mapped = cobject.active_dataset[ c ]
        if( mapped != ""){
            var label = c.replace('organization','')
            mapCols.push(mapped)
            var value = eval('select'+label).value.replace('+','%2b')
            if(value!="All"){
                whereValue.push(`${mapped}='${ value }'`)
            }
        }
    }
    
    var treated={}
    
    if( cobject.active_dataset['filter_general']!='' && cobject.active_dataset['filter_value_general']!='' ){
         var auxWhereValue = whereValue
         
         auxWhereValue.push( `${cobject.active_dataset['locationField']}='${cobject.chosen_location}'` )
         if(cobject.active_dataset['filter_total']!=""){
            var field=''
            if( cobject.active_dataset['filter_general']!='' ){
                field=cobject.active_dataset['filter_general']
                auxWhereValue.push(`${field} != '${cobject.active_dataset['filter_total']}'`)
            }
        }
        auxWhereValue = auxWhereValue.join(' and ')
        
        var selectValue=[ cobject.active_dataset['filter_general'], cobject.active_dataset['filter_value_general'], cobject.active_dataset['yValue'], cobject.active_dataset['lowLimit'], cobject.active_dataset['highLimit'] ]
        selectValue = selectValue.join(',')
        
        console.log(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${auxWhereValue}&$order=${cobject.active_dataset['filter_general']} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
        
        var field = mapCols.join(',')
        var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${auxWhereValue  }&$order=${cobject.active_dataset['filter_general']} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
        var content=await res.json()
        content = content.filter( el => Object.keys(el).length>1 )
        
        treated={}
        content.forEach( el => {
            if( Object.keys(el).length == selectValue.split(',').length ){
                var variable = el[ cobject.active_dataset['filter_general'] ]
                var variable_name = el[ cobject.active_dataset['filter_value_general'] ]
                var y = Number(el[ cobject.active_dataset['yValue'] ])
                var miny = Number(el[ cobject.active_dataset['lowLimit'] ])
                var maxy = Number(el[ cobject.active_dataset['highLimit'] ])
                
                if(! Object.keys(treated).includes(variable) ){
                    treated[variable]={}
                }
                treated[variable][variable_name]=[y, miny, maxy]
            }
        })
    }
     
    if( cobject.active_dataset['filters_available'].length > 0  && cobject.active_dataset['filter_general']=='' ){
        treated={}
        var mapp = {}
        var i =0
        for (var c of cobject.active_dataset['filters_available']){
            mapp[ c ] = cobject.active_dataset['filters_mask_total'][i]
            i+=1
        }
        
        var i =0
        for (var c of cobject.active_dataset['filters_available']){
            treated[c]={}
            var auxWhereValue = whereValue.slice()
            console.log(auxWhereValue)
            auxWhereValue.push( `${cobject.active_dataset['locationField']}='${cobject.chosen_location}'` )
         
            var j=0
            for (var col of cobject.active_dataset['filters_available']){
                if(c!=col){
                    auxWhereValue.push(`${col} = '${ cobject.active_dataset['filters_mask_total'][j] }'`)
                }
                j+=1
            }
            auxWhereValue.push(`${c} != '${ cobject.active_dataset['filters_mask_total'][i] }'`)
            auxWhereValue = auxWhereValue.join(' and ')
            
            var selectValue=[ c, cobject.active_dataset['yValue'], cobject.active_dataset['lowLimit'], cobject.active_dataset['highLimit'] ]
            selectValue = selectValue.join(',')
            
            console.log(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${auxWhereValue}&$order=${c} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
            
            var field = mapCols.join(',')
            var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${auxWhereValue}&$order=${c} asc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
            var content=await res.json()
            content = content.filter( el => Object.keys(el).length>1 )
            
            content.forEach( el => {
                if( Object.keys(el).length == selectValue.split(',').length ){
                    var variable_name = el[c]
                    if(variable_name != cobject.active_dataset['filters_mask_total'][i] ){
                        var y = el[ cobject.active_dataset['yValue'] ]
                        var miny = el[ cobject.active_dataset['lowLimit'] ]
                        var maxy = el[ cobject.active_dataset['highLimit'] ]
                        
                        treated[c][variable_name]=[y, miny, maxy]
                    }
                    
                }
            })
            
            i+=1
        }
    }
    
    return treated
}

/** 
* Generate plots data from cdc according to topics, questions and responses by state/location with comparison across demographic variables (age, gender, race, income, education, etc)
* 
* @param {Object} cobject Cdc library object.
* @param {Object} variable_data Comparison data object organized by dimensions (age, income, gender, race) and its variations (male, female, hispanic, latino, etc.)
* @param {string} container Container identifier to draw the plot
*
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* var comparison_variables_data = await cdc.filterDataWithQuestionComparisonVariables(v)
* cdc.generatePlotErrorBarComparisonVariable(v, comparison_variables_data, 'variable_comparison')
*/
cdc.generatePlotErrorBarComparisonVariable = function(cobject, variable_data, container){
    eval(container).style.display='none'
    
    var htmls=""
    for (var k of Object.keys(variable_data)){
        var label = k.toLowerCase().replace(' ','_').replace('(','_').replace(')','_')
        htmls+=`
            <div class="col-12" >
                <h4 >Compare prevalence across ${k} values</h4>
                <div id="plot_${label}" ></div>
            </div>
        `
    }
    eval(container).innerHTML=htmls
    
    for (var k of Object.keys(variable_data)){
        var x = Object.keys(variable_data[k])
        var y = [] 
        var ymin = []
        var ymax = []
        for(var v of x){
            y.push( variable_data[k][v][0] )
            ymin.push( variable_data[k][v][0] - variable_data[k][v][1] )
            ymax.push( variable_data[k][v][2] - variable_data[k][v][0] )
        }
        //console.log(k, variable_data[k][v], y, ymin, ymax)
        
        var data = [
          {
            x: x,
            y: y,
            text: y,
            error_y: {
              type: 'data',
              symmetric: false,
              array: ymax,
              arrayminus: ymin
            },
            type: 'bar'
          }
        ];
        
        var layout = {
              xaxis: {
                title: {
                  text: k+' Variations'
                },
              },
              yaxis: {
                title: {
                  text: 'Prevalence (%)'
                }
              }
            };
        
        var label = k.toLowerCase().replace(' ','_').replace('(','_').replace(')','_')
        Plotly.newPlot('plot_'+label, data, layout);
    }
    eval(container).style.display=''
}


/** 
* Generate plot in the state scope of the cloropleth map
* 
* @param {Object} cobject Cdc library object
* @param {string} container Container identifier to draw the plot
* @param {Function} callback_handle_state Callback to handle chosen state [Optional]
*
* 
* @example
* let v = await Cdc()
* let dat = await cdc.filterDataWithQuestionByState(v)
* let callback = (data) => { console.log(data.points[0]);  }
* await cdc.generatePlotState(v, 'main_container', callback)
*/
cdc.generatePlotState = async function (cobject, container, callback_handle_state){
    document.getElementById(container).style.display='none'
    var table = cobject.resultsByQuestion
    
    if(table.length>0){
        var locations = table.map( el => { return el['id'] } )
        var captions = table.map( el => { return el['name'] } )
        var y = table.map( el => { return isNaN(el['result']) ? 0 : el['result'] } )
        
        var data = [{
              type: 'choropleth',
              locationmode: 'USA-states',
              locations: locations,
              z: y,
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
          
          document.getElementById(container).style.display=''
          var htmls = `
            <h4 > Plot by Questions </h4>
            <div id="map_${container}" ></div>
          `
          document.getElementById(container).innerHTML=htmls
          
          Plotly.newPlot( 'map_'+container, data, layout, {showLink: false})
          .then( gd => {
             gd.on('plotly_click', async function(data){
                if(callback_handle_state!=null && callback_handle_state!=undefined){
                    await callback_handle_state(data, null)
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
* Generate plot by coordinates of the google geo chart
* 
* @param {Object} cobject Cdc library object
* @param {string} container Container identifier to draw the plot
* @param {string} state_abv State abbreviation to zoom the state area in google geochart
* @param {Function} callback_handle_state Callback to handle chosen state [Optional]
*
* 
* @example
* let v = await Cdc('j32a-sa6u')
* let dat = await cdc.filterDataWithQuestionByState(v)
* let callback = (data, selection) => { console.log( data.getValue( selection[0].row, 3).split('<br />')[0] );  }
* await cdc.generatePlotByCoordinate(v, 'main_container', callback)
*/
cdc.generatePlotByCoordinate = function (cobject, container, state_abv, callback_handle){
    document.getElementById(container).style.display='none'
    
    var tableAll = cobject.resultsByQuestion
    var states = cobject.statesByQuestion
    
    var scope='US-'+state_abv
    var options = {
        tooltip: {trigger: focus},
        displayMode: 'markers',
        region: scope,
        resolution: "provinces",
        tooltip: {
            isHtml: true
        }
    };
    var flagAll = false
    states.forEach( s => { if(! Object.keys( cobject.state_dict_reverse ).includes(s)){ flagAll=true } })
    if(flagAll){
        scope='US'
        options.region= scope
        options.colorAxis= {colors: ['green', 'blue']}
        //options.displayMode= 'markers'
    }
    
    if(tableAll.length>0){
        
        var dat_plot = [ ['lat', 'lng', 'Metric', {role: 'tooltip', p:{html:true}} ] ]
        if(! flagAll){
            table = tableAll.filter( el => el.id==state_abv )
        }
        else{
            table=tableAll
        }
        
        var ids=[]
        table.forEach(e => {
            if(! ids.includes(e.name) ){
                ids.push(e.name)
                dat_plot.push( [ Number(e.lat), Number(e.lon), e.result, `${e.infoTooltip}` ] )
            }
        })
        
        google.charts.load('current', {
            callback: function (){
                var data = google.visualization.arrayToDataTable( dat_plot )
                
                var view = new google.visualization.DataView(data);
                //view.setColumns([0, 1, 2, 3]);

                
                
                document.getElementById(container).style.display=''
              var states_html = ``
              var states_filter = ''
              
              if(! flagAll){
                  states.forEach( s => { 
                    var sel = (s==state_abv) ? 'selected' : ''
                    states_html+=`<option value="${s}" ${sel} > ${ cobject.state_dict_reverse[s] } </option>` 
                  } )
                  
                  states_filter+=`
                    <div style="display: inline-block;" >
                        <label class="fields mr-2" style="text-align: right;" > Select the state:</label>
                        <select class="form-control mr-3" id="selectState" onChange="cdc.generatePlotByCoordinate(cobj, '${container}', this.value, callback_handle_location_chosen)" > ${states_html} </select>
                    </div>
                  `
              }
              
              var htmls = `
                <h4 style="width: 100%;" > Plot by Questions </h4>
                
                ${states_filter}
                
                <div id="map_${container}"  style="width: 800px; height: 600px;" ></div>
              `
              document.getElementById(container).innerHTML=htmls
              
              var cont = document.getElementById( 'map_'+container )
                var chart = new google.visualization.GeoChart(cont);
                
                google.visualization.events.addListener(chart, 'select', async function () {
                  var selection = chart.getSelection();
                  if (selection.length > 0) {
                    
                    if( callback_handle!=null && callback_handle!=undefined ){
                        await callback_handle(data, selection)
                    }
                    
                    //window.open('http://' + data.getValue(selection[0].row, 2), '_blank');
                  }
                });

                chart.draw(view, options);
                
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
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* cdc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
cdc.loadScript = async function(url){
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
	cdc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}
