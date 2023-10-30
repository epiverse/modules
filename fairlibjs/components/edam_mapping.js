class EdamMapping extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
       <section id="introduction_mapping" class="mt-3">
            <p>
               This is the FAIRLibJs library that aims at helping turning other JS-based libraries accessible, findable and interoperable through open science metadata standards. It also contains a eature to extract keywords from overall summary to match with EDAM ontology topics or operations, saving time on feeding registries such as <a href="https://workflowhub.eu/" target="_blank" >workflowhub</a>
            </p>
        </section>
        
        <section id="usage_mapping">
            
            <div class="row">
                <div class="col-12">
                    <div style="display: inline-block; margin-bottom: 10px;" >
                        <label class="fields mr-2" style="text-align: right;" >Enter your chatgpt key here:</label>
                        <input type="text" id="keygpt" class="form-control fields mr-3" placeholder="GPT api key" />
                        <input class="btn btn-info btn-sm mt-2" type="button"  onclick="set_keygpt()" value="Set GPT api key" />
                        <p id="warning" style="color: #E34928;" ></p>
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="form-group col-12" >
                        <label class="fields mr-2" style="text-align: right;"  > Summary text of the software you want to annotate:</label>
                        <textarea rows="8" id="context" class="form-control"> </textarea>
                        
                        <input class="btn btn-primary mt-2" type="button" id="go_gpt" disabled="true" onclick="find_keywords_gpt()" value="Check keywords [GPT]" />
                        <input class="btn btn-success ml-2 mt-2" type="button" id="go_rake" disabled="true" onclick="find_keywords_rake()" value="Check keywords [NLP-RAKE]" />
                    </div>
                    
                </div>
                
                <h3> Finding Keywords </h3>
                <div class="col-12">
                    <div class="card mb-3 mt-3 " id="container_answer_gpt" style="display: none;" >
                        <div class="card-body">
                            <h5 class="card-title">Keywords by ChatGPT</h5>
                            <span  class="ans text-muted">Enter summary</span>
                        </div>
                    </div>
                    
                    <div class="card mb-3 mt-3 " id="container_answer_rake" style="display: none;" >
                        <div class="card-body">
                            <h5 class="card-title">Keywords by NLP-RAKE</h5>
                            <span  class="ans text-muted">Enter summary</span>
                        </div>
                    </div>
                </div>
                
                <h3> EDAM Mapping </h3>
                <div class="col-12">
                    <div style="display: inline-block; margin-bottom: 10px;" >
                        <label class="fields  mr-2" style="text-align: right;" > Keyword Method:</label>
                        <select id="kmethod" class="form-control fields mr-3"  >
                            <option value="rake" selected >Rake</option>
                            <option value="gpt" >ChatGpt</option>
                        </select>
                        
                        <label class=" fields mr-2" style="text-align: right;" > Similarity Metric:</label>
                        <select id="mchosen" class="form-control fields mr-3"  >
                            <option value="JaroWrinkler" selected >JaroWrinkler</option>
                            <option value="Levenshtein" >Levenshtein</option>
                            <option value="Cosine" >Cosine</option>
                            <option value="Trigram" >Trigram</option>
                        </select>
                        
                        <input class="btn btn-success ml-2 mt-2" type="button" id="go_map" onclick="make_edam_mappings()" value="Map EDAM with keywords">
                        
                        <p id="notice_load" > </p>
                    </div>
                
                    <div class="card mb-3 mt-3 " id="container_tps" style="display: none;" >
                        <div class="card-body">
                            <h5 class="card-title">Topics</h5>
                            <span  class="maps text-muted"> </span>
                        </div>
                    </div>
                    
                    <div class="card mb-3 mt-3 " id="container_ops" style="display: none;" >
                        <div class="card-body">
                            <h5 class="card-title">Operations</h5>
                            <span  class="maps text-muted"> </span>
                        </div>
                    </div>
                </div>
                
            </div>
            
        </section>
        
        <style >
          .tag_edam{
            font-weight: 400;
            color: #050514;
          }
        </style>
    `;
  }
}
customElements.define('edam-mapping-component', EdamMapping);

var obj_edam = null
 
var set_keygpt = () => {
    var key = (localStorage.GPT_API_key==null || localStorage.GPT_API_key=="none") ? keygpt.value : localStorage.GPT_API_key
    
    if(key==''){
        key='none'
        warning.innerHTML="As you did not provide, the gpt functions are disabled"
        warning.style.color = "#E34928"
        container_answer_gpt.style.display='none'
    }
    else{
        warning.innerHTML="Key provided!"
        warning.style.color = "#2842E3"
        container_answer_gpt.style.display=''
        go_gpt.disabled = false
    }
    fairlibjs.set_gpt_key(key)
    
    return key
}

var find_keywords_rake = () => {
    go_rake.disabled = true
    container_answer_rake.style.display='none'
    
    go_rake.value="Checking ..."
    
    var keys = []
    
    var summary = context.value
    var ans_html = ""
    if( summary ){
        var res = fairlibjs.get_rake_keywords( obj_edam, summary, 2)
        if(res){
            res = res.answer
            
            var ans_html = "No keyword found"
            if( res.length != 0 ){
                ans_html="Most probable keywords:\n"
                
                var htmls = "<p>"
                res.forEach( e => { htmls+=`<span class="badge bg-success mr mb-2"> ${e} </span>` } )
                htmls+="</p>"
                ans_html+=htmls
                
                obj_edam.keywords_rake = res
            }
        }
    }
    else{
        alert('Insert the summary!')
    }
    
    go_rake.value="Check keywords [NLP-RAKE]"
    go_rake.disabled = false
    
    container_answer_rake.style.display=''
    document.querySelector('#container_answer_rake .ans').innerHTML = ans_html
    
    return true
}

var find_keywords_gpt = async () => {
    go_gpt.disabled = true
    container_answer_gpt.style.display='none'
    
    let key = localStorage.GPT_API_key
    if(key!='' && key!=null && key!="none"){
        go_gpt.value="Checking ..."
        
        var keys = []
        
        var summary = context.value
        var ans_html = ""
        if( summary ){
            var res = await fairlibjs.get_gpt_keywords(summary)
            if(res){
                res = res.answer
                
                var ans_html = "No keyword found"
                if( res.length != 0 ){
                    ans_html="Most probable keywords:\n"
                    
                    var htmls = "<p>"
                    res.forEach( e => { htmls+=`<span class="badge bg-primary mr mb-2"> ${e} </span>` } )
                    htmls+="</p>"
                    ans_html+=htmls
                    
                    obj_edam.keywords_gpt = res
                }
            }
        }
        else{
            alert('Insert the summary!')
        }
        
        go_gpt.value="Check keywords [GPT]"
        go_gpt.disabled = false
        
        container_answer_gpt.style.display=''
        document.querySelector('#container_answer_gpt .ans').innerHTML = ans_html
    }
    
    return true
}


function make_edam_mappings(){
    let key_method = kmethod.value
    if(key_method=='gpt' && localStorage.GPT_API_key=='none'){
        alert('Set gpt key first and run keyword extraction for this method')
    }
    else{
        let metric_chosen = mchosen.value
        
        obj_edam['keywords'] = obj_edam['keywords_'+key_method].slice(0,15)
        if( obj_edam['keywords'] ){
            container_tps.style.display='none'
            container_ops.style.display='none'
            notice_load.innerHTML="Mapping.. wait"
            go_map.value='Mapping...'
            go_map.disabled=true
            
            let sims = fairlibjs.mapEdamWithKeywords( obj_edam )
            console.log(sims)
            
            let res_tops = []
            if( sims.topic.length > 0 ){
                res_tops = obj_edam.keywords.filter( s => sims.topic.filter( f => f.key == s).length > 0 ).map( s => {
                    let sp = sims.topic.filter( f => f.key == s)
                    sp.sort( (a, b) => eval(`b.sim${metric_chosen}`) - eval(`a.sim${metric_chosen}`) )
                    return [sp[0].edamId, sp[0].edamLabel]
                } )
            }
            let gone = []
            var htmls = "<p>"
            res_tops.forEach( e => { 
                if( ! gone.includes( e[1] ) ){
                    var st = String(e[0])
                    while( st.length < 4 ){
                        st = "0"+st
                    }
                    htmls+=`<span class="badge mr mb-2" style="background-color: #ebbdd7;"> <a href="https://edamontology.github.io/edam-browser/#topic_${st}" target="_blank" class="tag_edam" > ${ e[1] } </a> </span>` 
                    gone.push( e[1] )
                }
            } )
            htmls+="</p>"
            container_tps.style.display=''
            document.querySelector('#container_tps .maps').innerHTML = htmls
            
            let res_ops = []
            
            if( sims.operation.length > 0 ){
                res_ops = obj_edam.keywords.filter( s => sims.operation.filter( f => f.key == s).length > 0 ).map( s => {
                    let sp = sims.operation.filter( f => f.key == s)
                    sp.sort( (a, b) => eval(`b.sim${metric_chosen}`) - eval(`a.sim${metric_chosen}`) )
                    return [sp[0].edamId, sp[0].edamLabel]
                } )
            }
            gone = []
            htmls = "<p>"
            res_ops.forEach( e => { 
                if( ! gone.includes( e[1] ) ){
                    var st = String(e[0])
                    while( st.length < 4 ){
                        st = "0"+st
                    }
                    htmls+=`<span class="badge mr mb-2" style="background-color: #ddc6fb;"> <a href="https://edamontology.github.io/edam-browser/#operation_${st}" target="_blank" class="tag_edam" > ${ e[1] } </a> </span>` 
                    gone.push( e[1] )
                }
            } )
            htmls+="</p>"
            container_ops.style.display=''
            document.querySelector('#container_ops .maps').innerHTML = htmls
            
            notice_load.innerHTML=""
            go_map.value='Map EDAM with keywords'
            go_map.disabled=false
        }
        else{
            alert("There are no keywords to map")
        }
    }
}
 
let init_case_edamap = () => {
                        
    let key = set_keygpt()
    context.value="PredPrIn is a scientific workflow to predict Protein-Protein Interactions (PPIs) using machine learning to combine multiple PPI detection methods of proteins according to three categories: structural, based on primary aminoacid sequence and functional annotations."
    
    FairLibWrapper().then( (o) => { 
        obj_edam = o 
        go_rake.disabled = false
        
        find_keywords_rake()
        find_keywords_gpt().then( (val) => { console.log(val) } )
        if( obj_edam.keywords_gpt || obj_edam.keywords_rake ){
            make_edam_mappings()
        }
    })
}
init_case_edamap()
