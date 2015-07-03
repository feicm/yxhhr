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
