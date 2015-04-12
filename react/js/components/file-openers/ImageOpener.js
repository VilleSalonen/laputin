module.exports = function (files) {
    localStorage.setItem("playlist", JSON.stringify(files));
};
