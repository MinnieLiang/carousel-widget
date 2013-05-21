Carousel Widget
=================

Carousel Widget for Mobile 是一个专为移动设备定制的 Carousel 组件，不依赖于任何第三方类库，其功能类似 [Bootstrap 的 Carousel](http://twitter.github.io/bootstrap/javascript.html#carousel) 组件，但在此之上增加了 touch 功能，可以使用手指触碰移动设备屏幕，实现滑动切换效果。

## DEMO

例子参见：http://maxzhang.github.io/carousel-widget/dev/examples/carousel.html

## API Documentation

### Configs

String : targetSelector 目标元素选取器，items 默认为 targetSelector 的子元素，可以设置itemSelector，查找指定items子元素

String : itemSelector 子元素选取器

String : prevSelector 向前按钮选取器

String : nextSelector 向后按钮选取器

String : indicatorSelector 指示器选取器

String : indicatorCls 当前activeIndex指示器样式

Number/String : width 组件宽度，默认'auto'

Number : activeIndex 初始显示的元素index，默认0

Boolean : autoPlay true自动切换，默认true

Number : interval 循环滚动间隔时间，单位ms，默认3000

Number : transitionDuration 动画持续时间，单位ms，默认400

iScroll : iscroll 关联一个iScroll对象，Carousel Widget 为水平方向滚动，如果被嵌套在一个垂直滚动的 iScroll 组件中，会导致触摸滚动 Carousel的水平滚动 与 iScroll的垂直滚动相冲突。为了解决这个问题，在水平滑动时，禁用iScroll的垂直滚动，水平滑动结束之后，再启用iScroll。

Function : beforeSlide 开始切换之前回调函数，返回值为false时，终止本次slide操作

Function : onSlide 切换完成回调函数

### Methods

prev() 向前滚动一个

next() 向后滚动一个

to( [Number]toIndex, [Boolean]silent) 滚动到指定index，silent为true时切换无动画效果

setWidth( [Number]width ) 设置组件宽度

start() 开始自动切换

stop() 停止自动滚动

destroy() 销毁组件
