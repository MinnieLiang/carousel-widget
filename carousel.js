/**
 * 自动切换组件
 *
 * 例子参见：http://maxzhang.github.io/carousel-widget/dev/examples/carousel.html
 *
 * @version 1.0
 */
(function(root, factory) {
    if (typeof define === "function" && (define.amd || define.cmd)) {
        define('carouselwidget', [], function() {
            return factory(root);
        });
    } else {
        factory(root);
    }
}(window, function(window) {
    var emtpyFn = function() {},
        proxy = function(fn, scope) {
            return function() {
                return fn.apply(scope, arguments);
            };
        };

    var Carousel = function(config) {
        config = config || {};
        for (var o in config) {
            this[o] = config[o];
        }

        this.el = document.querySelector(this.targetSelector);
        this.items = this.itemSelector ? this.el.querySelectorAll(this.itemSelector): this.el.children;
        this.items = Array.prototype.slice.call(this.items, 0);

        var width = this.width === 'auto' ? this.el.offsetWidth : this.width;
        var active = this.activeIndex;
        this.items.forEach(function(item, i) {
            item.style.position = 'relative';
            item.style.top = '0px';
            item.style.left = (active == i ? 0 : -width) + 'px';
            item.style.display = active == i ? 'block' : 'none';
            item.style.webkitTransitionProperty = 'left';
            item.style.transitionProperty = 'left';
            item.style.webkitTransitionTimingFunction = 'ease';
            item.style.transitionTimingFunction = 'ease';
            item.style.webkitTransitionDuration = '0ms';
            item.style.transitionDuration = '0ms';
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
        this.el.addEventListener('touchstart', this.onTouchStartProxy, false);

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
         * @cfg {Number} interval 循环滚动间隔时间，单位毫秒，默认3000
         */
        interval: 3000,

        /**
         * @cfg {iScroll} iscroll 关联一个iscroll对象
         * Carousel Widget 为水平方向滚动，如果被嵌套在一个垂直滚动的 iScroll 组件中，会导致触摸滚动 Carousel的水平滚动 与 iScroll的垂直滚动相冲突，
         * 为了解决这个问题，在水平滑动时，禁用iScroll的垂直滚动，水平滑动结束之后，再启用iScroll。
         */

        /**
         * 开始切换之前回调函数，返回值为false时，终止本次slide操作
         */
        beforeSlide: emtpyFn,

        /**
         * 切换完成回调函数
         */
        onSlide: emtpyFn,

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
                        activeEl.style.left = '0px';
                        toEl = this.items[toIndex];
                        toEl.style.left = (slideRight ? -activeEl.offsetWidth : activeEl.offsetWidth) + 'px';
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
                offsetLeft = activeEl.offsetLeft,
                offsetWidth = activeEl.offsetWidth,
                baseDuration = 600,
                duration,
                context,
                activeSlideHandler,
                toSlideHandler,
                clearHandler = function(el, fn) {
                    el.removeEventListener('webkitTransitionEnd', fn, false);
                    el.removeEventListener('transitionend', fn, false);
                };

            me.sliding = true;

            if (active == toIndex) {
                context = me.getContext();
                slideRight = offsetLeft < 0;
                toEl = me.items[slideRight ? context.next : context.prev];
                duration = silent ? '0ms' : (Math.round((Math.abs(offsetLeft) / offsetWidth) * baseDuration) + 'ms');
                activeSlideHandler = function() {
                    clearHandler(activeEl, activeSlideHandler);
                    activeEl.style.position = 'relative';
                    activeEl.style.webkitTransitionDuration = '0ms';
                    activeEl.style.transitionDuration = '0ms';
                };
                toSlideHandler = function() {
                    clearTimeout(me.resetSlideTimeout);
                    delete me.resetSlideTimeout;
                    clearHandler(toEl, toSlideHandler);
                    toEl.style.display = 'none';
                    toEl.style.position = 'relative';
                    toEl.style.webkitTransitionDuration = '0ms';
                    toEl.style.transitionDuration = '0ms';
                    if (me.indicators && me.indicatorCls) {
                        me.indicators[lastActive].classList.remove(me.indicatorCls);
                        me.indicators[me.activeIndex].classList.add(me.indicatorCls);
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
                    activeEl.style.webkitTransitionDuration = '0ms';
                    activeEl.style.transitionDuration = '0ms';
                };
                toSlideHandler = function() {
                    clearTimeout(me.resetSlideTimeout);
                    delete me.resetSlideTimeout;
                    clearHandler(toEl, toSlideHandler);
                    toEl.style.position = 'relative';
                    toEl.style.webkitTransitionDuration = '0ms';
                    toEl.style.transitionDuration = '0ms';
                    if (me.indicators && me.indicatorCls) {
                        me.indicators[lastActive].classList.remove(me.indicatorCls);
                        me.indicators[me.activeIndex].classList.add(me.indicatorCls);
                    }
                    me.sliding = false;
                    me.onSlide(me.activeIndex);
                };
                duration = silent ? '0ms' : (Math.round((offsetWidth - (Math.abs(offsetLeft))) / offsetWidth * baseDuration) + 'ms');
            }

            clearHandler(activeEl, activeSlideHandler);
            clearHandler(toEl, toSlideHandler);
            if (!silent) {
                activeEl.addEventListener('webkitTransitionEnd', activeSlideHandler, false);
                activeEl.addEventListener('transitionend', activeSlideHandler, false);
                toEl.addEventListener('webkitTransitionEnd', toSlideHandler, false);
                toEl.addEventListener('transitionend', toSlideHandler, false);
            }
            activeEl.style.webkitTransitionDuration = duration;
            activeEl.style.transitionDuration = duration;
            activeEl.style.display = 'block';
            toEl.style.position = 'absolute';
            toEl.style.display = 'block';
            toEl.style.webkitTransitionDuration = duration;
            toEl.style.transitionDuration = duration;

            setTimeout(function() {
                if (active == toIndex) {
                    activeEl.style.left = '0px';
                    toEl.style.left = (slideRight ? offsetWidth : -offsetWidth) + 'px';
                } else {
                    activeEl.style.left = (slideRight ? offsetWidth : -offsetWidth) + 'px';
                    toEl.style.left = '0px';
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
            }, 100);
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
            this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
            this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
            this.el.addEventListener('touchmove', this.onTouchMoveProxy, false);
            this.el.addEventListener('touchend', this.onTouchEndProxy, false);
            delete this.horizontal;

            var context = this.getContext(),
                activeEl = this.items[context.active],
                width = activeEl.offsetWidth,
                setShow = function(el, left, isActive) {
                    el.style.position = isActive ? 'relative' : 'absolute';
                    el.style.left = left + 'px';
                    el.style.display = 'block';
                    el.style.webkitTransitionDuration = '0ms';
                    el.style.transitionDuration = '0ms';
                };
            setShow(this.items[context.prev], -width);
            setShow(this.items[context.next], width);
            setShow(activeEl, 0, true);

            this.touchCoords = {};
            this.touchCoords.startX = e.touches[0].pageX;
            this.touchCoords.startY = e.touches[0].pageY;
            this.touchCoords.timeStamp = e.timeStamp;
        },

        // private
        onTouchMove: function(e) {
            if (!this.touchCoords || this.sliding) {
                return;
            }

            this.touchCoords.stopX = e.touches[0].pageX;
            this.touchCoords.stopY = e.touches[0].pageY;

            var offsetX = this.touchCoords.startX - this.touchCoords.stopX,
                absX = Math.abs(offsetX),
                absY = Math.abs(this.touchCoords.startY - this.touchCoords.stopY);

            if (typeof this.horizontal !== 'undefined') {
                if (offsetX != 0) {
                    e.preventDefault();
                }
                if (this.iscroll && this.iscroll.enabled) {
                    this.iscroll.disable();
                }
            } else {
                if (absX > absY) {
                    this.horizontal = true;
                    if (offsetX != 0) {
                        e.preventDefault();
                    }
                    if (this.iscroll && this.iscroll.enabled) {
                        this.iscroll.disable();
                    }
                } else {
                    delete this.touchCoords;
                    this.horizontal = false;
                    return;
                }
            }

            var context = this.getContext(),
                activeEl = this.items[context.active],
                prevEl = this.items[context.prev],
                nextEl = this.items[context.next],
                width = activeEl.offsetWidth;

            if (absX < width) {
                prevEl.style.left = (-width - offsetX) + 'px';
                activeEl.style.left = -offsetX + 'px';
                nextEl.style.left = (width - offsetX) + 'px';
            }
        },

        // private
        onTouchEnd: function(e) {
            this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
            this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
            this.iscroll && this.iscroll.enable();
            this.autoPlay && this.run();

            if (!this.touchCoords || this.sliding) {
                return;
            }

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
                    el.style.left = -width + 'px';
                    el.style.webkitTransitionDuration = '0ms';
                    el.style.transitionDuration = '0ms';
                };

            if (absX != 0) {
                if (absX > width) {
                    absX = width;
                }
                if (absX >= 100 || (e.timeStamp - this.touchCoords.timeStamp < 200)) {
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
            this.el.removeEventListener('touchstart', this.onTouchStartProxy, false);
            this.el.removeEventListener('touchmove', this.onTouchMoveProxy, false);
            this.el.removeEventListener('touchend', this.onTouchEndProxy, false);
            this.el = this.items = null;
            this.iscroll = null;
        }
    };

    window.Carousel = Carousel;
    return Carousel;
}));