var mb32=s=>t=>(s=s+1831565813|0,t=Math.imul(s^s>>>15,1|s),t=t+Math.imul(t^t>>>7,61|t)^t,(t^t>>>14)>>>0)/2**32;
// Better 32-bit integer hash function: https://burtleburtle.net/bob/hash/integer.html
var hash=n=>(n=61^n^n>>>16,n+=n<<3,n=Math.imul(n,668265261),n^=n>>>15)>>>0;

const COLORS = ["#4F6CA6", "#EFA21E", "#DC495C", "#5B8545", "#050505", "#FFFFFF"];

function calculateStyle(s) {

    let code = 0;
    for (let i = 0; i < s.length; i++) {
        code += s.charCodeAt(i);
    }

    let i = Math.floor(mb32(hash(code))() * 5.99999);
    let j = i;
    for (let k = 0; i === j; k++) {
        j = Math.floor(mb32(hash(code + s.length * k))() * 5.99999);
    }
    return [i, j]
}

function randomSize(s) {
    let code = 0;
    for (let i = 0; i < s.length; i++) {
        code -= s.charCodeAt(i);
    }

    let i = mb32(hash(code))();
    return 1 + i;
}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
        && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});