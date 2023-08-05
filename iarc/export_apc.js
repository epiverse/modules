console.log("apc statistics loaded")

/* apc statistics */

/*

s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', datci )
dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
D = apc.makeDesignMatrix(dt)
apcM = apc.apcfit(dt, D.X)

fr = apc.getFittedRates( s, dt, D, apcM )
coefs = apc.getCoefficients( s, dt, D, apcM )
apc.vizDatatableStats(coefs, 'coefficients')
nd = apc.getNetDrift( apcM ) 
apc.vizDatatableStats(nd, 'netdrift')
adev = apc.getAgeDeviations( dt, D, apcM )
pdev = apc.getPeriodDeviations( dt, D, apcM )
df = apc.getCohortDeviations( dt, D, apcM )
df = apc.getLongitudinalAgeCurve( dt, D, apcM )
df = apc.getLongitudinalAgeRateRatio( dt, D, apcM )
df = apc.getCrossSectionalAgeCurve( dt, D, apcM )
df = apc.getLongitudinal2CrossSectionalAgeCurve( dt, D, apcM )
df = apc.getFittedTemporalTrends( dt, D, apcM )
df = apc.getPeriodRateRatio( dt, D, apcM )
df = apc.getCohortRateRatio( dt, D, apcM )
df = apc.getFittedCohortPatternRate( dt, D, apcM )
df = apc.getLocalDrifts( dt, D, apcM )

apc.vizDatatableStats(df, 'apc_table')
apc.vizPlotStats(df, 'apc_plot')
      
*/

/**
 * Main global portable module.
 *
 * @namespace apc
 * @property {Function} getLocalDrifts - {@link apc.getLocalDrifts}
 * @property {Function} getFittedCohortPatternRate - {@link apc.getFittedCohortPatternRate}
 * @property {Function} getCohortRateRatio - {@link apc.getCohortRateRatio}
 * @property {Function} getPeriodRateRatio - {@link apc.getPeriodRateRatio}
 * @property {Function} getFittedTemporalTrends - {@link apc.getFittedTemporalTrends}
 * @property {Function} getLongitudinal2CrossSectionalAgeCurve - {@link apc.getLongitudinal2CrossSectionalAgeCurve}
 * @property {Function} getCrossSectionalAgeCurve - {@link apc.getCrossSectionalAgeCurve}
 * @property {Function} getLongitudinalAgeRateRatio - {@link apc.getLongitudinalAgeRateRatio}
 * @property {Function} getLongitudinalAgeCurve - {@link apc.getLongitudinalAgeCurve}
 * @property {Function} getCohortDeviations - {@link apc.getCohortDeviations}
 * @property {Function} getPeriodDeviations - {@link apc.getPeriodDeviations}
 * @property {Function} getAgeDeviations - {@link apc.getAgeDeviations}
 * @property {Function} getNetDrift - {@link apc.getNetDrift}
 * @property {Function} getCoefficients - {@link apc.getCoefficients}
 * @property {Function} getFittedRates - {@link apc.getFittedRates}
 * @property {Function} apcfit - {@link apc.apcfit}
 * @property {Function} makeDesignMatrix - {@link apc.makeDesignMatrix}
 * @property {Function} makeInputDataApcAnalysis - {@link apc.makeInputDataApcAnalysis}
 * @property {Function} formatDataCi5 - {@link apc.formatDataCi5}
 * @property {Function} vizPlotStats - {@link apc.vizPlotStats}
 * @property {Function} vizDatatableStats - {@link apc.vizDatatableStats}
 * @property {Function} loadScript - {@link apc.loadScript}

 */

let apc = {}

