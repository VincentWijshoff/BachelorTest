

class Bag<T> {


    map = new Map<T, number>();
    size = 0;

    constructor(elems: Iterable<T> ) {
        for (let elem of elems) {
            this.map.set(elem, (this.map.get(elem) || 0) + 1);
            this.size++;
        }
    }

    has(elem: T): boolean {
        return this.map.has(elem);
    }

    delete(elem: T) {
        let count = this.map.get(elem);
        if (count == 1)
            this.map.delete(elem);
        else if (count!== undefined && count > 0)
            this.map.set(elem, count - 1);
        this.size--;
    }

    *[Symbol.iterator]() {
        for (let elem of this.map.keys()) {
            let count = this.map.get(elem);
            for (let i = 0; i < count!; i++)
                yield elem;
        }
    }

}

export default Bag;