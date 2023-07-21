console.log('iarc.js loaded')

/* Initializes object with default example parameters */

/**
 * Main global portable module.
 * @namespace 
 * @property {Function} Iarc - {@link Iarc}
 *
 * @namespace iarc
 * @property {Function} loadCi5Data - {@link iarc.loadCi5Data}
 * @property {Function} fillContinentOptions - {@link iarc.fillContinentOptions}
 * @property {Function} fillRegistryOptions - {@link iarc.fillRegistryOptions}
 * @property {Function} fillGenderOptions - {@link iarc.fillGenderOptions}
 * @property {Function} fillCancerOptions - {@link iarc.fillCancerOptions}
 * @property {Function} plotAgeByYearCancerIncidence - {@link iarc.plotAgeByYearCancerIncidence}
 * @property {Function} exportAsApcToolInput - {@link iarc.exportAsApcToolInput}
 * @property {Function} saveFile - {@link iarc.saveFile }
 * @property {Function} causesGet - {@link iarc.causesGet}
 * @property {Function} causesGetAll - {@link iarc.causesGetAll}
 * @property {Function} vizFillSelectCause - {@link iarc.vizFillSelectCause}
 * @property {Function} vizFillSelectBy - {@link iarc.vizFillSelectBy}
 * @property {Function} vizFillDescriptionTable - {@link iarc.vizFillDescriptionTable}
 * @property {Function} vizChangePage - {@link iarc.vizChangePage}
 * @property {Function} vizPlotSummary - {@link iarc.vizPlotSummary}
 * @property {Function} IarcGpt - {@link iarc.IarcGpt}
 * @property {Function} getValidatedData - {@link iarc.getValidatedData}
 * @property {Function} completions - {@link iarc.completions}
 * @property {Function} getAgentDescriptions - {@link iarc.getAgentDescriptions}
 * @property {Function} perfomanceTest - {@link iarc.perfomanceTest}
 * @property {Function} loadMonograph - {@link iarc.loadMonograph}
 * @property {Function} loadScrapedMonographs - {@link iarc.loadScrapedMonographs}
 * @property {Function} getExtractLines - {@link iarc.getExtractLines}
 * @property {Function} processMonographLinkHtml - {@link iarc.processMonographLinkHtml}
 * @property {Function} getBookLinks - {@link iarc.getBookLinks}
 * @property {Function} scrapSourceMonoGraphLinks - {@link iarc.scrapSourceMonoGraphLinks}
 * @property {Function} loadScript - {@link iarc.loadScript}

 */


 /**
 *
 *
 * @object Iarc
 * @attribute {array} causes The factors of risk for cancer.
 * @attribute {array} causesBy Dimension with which the risk factors can be queried.
 * @attribute {Object} data All data gathered from combinations of causes and dimensions.
 */

/** 
* Initializes the IARC Library object
* 
*
*
* @returns {Object} IARC library object.
* 
* @example
* let v = await Iarc()
*/
async function Iarc (){
    var object = { }
    object.causes=['obesity','infections','uv','alcohol']
    object.causesBy=['countries','cancers','attributable','regions','preventable']
    object.data = await iarc.causesGetAll()
    return object
}

let iarc={}
iarc.causes=['obesity','infections','uv','alcohol']
iarc.causesBy=['countries','cancers','attributable','regions','preventable']

