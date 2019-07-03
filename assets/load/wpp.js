/**
 * WPP Scripts
 * [c]2018 Ante Laca <ante.laca@gmail.com>
 */
(function(window, document) {

    var wppEvent = 'WPPContentLoaded';
    var lazyloadTimeout;
    var lazyloadVideoTimeout;
    var elements;    
    var videoElements;    
    var WPP = {};

    /**
     * Initialize LazyLoad
     */
    function initLazyLoad() {

        elements = document.querySelectorAll('[data-lazy]');

        if ( 'IntersectionObserver' in window) {

            var elementsObserver = new IntersectionObserver(function(entries, observer) {

                entries.forEach(function(entry) {

                    if (entry.isIntersecting) {

                        var element = entry.target;

                        switch( element.tagName  ) {

                            case 'IMG':
   
                                element.src = element.getAttribute('data-src');
                                element.removeAttribute('data-src');
            
                                // add scrcset
                                if (element.getAttribute('data-srcset')) {
                                    element.srcset = element.getAttribute('data-srcset');
                                    element.removeAttribute('data-srcset');
                                }

                                break;
        
                            case 'IFRAME':

                                break;
        
                        }

                        elementsObserver.unobserve(element);
                        
                    }

                });

            });

            elements.forEach(function(element) {
                elementsObserver.observe(element);
            });

        } else {  

            document.addEventListener('scroll', lazyLoad);
            window.addEventListener('resize', lazyLoad);
            window.addEventListener('orientationChange', lazyLoad);

        }

    };

    /**
     * LazyLoad fallback
     */
    function lazyLoad () {

        if(lazyloadTimeout) {
            clearTimeout(lazyloadTimeout);
        }    

        lazyloadTimeout = setTimeout(function() {

            var scrollTop = window.pageYOffset;

            elements.forEach(function(element) {

                if ( element.offsetTop < ( window.innerHeight + scrollTop ) ) {

                    switch( element.tagName  ) {

                        case 'IMG':

                            element.src = element.getAttribute('data-src');
                            element.removeAttribute('data-src');
        
                            // add scrcset
                            if (element.getAttribute('data-srcset')) {
                                element.srcset = element.getAttribute('data-srcset');
                                element.removeAttribute('data-srcset');
                            }
        

                            break;

                        case 'IFRAME':

                            break;

                    }

                }


            });

            if (elements.length == 0) { 
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationChange', lazyLoad);
            }

        }, 20);

    }

 
    /**
     * Load CSS file
     * 
     * @param {string} href 
     * @param {string} media 
     */
    function loadCSS(href, media){

        var link = document.createElement('link');
                                       
        link.rel = 'stylesheet';
        link.href = href;
        link.media = media || 'all';
        document.head.appendChild(link);
    }

    /**
     * Check if browser supports preload
     */
    function supportsPreload(){
        var list = document.createElement('link').relList;
        if (!list || !list.supports) {
            return false;
        }
        return list.supports('preload');
    };  

    /**
     * Load styles with rel=preload attribute
     */
    function preloadStyles(){   
        // get all link elements and load them with loadCSS 
        var links = document.getElementsByTagName('link');

        for (var i in links) {
            if (links[i].rel === 'preload' && links[i].getAttribute('as') === 'style') { 
                loadCSS(links[i].href, links[i].getAttribute('media') || 'all');
            }
        }

    };

    /**
     *  Load scripts asynchronously  
     * 
     * @param {array} scripts 
     */
    function getScripts(scripts) {

        var promises = [];

        scripts.forEach(function (script) {

            var promise = new Promise(function (resolve, reject) {

                if (script.url) {

                    var xhr = new XMLHttpRequest();

                    xhr.open('get', script.url);
                    xhr.onload = function () {
                        // check status
                        if (xhr.status == 200) {
                            resolve({
                                file: script.url,
                                code: xhr.response.split('DOMContentLoaded').join(wppEvent)
                            });

                        } else {
                            reject(Error(xhr.statusText));
                        }

                    };

                    // xhr never timeout, so we do it ourselves
                    setTimeout( function() {
                        if (xhr.readyState < 4) {
                            xhr.abort();
                            return reject(new Error(script.url + ' timeout'));
                        }
                    }, 10000);

                    xhr.send();

                } else {
                    resolve({
                        file: null,
                        code: script.code.split('DOMContentLoaded').join(wppEvent)
                    });
                }

            });

            // add promise
            promises.push(promise);

        });

        // return promises
        return Promise.all(promises);

    }


    /**
     * Load JavaScript with type="text/wppscript" attribute
     */
    function loadJS() {
        
        var data = [],
            scripts = document.getElementsByTagName('script');

        // process all script tags
        for (var i in scripts) {
            if (scripts[i].type == 'text/wppscript') {
                data.push({
                    url: scripts[i].getAttribute('data-src') || null,
                    code: scripts[i].innerHTML || null
                });
            }
        }

        /**
         * Run scripts
         */
        getScripts(data).then(function (codes) {
            for (var i in codes) {
                try {
                    (1, eval)(codes[i].code);
                } catch (e) {
                    console.error(e.name, e.message, codes[i].file || 'WPP script index: ' + i);
                }
            }

            // WPP loaded
            document.dispatchEvent(new Event(wppEvent));

        });

    }

    if ( WPP.css && ! supportsPreload() ) preloadStyles();
    if ( WPP.images || WPP.videos ) initLazyLoad();
    if ( WPP.js ) loadJS();

    if ( typeof WPP.expire != 'undefined' ) {
        if ( Math.floor(new Date().getTime() / 1000) > WPP.expire) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', WPP.ajax_url, true);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.send('action=wpp_clear_cache');
        }    
    }


})(window, document);
