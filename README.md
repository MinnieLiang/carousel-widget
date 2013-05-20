Carousel Widget
=================

Carousel Widget for Mobile 是一个专为移动设备定制的 Carousel 组件，不依赖于任何第三方类库，其功能类似 Bootstrap 的 [Carousel](http://twitter.github.io/bootstrap/javascript.html#carousel) 组件，但在此之上增加了 touch 功能，可以使用手指触碰移动屏幕，实现滑动切换效果。

### DEMO ###

例子参见：[http://maxzhang.github.io/carousel-widget/dev/examples/carousel.html]

### API Documentation ###

#### Configs ####

{String} targetSelector 目标元素选取器

{String} itemSelector 子元素选取器

{String} prevSelector 向前按钮选取器

{String} nextSelector 向后按钮选取器

{String} indicatorSelector 指示器选取器

{String} indicatorCls 当前指示器样式

{Number/String} width 组件宽度，默认'auto'

{Number} activeIndex 初始显示的元素，默认0

{Boolean} autoPlay true自动开始切换，默认true

{Number} interval 循环滚动间隔时间，单位毫秒，默认3000

{iScroll} iscroll 关联一个iscroll对象，carousel为左右方向滚动，iScroll为上下方向滚动，如果carousel组件应用在一个iScroll中，为了防止两个组件滚动事件冲突，将两个对象关联起来

{Function} beforeSlide 开始切换之前回调函数

{Function} onSlide 开始切换之前回调函数

#### Methods ####

prev()

next()

to( [Number]toIndex, [Boolean]silent)

setWidth( [Number]width )

start()

stop()

destroy()