/** 
* Get CI5 epidemiology data and organizes acording to each geographic location group the population number at risk and the cases incidence by cancer type and year
* 
*
*
* @returns {Object} Object file containing the mapping dictionaries for geographical areas of the registries and populations at risk by gender. The third dictionary contains data organized by geographical group, specific location, gener, and cases incidence of several types of cancer by year
* 
* @example
* let v = await iarc.loadCi5Data()
*/
iarc.loadCi5Data = async () => {
    var res = {}
    var dat = { "dict_registry": {}, "dict_population": {}, "data_cases": { } }
    
    var url = "https://corsproxy.io/?https://ci5.iarc.fr/CI5plus/old/CI5plus_Summary_April2019.zip"
    const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip/+esm')).default
    
    fetch(url)
    .then(response => response.blob())
    .then(blob => {
        var zip = new JSZip();
        zip.loadAsync(blob)
        .then( async (zip) => {
            d = zip;
            console.log(d.files);
            
            // Getting registry sections
            Object.keys(d.files).forEach(e => {
                if(e.indexOf('_Pops')!=-1 ){
                    var section = e.split('_')[0]
                    res[section] = JSON.parse( JSON.stringify( dat ))
                }
            })
            
            var maps = { "1": "Male", "2": "Female" }
            
            // Getting dict cancer types
            var mapc = {}
            var txt = await d.file('cancer_summary.csv').async("string");
            var tab = txt.split(/[\n\r]+/g).map(e => e.split(','))
            tab.forEach( e => { 
                if( e.length > 1) {
                    mapc[e[0].replaceAll(' ', '')] = e[1].replaceAll('"', '')
                }
             } )
             
             Object.keys(res).forEach( async section => {
                // Getting correct name of the registries
                var mapr = {}
                txt = await d.file( section+'.csv').async("string");
                tab = txt.split(/[\n\r]+/g).map(e => e.split(','))
                tab.forEach( e => { 
                    if( e.length > 1) {
                        mapr[e[2].replaceAll(' ', '')] = e[3].replaceAll('"', '')
                        res[section]['dict_registry'][ e[2].replaceAll(' ', '') ] = { 'name': e[3].replaceAll('"', ''), 'start': parseInt(e[4]), 'end': parseInt(e[5]) }
                    }
                 } )
                
                // Getting population information 
                txt = await d.file( section+'_Pops.csv').async("string");
                tab = txt.split(/[\n\r]+/g).map(e => e.split(','))
                var age_groups = tab[0].slice(3).map( e => e.replace('P','N') )
                tab.slice(1).forEach( e => { 
                    if( e.length > 1) {
                        var reg = mapr[ e[0].replaceAll(' ', '') ]
                        if ( ! Object.keys( res[section]['dict_population'] ).includes(reg) ){
                            res[section]['dict_population'][reg]={}
                        }  
                        
                        var gender = maps[ e[2] ]
                        if ( ! Object.keys( res[section]['dict_population'][reg] ).includes(gender) ){
                            res[section]['dict_population'][reg][gender]={}
                        }  
                        
                        var year = e[1]
                        if ( ! Object.keys( res[section]['dict_population'][reg][gender] ).includes(year) ){
                            res[section]['dict_population'][reg][gender][year]={}
                        }  
                        
                        var pops = e.slice(3)
                        var j = 0
                        for (var ag of age_groups){
                            res[section]['dict_population'][reg][gender][year][ag] = pops[j]
                            j+=1
                        }
                    }
                 } )
                
                // Getting cases by cancer type
                txt = await d.file( section+'_Cases.csv').async("string");
                tab = txt.split(/[\n\r]+/g).map(e => e.split(','))
                var case_groups = tab[0].slice(4)
                tab.slice(1).forEach( e => { 
                    if( e.length > 1) {
                        var reg = mapr[ e[0].replaceAll(' ', '') ]
                        if ( ! Object.keys( res[section]['data_cases'] ).includes(reg) ){
                            res[section]['data_cases'][reg]={}
                        }  
                        
                        var gender = maps[ e[2] ]
                        if ( ! Object.keys( res[section]['data_cases'][reg] ).includes(gender) ){
                            res[section]['data_cases'][reg][gender]={}
                        }  
                        
                        var cancer = mapc[ e[3].replaceAll(' ', '') ]
                        if ( ! Object.keys( res[section]['data_cases'][reg][gender] ).includes(cancer) ){
                            res[section]['data_cases'][reg][gender][cancer]={}
                        }  
                        
                        var year = e[1]
                        if ( ! Object.keys( res[section]['data_cases'][reg][gender][cancer] ).includes(year) ){
                            res[section]['data_cases'][reg][gender][cancer][year]={}
                        }  
                        
                        var cases = e.slice(4)
                        var j = 0
                        for ( var cs of case_groups){
                            res[section]['data_cases'][reg][gender][cancer][year][cs] = cases[j]
                            j+=1
                        }
                    }
                 } )
             })
             
             return res
            
        })
        .catch((err) => {
          console.log("Error reading zip:", err);
        });
    })
    .catch((err) => {
        console.log("Error fetching zip:", err);
    });
    
    return res;
}

