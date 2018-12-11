module.exports = {
    escapeRegExp: function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
};