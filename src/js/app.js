/**
 * Created by chenlonghui@cyou-inc.com on 2015/6/25.
 */
(function (W, undefined) {
    'use strict';
    /*
     * 制作人答题
     * */
    var Answer = {
        REMAINING_TIME     : $.cookie('REMAINING_TIME') - 0 || 30 * 60 * 1000,//剩余时间
        POST_URL           : 'http://act.17173.com/2015/05/yxhhr0709/index.php',//提交地址
        inter              : null,//定时器
        EXPIRES            : 1,//缓存过期时间
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
            var paperId = _self.getRandomPaperId(4);
            if ( $.cookie('REMAINING_TIME') && $.cookie('PAPERID') ) {
                $.cookie('NAME') && $('#name').val(decodeURI($.cookie('NAME')));
                $.cookie('PHONE') && $('#phone').val($.cookie('PHONE'));
                $.cookie('EMAIL') && $('#email').val($.cookie('EMAIL'));
                $.cookie('QQ') && $('#qq').val($.cookie('QQ'));
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
                W.onbeforeunload = function (e) {//关闭选项卡（含刷新）
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
            if ( name === '' || !/^([\u4e00-\u9fa5]){2,7}$/.test(name) ) {
                _self.msgBox('alert', {
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u59d3\u540d\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( phone === '' || !/^(13[0-9]|15[0|1|2|3|5|6|7|8|9]|18[0-9]|17[6|7|8])\d{8}$/.test(phone) ) {
                _self.msgBox('alert', {
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u624b\u673a\u53f7\u7801\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( email === '' || !/^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(email) ) {
                _self.msgBox('alert', {
                    title  : '抱歉！',
                    content: '\u8bf7\u8f93\u5165\u6b63\u786e\u90ae\u7bb1\uff01'
                });
                btn.on('click', function (e) {
                    _self.startListener(e, $(this));
                });
            }
            else if ( qq === '' || !/^\d{5,10}$/.test(qq) ) {
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
                $('html,body').animate({scrollTop: $('.time-bar').offset().top}, 500);
                _self.bindEvent(true);
                $.ajax({
                    url     : _self.POST_URL + '?do=updateUserInfo',
                    data    : {
                        name  : name,
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
                    $.cookie('NAME', encodeURI(name), {expires: _self.EXPIRES});
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
                    $('#qArea').show();//debug
                    _self.answerInfo.name = name;
                    _self.answerInfo.phone = phone;
                    _self.answerInfo.email = email;
                    _self.answerInfo.qq = qq;
                    $.cookie('NAME', encodeURI(name), {expires: _self.EXPIRES});
                    $.cookie('PHONE', phone, {expires: _self.EXPIRES});
                    $.cookie('EMAIL', email, {expires: _self.EXPIRES});
                    $.cookie('QQ', qq, {expires: _self.EXPIRES});
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
            console.dir($.cookie('ANSWERS'));
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
})(window, undefined);