/** 
* Fill select continent options
* 
*
* @param {Object} dat CI5 data object
* @param {string} ide Tag identifier
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.fillContinentOptions(v, 'continent')
*/
iarc.fillContinentOptions = async (dat, ide)=>{
    var ops = Object.keys( dat )
    var htmls = ""
    ops.forEach( e => htmls += `<option value="${e}">${e}</option>` )
    document.getElementById(ide).innerHTML = htmls
}

/** 
* Fill select Registry options
* 
*
* @param {string} continent Continent
* @param {Object} dat CI5 data object
* @param {string} ide Tag identifier
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.fillRegistryOptions('Europe', v, 'registry')
*/
iarc.fillRegistryOptions = async (continent, dat, ide)=>{
    var ops = Object.keys( dat[ continent ]['data_cases'] )
    var htmls = ""
    ops.forEach( e => htmls += `<option value="${e}">${e}</option>` )
    document.getElementById(ide).innerHTML = htmls
}

/** 
* Fill select Gender options
* 
*
* @param {Object} dat CI5 data object
* @param {string} ide Tag identifier
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.fillGenderOptions(v, 'gender')
*/
iarc.fillGenderOptions = async (dat, ide)=>{
    var conts = Object.keys( dat )
    var regs = Object.keys( dat[ conts[0] ]['data_cases'] )
    var ops = Object.keys( dat[ conts[0] ]['data_cases'][ regs[0] ] )
    var htmls = ""
    ops.forEach( e => htmls += `<option value="${e}">${e}</option>` )
    document.getElementById(ide).innerHTML = htmls
}

/** 
* Fill select Cancer options
* 
*
* @param {Object} dat CI5 data object
* @param {string} ide Tag identifier
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.fillCancerOptions(v, 'cancer')
*/
iarc.fillCancerOptions = async (dat, ide)=>{
    var conts = Object.keys( dat )
    var regs = Object.keys( dat[ conts[0] ]['data_cases'] )
    var genders = Object.keys( dat[ conts[0] ]['data_cases'][ regs[0] ] )
    var ops = Object.keys( dat[ conts[0] ]['data_cases'][ regs[0] ][ genders[0] ] )
    var htmls = ""
    ops.forEach( e => htmls += `<option value="${e}">${e}</option>` )
    document.getElementById(ide).innerHTML = htmls
}

/** 
* Plot heatmap of cases number along the years by age group
*
* @param {string} continent Continent
* @param {string} registry Registry
* @param {string} gender Gender
* @param {string} cancer Cancer
* @param {Object} dat CI5 data object
* @param {string} ide Tag identifier
*
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.plotAgeByYearCancerIncidence( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v, 'summary_plot_lexis')
*/
iarc.plotAgeByYearCancerIncidence = function (continent, registry, gender, cancer, dat, ide){
    var obj = dat[continent]['data_cases'][registry][gender][cancer]
    var years_y = Object.keys( obj )
    var age_groups_x = Object.keys( obj[ years_y[0] ] ).slice(1, -1)
    var z = []
    for( var y of years_y ){
        z.push( Object.values( obj[ y ] ).slice(1, -1) )
    }
    
    var transz = []
    for( var i=0; i<z[0].length; i++){
        var aux = []
        for( var j=0; j<z.length; j++){
            aux.push( z[j][i] )
        }
        transz.push(aux)
    }

    //var data = [ {  z: z, text: z, x: age_groups_x, y: years_y, type: 'heatmap', hoverongaps: false } ];
    var data = [ {  z: transz, text: transz, x: years_y, y: age_groups_x, type: 'heatmap', colorscale: 'Portland', hoverongaps: false } ];
    var layout = {
        title: 'Lexis diagram',
        /*
        yaxis: { title: { text: 'Years' } },
        xaxis: { title: { text: 'Age groups' } }
        */
        xaxis: { title: { text: 'Years' } },
        yaxis: { title: { text: 'Age groups' } }
    }
    Plotly.newPlot(ide, data, layout);
    
    document.getElementById(ide).style.display='block'
    
}

