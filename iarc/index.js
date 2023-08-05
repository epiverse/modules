var objIarc={}
                    
function filterData(){
    iarc.vizFillDescriptionTable(causes.value, by.value, objIarc, 'filtered')
    iarc.vizPlotSummary(causes.value, by.value, objIarc, 'summary_plot')
}

async function init(){
    var v = await Iarc()
    return v
}

var apcdt = {}

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
    cfilter.disabled=true
    cfilter.value='Updating ...'
    
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.plotAgeByYearCancerIncidence (co, reg, ge, ca, datci, 'summary_plot_lexis')
    
    updateApcStats(co, reg, ge, ca)
    performApcAnalysis()    
    aggregateWaldTestTable()
    
    cfilter.disabled=false
    cfilter.value='Update Analysis Panel'
}

function updateApcStats(co, reg, ge, ca){
    //apc['s'] = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', datci )
    apcdt['s'] = apc.formatDataCi5(co, reg, ge, ca, datci)
    apcdt['dt'] = apc.makeInputDataApcAnalysis( apcdt.s, 1, 10**5, 0.1)
    apcdt['D'] = apc.makeDesignMatrix( apcdt.dt )
    apcdt['apcM'] = apc.apcfit( apcdt.dt, apcdt.D.X)
}

function performApcAnalysis(){
    var fr = apc.getFittedRates( apcdt.s, apcdt.dt, apcdt.D, apcdt.apcM )
    
    var coefs = apc.getCoefficients( apcdt.s, apcdt.dt, apcdt.D, apcdt.apcM  )
    apc.vizDatatableStats(coefs, 'coefficients')
    
    var nd = apc.getNetDrift( apcdt.apcM ) 
    apc.vizDatatableStats(nd, 'netdrift')
    
    var action = apc_analysis.value
    
    eval( `var df = apc.${action}( apcdt.dt, apcdt.D, apcdt.apcM )` )
    apc.vizDatatableStats(df, 'apc_table')
    apc.vizPlotStats(df, 'apc_plot')
}

function aggregateWaldTestTable(){
    var features = ['getCoefficients', 'getAgeDeviations', 'getPeriodDeviations', 'getCohortDeviations', 'getPeriodRateRatio', 'getCohortRateRatio', 'getLocalDrfts']
    var paramExtra = ''
    
    var dtwt = { 'name': 'Wald Tests', 'datatable': {} }
    for (var action of features){
        if(action=='getCoefficients'){
            paramExtra = 'apcdt.s, '
        }
        else{
            paramExtra = ''
        }
        
        eval( `var df = apc.${action}( ${paramExtra} apcdt.dt, apcdt.D, apcdt.apcM )` )
        dtwt.datatable[ df.waldTest.name ] = df.waldTest.datatable
        
    }
    
    apc.vizDatatableStats(dtwt, 'waldtests')
}

function export_apc(){
    var co = continent.value
    var reg = registry.value
    var ge = gender.value
    var ca = cancer.value
    
    iarc.exportAsApcToolInput (co, reg, ge, ca, datci)
}
