console.log('fair lib loaded')

/*  ------------------- Auxiliary functions for statistical analysis -------------------   */

const sum = (arr) => arr.reduce( (a,b) => a+b )
const max = (arr) => arr.reduce( (a,b) => { if(a > b) { return a; } else{ return b } } )
const min = (arr) => arr.reduce( (a,b) => { if(a < b) { return a; } else{ return b } } )
const mean = (arr) => sum(arr)/arr.length
const sleep = ms => new Promise(r => setTimeout(r, ms));
function removeTags(str) { 
    if ((str===null) || (str==='')) 
        return false; 
    else
        str = str.toString(); 
    return str.replace( /(<([^>]+)>)/ig, ''); 
} 

let fairlibjs = { validOpenAireParams: { general: ["page","size","format","model","sortBy","hasECFunding","hasWTFunding","funder","fundingStream","FP7scientificArea","keywords"], product: ["sortBy","doi","orcid","fromDateAccepted","toDateAccepted","title","author","openaireProviderID","openaireProjectID","hasProject","projectID","FP7ProjectID","OA","country"],  } }

 /**
 *
 *
 * @meta.identifier https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Module
 * @meta.name FAIRLibJs
 * @meta.version 0.1
 * @meta.description Library to help annotating the research objects using RO-Crate metadata standards
 * @meta.license mit
 * @meta.author [name=Yasmmin Côrtes Martins] [orcid=0000-0002-6830-1948]
 * @meta.dependency [type=Module] [uri=./metrics-string.js] [name=String Similarity Library] [authorUri=https://sumn2u.medium.com/] [authorName=Suman Kunwar]
 * @meta.dependency [type=Function] [uri=./remove-markdown.js] [name=Markdown Removal] [authorUri=https://github.com/stiang/] [authorName=Stiang]
 *
 */
 
 /**
 * Main global portable module.
 * @namespace 
 * @property {Function} FairLibWrapper - {@link FairLibWrapper}
 *
 * @namespace fairlibjs
 * @property {Function} evaluateAnnotation - {@link fairlibjs.evaluateAnnotation}
 * @property {Function} performKeyExtranctionEdamMappingInBatch - {@link fairlibjs.performKeyExtranctionEdamMappingInBatch}
 * @property {Function} mapEdamWithKeywords - {@link fairlibjs.mapEdamWithKeywords}
 * @property {Function} parseEdamComponents - {@link fairlibjs.parseEdamComponents}
 * @property {Function} parseXmlCollection - {@link fairlibjs.parseXmlCollection}
 * @property {Function} set_gpt_key - {@link fairlibjs.set_gpt_key}
 * @property {Function} completions - {@link fairlibjs.completions}
 * @property {Function} get_gpt_keywords - {@link fairlibjs.get_gpt_keywords}
 * @property {Function} get_rake_keywords - {@link fairlibjs.get_rake_keywords}
 * @property {Function} getLines - {@link fairlibjs.getLines}
 * @property {Function} getSourceGeneralMeta - {@link fairlibjs.getSourceGeneralMeta}
 * @property {Function} genRoCrateLibAnnotation - {@link fairlibjs.genRoCrateLibAnnotation}
 * @property {Function} searchResearchProduct - {@link fairlibjs.searchResearchProduct}
 * @property {Function} searchPublication - {@link fairlibjs.searchPublication}
 * @property {Function} searchData - {@link fairlibjs.searchData}
 * @property {Function} searchSoftware - {@link fairlibjs.searchSoftware}
 * @property {Function} searchOther - {@link fairlibjs.searchOther}
 * @property {Function} searchProject - {@link fairlibjs.searchProject}
 * @property {Function} loadScript - {@link fairlibjs.loadScript}
 */
 
 /**
 *
 *
 * @object FairLibWrapper
 * @attribute {edam} Object containing the EDAM ontology concepts concerning topics and operations, with their ids, name and synonyms.
 */

/** 
* Initializes the FairLibJs Library object
* 
*
*
* @returns {Object} FairLibJs library object to help FAIR description of objects
* 
* @example
* let v = await FairLibWrapper()
*/
var FairLibWrapper = async function ( ){
    var obj = {}
    
    obj = await Promise.all( [ ( fairlibjs.parseEdamComponents(obj) ), (import("https://cdn.jsdelivr.net/npm/pos@0.4.2/+esm")), ( fairlibjs.loadScript( location.href+'metrics-string.js' ) ), ( fairlibjs.loadScript( location.href+'gendoc.js' ) ), ( fairlibjs.loadScript( location.href+'remove-markdown.js' ) ), ( fairlibjs.loadScript("https://cdn.jsdelivr.net/npm/@shopping24/rake-js@2.2.1/dist/extract.min.js") ) ] ).then( libs => {
        obj['edam'] = libs[0]
        obj['pos'] = libs[1]
        
        return obj
    })
    
    return obj
}

 /*------------------------ Key words extraction & EDAM mapping ---------------------*/
 
/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name evaluateAnnotation
 * @meta.description Calculate the matchings and the score obtained by comparing the list of predicted and curated annotations 
