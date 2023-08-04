var objIarc={}
                    
function filterData(){
    iarc.vizFillDescriptionTable(causes.value, by.value, objIarc, 'filtered')
    iarc.vizPlotSummary(causes.value, by.value, objIarc, 'summary_plot')
}

async function init(){
    var v = await Iarc()
    return v
}

var apc = {}

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
            
            updateAnalysisPanel()
        }, 10000);
        
    })
} )

function updateAnalysisPanel(){
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.plotAgeByYearCancerIncidence (co, reg, ge, ca, datci, 'summary_plot_lexis')
    
    updateApcStats(co, reg, ge, ca)
    performApcAnalysis()
    aggregateWaldTestTable()
}

function updateApcStats(co, reg, ge, ca){
    //apc['s'] = iarc.formatData( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', datci )
    apc['s'] = iarc.formatData(co, reg, ge, ca, datci)
    apc['dt'] = iarc.makeInputDataApcAnalysis( apc.s, 1, 10**5, 0.1)
    apc['D'] = iarc.makeDesignMatrix( apc.dt )
    apc['apcM'] = iarc.apcfit( apc.dt, apc.D.X)
}

function performApcAnalysis(){
    var fr = iarc.getFittedRates( apc.s, apc.dt, apc.D, apc.apcM )
    
    var coefs = iarc.getCoefficients( apc.s, apc.dt, apc.D, apc.apcM  )
    iarc.vizDatatableStats(coefs, 'coefficients')
    
    var nd = iarc.getNetDrift( apc.apcM ) 
    iarc.vizDatatableStats(nd, 'netdrift')
    
    var action = apc_analysis.value
    
    eval( `var df = iarc.${action}( apc.dt, apc.D, apc.apcM )` )
    iarc.vizDatatableStats(df, 'apc_table')
    iarc.vizPlotStats(df, 'apc_plot')
}

function aggregateWaldTestTable(){
    var features = ['getCoefficients', 'getAgeDeviations', 'getPeriodDeviations', 'getCohortDeviations', 'getPeriodRateRatio', 'getCohortRateRatio', 'getLocalDrfts']
    var paramExtra = ''
    
    var dtwt = { 'name': 'Wald Tests', 'datatable': {} }
    for (var action of features){
        if(action=='getCoefficients'){
            paramExtra = 'apc.s, '
        }
        else{
            paramExtra = ''
        }
        
        eval( `var df = iarc.${action}( ${paramExtra} apc.dt, apc.D, apc.apcM )` )
        dtwt.datatable[ df.waldTest.name ] = df.waldTest.datatable
        
    }
    
    iarc.vizDatatableStats(dtwt, 'waldtests')
}

function export_apc(){
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.exportAsApcToolInput (co, reg, ge, ca, datci)
}
