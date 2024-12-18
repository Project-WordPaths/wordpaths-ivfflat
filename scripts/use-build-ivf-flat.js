import Math_ from "wordpaths-common/src/Math_.js"
import { WordModel } from "wordpaths-word-model/src/word-model.js" 
import IVFFlat from "../src/ivf-flat.js";
import Random_ from "wordpaths-common/src/Random_.js"
import { settings } from "../settings.js";

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
console.log("Building index.") 
const index = new IVFFlat({
    iterCount    : settings.IVF_ITER_COUNT,
    clusterCount : settings.IVF_CLUSTER_COUNT,
    randomState  : settings.RANDOM_STATE,
    measureFn    : Math_.adjustedCosineDistance
})
index.setPoints(points)
index.build() 

/**
 * Query index.
 */
console.log("Querying index.") 
const results = index.nearest(
    points[settings.TARGET], 
    settings.QUERY_COUNT, 
    settings.IVF_PROBE_COUNT
)
let i = 0
for(let result of results.items) {
    console.log(`Item #${i + 1} : ${result[0]} = ${result[1]}`)
    i += 1
}
console.log("Query Duration :", results.time + " seconds.")

console.log("Done.")