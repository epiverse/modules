/* statistics */

/*

s = iarc.formatData( 'Oceania', 'Australia_NSW_ACT', 'Female', 'Lung (incl. trachea) (C33-34)', datci )
dt = iarc.makeInputDataApcAnalysis(s, 1, 10**5, 0.1)
D = iarc.makeDesignMatrix(dt)
apcM = iarc.apcfit(dt, D.X)

fr = iarc.getFittedRates( s, dt, D, apcM )
coefs = iarc.getCoefficients( s, dt, D, apcM )
iarc.vizDatatableStats(coefs, 'coefficients')
nd = iarc.getNetDrift( apcM ) 
iarc.vizDatatableStats(nd, 'netdrift')
adev = iarc.getAgeDeviations( dt, D, apcM )
pdev = iarc.getPeriodDeviations( dt, D, apcM )
df = iarc.getCohortDeviations( dt, D, apcM )
df = iarc.getLongitudinalAgeCurve( dt, D, apcM )
df = iarc.getLongitudinalAgeRateRatio( dt, D, apcM )
df = iarc.getCrossSectionalAgeCurve( dt, D, apcM )
df = iarc.getLongitudinal2CrossSectionalAgeCurve( dt, D, apcM )
df = iarc.getFittedTemporalTrends( dt, D, apcM )

iarc.vizDatatableStats(df, 'apc_table')
iarc.vizPlotStats(df, 'apc_plot')

# ----- lab ------
B = apcM.B
s2VAR = apcM.s2VAR
A = dt.a.length
P = dt.p.length
C = dt.c.length

c0 = dt.Rvals[2]
c0LOC = c.indexOf(c0)

    var dtwt = { 'name': 'All Cohort Deviations = 0' }
    var wt = {}
    p1 = math.transpose( b.slice(1, C-1) )
    var p2 = solveSystem( v.slice(1, C-1).map( e => e.slice(1, C-1)), b.slice(1, C-1) )
    wt['x2'] = math.multiply( p1, p2 )[0][0]
    wt["df"] = C-2
    wt['P-Value'] = pchisq( wt['X2'], wt['df'], 1)
    dtwt['datatable'] = wt

iarc.getFittedTemporalTrends = ( dt, D, apcM ) => {
    
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

--------------------------

  #
  # (8) Period Rate Ratios
  #
  Xp <- cbind(matrix(1,P), p-p0, D$XPD)
  TMP <- diag(0,nrow=P)
  TMP[, is.element(p, p0)] <- 1
  PRR <- diag(P) - TMP
  D$XPR <- PRR%*%Xp
  pr <- D$XPR%*%B[c(1, 3, D$Pt[[5]])]
  vpr <- D$XPR%*%s2VAR[c(1, 3, D$Pt[[5]]), c(1, 3, D$Pt[[5]])]%*%t(D$XPR)
  sd <- matrix(sqrt(diag(vpr)))
  ci <- cbind(pr - 1.96*sd, pr + 1.96*sd)
  epr <- exp(pr)
  eci <- exp(ci)
  PeriodRR <- cbind(p, epr, eci)
  dimnames(PeriodRR) <- list(c(), c("Period", "Rate Ratio", "CILo", "CIHi"))
  
  # Wald test - any PRR different from 1?
  I <- 1:P
  INC8 <- I[!is.element(p,p0)]
  X28 <- t(matrix(pr[INC8]))%*%solve(vpr[INC8,INC8], matrix(pr[INC8]))
  df8 <- P - 1
  PVAL8 <- pchisq(X28, df8, lower.tail = FALSE)
    
*/

