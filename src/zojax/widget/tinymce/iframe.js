$(document).ready(function(){
  if ($.browser.webkit)
    $('iframe').each(function(index){
        if($(this).attr('name').indexOf('http://fast.wistia.net/embed/iframe')>-1)
            $(this).attr('src', $(this).attr('name'))
    })
})
