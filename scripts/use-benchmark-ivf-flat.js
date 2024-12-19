import Math_ from "wordpaths-common/src/Math_.js"
import { WordModel } from "wordpaths-word-model/src/word-model.js" 
import IVFFlat from "../src/ivf-flat.js";
import Random_ from "wordpaths-common/src/Random_.js"
import { settings } from "../settings.js";
import BruteForceNNS from "../src/brute-force.js";
import Benchmark_ from "wordpaths-common/src/Benchmark_.js";
import fs from "fs"

/**
 * Benchmark setup.
 */
const SAMPLE_COUNT = 5000
const BENCHMARK_FILE = `./data/benchmarks/probe-${settings.IVF_PROBE_COUNT}.csv`

/*
 * Create generator.
 */
const generator = new Random_(settings.RANDOM_STATE)

/** 
 * Load Word Model
 */
console.log("Loading word model...") 
const wordModel = new WordModel(
    "fs", 
    "/home/lvjhn/Projects/wordpaths/wordpaths-word-model/data/glove-50d/preprocessed", 
    50, 
    settings.RANDOM_STATE
)

fs.readFile('file.pdf', function(err, data) {
  var checksum = generateChecksum(data);
  console.log(checksum);
});

function generateChecksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');
}

await wordModel.load({
    onProgress(perc, message) {
        console.log(`---- Loading (${perc .toFixed(2)}) ${message}`)
    },
    onSubProgress(i, n) {
        console.log(`\t---- Loading ${i} of ${n}`)
    }
})

let points = wordModel.vectors; 
points = generator.sample(points, settings.POINT_COUNT)

/** 
 * Build index.
 */
console.log("Building index for approximate queries.") 
const approx = new IVFFlat({
    iterCount    : settings.IVF_ITER_COUNT,
    clusterCount : settings.IVF_CLUSTER_COUNT,
    randomState  : settings.RANDOM_STATE,
    measureFn    : Math_.adjustedCosineDistance
}) 
approx.setPoints(points)
approx.load("./data/index.json")

/** 
 * Build index.
 */
console.log("Building index for exact queries.") 
const exact = new BruteForceNNS({
    measureFn    : Math_.adjustedCosineDistance
}) 
exact.setPoints(points)

/**
 * Run benchmark.
 */
const benchmarkPoints = generator.sample(exact._points, SAMPLE_COUNT)

function score(exactResults, approxResults) {
    const checkSet = new Set(exactResults.map(x => x[0]))
    let total = exactResults.length 
    let correct = 0
    for(let item of approxResults) {
        if(checkSet.has(item[0])) {
            correct += 1
        }
    }
    return correct / total
}

const header =   
    `n1,n5,n10,n20,n50,n100,n500,n1000,n2500,n5000,`  +
    `f1,f5,f10,f20,f50,f100,f500,f1000,f2500,f5000,` +
    `fil1,fil,fil10,fil20,fil50,fil100,fil500,fil1000,fil2500,fil5000,`  +
    `lil1,lil5,lil10,lil20,lil50,lil100,lil500,lil1000,fil2500,fil5000,` +
    `etn,etf,` + 
    `at,atmin,atmax\n` 

fs.writeFileSync(BENCHMARK_FILE, header) 

