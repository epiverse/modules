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
 * @property {Function} filterDataByDemographicVariable - {@link cdc.filterDataByDemographicVariable}
 * @property {Function} getDemographicVariableValues - {@link cdc.getDemographicVariableValues}
 * @property {Function} fillDemographicVariableFilters - {@link cdc.fillDemographicVariableFilters}
 * @property {Function} changeDemographicValuesSelect - {@link cdc.changeDemographicValuesSelect}
 * @property {Function} vizFillDescriptionTable - {@link cdc.vizFillDescriptionTable}
 * @property {Function} vizChangePage - {@link cdc.vizChangePage}
 * @property {Function} changeIndicatorSelect - {@link cdc.changeIndicatorSelect}
 * @property {Function} makeFillIndicatorFilters - {@link cdc.makeFillIndicatorFilters}
 * @property {Function} getDataGeneratePlotByQuestion - {@link cdc.getDataGeneratePlotByQuestion}
 * @property {Function} getDataGeneratePlotByQuestionComparisonVariables - {@link cdc.getDataGeneratePlotByQuestionComparisonVariables}
 * @property {Function} filterDataWithQuestionByState - {@link cdc.filterDataWithQuestionByState}
 * @property {Function} filterDataWithQuestionComparisonVariables - {@link cdc.filterDataWithQuestionComparisonVariables}
 * @property {Function} generatePlotErrorBarComparisonVariable - {@link cdc.generatePlotErrorBarComparisonVariable}
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
* Filter data by demographic variable values
* 
* @param {Object} cobject Cdc library object
* @param {Object} filters Filters object where the keys are the fields and the values are those selected by the user, if null, it will return the overall
* @param {boolean} flagUpdateTable Signal to get new filtered data and update visualization table
* @param {boolean} flagFiltersBySelect Signal to get the filter values from the select previously mounted
*
* 
* @returns {Object} Columns and array of data table containing place, y value, low and high confidence limit
* 
* @example
* let v = await Cdc('wsas-xwh5')
* await cdc.filterDataByDemographicVariable(v, {'Age': 'All Ages', 'Gender': 'Female', 'Race': 'All Races', 'Education': 'All Grades' },false, false )
*/
cdc.filterDataByDemographicVariable = async function (cobject, filters, flagUpdateTable, flagFiltersBySelect){
    if(cobject.active_dataset==undefined){
        await cdc.getDatasets(cobject)
    }

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
    
    if(flagFiltersBySelect){
        var filters={}
        if(cobject.active_dataset['filter_general']!=""){
            filters[ cobject.active_dataset['filter_general'] ] = selectVariable.value
            filters[ cobject.active_dataset['filter_value_general'] ] = document.getElementById('selectValue').value
        }
        else{
            if( cobject.active_dataset['filters_available'].length>0 ){
                for (var c of cobject.active_dataset['filters_available'] ){
                    var label = c.toLowerCase().replace(' ','_').replace('(','_').replace(')','_')
                    filters[c] = eval('select_'+label).value
                }
            }
        }
    }
    
    if(filters==null){
        if(cobject.active_dataset['filter_total']!=""){
            var field=''
            if( cobject.active_dataset['filter_value_general']!='' ){
                field=cobject.active_dataset['filter_value_general']
                if( cobject.active_dataset['filter_total'] != "None"){
                    whereValue.push(`${field}='${cobject.active_dataset['filter_total']}'`)
                }
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
    }
    else{
        for (var k of Object.keys(filters) ){
            whereValue.push(`${k} = '${filters[k]}'`)
        }
    }
    
    whereValue = whereValue.join(' and ')
    
    var columns=['Location', 'Prevalence (%)', 'Low Value', 'High Value']
    
    var selectValue=[ cobject.active_dataset['locationField'], cobject.active_dataset['yValue'], cobject.active_dataset['lowLimit'], cobject.active_dataset['highLimit'] ]
    selectValue = selectValue.join(',')
    
    console.log(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${whereValue}&$order=${cobject.active_dataset['yValue']} desc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    
    var field = mapCols.join(',')
    var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$where=${whereValue}&$order=${cobject.active_dataset['yValue']} desc&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
    var content=await res.json()
    var ids=[]
    var treated=[]
    content=content.filter( el => Object.keys(el).length == selectValue.split(',').length )
    content.forEach( el => {
        if( ! ids.includes(el[ cobject.active_dataset['locationField'] ]) ){
            ids.push( el[ cobject.active_dataset['locationField'] ] )
            treated.push(el)
        }
    })
    
    var result = {'columns': columns, 'table': treated}
    cobject.filteredDataDemographic=result
    
    if(flagUpdateTable){
        cobject.hits = result['table']
        cdc.vizChangePage(cobject, 1)
    }
    
    return result
}

/** 
* Get and organize Demographic variable values
* 
* @param {Object} cobject Cdc library object.
*
* 
* @returns {object} Demographic filters available from CDC dataset
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.getDemographicVariableValues(v)
*/
cdc.getDemographicVariableValues = async function (cobject){
    var filters={}
    
    var selectValue=[]
    var flag=true
    var flagSingle=true
    if(  cobject.active_dataset['filters_available'].length>0 &&  cobject.active_dataset['filter_general']=='' ){
        for (var c of cobject.active_dataset['filters_available'] ){
            selectValue.push(c)
            filters[c]=[]
        }
        flagSingle=false
    }
    else{
        if( cobject.active_dataset['filter_value_general']!='' && cobject.active_dataset['filter_general']!='' ){
            selectValue.push(cobject.active_dataset['filter_general'])
            selectValue.push(cobject.active_dataset['filter_value_general'])
        }
        else{
            flag=false
        }
    }

    selectValue=selectValue.join(',')
    
    if(flag){
        var res = await fetch(`https://chronicdata.cdc.gov/resource/${cobject.datasetId}.json?$select=distinct%20${selectValue}&$$app_token=vL7rlKzXR5M6c2o98kOuMmbCO`)
        var content=await res.json()
        
        content = content.filter( el => Object.keys(el).length == selectValue.split(',').length )
        content.forEach( el => {
            if(flagSingle){
                var variable = el[ cobject.active_dataset['filter_general'] ]
                var variable_value = el[ cobject.active_dataset['filter_value_general'] ]
                if( ! Object.keys(filters).includes(variable) ){
                    filters[variable]=[]
                }
                if( ! filters[variable].includes(variable_value) ){
                    filters[variable].push(variable_value)
                }
            }
            else{
                for (var c of cobject.active_dataset['filters_available'] ){
                    if ( ! filters[c].includes( el[c] ) ){
                        filters[c].push( el[c] )
                    }
                }
            }
        })
        
        for (var k of Object.keys(filters)){
            filters[k].sort()
        }
    }
    
    var result = { flagSingle: flagSingle, filters: filters }
    cobject.demographic_filters = result
    
    return result
}

/** 
* Prepare and fill demographic variable select
* 
* @param {Object} cobject Cdc library object.
* @param {string} container Target container identifier to fill a select with the values options
*
* 
* @returns {string} HTML content with the options
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.getDemographicVariableValues(v)
* cdc.fillDemographicVariableFilters(v, 'table_demo_filters')
*/
cdc.fillDemographicVariableFilters = async function (cobject, container){
    var filters = cobject.demographic_filters
    if(filters==null || filters==undefined){
        filters = await cdc.getDemographicVariableValues(cobject)
    }
    
    var htmls=''
    
    if( Object.keys(filters['filters']).length>0 ){
        if(filters.flagSingle){
            var aux = ''
            var keys = Object.keys(filters['filters'])
            keys.forEach(el => {
                var sel = (cobject.active_dataset['filter_total'] == el) ? 'selected' : ''
                aux+=`<option value="${el}" ${sel} >${el}</option>`
            })
            
            htmls += `
                <div style="display: inline-block;" >
                    <label class="fields mr-2" style="text-align: right;" >Variable:</label>
                    <select class="form-control mr-3" id="selectVariable" onChange="cdc.changeDemographicValuesSelect(cobj, this.value)" > ${aux} </select>
                </div>
            `
            aux=''
            filters['filters'][keys[0]].forEach(el => {
                var sel = (cobject.active_dataset['filter_total'] == el) ? 'selected' : ''
                aux+=`<option value="${el}" ${sel} >${el}</option>`
            })
            
            htmls += `
                <div style="display: inline-block;" >
                    <label class="fields mr-2" style="text-align: right;" >Variable value:</label>
                    <select class="form-control mr-3" id="selectValue" > ${aux} </select>
                </div>
            `
        }
        else{
            var aux = ''
            var keys = Object.keys(filters['filters'])
            var i=0
            keys.forEach(e => {
                var mask = cobject.active_dataset['filters_mask_total'][i]
                aux=''
                filters['filters'][e].forEach(el => {
                    var sel = (el == mask) ? 'selected' : ''
                    aux+=`<option value="${el}" ${sel} >${el}</option>`
                })
                
                var label = e.toLowerCase().replace(' ','_').replace('(','_').replace(')','_')
                htmls += `
                    <div style="display: inline-block;" >
                        <label class="fields mr-2" style="text-align: right;" >${e}:</label>
                        <select class="form-control mr-3" id="select_${label}" > ${aux} </select>
                    </div>
                `
                i+=1
            })
        }
        
        htmls+=`<input class="btn btn-primary mt-3" type="button" id="bfilter" onclick="cdc.filterDataByDemographicVariable (cobj, null, true, true).then( (val) => {} )" value="Filter" />`
        
        eval(container).innerHTML=htmls
        
        if(filters.flagSingle){
            cdc.changeDemographicValuesSelect(cobject, cobject.active_dataset['filter_total'])
        }
    }
}

/** 
* Change demographic variable select
* 
* @param {Object} cobject Cdc library object.
* @param {string} key Variable name
*
* 
* @returns {string} HTML content with the options
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* await cdc.getDemographicVariableValues(v)
* cdc.fillDemographicVariableFilters(v, 'table_demo_filters')
* cdc.changeDemographicValuesSelect(v, 'Gender')
*/
cdc.changeDemographicValuesSelect = function (cobject, key){
    var aux=''
    if( Object.keys( cobject.demographic_filters['filters'] ).includes(key) ){
        cobject.demographic_filters['filters'][key].forEach(el => {
            aux+=`<option value="${el}" >${el}</option>`
        })
        selectValue.innerHTML=aux
    }
}

/** 
* Fill table with available processed data gathered from IARC
*
* @param {string} cause Chosen cause
* @param {string} by Chosen dimension
* @param {Object} objIarc IARC Library object
* @param {string} idContainer ID of the html div that will be filled
*
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* cdc.vizFillDescriptionTable(v, 'filtered')
*/
cdc.vizFillDescriptionTable = async function(cobject, idContainer){
    eval(idContainer).style.display='none'
    eval(idContainer).innerHTML='<div id="table_demo_filters" ></div>'
    
    var cols = ['Location', 'Prevalence (%)', 'Low Value', 'High Value']
    var aux=''
    for( var k of cols ){
        aux+=`
            <th>${k}</th>
        `
    }
    
    var html_filters = await cdc.fillDemographicVariableFilters(cobject, 'table_demo_filters')
    
    var table = `
        <table class="table table-striped mt-3" > 
            <thead id="tableHeader" > 
                <tr>
                    ${aux}
                </tr>
            </thead>
            
            <tbody id="tableBody" > </tbody>
        </table>

        <nav aria-label="pagination">
            <ul class="pagination" id="pagesContainer"> </ul>
        </nav>
    `;
    var flag = false
    if(cobject.filteredDataDemographic==null || cobject.filteredDataDemographic==undefined){
        await cdc.filterDataByDemographicVariable(cobject, null, false, false)
    }
    var hits = cobject.filteredDataDemographic['table']
    
    if(hits.length>0){
        cobject.hits=hits
        eval(idContainer).style.display=''
        eval(idContainer).innerHTML+=table
        cdc.vizChangePage(cobject, 1)
        flag=true
    }   
    
    if(!flag){
        alert('There were no hits')
    }
}

/** 
* Change page of rendered data table
*
* @param {Object} objIarc IARC Library object
* @param {number} start Page number
*
* 
* @example
* let v = await Cdc('hn4x-zwk7')
* cdc.vizFillDescriptionTable(v, 'filtered')
* cdc.vizChangePage(v, 4)
*/
cdc.vizChangePage = function(cobject, start){
    var hits = cobject.hits
    var itemsPage = 20
    if(hits.length>0){
        if(hits.length > itemsPage){
            var numPages = Math.ceil(hits.length/itemsPage)
            
            var pagesContent=''
            for(var i=1; i<=numPages; i++){
                pagesContent+=`<li class="page-item " id="pit${i}" ><a class="page-link" href="javascript:void(0)" onClick="cdc.vizChangePage(cobj, ${i}); event.preventDefault();" > ${i} </a></li>`
            }
            pagesContainer.innerHTML=pagesContent
            
            document.getElementById('pit'+(start)).className='page-item active'
        }  
        else{
            pagesContainer.innerHTML=''
        }
        start=(start-1)*itemsPage
        hits = hits.slice(start, start+itemsPage)
        
        var ht = ''
        hits.forEach(el => {
            var aux=''
            for( var k of Object.keys(el) ){
                aux+=`
                    <td>${el[k]}</td>
                `
            }
            
            ht+=`
            <tr>
                ${aux}
            </tr>
            `
        })
        
        tableBody.innerHTML=ht
        filtered.style.display='block' 
        
    }   
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
* @returns {object} Object containing the y values and error range for each value of the available demographic variable
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
    else{
        eval(container).innerHTML='There is no demographic variable to compare.'
    }
    
    return comparison_variables_data
}

/** 
* Get data from cdc according to topics, questions and responses by state/location considering the overall statistics of demographic variables (age, gender, race, income, education, etc)
* 
* @param {Object} cobject Cdc library object.
*
*
* @returns {array} Array containing the flag to signalize the plot style (coordinates or by location name), the list of states (when available) and the filtered/processed data table
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
* @returns {object} Object containing the y values and error range for each value of the available demographic variable
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
     
    /*
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
    }*/
    
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
    let normalize = (val, arr) => { return ( val - Math.min.apply(null, arr))/(Math.max.apply(null, arr) - Math.min.apply(null, arr)) }
    
    document.getElementById(container).style.display='none'
    var table = cobject.resultsByQuestion
    
    if(table.length>0){
        var locations = table.map( el => { return el['id'] } )
        var captions = table.map( el => { return el['name']+' - Value: '+el['result']+'%'  } )
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
