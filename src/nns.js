
export class Point 
{
    constructor(id, value) {
        this.id = id 
        this.value = value 
    }

    dimCount() {
        return this.value.length
    }

    at(i) {
        return this.value.at(i)
    }
}