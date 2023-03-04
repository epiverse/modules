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

export {Iarc}

