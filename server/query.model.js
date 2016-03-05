var Query = (function () {
    function Query(filename, status, hash, and, or, not) {
        this.filename = filename;
        this.status = status;
        this.hash = hash;
        this.and = and;
        this.or = or;
        this.not = not;
    }
    return Query;
})();
exports.Query = Query;
