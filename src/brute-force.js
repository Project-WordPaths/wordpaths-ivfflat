import Math_  from "wordpaths-common/src/Math_.js"
import Benchmark_ from "wordpaths-common/src/Benchmark_.js"
import { Point } from "./nns.js"

export default class BruteForceNNS 
{
    constructor({
        measureFn = Math_.cosineDistance
    } = {}) {
        this.measureFn  = measureFn
        
        this._points = []
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
            this._pointCount += 1
        }
    }

    build() {
        return 
    }

    /** --- QUERY METHODS --- */

    nearest(queryPoint, k) {
        const benchmarker = new Benchmark_()
        
        benchmarker.start("query")

        const results = [] 
        const points = this._points 
        for(let i = 0; i < points.length; i++) {
            const otherPoint = points[i].value 
            const distance = this.measureFn(queryPoint, otherPoint)
            results.push([i, distance])
        }
        results.sort((a, b) => a[1] - b[1])

        benchmarker.end("query")

        return {
            items : results.slice(0, k),
            time : benchmarker.duration("query")
        }
    }

    farthest(queryPoint, k) {
        const benchmarker = new Benchmark_()
        
        benchmarker.start("query")

        const results = [] 
        const points = this._points 
        for(let i = 0; i < points.length; i++) {
            const otherPoint = points[i].value 
            const distance = this.measureFn(queryPoint, otherPoint)
            results.push([i, distance])
        }
        results.sort((a, b) => b[1] - a[1])

        benchmarker.end("query")

        return {
            items : results.slice(0, k),
            time : benchmarker.duration("query")
        }
    }



}