/** 
* Save file for APC NIH analysis
* 
*
* @param {string} continent Continent
* @param {string} registry Registry
* @param {string} gender Gender
* @param {string} cancer Cancer
* @param {Object} dat CI5 data object
*
* @returns {HTMLAnchorElement} HTML anchor (<a />) element with the click event fired.
* 
* @example
* let v = await iarc.loadCi5Data()
* iarc.exportAsApcToolInput( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v )
*/
iarc.exportAsApcToolInput = (continent, registry, gender, cancer, dat)=>{
    var pops = dat[continent]['dict_population'][registry][gender]
    var obj = dat[continent]['data_cases'][registry][gender][cancer]
    var years_y = Object.keys( obj )
    var age_groups_x = Object.keys( obj[ years_y[0] ] ).slice(1, -1)
    
    var trans = {}
    for( var y of years_y ){
        for (var x of age_groups_x) {
            if( ! Object.keys(trans).includes(x) ){
                trans[x]={ }
            } 
            
            trans[x][y] = `${obj[y][x]},${pops[y][x]}`
        }
    }
    
    var sep = '';
    var n = (years_y.length*2) - 1
    for (var i=0; i<n; i++){
        sep += ","
    }
    sep+='\n'
    
    var start = years_y[0]
    var report = `Title: Cancer ${cancer} - Continent ${continent} - Cohort ${registry} - Gender ${gender}${sep}`
    report += `"Description: dataset derived from iarc CI5"${sep}`
    report += `Start Year: ${start}${sep}`
    report += `Start Age: 0${sep}`
    report += `Interval (Years): 1${sep}`
    
    for (var x of age_groups_x) {
        var vals = Object.values( trans[x] )
        if( vals.filter(e => e.includes(',0') ).length == 0 ){
            report += vals.join(',') + '\n'
        }
    }
    //console.log(report)
    
    return iarc.saveFile(report, 'apc_input.csv')
}

/** 
* Open the file in download mode
* 
*
* @param {string} x Text content
* @param {string} filename Filename for exportation.
*
* @returns {HTMLAnchorElement} HTML anchor (<a />) element with the click event fired.
* 
* @example
* var content = "example text"
* var tagA = await iarc.saveFile(content, 'example.txt')
*/
iarc.saveFile = function(x,fileName) { 
	var bb = new Blob([x]);
   	var url = URL.createObjectURL(bb);
	var a = document.createElement('a');
   	a.href=url;
   	a.download=fileName
	a.click()
	return a
}

/** 
* Get a single combination of a cause with a dimension of organization
* 
*
* @param {string} [cause=obesity] Cause
* @param {string} [by=countries] Dimension
*
* @returns {Object} Object file containing the statistics filtered by the input cause and organized according to the chosen dimension.
* 
* @example
* let v = await iarc.causesGet('infections','regions')
*/
iarc.causesGet = async (cause=iarc.causes[0],by=iarc.causesBy[0])=>{
    let url = `https://gco.iarc.fr/causes/${cause}/data/${by}.json`
    console.log(url)
    try{
        let d = await (await fetch(url)).json()
        return d
    } catch (err){
        console.log(`${url}`,err)
        return undefined
    } 
}

/** 
* Get all available combinations of a cause with a dimension of organization
*
* @param {boolean} [cache=false] Enables storage of the gathered data
*
* @returns {Object} Object file containing the statistics filtered by the input cause and organized according to the chosen dimension.
* 
* @example
* let v = await iarc.causesGetAll()
*/
iarc.causesGetAll = async function(cache=false){  // retrieve all causal data
    let dt={}
    iarc.causes.forEach(async c=>{
        dt[c]={}
        iarc.causesBy.forEach(async b=>{
            let url = `https://gco.iarc.fr/causes/${c}/data/${b}.json`
            console.log(url)
            try{
                dt[c][b] = await (await fetch(url)).json()
            } catch (err){
                console.log(`${url}`, err)
            }
            
        })
    })
    if(cache){
        iarc.causesGetAll=dt //replaces original function with fetched results, i.e. caching them
    }
    return dt
}