iarc.getFittedTemporalTrends = ( dt, D, apcM ) => {
    
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

iarc.getLongitudinal2CrossSectionalAgeCurve = ( dt, D, apcM ) => {
    
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

iarc.getCrossSectionalAgeCurve = ( dt, D, apcM ) => {
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

iarc.getLongitudinalAgeRateRatio = ( dt, D, apcM ) => {
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

iarc.getLongitudinalAgeCurve = ( dt, D, apcM ) => {
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

iarc.getCohortDeviations = ( dt, D, apcM ) => {
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

iarc.getPeriodDeviations = ( dt, D, apcM ) => {
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

iarc.getAgeDeviations = ( dt, D, apcM ) => {
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

iarc.getNetDrift = ( apcM ) => {
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

iarc.getCoefficients = ( s, dt, D, apcM ) => {
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

iarc.getFittedRates = ( s, dt, D, apcM ) => {
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

iarc.apcfit = (dt, X) => {
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
    
    apcmodel = { 'B': B, 's2': s2, 's2VAR': s2v, 'DEV': DEV, 'DevResids': DEVRESIDS }
    
    return apcmodel
}

iarc.makeDesignMatrix = (dt) => {
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

    D = { 'X': X, 'Pt': Pt, 'XAD': XAD, 'XPD': XPD, 'XCD': XCD }

    return D
}

iarc.makeInputDataApcAnalysis = (s, over_dispersion = 1, offset_tick = 10**5, zero_fill = 0.1) => {
    s['a'] = s.ages
    s['p'] = s.periods

    dt = { 'name': s.name, 'description': s.description, 'a': [], 'p': [] }

    m = s.events.length
    t1 = s.a.slice(1, m+1)
    t2 = s.a.slice(0, m)
    t1.forEach( (e, index) => { dt['a'].push( ( ( t2[index] - t1[index]) * 0.5 ) + t1[index] ) } )

    n = s.periods.length
    t1 = s.p.slice(1, n+1)
    t2 = s.p.slice(0, n)
    t1.forEach( (e, index) => { dt['p'].push( ( ( t2[index] - t1[index]) * 0.5 ) + t1[index] ) } )

    var adata = kroneckerUnit(dt.a, 'right', n)[0]
    var pdata = kroneckerUnit(dt.p, 'left', m)[0]
    var cdata = []
    adata.forEach( (e, index) => { if( !isNaN(pdata[index]) && pdata[index]!=undefined && !isNaN(adata[index]) && adata[index]!=undefined ) { cdata.push( pdata[index] - adata[index] ) } } )

    var dif = Array.from( cdata )
    dif.sort( (a,b) => a-b )
    t = new Set(dif)
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

iarc.formatData = (continent, registry, gender, cancer, dat) => {
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
    age_groups_x = temp
    
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
iarc.vizPlotStats = (dt, idContainer) => {
    var x = dt.datatable.map( e => e.x )
    var y = dt.datatable.map( e => e.y )
    var lb = dt.datatable.map( e => e.cilb )
    var ub = dt.datatable.map( e => e.ciub )
    
    var shapes = []
    if( Object.keys(dt).includes('abline_y') ){
        if(dt.abline_y.length > 0){
            dt.abline_y.forEach( e => {
                shapes.push( { type: 'line', xref: 'paper', x0: 0, y0: e.y, x1: max(x), y1: e.y, line:{ color: 'rgb(0, 0, 0)', width: 2, dash: e.type } } )
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

iarc.vizDatatableStats = (dt, idContainer) => {
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

/*  ------------------- Auxiliary functions for statistical analysis (solveSystem, calcDiffDiag, getUnitVector, kroneckerUnit) / math computation shorcuts (min, max, mean, sum) -------------------   */

const sum = (arr) => arr.reduce( (a,b) => a+b )
const max = (arr) => arr.reduce( (a,b) => { if(a > b) { return a; } else{ return b } } )
const min = (arr) => arr.reduce( (a,b) => { if(a < b) { return a; } else{ return b } } )
const mean = (arr) => sum(arr)/arr.length

function getMatRank(mat){
    var mup = math.qr( mat ).R // Finding upper triangular matrix
    var rank = math.diag( mup ).filter(e => e!=0 ).length // Checking how many elements in main diagonal is distinct from zero
    return rank
}

function solveSystem(x, b){
    var tx = math.transpose(x)
    var ix = math.inv(x)
    var rx = ix
    if(b != null){
        rx = math.multiply( ix, b )
    }
    
    return rx
}

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

function getUnitVector(unitLength){
    var unit = []
    for (var i=0; i<unitLength; i++){
        unit.push( 1 )
    }
    return unit
}

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

