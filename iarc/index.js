var objIarc={}
                    
function filterData(){
    iarc.vizFillDescriptionTable(causes.value, by.value, objIarc, 'filtered')
    iarc.vizPlotSummary(causes.value, by.value, objIarc, 'summary_plot')
}

async function init(){
    var v = await Iarc()
    return v
}

var datci = {}

init().then( (value) => { 
    objIarc = value
    console.log(value)
    iarc.vizFillSelectCause(objIarc, 'causes')
    
    setTimeout( function () { 
        iarc.vizFillSelectBy(objIarc, 'by');
        filterData();
        bfilter.disabled=false
        
    }, 10000)
    
    iarc.loadCi5Data().then( (dat) => {
        datci = dat
        console.log(datci)
        
        setTimeout( function () { 
            cfilter.disabled=false
            cexport.disabled=false
    
            iarc.fillContinentOptions(datci, 'continent')
            iarc.fillRegistryOptions( continent.value, datci, 'registry')
            iarc.fillGenderOptions(datci, 'gender')
            iarc.fillCancerOptions(datci, 'cancer')
            
            plot_lexis()
        }, 10000);
        
    })
} )

function plot_lexis(){
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.plotAgeByYearCancerIncidence (co, reg, ge, ca, datci, 'summary_plot_lexis')
}

function export_apc(){
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.exportAsApcToolInput (co, reg, ge, ca, datci)
}