*
*
* Calculate the matchings and the score obtained by comparing the list of predicted and curated annotations 
* 
*
* @param {Array} predicted List of predicted annotations
* @param {Array} real List of curated annotations
* @param {number} cutoff Similarity cutoff value above which the pair of strings can be considered a match
*
* @returns {Array} List containing the results of the overall number of matchings and the details of each predicted value with the max term similar from each available metric.
* 
* @example
* let v = await fairlibjs.evaluateAnnotation( ['gene set enrichment analysis', 'personalized medicine'], ['Gene-set enrichment analysis', 'Rare diseases'], 0.8 )
*/
fairlibjs.evaluateAnnotation = function(predicted, real, cutoff){
    let obj = { matchings: 0, details: [] }
    
    predicted.forEach( k => {
        let jarosim = max( real.map( s => JaroWrinkler(s, k) ) )
        let levsim = max( real.map( s => ( LevenshteinDistance(s, k) / k.length ) ) )
        let csim = max( real.map( s => CosineSimilarity(s, k) ) )
        let trigsim = max( real.map( s => { 
            let trig = TrigramIndex( [k] )
            let sim = ( trig.find(s).length > 0 ) ? trig.find(s)[0].matches / s.length : 0
            return sim
        }))
        
        let pred = false
        if( jarosim>=cutoff || levsim>=cutoff || csim>=cutoff || trigsim>=cutoff ){
            obj.matchings += 1
            pred = true
        }
        let obres = { predicted_value: k, matched: pred, simCosine: csim, simJaroWrinkler: jarosim, simLevenshtein: levsim, simTrigram: trigsim }
        obj.details.push(obres)
    })
    
    return obj
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name performKeyExtranctionEdamMappingInBatch
 * @meta.description Perform keyword extraction and calculate similarity and map edam topic and operation concepts to the keywords in batch
*
*
* Perform keyword extraction and calculate similarity and map edam topic and operation concepts to the keywords in batch
* 
*
* @param {string} url URL of a json dataset containing a list of objects with at least one property (description) 
* @param {boolean} evaluate Flag that indicates whether if must evaluate the matchings of thepredicted keywords, topics and operations to the ones previously assigned. In case the value is true, there must be the properties keywords, topics and operations in each object from the list described above, with a string array as their values.
*
* @returns {Array} List containing the original objects of the input with additional properties for evaluation and the predicted keywords, topics and operations.
* 
* @example
* let v = await fairlibjs.performKeyExtranctionEdamMappingInBatch( location.href+'list_workflowhub.json', true )
*/
fairlibjs.performKeyExtranctionEdamMappingInBatch = async function(url, evaluate = false){
    let dat = await fetch( url )
    dat = await dat.json()

    let obj = await FairLibWrapper()
    let cutoff = 0.8
    let res = []
    for( let doc of dat ){
        let desc = removeTags(doc.description)
        desc = removeMd(desc)
        
        let keys = fairlibjs.get_rake_keywords(obj, desc, 3)
        keys = keys.answer
        obj.keywords = keys
        let sims = fairlibjs.mapEdamWithKeywords(obj)
        
        let flag = !evaluate
        if( evaluate ){
            if(doc.keywords){
                doc.eval_keywords = fairlibjs.evaluateAnnotation(keys, doc.keywords, cutoff)
                flag = true
            }
            if(doc.topics){
                doc.eval_topics = fairlibjs.evaluateAnnotation( sims.topic.map( v => v.edamLabel ), doc.topics.map( v => v.name ), cutoff)
                flag = true
            }
            if(doc.operations){
                doc.eval_operations = fairlibjs.evaluateAnnotation( sims.operation.map( v => v.edamLabel ), doc.operations.map( v => v.name ), cutoff)
                flag = true
            }
        }
        
        doc.predicted_keys = keys
        doc.predicted_topics = sims.topic
        doc.predicted_operations = sims.operation
        
        //delete doc.descricao
        doc.descricao = desc
        
        console.log( doc )
        if(flag){
            res.push(doc)
        }
    }
    
    return res
}
 
/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name get_rake_keywords
 * @meta.description Calculate similarity and map edam topic and operation concepts to the keywords
*
*
* Calculate similarity and map edam topic and operation concepts to the keywords
* 
*
* @param {Object} fobj FairLibWrapper object with the keywords already setted up
*
* @returns {Array} List containing the similarity pairs object with EDAM ID, keyword and and mean score based on cosine similarity calculation with the edam concept label and its synonyms. These objects are grouped ans sorted according to the topic and operation EDAM branches
* 
* @example
* let fobj = await FairLibWrapper()
* fobj.keywords = fairlibjs.get_rake_keywords(fobj, "PredPrIn is a scientific workflow to predict Protein-Protein Interactions (PPIs) using machine learning to combine multiple PPI detection methods of proteins according to three categories: structural, based on primary aminoacid sequence and functional annotations.", 2)
* let v = await fairlibjs.mapEdamWithKeywords(fobj)
*/
fairlibjs.mapEdamWithKeywords = (fobj) => {
    var sims={'topic': [], 'operation': []}

    for( let t of Object.keys(sims) ){
        fobj.keywords.forEach( k => {
            let temp = []
            fobj.edam[t].forEach( cls => {
              let jarosim = mean( cls.synonyms.concat(cls.name).map( s => JaroWrinkler(s, k) ) )
              
              let levsim = mean( cls.synonyms.concat(cls.name).map( s => { 
                let den = s; 
                if( s.length < k.length ){
                  den = k;
                }
                return ( (1 - (LevenshteinDistance(s, k) / den.length ) ) ); 
              } ) )
              
              let csim = mean( cls.synonyms.concat(cls.name).map( s => CosineSimilarity(s, k) ) )
              
              let trigsim = mean( cls.synonyms.concat(cls.name).map( s => { 
                let trig = TrigramIndex( [k] )
                let sim = ( trig.find(s).length > 0 ) ? trig.find(s)[0].matches / s.length : 0
                return sim
              }))
              
              var committee_sum = sum( [jarosim, levsim, csim, trigsim].map( e => e > 0.2) ) 
              var committee_mean = mean( [jarosim, levsim, csim, trigsim] ) 
              if( committee_mean > 0.5 ){
                temp.push( { edamId: cls.id.split('_')[1], edamLabel: cls.name, key: k, simCosine: csim, simJaroWrinkler: jarosim, simLevenshtein: levsim, simTrigram: trigsim } )
              }
            })
            temp.sort( (a, b) => b.sim - a.sim )
            // temp = temp.slice(0,200)
            sims[t] = sims[t].concat( temp )
        })
        sims[t].sort( (a, b) => b.sim - a.sim )
    }
    
    return sims
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name parseEdamComponents
 * @meta.description Parse Edam ontology components
*
*
* Parse Edam ontology components
* 
* @async
* @function parseEdamComponents 
* @memberof fairlibjs
*
* @param {Object} fobj FairLibWrapper object
*
* @returns {Array} List of objects containing the id, name, parent and synonyms of the edam classes
* 
* @example
* let fobj = await FairLibWrapper()
* var parsedEdam = await fairlibjs.parseEdamComponents(v)
*/
fairlibjs.parseEdamComponents = async function(fobj){
    fobj['edam'] = {}
    
    var dat = await fetch( location.href+'EDAM_dev.owl' )
    dat = await dat.text()
    let parser = new DOMParser()
    let doc = parser.parseFromString(dat, "text/xml")
    let chs = Array.from(doc.getElementsByTagName("owl:Class")).filter( ch => ch.getAttribute('rdf:about') && Array.from(ch.getElementsByTagName("rdfs:subClassOf")).length>0 )
    
    let components = ['data', 'format', 'topic', 'operation']
    for(let c of components){
        let items = chs.filter( ch => ch.getAttribute('rdf:about').includes( c+'_' )  )
        fobj['edam'][c] = fairlibjs.parseXmlCollection( items )
    }
    
    return fobj['edam']
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name parseXmlCollection
 * @meta.description Parse HTML Collection retrieved from Edam XML ontology
*
*
* Parse HTML Collection retrieved from Edam XML ontology
* 
* @async
* @function parseXmlCollection 
* @memberof fairlibjs
*
* @param {HTMLCollection} collection Edam HTML tags collection filtered from raw XML file parsing
*
* @returns {Array} List of objects containing the id, name, parent and synonyms of the edam classes
* 
* @example
* var dat = await fetch( location.href+'EDAM_dev.owl' )
* dat = await dat.text()
* let parser = new DOMParser()
* let doc = parser.parseFromString(dat, "text/xml")
* let chs = Array.from(doc.getElementsByTagName("owl:Class")).filter( ch => ch.getAttribute('rdf:about') && Array.from(ch.getElementsByTagName("rdfs:subClassOf")).length>0 )
* var parsed = await fairlibjs.parseXmlCollection( chs )
*/
fairlibjs.parseXmlCollection = function(collection){
    let list = []
    collection.forEach( item => {
        let flag = true;
        let depr = item.getElementsByTagName('owl:deprecated')
        if(depr.length != 0){
            if( depr[0].textContent == "true" ){
                flag = false
            }
        } 
        
        if(flag){
            let obj = {}
            obj['id'] = item.getAttribute('rdf:about')
            obj['name'] = item.getElementsByTagName('rdfs:label')[0].textContent
            obj['parent'] = item.getElementsByTagName('rdfs:subClassOf')[0].getAttribute('rdf:resource')
            obj['synonyms'] = Array.from( item.getElementsByTagName('oboInOwl:hasNarrowSynonym') ).map( s => s.textContent )
            list.push(obj)
        }
    })
    
    return list
}
 
/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name set_gpt_key
 * @meta.description Setup the open ai chat gpt key
*
*
* Setup the open ai chat gpt key
* 
*
* @param {string} key Open AI key
* 
* @example
* let v = await fairlibjs.set_gpt_key( "Is there evidence for the carcinogenicity of opium consumption?" )
*/
fairlibjs.set_gpt_key = async (key) => {
    localStorage.GPT_API_key = key
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name completions
 * @meta.description Send question, context paragrpahs from monographs and the instruction to open ai chat gpt
*
*
* Send question, context paragrpahs from monographs and the instruction to open ai chat gpt
* 
*
* @param {array} messages Array of objects required for the competion in the question answering system of openai chat gpt (role: assistant, user or system; content: personalized text according to the role)
* @param {string} [model=gpt-3.5-turbo] GPT model to use
* @param {number} [temperature=0.7] Temperature (as you increase this number more random is the answer returned to you)
*
* @returns {Object} Openai answer object
* 
* @example
* let msgs = [ { role: 'system', content: "You are a helpful assistant that extract the most impotant key words given a text" }, { role: 'user', content: "Is there evidence for the carcinogenicity of opium consumption?" } ]
* let v = await fairlibjs.completions(msgs, 'gpt-3.5-turbo', 0.7)
*/
fairlibjs.completions = async function (messages, model='gpt-3.5-turbo', temperature=0.7){
    let key = localStorage.GPT_API_key
    if(key!='' && key!=null && key!="none"){
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

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name get_gpt_keywords
 * @meta.description Send summary text to chat gpt to extract keywords
*
*
* Send summary text to chat gpt to extract keywords
* 
*
* @param {string} q Tool summary
*
* @returns {array} List of keywords from chat gpt
* 
* @example
* let v = await fairlibjs.get_gpt_keywords( "PredPrIn is a scientific workflow to predict Protein-Protein Interactions (PPIs) using machine learning to combine multiple PPI detection methods of proteins according to three categories: structural, based on primary aminoacid sequence and functional annotations." )
*/
fairlibjs.get_gpt_keywords = async (q) => {
    let key = localStorage.GPT_API_key
    var obj = null
    if(key!='' && key!=null && key!="none"){
        var instruction = "You are a helpful assistant that extract the most significant keywords from a text with at least two tokens, show them separated by comma"
        var messages = []
        messages.push( { role: 'system', content: instruction } )
        //messages.push( { role: 'assistant', content: corpus } )
        messages.push( { role: 'user', content: q } )
        
        var obj={ 'messages': messages, 'question': q }
        var answer = await fairlibjs.completions( obj['messages'], 'gpt-3.5-turbo', 0.7)
        
        let keys = []
        let res = answer
        if( res.choices != null ){
            if(res.choices.length > 0 ){
                ans_html="Most probable keyword:\n"
                var i=0
                for (var r of res.choices){
                    keys = keys.concat( r.message.content.split(',').map( k => k.split(' ').slice(1).join(' ') ).filter( k => k.split(" ").length>1 ) )
                }
            }
        }
        obj['answer'] = keys
    }
    else{
        console.log('Error: Openai key was not found.')
    }
        
    
    return obj
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name get_rake_keywords
 * @meta.description Send summary text NLP RAKE method to extract keywords
*
*
* Send summary text NLP RAKE method to extract keywords
* 
*
* @param {Object} fobj FairLibWrapper object with the keywords already setted up
* @param {string} q Tool summary
* @param {number} [score_cutoff=2] Score cut off to consider keyword
*
* @returns {array} List of keywords from rake method
* 
* @example
* let fobj = await FairLibWrapper()
* let v = fairlibjs.get_rake_keywords( fobj, "PredPrIn is a scientific workflow to predict Protein-Protein Interactions (PPIs) using machine learning to combine multiple PPI detection methods of proteins according to three categories: structural, based on primary aminoacid sequence and functional annotations.", 3 )
*/
fairlibjs.get_rake_keywords = (fobj, q, score_cutoff = 2) => {
    score_cutoff = ( score_cutoff && score_cutoff!=0 ) ?? 2
    
    var obj = {}
    
    var words = new fobj.pos.Lexer().lex( q );
    var tagger = new fobj.pos.Tagger();
    var taggedWords = tagger.tag(words);
    let validTags = taggedWords.filter( t => t[1].indexOf('J')==0 || t[1].indexOf('N')==0 )
    let auxstop = taggedWords.filter( t => t[1].indexOf('J')!=0 && t[1].indexOf('N')!=0 ).map( w => w[0] )
    auxstop = auxstop.map( w => w.replace(/[^a-zA-Z ]/g, "") ).filter( w => w!='' )   
    
    let { result } = extract.extract( q ).setOptions({ stopWords: auxstop })
        .pipe( extract.extractKeyPhrases)
        .pipe( extract.extractAdjoinedKeyPhrases)
        .pipe( extract.keywordLengthFilter)
        .pipe( extract.distinct)
        .pipe( extract.scoreWordFrequency)
        .pipe( extract.sortByScore)
    
    result = result.filter( i => i.score > score_cutoff )
    result.sort( (a, b) => b.score - a.score )
    result = result.map( i => i.phrase ).slice(0,200)
    obj.answer = result
    
    return obj
}
 
 /*------------------------ Tool RO-Crate generation ---------------------*/
 /**
 *
 *
 * @object RocrateArtifact
 * @attribute {url} URL of the library to mine the annotations to create RO-Crate metadata
 */

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name RocrateArtifact
 * @meta.description Initializes the Research Object Crate object
*
*
* Initializes the Research Object Crate object
* 
*
*
* @returns {Object} RocrateArtifact object containing the url and the graph jsonLD-like object
* 
* @example
* let v = await RocrateArtifact()
*/
RocrateArtifact = function ( sourceCodeUrl ) {
    var artifact = { url: sourceCodeUrl, graph: {} }
    var core = {
        "@context": { 
            "local": location.href.split("#")[0], 
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#", 
            "sc": "http://schema.org/",
            "dct": "http://purl.org/dc/terms/",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "edam": "http://edamontology.org/",
            "bsct":"http://bioschemas.org/types/",
            "bsc":"http://bioschemas.org/",
            "scoro": "http://purl.org/spar/scoro/"
        }, 
        "@graph": [ { "@type": "schema:CreativeWork", "@id": "ro-crate-metadata.json", "conformsTo": { "@id": "https://w3id.org/ro/crate/1.1" }, "about": { "@id": "./" } } ] 
    }
    artifact.graph = core
    return artifact
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name getLines
 * @meta.description Read and parse lines of the library source code
*
*
* Read and parse lines of the library source code
* 
* @async
* @function getLines 
* @memberof fairlibjs
*
* @param {Object} artobj Research Object Crate object
*
* @returns {Array} List containing the source code lines
* 
* @example
* let robj = RocrateArtifact( location.href.split('#')[0]+'fairlibjs.js' )
* var lines = await fairlibjs.getLines(robj)
*/
fairlibjs.getLines = async (artobj) =>{
    let r = await fetch(artobj.url);
    var t = await r.text()
    t=t.split('\n')
    artobj.lines=t
    
    return t
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name getSourceGeneralMeta
 * @meta.description Mine initial metadata (authors, name description and license) from the lines of the library source code
*
*
* Mine initial metadata (authors, name description and license) from the lines of the library source code
* 
* @async
* @function getSourceGeneralMeta 
* @memberof fairlibjs
*
* @param {Object} artobj Research Object Crate object
*
* @returns {Array} Object containing the mined annotations such as name, description, license, type and authors metadata (orcid and name)
* 
* @example
* let robj = RocrateArtifact( location.href.split('#')[0]+'fairlibjs.js' )
* var annotations = await fairlibjs.getSourceGeneralMeta(robj)
*/
fairlibjs.getSourceGeneralMeta = async function(artobj){
    if( ! artobj.lines ){
        await fairlibjs.getLines(artobj)
        gendoc.lines = artobj.lines
    }
    
    let annotations = []
    
    let genAnnot = {}
    let authors = { "idList": [], "resources": [] }
    let deps = { "idList": [], "resources": [] }
    let keys = ["identifier", "type", "subtype", "name", "description", "license", "belongsTo", "reference", "version"]
    var flag = false
    for( let l of artobj.lines ){
        if(l.includes("*/")){
            flag = false
            if( Object.keys(genAnnot).length > 0 ){
                
                if(authors["idList"].length > 0){
                    genAnnot['authors'] = authors
                }
                if(deps["idList"].length > 0){
                    genAnnot['dependencies'] = deps
                }
                annotations.push( genAnnot )
            }
        }
        
        if(flag){
            for( let k of keys ){
                if(l.includes(`@meta.${k}`)){
                    if(k=="reference"){
                        if( ! genAnnot[k] ){
                            genAnnot[k] = [ ]
                        }
                        genAnnot[k].push( l.split(`@meta.${k}`)[1].slice(1) )
                    }
                    else{
                        genAnnot[k] = (k=="license") ? l.split(`@meta.${k}`)[1].slice(1).replaceAll(" ", "") : l.split(`@meta.${k}`)[1].slice(1)
                    }
                }
            }
            
            if(l.includes("@meta.author")){
                let ide = l.match(/\[identifier=(.*?)\]/g) 
                let name = l.match(/\[name=(.*?)\]/g) 
                let orcid = l.match(/\[orcid=(.*?)\]/g) 
                
                if( !!ide || !!name || !!orcid ){
                    let aobj = { '@type': 'schema:Person' }
                    if( !!ide ){
                        aobj['@id'] = ide[0].split("identifier=")[1].slice(0,-1)
                    }
                    if( !!name ){
                        aobj['sc:name'] = name[0].split("name=")[1].slice(0,-1)
                    }
                    if( !!orcid ){
                        aobj['scoro:hasORCID'] = orcid[0].split("orcid=")[1].slice(0,-1)
                    }
                    
                    if( ! aobj['@id'] ){
                        aobj['@id'] = (!!orcid) ? 'https://orcid.org/'+aobj['scoro:hasORCID'] : '#'+aobj['name'].toLowerCase().replaceAll(' ', '-')
                        aobj["dct:identifier"] = aobj["@id"]
                    }
                    
                    authors["idList"].push( { '@id': aobj['@id'] } )
                    authors["resources"].push( aobj )
                }
            }
            
            if(l.includes("@meta.dependency")){
                let type = l.match(/\[type=(.*?)\]/g) 
                let uri = l.match(/\[uri=(.*?)\]/g) 
                let name = l.match(/\[name=(.*?)\]/g)
                let authorUri = l.match(/\[authorUri=(.*?)\]/g)
                let authorName = l.match(/\[authorName=(.*?)\]/g)
                
                if( !!uri ){
                    let olib = { '@id': uri[0].split("uri=")[1].slice(0,-1) }
                    olib["dct:identifier"] = olib["@id"]
                    if( !!name ){
                        olib['sc:name'] = name[0].split("name=")[1].slice(0,-1)
                    }
                    if( !!type ){
                        type = type[0].split("type=")[1].slice(0,-1)
                        if( type.toLowerCase() == "module" ){
                            olib["dct:conformsTo"] = { "@id": "https://bioschemas.org/profiles/ComputationalTool/1.0-RELEASE", "@type": "schema:CreativeWork" }
                            olib["sc:applicationCategory"] = "Library"
                        }
                        if( type.toLowerCase() == "function" ){
                            olib["sc:applicationCategory"] = "Script"
                        }
                    }
                    
                    if( !! authorUri || !! authorName ){
                        if( !! authorUri ){
                            authorUri = authorUri[0].split("authorUri=")[1].slice(0,-1)
                        }
                        if( !! authorName ){
                            authorName = authorName[0].split("authorName=")[1].slice(0,-1)
                        }
                        let aobj = { '@type': 'schema:Person' }
                        aobj['@id'] = (!! authorUri) ? authorUri : '#'+authorName.toLowerCase().replaceAll(' ', '-')
                        if( !!authorName ){
                            aobj['sc:name'] = authorName
                        }
                        olib["sc:creator"] = aobj
                        olib["dct:creator"] = aobj
                    }
                    
                    deps["idList"].push( { '@id': olib['@id'] } )
                    deps["resources"].push( olib )
                }
            }
        }
        
        if(l.includes("/*")){
            flag = true
            genAnnot = {}
            authors = { "idList": [], "resources": [] }
            deps = { "idList": [], "resources": [] }
        }
    }
    
    
    return annotations
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name genFunctionParametersAnnotation
 * @meta.description Generate the parameter annotations following bioschemas FormalParameter descriptors for the declared input and output in the library properties
*
*
* Generate the parameter annotations following bioschemas FormalParameter descriptors for the declared input and output in the library properties
* 
* @async
* @function genFunctionParametersAnnotation 
* @memberof fairlibjs
*
* @param {Object} details Object containing the details of the found properties of the library
* @param {string} functionName Name of the function to retrieve the input and output parameters
* @param {string} functionURI Function description URI
*
* @returns {Array} Object containing the mined annotations of inputs and outputs, if they exist for the given function
* 
* 
* @example
* let robj = RocrateArtifact( location.href.split('#')[0]+'fairlibjs.js' )
* var annotations = await fairlibjs.getSourceGeneralMeta(robj)
* let details = gendoc.propertyDetails
* let data = fairlibjs.genFunctionParametersAnnotation( details, "getSourceGeneralMeta" )
*/
fairlibjs.genFunctionParametersAnnotation = function(details, functionName, functionURI){
    let dataflowAnnotations = { "inputs": [], "output": [] }
    
    let obj = details.filter( d => d.name.includes(functionName) )[0]
    if( obj!=undefined ){
        let subindex = 1
        let inputs = []
        for( let p of obj.params ){
            let format = "xsd:string"
            if( p.type == "number" ){
                format = "xsd:float"
            }
            if( p.type == "boolean" ){
                format = "xsd:boolean"
            }
            if( p.type.toLowerCase() == "datetime" ){
                format = "xsd:dateTime"
            }
            if( p.type.toLowerCase() == "object" ){
                format = "edam:format_3464"
            }
            if( p.type.toLowerCase() == "array" ){
                format = "edam:data_2082"
            }
            
            let pannot = {
              "@type": "bsct:FormalParameter",
              "@id": `${ functionURI }_inputs_${subindex}`,
              "dct:identifier": `${ functionURI }_inputs_${subindex}`,
              "dct:conformsTo": "https://bioschemas.org/profiles/FormalParameter/1.0-RELEASE",
              "sc:name": p.name,
              "sc:encodingFormat": format,
              "sc:valueRequired": true
            }
            if( p.description ){
                pannot["sc:description"] = p.description
            }
            if( p.default ){
                pannot["sc:defaultValue"] = p.default
                pannot["sc:valueRequired"] = false
            }
            
            inputs.push( pannot )
            subindex += 1
        }
        dataflowAnnotations["inputs"] = inputs
        
        let outputs = []
        subindex = 0
        if( obj.return_.type ){
            let format = "xsd:string"
            if( obj.return_.type == "number" ){
                format = "xsd:float"
            }
            if( obj.return_.type == "boolean" ){
                format = "xsd:boolean"
            }
            if( obj.return_.type.toLowerCase() == "datetime" ){
                format = "xsd:dateTime"
            }
            if( obj.return_.type.toLowerCase() == "object" ){
                format = "http://edamontology.org/format_3464"
            }
            if( obj.return_.type.toLowerCase() == "array" ){
                format = "http://edamontology.org/data_2082"
            }
            
            let oannot = {
              "@type": "bsct:FormalParameter",
              "@id": `${ functionURI }_outputs_${subindex}`,
              "dct:identifier": `${ functionURI }_outputs_${subindex}`,
              "dct:conformsTo": "https://bioschemas.org/profiles/FormalParameter/1.0-RELEASE",
              "sc:encodingFormat": format
            }
            if( obj.return_.description ){
                oannot["sc:description"] = obj.return_.description
            }
            outputs.push( oannot )
            subindex += 1
        }
        dataflowAnnotations["output"] = outputs
    }
    
    return dataflowAnnotations
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name genRoCrateLibAnnotation
 * @meta.description Run and Use the annotations retrieved from the general metadata extraction funciton to feed the RO-Crate object
*
*
* Run and Use the annotations retrieved from the general metadata extraction funciton to feed the RO-Crate object
* 
* @async
* @function genRoCrateLibAnnotation 
* @memberof fairlibjs
*
* @param {Object} artobj Research Object Crate object
*
* 
* @example
* let robj = RocrateArtifact( location.href.split('#')[0]+'fairlibjs.js' )
* await fairlibjs.genRoCrateLibAnnotation(robj)
*/
fairlibjs.genRoCrateLibAnnotation = async function(artobj){
    let annotations = await fairlibjs.getSourceGeneralMeta(artobj)
    gendoc.getDetails("")
    let details = gendoc.propertyDetails
    
    let index=0
    for( let genAnot of annotations ){
        let nickname = (!! genAnot.subtype) ? genAnot.subtype : (!! genAnot.type) ? genAnot.type : "Element"
        
        let typ = ""
        let olib = {  "@id": ( !! genAnot["identifier"] ) ? genAnot["identifier"] : `${artobj.url}#${genAnot.subtype}_${index}` }
        olib["dct:identifier"] = olib["@id"]
        if( genAnot.type.toLowerCase() == "software" ){
            if( genAnot.subtype.toLowerCase() == "module" ){
                olib["dct:conformsTo"] = { "@id": "https://bioschemas.org/profiles/ComputationalTool/1.0-RELEASE", "@type": "schema:CreativeWork" }
                olib["sc:applicationCategory"] = "Library"
            }
            if( genAnot.subtype.toLowerCase() == "function" ){
                olib["sc:applicationCategory"] = "Script"
            }
        }
        if( !! genAnot["name"] ){
            olib["sc:name"] = genAnot["name"]
        }
        if( !! genAnot["version"] ){
            olib["sc:softwareVersion"] = genAnot["version"]
            olib["sc:isAccessibleForFree"] = true
        }
        if( !! genAnot["description"] ){
            olib["sc:description"] = genAnot["description"]
        }
        if( !! genAnot["license"] ){
            olib["sc:license"] = `https://spdx.org/licenses/${genAnot["license"]}`
            olib["dct:license"] = `https://spdx.org/licenses/${genAnot["license"]}`
        }
        if( artobj.url.split(".").slice(-1)[0].toLowerCase().includes("js") ){
            olib["sc:programmingLanguage"] = {"@id": "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript", "sc:name": "Javascript" }
        }
        if( !! genAnot["authors"] ){
            olib["sc:creator"] = genAnot["authors"]["idList"]
            olib["dct:creator"] = genAnot["authors"]["idList"].map( r => r["@id"] )
            olib["dct:contributor"] = genAnot["authors"]["idList"].map( r => r["@id"] )
            for( let r of genAnot["authors"]["resources"] ){
                if( artobj.graph["@graph"].filter( o => o["@id"] == r["@id"] ).length == 0 ){
                    artobj.graph["@graph"].push( r )
                }
            }
        }
        if( !! genAnot["dependencies"] ){
            olib["dct:requires"] = genAnot["dependencies"]["idList"]
            for( let r of genAnot["dependencies"]["resources"] ){
                if( artobj.graph["@graph"].filter( o => o["@id"] == r["@id"] ).length == 0 ){
                    artobj.graph["@graph"].push( r )
                }
            }
        }
        
        if( !! genAnot["reference"] ){
            olib["rdfs:seeAlso"] = genAnot["reference"]
            olib["sc:sameAs"] = genAnot["reference"]
        }
        if( !! genAnot["belongsTo"] ){
            olib["sc:isPartOf"] = { "@id": genAnot["belongsTo"] }
            
            let parent = artobj.graph["@graph"].filter( n => n["@id"] == genAnot["belongsTo"] )
            if( parent.length > 0 ){
                parent = parent[0]
                if( ! parent["sc:hasPart"] ) {
                    parent["sc:hasPart"] = []
                }
                parent["sc:hasPart"].push( { "@id": olib["@id"] } )
            }
        }
        
        let libId = olib["@id"]
        let data = fairlibjs.genFunctionParametersAnnotation( details, genAnot["name"], libId )
        //console.log(genAnot["name"], genAnot['authors'])
        if( data.inputs.length>0 ){
            olib["bsc:input"] = data.inputs
        }
        if( data.output.length>0 ){
            olib["bsc:output"] = data.output
        }
        
        artobj.graph["@graph"].push( olib )
        
        index+=1
    }
    
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name saveFile
 * @meta.description Open the file in download mode
*
*
* Open the file in download mode
* 
*
* @param {Object} x Compressed binary file.
* @param {string} filename Filename for exportation.
*
* @returns {HTMLAnchorElement} HTML anchor (<a />) element with the click event fired.
* 
* @example
* let robj = RocrateArtifact( location.href.split('#')[0]+'fairlibjs.js' )
* await fairlibjs.genRoCrateLibAnnotation(robj)
* let content = JSON.stringify(robj.graph)
* var tagA = await fairlibjs.saveFile(content, 'indexFile.gz')
*/
fairlibjs.saveFile=function(x,fileName) { // x is the content of the file
	// var bb = new Blob([x], {type: 'application/octet-binary'});
	// see also https://github.com/eligrey/FileSaver.js
	var bb = new Blob([x]);
   	var url = URL.createObjectURL(bb);
	var a = document.createElement('a');
   	a.href=url;
   	a.download=fileName
	a.click()
	return a
}

/*------------------------ OpenAire data retrieval & publication annotation ---------------------*/

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchResearchProduct
 * @meta.description Retrieve OpenAire research products given general parameters
*
*
* Retrieve OpenAire research products given general parameters
* 
* @async
* @function searchResearchProduct 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for research product. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchResearchProduct(params)
*/
fairlibjs.searchResearchProduct = async function (parameters) {
    let valid = fairlibjs.validOpenAireParams.general.concat( fairlibjs.validOpenAireParams.product )
    let params = []
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/researchProducts/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        
        var results = doc.getElementsByTagName("oaf:result")
        var objs = []
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            objs.push( { doi: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    return objs
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchPublication
 * @meta.description Retrieve OpenAire publications given general parameters
*
*
* Retrieve OpenAire publications given general parameters
* 
* @async
* @function searchPublication 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for publication. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchPublication(params)
*/
fairlibjs.searchPublication = async function (parameters) {
    let extraValid = ["instancetype","originalId","sdg","fos","openairePublicationID"]
    let valid = fairlibjs.validOpenAireParams.general.concat( fairlibjs.validOpenAireParams.product ).concat( extraValid )
    let params = []
    
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    var jsonld = { "@context": { "local": location.href.split("#")[0], "rdfs": "http://www.w3.org/2000/01/rdf-schema#", "sc": "http://schema.org/", "dct": "http://purl.org/dc/terms/", "bibo": "http://purl.org/ontology/bibo/", "@coerce": { "@iri": "contains" } }, "@graph": [] }
    var objs = []
        
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/publications/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        console.log( doc )
        var results = doc.getElementsByTagName("oaf:result")
        
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var publisher = r.getElementsByTagName("publisher")[0].innerHTML
            var description = r.getElementsByTagName("description")[0].innerHTML
            var date = r.getElementsByTagName("dateofacceptance")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            jsonld["@graph"].push( { "@type": "bibo:Article", "dct:identifier": id, "rdfs:seeAlso": `https://doi.org/${id}`, "sc:sameAs": `https://doi.org/${id}`, "dct:type": "Article", "rdfs:label": title, "dct:title": title, "dct:description": description, "dct:publisher": publisher, "dct:date": date, "bibo:authorList": authors.map( a => { return { "@id": `local:${a.name.toLowerCase().replaceAll(" ","-")}`, "@type": "schema:Person", "rdfs:label": a.name,  } } ) } )
            objs.push( { identifier: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    
    return { jsonld: jsonld, direct_object: objs }
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchData
 * @meta.description Retrieve OpenAire data given general parameters
*
*
* Retrieve OpenAire data given general parameters
* 
* @async
* @function searchData 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for data. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchData(params)
*/
fairlibjs.searchData = async function (parameters) {
    let extraValid = ["openaireDatasetID"]
    let valid = fairlibjs.validOpenAireParams.general.concat( fairlibjs.validOpenAireParams.product ).concat( extraValid )
    let params = []
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/datasets/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        
        var results = doc.getElementsByTagName("oaf:result")
        var objs = []
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            objs.push( { doi: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    return objs
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchSoftware
 * @meta.description Retrieve OpenAire software given general parameters
*
*
* Retrieve OpenAire software given general parameters
* 
* @async
* @function searchSoftware 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for software. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchSoftware(params)
*/
fairlibjs.searchSoftware = async function (parameters) {
    let extraValid = ["openaireSoftwareID"]
    let valid = fairlibjs.validOpenAireParams.general.concat( fairlibjs.validOpenAireParams.product ).concat( extraValid )
    let params = []
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/software/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        
        var results = doc.getElementsByTagName("oaf:result")
        var objs = []
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            objs.push( { doi: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    return objs
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchOther
 * @meta.description Retrieve OpenAire other contributions given general parameters
*
*
* Retrieve OpenAire other contributions given general parameters
* 
* @async
* @function searchOther 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for other product contributions. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchOther(params)
*/
fairlibjs.searchOther = async function (parameters) {
    let extraValid = ["openaireOtherID"]
    let valid = fairlibjs.validOpenAireParams.general.concat( fairlibjs.validOpenAireParams.product ).concat( extraValid )
    let params = []
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/other/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        
        var results = doc.getElementsByTagName("oaf:result")
        var objs = []
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            objs.push( { doi: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    return objs
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name searchProject
 * @meta.description Retrieve OpenAire projects given general parameters
*
*
* Retrieve OpenAire projects given general parameters
* 
* @async
* @function searchProject 
* @memberof fairlibjs
*
* @param {Object} parameters Object containing the key parameters available for project. You may browse the valid attributes in fairlibjs.validOpenAireParams.general, fairlibjs.validOpenAireParams.product or reading the specifications in https://graph.openaire.eu/develop/api.html
*
* 
* @returns {Object} Parsed Object containing the real values of the original xml returned by the API
* 
* @example
* let params = { orcid: '0000-0002-6830-1948' }
* var results = await fairlibjs.searchProject(params)
*/
fairlibjs.searchProject = async function (parameters) {
    let extraValid = ["sortBy","grantID","openairePublicationID","name","acronym","callID","startYear","endYear","participantCountries","participantAcronyms"]
    let valid = fairlibjs.validOpenAireParams.general.concat( extraValid )
    let params = []
    Object.keys(parameters).forEach( p => { 
        if(valid.includes(p)) { 
            params.push(`${p}=${parameters[p]}`) 
        }
    })
    let ext = params.join("&")
    
    if(ext!=""){
        var dat = await fetch(`https://api.openaire.eu/search/projects/?${ext}`)
        dat = await dat.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(dat, "text/xml")
        
        var results = doc.getElementsByTagName("oaf:result")
        var objs = []
        for( let r of results ){
            var id = r.getElementsByTagName("pid")[0].innerHTML
            var title = r.getElementsByTagName("title")[0].innerHTML
            var authors = []
            Array.from( r.getElementsByTagName("creator") ).forEach( c => {
                var name = c.textContent
                authors.push( { name: name } )
            })
            objs.push( { doi: id, title: title, authors: authors } )
        }
    }
    else{
        console.log("Error: provide valid search parameters")
    }
    return objs
}

/** 
 * @meta.belongsTo https://epiverse.github.io/modules/fairlibjs.js
 * @meta.type Software
 * @meta.subtype Function
 * @meta.name loadScript
 * @meta.description Load a certain dependency library from link
*
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* fairlibjs.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pako/1.0.11/pako.min.js')
*
*/
fairlibjs.loadScript = async function  (url){
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