/** 
* Function to get the Local Drifts
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Local Drifts. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getLocalDrifts( dt, D, apcM )
*/
apc.getLocalDrifts = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    var a0LOC = a.indexOf(a0)
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    var c0LOC = c.indexOf(c0)
    
    // ------- Begin - rebuild xcd
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    // -------- end - rebuild xcd
    
    var last = Array.from( D.XCD.slice(-1)[0] )
    last = last.concat( [1] )
    var XCB = Array.from(D.XCD)
    XCB = D.XCD.map( (e, i) => XCB[i].concat( [0] ) )
    XCB.push( last.map( (e, j) => (j==last.length-1) ? 1 : 0 ) )
    
    var x = p.map( e => e - mean(p) )
    var DELTA = math.floor(P/2)
    var MESH = p[1]-p[0]
    var odd = P%2
    var BANG = (MESH*MESH)*0.5*((4/3)*(DELTA-1)*DELTA*(DELTA+1) + DELTA)
    if(odd==1){
        BANG = (MESH*MESH)*2*(1/6)*DELTA*(DELTA+1)*(2*DELTA+1)
    }
    var x_ = x.map( e => (1/BANG) * e )
    
    var K = []
    for( var i=0; i<A; i++){
        var start = (1+A-i)-2
        var end = start+(P-1)
        
        var aux = []
        var ki=0
        for( var j=0; j<C; j++){
            aux.push(0)
            if( j>=start && j<=end ){
                aux[ aux.length-1 ] = x_[ki]
                ki+=1
            }
        }
        K.push(aux)
    }
    
    var CM = K.map( e => Array.from(e).concat( [1] ) )
    
    var indexes = D.Pt[5].map( e => e-1 ).concat( [2] )
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var g = math.multiply( XCB, math.transpose( [ p2 ] ) )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( XCB, p2 )
    var v = math.multiply( p1, math.transpose( XCB) )
    var b = math.multiply( CM, g )
    p1 = math.multiply( CM, v )
    var vld = math.multiply( p1, math.transpose(CM) )
    var s = math.diag(vld).map( e => math.sqrt(e) )
    b = b.map( e => e[0] )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], 100*( math.exp( b[i] ) - 1), 100*(math.exp( b[i] - (1.96 * s[i]) ) - 1), 100*(math.exp( b[i] + (1.96 * s[i]) ) - 1), a[i], 100*( math.exp( b[i] ) - 1), 100*(math.exp( b[i] - (1.96 * s[i]) ) - 1), 100*(math.exp( b[i] + (1.96 * s[i]) ) - 1) ] ) })
    
    var colNames = ["Age", "Percent per Year", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Local Drifts = Net Drift' }
    var wt = {}
    
    var CM0 = Array.from(CM)
    var index = CM0.length-1
    CM.forEach( (e, i) => { CM0[i][index] = 0 })
    var EDiff = math.multiply( CM0, g )
    p1 = math.multiply( CM0, v )
    var VDiff = math.multiply( p1, math.transpose(CM0) )
    wt["df"] = getMatRank( VDiff )
    
    p1 = math.transpose( EDiff.slice(0, wt["df"] ) )
    var p2 = solveSystem( VDiff.slice(0, wt["df"] ).map( e => e.slice(0, wt["df"]) ), EDiff.slice(0, wt["df"] ) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var nd = apc.getNetDrift( apcM ) 
    var abls = nd.datatable
    var res = {  'title_x': "Age", "title_y": "Percent per Year", "abline_y": [  { 'type': 'dot', 'width': 1, 'y': abls['CI Lo'] } , { 'width': 1, 'y': abls['Net Drift (%/year)'] }, { 'type': 'dot', 'width': 1, 'y': abls['CI Hi'] }  ] }
    res['name'] = 'Local Drifts with Net Drift'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the Fitted Cohort Pattern Rate
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Fitted Cohort Pattern Rate. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getFittedCohortPatternRate( dt, D, apcM )
*/
apc.getFittedCohortPatternRate = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    var a0LOC = a.indexOf(a0)
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    var c0LOC = c.indexOf(c0)
    
    // ------- Begin - rebuild xcd
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    // -------- end - rebuild xcd
    
    var indexes = [ 0, 2 ].concat( D.Pt[5].map( e => e-1) ).concat( D.Pt[3].map( e => e-1) )
    
    D.XCT = [  ]
    var p1 = getUnitVector(C)
    var p2 = c.map( e => e - c0 )
    var p3 = D.XCD 
    var p4 = math.multiply( math.transpose([ p1 ]), [ D.XAD[a0LOC] ] ) 
    p1.forEach( (e, i) => { D.XCT.push( [ p1[i], p2[i] ].concat( p3[i] ).concat( p4[i] ) ) })
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var lot = math.log( dt.offset_tick )
    var b = math.multiply( D.XCT, p2 )
    b = b.map( e => lot + e )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( D.XCT, p2 )
    var vcr = math.multiply( p1, math.transpose( D.XCT ) )
    var s = math.diag(vcr).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ c[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), c[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Cohort", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Cohort RR = 1' }
    var wt = {}
    p1 = [ b.filter( (e, i) => i != c0LOC ) ]
    var p2 = solveSystem( vcr.filter( (e, i) => i != c0LOC ).map( e => e.filter( (e, i) => i != c0LOC ) ), math.transpose( [ b.filter( (e, i) => i != c0LOC ) ] ) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = C-1
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = {  'title_x': "Period", "title_y": "Rate", "abline_y": [] }
    res['name'] = 'Fitted Cohort Pattern centered on the reference age'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the Cohort Rate Ratio
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Cohort Rate Ratio. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getCohortRateRatio( dt, D, apcM )
*/
apc.getCohortRateRatio = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    var a0LOC = a.indexOf(a0)
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    var c0LOC = c.indexOf(c0)
    
    // ------- Begin - rebuild xcd
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    // -------- end - rebuild xcd
    
    var indexes = [ 0, 2 ].concat( D.Pt[5].map( e => e-1) )
    
    Xc = [  ]
    var p1 = getUnitVector(C)
    var p2 = c.map( e => e - c0 )
    var p3 = D.XCD 
    p1.forEach( (e, i) => { Xc.push( [ p1[i], p2[i] ].concat( p3[i] ) ) })
    
    var temp = getUnitDiagMatrix(C)
    var CRR = []
    for( var i=0; i<C; i++ ){
        var aux = []
        for( var j=0; j<C; j++ ){
            var val = ( j==c0LOC ) ? 1 : 0
            aux.push( temp[i][j] - val )
        }
        CRR.push(aux)
    }
    D.XCR = math.multiply( CRR, Xc )
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var b = math.multiply( D.XCR, p2 )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( D.XCR, p2 )
    var vcr = math.multiply( p1, math.transpose( D.XCR ) )
    var s = math.diag(vcr).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ c[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), c[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Cohort", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Cohort RR = 1' }
    var wt = {}
    p1 = [ b.filter( (e, i) => i != c0LOC ) ]
    var p2 = solveSystem( vcr.filter( (e, i) => i != c0LOC ).map( e => e.filter( (e, i) => i != c0LOC ) ), math.transpose( [ b.filter( (e, i) => i != c0LOC ) ] ) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = C-1
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = {  'title_x': "Period", "title_y": "Rate Ratio", "abline_y": [  { 'type': 'dash', 'y': 1 }  ] }
    res['name'] = 'Period Rate Ratio'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the Period Rate Ratio
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Period Rate Ratio. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getPeriodRateRatio( dt, D, apcM )
*/
apc.getPeriodRateRatio = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    var a0LOC = a.indexOf(a0)
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var indexes = [ 0, 2 ].concat( D.Pt[4].map( e => e-1) )
    
    Xp = [  ]
    var p1 = getUnitVector(P)
    var p2 = p.map( e => e - p0 )
    var p3 = D.XPD 
    p1.forEach( (e, i) => { Xp.push( [ p1[i], p2[i] ].concat( p3[i] ) ) })
    
    var index = p.indexOf(p0)
    var temp = getUnitDiagMatrix(P)
    var PRR = []
    for( var i=0; i<P; i++ ){
        var aux = []
        for( var j=0; j<P; j++ ){
            var val = ( j==index ) ? 1 : 0
            aux.push( temp[i][j] - val )
        }
        PRR.push(aux)
    }
    
    D.XPR = math.multiply( PRR, Xp )
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var b = math.multiply( D.XPR, p2 )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( D.XPR, p2 )
    var vpr = math.multiply( p1, math.transpose( D.XPR ) )
    var s = math.diag(vpr).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ p[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), p[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Period", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Period RR = 1' }
    var wt = {}
    p1 = [ b.filter( (e, i) => i != p0LOC ) ]
    var p2 = solveSystem( vpr.filter( (e, i) => i != p0LOC ).map( e => e.filter( (e, i) => i != p0LOC ) ), math.transpose( [ b.filter( (e, i) => i != p0LOC ) ] ) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = P-1
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = {  'title_x': "Period", "title_y": "Rate Ratio", "abline_y": [  { 'type': 'dash', 'y': 1 }  ] }
    res['name'] = 'Period Rate Ratio'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the Fitted Temporal Trends
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Fitted Temporal Trends. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getFittedTemporalTrends( dt, D, apcM )
*/
apc.getFittedTemporalTrends = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    var a0LOC = a.indexOf(a0)
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var indexes = [ 0, 2 ].concat( D.Pt[4].map( e => e-1) ).concat( D.Pt[3].map( e => e-1) )
    
    D.XPT = [  ]
    var p1 = getUnitVector(P)
    var p2 = p.map( e => e - p0 )
    var p3 = D.XPD
    var p4 = math.multiply( math.transpose( [ getUnitVector(P) ] ), [ D.XAD[a0LOC] ] ) 
    p1.forEach( (e, i) => { D.XPT.push( [ p1[i], p2[i] ].concat( p3[i] ).concat( p4[i] ) ) })
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var lot = math.log( dt.offset_tick )
    var b = math.multiply( D.XPT, p2 )
    b = b.map( e => lot + e )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( D.XPT, p2 )
    var ftv = math.multiply( p1, math.transpose( D.XPT ) )
    var s = math.diag(ftv).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ p[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), p[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Period", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var res = {  'title_x': "Period", "title_y": "Rate", "abline_y": [] }
    res['name'] = 'Fitted Temporal Trends'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the Longitudinal to Cross-Sectional Age Curve
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Longitudinal to Cross-Sectional Age Curve. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getLongitudinal2CrossSectionalAgeCurve( dt, D, apcM )
*/
apc.getLongitudinal2CrossSectionalAgeCurve = ( dt, D, apcM ) => {
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    var c0LOC = c.indexOf(c0)
    
    // ------- Begin - rebuild xcd
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    // -------- end - rebuild xcd
    
    var indexes = [ 2 ].concat( D.Pt[5].map( e => e-1) ).concat( D.Pt[4].map( e => e-1) )
    
    D.XLX = [  ]
    var p1 = a.map( e => e - a0 )
    var p2 = math.multiply( math.transpose( [ getUnitVector(A) ] ), [ D.XCD[c0LOC] ] ) 
    var p3 = math.multiply( math.transpose( [ getUnitVector(A).map( e => -1*e ) ] ), [ D.XPD[p0LOC] ] ) 
    p1.forEach( (e, i) => { D.XLX.push( [ p1[i]].concat( p2[i] ).concat( p3[i] ) ) })
    
    p2 = []
    indexes.forEach( e => p2.push( B[e][0] ) )
    var b = math.multiply( D.XLX, p2 )
    
    p2 = []
    indexes.forEach( e => { 
        var aux = []
        indexes.forEach( f => { 
            aux.push( s2VAR[e][f] )
        })
        p2.push( aux ) 
    })
    
    p1 = math.multiply( D.XLX, p2 )
    var lcv = math.multiply( p1, math.transpose( D.XLX ) )
    var s = math.diag(lcv).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Age", "Rate Ratio", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var res = {  'title_x': "Age", "title_y": "Rate Ratio", "abline_y": [] }
    res['name'] = 'Ratio of Longitudinal-to-Cross-Sectional Age Curve'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the Cross-Sectional Age Curve
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Cross-Sectional Age Curve. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getCrossSectionalAgeCurve( dt, D, apcM )
*/
apc.getCrossSectionalAgeCurve = ( dt, D, apcM ) => {
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    
    var P = dt.p.length
    var p = dt.p
    var p0 = dt.Rvals[1]
    var p0LOC = p.indexOf(p0)
    
    var indexes = [0, 1, 2].concat( D.Pt[3].map( e => e-1) ).concat( D.Pt[4].map( e => e-1) )
    
    D.XXA = [  ]
    var p1 = getUnitVector(A)
    var p2 = a.map( e => e - a0 )
    var p3 = p2.map( e => (-1*e) )
    var p4 = D.XAD
    var p5 = math.multiply( math.transpose( [ getUnitVector(A) ] ), [ D.XPD[p0LOC] ] ) 
    p1.forEach( (e, i) => { D.XXA.push( [ p1[i], p2[i], p3[i] ].concat( p4[i] ).concat( p5[i] ) ) })
    
    var lot = math.log( dt.offset_tick )
    var b = math.multiply( D.XXA, B.filter( (e, i) => indexes.includes(i) ) )
    b = b.map( e => lot + e[0] )
    p1 = math.multiply( D.XXA, s2VAR.filter( (e, i) => indexes.includes(i) ).map( (e, i) => e.filter( (e, i) => indexes.includes(i) ) ) )
    var xav = math.multiply( p1, math.transpose( D.XXA ) )
    var s = math.diag(xav).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Age", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var res = {  'title_x': "Age", "title_y": "Rate Ratio", "abline_y": [] }
    res['name'] = 'Cross-Sectional Age Curve'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the Longitudinal Age Rate Ratio
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Longitudinal Age Rate Ratio. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getLongitudinalAgeRateRatio( dt, D, apcM )
*/
apc.getLongitudinalAgeRateRatio = ( dt, D, apcM ) => {
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    
    var indexes = [0, 1].concat( D.Pt[3].map( e => e-1) )
    
    var TMP1 = [  ]
    var p1 = getUnitVector(A)
    var p2 = a.map( e => e - a0 )
    var p3 = D.XAD
    p1.forEach( (e, i) => { TMP1.push( [ p1[i], p2[i] ].concat( p3[i] ) ) })
    
    var index = a.indexOf(a0)
    var temp = getUnitDiagMatrix(A)
    var TMP2 = []
    for( var i=0; i<A; i++ ){
        var aux = []
        for( var j=0; j<A; j++ ){
            var val = ( j==index ) ? 1 : 0
            aux.push( temp[i][j] - val )
        }
        TMP2.push(aux)
    }
    D.LAR = math.multiply( TMP2, TMP1 )
    var b = math.multiply( D.LAR, B.filter( (e, i) => indexes.includes(i) ) )
    p1 = math.multiply( D.LAR, s2VAR.filter( (e, i) => indexes.includes(i) ).map( (e, i) => e.filter( (e, i) => indexes.includes(i) ) ) )
    var larrv = math.multiply( p1, math.transpose( D.LAR ) )
    var s = math.diag(larrv).map( e => math.sqrt(e) )
    
    b = math.transpose( b )[0]
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Age", "Rate Ratio", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var res = {  'title_x': "Age", "title_y": "Rate Ratio", "abline_y": [] }
    res['name'] = 'Longitudinal Age Rate Ratio'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the Longitudinal Age Curve
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the Longitudinal Age Curve. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getLongitudinalAgeCurve( dt, D, apcM )
*/
apc.getLongitudinalAgeCurve = ( dt, D, apcM ) => {
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    var c0LOC = c.indexOf(c0)
    
    var A = dt.a.length
    var a = dt.a
    var a0 = dt.Rvals[0]
    
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    // ------- Begin - rebuild xcd
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    // -------- end - rebuild xcd
    
    var indexes = [0, 1].concat( D.Pt[3].map( e => e-1) ).concat( D.Pt[5].map( e => e-1) )
    
    D.XLA = [  ]
    var p1 = getUnitVector(A)
    var p2 = a.map( e => e - a0 )
    var p3 = D.XAD
    var p4 = math.multiply( math.transpose( [ getUnitVector(A) ] ), [ D.XCD[c0LOC] ] ) 
    p1.forEach( (e, i) => { D.XLA.push( [ p1[i], p2[i] ].concat( p3[i] ).concat( p4[i] ) ) })
    
    var lot = math.log( dt.offset_tick )
    p1 = math.multiply( D.XLA, B.filter( (e, i) => indexes.includes(i) ) )
    var b = p1.map( e => lot + e[0] )
    p1 = math.multiply( D.XLA, s2VAR.filter( (e, i) => indexes.includes(i) ).map( (e, i) => e.filter( (e, i) => indexes.includes(i) ) ) )
    var lav = math.multiply( p1, math.transpose( D.XLA ) )
    var s = math.diag(lav).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ), a[i], math.exp( b[i] ), math.exp( b[i] - (1.96 * s[i]) ), math.exp( b[i] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Age", "Rate", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var res = {  'title_x': "Age", "title_y": "Rate", "abline_y": [] }
    res['name'] = 'Longitudinal Age Curve'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the cohort deviations
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the cohort deviations. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getCohortDeviations( dt, D, apcM )
*/
apc.getCohortDeviations = ( dt, D, apcM ) => {
    var C = dt.c.length
    var c = dt.c
    var c0 = dt.Rvals[2]
    
    // Construct P1 transformation from classical Holford Deviations to Weighted Deviations
    var Xc = math.transpose( [ getUnitVector(C), c.map( e => e - c0 ) ] )
    var tmp = dt.data.slice(1).map( e => e[2] )
    tmp.sort( (a, b) => a-b )
    tmp = Array.from( new Set(tmp) )
    tmp = tmp.map( e => dt.data.slice(1).map(f => f[2]).filter( f => f==e).length )
    var W = math.transpose( [tmp] )
    var WXc = math.multiply( W, [ math.transpose( getUnitVector(2) ) ] )
    var temp = []
    WXc.forEach( (e, i) => { 
        var aux = []
        e.forEach( (f, j) => {
            aux.push( WXc[i][j] * Xc[i][j] )
        })
        temp.push(aux)
    })
    WXc = temp
    
    var p1 = math.multiply( math.transpose(Xc), WXc)
    var Rwc = solveSystem( p1, math.transpose(WXc) )
    var P1 = getUnitDiagMatrix(C)
    var p2 = math.multiply(Xc, Rwc)
    temp = []
    P1.forEach( (e,i) => {
        var aux = [] 
        e.forEach( (f,j) => {
            aux.push( P1[i][j] - p2[i][j] )
        } )
        temp.push(aux)
    } )
    P1 = temp
    D.XCD = math.multiply( P1, D.XCD )
    
    var start = D.Pt[5][0]-1
    var end = D.Pt[5].slice(-1)[0]
    
    var s2VAR = apcM.s2VAR
    
    var b = math.multiply( D.XCD, apcM.B.slice(start, end) )
    var p1 = math.multiply( D.XCD, s2VAR.slice(start, end).map( e => e.slice(start, end) ) )
    var v = math.multiply( p1, math.transpose(D.XCD) )
    var s = math.diag(v).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ c[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ), c[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Cohort", "Deviation", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Cohort Deviations = 0' }
    var wt = {}
    p1 = math.transpose( b.slice(1, C-1) )
    var p2 = solveSystem( v.slice(1, C-1).map( e => e.slice(1, C-1)), b.slice(1, C-1) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = C-2
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = {  'title_x': "Cohort", "title_y": "Deviation", "abline_y": [ { 'type': 'dash', 'y': 0 } ] }
    res['name'] = 'Cohort Deviations'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the period deviations
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the period deviations. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getPeriodDeviations( dt, D, apcM )
*/
apc.getPeriodDeviations = ( dt, D, apcM ) => {
    var P = dt.p.length
    var p = dt.p

    var start = D.Pt[4][0]-1
    var end = D.Pt[4].slice(-1)[0]
    
    var s2VAR = apcM.s2VAR
    
    var b = math.multiply( D.XPD, apcM.B.slice(start, end) )
    var p1 = math.multiply( D.XPD, s2VAR.slice(start, end).map( e => e.slice(start, end) ) )
    var v = math.multiply( p1, math.transpose(D.XPD) )
    var s = math.diag(v).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ p[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ), p[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Period", "Deviation", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Period Deviations = 0' }
    var wt = {}
    p1 = math.transpose( b.slice(1, P-1) )
    var p2 = solveSystem( v.slice(1, P-1).map( e => e.slice(1, P-1)), b.slice(1, P-1) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = P-2
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = { 'title_x': "Period", "title_y": "Deviation", "abline_y": [ { 'type': 'dash', 'y': 0 } ]  }
    res['name'] = 'Period Deviations'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the age deviations
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the age deviations. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getAgeDeviations( dt, D, apcM )
*/
apc.getAgeDeviations = ( dt, D, apcM ) => {
    var A = dt.a.length
    var a = dt.a

    var start = D.Pt[3][0]-1
    var end = D.Pt[3].slice(-1)[0]
    
    var s2VAR = apcM.s2VAR
    
    var b = math.multiply( D.XAD, apcM.B.slice(start, end) )
    var p1 = math.multiply( D.XAD, s2VAR.slice(start, end).map( e => e.slice(start, end) ) )
    var v = math.multiply( p1, math.transpose(D.XAD) )
    var s = math.diag(v).map( e => math.sqrt(e) )
    
    var dte = []
    b.forEach( (e, i) => { dte.push( [ a[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ), a[i], b[i][0], ( b[i][0] - (1.96 * s[i]) ), ( b[i][0] + (1.96 * s[i]) ) ] ) })
    
    var colNames = ["Age", "Deviation", "CI Lo", "CI Hi", "x", "y", "cilb", "ciub"]
    
    var df = []
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        df.push(vals)
    } )
    
    var dtwt = { 'name': 'All Age Deviations = 0' }
    var wt = {}
    p1 = math.transpose( b.slice(1, A-1) )
    var p2 = solveSystem( v.slice(1, A-1).map( e => e.slice(1, A-1)), b.slice(1, A-1) )
    wt['X2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = A-2
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = { 'title_x': "Age", "title_y": "Deviation", "abline_y": [ { 'type': 'dash', 'y': 0 } ] }
    res['name'] = 'Age Deviations'
    res['datatable'] = df
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the net drift 
*
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the net drift results. It has the following keys: name - analysis identifier; datatable - Object containing the values of b coefficient, lower bound of confidence interval and upperbound of this confidence interval
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var nd = apc.getNetDrift( apcM )
*/
apc.getNetDrift = ( apcM ) => {
    var b = apcM.B[2][0]
    var v = apcM.s2VAR[2][2]
    var s = math.sqrt(v)
    
    var colNames = ["Net Drift (%/year)", "CI Lo", "CI Hi"]
    
    var df = []
    var dte = [  [ b, ( b - (1.96 * s) ), ( b + (1.96 * s) ) ] ]
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = 100 * (math.exp(dte[i][j]) - 1) } )
        df.push(vals)
    } )
    
    var res = {}
    res['name'] = 'Net Drift'
    res['datatable'] = df
    
    return res
}

/** 
* Function to get the coefficients
*
* @param {Object} s Object containing the formatted CI5 data
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the coefficients. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var coefs = apc.getCoefficients( s, dt, D, apcM )
*/
apc.getCoefficients = ( s, dt, D, apcM ) => {
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    
    var XCO = [ [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, -1] ]
    var b = math.multiply( XCO,  B.slice(0,3) )
    var p1 = math.multiply( XCO, s2VAR.slice(0,3).map( e => e.slice(0,3) ) )
    var v = math.multiply( p1, math.transpose(XCO) )
    var s = math.transpose( [ math.diag(v).map( e => math.sqrt(e) ) ] )
    
    var coefs = {}
    var conceptNames = ["Intercept","LAT","NetDrift", "CAT"]
    var colNames = ["Parameter","SD","CI Lo", "CI Hi"]
    var dte = []
    b.forEach( (e, i) => { dte.push( [ b[i][0], s[i][0], ( b[i][0] - (1.96 * s[i][0]) ), ( b[i][0] + (1.96 * s[i][0]) ) ] ) })
    
    dte.forEach( (e, i) => { 
        var vals = {}
        dte[i].forEach( (f, j) => { vals[ colNames[j] ] = dte[i][j] } )
        coefs[ conceptNames[i] ] = vals
    } )
    
    var dtwt = { 'name': 'NetDrift = 0' }
    var wt = {}
    wt['X2'] = ( b[2] / s[2] )**2
    wt["df"] = 1
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt
    
    var res = {}
    res['name'] = 'Coefficients'
    res['datatable'] = coefs
    res['waldTest'] = dtwt
    
    return res
}

/** 
* Function to get the fitted rates
*
* @param {Object} s Object containing the formatted CI5 data
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} D Object containing the design matrix computed variables
* @param {Object} apcM Object containing the APC model computed variables
*
* @returns {Object} Object containing the fitted rates. It has the following keys: name - analysis identifier; events - Matrix with fitted rates for events (ca; offset - Matrix with fitted rates for offset (population); offset_tick - original offset tick used; ages - original array with the ages; periods - original array of periods
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var fr = apc.getFittedRates( s, dt, D, apcM )
*/
apc.getFittedRates = ( s, dt, D, apcM ) => {
    var B = apcM.B
    var s2VAR = apcM.s2VAR
    var A = dt.a.length
    var P = dt.p.length
    var C = dt.c.length
    
    var ETA = math.multiply(D.X, B)
    var p1 = math.multiply(D.X, s2VAR)
    var temp = []
    p1.forEach( (e, i) => { temp.push( e.map( (f, j) => p1[i][j] * D.X[i][j] ) ) })
    var v = []
    temp.forEach( e => { 
        var val = sum(e) < 0 ? NaN : sum(e)
        v.push( 1/val ) 
    } )
    
    var EFit = []
    var k=0
    for(var i=0; i<P; i++){
        var aux=[]
        for(var j=0; j<A; j++){
            aux.push( v[k] )
            k+=1
        }
        EFit.push(aux)
    }
    EFit = math.transpose(EFit)
    
    var OFit = []
    var k=0
    for(var i=0; i<P; i++){
        var aux=[]
        for(var j=0; j<A; j++){
            aux.push( v[k] * math.exp(-1*ETA[k][0]) )
            k+=1
        }
        OFit.push(aux)
    }
    OFit = math.transpose(OFit)
    
    var res = {}
    res['name'] = 'Fitted Rates'
    res['events'] = EFit
    res['offset'] = OFit
    res['offset_tick'] = dt.offset_tick
    res['ages'] = s.ages
    res['periods'] = s.periods
    
    return res
}

/** 
* Function to compute the Age-Period-Cohort analysis model
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
* @param {Object} X Datatable containing the combined columns with the values for age period and cohort from the events and offset
*
* @returns {Object} Object containing the APC model computed variables. It has the following keys: B - computed slope intercept; s2 - variance factor; s2VAR - datatable with values multiplied by variance; DEV - deviations; DevResids - deviation residuals 
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
*/
apc.apcfit = (dt, X) => {
    var Y = dt.data.slice(1).map( e => e.slice(3,5) )
    var offset = Y.map( e => math.log(e[1]) )
    var y = Y.map( e => e[0] )
    var ly = y.map( e => math.log(e) )
    var n = X.length
    var p = X[0].length

    var w = y
    var aux1 = getUnitVector(p)
    var mat = math.multiply( math.transpose( [w] ), [ aux1 ] )
    var wx = []
    mat.forEach( (e, i) => {
        var aux = []
        mat[i].forEach( (f, j) => {
            aux.push( mat[i][j] * X[i][j] )
        })
        wx.push( aux )
    } )
    var z = []
    ly.forEach( (e, index) => { z.push(ly[index] - offset[index]) } )
    var p1 = math.multiply( math.transpose(X), wx)
    var p2 = math.multiply( math.transpose(wx), math.transpose([z]) )
    var B = solveSystem( p1, p2 )
    var V = solveSystem( p1 )
    var mat = math.multiply( X, B)
    var temp = Y.map( e => e[1] )
    var u = mat.map( (e, index) => e.map( f => temp[index]*math.exp(f) ) )
    
    mat = math.multiply(X, B)
    mat = math.transpose(mat)[0]
    var wr2 = []
    mat.forEach( (e, index) => { wr2.push( w[index] * ( (z[index] - mat[index])**2 ) ) })
    var DEVRESIDS = []
    wr2.forEach( (e, index) => { DEVRESIDS.push( math.sign( y[index] - u[index][0] ) * math.sqrt( wr2[index] ) ) } )
    var DEV = math.sum(wr2)
    
    var s2 = 1
    if( dt.over_dispersion == 1 ){
        s2 = math.max(1, DEV/(n-p))
    }
    
    if( ! isFinite(s2) ){
        s2 = 1
    }
    
    var s2v = []
    V.forEach( e => { s2v.push( e.map( f => f*s2 ) ) } )
    
    var apcmodel = { 'B': B, 's2': s2, 's2VAR': s2v, 'DEV': DEV, 'DevResids': DEVRESIDS }
    
    return apcmodel
}

/** 
* Function to compute the design matrix object
*
* @param {Object} dt Object containing the primary normalized variables computed for the apc statistical functions
*
* @returns {Object} Object containing the design matrix computed variables. It has the following keys: X - Combined columns for age, period and cohort transformed values; Pt - Array to guide the user informiing the indexes (in X) for age in the fourth element, period indexes in X .in the fifth element and cohort indexes in X in the sixth element; XAD - Matrix with deviations for the age matrix; XPD - Matrix with deviations for the period matrix; XCD - Matrix with deviations for the cohort matrix
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
*/
apc.makeDesignMatrix = (dt) => {
    var N = dt.data.length - 1
    var J = getUnitVector(N)

    var a = dt.data.slice(1).map( e => e[0] )
    var avals = dt.a
    var aM = avals.length

    var p = dt.data.slice(1).map( e => e[1] )
    var pvals = dt.p
    var pN = pvals.length

    var c = dt.data.slice(1).map( e => e[2] )
    var cvals = dt.c
    var cK = cvals.length

    // Age
    var Ad = []
    for(var i=0; i<aM; i++){
        var vcomp = avals[i]
        var aux = []
        for( var v of a ){
            var bin = 0
            if(v == vcomp){
                bin=1
            }
            aux.push(bin)
        }
        Ad.push(aux)
    }
    Ad = math.transpose(Ad)

    // Period
    var Pd = []
    for(var i=0; i<pN; i++){
        var vcomp = pvals[i]
        var aux = []
        for( var v of p ){
            var bin = 0
            if(v == vcomp){
                bin=1
            }
            aux.push(bin)
        }
        Pd.push(aux)
    }
    Pd = math.transpose(Pd)

    // Cohort
    var Cd = []
    for(var i=0; i<cK; i++){
        var vcomp = cvals[i]
        var aux = []
        for( var v of c ){
            var bin = 0
            if(v == vcomp){
                bin=1
            }
            aux.push(bin)
        }
        Cd.push(aux)
    }
    Cd = math.transpose(Cd)

    var abar = dt.Rvals[0]
    var pbar = dt.Rvals[1]
    var cbar = dt.Rvals[2]

    var a0 = a.map( e => e - abar )
    var p0 = p.map( e => e - pbar )
    var c0 = c.map( e => e - cbar )

    var xa = [ J, a0 ]
    var txa = math.transpose(xa)
    var mxa = math.multiply(xa, txa)
    var Ra = solveSystem( mxa, xa )
    var mdga = math.multiply( txa, Ra )
    var XAD = calcDiffDiag(J, mdga)

    var xp = [ J, p0 ]
    var txp = math.transpose(xp)
    var mxp = math.multiply(xp, txp)
    var Rp = solveSystem( mxp, xp )
    var mdgp = math.multiply( txp, Rp )
    var XPD = calcDiffDiag(J, mdgp)

    var xc = [ J, c0 ]
    var txc = math.transpose(xc)
    var mxc = math.multiply(xc, txc)
    var Rc = solveSystem( mxc, xc )
    var mdgc = math.multiply( txc, Rc )
    var XCD = calcDiffDiag(J, mdgc)

    var Ad0 = math.multiply(XAD, Ad )
    var Pd0 = math.multiply(XPD, Pd )
    var Cd0 = math.multiply(XCD, Cd )

    var X = []
    J.forEach( (e, index) => {
        var aux = [ J[index], a0[index], c0[index] ]
        aux = aux.concat( Ad0[index].slice(1, aM-1) )
        aux = aux.concat( Pd0[index].slice(1, pN-1) )
        aux = aux.concat( Cd0[index].slice(1, cK-1) )
        
        X.push( aux )
    } )

    var pA = Ad[0].length
    var pP = Pd[0].length
    var pC = Cd[0].length

    var Pt = [1, 2, 3]
    var aux = []
    for( var i=4; i <= pA+1; i++ ){
        aux.push( i )
    }
    Pt.push(aux)

    var aux = []
    for( var i = pA+2; i <= pA+pP-1; i++ ){
        aux.push( i )
    }
    Pt.push(aux)

    var aux = []
    for( var i = pA+pP; i <= pA+pP+pC-3; i++ ){
        aux.push( i )
    }
    Pt.push(aux)

    // Computing A and deviations
    var p1 = getUnitVector(aM)
    var p2 = []
    avals.forEach( e => { p2.push( e - abar ) } )
    var xa = [ p1, p2 ]
    var txa = math.transpose(xa)
    var mxa = math.multiply(xa, txa)
    var Ra = solveSystem( mxa, xa )
    var mdga = math.multiply( txa, Ra )
    var XAD = calcDiffDiag( p1, mdga)
    var temp = []
    XAD.forEach( (e, index) => {
        temp.push( e.slice(1, aM-1) )
    } )
    XAD = temp

    // Computing P and deviations
    var p1 = getUnitVector(pN)
    var p2 = []
    pvals.forEach( e => { p2.push( e - pbar ) } )
    var xp = [ p1, p2 ]
    var txp = math.transpose(xp)
    var mxp = math.multiply(xp, txp)
    var Rp = solveSystem( mxp, xp )
    var mdgp = math.multiply( txp, Rp )
    var XPD = calcDiffDiag( p1, mdgp)
    var temp = []
    XPD.forEach( (e, index) => {
        temp.push( e.slice(1, pN-1) )
    } )
    XPD = temp

    // Computing C and deviations
    var p1 = getUnitVector(cK)
    var p2 = []
    cvals.forEach( e => { p2.push( e - cbar ) } )
    var xc = [ p1, p2 ]
    var txc = math.transpose(xc)
    var mxc = math.multiply(xc, txc)
    var Rc = solveSystem( mxc, xc )
    var mdgc = math.multiply( txc, Rc )
    var XCD = calcDiffDiag( p1, mdgc)
    var temp = []
    XCD.forEach( (e, index) => {
        temp.push( e.slice(1, cK-1) )
    } )
    XCD = temp

    var D = { 'X': X, 'Pt': Pt, 'XAD': XAD, 'XPD': XPD, 'XCD': XCD }

    return D
}

/** 
* Wrapper function to compute primary variables for the apc analysis from the formatted CI5 data
*
* @param {Object} s Object containing the formatted CI5 data
* @param {number} [over_dispersion=1] Value of over dispersion
* @param {number} [offset_tick=10000] Value for offset tick
* @param {number} [zero_fill=0.1] Value to replace occcurrences of zero value in the number of cases
*
* @returns {Object} Object containing the primary normalized variables computed for the apc statistical functions. It has the following keys: name - title of the filtered data with the continent, registry, gender and cancer identifiers; description - brief text about the data origin; a - normalized ages vector; periods - years in the analysis; p - normalized periods vector; c - normalized cohort values; data - data table with the columns age, period, cohort, events and offset combined; over_dispersion - Value of the original over dispersion used; offset_tick - Value of offset_tick used; zero_fill - Value of the zero_fill parameter used; Rvals - array with three elements: value of the element in the middle of a array, value of the element in the middle of p array, and value of the element in the c array computed from the previous indexes.
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
*/
apc.makeInputDataApcAnalysis = (s, over_dispersion = 1, offset_tick = 10**5, zero_fill = 0.1) => {
    s['a'] = s.ages
    s['p'] = s.periods

    var dt = { 'name': s.name, 'description': s.description, 'a': [], 'p': [] }

    var m = s.events.length
    var t1 = s.a.slice(1, m+1)
    var t2 = s.a.slice(0, m)
    t1.forEach( (e, index) => { dt['a'].push( ( ( t2[index] - t1[index]) * 0.5 ) + t1[index] ) } )

    var n = s.periods.length
    t1 = s.p.slice(1, n+1)
    t2 = s.p.slice(0, n)
    t1.forEach( (e, index) => { dt['p'].push( ( ( t2[index] - t1[index]) * 0.5 ) + t1[index] ) } )

    var adata = kroneckerUnit(dt.a, 'right', n)[0]
    var pdata = kroneckerUnit(dt.p, 'left', m)[0]
    var cdata = []
    adata.forEach( (e, index) => { if( !isNaN(pdata[index]) && pdata[index]!=undefined && !isNaN(adata[index]) && adata[index]!=undefined ) { cdata.push( pdata[index] - adata[index] ) } } )

    var dif = Array.from( cdata )
    dif.sort( (a,b) => a-b )
    var t = new Set(dif)
    dif = Array.from(t)
    dt['c'] = dif
    
    var ev = []
    math.transpose(s.events).forEach( el => { ev = ev.concat(el) } )

    var o = []
    math.transpose(s.offset).forEach( el => { o = o.concat(el) } )

    var data = [ ["Age","Period","Cohort","Events","Offset"] ]
    cdata.forEach( (e, index) => { 
        if( ev[index] != undefined && o[index] != undefined ){
            evalue = ev[index]==0 ? zero_fill : ev[index]; 
            data.push( [ adata[index], pdata[index], cdata[index], evalue, o[index] ] ) 
        }
    } )
    dt['data'] = data
    
    dt['over_dispersion'] = over_dispersion
    dt['offset_tick'] = offset_tick
    dt['zero_fill'] = zero_fill
    
    var aM = dt.a.length
    var pN = dt.p.length
    
    var abar = math.floor( (aM+1) / 2 )
    var pbar = math.floor( (pN+1) / 2 )
    var cbar = pbar - abar + aM
    abar = dt.a[abar-1]
    pbar = dt.p[pbar-1]
    cbar = dt.c[cbar-1]
    
    dt['Rvals'] = [abar, pbar, cbar]
    
    return dt
}

/** 
* Format CI5 raw data to Age Period Cohort analysis functions
*
* @param {string} continent Continent
* @param {string} registry Registry
* @param {string} gender Gender
* @param {string} cancer Cancer
* @param {Object} dat CI5 data object
*
* @returns {Object} Object containing the formatted CI5 data. It has the following keys: name - title of the filtered data with the continent, registry, gender and cancer identifiers; description - brief text about the data origin; offset_tick - parameter for calculus fixed in 10000; periods - years in the analysis; ages - age groups being considered; events - number of cases considering the filters according to the year and age group; offset - population at risk in the specific year and age group
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
*/
apc.formatDataCi5 = (continent, registry, gender, cancer, dat) => {
    var pops = dat[continent]['dict_population'][registry][gender]
    var obj = dat[continent]['data_cases'][registry][gender][cancer]
    var years_y = Object.keys( obj )
    var age_groups_x = Object.keys( obj[ years_y[0] ] ).slice(1, -1)
    
    var trans = {}
    for( var y of years_y ){
        for (var x of age_groups_x) {
            if( ! Object.keys(trans).includes(x) ){
                trans[x]={ }
            } 
            
            trans[x][y] = [ obj[y][x], pops[y][x] ]
        }
    }
    
    var temp = []
    var i =0
    var valid = Object.keys(trans).map( e => Object.values( trans[e] ).filter( f => f[1]!=0 ).length )
    for( var v of valid ){
        if(v!=0){
            temp.push( age_groups_x[i] )
        }
        i+=1
    }
    var age_groups_x = temp
    
    var start = years_y[0]
    
    var events = []
    var offset = []
    var ages = []
    var i = 1
    for (var x of age_groups_x) {
        var vals = Object.values( trans[x] ).filter(e => e[1]==0 )
        if( vals.length==0){
            ages.push(i)
            vals = Object.values( trans[x] )
            events.push( vals.map(e => parseInt(e[0]) ) )
            offset.push( vals.map(e => parseInt(e[1]) ) )
        }
        i+=1
    }
    
    var dt = {}
    dt['name'] = `Cancer ${cancer} - Continent ${continent} - Cohort ${registry} - Gender ${gender}`
    dt['description'] = `dataset derived from iarc CI5`
    dt['offset_tick'] = 10000    
    dt['periods'] = years_y.map(e => parseInt(e) ).concat( [ parseInt(years_y.slice(-1)[0]) + 1 ] )
    dt['ages'] = ages.concat( [ ages.slice(-1)[0] + 1 ] )
    dt['events'] = events
    dt['offset'] = offset
    
    return dt
    
}

/*  ------------------- Visualization functions  -------------------   */

/** 
* Function to show plot with the confidence intervals 
*
* @param {Object} dt Object containing the object of the analysis result. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
* @param {string} idContainer Tag identifier
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getAgeDeviations( dt, D, apcM )
* apc.vizPlotStats(dt, 'apc_plot')
*/
apc.vizPlotStats = (dt, idContainer) => {
    var x = dt.datatable.map( e => e.x )
    var y = dt.datatable.map( e => e.y )
    var lb = dt.datatable.map( e => e.cilb )
    var ub = dt.datatable.map( e => e.ciub )
    
    var shapes = []
    if( Object.keys(dt).includes('abline_y') ){
        if(dt.abline_y.length > 0){
            dt.abline_y.forEach( e => {
                var wdt = 2
                var type = ''
                if( Object.keys(dt).includes( 'width' ) ){
                    wdt = e.width;
                }
                if( Object.keys(dt).includes( 'type' ) ){
                    type = e.type;
                }
                
                var obj = { type: 'line', xref: 'paper', x0: 0, y0: e.y, x1: max(x), y1: e.y, line:{ color: 'rgb(0, 0, 0)', width: wdt } }
                if(type!=''){
                    obj.line['dash'] = type
                }
                
                shapes.push( obj )
            } )
        }
    }
    
    var trcilo = {
        x: x,
        y: lb,
        line: {width: 0}, 
        marker: {color: "444"}, 
        type: 'scatter',
        mode: 'lines',
        name: 'Lower Bound'
    };
    
    var trmetric = {
        x: x,
        y: y,
        fill: "tonexty", 
        fillcolor: "rgba(186, 192, 204, 0.3)", 
        line: { color:  "rgb(55, 100, 183 )" },
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Metric'
    };
    
    var trcihi = {
        x: x,
        y: ub,
        fill: "tonexty", 
        fillcolor: "rgba(186, 192, 204, 0.3)", 
        line: {width: 0}, 
        marker: {color: "444"}, 
        type: 'scatter',
        mode: 'lines',
        name: 'Upper Bound'
    };

    var data = [trcilo, trmetric, trcihi]

    var layout = {
      title: { 
        text: dt.name ,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#000'
          }
      },
      xaxis: {
        title: {
          text: dt.title_x,
          font: {
            family: 'Courier New, monospace',
            size: 16,
            color: '#7f7f7f'
          }
        },
      },
      yaxis: {
        title: {
          text: dt.title_y,
          font: {
            family: 'Courier New, monospace',
            size: 16,
            color: '#7f7f7f'
          }
        }
      },
      shapes: shapes
    }
    Plotly.newPlot( idContainer, data, layout);
    
}

/** 
* Function to show table in an html element 
*
* @param {Object} dt Object containing the object of the analysis result. It has the following keys: name - analysis identifier; datatable - Object containing the values of x, y, lower bound of confidence interval and upperbound of this confidence interval; waldTest - object containing the analysis identifier (name key) of the wald test and the datatable (datatable key) with objects with the X2 (chi-squared), df (degrees of freedom) and P-Value (calculated p-value) keys; title_x - title of x axis for plot; title_y - title of y axis for plot; abline_y (optional) - array of objects containing the y (y key) value to draw the constant line, the type (type key) of line (dash, dot or remove this key for a solid line) and the width (width key) of line (default is 2)
* @param {string} idContainer Tag identifier
*
* 
* @example
* let v = await iarc.loadCi5Data()
* var s = apc.formatDataCi5( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', v)
* var dt = apc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
* var D = apc.makeDesignMatrix(dt)
* var apcM = apc.apcfit(dt, D.X)
* var df = apc.getAgeDeviations( dt, D, apcM )
* apc.vizDatatableStats(dt, 'apc_table')
*/
apc.vizDatatableStats = (dt, idContainer) => {
    var htmls = ''
    var title = dt['name']
    var spanAdd = 1
    var flag = true
    
    dt = dt['datatable']
    if( Array.isArray(dt) ){
        flag=false
    }
    
    var dat = ''
    if(flag){
        var rowNames = Object.keys(dt)
        var colNames = Object.keys(dt[ rowNames[0] ])
        var header='<th> Information </th>'
        
        for( var rn of rowNames ){
            
            var aux = `<td>${rn}</td>`
            colNames.forEach( e => { 
                var val = ( isNaN( dt[rn][e] ) ) ? 0 : dt[rn][e] 
                aux += `<td> ${ val.toFixed(3) } </td>` 
            } )
            dat += `<tr> ${aux} </tr>`
        }
    }
    else{
        spanAdd = 0
        var noShowCols = ['x', 'y', 'ciub', 'cilb']
        var colNames = Object.keys(dt[0]).filter( e => !noShowCols.includes(e) )
        var header=''
        
        dt.forEach( el => { 
            var aux = ``
            colNames.forEach( e => { aux += `<td> ${el[e].toFixed(3)} </td>` } )
            dat += `<tr> ${aux} </tr>`
        })
        
    }
    colNames.forEach( e => { header += `<th> ${e} </th>` } )
    header=`<tr> ${header} </tr>`
        
    htmls = `
        <div class="text-center">
            <table class="table table-striped">
                <tr > <th colspan="${colNames.length + spanAdd}" role="column" class="text-center" > ${title} </th> </tr>
                ${header}
                ${dat}
            </table>
        </div>
    `
    document.getElementById(idContainer).innerHTML = htmls
}

/** 
* Load a certain dependency library from link
* 
*
* @param {string} url Library URL.
* 
* @example
* apc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
*
*/
apc.loadScript = async function(url){
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

if(typeof(Plotly)=="undefined"){
	apc.loadScript('https://cdn.plot.ly/plotly-2.16.1.min.js')
}

if(typeof(pchisq)=="undefined"){
	apc.loadScript('https://epiverse.github.io/modules/iarc/ytliu0_statFunctions.js')
}

/*  ------------------- Auxiliary functions for statistical analysis (solveSystem, calcDiffDiag, getUnitVector, kroneckerUnit) / math computation shorcuts (min, max, mean, sum) -------------------   */

const sum = (arr) => arr.reduce( (a,b) => a+b )
const max = (arr) => arr.reduce( (a,b) => { if(a > b) { return a; } else{ return b } } )
const min = (arr) => arr.reduce( (a,b) => { if(a < b) { return a; } else{ return b } } )
const mean = (arr) => sum(arr)/arr.length

/** 
* Calculates the rank of a matrix
*
* @param {Array} mat Matrix 
*
* @returns {number} Rank of the matrix
*
* 
* @example
* var mat = [ [1,2,3], [4,5,6], [7,8,9] ]
* let v = getMatRank( mat )
*/
function getMatRank(mat){
    var mup = math.qr( mat ).R // Finding upper triangular matrix
    var rank = math.diag( mup ).filter(e => e!=0 ).length // Checking how many elements in main diagonal is distinct from zero
    return rank
}

/** 
* Solve the variable values of a linear system
*
* @param {Array} x Squared matrix
* @param {Array} b Matrix or vector on the other side of the formula (if null is passed, it returns the inverse matrix of x)
*
* @returns {Array} Linear system solution
*
* 
* @example
* var vector = [ 4, 8, 12 ]
* var mat = [ [1,2,3], [4,5,6], [7,8,9] ]
* let inv = solveSystem( mat )
* let res = solveSystem( mat, vector )
*/
function solveSystem(x, b){
    var tx = math.transpose(x)
    var ix = math.inv(x)
    var rx = ix
    if(b != null){
        rx = math.multiply( ix, b )
    }
    
    return rx
}

/** 
* Calculates the difference between two matrices, the first being made from a vector and the second the desired matrix
*
* @param {Array} vec Vector that will generate a diagonal matrix
* @param {Array} mat Matrix that will be in the right side of the subtraction
*
* @returns {Array} Matrix result of the subtraction
*
* 
* @example
* var vector = [ 4, 8, 12 ]
* var mat = [ [1,2,3], [4,5,6], [7,8,9] ]
* let v = calcDiffDiag( vector, mat )
*/
function calcDiffDiag(vec, mat){
    var dga = math.diag( vec )
    
    var diffg = []
    dga.forEach( (el1, i) => {
        var aux = []
        dga[i].forEach( (el2, j) => {
            aux.push( dga[i][j] - mat[i][j] )
        } )
        diffg.push( aux )
    } )
    
    return diffg
}

/** 
* Calculates a unit diagonal matrix
*
* @param {number} unitLength Size of the unit vector of main diagonal of the matrix
*
* @returns {Array} Unit diagonal matrix
*
* 
* @example
* let v = getUnitDiagMatrix( 3 )
*/
function getUnitDiagMatrix(unitLength){
    var unit = []
    for (var i=0; i<unitLength; i++){
        var aux = []
        for (var j=0; j<unitLength; j++){
            var v = (i==j) ? 1 : 0
            aux.push(v)
        }
        unit.push( aux )
    }
    return unit
}

/** 
* Calculates a unit vector
*
* @param {number} unitLength Size of the unit vector
*
* @returns {Array} Unit Vector
*
* 
* @example
* let v = getUnitVector( 3 )
*/
function getUnitVector(unitLength){
    var unit = []
    for (var i=0; i<unitLength; i++){
        unit.push( 1 )
    }
    return unit
}

/** 
* Calculates the matrix made from kronecker product between a unit vector and a matrix
*
* @param {Array} values Matrix values
* @param {string} [valuesPosition=left] Side of the values matrix in the multiplication
* @param {number} unitLength Size of the unit vector
*
* @returns {Array} Kronecker product matrix
*
* 
* @example
* var mat = [ [1,2,3], [4,5,6], [7,8,9] ]
* let v = kroneckerUnit( mat, 'right', 3 )
*/
function kroneckerUnit( values, valuesPosition='left', unitLength ){
    var unit = getUnitVector(unitLength)
    
    var lv = values
    var rv = unit
    if(valuesPosition == 'right'){
        lv = unit
        rv = values
    }
    
    var matrix = math.kron(lv, rv)
    return matrix
}

export { apc, mean, sum, max, min, kroneckerUnit, getUnitVector, getUnitDiagMatrix, calcDiffDiag, solveSystem, getMatRank }

