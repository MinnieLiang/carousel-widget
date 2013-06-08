/**
 * 自动切换组件
 *
 * 例子参见：http://maxzhang.github.io/carousel-widget/dev/examples/carousel.html
 *
 */
(function(window) {
    var navigator = window.navigator,
        pointerEnabled = navigator.msPointerEnabled,
        isAndroid = /Android[\s\/]+[\d.]+/i.test(navigator.userAgent),
        dummyStyle = document.createElement('div').style,
        vendor = (function () {
            var vendors = 't,webkitT,MozT,msT,OT'.split(','),
                t,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                t = vendors[i] + 'ransform';
                if ( t in dummyStyle ) {
                    return vendors[i].substr(0, vendors[i].length - 1);
                }
            }

            return false;
        })(),
        cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',
        transform = prefixStyle('transform'),
        transitionDuration = prefixStyle('transitionDuration'),
        transitionEndEvent = (function() {
            if (vendor == 'webkit' || vendor === 'O') {
                return vendor.toLowerCase() + 'TransitionEnd';
            }
            return 'transitionend';
        })(),
        noop = function() {},
        proxy = function(fn, scope) {
            return function() {
                return fn.apply(scope, arguments);
            };
        },
        addClass = function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && ( elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    if (cur.indexOf(' ' + clazz + ' ') < 0) {
                        cur += clazz + ' ';
                    }
                }
                elem.className = cur.trim();
            }
        },
        removeClass = function(elem, value) {
            var classes, cur, clazz, i;
            classes = (value || '').match(/\S+/g) || [];
            cur = elem.nodeType === 1 && ( elem.className ? (' ' + elem.className + ' ').replace(/[\t\r\n]/g, ' ') : ' ');
            if (cur) {
                i = 0;
                while ((clazz = classes[i++])) {
                    while (cur.indexOf(' ' + clazz + ' ') >= 0) {
                        cur = cur.replace(' ' + clazz + ' ', ' ');
                    }
                }
                elem.className = cur.trim();
            }
        };

    var Carousel = function(config) {
        config = config || {};
        for (var o in config) {
            this[o] = config[o];
        }

        this.el = typeof this.targetSelector === 'string' ? document.querySelector(this.targetSelector) : this.targetSelector;
        if (pointerEnabled) this.el.style.msTouchAction = 'pan-y';

        this.items = this.itemSelector ? this.el.querySelectorAll(this.itemSelector): this.el.children;
        this.items = Array.prototype.slice.call(this.items, 0);

        var width = this.width === 'auto' ? this.el.offsetWidth : this.width;
        var active = this.activeIndex;
        this.items.forEach(function(item, i) {
            item.style.cssText = 'display' + (active == i ? 'block' : 'none') + ';position:relative;top:0px;' + cssVendor + 'transform:translate3d(' + (active == i ? 0 : -width) + 'px,0px,0px);' + cssVendor + 'transition:' + cssVendor + 'transform 0ms;';
        });
        this.setWidth(width);

        if (this.prevSelector) {
            this.prevEl = document.querySelector(this.prevSelector);
            this.onPrevClickProxy = proxy(this.onPrevClick, this);
            this.prevEl.addEventListener('click', this.onPrevClickProxy, false);
        }
        if (this.nextSelector) {
            this.nextEl = document.querySelector(this.nextSelector);
            this.onNextClickProxy = proxy(this.onNextClick, this);
            this.nextEl.addEventListener('click', this.onNextClickProxy, false);
        }
        if (this.indicatorSelector) {
            this.indicators = document.querySelectorAll(this.indicatorSelector);
            if (this.indicators.length != this.items.length) {
                this.indicators = null;
            } else {
                this.indicators = Array.prototype.slice.call(this.indicators, 0);
            }
        }

        this.onTouchStartProxy = proxy(this.onTouchStart, this);
        this.onTouchMoveProxy = proxy(this.onTouchMove, this);
        this.onTouchEndProxy = proxy(this.onTouchEnd, this);
        if (pointerEnabled) {
            this.el.addEventListener('MSPointerDown', this.onTouchStartProxy, false);
        } else {
            this.el.addEventListener('touchstart', this.onTouchStartProxy, false);
        }

        var activeEl = this.items[this.activeIndex];
        activeEl.style.display = 'block';
        this.to(this.activeIndex, true);

        this.running = false;
        if (this.autoPlay) {
            this.start();
        }
    };

    Carousel.prototype = {
        /**
         * @cfg {String} targetSelector 目标元素选取器，items 默认为 targetSelector 的子元素，可以设置itemSelector，查找指定items子元素
         */

        /**
         * @cfg {String} itemSelector 子元素选取器
         */

        /**
         * @cfg {String} prevSelector 向前按钮选取器
         */

        /**
         * @cfg {String} nextSelector 向后按钮选取器
         */

        /**
         * @cfg {String} indicatorSelector 指示器选取器
         */

        /**
         * @cfg {String} indicatorCls 当前activeIndex指示器样式
         */

        /**
         * @cfg {Number/String} width 组件宽度，默认'auto'
         */
        width: 'auto',

        /**
         * @cfg {Number} activeIndex 初始显示的元素index，默认0
         */
        activeIndex: 0,

        /**
         * @cfg {Boolean} autoPlay true自动切换，默认true
         */
        autoPlay: true,

        /**
         * @cfg {Number} interval 循环滚动间隔时间，单位ms，默认3000
         */
        interval: 3000,

        /**
         * @cfg {Number} duration 动画持续时间，单位ms，默认400
         */
        duration: 400,

        /**
         * @cfg {iScroll} iscroll 关联一个iscroll对象
         * Carousel Widget 为水平方向滚动，如果被嵌套在一个垂直滚动的 iScroll 组件中，会导致触摸滚动 Carousel的水平滚动 与 iScroll的垂直滚动相冲突，
         * 为了解决这个问题，在水平滑动时，禁用iScroll的垂直滚动，水平滑动结束之后，再启用iScroll。
         */

        /**
         * 开始切换之前回调函数，返回值为false时，终止本次slide操作
         */
        beforeSlide: noop,

        /**
         * 切换完成回调函数
         */
        onSlide: noop,

        /**
         * 设置宽度
         * @param width
         */
        setWidth: function(width) {
            this.el.style.width = width + 'px';
            this.items.forEach(function(item) {
                item.style.width = width + 'px';
            });
        },

        // private
        getLastIndex: function() {
            return this.items.length - 1;
        },

        // private
        getContext: function(index) {
            var last = this.getLastIndex(),
                prev,
                next;
            if (typeof index === 'undefined') {
                index = this.activeIndex;
            }
            prev = index - 1;
            next = index + 1;
            if (prev < 0) {
                prev = last;
            }
            if (next > last) {
                next = 0;
            }
            return {
                prev : prev,
                next: next,
                active: index
            };
        },

        /**
         * 开始自动切换
         */
        start: function() {
            if (!this.running) {
                this.running = true;
                this.clear();
                this.run();
            }
        },

        /**
         * 停止自动切换
         */
        stop: function() {
            this.running = false;
            this.clear();
        },

        // private
        clear: function() {
            clearTimeout(this.loopInterval);
            this.loopInterval = null;
        },

        // private
        run: function() {
            var me = this;
            if (!me.loopInterval) {
                me.loopInterval = setInterval(function() {
                    me.to(me.getContext().next);
                }, me.interval);
            }
        },

        /**
         * 切换到上一个
         */
        prev: function() {
            this.to(this.getContext().prev);
        },

        /**
         * 切换到下一个
         */
        next: function() {
            this.to(this.getContext().next);
        },

        /**
         * 切换到index
         * @param {Number} toIndex
         * @param {Boolean} silent 无动画效果
         */
        to: function(toIndex, silent, /* private */ isTouch) {
            var active = this.activeIndex,
                last = this.getLastIndex(),
                slideRight = (toIndex < active && active < last) || (toIndex == last - 1 && active == last) || (toIndex == last && active == 0),
                activeEl, toEl;
            if (!this.sliding) {
                if (toIndex >= 0 && toIndex <= last && toIndex != active && this.beforeSlide(toIndex) !== false) {
                    if (!isTouch) {
                        activeEl = this.items[active];
                        activeEl.style[transform] = 'translate3d(0px,0px,0px)';
                        toEl = this.items[toIndex];
                        toEl.style[transform] = 'translate3d(' + (slideRight ? -activeEl.offsetWidth : activeEl.offsetWidth) + 'px,0px,0px)';
                    }
                    this.slide(toIndex, slideRight, silent);
                } else {
                    this.slide(active, false, silent);
                }
            }
        },

        // private
        slide: function(toIndex, slideRight, silent) {
            var me = this,
                active = me.activeIndex,
                lastActive = active,
                activeEl = me.items[active],
                toEl = me.items[toIndex],
                translateX = (function() {
                    var v = window.getComputedStyle(activeEl)[transform],
                        is3d;
                    if (v) {
                        is3d = /matrix3d/.test(v);
                        v = v.match(is3d ? /matrix3d(.*)/ : /matrix(.*)/);
                        v = v[1].replace(/ /g, '').split(',')[is3d ? 12 : 4];
                        return parseInt(v);
                    }
                    return 0;
                })(),
                offsetWidth = activeEl.offsetWidth,
                baseDuration = me.duration,
                duration,
                context,
                activeSlideHandler,
                toSlideHandler,
                clearHandler = function(el, fn) {
                    el.removeEventListener(transitionEndEvent, fn, false);
                };

            me.sliding = true;

            if (active == toIndex) {
                context = me.getContext();
                slideRight = translateX < 0;
                toEl = me.items[slideRight ? context.next : context.prev];
                duration = silent ? '0ms' : (Math.round((Math.abs(translateX) / offsetWidth) * baseDuration) + 'ms');
                activeSlideHandler = function() {
                    clearHandler(activeEl, activeSlideHandler);
                    activeEl.style.position = 'relative';
                    activeEl.style[transitionDuration] = '0ms';
                };
                toSlideHandler = function() {
                    clearTimeout(me.resetSlideTimeout);
                    delete me.resetSlideTimeout;
                    clearHandler(toEl, toSlideHandler);
                    toEl.style.display = 'none';
                    toEl.style.position = 'relative';
                    toEl.style[transitionDuration] = '0ms';
                    if (me.indicators && me.indicatorCls) {
                        removeClass(me.indicators[lastActive], me.indicatorCls);
                        addClass(me.indicators[me.activeIndex], me.indicatorCls);
                    }
                    me.sliding = false;
                    me.onSlide(me.activeIndex);
                };
            } else {
                me.activeIndex = toIndex;
                activeSlideHandler = function() {
                    clearHandler(activeEl, activeSlideHandler);
                    activeEl.style.display = 'none';
                    activeEl.style.position = 'relative';
                    activeEl.style[transitionDuration] = '0ms';
                };
                toSlideHandler = function() {
                    clearTimeout(me.resetSlideTimeout);
                    delete me.resetSlideTimeout;
                    clearHandler(toEl, toSlideHandler);
                    toEl.style.position = 'relative';
                    toEl.style[transitionDuration] = '0ms';
                    if (me.indicators && me.indicatorCls) {
                        removeClass(me.indicators[lastActive], me.indicatorCls);
                        addClass(me.indicators[me.activeIndex], me.indicatorCls);
                    }
                    me.sliding = false;
                    me.onSlide(me.activeIndex);
                };
                duration = silent ? '0ms' : (Math.round((offsetWidth - (Math.abs(translateX))) / offsetWidth * baseDuration) + 'ms');
            }

            clearHandler(activeEl, activeSlideHandler);
            clearHandler(toEl, toSlideHandler);
            if (!silent) {
                activeEl.addEventListener(transitionEndEvent, activeSlideHandler, false);
                toEl.addEventListener(transitionEndEvent, toSlideHandler, false);
            }
            activeEl.style[transitionDuration] = duration;
            activeEl.style.display = 'block';
            toEl.style.position = 'absolute';
            toEl.style[transitionDuration] = duration;
            toEl.style.display = 'block';

            setTimeout(function() {
                if (active == toIndex) {
                    activeEl.style[transform] = 'translate3d(0px,0px,0px)';
                    toEl.style[transform] = 'translate3d(' + (slideRight ? offsetWidth : -offsetWidth) + 'px,0px,0px)';
                } else {
                    activeEl.style[transform] = 'translate3d(' + (slideRight ? offsetWidth : -offsetWidth) + 'px,0px,0px)';
                    toEl.style[transform] = 'translate3d(0px,0px,0px)';
                }
                if (silent) {
                    activeSlideHandler();
                    toSlideHandler();
                } else {
                    // 防止touch事件与click事件触发的slide动作冲突，导致sliding状态无法被重置
                    me.resetSlideTimeout = setTimeout(function() {
                        activeSlideHandler();
                        toSlideHandler();
                    }, 2000);
                }
            }, isAndroid ? 50 : 0);
        },

        // private
        onPrevClick: function() {
            this.clear();
            this.prev();
            this.autoPlay && this.run();
        },

        // private
        onNextClick: function() {
            this.clear();
            this.next();
            this.autoPlay && this.run();
        },

        // private
        onTouchStart: function(e) {
            if (this.sliding ||
                this.prevEl && this.prevEl.contains && this.prevEl.contains(e.target) ||
                this.nextEl && this.nextEl.contains && this.nextEl.contains(e.target)) {
                return;
            }

            this.clear();

            if (pointerEnabled) {
                this.el.removeEventListener('MSPointerMove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('MSPointerUp', this.onTouchEndProxy, false);
                this.el.addEventListener('MSPointerMove', this.onTouchMoveProxy, false);
                this.el.addEventListener('MSPointerUp', this.onTouchEndProxy, false);
                this.el.addEventListener('MSPointerUp', this.onTouchEndProxy, false);
            } else {
                this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
                this.el.addEventListener('touchmove', this.onTouchMoveProxy, false);
                this.el.addEventListener('touchend', this.onTouchEndProxy, false);
            }

            delete this.horizontal;

            var pageX = pointerEnabled ? e.pageX : e.touches[0].pageX,
                pageY = pointerEnabled ? e.pageY : e.touches[0].pageY,
                context = this.getContext(),
                activeEl = this.items[context.active],
                width = activeEl.offsetWidth,
                setShow = function(el, left, isActive) {
                    el.style.position = isActive ? 'relative' : 'absolute';
                    el.style[transform] = 'translate3d(' + left + 'px,0px,0px)';
                    el.style.display = 'block';
                    el.style[transitionDuration] = '0ms';
                };

            setShow(this.items[context.prev], -width);
            setShow(this.items[context.next], width);
            setShow(activeEl, 0, true);

            this.touchCoords = {};
            this.touchCoords.startX = pageX;
            this.touchCoords.startY = pageY;
            this.touchCoords.timeStamp = e.timeStamp;
        },

        // private
        onTouchMove: function(e) {
            var me = this;

            clearTimeout(me.touchMoveTimeout);
            if (!me.touchCoords) {
                if (pointerEnabled) {
                    // IE10 for Windows Phone 8 的 pointerevent， 触发 MSPointerDown 之后，
                    // 如果触控移动轨迹不符合 -ms-touch-action 规则，则不会触发 MSPointerUp 事件。
                    me.touchMoveTimeout = setTimeout(function() {
                        me.iscroll && me.iscroll.enable();
                        me.autoPlay && me.run();
                    }, 1000);
                }
                return;
            }
            if (me.sliding) {
                return;
            }

            me.touchCoords.stopX = pointerEnabled ? e.pageX : e.touches[0].pageX;
            me.touchCoords.stopY = pointerEnabled ? e.pageY : e.touches[0].pageY;

            var offsetX = me.touchCoords.startX - me.touchCoords.stopX,
                absX = Math.abs(offsetX),
                absY = Math.abs(me.touchCoords.startY - me.touchCoords.stopY);

            if (typeof me.horizontal !== 'undefined') {
                if (offsetX != 0) {
                    e.preventDefault();
                }
                if (me.iscroll && me.iscroll.enabled) {
                    me.iscroll.disable();
                }
            } else {
                if (absX > absY) {
                    me.horizontal = true;
                    if (offsetX != 0) {
                        e.preventDefault();
                    }
                    if (me.iscroll && me.iscroll.enabled) {
                        me.iscroll.disable();
                    }
                } else {
                    delete me.touchCoords;
                    me.horizontal = false;
                    return;
                }
            }

            var context = me.getContext(),
                activeEl = me.items[context.active],
                prevEl = me.items[context.prev],
                nextEl = me.items[context.next],
                width = activeEl.offsetWidth;

            if (absX < width) {
                prevEl.style[transform] = 'translate3d(' + (-width - offsetX) + 'px,0px,0px)';
                activeEl.style[transform] = 'translate3d(' + -offsetX + 'px,0px,0px)';
                nextEl.style[transform] = 'translate3d(' + (width - offsetX) + 'px,0px,0px)';
            }
        },

        // private
        onTouchEnd: function(e) {
            if (pointerEnabled) {
                this.el.removeEventListener('MSPointerMove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('MSPointerUp', this.onTouchEndProxy, false);
            } else {
                this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
            }

            clearTimeout(this.touchMoveTimeout);

            if (this.touchCoords && !this.sliding) {
                var context = this.getContext(),
                    activeEl = this.items[context.active],
                    prevEl = this.items[context.prev],
                    nextEl = this.items[context.next],
                    width = activeEl.offsetWidth,
                    absX = Math.abs(this.touchCoords.startX - this.touchCoords.stopX),
                    transIndex,
                    setHide = function(el) {
                        el.style.display = 'none';
                        el.style.position = 'relative';
                        el.style[transform] = 'translate3d(' + -width + 'px,0px,0px)';
                        el.style[transitionDuration] = '0ms';
                    };

                if (!isNaN(absX) && absX != 0) {
                    if (absX > width) {
                        absX = width;
                    }
                    if (absX >= 80 || (e.timeStamp - this.touchCoords.timeStamp < 200)) {
                        if (this.touchCoords.startX > this.touchCoords.stopX) {
                            transIndex = context.next;
                        } else {
                            transIndex = context.prev;
                        }
                    } else {
                        transIndex = context.active;
                    }

                    setHide(this.touchCoords.startX > this.touchCoords.stopX ? prevEl : nextEl);
                    this.to(transIndex, false, true);
                    delete this.touchCoords;
                }
            }

            this.iscroll && this.iscroll.enable();
            this.autoPlay && this.run();
        },

        /**
         * 销毁
         */
        destroy: function() {
            this.stop();
            if (this.prevEl) {
                this.prevEl.removeEventListener('click', this.onPrevClickProxy, false);
                this.prevEl = null;
            }
            if (this.nextEl) {
                this.nextEl.removeEventListener('click', this.onNextClickProxy, false);
                this.nextEl = null;
            }
            this.indicators = null;
            if (pointerEnabled) {
                this.el.removeEventListener('MSPointerDown', this.onTouchStartProxy, false);
                this.el.removeEventListener('MSPointerMove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('MSPointerUp', this.onTouchEndProxy, false);
            } else {
                this.el.removeEventListener('touchstart', this.onTouchStartProxy, false);
                this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
                this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
            }
            this.el = this.items = null;
            this.iscroll = null;
        }
    };

    function prefixStyle(style) {
        if ( vendor === '' ) return style;
        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vendor + style;
    }

    dummyStyle = null;

    if (typeof define === "function" && (define.amd || seajs)) {
        define('carouselwidget', [], function() {
            return Carousel;
        });
    }

    window.Carousel = Carousel;

})(window);