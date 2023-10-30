class PublicationAnnotation extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
       <section id="introduction_pubjsonld" class="mt-3">
            <p>
               The other functionality of the FAIRLibJs library aims at generating publications mined from <a href="https://explore.openaire.eu/" target="_blank" > OpenAire catalog </a> and enrich them using ontologies forming a JSON-LD. You may search your publications by name or <a href="https://orcid.org/" target="_blank"> orcid </a> and then expose the machine readable result in your website.</a>
            </p>
        </section>
        
        <section id="usage_pubjsonld">
            
            <div class="row">
                <div class="col-12">
                    <div style="display: inline-block; margin-bottom: 10px;" >
                        <label class=" mr-2" style="text-align: right;" >Search publications using name or orcid:</label>
                        <select class="form-control mr-3" id="param" >
                            <option value="author" selected > Author Name </option>
                            <option value="orcid" > ORCID </option>
                        </select>
                        <input type="text" id="seed" class="form-control mr-3" placeholder="name or orcid" />
                        
                        <input class="btn btn-info btn-sm mt-2" type="button"  onclick="get_pubjsonld()" value="Generate Publications JSON-LD" />
                        
                    </div>
                </div>
                
                <div class="col-12" id="result_publd" style="display: none" >
                    <div class="form-group col-12" >
                        <label class="fields mr-2" style="text-align: right;"  > Publications JSON-LD:</label>
                        <textarea rows="15" id="jsonContent" class="form-control"> </textarea>
                        
                        <label class="fields mt-3 mr-2" style="text-align: right;"  > Graph visualization:</label>
                        <div id="graphld"  >  </div>
                    </div>
                </div>
                
            </div>
            
        </section>
    `;
  }
}
customElements.define('publication-annotation-component', PublicationAnnotation);

var obj_pubann = null
 
var get_pubjsonld = function(){
    result_publd.style.display = 'none'
    
    var parameter = param.value
    var textSeed = seed.value
    var params = {}
    params[ parameter ] = textSeed
    
    if( textSeed != '' ){
        fairlibjs.searchPublication( params ).then( (result) => {
            if( result.direct_object.length==0 ){
                alert("No results found")
            }
            else{
                result_publd.style.display = ''
                let jsonld = result.jsonld
                jsonContent.value = JSON.stringify(jsonld, undefined, 4) 
                d3.jsonldVis(jsonld, "#graphld")
            }
        })
    }
    else{
        alert("Type a valid author name or orcid id")
    }
}
 
 let init_case_pubann = () => {
    FairLibWrapper().then( (o) => { 
        obj_pubann = o 
        
        seed.value = "Yasmmin Martins"
        get_pubjsonld()
    })
}
init_case_pubann()