/** 
* Fill options of a select tag with causes values
*
* @param {Object} objIarc IARC Library object
* @param {string} idContainer ID of the html div that will be filled
*
* 
* @example
* let v = await Iarc()
* iarc.vizFillSelectCause(v, 'selectCause')
*/
iarc.vizFillSelectCause = function(objIarc, idContainer){
    var keys = Object.keys(objIarc.data)
    var ht = '';
    keys.forEach( el => {
        ht+=`<option value="${el}"> ${el} </option>`
    })
    document.getElementById(idContainer).innerHTML=ht
}

/** 
* Fill options of a select tag with dimension values
*
* @param {Object} objIarc IARC Library object
* @param {string} idContainer ID of the html div that will be filled
*
* 
* @example
* let v = await Iarc()
* iarc.vizFillSelectBy(v, 'selectDimension')
*/
iarc.vizFillSelectBy = function(objIarc, idContainer){
    var keys = []
    for (var i of Object.keys(objIarc.data) ){
        var bys = Object.keys(objIarc.data[i])
        for (var j of bys){
            if( ! keys.includes(j) ){
                keys.push(j)
            }
        }
    }
    if(keys.length==0){
        //keys=objIarc.causesBy
    }
    var ht = '';
    keys.forEach( el => {
        ht+=`<option value="${el}"> ${el} </option>`
    })
    document.getElementById(idContainer).innerHTML=ht
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
* let v = await Iarc()
* iarc.vizFillDescriptionTable('obesity', 'cancers', v, 'tableData')
*/
iarc.vizFillDescriptionTable = function(cause, by, objIarc, idContainer){
    filtered.style.display='none'
    console.log(objIarc.data)
    
    var table = `
        <table class="table table-striped" > 
            <thead id="tableHeader" > 
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                </tr>
            </thead>
            
            <tbody id="tableBody" > </tbody>
        </table>

        <nav aria-label="pagination">
            <ul class="pagination" id="pagesContainer"> </ul>
        </nav>
    `;
    var flag = false
    if( Object.keys(objIarc.data).includes(cause) ){
        if( Object.keys(objIarc.data[cause]).includes(by) ){
            var hits = []
            var dat = objIarc.data[cause][by]
            dat.forEach( el => {
                var lb = el.label
                var desc = ''
                if( Object.keys(el).includes('sex') ){
                    desc='Affects all'
                    if(el.sex=='1'){
                        desc='Affects men'
                    }
                    if(el.sex=='2'){
                        desc='Affects women'
                    }
                }
                
                if( Object.keys(el).includes('globocan_data') ){
                    if( Object.keys(el['globocan_data']).includes('TOTAL') ){
                        desc = 'Total of affected people: '+el['globocan_data']['TOTAL']
                    }
                }
                
                hits.push( {'name': lb, 'description': desc } )
            })
            
            if(hits.length>0){
                objIarc.hits=hits
                document.getElementById(idContainer).innerHTML=table
                iarc.vizChangePage(objIarc, 1)
                flag=true
            }     
        }
    }
    
    if(!flag){
        alert('There were no hits for this combination of cause and dimension')
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
* let v = await Iarc()
* iarc.vizFillDescriptionTable('obesity', 'cancers', v, 'filtered')
* iarc.vizChangePage(v, 4)
*/
iarc.vizChangePage = function(objIarc, start){
    var hits = objIarc.hits
    var itemsPage = 20
    if(hits.length>0){
        if(hits.length > itemsPage){
            var numPages = Math.ceil(hits.length/itemsPage)
            
            var pagesContent=''
            for(var i=1; i<=numPages; i++){
                pagesContent+=`<li class="page-item " id="pit${i}" ><a class="page-link" href="javascript:void(0)" onClick="iarc.vizChangePage(objIarc, ${i}); event.preventDefault();" > ${i} </a></li>`
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
            ht+=`
            <tr>
                <td> ${el.name} </td>
                <td> ${el.description} </td>
            </tr>
            `
        })
        
        tableBody.innerHTML=ht
        filtered.style.display='block' 
        
    }   
}

/** 
* Fill bar summary plot with available processed data containing descriptive numbers gathered from IARC
*
* @param {string} cause Chosen cause
* @param {string} by Chosen dimension
* @param {Object} objIarc IARC Library object
* @param {string} idContainer ID of the html div that will be filled
*
* 
* @example
* let v = await Iarc()
* iarc.vizPlotSummary('alcohol', 'countries', v, 'summary_plot')
*/
iarc.vizPlotSummary = function (cause, by, objIarc, idContainer){
    var hits = {}
    if( Object.keys(objIarc.data).includes(cause) ){
        if( Object.keys(objIarc.data[cause]).includes(by) ){
            var dat = objIarc.data[cause][by]
            dat.forEach( el => {
                var lb = el.label
                
                if( Object.keys(el).includes('globocan_data') ){
                    if( Object.keys(el['globocan_data']).includes('TOTAL') ){
                        hits[lb] = Math.log10( Number(el['globocan_data']['TOTAL']) )
                    }
                }
            })
        }
    }
    
    var x = Object.keys(hits)
    var y = Object.values(hits)
    if(x.length>0){
        var trace = {
            x: x,
            y: y,
            name: cause+' x '+by,
            type: 'bar'
        }
        
        var data = [ trace ]
        var layout = {
            title: 'Summary plot',
            xaxis: { title: { text: by } },
            yaxis: { title: { text: 'Total Occurrences (log10)' } }
        }
        Plotly.newPlot(idContainer, data, layout);
        
        document.getElementById(idContainer).style.display='block'
    }
    else{
        document.getElementById(idContainer).style.display='none'
    }
}


iarc.IarcGpt = async function (key=''){
    localStorage.GPT_API_key = key
    
    var obj = {'monographs': []}
    var info = await Promise.all( [ import('https://episphere.github.io/gpt/jonas/export.js'), iarc.loadScrapedMonographs(), iarc.getValidatedData(obj) ] )
    obj.gpt = info[0]
    obj.monographs = info[1]
    obj.validated = info[2]
    
    /*import('https://episphere.github.io/gpt/jonas/export.js').then( async (mod) => {
        iarc.gpt=mod
        
        iarc.monographs = await iarc.loadScrapedMonographs()
        
    }) */
    return obj
}

iarc.getValidatedData = async function (iarcobj){
    if(iarcobj.monographs.length==0){
        iarcobj.monographs = await iarc.loadScrapedMonographs()
    }
    console.log(iarcobj.monographs)
    var rows = await d3.csv('https://raw.githubusercontent.com/filhoalm/monoapp1/main/data2102023c.csv')
    var data = {}
    rows.forEach( el => {
        var year = el.year
        var volume = el.volume
        var agent = el.agent_subtype
        console.log(volume, year)
        var link_pdf = iarcobj.monographs.filter(e => (e.year==el.year && e.volume==el.volume) )
        if(link_pdf.length > 0){
            link_pdf = link_pdf[0].link_pdf
            data[agent] = link_pdf
        }
    })
    
    var agents = Object.keys(data)
    
    return data
}

/* ------------- Chat GPT functions ------------- */

// Adaptation of jonas gpt module function to retrieve completions to send multiple messages
iarc.completions = async function (messages, model='gpt-3.5-turbo', temperature=0.7){
    key = localStorage.GPT_API_key
    if(key!='' && key!=null){
        return await 
            (await fetch(`https://api.openai.com/v1/chat/completions`,
                 {
                     method:'POST',
                     headers:{
                         'Authorization':`Bearer ${key}`,
                         'Content-Type': 'application/json',
                     },
                     body:JSON.stringify({
                         model:model,
                         messages: messages
                     })
                 })
             ).json()
    }
    else{
        console.log('Error: Openai key was not found.')
    }
}

iarc.getAgentDescriptions = async function ( agent, context){
    var instruction = "You are a helpful assistant that answer the question as truthfully as possible, in case you do not find the answer say 'I don't know' "

    var questions = ['What is the name of the agent?', `Which key characteristics of carcinogens presented ${agent}?`, `What is ${agent}?`, `What was the summary or evaluation for each cancer site?`, `What was the overall evaluation of ${agent} carcinogenicity?`]
    
    var chunks=[]
    var a = context.replaceAll('\n',' ').split(' ').filter(e => e!='')
    var batch = 2300
    var i=0
    while( i<a.length){ 
        chunks.push( a.slice(i, i+batch).join(' ') ); 
        i+=batch;  
    }
    var queries = []
    i=1
    for (var c of chunks){
        queries = queries.concat(
            questions.map( q => {
                var messages = []
                messages.push( { role: 'system', content: instruction } )
                messages.push( { role: 'assistant', content: c } )
                messages.push( { role: 'user', content: q } )
                
                var obj={ 'messages': messages, 'question': q, 'chunk': 'part-'+i }
                return obj
            })
        )
        i+=1
    }
    
    var info = await Promise.all( queries.map( async q => {
        var answer = await iarc.completions(q['messages'], 'gpt-3.5-turbo', 0.7)
        q['answer'] = answer
        await sleep(300)
        return q
    }))
    
    var max_token = 0
    for (var ans of info){
        if( Object.keys(ans['answer']).includes('error') ){
            if( ans['answer']['error']['code']=='context_length_exceeded' ){
                var er = ans['answer']['error']['message'].split('resulted in ')[1].split(' ')[0]
                er=parseInt(er)
                if(er>max_token){
                    max_tooken=er
                }
                console.log('Tokens exceeded: ', er, ' - Question: ', ans['question'], ' - Chunk: ', ans['chunk'])
            }
        }
    }
    console.log('Max tokens exceeded: ', max_token)
    
    return info
}

iarc.perfomanceTest = async function (iarcobj, context){
    var agents = Object.keys(iarcobj.validated)
    var agent = agents[0]
    //for(var agent of Object.keys(iarcobj.validated) ){
        //var text = await iarc.loadMonograph( iarcobj.validated[agent] )
        iarc.loadMonograph( iarcobj.validated[agent] ).then( async text => {
            var answer = await iarc.getAgentDescriptions(agent, text)
            console.log(answer)
        })
    //}
    
}

iarc.loadMonograph = async function(link){
    link = 'https://corsproxy.io/?' + encodeURIComponent(link)
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
    
    link = link
    var answer = ''
    var loadingTask = pdfjsLib.getDocument(link);
    return loadingTask.promise.then( async function(pdf) {
        var numPages = pdf.numPages
        var pgs= []
        for( var i=1; i<=numPages; i++){
            pgs.push(i)
        }
        var answer = await Promise.all( pgs.map( async i => {    
            var page = await pdf.getPage(i)
            var content = await page.getTextContent()
            var items = content.items;
            var text=''
            items.forEach(e => { text+=e.str+'\n' })
            
            return text
        }))
        
        return answer.join('\n')
    })
}


/* ------------- Scraping functions ------------- */
iarc.loadScrapedMonographs = async function(){
    var lbs=[]
    var dat = await( await fetch(location.href+'links_scraped_complete.tsv') ).text()
    dat = dat.split('\n').slice(1).map(e => e.split('\t') )
    for (var d of dat){
        var name = d[0].split('/')
        name=name[name.length-1].split('-').slice(0,-1).join(' ')
        var obj = { 'link': d[0], 'link_pdf': d[3], 'volume': d[1], 'year': d[2], 'name_agent': name }
        lbs.push(obj)
    }
    return lbs
}

iarc.getExtractLines = async function(url){
    url = 'https://corsproxy.io/?' + encodeURIComponent(url)
    var data = await (await fetch(url) ).text()
    data = data.split('\n')
    return data
}

iarc.processMonographLinkHtml = function(links, lines){
    flag=false
    for ( var l of lines){
        if(l.indexOf('<button class="page" type="submit" name="page"') !=-1 && l.toLowerCase().indexOf('next')==-1 ){
            n = parseInt(l.split('>')[1].split('<')[0])
        }
          
        if( l.indexOf('/Book-And-Report-Series/')!=-1 && l.indexOf('Details')==-1 && l.split('>').length > 2 ){
            key='https://publications.iarc.fr'+l.split('"')[1]
            flag=true
        }
        
        if(flag && l.indexOf('<h3')!=-1 ){
            volume=l.split('Volume ')[1].split('<')[0]
        }
            
        if(flag && l.indexOf('<p')!=-1 && l.indexOf('IARC')==-1 ){
            year=l.split('<p>')[1].split('<')[0]
            links[key] = volume+'_'+year
            flag=false
        }
    }
    
    return links
}

iarc.getBookLinks = async function(links){
    var lbs=[]
    
    var cnt=0
    var i = 0
    var ide = Object.keys(links) 
    var info = []
    while (i < ide.length) {
        var end = ((i + 15) <= ide.length) ? i + 15 : ide.length
        var temp = ide.slice(i, end)
        info = info.concat(await Promise.all( temp.map( async l => {
            var lines = await iarc.getExtractLines(l)
            
            for (var li of lines){
                if( li.indexOf('/media/download/')!=-1 && li.indexOf('Download Free PDF')!=-1 ){
                    ld='https://publications.iarc.fr'+li.split('"')[1]
                    var name = l.split('/')
                    name=name[name.length-1].split('-').slice(0,-1).join(' ')
                    var obj = { 'link': l, 'link_pdf': ld, 'volume': links[l].split('_')[0], 'year': links[l].split('_')[1], 'name_agent': name }
                    lbs.push(obj)
                }
            }
            cnt+=1
            
            await sleep(300)
            
            return cnt
        })))
        
        i += 15
        if (i >= ide.length) {
            break
        }
    }
    /*
    for (var l of Object.keys(links) ){
        var data = await (await fetch( l ) ).text()
        data = data.split('\n')
        for (var li of lines){
            if( li.indexOf('/media/download/')!=-1 && li.indexOf('Download Free PDF')!=-1 ){
                ld='https://publications.iarc.fr'+li.split('"')[1]
                var name = l.split('/')
                name=name[name.length-1]split('-').slice(0,-1).join(' ')
                var obj = { 'link': l, 'link_pdf': ld, 'volume': links[l].split('_')[0], 'year': links[l].split('_')[1], 'name_agent': name }
                lbs.push(obj)
            }
        }
   }
   */
   
   return lbs
}

iarc.scrapSourceMonoGraphLinks = async function(){
    var result = {}
    var url= "https://publications.iarc.fr/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans?sort_by=year_desc&limit=50&page=1"
    iarc.getExtractLines(url).then( async lines => {
        var lines  = lines
        var links={}
        var n=0
        for (var l of lines){
            if(l.indexOf('<button class="page" type="submit" name="page"') !=-1 && l.toLowerCase().indexOf('next')==-1 ){
                n = parseInt(l.split('>')[1].split('<')[0])
            }
        }
        links = iarc.processMonographLinkHtml(links, lines)
            
        var urls=[]    
        for (var i=2; i<=n; i++){
            urls.push( "https://publications.iarc.fr/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans?sort_by=year_desc&limit=50&page="+i )
        }
        
        var cnt=0
        var i = 0
        var ide = urls
        var info = []
        while (i < ide.length) {
            var end = ((i + 15) <= ide.length) ? i + 15 : ide.length
            var temp = ide.slice(i, end)
            info = info.concat(await Promise.all( temp.map( async url => {
                lines = await iarc.getExtractLines(url)
                links = iarc.processMonographLinkHtml(links, lines)
                cnt+=1
                
                if(cnt==urls.length){
                    console.log('Books found:', Object.keys(links).length )
                    result = await iarc.getBookLinks(links)
                }
                
                await sleep(300)
                
                return cnt
            })))
            
            i += 15
            if (i >= ide.length) {
                break
            }
        } 
        
    } )
    
    return result
}

/** 
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* iarc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
iarc.loadScript = async function(url){
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
	iarc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}

if(typeof(pdfjsLib)=="undefined"){
	iarc.loadScript('https://mozilla.github.io/pdf.js/build/pdf.js')
}

if(typeof(d3)=="undefined"){
    iarc.loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.4/d3.min.js')
}


