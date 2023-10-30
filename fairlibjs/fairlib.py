import os
import json
import time
import requests
import rdflib
import nltk
nltk.download('averaged_perceptron_tagger')

# curl -X POST -H "Authorization: Token O5rQ08GNyFQ1-iiJHNFEMFFxHYZ1o1a5xi_k3B45" -H "Content-Type: application/json" --data @data/predprin.json https://fairdomhub.org/workflows
# curl -X POST -H "Authorization: Token O5rQ08GNyFQ1-iiJHNFEMFFxHYZ1o1a5xi_k3B45" -H "Content-Type: application/json" --data @data/predprin.json https://workflowhub.eu/workflows
# https://workflowhub.eu/api#operation/createWorkflow
# https://about.workflowhub.eu/developer/bioschemas/
# https://bioportal.bioontology.org/ontologies/EDAM/?p=classes&conceptid=http%3A%2F%2Fedamontology.org%2Foperation_2422

class FairLib:
    
    def __init__(self):
        g = rdflib.Graph()
        #g.parse ('EDAM_dev.owl', format='application/rdf+xml')
        #self.operations = self._get_edam_operations(g)
        #self.topics = self._get_edam_topics(g)
        #print("op", self.operations)
        #print("top", self.topics)
    
    def _gen_template_query(self, root):
        query = f"""
prefix edam: <http://edamontology.org/>
prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
prefix obo: <http://www.geneontology.org/formats/oboInOwl#>

select distinct ?s ?label ?syn where {{
    ?s rdfs:subClassOf edam:{root} .
    ?s rdfs:label ?label .
    ?s obo:hasNarrowSynonym ?syn . 
}}
        """
        
        return query
        
    def _get_edam_topics(self, graph):
        topic_root = "topic_0003"
        visited = set()
        tovisit = set( [ topic_root ] )
        dat = {}
        while( len(tovisit) > 0 ):
            tovisit = tovisit - visited
            extra = set()
            for l in tovisit:
                visited.add(l)
                
                query = self._gen_template_query(l)
                result = graph.query(query)
                
                for r in result:
                    next = r.s.replace("http://edamontology.org/","")
                    if( not next in dat ):
                        dat[next] = { 'name': str(r.label), 'parent': "http://edamontology.org/"+l, 'synonyms': set() }
                    dat[next]['synonyms'].add( str(r.syn) )
                    
                    extra.add(next)
            tovisit = tovisit.union(extra)
        return dat   
        
    def _get_edam_operations(self, graph):
        operation_root = "operation_0004"
        visited = set()
        tovisit = set( [ operation_root ] )
        dat = {}
        while( len(tovisit) > 0 ):
            tovisit = tovisit - visited
            extra = set()
            for l in tovisit:
                visited.add(l)
                
                query = self._gen_template_query(l)
                result = graph.query(query)
                
                for r in result:
                    next = r.s.replace("http://edamontology.org/","")
                    if( not next in dat ):
                        dat[next] = { 'name': str(r.label), 'parent': "http://edamontology.org/"+l, 'synonyms': set() }
                    dat[next]['synonyms'].add( str(r.syn) )
                    
                    extra.add(next)
            tovisit = tovisit.union(extra)
        return dat
    
    def scrap_edam_meta_workflow(self):
        page = 1
        total = 2
        info = []
        
        last_page = 0
        last_wfs = set()
        if( not os.path.isfile("scrap_bkp.tsv") ):
            fp = open("scrap_bkp.tsv", "w")
            fp.write("id\tpage\ttotal\tname\tlink\tkeywords\ttopics\toperations\tdescription\n")
            fp.close()
        else:
            j = 0
            fp = open("scrap_bkp.tsv", "r")
            for line in fp:
                l = line.replace("\n","").split("\t")
                
                if( j>0 ):
                    last_wfs.add( int(l[0]) )
                    last_page = int(l[1])
                    total = int(l[2])
                    
                    temp = { 'id': l[0], 'page': l[1], 'total': l[2], 'name': l[3], 'link': l[4], 'description': l[-1] }
                    objs = ['keywords', 'topics', 'operations']
                    i = 5
                    for o in objs:
                        temp[o] = None
                        if( l[i] != "" ):
                            temp[o]=[]
                            for it in l[i].split("*"):
                                id_ = it.split("|")[0]
                                name_ = it.split("|")[1]
                                temp[o].append( { 'id': id_, 'name': name_ } )
                            
                        i+=1
                            
                    info.append( temp )
                    
                j+=1
            fp.close()
        
        print('last page:', last_page)
        print('last workflows:', last_wfs)
        while(page <= total):
            print("\n--------------Parsing page ", page)
            
            if( page > last_page - 1 ):
                w = requests.get(f"https://workflowhub.eu/workflows?page={page}")
                t = w.text.split('\n')
                
                if(page==1):
                    psl = list( filter(lambda x: ( x.find('pagination')!=-1 and x.find('<ul')!=-1), t) )
                    total = int(psl[1].split("</li> <li")[-2].split("page=")[1].split('"')[0])
                    
                k = 'list_item_title'
                wsl = list( filter(lambda x: x.find(k)!=-1, t) )
                for w in wsl:
                    temp = w.split("/workflows/")[-1].split('>')
                    wfid = int( temp[0].replace('"','') ) 
                    
                    if( not wfid in last_wfs ):
                        otmp = {}
                        otmp['id'] = wfid
                        otmp['page'] = page
                        otmp['total'] = total
                        otmp['link'] = f"https://workflowhub.eu/workflows/{ otmp['id'] }" 
                        otmp['name'] = temp[1].split('<')[0]
                        
                        res = self._get_workflow_info( otmp['id'] )
                        stro = {}
                        for k in res:
                            otmp[ k ] = res[k]
                            stro[ k ] = ""
                            if( res[k] != None and k!='description' ):
                                stro[ k ] = '*'.join( list( map( lambda r: f"{ r['id'] }|{r['name']}", res[k] )))
                        info.append(otmp)
                        
                        with open("scrap_bkp.tsv", "a") as fp:
                            fp.write( f"{ otmp['id'] }\t{ otmp['page'] }\t{ otmp['total'] }\t{ otmp['name'] }\t{ otmp['link'] }\t{ stro['keywords'] }\t{ stro['topics'] }\t{ stro['operations'] }\t{ otmp['description'] }\n")
                    
                        #print( '\t\tinfo:', otmp['id'] )
                
                time.sleep(2)    
            page+=1
        fp.close()
            
        with open("list_workflowhub.json", "w") as g:
            json.dump(info, g) 
    
    def _get_workflow_info(self, n):
        print("\t- Parsing workflow ", n)
        
        res = { 'topics': None, 'operations': None, 'keywords': None, 'description': None }
        
        w = requests.get(f"https://workflowhub.eu/workflows/{n}")
        ft = w.text.split('\n')
        
        desc = list( filter(lambda x: x.find(' "description"')!=-1, ft) )
        if( len(desc) > 0 ):
            desc = desc[0].replace('"description": "', '').replace('",','')
            res['description'] = desc
        
        topl = list( filter(lambda x: x.find('edam-browser/#topic_')!=-1, ft) )
        if( len(topl) > 0 ):
            topics = list( map( lambda x: { 'id': int( x.split("#topic_")[1].split('"')[0] ), 'name': x.split(">")[1].split('<')[0] }, topl[0].split('</a>, ') ) )
            res['topics'] = topics
        
        opl = list( filter(lambda x: x.find('edam-browser/#operation_')!=-1, ft) )
        if( len(opl) > 0 ):
            operations = list( map( lambda x: { 'id': int( x.split("#operation_")[1].split('"')[0] ), 'name': x.split(">")[1].split('<')[0] }, opl[0].split('</a>, ') ) )
            res['operations'] = operations
        
        tl = list( filter(lambda x: x.find('/tags/')!=-1, ft) )
        if( len(opl) > 0 ):
            temp = tl[0].split('</a>')
            temp = list( filter( lambda x: x.find('/tags/')!=-1, temp ) )
            tags = list( map( lambda x: { 'id': x.split("/tags/")[1].split('"')[0], 'name': x.split(">")[1].split('<')[0] }, temp ) )
            res['keywords'] = tags
        
        return res
    
    def filter_summary(self, summary):
        tokens = nltk.word_tokenize(summary)
        pos_tags = nltk.pos_tag(tokens)
        filtered = list(filter( lambda x: x[1].startswith('N'), pos_tags))
    
    def upload_workflow_hub(self, folder, token):
        for f in os.listdir(folder):
            with open( f'{folder}/{f}', 'r') as g:
                payload = json.load(g)
            headers = { 'authorization': f'Token {token}' }
            response = requests.post('https://workflowhub.eu/workflows', data=payload, headers=headers)
            print(response.json())
        
a = FairLib()
a.scrap_edam_meta_workflow()

#a.upload_workflow_hub("data", "O5rQ08GNyFQ1-iiJHNFEMFFxHYZ1o1a5xi_k3B45")
