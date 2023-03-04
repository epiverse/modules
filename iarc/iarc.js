if (typeof (Plotly) == 'undefined') {
    let s = document.createElement('script')
    s.src = 'https://cdn.plot.ly/plotly-2.16.1.min.js'
    document.head.appendChild(s)
}

console.log('iarc.js loaded')

/* Initializes object with default example parameters */

/**
 * Main global portable module.
 * @namespace 
 * @property {Function} Iarc - {@link Iarc}
 *
 * @namespace iarc
 * @property {Function} causesGet - {@link iarc.causesGet}
 * @property {Function} causesGetAll - {@link iarc.causesGetAll}
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
iarc.causesGet= async (cause=iarc.causes[0],by=iarc.causesBy[0])=>{
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
iarc.causesGetAll= async function(cache=false){  // retrieve all causal data
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

iarc.vizFillSelectCause = function(objIarc, idContainer){
    var keys = Object.keys(objIarc.data)
    var ht = '';
    keys.forEach( el => {
        ht+=`<option value="${el}"> ${el} </option>`
    })
    document.getElementById(idContainer).innerHTML=ht
}

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
iarc.loadScript= async function(url){
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

