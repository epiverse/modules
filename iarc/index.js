var objIarc={}
                    
function filterData(){
    iarc.vizFillDescriptionTable(causes.value, by.value, objIarc, 'filtered')
    iarc.vizPlotSummary(causes.value, by.value, objIarc, 'summary_plot')
}

async function init(){
    var v = await Iarc()
    return v
}
init().then( (value) => { 
    objIarc = value
    console.log(value)
    iarc.vizFillSelectCause(objIarc, 'causes')
    
    setTimeout( function () { 
        iarc.vizFillSelectBy(objIarc, 'by');
        filterData();
        bfilter.disabled=false
        
    }, 10000)
} )
