import Math_  from "wordpaths-common/src/Math_.js"
import Benchmark_ from "wordpaths-common/src/Benchmark_.js"
import { Point } from "./nns.js"
import Random_ from "wordpaths-common/src/Random_.js"
import BruteForceNNS from "./brute-force.js"
import { clearLastLine } from "wordpaths-common/src/Common_.js"
import fsp from "fs/promises"
import fs from "fs"


export default class IVFFlat 
{
    constructor({
        measureFn = Math_.cosineDistance,
        clusterCount = 1000,
        iterCount = 50, 
        randomState = 1234567890,
        verbose = true,
        preSave = true,
        preSaveFile = "./data/index.json"
    } = {}) {
        this.measureFn  = measureFn
        this.clusterCount = clusterCount
        this.iterCount = iterCount 
        this.randomState = randomState
        this.random = new Random_(this.randomState)
        this.verbose = verbose 
        this.preSave = preSave
        this.preSaveFile = preSaveFile
        
        this._points = []
        this._centroids = [] 
        this._clusters = []
        this._clusterIndex = null
    }

    /** --- UTILITY METHODS --- */
    
    size() {
        return this._points.length
    }   

    dimCount() {
        return this._points[0].length
    }

    point(i) {
        return this._points[i]
    }

    /** --- CONSTRUCTION METHODS --- */
    
    setPoints(points) {
        for(let i = 0; i < points.length; i++) {
            this._points[i] = new Point(i, points[i])
        }
    }

    build(benchmark = false) {
        const points = this._points

        // --- generate random centroids 
        this._centroids = this.random.sample(points, this.clusterCount)
        
        // --- generate empty clusters 
        this.resetClusters()

        // --- loop for iteration count 
        for(let i = 0; i < this.iterCount; i++) {
            this.runIteration()
        }
            
    }

    resetClusters() {
        this._clusters = new Array(this.clusterCount).fill(null).map(_ => []) 
    }

    runIteration() {
        this.assignClusters()
        this.adjustCentroids()
        if(this.preSave) {
            this.save(this.preSaveFile)
        }
    }

    assignClusters() {
        if(this.verbose) {
            console.log("--- Assigning clusters.")
        }
        console.log()
        const points   = this._points;
        this._clusterIndex    = new BruteForceNNS({
            measureFn: this.measureFn
        })  
        this._clusterIndex._points  = this._centroids
        const benchmarker = new Benchmark_()
        benchmarker.start("build-chunk")

        let elapsed = 0;

        for(let i = 0; i < points.length; i++) {
            if(i % Math.floor(points.length / 1000) == 0) {
                benchmarker.end("build-chunk")        
                clearLastLine()
                console.log(
                    `\t--- Processing ${i + 1} of ${points.length} ` +
                    `(duration: ${benchmarker.duration("build-chunk").toFixed(2)} s, ` +
                    `elapsed: ${elapsed.toFixed(2)} s)`
                )
                elapsed += benchmarker.duration("build-chunk")
                benchmarker.start("build-chunk")        
            }
            const otherPoint = points[i]
            const closest = this._clusterIndex.nearest(otherPoint.value, 1)
            const closestCluster = closest.items[0][0]
            this._clusters[closestCluster].push(i)
        }
    }

    adjustCentroids() {
        if(this.verbose) {
            console.log("--- Adjusting centroids.")
        }
        const clusters = this._clusters;
        const centroids = this._centroids;
        const points = this._points;
        for(let i = 0; i < this.clusterCount; i++) {
            clearLastLine()
            console.log(`\t--- Processing ${i + 1} of ${this.clusterCount}`)
            const cluster = clusters[i]
            if(cluster.length == 0) {
                centroids[i] = this.random.choice(this.points)
                continue
            }
            const clusterPoints = cluster.map(id => points[id].value)
            const centroid = Math_.centroid(clusterPoints)
            centroids[i] = new Point(i, centroid)
        }
    }


    /** --- QUERY METHODS --- */

    nearest(queryPoint, k, minProbeCount = 3) {
        const benchmarker = new Benchmark_()
        let results;
        
        benchmarker.start("query")

        let probedCount = 0
        let distances = []
        let closestClusters = this._clusterIndex.nearest(queryPoint, this.clusterCount)
        let added = new Set()


        while(probedCount < minProbeCount || distances.length < k) {
            const clusterIndex = closestClusters.items[probedCount][0]
            const clusterPointIndices = this._clusters[clusterIndex]
            const clusterPoints = clusterPointIndices.map(id => this._points[id])
            for(let otherPoint of clusterPoints) {
                if(added.has(otherPoint.id)) continue
                const distance = this.measureFn(queryPoint, otherPoint.value)
                distances.push([otherPoint.id, distance])
                added.add(otherPoint.id)
            }
            probedCount += 1
        }

        distances.sort((a, b) => a[1] - b[1]) 
        results = distances.slice(0, k)

        benchmarker.end("query")

        return {
            items : results,
            time : benchmarker.duration("query")
        }
    }

    farthest(queryPoint, k, minProbeCount) {
        const benchmarker = new Benchmark_()
        let results;
        
        benchmarker.start("query")

        let probedCount = 0
        let distances = []
        let closestClusters = this._clusterIndex.farthest(queryPoint, this.clusterCount)
        let added = new Set()

        while(probedCount < minProbeCount || distances.length < k) {
            const clusterIndex = closestClusters.items[probedCount][0]
            const clusterPointIndices = this._clusters[clusterIndex]
            const clusterPoints = clusterPointIndices.map(id => this._points[id])
            for(let otherPoint of clusterPoints) {
                if(added.has(otherPoint.id)) continue
                const distance = this.measureFn(queryPoint, otherPoint.value)
                distances.push([otherPoint.id, distance])
                added.add(otherPoint.id)
            }
            probedCount += 1
        }

        distances.sort((a, b) => b[1] - a[1]) 
        results = distances.slice(0, k)

        benchmarker.end("query")

        return {
            items : results,
            time : benchmarker.duration("query")
        }
    }

    save(outFile) {
        const data = {
            centroids : this._centroids.map(x => x.value), 
            clusters  : this._clusters
        }
        fs.writeFileSync(outFile, JSON.stringify(data))
    }

    load(inFile) {
        const data = JSON.parse(fs.readFileSync(inFile)) 
        this.clusterCount = data.clusterCount
        this._centroids = data.centroids.map((v, i) => new Point(i, v))
        this._clusters = data.clusters
        this._clusterIndex = new BruteForceNNS({
            measureFn: this.measureFn
        })
        this._clusterIndex._points = this._centroids
    }

    loadJSON(data) {
        this.clusterCount = data.clusterCount
        this._centroids = data.centroids.map((v, i) => new Point(i, v))
        this._clusters = data.clusters
        this._clusterIndex = new BruteForceNNS({
            measureFn: this.measureFn
        })
        this._clusterIndex._points = this._centroids
    }
}