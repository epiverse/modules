
console.log('IarcGpt loaded')

const sleep = ms => new Promise(r => setTimeout(r, ms));

let iarc = {}


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

/* ------------- NLP functions ------------- */

iarc.initNLP = async (text) => {
    text=text.replaceAll('. ','').replaceAll('…','')
    
    var winkNLP = (await import('https://cdn.skypack.dev/wink-nlp')).default;
    var model = (await import('https://cdn.skypack.dev/wink-eng-lite-web-model')).default;
    var nlp = winkNLP( model );
    var its = nlp.its;
    
    if(text==null || text==''){
        var text = `Sen. Edward Kennedy (D., Mass.) said, "It's a bottom-line issue".
The Nasdaq 100 rose 7.08 to 445.23.\n\n (Are parenthesis part of a sentence?)
"This is a quoted... sentence." "(This is a quoted sentence within parenthesis.)"
('Like the previous one!') AI Inc. is focussing on AI. \n I work for AI Inc. 
My mail is r2d2@yahoo.com! U.S.A is my birth place.`
    }
    
    var doc = nlp.readDoc( text );
    // Place every sentence in a new row of the table by using .markup() api.
    var sentences = doc.sentences().out()
    sentences = [...new Set(sentences)];
    var i =0
    var ant=0
    var init=0
    sentences.forEach(e => { 
        if(e.toLowerCase().indexOf('general remarks')!=-1 && ant<2) { 
            init=i; 
            ant+=1; 
        } 
        i+=1 
    })
    var cutted = sentences.slice(init, sentences.length)
    cutted = cutted.map( e => { 
        return e.replaceAll('\n',' ')
    })
    cutted = cutted.filter( e => e.match(/[a-zA-Z]+/g)!=null )
    
    return cutted
}

iarc.embed_sentences = async (sentences) => {
    var model = await use.load()//.then(model => {
      // Embed an array of sentences.
      if(sentences==null || sentences==''){
          const sentences = [
            'Hello.',
            'How are you?'
          ];
      }
      var embeddings = await model.embed(sentences) //.then(embeddings => {
        // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
        // So in this example `embeddings` has the shape [2, 512].
        embeddings.print(true /* verbose */);
      var dt = await embeddings.data()
      var batch=512
      var lines=dt.length/batch
        var c=0
        var mat=[]
        var row=[]
        var i=0
        var j=0
        while (i < lines){
            while(j < batch){
                console.log(i, j)
                row.push( dt[c] )
                
                c+=1
                j+=1
            }
            if(row.length % batch==0){
                mat.push(row)
                row=[]
                j=0
            }
            i+=1
        }
        return mat
        //return embeddings
      //});
    //});
}

iarc.batch_embedding = async (all_sentences, batch) => {
    var i = 0
    var chunks = []
    var x=1
    while( i<all_sentences.length){
        var obj = { 'list': all_sentences.slice(i, i+batch), 'id': 'chunk-'+x }
        chunks.push( obj )
        i+=batch
        x+=1
    }
    var emb = await Promise.all( chunks.map( async c => {
        var single = []
        try{
            single = await iarc.embed_sentences(c['list'])
            console.log('ok', c['id'])
        }
        catch(e){
            console.log('error on ', c['id'])
        }
        
        return single
    }) )
    
    var result=[]
    for(var k of emb){
        result = result.concat(k)
    }
    
    return result
}

iarc.similarity = (a, b) => {  
  var dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
  var magnitudeA = Math.sqrt( dot(a, a) )
  var magnitudeB = Math.sqrt( dot(b, b) )  
  if (magnitudeA && magnitudeB){
    return dot(a, b) / (magnitudeA * magnitudeB)
  }
  
  else return false  
}

iarc.cosine_similarity_matrix = (matrix) => {  
  let cosine_similarity_matrix = [];  
  for(let i=0;i<matrix.length;i++){  
    let row = [];  
    for(let j=0;j<i;j++){  
      row.push(cosine_similarity_matrix[j][i]);  
    }  
    row.push(1);  
    for(let j=(i+1);j<matrix.length;j++){  
      row.push(iarc.similarity(matrix[i],matrix[j]));  
    }  
    cosine_similarity_matrix.push(row);  
  }  
  return cosine_similarity_matrix;  
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
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.worker.min.js';
    
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
    var dat = await( await fetch(location.href.split('#')[0]+'links_scraped_complete.tsv') ).text()
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
* loadScript('https://cdnjs.cloudflare.com/ajax/libs/pako/1.0.11/pako.min.js')
*
*/
async function loadScript (url){
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

if(typeof(pdfjsLib)=="undefined"){
	loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.min.js')
}

if(typeof(d3)=="undefined"){
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.4/d3.min.js')
}

if(typeof(tf)=="undefined"){
    loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs')
}

if(typeof(use)=="undefined"){
    loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder')
}

//export { iarc }

