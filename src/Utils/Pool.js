export default class Pool {
    // runs fn over items with at most `limit` going at once, stops on the first error
    static async Run(items, limit, fn) {
        let next = 0;

        let worker = async () => {
            while (next < items.length) {
                let index = next;
                next++;
                await fn(items[index], index);
            }
        };

        let workers = [];
        for (let i = 0; i < Math.min(limit, items.length); i++) {
            workers.push(worker());
        }
        await Promise.all(workers);
    }
}
