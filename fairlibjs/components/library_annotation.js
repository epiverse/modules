class LibraryAnnotation extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
       <section id="introduction_libjsonld" class="mt-3">
            <p>
               The core functionality of the FAIRLibJs library annotates software libraries from documentation strings markups added in the source code, generating a semantic graph formatted in json-LD.</a>
            </p>    
        </section>
        
        <section id="usage_libjsonld">
            
            <div class="row">
                <div class="col-12">
                    <div style="display: inline-block; margin-bottom: 10px;" >
                        <label class=" mr-2" style="text-align: right;" > URL of the source code:</label>
                        <input type="text" id="urlib" class="form-control mr-3" placeholder="url of the library source code" />
                        
                        <input class="btn btn-info btn-sm mt-2" type="button"  onclick="get_libjsonld()" value="Generate JSON-LD" />
                        
                    </div>
                </div>
                
                <div class="col-12" id="result_libld" style="display: none" >
                    <div class="form-group col-12" >
                        <label class="fields mr-2" style="text-align: right;"  > Publications JSON-LD:</label>
                        <textarea rows="15" id="jsonContentLib" class="form-control"> </textarea>
                        
                        <label class="fields mt-3 mr-2" style="text-align: right;"  > Graph visualization:</label>
                        <div id="libGraphld"  >  </div>
                    </div>
                </div>
                
            </div>
            
        </section>
    `;
  }
}
customElements.define('library-annotation-component', LibraryAnnotation);

var obj_libann = null
 
var get_libjsonld = function(){
    result_libld.style.display = 'none'
    
    var textSeed = urlib.value
    
    if( textSeed != '' ){
        let roc = RocrateArtifact(textSeed)
        fairlibjs.genRoCrateLibAnnotation( roc ).then( (ann) => {
            if( roc.graph.length==0 ){
                alert("No descriptions found to create the graph")
            }
            else{
                result_libld.style.display = ''
                let jsonld = roc.graph
                jsonContentLib.value = JSON.stringify(jsonld, undefined, 4) 
                d3.jsonldVis(jsonld, "#libGraphld")
            }
        })
    }
    else{
        alert("Type a url to the source code")
    }
}
 
 let init_case_libann = () => {
    FairLibWrapper().then( (o) => { 
        obj_libann = o 
        
        urlib.value = location.href.split('#')[0]+'fairlibjs.js'
        get_libjsonld( )
    })
}
init_case_libann()
