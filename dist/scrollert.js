(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node/CommonJS
		module.exports = function( root, jQuery ) {
			if ( jQuery === undefined ) {
				// require('jQuery') returns a factory that requires window to
				// build a jQuery instance, we normalize how we use modules
				// that require this pattern but the window provided is a noop
				// if it's defined (how jquery works)
				if ( typeof window !== 'undefined' ) {
					jQuery = require('jquery');
				}
				else {
					jQuery = require('jquery')(root);
				}
			}
			factory(jQuery);
			return jQuery;
		};
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function (jQuery) {
	var Scrollert;
(function (Scrollert) {
    var ScrollbarDimensions = (function () {
        function ScrollbarDimensions() {
        }
        ScrollbarDimensions.calculate = function (containerTrail) {
            var rootElm, curElm, prevElm;
            if (containerTrail.length <= 0) {
                throw new TypeError("Invalid container trail specified for scrollbar dimensions calculation");
            }
            for (var _i = 0, containerTrail_1 = containerTrail; _i < containerTrail_1.length; _i++) {
                var container = containerTrail_1[_i];
                curElm = document.createElement(container.tagName);
                curElm.className = container.classes;
                (prevElm) ? prevElm.appendChild(curElm) : rootElm = curElm;
                prevElm = curElm;
            }
            rootElm.style.position = "fixed";
            rootElm.style.top = "0";
            rootElm.style.left = "0";
            rootElm.style.visibility = "hidden";
            rootElm.style.width = "200px";
            rootElm.style.height = "200px";
            curElm.style.overflow = "hidden";
            document.body.appendChild(rootElm);
            var withoutScrollbars = curElm.clientWidth;
            curElm.style.overflow = "scroll";
            var withScrollbars = curElm.clientWidth;
            document.body.removeChild(rootElm);
            return withoutScrollbars - withScrollbars;
        };
        return ScrollbarDimensions;
    }());
    Scrollert.ScrollbarDimensions = ScrollbarDimensions;
})(Scrollert || (Scrollert = {}));

/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollbarDimensions.ts" />
var Scrollert;
(function (Scrollert) {
    var Plugin = (function () {
        function Plugin(containerElm, options) {
            var _this = this;
            this.containerElm = containerElm;
            this.options = {
                axes: ['x', 'y'],
                preventOuterScroll: false,
                cssPrefix: 'scrollert',
                eventNamespace: 'scrollert',
                contentSelector: null
            };
            this.scrollbarElms = {
                x: null,
                y: null
            };
            this.scrollCache = {
                x: null,
                y: null
            };
            this.onScrollOnScrollbar = function (axis, scrollbarElm, trackElm, event) {
                var delta = event.originalEvent['delta' + axis.toUpperCase()];
                if (delta && (event.target === scrollbarElm.get(0) || event.target === trackElm.get(0))) {
                    event.preventDefault();
                    _this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](_this.getValue(_this.contentElm, 'scrollPos', axis) + delta);
                }
            };
            this.onPreventOuterScroll = function (event) {
                var originalEvent = event.originalEvent;
                for (var _i = 0, _a = _this.options.axes; _i < _a.length; _i++) {
                    var axis = _a[_i];
                    var delta = originalEvent['delta' + axis.toUpperCase()];
                    if (delta !== 0)
                        _this.preventOuterScroll(axis, (delta < 0) ? "heen" : "weer", event);
                }
            };
            this.onKeyDown = function (event) {
                if (document.activeElement !== _this.contentElm[0]) {
                    return;
                }
                if ([37, 38, 33, 36].indexOf(event.which) !== -1) {
                    _this.preventOuterScroll([38, 33, 36].indexOf(event.which) !== -1 ? "y" : "x", "heen", event);
                }
                else if ([39, 40, 32, 34, 35].indexOf(event.which) !== -1) {
                    _this.preventOuterScroll([40, 35, 36, 34, 32].indexOf(event.which) !== -1 ? "y" : "x", "weer", event);
                }
            };
            this.offsetContentElmScrollbars = function (force) {
                if (force === void 0) { force = false; }
                var scrollbarDimension = Scrollert.ScrollbarDimensions.calculate([
                    { tagName: _this.containerElm.prop('tagName'), classes: _this.containerElm.prop('class') },
                    { tagName: _this.contentElm.prop('tagName'), classes: _this.contentElm.prop('class') }
                ]), correctForFloatingScrollbar = false;
                if (scrollbarDimension === 0 && _this.hasVisibleFloatingScrollbar() === true) {
                    correctForFloatingScrollbar = true;
                    scrollbarDimension = 20;
                }
                var cssValues = {};
                if (_this.options.axes.indexOf('y') !== -1) {
                    cssValues['overflow-y'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['right'] = -scrollbarDimension + "px";
                    if (correctForFloatingScrollbar)
                        cssValues['padding-right'] = false;
                }
                if (_this.options.axes.indexOf('x') !== -1) {
                    cssValues['overflow-x'] = "scroll";
                    if (scrollbarDimension)
                        cssValues['bottom'] = -scrollbarDimension + "px";
                    if (correctForFloatingScrollbar)
                        cssValues['padding-bottom'] = false;
                }
                if (!_this.originalCssValues)
                    _this.originalCssValues = _this.contentElm.css(Object.keys(cssValues));
                if (correctForFloatingScrollbar && cssValues['padding-right'] === false) {
                    cssValues['padding-right'] = (parseInt(_this.originalCssValues['padding-right']) + scrollbarDimension) + "px";
                }
                if (correctForFloatingScrollbar && cssValues['padding-bottom'] === false) {
                    cssValues['padding-bottom'] = (parseInt(_this.originalCssValues['padding-bottom']) + scrollbarDimension) + "px";
                }
                _this.contentElm.css(cssValues);
            };
            this.dinges = 0;
            this.onScrollbarMousedown = function (axis, scrollbarElm, trackElm, event) {
                if (event.target === scrollbarElm[0]) {
                    _this.scrollToClickedPosition(axis, event);
                    _this.trackMousedown(axis, scrollbarElm, event); //Also start dragging the track to do a correction drag after clicking the scrollbar
                }
                else if (event.target === trackElm[0]) {
                    _this.trackMousedown(axis, scrollbarElm, event);
                }
            };
            this.options = jQuery.extend({}, this.options, options);
            this.options.eventNamespace = this.options.eventNamespace + ++Plugin.eventNamespaceId;
            this.contentElm = this.containerElm.children(this.options.contentSelector || '.' + this.options.cssPrefix + '-content');
            this.offsetContentElmScrollbars();
            this.update();
            /*
             * @todo The keydown outer scroll prevention is not working yet.
             */
            if (this.options.preventOuterScroll === true) {
                // Prevent outer scroll on key down
                //this.contentElm.on('keydown.' + this.options.eventNamespace, this.onKeyDown);
                this.contentElm.on('wheel.' + this.options.eventNamespace, this.onPreventOuterScroll);
            }
            //There could be a zoom change. Zoom is almost not indistinguishable from resize events. So on window resize, recalculate contentElm offet
            jQuery(window).on('resize.' + this.options.eventNamespace, this.offsetContentElmScrollbars.bind(this, true));
        }
        Plugin.prototype.update = function () {
            var repositionTrack = false;
            for (var _i = 0, _a = this.options.axes; _i < _a.length; _i++) {
                var axis = _a[_i];
                this.updateAxis(axis);
                if (this.getValue(this.contentElm, "scrollPos", axis) !== 0)
                    repositionTrack = true;
            }
            //If we start on a scroll position
            if (repositionTrack === true) {
                this.contentElm.trigger('scroll.' + this.options.eventNamespace);
            }
        };
        Plugin.prototype.addScrollbar = function (axis, containerElm) {
            var scrollbarElm, trackElm;
            containerElm.append(scrollbarElm = jQuery('<div />').addClass(this.options.cssPrefix + '-scrollbar' + ' '
                + this.options.cssPrefix + '-scrollbar-' + axis).append(trackElm = jQuery('<div />').addClass(this.options.cssPrefix + '-track')));
            scrollbarElm.on('wheel.' + axis + "." + this.options.eventNamespace, this.onScrollOnScrollbar.bind(this, axis, scrollbarElm, trackElm));
            return {
                scrollbar: scrollbarElm,
                track: trackElm
            };
        };
        ;
        Plugin.prototype.preventOuterScroll = function (axis, direction, event) {
            var scrollPos = this.getValue(this.contentElm, "scrollPos", axis);
            switch (direction) {
                case "heen":
                    if (scrollPos <= 0)
                        event.preventDefault();
                    break;
                case "weer":
                    var scrollSize = this.getValue(this.contentElm, "scrollSize", axis), clientSize = this.getValue(this.contentElm, "clientSize", axis);
                    if (scrollSize - scrollPos === clientSize)
                        event.preventDefault();
                    break;
            }
        };
        /**
         * Scrollbars by default in OSX don't take up space but are floating. We must correct for this, but how do we
         * know if we must correct? Webkit based browsers have the pseudo css-selector ::-webkit-scrollbar by which the
         * problem is solved. For all other engines another strategy must
         *
         * @returns {boolean}
         */
        Plugin.prototype.hasVisibleFloatingScrollbar = function () {
            return window.navigator.userAgent.match(/AppleWebKit/i) === null;
        };
        Plugin.prototype.updateAxis = function (axis) {
            var hasScroll = this.hasScroll(axis);
            if (hasScroll === true && this.scrollbarElms[axis] === null) {
                this.containerElm.addClass(this.options.cssPrefix + "-axis-" + axis);
                var elms = this.addScrollbar(axis, this.containerElm), scrollbarElm = elms.scrollbar, trackElm = elms.track;
                scrollbarElm.on('mousedown.' + axis + '.' + this.options.eventNamespace, this.onScrollbarMousedown.bind(this, axis, scrollbarElm, trackElm));
                this.contentElm.on('scroll.' + axis + '.' + this.options.eventNamespace, this.onScroll.bind(this, axis, scrollbarElm, trackElm));
                this.scrollbarElms[axis] = elms;
            }
            else if (hasScroll === false && this.scrollbarElms[axis] !== null) {
                this.containerElm.removeClass(this.options.cssPrefix + "-axis-" + axis);
                this.scrollbarElms[axis].scrollbar.remove();
                this.scrollbarElms[axis] = null;
                this.contentElm.off('.' + axis + "." + this.options.eventNamespace);
            }
            //Resize track according to current scroll dimensions
            if (this.scrollbarElms[axis] !== null) {
                this.resizeTrack(axis, this.scrollbarElms[axis].scrollbar, this.scrollbarElms[axis].track);
            }
        };
        Plugin.prototype.getValue = function (elm, property, axis) {
            switch (property) {
                case 'size':
                    return elm[axis === 'y' ? 'outerHeight' : 'outerWidth']();
                case 'clientSize':
                    return elm[0][axis === 'y' ? 'clientHeight' : 'clientWidth'];
                case 'scrollSize':
                    return elm[0][axis === 'y' ? 'scrollHeight' : 'scrollWidth'];
                case 'scrollPos':
                    return elm[axis === 'y' ? 'scrollTop' : 'scrollLeft']();
            }
        };
        Plugin.prototype.hasScroll = function (axis) {
            var contentSize = this.getValue(this.contentElm, 'size', axis), contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
            return contentSize < contentScrollSize;
        };
        Plugin.prototype.resizeTrack = function (axis, scrollbarElm, trackElm) {
            var contentSize = this.getValue(this.contentElm, 'size', axis), contentScrollSize = this.getValue(this.contentElm, 'scrollSize', axis);
            if (contentSize < contentScrollSize) {
                scrollbarElm.removeClass('hidden');
                var scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
                trackElm.css(axis === 'y' ? 'height' : 'width', scrollbarDimension * (contentSize / contentScrollSize));
            }
            else {
                scrollbarElm.addClass('hidden');
            }
        };
        Plugin.prototype.positionTrack = function (axis, scrollbarElm, trackElm) {
            var relTrackPos = this.getValue(this.contentElm, 'scrollPos', axis)
                / (this.getValue(this.contentElm, 'scrollSize', axis) - this.getValue(this.contentElm, 'size', axis)), trackDimension = this.getValue(trackElm, 'size', axis), scrollbarDimension = this.getValue(scrollbarElm, 'size', axis);
            trackElm.css(axis === 'y' ? 'top' : 'left', (scrollbarDimension - trackDimension) * relTrackPos);
        };
        Plugin.prototype.onScroll = function (axis, scrollbarElm, trackElm, event) {
            // window.cancelAnimationFrame(this.rafId);
            if (++this.dinges % 2 !== 0) {
                return;
            }
            if (this.scrollCache[axis] !== (this.scrollCache[axis] = this.getValue(this.contentElm, 'scrollPos', axis))) {
                // this.rafId = window.requestAnimationFrame(() => {
                this.positionTrack(axis, scrollbarElm, trackElm);
            }
        };
        Plugin.prototype.trackMousedown = function (axis, scrollbarElm, event) {
            var _this = this;
            event.preventDefault();
            var origin = {
                startPos: event[axis === 'y' ? 'pageY' : 'pageX'],
                startScroll: this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](),
                scrollFactor: this.getValue(this.contentElm, 'scrollSize', axis) / this.getValue(scrollbarElm, 'size', axis) //How big if the scrollbar element compared to the content scroll
            }, $window = jQuery(window), moveHandler = this.onTrackDrag.bind(this, axis, origin);
            this.containerElm.addClass(this.options.cssPrefix + "-trackdrag-" + axis);
            $window
                .on('mousemove.' + this.options.eventNamespace, moveHandler)
                .one('mouseup.' + this.options.eventNamespace, function () {
                $window.off('mousemove', moveHandler);
                _this.containerElm.removeClass(_this.options.cssPrefix + "-trackdrag-" + axis);
            });
        };
        Plugin.prototype.onTrackDrag = function (axis, origin, event) {
            event.preventDefault();
            this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](origin.startScroll + (event[axis === 'y' ? 'pageY' : 'pageX'] - origin.startPos) * origin.scrollFactor);
        };
        Plugin.prototype.scrollToClickedPosition = function (axis, event) {
            event.preventDefault();
            var offset = event[(axis === 'y') ? 'offsetY' : 'offsetX'];
            if (offset <= 10)
                offset = 0; //Little tweak to make it easier to go back to top
            this.contentElm[axis === 'y' ? 'scrollTop' : 'scrollLeft'](this.getValue(this.contentElm, 'scrollSize', axis) * (offset / this.getValue(jQuery(event.target), 'size', axis)));
        };
        Plugin.prototype.destroy = function () {
            this.contentElm.off('.' + this.options.eventNamespace);
            jQuery(window).off('.' + this.options.eventNamespace);
            for (var axis in this.scrollbarElms) {
                if (this.scrollbarElms[axis] && this.scrollbarElms[axis].scrollbar instanceof jQuery === true) {
                    this.scrollbarElms[axis].scrollbar.remove();
                    this.scrollbarElms[axis] = null;
                }
            }
            this.contentElm.css(this.originalCssValues);
        };
        Plugin.NAME = 'scrollert';
        Plugin.eventNamespaceId = 0;
        return Plugin;
    }());
    Scrollert.Plugin = Plugin;
})(Scrollert || (Scrollert = {}));

