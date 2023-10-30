 /**
 *
 *
 * @meta.type Software
 * @meta.subtype Module
 * @meta.name StringSimilarityMetrics
 * @meta.description Library that contains four implementations of string similarity metrics
 * @meta.license mit
 * @meta.author [name=Suman Kunwar] [identifier=https://sumn2u.medium.com/]
 * @meta.reference https://sumn2u.medium.com/string-similarity-comparision-in-js-with-examples-4bae35f13968
 *
 */
 
/* ----------------------- Cosine Similarity ------------------ */
(function () {
    
    function termFreqMap(str) {
        var termFreq = {};
        if( typeof(str)=="string" ){
            var words = str.split(' ');
            words.forEach(function(w) {
                termFreq[w] = (termFreq[w] || 0) + 1;
            });
        }
        return termFreq;
    }

    function addKeysToDict(map, dict) {
        for (var key in map) {
            dict[key] = true;
        }
    }

    function termFreqMapToVector(map, dict) {
        var termFreqVector = [];
        for (var term in dict) {
            termFreqVector.push(map[term] || 0);
        }
        return termFreqVector;
    }

    function vecDotProduct(vecA, vecB) {
        var product = 0;
        for (var i = 0; i < vecA.length; i++) {
            product += vecA[i] * vecB[i];
        }
        return product;
    }

    function vecMagnitude(vec) {
        var sum = 0;
        for (var i = 0; i < vec.length; i++) {
            sum += vec[i] * vec[i];
        }
        return Math.sqrt(sum);
    }

    function cosineSimilarity(vecA, vecB) {
        return vecDotProduct(vecA, vecB) / (vecMagnitude(vecA) * vecMagnitude(vecB));
    }

    CosineSimilarity = function textCosineSimilarity(strA, strB) {
        
        var termFreqA = termFreqMap(strA);
        var termFreqB = termFreqMap(strB);

        var dict = {};
        addKeysToDict(termFreqA, dict);
        addKeysToDict(termFreqB, dict);

        var termFreqVecA = termFreqMapToVector(termFreqA, dict);
        var termFreqVecB = termFreqMapToVector(termFreqB, dict);

        return cosineSimilarity(termFreqVecA, termFreqVecB);
    }
})();

/* ----------------------- JaroWrinkler Similarity ------------------ */
(function () {
    JaroWrinkler  = function (s1, s2) {
        var m = 0;

        // Exit early if either are empty.
        if ( s1.length === 0 || s2.length === 0 ) {
            return 0;
        }

        // Exit early if they're an exact match.
        if ( s1 === s2 ) {
            return 1;
        }

        var range     = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
            s1Matches = new Array(s1.length),
            s2Matches = new Array(s2.length);

        for ( i = 0; i < s1.length; i++ ) {
            var low  = (i >= range) ? i - range : 0,
                high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

            for ( j = low; j <= high; j++ ) {
            if ( s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j] ) {
                ++m;
                s1Matches[i] = s2Matches[j] = true;
                break;
            }
            }
        }

        // Exit early if no matches were found.
        if ( m === 0 ) {
            return 0;
        }

        // Count the transpositions.
        var k = n_trans = 0;

        for ( i = 0; i < s1.length; i++ ) {
            if ( s1Matches[i] === true ) {
            for ( j = k; j < s2.length; j++ ) {
                if ( s2Matches[j] === true ) {
                k = j + 1;
                break;
                }
            }

            if ( s1[i] !== s2[j] ) {
                ++n_trans;
            }
            }
        }

        var weight = (m / s1.length + m / s2.length + (m - (n_trans / 2)) / m) / 3,
            l      = 0,
            p      = 0.1;

        if ( weight > 0.7 ) {
            while ( s1[l] === s2[l] && l < 4 ) {
            ++l;
            }

            weight = weight + l * p * (1 - weight);
        }

        return weight;
    }
})();

/* ----------------------- Levenshtein Similarity ------------------ */
(function () {
        LevenshteinDistance =  function(a, b){
            if(a.length == 0) return b.length; 
            if(b.length == 0) return a.length; 

            var matrix = [];

            // increment along the first column of each row
            var i;
            for(i = 0; i <= b.length; i++){
                matrix[i] = [i];
            }

            // increment each column in the first row
            var j;
            for(j = 0; j <= a.length; j++){
                matrix[0][j] = j;
            }

            // Fill in the rest of the matrix
            for(i = 1; i <= b.length; i++){
                for(j = 1; j <= a.length; j++){
                if(b.charAt(i-1) == a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                            Math.min(matrix[i][j-1] + 1, // insertion
                                                    matrix[i-1][j] + 1)); // deletion
                }
                }
            }

        return matrix[b.length][a.length];
    };
})();

/* ----------------------- TriGram Similarity ------------------ */
(function () {
    TrigramIndex = function (inputPhrases) {
        function asTrigrams(phrase, callback) {
            var rawData = "  ".concat(phrase, "  ");
            for (var i = rawData.length - 3; i >= 0; i = i - 1)
                callback.call(this, rawData.slice(i, i + 3));
        };

        var instance = {
            phrases: [],
            trigramIndex: [],

            index: function (phrase) {
                if (!phrase || phrase === "" || this.phrases.indexOf(phrase) >= 0) return;
                var phraseIndex = this.phrases.push(phrase) - 1;
                asTrigrams.call(this, phrase, function (trigram) {
                    var phrasesForTrigram = this.trigramIndex[trigram];
                    if (!phrasesForTrigram) phrasesForTrigram = [];
                    if( Array.isArray(phrasesForTrigram) ){
                        if (phrasesForTrigram.indexOf(phraseIndex) < 0) phrasesForTrigram.push(phraseIndex);
                    }
                    this.trigramIndex[trigram] = phrasesForTrigram;
                });
            },

            find: function (phrase) {
                var phraseMatches = [];
                var trigramsInPhrase = 0;
                asTrigrams.call(this, phrase, function (trigram) {
                    var phrasesForTrigram = this.trigramIndex[trigram];
                    trigramsInPhrase += 1;
                    if (phrasesForTrigram)
                        for (var j in phrasesForTrigram) {
                            phraseIndex = phrasesForTrigram[j];
                            if (!phraseMatches[phraseIndex]) phraseMatches[phraseIndex] = 0;
                            phraseMatches[phraseIndex] += 1;
                        }
                });
                var result = [];
                for (var i in phraseMatches)
                    result.push({ phrase: this.phrases[i], matches: phraseMatches[i] });

                result.sort(function (a, b) {
                    var diff = b.matches - a.matches;
                    return diff;// == 0 ? a.phrase.localeCompare(b.phrase) : diff;
                });
                return result;
            }
        };
        for (var i in inputPhrases)
            instance.index(inputPhrases[i]);
        return instance;
    };
})();