for(let i = 0; i < SAMPLE_COUNT; i++) {
    const benchmarkTime = new Benchmark_()
    benchmarkTime.start("benchmark-item")

    const benchmarkPoint = benchmarkPoints[i]

    console.log(`--- Benchmarking ${i + 1} of ${SAMPLE_COUNT}.`)
    benchmarkTime.start("benchmark-nearest")
    const exactResultsNearest  = 
        exact.nearest(benchmarkPoint.value, exact._points.length).items
    benchmarkTime.end("benchmark-nearest")

    benchmarkTime.start("benchmark-farthest")
    const exactResultsFarthest = 
        exact.farthest(benchmarkPoint.value, exact._points.length).items
    benchmarkTime.end("benchmark-farthest")

    const scoresNearest        = [] 
    const scoresFarthest       = []
    const times                = []
    let firstIndexLocations    = []
    let lastIndexLocations     = []
    let averageTime            = Infinity

    for(let k of [1, 5, 10, 20, 50, 100, 500, 1000, 2500, 5000]) {
        const benchmarkTime = new Benchmark_()
        
        benchmarkTime.start("benchmark-nearest")
        const approxResultsNearest = 
            approx.nearest(benchmarkPoint.value, k, settings.IVF_PROBE_COUNT).items
        benchmarkTime.end("benchmark-nearest")

        benchmarkTime.start("benchmark-farthest")
        const approxResultsFarthest = 
            approx.farthest(benchmarkPoint.value, k, settings.IVF_PROBE_COUNT).items
        benchmarkTime.end("benchmark-farthest")

        console.log(approxResultsNearest.slice(0, 10))

        console.log(exactResultsNearest.slice(0, 10))

        const nearestScore = score(
            exactResultsNearest.slice(0, k),
            approxResultsNearest
        )
        const farthestScore = score(
            exactResultsFarthest.slice(0, k),
            approxResultsFarthest
        )

        scoresNearest.push(nearestScore)
        scoresFarthest.push(farthestScore)

        firstIndexLocations.push(
            exactResultsNearest.findIndex(item => item[0] == approxResultsNearest[0][0])
        )
        lastIndexLocations.push( 
            exact._points.length - 
            exactResultsFarthest.findIndex(item => item[0] == approxResultsFarthest[0][0])
        )
    }   
    
    averageTime = Math_.average(times)

    console.log(
        `\t\tNearest Scores   : ` +
        `${scoresNearest.map(x => parseFloat(x.toFixed(2))).join('|')}`
    )
    console.log(
        `\t\tFarthest Scores  : ` +
        `${scoresFarthest.map(x => parseFloat(x.toFixed(2))).join('|')}`
    )

    console.log(
        `\t\tFirst Index Location  : ` +
        `${firstIndexLocations.join(" | ")}`
    )

    console.log(
        `\t\tLast Index Location  : ` +
        `${lastIndexLocations.join(" | ")}`
    )

    console.log(
        `\t\tApprox. Time  : ` +
        `${averageTime}`
    )


    console.log(
        `\t\tApprox. Max. Time  : ` +
        `${Math.max(...times)}`
    )

    console.log(
        `\t\tApprox. Min. Time  : ` +
        `${Math.min(...times)}`
    )

    console.log(
        `\t\tExact Time (Nearest) : ` +
        `${benchmarkTime.duration("benchmark-nearest")}`
    )

    console.log(
        `\t\tExact Time (Farthest) : ` +
        `${benchmarkTime.duration("benchmark-farthest")}`
    )

    // `n1,n5,n10,n20,n50,n100,n500,n1000`  +
    // `f1,f5,f10,f20,f50,f100,f500,f1000` +
    // `fil1,fil5,fil10,fil20,fil50,fil100,fil500,fil1000`  +
    // `lil1,lil5,lil10,lil20,lil50,lil100,lil500,lil1000` +
    // `etn,etf` + 
    // `at,atmin,atmax` 

    let data = ""
    data += scoresNearest.join(",") + ","
    data += scoresFarthest.join(",")  + ","
    data += firstIndexLocations.join(",") + ","
    data += lastIndexLocations.join(",") + ","
    data += `${benchmarkTime.duration("benchmark-nearest")}` + ","
    data += `${benchmarkTime.duration("benchmark-farthest")}` + ","
    data += `${Math_.average(times)}` + ","
    data += `${Math.min(...times)}` + ","
    data += `${Math.max(...times)}` 
    data += "\n"
    if(data.split(",").length != header.split(",").length) {
        throw new Error("Must be equal.")
    }
    data = data.split(",").map(x => parseFloat(x).toFixed(4)).join(",") + "\n"
    fs.appendFileSync(BENCHMARK_FILE, data)


    benchmarkTime.end("benchmark-item")
}
