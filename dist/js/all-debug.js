/**
 * Created by chenlonghui@cyou-inc.com on 2015/6/25.
 */

$(function(){
    'use strict';
    /*
     * 制作人答题
     * */
    var Answer = {
        REMAINING_TIME     : $.cookie('REMAINING_TIME') - 0 || 30 * 60 * 1000,//剩余时间
        POST_URL           : 'http://act.17173.com/2015/05/yxhhr0709/index.php',//提交地址
        EXPIRES            : 1,//缓存过期时间
        STARTTIME          : $.cookie('STARTTIME') - 0 || 0,//开始答题时间
        inter              : null,//定时器
        papers             : {},
        countRightAnswer   : 0,//正确答题数
        questionHtmlArr    : [],//题目dom数组
        questionWrap       : null,//问题容器
        answerInfo         : {//答题人信息
            name        : null,//姓名
            qq          : null,
            phone       : null,
            email       : null,
            questionInfo: {
                paperId    : null,//题目套号
                questionsId: $.cookie('QUESTIONS') ? $.cookie('QUESTIONS').split('---') : 0 || [],//问题id
                answers    : {} //答案
            },
            takeTime    : 0,  //答题用时
            score       : 0  //得分
        },
        init               : function () {
            var _self = this;
            var currentTime = new Date().getTime();
            var paperId = _self.getRandomPaperId(4);
            if ( $.cookie('REMAINING_TIME') && $.cookie('PAPERID') ) {
                $.cookie('NAME') && $('#name').val(decodeURI($.cookie('NAME')));
                $.cookie('PHONE') && $('#phone').val($.cookie('PHONE'));
                $.cookie('EMAIL') && $('#email').val($.cookie('EMAIL'));
                $.cookie('QQ') && $('#qq').val($.cookie('QQ'));
                if ( $.cookie('STARTTIME') ) {//关闭浏览器重新打开，关闭期间计时继续
                    _self.REMAINING_TIME = 30 * 60 * 1000 - currentTime + ($.cookie('STARTTIME') - 0);
                }
                _self.renderQuestionsList($.cookie('PAPERID'));
                $('#qArea').show();
                _self.bindEvent(true);
                $('#start').off('click');
            } else {
                _self.renderQuestionsList(paperId);
                _self.bindEvent();
            }
        },
        //事件
        bindEvent          : function (isStart) {
            var _self = this;
            var answerNum = 0;
            _self.inter && clearInterval(_self.inter);
            isStart && (_self.inter = setInterval(function () {
                _self.countDown();
            }, 1000));

            if ( isStart ) {
                window.onbeforeunload = function (e) {//关闭选项卡（含刷新）
                    e = e || window.event;
                    if ( _self.REMAINING_TIME > 0 ) {
                        _self.storeAnswerInfo();
                        //e.returnValue = '答题还未结束，确定要离开网页？';
                    }
                };
            }
            $('#start').off('click');
            $('#submit').off('click');
            $('#start').on('click', function (e) {
                _self.startListener(e, $(this));
            });
            $('#submit').on('click', function (e) {
                _self.submitListener(e, $(this));
            });
        },
        //开始答题
        startListener      : function (e, btn) {
            var _self = this;
            var name = $('#name').val();
            var phone = $('#phone').val();
            var email = $('#email').val();
            var qq = $('#qq').val();
            e.preventDefault();
            btn.off('click');
            if ( $('#qArea').css('display') === 'block' ) {
                return false;
            }
            _self.initStartTime();//首次点击“开始”保存当前时间戳
            if ( name === '' || !/^([\u4e00-\u9fa5]){2,7}$/.test(name) ) {//姓名
                _self.msgBox('alert', {
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u59d3\u540d\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( phone === '' || !/^(13[0-9]|15[0|1|2|3|5|6|7|8|9]|18[0-9]|17[6|7|8])\d{8}$/.test(phone) ) {
                _self.msgBox('alert', { //手机号
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u624b\u673a\u53f7\u7801\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( email === '' || !/^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(email) ) {
                _self.msgBox('alert', { //邮箱
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u90ae\u7bb1\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( qq === '' || !/^\d{5,10}$/.test(qq) ) {//QQ
                _self.msgBox('alert', {
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786eQQ\u53f7\u7801\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else {
                /*param: do=updateUserInfo
                 name:姓名
                 email:邮箱
                 mobile:手机
                 qq:QQ*/
                //$('html,body').animate({scrollTop: $('.time-bar').offset().top}, 500);
                _self.bindEvent(true);
                $.ajax({
                    url     : _self.POST_URL + '?do=updateUserInfo',
                    data    : {
                        name  : encodeURI(name),
                        email : email,
                        mobile: phone,
                        qq    : qq
                    },
                    type    : 'post',
                    dataType: 'json'
                }).done(function (result) {
                    _self.answerInfo.name = name;
                    _self.answerInfo.phone = phone;
                    _self.answerInfo.email = email;
                    _self.answerInfo.qq = qq;
                    $.cookie('NAME', name, {expires: _self.EXPIRES});
                    $.cookie('PHONE', phone, {expires: _self.EXPIRES});
                    $.cookie('EMAIL', email, {expires: _self.EXPIRES});
                    $.cookie('QQ', qq, {expires: _self.EXPIRES});
                    if ( result.status === 3 ) {
                        _self.msgBox('alert', {
                            title  : '抱歉！',
                            content: '\u60a8\u5df2\u7ecf\u53c2\u52a0\u8fc7\u7b54\u9898\uff0c\u611f\u8c22\u60a8\u7684\u652f\u6301\uff01'
                        });
                        btn.on('click', function (e) {
                            _self.startListener(e, $(this));
                        });
                        return false;
                    }
                    $('#qArea').show();
                }).fail(function (result) {
                    /*_self.msgBox('alert', {
                     title  : '抱歉！',
                     content: '\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u6838\u5bf9\u4fe1\u606f\u540e\u91cd\u65b0\u63d0\u4ea4~~'
                     });*/
                    btn.on('click', function (e) {
                        _self.startListener(e, $(this));
                    });
                    /*$('#qArea').show();//debug
                     _self.answerInfo.name = name;
                     _self.answerInfo.phone = phone;
                     _self.answerInfo.email = email;
                     _self.answerInfo.qq = qq;
                     $.cookie('NAME', encodeURI(name), {expires: _self.EXPIRES});
                     $.cookie('PHONE', phone, {expires: _self.EXPIRES});
                     $.cookie('EMAIL', email, {expires: _self.EXPIRES});
                     $.cookie('QQ', qq, {expires: _self.EXPIRES});*/
                });
            }
        },
        //提交
        submitListener     : function (e, btn) {
            var _self = this;
            var _answerNum = _self.getAnswerNum();
            _self.storeAnswerInfo();
            e.preventDefault();
            btn.off('click');
            var _score;
            var _takeTime;
            _score = _self.countScore();//计分
            _takeTime = _self.getTakeTime();//用时
            _self.answerInfo.takeTime = _takeTime;
            _self.answerInfo.score = _score;
            if ( _answerNum === 40 || _self.REMAINING_TIME <= 0 ) {//完整答题
                if ( _score >= 85 ) {
                    _self.msgBox('alert', {
                        title  : '答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                        content: '我们将会把您的资料推荐给知名的游戏厂商，由厂商安排人员回访，谢谢！'
                    });
                } else {
                    _self.msgBox('alert', {
                        title  : '答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                        content: '抱歉，您的知识积累暂时还无法达到游戏制作人的要求，感谢您的参与，谢谢！'
                    });
                }
                _self.submitAnswers();//提交
            }
            else {
                _self.loadPandora(function () {
                    pandora.use(['confirm'], function (Confirm) {
                        new Confirm({
                            //importStyle: true,
                            title  : '您好！',
                            content: '您还有' + (40 - _answerNum) + '题未回答，是否确认提交?'
                        }).on({
                                submit: function () {
                                    _self.submitAnswers();//提交
                                    if ( _score >= 85 ) {
                                        _self.msgBox('alert', {
                                            title  : '答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                                            content: '我们将会把您的资料推荐给知名的游戏厂商，由厂商安排人员回访，谢谢！'
                                        });
                                    } else {
                                        _self.msgBox('alert', {
                                            title  : '答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                                            content: '抱歉，您的知识积累暂时还无法达到游戏制作人的要求，感谢您的参与，谢谢！'
                                        });
                                    }
                                },
                                cancel: function () {
                                    btn.on('click', function (e) {
                                        _self.submitListener(e, $(this));
                                    });
                                }
                            });
                    });
                });
            }
        },
        storeAnswerInfo    : function () {
            var _self = this;
            var answerNum;
            $.cookie('PAPERID', _self.answerInfo.questionInfo.paperId, {expires: _self.EXPIRES});
            if ( !$.cookie('QUESTIONS') ) {
                $.cookie('QUESTIONS', _self.answerInfo.questionInfo.questionsId.join('---'), {expires: _self.EXPIRES});
            }
            answerNum = _self.getAnswerNum();
            answerNum && $.cookie('ANSWERS', JSON.stringify(_self.answerInfo.questionInfo.answers), {expires: _self.EXPIRES});
        },
        //获取答题数
        getAnswerNum       : function () {
            var _self = this;
            var _wrap = _self.questionWrap;
            var _countRightAnswer = 0;
            var _countAnswer = 0;
            var _questionId = '';
            var _selectItem = '';//答案选项
            _wrap.find('.item').each(function (index) {
                var _showNum = index + 1;
                _questionId = $(this).data('questionid');
                $(this).find('input').each(function () {
                    var $this = $(this);
                    if ( $this.prop('checked') ) {
                        _selectItem = $this.val();
                        if ( $this.data('goal') === 1 ) {
                            _countRightAnswer++;
                        }
                        _countAnswer++;
                        //保存答案
                        _self.answerInfo.questionInfo.answers[_questionId] = {
                            showNum     : _showNum,
                            select      : _selectItem,
                            isSelectTrue: $this.data('goal') ? true : false
                        };
                        return false;//break
                    }
                });
            });
            _self.countRightAnswer = _countRightAnswer;//保存正确答题数
            return _countAnswer;
        },
        //计算得分
        countScore         : function () {
            var _self = this;
            return 2.5 * (_self.countRightAnswer - 0);
        },
        //获取答题用时
        getTakeTime        : function () {
            var _self = this;
            var _time = 30 * 60 * 1000 - ($.cookie('REMAINING_TIME') - 0);
            var _m = Math.floor(_time / 1000 / 60 % 60);
            var _s = Math.floor(_time / 1000 % 60);
            _m < 10 ? _m = '0' + _m : _m;
            _s < 10 ? _s = '0' + _s : _s;
            return _m + ':' + _s;
        },
        //提交答案
        submitAnswers      : function () {
            var _self = this;
            /*param: do=save
             result:答案
             time:花费时间
             score: 分数
             paperid:题套id*/
            $.ajax({
                url     : _self.POST_URL + '?do=save',
                data    : {
                    result : _self.answerInfo.questionInfo.answers,
                    time   : _self.answerInfo.takeTime,
                    score  : _self.answerInfo.score,
                    paperid: _self.answerInfo.questionInfo.paperId
                },
                type    : 'post',
                dataType: 'json'
            }).done(function (result) {
                $('#submit').on('click', function (e) {//提交成功，重新注册按钮事件——提示
                    _self.answeredTips();
                });
            }).fail(function (result) {
                /*_self.msgBox('alert', {
                 title  : '',
                 content: '233~~答案迷失在二次元中，提交失败，请重新提交~~'
                 });*/
                if ( _self.REMAINING_TIME > 0 ) {
                    $('#submit').on('click', function (e) {
                        _self.submitListener(e, $(this));
                    });
                } else { //超时自动提交
                    $('#submit').on('click', function (e) {
                        _self.answeredTips();
                    });
                }
            });
        },
        //提交过题目提示
        answeredTips       : function () {
            var _self = this;
            _self.msgBox('alert', {
                title  : '抱歉！',
                content: '你已经参与过答题，感谢您的参与，谢谢！'
            });
        },
        //倒计时
        countDown          : function () {
            var _self = this;
            var m = 0;
            var s = 0;
            var _score = 0;
            if ( _self.REMAINING_TIME >= 0 ) {
                m = Math.floor(_self.REMAINING_TIME / 1000 / 60 % 60);
                s = Math.floor(_self.REMAINING_TIME / 1000 % 60);
                s < 10 ? s = '0' + s : s;
            } else {
                _score = _self.countScore();//计分
                if ( _score >= 85 ) {
                    _self.msgBox('alert', {
                        title  : '时间到，答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                        content: '我们将会把您的资料推荐给知名的游戏厂商，由厂商安排人员回访，谢谢！'
                    });
                } else {
                    _self.msgBox('alert', {
                        title  : '时间到，答题结束，您得到了<b style="color:red;">' + _score + '</b>分,',
                        content: '抱歉，您的知识积累暂时还无法达到游戏制作人的要求，感谢您的参与，谢谢！'
                    });
                }
                clearInterval(_self.inter, 1000);
                _self.REMAINING_TIME = 0;
                _self.answerInfo.takeTime = _self.getTakeTime();//用时;
                _self.answerInfo.score = _score;
                _self.submitAnswers();
                $('#submit').off('click');
                m = s = '00';
            }
            $('#t_m').text(m + ':');
            $('#t_s').text(s);
            _self.REMAINING_TIME -= 1000;
            $.cookie('REMAINING_TIME', _self.REMAINING_TIME, {expires: _self.EXPIRES});
        },
        /**
         数组元素乱序
         @method resortArr
         @param Arr {Array} 目标乱序元素数组
         @return {Array} Retrun 乱序数组
         **/
        resortArr          : function (Arr) {
            if ( !Arr.length ) {
                return false;
            }
            if ( !Arr instanceof Array ) {
                return false;
            }
            var resultArr = [], k = '';
            for ( k in Arr ) {
                if ( Arr.hasOwnProperty(k) ) {
                    resultArr.push(Arr[k]);
                }
            }
            resultArr.sort(function () {
                return 0.5 - Math.random();
            });
            return resultArr;
        },
        renderQuestionsList: function (paperId) {
            var _self = this;
            var _paperId = '';
            var _items = '';
            var _questionsId = '';
            $('.list-question').each(function (index) {
                var $this = $(this);
                _paperId = $this.attr('data-paperid');
                if ( _paperId === paperId ) {
                    if ( $.cookie('PAPERID') ) {//答题中途关闭网页
                        _items = $this.find('.item');
                        _questionsId = $.cookie('QUESTIONS').split('---');
                        for ( var i = 0; i < _questionsId.length; i++ ) {
                            var item = _items[_questionsId[i].substr(1) - 0 - 1];
                            _self.questionHtmlArr.push($('<p>').append($(item).clone()).html());
                        }
                        //$.cookie('ANSWERS') && _self.fillAnswers();
                        _self.answerInfo.questionInfo.paperId = $.cookie('PAPERID');//保存题套
                        _self.questionWrap = $this;
                        _self.show($this);
                        return false;
                    } else {
                        $this.find('.item').each(function (index) {
                            _self.questionHtmlArr.push($('<p>').append($(this).clone()).html());
                        });
                        _self.questionHtmlArr = _self.resortArr(_self.questionHtmlArr);
                        $this.html('');
                        _self.questionWrap = $this;
                        _self.show($this);
                        _self.answerInfo.questionInfo.paperId = paperId;//保存题套
                        return false;
                    }
                }
            });
        },
        //填充答案
        fillAnswers        : function () {
            var _self = this;
            var _questionid = '';
            var _curAnswer = '';
            var _paperId = '';
            var answerObj = JSON.parse($.cookie('ANSWERS'));
            $('.list-question').each(function (index) {
                var $this = $(this);
                _paperId = $this.attr('data-paperid');
                if ( _paperId === $.cookie('PAPERID') ) {
                    $this.find('.item').each(function (index) {
                        _questionid = $(this).data('questionid');
                        if ( answerObj[_questionid] !== undefined ) {
                            _curAnswer = answerObj[_questionid].select;
                            $(this).find('input').each(function (index) {
                                var $this = $(this);
                                if ( $this.val() === _curAnswer ) {
                                    $this.attr('checked', 'checked');
                                } else {
                                    $this.attr('checked', false);
                                }
                            });
                        }
                    });
                }
            });
        },
        //重排显示
        show               : function (wrap) {
            var _self = this;
            var _html = '';
            var _questionId = '';
            var item = '';
            var itemhtml = '';
            var showNum = '';
            for ( var i = 0; i < _self.questionHtmlArr.length; i++ ) {
                showNum = (i + 1 < 10) ? '0' + (i + 1) : i + 1;
                item = $(_self.questionHtmlArr[i]);
                item.find('.num').text(showNum);
                itemhtml = $('<p>').append(item.clone()).html();
                _html += itemhtml;
                _questionId = item.data('questionid');
                _self.answerInfo.questionInfo.questionsId.push(_questionId);
                _self.questionHtmlArr[i] = itemhtml;
            }
            wrap.html(_html);
            wrap.show();
            $.cookie('ANSWERS') && _self.fillAnswers();
            $('.list-question .item:odd').addClass('item-odd');
            var timeT = $('.time-bar').offset().top;
            $(window).scroll(function () {
                if ( $(window).scrollTop() > 0 ) {
                    $('.go-top').css('display', 'block');
                } else {
                    $('.go-top').css('display', 'none');
                }
                if ( $(window).scrollTop() > timeT ) {
                    $('.time-bar').addClass('time-bar-fixed');
                } else {
                    $('.time-bar').removeClass('time-bar-fixed');
                }
            });
        },
        //初始化做题时间
        initStartTime      : function () {
            var _self = this;
            _self.STARTTIME = new Date().getTime();
            $.cookie('STARTTIME', _self.STARTTIME, {expires: _self.EXPIRES});
        },
        //随机获取题套id
        getRandomPaperId   : function (num) {
            return 'p' + parseInt(Math.random() * num + 1, 0);
        },
        //加载pandora
        loadPandora        : function (callback) {
            if ( !$.isPlainObject(window['pandora']) ) {
                var doc = document,
                    pandora = doc.createElement('script');
                pandora.type = 'text/javascript';
                pandora.async = true;
                pandora.src = 'http://ue.17173cdn.com/a/lib/pandora.js';

                pandora.onload = pandora.onreadystatechange = function () {
                    if ( pandora.readyState && pandora.readyState != 'loaded' && pandora.readyState != 'complete' ) return;
                    pandora.onreadystatechange = pandora.onload = null;
                    callback && $.isFunction(callback) && callback();
                };
                document.body.appendChild(pandora);

            } else {
                callback && $.isFunction(callback) && callback();
            }
        },
        //信息提示
        msgBox             : function (type, msgopts) {
            var _self = this;
            var _msg = msgopts;
            if ( !_msg ) {
                return;
            }
            _self.loadPandora(function () {
                pandora.use([type], function (type) {
                    new type({
                        //importStyle: true,
                        title  : _msg.title,
                        content: _msg.content,
                        width  : '550px'
                    });
                });
            });
        }
    };
    Answer.init();
    function Trim(str, is_global) {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g, '');
        if ( is_global.toLowerCase() == 'g' ) {
            result = result.replace(/\s/g, '');
        }
        return result;
    }

    Answer.loadPandora(function () {
        pandora.use(['floating'], function (Floating) {
            new Floating({
                contentWidth: 1000,
                element     : '#floating',
                vertical    : 'middle',
                horizontal  : 'right',
                offset      : {
                    x: 40,
                    y: 0
                }
            });
        });
    });
});
/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

/*
 json2.js
 2015-05-03
 Public Domain.
 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 See http://www.JSON.org/js.html
 This code should be minified before deployment.
 See http://javascript.crockford.com/jsmin.html
 USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 NOT CONTROL.
 This file creates a global JSON object containing two methods: stringify
 and parse. This file is provides the ES5 JSON capability to ES3 systems.
 If a project might run on IE8 or earlier, then this file should be included.
 This file does nothing on ES5 systems.
 JSON.stringify(value, replacer, space)
 value       any JavaScript value, usually an object or array.
 replacer    an optional parameter that determines how object
 values are stringified for objects. It can be a
 function or an array of strings.
 space       an optional parameter that specifies the indentation
 of nested structures. If it is omitted, the text will
 be packed without extra whitespace. If it is a number,
 it will specify the number of spaces to indent at each
 level. If it is a string (such as '\t' or '&nbsp;'),
 it contains the characters used to indent at each level.
 This method produces a JSON text from a JavaScript value.
 When an object value is found, if the object contains a toJSON
 method, its toJSON method will be called and the result will be
 stringified. A toJSON method does not serialize: it returns the
 value represented by the name/value pair that should be serialized,
 or undefined if nothing should be serialized. The toJSON method
 will be passed the key associated with the value, and this will be
 bound to the value
 For example, this would serialize Dates as ISO strings.
 Date.prototype.toJSON = function (key) {
 function f(n) {
 // Format integers to have at least two digits.
 return n < 10
 ? '0' + n
 : n;
 }
 return this.getUTCFullYear()   + '-' +
 f(this.getUTCMonth() + 1) + '-' +
 f(this.getUTCDate())      + 'T' +
 f(this.getUTCHours())     + ':' +
 f(this.getUTCMinutes())   + ':' +
 f(this.getUTCSeconds())   + 'Z';
 };
 You can provide an optional replacer method. It will be passed the
 key and value of each member, with this bound to the containing
 object. The value that is returned from your method will be
 serialized. If your method returns undefined, then the member will
 be excluded from the serialization.
 If the replacer parameter is an array of strings, then it will be
 used to select the members to be serialized. It filters the results
 such that only members with keys listed in the replacer array are
 stringified.
 Values that do not have JSON representations, such as undefined or
 functions, will not be serialized. Such values in objects will be
 dropped; in arrays they will be replaced with null. You can use
 a replacer function to replace those with JSON values.
 JSON.stringify(undefined) returns undefined.
 The optional space parameter produces a stringification of the
 value that is filled with line breaks and indentation to make it
 easier to read.
 If the space parameter is a non-empty string, then that string will
 be used for indentation. If the space parameter is a number, then
 the indentation will be that many spaces.
 Example:
 text = JSON.stringify(['e', {pluribus: 'unum'}]);
 // text is '["e",{"pluribus":"unum"}]'
 text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
 text = JSON.stringify([new Date()], function (key, value) {
 return this[key] instanceof Date
 ? 'Date(' + this[key] + ')'
 : value;
 });
 // text is '["Date(---current time---)"]'
 JSON.parse(text, reviver)
 This method parses a JSON text to produce an object or array.
 It can throw a SyntaxError exception.
 The optional reviver parameter is a function that can filter and
 transform the results. It receives each of the keys and values,
 and its return value is used instead of the original value.
 If it returns what it received, then the structure is not modified.
 If it returns undefined then the member is deleted.
 Example:
 // Parse the text. Values that look like ISO date strings will
 // be converted to Date objects.
 myData = JSON.parse(text, function (key, value) {
 var a;
 if (typeof value === 'string') {
 a =
 /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 if (a) {
 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 +a[5], +a[6]));
 }
 }
 return value;
 });
 myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 var d;
 if (typeof value === 'string' &&
 value.slice(0, 5) === 'Date(' &&
 value.slice(-1) === ')') {
 d = new Date(value.slice(5, -1));
 if (d) {
 return d;
 }
 }
 return value;
 });
 This is a reference implementation. You are free to copy, modify, or
 redistribute.
 */

/*jslint 
 eval, for, this
 */

/*property
 JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
 getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
 lastIndex, length, parse, prototype, push, replace, slice, stringify,
 test, toJSON, toString, valueOf
 */


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    var rx_one = /^[\],:{}\s]*$/,
        rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
        rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        rx_four = /(?:^|:|,)(?:\s*\[)+/g,
        rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? '0' + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + '-' +
            f(this.getUTCMonth() + 1) + '-' +
            f(this.getUTCDate()) + 'T' +
            f(this.getUTCHours()) + ':' +
            f(this.getUTCMinutes()) + ':' +
            f(this.getUTCSeconds()) + 'Z'
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap,
        indent,
        meta,
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? '"' + string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"'
            : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
            case 'string':
                return quote(value);

            case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

                return isFinite(value)
                    ? String(value)
                    : 'null';

            case 'boolean':
            case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

                return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

            case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

                if (!value) {
                    return 'null';
                }

// Make an array to hold the partial results of stringifying this object value.

                gap += indent;
                partial = [];

// Is the value an array?

                if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || 'null';
                    }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                    v = partial.length === 0
                        ? '[]'
                        : gap
                        ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                        : '[' + partial.join(',') + ']';
                    gap = mind;
                    return v;
                }

// If the replacer is an array, use it to select the members to be stringified.

                if (rep && typeof rep === 'object') {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === 'string') {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (
                                    gap
                                        ? ': '
                                        : ':'
                                ) + v);
                            }
                        }
                    }
                } else {

// Otherwise, iterate through all of the keys in the object.

                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (
                                    gap
                                        ? ': '
                                        : ':'
                                ) + v);
                            }
                        }
                    }
                }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

                v = partial.length === 0
                    ? '{}'
                    : gap
                    ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                    : '{' + partial.join(',') + '}';
                gap = mind;
                return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, '@')
                        .replace(rx_three, ']')
                        .replace(rx_four, '')
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
$('.form-radio-con .form-radio-txt').click(function(event) {
	$(this).parent().find('input').attr('checked','checked');
});

(function() {
    var winH = parseInt($(window).height());
    var layerH = parseInt($('.layer-side').height());
    var layerRef = parseInt($('.layer-ref').offset().top);
    var layerRefH = parseInt($('.layer-ref').height());
    var layerTop = parseInt($('.layer-side').position().top);
    var maxTop = layerRefH - layerH;
    var winScr = $(window).scrollTop();
    if (winScr >= layerRef) {
        var offsetTemp = winScr - layerRef + layerTop
        var offsetTop = offsetTemp;
    } else {
        var offsetTop = layerTop;
    }
    $('.layer-side').css('top', offsetTop + 'px');
    $(window).scroll(function() {
        var winScr = $(window).scrollTop();
        if (winScr >= layerTop) {
            var offsetTemp = winScr-45;
            var offsetTop = offsetTemp;
        } else {
            var offsetTop = layerTop;
        }
        $('.layer-side').css('top', offsetTop + 'px');
    });
})();