/// <reference path="../typings/index.d.ts" />
/// <reference path="ScrollertPlugin.ts" />
jQuery.fn[Scrollert.Plugin.NAME] = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var action = typeof args[0] === "string" ? args[0] : "init", options = (typeof args[1] === "object")
        ? args[1]
        : (typeof args[0] === "object") ? args[0] : {};
    return this.each(function () {
        var elm = jQuery(this), key = "plugin-" + Scrollert.Plugin.NAME, plugin = elm.data(key);
        if (action === "init" && plugin instanceof Scrollert.Plugin === false) {
            elm.data(key, plugin = new Scrollert.Plugin(jQuery(this), options));
        }
        else if (plugin instanceof Scrollert.Plugin === false) {
            throw new TypeError("The Scrollert plugin is not yet initialized");
        }
        switch (action) {
            case "init":
                return;
            case "update":
                plugin.update();
                break;
            case "destroy":
                plugin.destroy();
                elm.removeData(key);
                break;
            default:
                throw new TypeError("Invalid Scrollert action " + action);
        }
    });
};


	return jQuery;
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNjcm9sbGJhckRpbWVuc2lvbnMudHMiLCJTY3JvbGxlcnRQbHVnaW4udHMiLCJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FpRGY7QUFqREQsV0FBTyxTQUFTLEVBQ2hCLENBQUM7SUFPRztRQUFBO1FBd0NBLENBQUM7UUF0Q2lCLDZCQUFTLEdBQXZCLFVBQXdCLGNBQW9DO1lBRXhELElBQUksT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7WUFFN0IsRUFBRSxDQUFBLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FDOUIsQ0FBQztnQkFDRyxNQUFNLElBQUksU0FBUyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUVELEdBQUcsQ0FBQSxDQUFrQixVQUFjLEVBQWQsaUNBQWMsRUFBZCw0QkFBYyxFQUFkLElBQWMsQ0FBQztnQkFBaEMsSUFBSSxTQUFTLHVCQUFBO2dCQUViLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUVyQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBRTthQUNyQjtZQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztZQUNwQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7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QUFDLElBQUksRUFDdkMsTUFBTSxHQUFvQixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTVDLEVBQUUsQ0FBQSxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxZQUFZLFNBQVMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQ3JFLENBQUM7WUFDRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFBLENBQUMsTUFBTSxZQUFZLFNBQVMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQ3JELENBQUM7WUFDRyxNQUFNLElBQUksU0FBUyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELE1BQU0sQ0FBQSxDQUFDLE1BQU0sQ0FBQyxDQUNkLENBQUM7WUFDRyxLQUFLLE1BQU07Z0JBQ1AsTUFBTSxDQUFDO1lBQ1gsS0FBSyxRQUFRO2dCQUNULE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsS0FBSyxDQUFDO1lBQ1YsS0FBSyxTQUFTO2dCQUNWLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsS0FBSyxDQUFDO1lBQ1Y7Z0JBQ0ksTUFBTSxJQUFJLFNBQVMsQ0FBQywyQkFBMkIsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNsRSxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxDQUFDLENBQUMiLCJmaWxlIjoic2Nyb2xsZXJ0LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIFNjcm9sbGVydFxue1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsYmFyRGltZW5zaW9uc1xuICAgIHtcbiAgICAgICAgdGFnTmFtZTpzdHJpbmc7XG4gICAgICAgIGNsYXNzZXM6c3RyaW5nO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBTY3JvbGxiYXJEaW1lbnNpb25zXG4gICAge1xuICAgICAgICBwdWJsaWMgc3RhdGljIGNhbGN1bGF0ZShjb250YWluZXJUcmFpbDpTY3JvbGxiYXJEaW1lbnNpb25zW10pOm51bWJlclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcm9vdEVsbSwgY3VyRWxtLCBwcmV2RWxtO1xuXG4gICAgICAgICAgICBpZihjb250YWluZXJUcmFpbC5sZW5ndGggPD0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjb250YWluZXIgdHJhaWwgc3BlY2lmaWVkIGZvciBzY3JvbGxiYXIgZGltZW5zaW9ucyBjYWxjdWxhdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yKGxldCBjb250YWluZXIgb2YgY29udGFpbmVyVHJhaWwpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VyRWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChjb250YWluZXIudGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgY3VyRWxtLmNsYXNzTmFtZSA9IGNvbnRhaW5lci5jbGFzc2VzO1xuXG4gICAgICAgICAgICAgICAgKHByZXZFbG0pID8gcHJldkVsbS5hcHBlbmRDaGlsZChjdXJFbG0gKSA6IHJvb3RFbG0gPSBjdXJFbG07XG4gICAgICAgICAgICAgICAgcHJldkVsbSA9IGN1ckVsbSA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnRvcCA9IFwiMFwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS5sZWZ0ID0gXCIwXCI7XG4gICAgICAgICAgICByb290RWxtLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgcm9vdEVsbS5zdHlsZS53aWR0aCA9IFwiMjAwcHhcIjtcbiAgICAgICAgICAgIHJvb3RFbG0uc3R5bGUuaGVpZ2h0ID0gXCIyMDBweFwiO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3RFbG0pO1xuICAgICAgICAgICAgbGV0IHdpdGhvdXRTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBjdXJFbG0uc3R5bGUub3ZlcmZsb3cgPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgbGV0IHdpdGhTY3JvbGxiYXJzID0gY3VyRWxtLmNsaWVudFdpZHRoO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHJvb3RFbG0pO1xuXG4gICAgICAgICAgICByZXR1cm4gd2l0aG91dFNjcm9sbGJhcnMgLSB3aXRoU2Nyb2xsYmFycztcblxuICAgICAgICB9XG4gICAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIlNjcm9sbGJhckRpbWVuc2lvbnMudHNcIiAvPlxuXG5tb2R1bGUgU2Nyb2xsZXJ0IHtcblxuICAgIGV4cG9ydCB0eXBlIEF4aXNUeXBlID0gXCJ4XCIgfCBcInlcIjtcbiAgICB0eXBlIE5vcm1hbGl6ZWRTY3JvbGxQcm9wZXJ0eSA9IFwic2l6ZVwiIHwgXCJzY3JvbGxTaXplXCIgfCBcInNjcm9sbFBvc1wiIHwgXCJjbGllbnRTaXplXCI7XG4gICAgdHlwZSBEaXJlY3Rpb25UeXBlID0gXCJoZWVuXCIgfCBcIndlZXJcIjsgLy9BS0EgIGZvcnRoIGFuZCBiYWNrIChodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PVg3VjA5VG1zdS0wKVxuXG4gICAgaW50ZXJmYWNlIFNjcm9sbGJhckNvbnRhaW5lclxuICAgIHtcbiAgICAgICAgc2Nyb2xsYmFyOkpRdWVyeTtcbiAgICAgICAgdHJhY2s6SlF1ZXJ5O1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUGx1Z2luT3B0aW9uc1xuICAgIHtcbiAgICAgICAgYXhlcz86QXhpc1R5cGVbXTtcbiAgICAgICAgcHJldmVudE91dGVyU2Nyb2xsPzpib29sZWFuO1xuICAgICAgICBjc3NQcmVmaXg/OnN0cmluZztcbiAgICAgICAgZXZlbnROYW1lc3BhY2U/OnN0cmluZztcbiAgICAgICAgY29udGVudFNlbGVjdG9yPzpzdHJpbmc7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIFBsdWdpblxuICAgIHtcbiAgICAgICAgcHVibGljIHN0YXRpYyBOQU1FOnN0cmluZyA9ICdzY3JvbGxlcnQnO1xuXG4gICAgICAgIHByaXZhdGUgb3B0aW9uczpQbHVnaW5PcHRpb25zID0ge1xuICAgICAgICAgICAgYXhlczogWyd4JywgJ3knXSxcbiAgICAgICAgICAgIHByZXZlbnRPdXRlclNjcm9sbDogZmFsc2UsXG4gICAgICAgICAgICBjc3NQcmVmaXg6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgZXZlbnROYW1lc3BhY2U6ICdzY3JvbGxlcnQnLFxuICAgICAgICAgICAgY29udGVudFNlbGVjdG9yOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBjb250ZW50RWxtOkpRdWVyeTtcblxuICAgICAgICBwcml2YXRlIHN0YXRpYyBldmVudE5hbWVzcGFjZUlkID0gMDtcblxuICAgICAgICBwcml2YXRlIHNjcm9sbGJhckVsbXM6eyBbaWQ6IHN0cmluZ10gOiBTY3JvbGxiYXJDb250YWluZXIgfSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHtcbiAgICAgICAgICAgIHg6IG51bGwsXG4gICAgICAgICAgICB5OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvcmlnaW5hbENzc1ZhbHVlczp7IFtpZDogc3RyaW5nXSA6IHN0cmluZzsgfTtcblxuICAgICAgICBwcml2YXRlIHJhZklkOm51bWJlcjtcblxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lckVsbTpKUXVlcnksIG9wdGlvbnM/OlBsdWdpbk9wdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IGpRdWVyeS5leHRlbmQoIHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcblxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlID0gdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlICsgKytQbHVnaW4uZXZlbnROYW1lc3BhY2VJZDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbSA9IHRoaXMuY29udGFpbmVyRWxtLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5jb250ZW50U2VsZWN0b3IgfHwgJy4nICsgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArJy1jb250ZW50Jyk7XG5cbiAgICAgICAgICAgIHRoaXMub2Zmc2V0Q29udGVudEVsbVNjcm9sbGJhcnMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBAdG9kbyBUaGUga2V5ZG93biBvdXRlciBzY3JvbGwgcHJldmVudGlvbiBpcyBub3Qgd29ya2luZyB5ZXQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5wcmV2ZW50T3V0ZXJTY3JvbGwgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gUHJldmVudCBvdXRlciBzY3JvbGwgb24ga2V5IGRvd25cbiAgICAgICAgICAgICAgICAvL3RoaXMuY29udGVudEVsbS5vbigna2V5ZG93bi4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCB0aGlzLm9uS2V5RG93bik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub24oJ3doZWVsLicgKyB0aGlzLm9wdGlvbnMuZXZlbnROYW1lc3BhY2UsIHRoaXMub25QcmV2ZW50T3V0ZXJTY3JvbGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1RoZXJlIGNvdWxkIGJlIGEgem9vbSBjaGFuZ2UuIFpvb20gaXMgYWxtb3N0IG5vdCBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIHJlc2l6ZSBldmVudHMuIFNvIG9uIHdpbmRvdyByZXNpemUsIHJlY2FsY3VsYXRlIGNvbnRlbnRFbG0gb2ZmZXRcbiAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycy5iaW5kKHRoaXMsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyB1cGRhdGUoKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVwb3NpdGlvblRyYWNrID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvcihsZXQgYXhpcyBvZiB0aGlzLm9wdGlvbnMuYXhlcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUF4aXMoYXhpcyk7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsUG9zXCIsIGF4aXMpICE9PSAwKSByZXBvc2l0aW9uVHJhY2sgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL0lmIHdlIHN0YXJ0IG9uIGEgc2Nyb2xsIHBvc2l0aW9uXG4gICAgICAgICAgICBpZihyZXBvc2l0aW9uVHJhY2sgPT09IHRydWUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50RWxtLnRyaWdnZXIoJ3Njcm9sbC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYWRkU2Nyb2xsYmFyKGF4aXM6QXhpc1R5cGUsIGNvbnRhaW5lckVsbTpKUXVlcnkpOlNjcm9sbGJhckNvbnRhaW5lclxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbTtcblxuICAgICAgICAgICAgY29udGFpbmVyRWxtLmFwcGVuZChcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0gPSBqUXVlcnkoJzxkaXYgLz4nKS5hZGRDbGFzcyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctc2Nyb2xsYmFyJyArICcgJ1xuICAgICAgICAgICAgICAgICAgICArIHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyAnLXNjcm9sbGJhci0nICsgYXhpc1xuICAgICAgICAgICAgICAgICkuYXBwZW5kKHRyYWNrRWxtID0galF1ZXJ5KCc8ZGl2IC8+JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArICctdHJhY2snKSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHNjcm9sbGJhckVsbS5vbignd2hlZWwuJyArIGF4aXMgKyBcIi5cIiArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbE9uU2Nyb2xsYmFyLmJpbmQodGhpcywgYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSkpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhcjogc2Nyb2xsYmFyRWxtLFxuICAgICAgICAgICAgICAgIHRyYWNrOiB0cmFja0VsbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcml2YXRlIG9uU2Nyb2xsT25TY3JvbGxiYXIgPSAoYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5LCBldmVudDpKUXVlcnlNb3VzZUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBkZWx0YTpudW1iZXIgPSAoPFdoZWVsRXZlbnQ+ZXZlbnQub3JpZ2luYWxFdmVudClbJ2RlbHRhJyArIGF4aXMudG9VcHBlckNhc2UoKV07XG5cbiAgICAgICAgICAgIGlmKGRlbHRhICYmIChldmVudC50YXJnZXQgPT09IHNjcm9sbGJhckVsbS5nZXQoMCkgfHwgZXZlbnQudGFyZ2V0ID09PSB0cmFja0VsbS5nZXQoMCkpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0neScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsUG9zJywgYXhpcykgKyBkZWx0YVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBvblByZXZlbnRPdXRlclNjcm9sbCA9IChldmVudDpKUXVlcnlNb3VzZUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBvcmlnaW5hbEV2ZW50OldoZWVsRXZlbnQgPSA8V2hlZWxFdmVudD5ldmVudC5vcmlnaW5hbEV2ZW50O1xuXG4gICAgICAgICAgICBmb3IobGV0IGF4aXMgb2YgdGhpcy5vcHRpb25zLmF4ZXMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGV0IGRlbHRhID0gb3JpZ2luYWxFdmVudFsnZGVsdGEnICsgYXhpcy50b1VwcGVyQ2FzZSgpXTtcbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgIT09IDApIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKGF4aXMsIChkZWx0YSA8IDApID8gXCJoZWVuXCIgOiBcIndlZXJcIiwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgb25LZXlEb3duID0gKGV2ZW50OkpRdWVyeUtleUV2ZW50T2JqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRoaXMuY29udGVudEVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKFszNywzOCwzMywzNl0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gaGVlblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbMzgsMzMsMzZdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiaGVlblwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKFszOSw0MCwzMiwzNCwzNV0uaW5kZXhPZihldmVudC53aGljaCkgIT09IC0xICkgLy8gd2VlclxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudE91dGVyU2Nyb2xsKFxuICAgICAgICAgICAgICAgICAgICBbNDAsMzUsMzYsMzQsMzJdLmluZGV4T2YoZXZlbnQud2hpY2gpICE9PSAtMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2VlclwiLFxuICAgICAgICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcHJpdmF0ZSBwcmV2ZW50T3V0ZXJTY3JvbGwoYXhpczpBeGlzVHlwZSwgZGlyZWN0aW9uOkRpcmVjdGlvblR5cGUsIGV2ZW50OkJhc2VKUXVlcnlFdmVudE9iamVjdClcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IHNjcm9sbFBvcyA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCBcInNjcm9sbFBvc1wiLCBheGlzKTtcbiAgICAgICAgICAgIHN3aXRjaChkaXJlY3Rpb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImhlZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgaWYoc2Nyb2xsUG9zIDw9IDApIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ3ZWVyXCI6XG4gICAgICAgICAgICAgICAgICAgIGxldCBzY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sIFwic2Nyb2xsU2l6ZVwiLCBheGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgXCJjbGllbnRTaXplXCIsIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjcm9sbFNpemUgLSBzY3JvbGxQb3MgPT09IGNsaWVudFNpemUpIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvZmZzZXRDb250ZW50RWxtU2Nyb2xsYmFycyA9IChmb3JjZTpib29sZWFuID0gZmFsc2UpID0+IHtcblxuICAgICAgICAgICAgbGV0IHNjcm9sbGJhckRpbWVuc2lvbiA9IFNjcm9sbGJhckRpbWVuc2lvbnMuY2FsY3VsYXRlKFtcbiAgICAgICAgICAgICAgICAgICAgeyB0YWdOYW1lOiB0aGlzLmNvbnRhaW5lckVsbS5wcm9wKCd0YWdOYW1lJyksIGNsYXNzZXM6IHRoaXMuY29udGFpbmVyRWxtLnByb3AoJ2NsYXNzJykgfSxcbiAgICAgICAgICAgICAgICAgICAgeyB0YWdOYW1lOiB0aGlzLmNvbnRlbnRFbG0ucHJvcCgndGFnTmFtZScpLCBjbGFzc2VzOiB0aGlzLmNvbnRlbnRFbG0ucHJvcCgnY2xhc3MnKSB9XG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICAgY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbiA9PT0gMCAmJiB0aGlzLmhhc1Zpc2libGVGbG9hdGluZ1Njcm9sbGJhcigpID09PSB0cnVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RGb3JGbG9hdGluZ1Njcm9sbGJhciA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2Nyb2xsYmFyRGltZW5zaW9uID0gMjA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBjc3NWYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5heGVzLmluZGV4T2YoJ3knKSAhPT0gLTEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydvdmVyZmxvdy15J10gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbikgY3NzVmFsdWVzWydyaWdodCddID0gLXNjcm9sbGJhckRpbWVuc2lvbiArIFwicHhcIjtcbiAgICAgICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIpIGNzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9ucy5heGVzLmluZGV4T2YoJ3gnKSAhPT0gLTEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3NzVmFsdWVzWydvdmVyZmxvdy14J10gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGlmKHNjcm9sbGJhckRpbWVuc2lvbikgY3NzVmFsdWVzWydib3R0b20nXSA9IC1zY3JvbGxiYXJEaW1lbnNpb24gKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgaWYoY29ycmVjdEZvckZsb2F0aW5nU2Nyb2xsYmFyKSBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIXRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpIHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMgPSB0aGlzLmNvbnRlbnRFbG0uY3NzKE9iamVjdC5rZXlzKGNzc1ZhbHVlcykpO1xuXG4gICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgJiYgY3NzVmFsdWVzWydwYWRkaW5nLXJpZ2h0J10gPT09IGZhbHNlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNzc1ZhbHVlc1sncGFkZGluZy1yaWdodCddID0gKHBhcnNlSW50KHRoaXMub3JpZ2luYWxDc3NWYWx1ZXNbJ3BhZGRpbmctcmlnaHQnXSkgKyBzY3JvbGxiYXJEaW1lbnNpb24pICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjb3JyZWN0Rm9yRmxvYXRpbmdTY3JvbGxiYXIgJiYgY3NzVmFsdWVzWydwYWRkaW5nLWJvdHRvbSddID09PSBmYWxzZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjc3NWYWx1ZXNbJ3BhZGRpbmctYm90dG9tJ10gPSAocGFyc2VJbnQodGhpcy5vcmlnaW5hbENzc1ZhbHVlc1sncGFkZGluZy1ib3R0b20nXSkgKyBzY3JvbGxiYXJEaW1lbnNpb24pICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKGNzc1ZhbHVlcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbGJhcnMgYnkgZGVmYXVsdCBpbiBPU1ggZG9uJ3QgdGFrZSB1cCBzcGFjZSBidXQgYXJlIGZsb2F0aW5nLiBXZSBtdXN0IGNvcnJlY3QgZm9yIHRoaXMsIGJ1dCBob3cgZG8gd2VcbiAgICAgICAgICoga25vdyBpZiB3ZSBtdXN0IGNvcnJlY3Q/IFdlYmtpdCBiYXNlZCBicm93c2VycyBoYXZlIHRoZSBwc2V1ZG8gY3NzLXNlbGVjdG9yIDo6LXdlYmtpdC1zY3JvbGxiYXIgYnkgd2hpY2ggdGhlXG4gICAgICAgICAqIHByb2JsZW0gaXMgc29sdmVkLiBGb3IgYWxsIG90aGVyIGVuZ2luZXMgYW5vdGhlciBzdHJhdGVneSBtdXN0XG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgcHJpdmF0ZSBoYXNWaXNpYmxlRmxvYXRpbmdTY3JvbGxiYXIoKTpib29sZWFuXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQXBwbGVXZWJLaXQvaSkgPT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHVwZGF0ZUF4aXMoYXhpczpBeGlzVHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgbGV0IGhhc1Njcm9sbCA9IHRoaXMuaGFzU2Nyb2xsKGF4aXMpO1xuICAgICAgICAgICAgaWYoaGFzU2Nyb2xsID09PSB0cnVlICYmIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9PT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsbS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY3NzUHJlZml4ICsgXCItYXhpcy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGVsbXMgPSB0aGlzLmFkZFNjcm9sbGJhcihheGlzLCB0aGlzLmNvbnRhaW5lckVsbSksXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbSA9IGVsbXMuc2Nyb2xsYmFyLFxuICAgICAgICAgICAgICAgICAgICB0cmFja0VsbSA9IGVsbXMudHJhY2s7XG5cbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0ub24oJ21vdXNlZG93bi4nICsgYXhpcyArICcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbGJhck1vdXNlZG93bi5iaW5kKHRoaXMsIGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub24oJ3Njcm9sbC4nICsgYXhpcyArICcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgdGhpcy5vblNjcm9sbC5iaW5kKHRoaXMsIGF4aXMsIHNjcm9sbGJhckVsbSwgdHJhY2tFbG0pKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IGVsbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGhhc1Njcm9sbCA9PT0gZmFsc2UgJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxtLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5jc3NQcmVmaXggKyBcIi1heGlzLVwiICsgYXhpcyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10uc2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIGF4aXMgKyBcIi5cIiArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1Jlc2l6ZSB0cmFjayBhY2NvcmRpbmcgdG8gY3VycmVudCBzY3JvbGwgZGltZW5zaW9uc1xuICAgICAgICAgICAgaWYodGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVHJhY2soYXhpcywgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciwgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnRyYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0VmFsdWUoZWxtOkpRdWVyeSwgcHJvcGVydHk6Tm9ybWFsaXplZFNjcm9sbFByb3BlcnR5LCBheGlzOkF4aXNUeXBlKTpudW1iZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3dpdGNoKHByb3BlcnR5KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NpemUnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxtW2F4aXMgPT09ICd5JyA/ICdvdXRlckhlaWdodCcgOiAnb3V0ZXJXaWR0aCddKCk7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2xpZW50U2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bMF1bYXhpcyA9PT0gJ3knID8gJ2NsaWVudEhlaWdodCcgOiAnY2xpZW50V2lkdGgnXTtcbiAgICAgICAgICAgICAgICBjYXNlICdzY3JvbGxTaXplJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbVswXVtheGlzID09PSAneScgPyAnc2Nyb2xsSGVpZ2h0JyA6ICdzY3JvbGxXaWR0aCddO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Njcm9sbFBvcyc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGhhc1Njcm9sbChheGlzOkF4aXNUeXBlKTpib29sZWFuXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50U2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2l6ZScsIGF4aXMpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRTY3JvbGxTaXplID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxTaXplJywgYXhpcyk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVzaXplVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgY29udGVudFNpemUgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50U2Nyb2xsU2l6ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpO1xuICAgIFxuICAgICAgICAgICAgaWYoY29udGVudFNpemUgPCBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJFbG0ucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgIFxuICAgICAgICAgICAgICAgIGxldCBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgICAgICB0cmFja0VsbS5jc3MoYXhpcyA9PT0gJ3knID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gKiAoY29udGVudFNpemUgLyBjb250ZW50U2Nyb2xsU2l6ZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNjcm9sbGJhckVsbS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHBvc2l0aW9uVHJhY2soYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5KVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgcmVsVHJhY2tQb3MgPSB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFBvcycsIGF4aXMpXG4gICAgICAgICAgICAgICAgICAgIC8gKHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpIC0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzaXplJywgYXhpcykpLFxuICAgICAgICAgICAgICAgIHRyYWNrRGltZW5zaW9uID0gdGhpcy5nZXRWYWx1ZSh0cmFja0VsbSwgJ3NpemUnLCBheGlzKSxcbiAgICAgICAgICAgICAgICBzY3JvbGxiYXJEaW1lbnNpb24gPSB0aGlzLmdldFZhbHVlKHNjcm9sbGJhckVsbSwgJ3NpemUnLCBheGlzKTtcbiAgICBcbiAgICAgICAgICAgIHRyYWNrRWxtLmNzcyhheGlzID09PSAneScgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAoc2Nyb2xsYmFyRGltZW5zaW9uIC0gdHJhY2tEaW1lbnNpb24pICogcmVsVHJhY2tQb3NcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGRpbmdlcyA9IDA7XG4gICAgICAgIHByaXZhdGUgb25TY3JvbGwoYXhpczpBeGlzVHlwZSwgc2Nyb2xsYmFyRWxtOkpRdWVyeSwgdHJhY2tFbG06SlF1ZXJ5LCBldmVudDpNb3VzZUV2ZW50KVxuICAgICAgICB7XG4gICAgICAgICAgICAvLyB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICAgICAgICAgIGlmKCsrdGhpcy5kaW5nZXMgJSAyICE9PSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXMuc2Nyb2xsQ2FjaGVbYXhpc10gIT09ICh0aGlzLnNjcm9sbENhY2hlW2F4aXNdID0gdGhpcy5nZXRWYWx1ZSh0aGlzLmNvbnRlbnRFbG0sICdzY3JvbGxQb3MnLCBheGlzKSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc2l0aW9uVHJhY2soYXhpcywgc2Nyb2xsYmFyRWxtLCB0cmFja0VsbSk7XG4gICAgICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgb25TY3JvbGxiYXJNb3VzZWRvd24gPSAoYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCB0cmFja0VsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudCkgPT4ge1xuXG4gICAgICAgICAgICBpZihldmVudC50YXJnZXQgPT09IHNjcm9sbGJhckVsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpOyAvL0Fsc28gc3RhcnQgZHJhZ2dpbmcgdGhlIHRyYWNrIHRvIGRvIGEgY29ycmVjdGlvbiBkcmFnIGFmdGVyIGNsaWNraW5nIHRoZSBzY3JvbGxiYXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoZXZlbnQudGFyZ2V0ID09PSB0cmFja0VsbVswXSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyYWNrTW91c2Vkb3duKGF4aXMsIHNjcm9sbGJhckVsbSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByaXZhdGUgdHJhY2tNb3VzZWRvd24oYXhpczogQXhpc1R5cGUsIHNjcm9sbGJhckVsbTogSlF1ZXJ5LCBldmVudDogTW91c2VFdmVudClcbiAgICAgICAge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRQb3M6IGV2ZW50W2F4aXMgPT09ICd5JyA/ICdwYWdlWScgOiAncGFnZVgnXSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRTY3JvbGw6IHRoaXMuY29udGVudEVsbVtheGlzID09PSAneScgPyAnc2Nyb2xsVG9wJyA6ICdzY3JvbGxMZWZ0J10oKSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRmFjdG9yOiB0aGlzLmdldFZhbHVlKHRoaXMuY29udGVudEVsbSwgJ3Njcm9sbFNpemUnLCBheGlzKSAvIHRoaXMuZ2V0VmFsdWUoc2Nyb2xsYmFyRWxtLCAnc2l6ZScsIGF4aXMpIC8vSG93IGJpZyBpZiB0aGUgc2Nyb2xsYmFyIGVsZW1lbnQgY29tcGFyZWQgdG8gdGhlIGNvbnRlbnQgc2Nyb2xsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAkd2luZG93ID0galF1ZXJ5KHdpbmRvdyksXG4gICAgICAgICAgICAgICAgbW92ZUhhbmRsZXIgPSB0aGlzLm9uVHJhY2tEcmFnLmJpbmQodGhpcywgYXhpcywgb3JpZ2luKTtcblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuXG4gICAgICAgICAgICAkd2luZG93XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSwgbW92ZUhhbmRsZXIpXG4gICAgICAgICAgICAgICAgLm9uZSgnbW91c2V1cC4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlLCAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5vZmYoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbG0ucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNzc1ByZWZpeCArIFwiLXRyYWNrZHJhZy1cIiArIGF4aXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBvblRyYWNrRHJhZyhheGlzOkF4aXNUeXBlLCBvcmlnaW4sIGV2ZW50Ok1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudEVsbVtheGlzID09PSd5JyA/ICdzY3JvbGxUb3AnIDogJ3Njcm9sbExlZnQnXShcbiAgICAgICAgICAgICAgICBvcmlnaW4uc3RhcnRTY3JvbGwgKyAoZXZlbnRbYXhpcyA9PT0gJ3knID8gJ3BhZ2VZJyA6ICdwYWdlWCddIC0gb3JpZ2luLnN0YXJ0UG9zKSAqIG9yaWdpbi5zY3JvbGxGYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHNjcm9sbFRvQ2xpY2tlZFBvc2l0aW9uKGF4aXM6QXhpc1R5cGUsIGV2ZW50Ok1vdXNlRXZlbnQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gZXZlbnRbKGF4aXMgPT09ICd5JykgPyAnb2Zmc2V0WSc6ICdvZmZzZXRYJ107XG4gICAgXG4gICAgICAgICAgICBpZihvZmZzZXQgPD0gMTApIG9mZnNldCA9IDA7IC8vTGl0dGxlIHR3ZWFrIHRvIG1ha2UgaXQgZWFzaWVyIHRvIGdvIGJhY2sgdG8gdG9wXG4gICAgXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG1bYXhpcyA9PT0gJ3knID8gJ3Njcm9sbFRvcCcgOiAnc2Nyb2xsTGVmdCddKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWUodGhpcy5jb250ZW50RWxtLCAnc2Nyb2xsU2l6ZScsIGF4aXMpICogKG9mZnNldCAvIHRoaXMuZ2V0VmFsdWUoalF1ZXJ5KGV2ZW50LnRhcmdldCksICdzaXplJywgYXhpcykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGRlc3Ryb3koKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0ub2ZmKCcuJyArIHRoaXMub3B0aW9ucy5ldmVudE5hbWVzcGFjZSk7XG4gICAgICAgICAgICBqUXVlcnkod2luZG93KS5vZmYoJy4nICsgdGhpcy5vcHRpb25zLmV2ZW50TmFtZXNwYWNlKTtcblxuICAgICAgICAgICAgZm9yKGxldCBheGlzIGluIHRoaXMuc2Nyb2xsYmFyRWxtcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNjcm9sbGJhckVsbXNbYXhpc10gJiYgdGhpcy5zY3JvbGxiYXJFbG1zW2F4aXNdLnNjcm9sbGJhciBpbnN0YW5jZW9mIGpRdWVyeSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXS5zY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsYmFyRWxtc1theGlzXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbG0uY3NzKHRoaXMub3JpZ2luYWxDc3NWYWx1ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU2Nyb2xsZXJ0UGx1Z2luLnRzXCIgLz5cblxualF1ZXJ5LmZuW1Njcm9sbGVydC5QbHVnaW4uTkFNRV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cbiAgICBsZXQgYWN0aW9uOnN0cmluZyA9IHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiICA/IGFyZ3NbMF0gOiBcImluaXRcIixcbiAgICAgICAgb3B0aW9uczpTY3JvbGxlcnQuUGx1Z2luT3B0aW9ucyA9ICh0eXBlb2YgYXJnc1sxXSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgID8gYXJnc1sxXVxuICAgICAgICAgICAgOiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpID8gYXJnc1swXSA6IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgICAgICBsZXQgZWxtID0galF1ZXJ5KHRoaXMpLFxuICAgICAgICAgICAga2V5ID0gXCJwbHVnaW4tXCIgKyBTY3JvbGxlcnQuUGx1Z2luLk5BTUUsXG4gICAgICAgICAgICBwbHVnaW46U2Nyb2xsZXJ0LlBsdWdpbiA9IGVsbS5kYXRhKGtleSk7XG5cbiAgICAgICAgaWYoYWN0aW9uID09PSBcImluaXRcIiAmJiBwbHVnaW4gaW5zdGFuY2VvZiBTY3JvbGxlcnQuUGx1Z2luID09PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgZWxtLmRhdGEoa2V5LCBwbHVnaW4gPSBuZXcgU2Nyb2xsZXJ0LlBsdWdpbihqUXVlcnkodGhpcyksIG9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHBsdWdpbiBpbnN0YW5jZW9mIFNjcm9sbGVydC5QbHVnaW4gPT09IGZhbHNlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFNjcm9sbGVydCBwbHVnaW4gaXMgbm90IHlldCBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaChhY3Rpb24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbml0XCI6IC8vRG9sY2UgZmFyIG5pZW50ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjpcbiAgICAgICAgICAgICAgICBwbHVnaW4udXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVzdHJveVwiOlxuICAgICAgICAgICAgICAgIHBsdWdpbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZURhdGEoa2V5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgU2Nyb2xsZXJ0IGFjdGlvbiBcIiArIGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxufTsiXX0=
